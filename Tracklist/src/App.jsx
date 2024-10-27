import React, { useState, useEffect } from 'react';
import Star from './Star';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const fetchTracksFromLastFM = async (query) => {
  const url = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(query)}&api_key=${import.meta.env.VITE_LASTFM_API_KEY}&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch tracks from Last.fm');
  }
  const data = await response.json();
  return data.results.trackmatches.track;
};

const fetchAlbumCoverFromLastFM = async (artist, track) => {
  const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${import.meta.env.VITE_LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch album cover from Last.fm');
  }
  const data = await response.json();
  return data.track.album ? data.track.album.image[3]['#text'] : '';
};

const getTextColor = (backgroundColor) => {
  const rgb = backgroundColor.match(/\d+/g);
  if (!rgb) return 'white';
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.5 ? 'black' : 'white';
};

const SearchBar = ({ searchQuery, setSearchQuery, handleSearch }) => (
  <div className="mt-4">
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search for a track..."
      className="p-2 border rounded border-gray-300"
    />
    <button onClick={handleSearch} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover-darken">
      Search
    </button>
  </div>
);

const TrackDropdown = ({ tracks, selectedTrack, handleTrackSelection }) => (
  <div className="dropdown-container mt-4">
    <select
      value={selectedTrack}
      onChange={handleTrackSelection}
      className="p-2 border rounded border-gray-300 w-full max-w-md"
    >
      <option value="">Select a Track</option>
      {tracks.map((track) => (
        <option key={track.mbid || track.url} value={`${track.name} by ${track.artist}`}>
          {track.name} by {track.artist}
        </option>
      ))}
    </select>
  </div>
);

const AlbumCover = ({ albumCover, selectedTrack, selectedArtist, isAlbumCoverLoading, textColor }) => (
  <div className="album-cover-container mt-4 flex flex-col items-center">
    {isAlbumCoverLoading ? (
      <div className="album-cover-spinner" role="status"></div>
    ) : (
      <img 
        src={albumCover || '/noCover.png'} 
        alt="Album Cover" 
        className="w-48 h-48 object-cover rounded shadow-2xl" 
      />
    )}
    {selectedTrack && (
      <div className="mt-2 text-lg font-semibold text-center" style={{ color: textColor, textShadow: '4px 4px 8px rgba(0, 0, 0, 0.7)' }}>
        {selectedTrack}
        <div className="text-sm font-normal" style={{ color: textColor, textShadow: '4px 4px 8px rgba(0, 0, 0, 0.7)' }}>
          {selectedArtist}
        </div>
      </div>
    )}
  </div>
);

const StarRating = ({ rating, hoveredStar, handleRating, setHoveredStar }) => (
  <div className="text-6xl mt-4">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star 
        key={star} 
        filled={star <= rating} 
        hovered={star <= hoveredStar}
        onClick={() => handleRating(star)}
        onMouseEnter={() => setHoveredStar(star)}
        onMouseLeave={() => setHoveredStar(0)}
      />
    ))}
  </div>
);

/**
 * App component that allows users to search for tracks, select a track, rate it, and leave a comment.
 * 
 * @component
 * @example
 * return (
 *   <App />
 * )
 * 
 * @returns {JSX.Element} The rendered component.
 * 
 * @function
 * @name App
 * 
 * @description
 * This component manages the state and logic for searching tracks from Last.fm, selecting a track, 
 * fetching the album cover, rating the track, and submitting a comment. It includes various state 
 * variables to handle user interactions and API responses.
 * 
 * @state {number} rating - The current rating given by the user.
 * @state {number} hoveredStar - The star currently being hovered over for rating.
 * @state {string} comment - The user's comment about the track.
 * @state {string} selectedTrack - The track selected by the user.
 * @state {string} selectedArtist - The artist of the selected track.
 * @state {string} searchQuery - The search query entered by the user.
 * @state {Array} tracks - The list of tracks fetched from Last.fm based on the search query.
 * @state {string} albumCover - The URL of the album cover for the selected track.
 * @state {boolean} isSearchPerformed - Indicates if a search has been performed.
 * @state {boolean} isSubmitted - Indicates if the rating and comment have been submitted.
 * @state {boolean} isLoading - Indicates if the submission is in progress.
 * @state {boolean} isAlbumCoverVisible - Indicates if the album cover is visible.
 * @state {boolean} isAlbumCoverLoading - Indicates if the album cover is being loaded.
 * @state {Object} backgroundStyle - The style object for the background, including the album cover.
 * @state {string} textColor - The color of the text based on the background.
 * 
 * @function handleRating
 * @description Sets the rating given by the user.
 * @param {number} rate - The rating value.
 * 
 * @function handleCommentChange
 * @description Updates the comment state as the user types, ensuring it does not exceed 280 characters.
 * @param {Event} e - The input change event.
 * 
 * @function handleSearch
 * @description Fetches tracks from Last.fm based on the search query and updates the state.
 * 
 * @function handleTrackSelection
 * @description Handles the selection of a track, fetches the album cover, and updates the state.
 * @param {Event} e - The selection change event.
 * 
 * @function handleSubmit
 * @description Validates and submits the rating and comment to the database, then resets the state.
 * 
 * @returns {JSX.Element} The rendered component.
 */

function App() {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [albumCover, setAlbumCover] = useState(''); 
  const [isSearchPerformed, setIsSearchPerformed] = useState(false); 
  const [isSubmitted, setIsSubmitted] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 
  const [isAlbumCoverVisible, setIsAlbumCoverVisible] = useState(false);
  const [isAlbumCoverLoading, setIsAlbumCoverLoading] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState({ backgroundColor: '#1a1a1a' });
  const [textColor, setTextColor] = useState('white');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRating = (rate) => {
    setRating(rate);
  };

  const handleCommentChange = (e) => {
    if (e.target.value.length <= 280) {
      setComment(e.target.value);
    }
  };

  const handleSearch = async () => {
    try {
      const fetchedTracks = await fetchTracksFromLastFM(searchQuery);
      setTracks(fetchedTracks);
      setIsSearchPerformed(true); 
      setIsAlbumCoverVisible(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching tracks from Last.fm:', error);
      setErrorMessage('Failed to fetch tracks. Please try again later.');
    }
  };

  const handleTrackSelection = async (e) => {
    const trackInfo = e.target.value;
    setRating(0);
    const [trackName, artistName] = trackInfo.split(' by ');
    setSelectedTrack(trackName);
    setSelectedArtist(artistName);

    setAlbumCover('');
    setIsAlbumCoverLoading(true);
    
    try {
      const coverUrl = await fetchAlbumCoverFromLastFM(artistName, trackName);
      setAlbumCover(coverUrl);
      setIsAlbumCoverVisible(true);
      const backgroundColor = coverUrl ? '' : '#1a1a1a';
      setBackgroundStyle({
        backgroundImage: coverUrl ? `url(${coverUrl})` : '',
        backgroundColor: backgroundColor,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      });
      setTextColor(getTextColor(backgroundColor));
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching album cover:', error);
      setErrorMessage('Failed to fetch album cover. Please try again later.');
    } finally {
      setIsAlbumCoverLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTrack) {
      alert('Please select a track to rate.');
      return;
    }

    if (comment.length > 280) {
      alert('Comment exceeds the 280-character limit.');
      return;
    }

    setIsLoading(true);

    try {
      await addDoc(collection(db, 'ratings'), {
        rating: rating,
        comment: comment,
        track: selectedTrack,
        artist: selectedArtist,
        timestamp: new Date()
      });
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
      setRating(0);
      setComment('');
      setSelectedTrack('');
      setSelectedArtist('');
      setAlbumCover('');
      setBackgroundStyle({ backgroundColor: '#1a1a1a' });
      setTextColor('white');
      setErrorMessage('');
    } catch (e) {
      console.error('Error adding document:', e);
      setErrorMessage('Failed to submit rating. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App relative flex items-center justify-center h-screen flex-col w-full max-w-4xl mx-auto">
      <div className="background-blur" style={backgroundStyle}></div>
      
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />

      {errorMessage && (
        <div className="mt-4 text-red-500">
          {errorMessage}
        </div>
      )}

      {isSearchPerformed && (
        <TrackDropdown tracks={tracks} selectedTrack={selectedTrack} handleTrackSelection={handleTrackSelection} />
      )}

      {isAlbumCoverVisible && (
        <AlbumCover 
          albumCover={albumCover} 
          selectedTrack={selectedTrack} 
          selectedArtist={selectedArtist} 
          isAlbumCoverLoading={isAlbumCoverLoading} 
          textColor={textColor} 
        />
      )}

      {isSearchPerformed && (
        <>
          <StarRating 
            rating={rating} 
            hoveredStar={hoveredStar} 
            handleRating={handleRating} 
            setHoveredStar={setHoveredStar} 
          />

          <div className="mt-4 flex items-center space-x-4">
            <textarea
              value={comment}
              onChange={handleCommentChange}
              placeholder="What's up with it? Up to 280 characters."
              className="p-2 w-full max-w-xl h-24 border rounded border-gray-300"
              style={{ resize: 'none' }}
            />

            <button
              onClick={handleSubmit}
              className={`mt-4 px-4 py-2 rounded ${isSubmitted ? 'bg-green-500' : 'bg-blue-500'} text-white hover-darken`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : isSubmitted ? 'Posted!' : 'Post'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;