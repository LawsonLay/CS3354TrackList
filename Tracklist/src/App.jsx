import React, { useState } from 'react';
import Star from './Star';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

const LASTFM_API_KEY = 'bb9102767ef053cefc5e9df257ca8087';

// Fetch tracks from Last.fm API
const fetchTracksFromLastFM = async (query) => {
  const url = `http://ws.audioscrobbler.com/2.0/?method=track.search&track=${query}&api_key=${LASTFM_API_KEY}&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results.trackmatches.track; // Return the array of tracks
};

// Fetch album cover image from Last.fm API
const fetchAlbumCoverFromLastFM = async (artist, track) => {
  const url = `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${artist}&track=${track}&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data.track.album ? data.track.album.image[3]['#text'] : ''; // Get the largest image available
};

// Function to calculate luminance and determine text color
const getTextColor = (backgroundColor) => {
  const rgb = backgroundColor.match(/\d+/g);
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.5 ? 'black' : 'white';
};

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

  const handleRating = (rate) => {
    setRating(rate);
  };

  const handleCommentChange = (e) => {
    if (e.target.value.length <= 280) {
      setComment(e.target.value);
    }
  };

  // Search Last.fm Database
  const handleSearch = async () => {
    try {
      const fetchedTracks = await fetchTracksFromLastFM(searchQuery);
      setTracks(fetchedTracks);
      setIsSearchPerformed(true); 
      setIsAlbumCoverVisible(false);
    } catch (error) {
      console.error('Error fetching tracks from Last.fm:', error);
    }
  };

  // Handle track selection and fetch album cover
  const handleTrackSelection = async (e) => {
    const trackInfo = e.target.value;
    setRating(0); // Reset rating when a new track is selected
    const [trackName, artistName] = trackInfo.split(' by ');
    setSelectedTrack(trackName);
    setSelectedArtist(artistName);

    setAlbumCover(''); // Clear album cover when a new track is selected
    setIsAlbumCoverLoading(true);
    
    try {
      const coverUrl = await fetchAlbumCoverFromLastFM(artistName, trackName);
      setAlbumCover(coverUrl);
      setIsAlbumCoverVisible(true);
      const backgroundColor = coverUrl ? '' : '#1a1a1a';
      setBackgroundStyle({
        backgroundImage: coverUrl ? `url(${coverUrl})` : '',
        backgroundColor: backgroundColor,
        backgroundSize: 'cover', // Ensure the background image stretches to cover the container
        backgroundPosition: 'center', // Center the background image
      });
      setTextColor(getTextColor(backgroundColor));
    } catch (error) {
      console.error('Error fetching album cover:', error);
    } finally {
      setIsAlbumCoverLoading(false);
    }
  };

  // Submit the rating, comment, and selected track to Firestore
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
      setIsSubmitted(true); // Set submission status to true
      setTimeout(() => setIsSubmitted(false), 3000);
      setRating(0);
      setComment('');
      setSelectedTrack('');
      setSelectedArtist('');
      setAlbumCover(''); // Clear album cover after submission
      setBackgroundStyle({ backgroundColor: '#1a1a1a' }); // Reset background
      setTextColor('white'); // Reset text color
    } catch (e) {
      console.error('Error adding document:', e);
      alert('Failed to submit rating and comment.');
    } finally {
      setIsLoading(false); // Set loading status to false
    }
  };

  return (
    <div className="App relative flex items-center justify-center h-screen flex-col w-full max-w-4xl mx-auto">
      <div className="background-blur" style={backgroundStyle}></div>
      
      {/* Search bar for Last.fm tracks */}
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

      {/* Conditionally render the dropdown for track selection */}
      {/* Dropdown for track selection */}
      {isSearchPerformed && ( 
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
      )}


      {/* Album Cover Display */}
      {isAlbumCoverVisible && (
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
            <div className="mt-2 text-lg font-semibold text-center" style={{ color: textColor, textShadow: '4px 4px 8px rgba(0, 0, 0, 0.7)'  }}>
              {selectedTrack}
              <div className="text-sm font-normal" style={{ color: textColor, textShadow: '4px 4px 8px rgba(0, 0, 0, 0.7)'  }}>
                {selectedArtist}
              </div>
            </div>
          )}
        </div>
      )}


      {/* Star Rating */}
      {isSearchPerformed && (
        <>
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

    {/* Container for comments and submit button */}
    <div className="mt-4 flex items-center space-x-4">

      {/* Textbox for comments */}
      <textarea
        value={comment}
        onChange={handleCommentChange}
        placeholder="What's up with it? Up to 280 characters."
        className="p-2 w-full max-w-xl h-24 border rounded border-gray-300"
        style={{ resize: 'none' }}
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className={`mt-4 px-4 py-2 rounded ${isSubmitted ? 'bg-green-500' : 'bg-blue-500'} text-white hover-darken`}
        disabled={isLoading} // Disable button while loading
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