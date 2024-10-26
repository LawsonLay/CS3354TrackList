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

  const handleRating = (rate) => {
    setRating(rate);
  };

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  // Search Last.fm Database
  const handleSearch = async () => {
    try {
      const fetchedTracks = await fetchTracksFromLastFM(searchQuery);
      setTracks(fetchedTracks);
      setIsSearchPerformed(true); // Set search performed to true
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

    try {
      const coverUrl = await fetchAlbumCoverFromLastFM(artistName, trackName);
      setAlbumCover(coverUrl);
    } catch (error) {
      console.error('Error fetching album cover:', error);
    }
  };

  // Submit the rating, comment, and selected track to Firestore
  const handleSubmit = async () => {
    if (!selectedTrack) {
      alert('Please select a track to rate.');
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
    } catch (e) {
      console.error('Error adding document:', e);
      alert('Failed to submit rating and comment.');
    } finally {
      setIsLoading(false); // Set loading status to false
    }
  };

  return (
    <div className="App flex items-center justify-center h-screen bg-gray-100 flex-col">
      
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
            <option value="">Select a track...</option>
            {tracks.map((track) => (
              <option key={track.mbid || track.url} value={`${track.name} by ${track.artist}`}>
                {track.name} by {track.artist}
              </option>
            ))}
          </select>
        </div>
      )}


      {/* Album Cover Display */}
        <div className="album-cover-container mt-4 flex flex-col items-center">
          <img 
            src={albumCover || '/noCover.png'} 
            alt="Album Cover" 
            className="w-48 h-48 object-cover rounded" 
          />
          {selectedTrack && (
            <div className="mt-2 text-lg font-semibold text-center">
              {selectedTrack}
              <div className="text-sm font-normal text-gray-600">
                {selectedArtist}
              </div>
            </div>
          )}
        </div>

      {/* Star Rating */}
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



      {/* Textbox for comments */}
      <textarea
        value={comment}
        onChange={handleCommentChange}
        placeholder="Leave a comment..."
        className="mt-4 p-2 w-full max-w-md h-24 border rounded border-gray-300"
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className={`mt-4 px-4 py-2 rounded ${isSubmitted ? 'bg-green-500' : 'bg-blue-500'} text-white hover-darken`}
        disabled={isLoading} // Disable button while loading
      >
        {isLoading ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ) : isSubmitted ? 'Submitted!' : 'Submit Rating & Comment'}
      </button>
    </div>
  );
}

export default App;
