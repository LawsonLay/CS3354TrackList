import React, { useState } from 'react';
import Star from './Star';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

// Replace with your Last.fm API key
const LASTFM_API_KEY = 'bb9102767ef053cefc5e9df257ca8087';

// Function to fetch tracks from Last.fm API
const fetchTracksFromLastFM = async (query) => {
  const url = `http://ws.audioscrobbler.com/2.0/?method=track.search&track=${query}&api_key=${LASTFM_API_KEY}&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results.trackmatches.track; // Return the array of tracks
};

// Function to fetch album cover image from Last.fm API
const fetchAlbumCoverFromLastFM = async (artist, track) => {
  const url = `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${artist}&track=${track}&format=json`;
  const response = await fetch(url);
  const data = await response.json();
  return data.track.album ? data.track.album.image[3]['#text'] : ''; // Get the largest image available
};

function App() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [albumCover, setAlbumCover] = useState(''); // State to hold album cover URL

  // Handle Star Rating
  const handleRating = (rate) => {
    setRating(rate);
  };

  // Handle the comment input
  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  // Fetch Tracks from Last.fm API
  const handleSearch = async () => {
    try {
      const fetchedTracks = await fetchTracksFromLastFM(searchQuery);
      setTracks(fetchedTracks);
    } catch (error) {
      console.error('Error fetching tracks from Last.fm:', error);
    }
  };

  // Handle track selection and fetch album cover
  const handleTrackSelection = async (e) => {
    const trackInfo = e.target.value;
    const [trackName, artistName] = trackInfo.split(' by ');
    setSelectedTrack(trackName);

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

    try {
      await addDoc(collection(db, 'ratings'), {
        rating: rating,
        comment: comment,
        track: selectedTrack,
        albumCover: albumCover,
        timestamp: new Date()
      });
      alert('Rating and comment submitted successfully!');
      setRating(0);
      setComment('');
      setSelectedTrack('');
      setAlbumCover(''); // Clear album cover after submission
    } catch (e) {
      console.error('Error adding document:', e);
      alert('Failed to submit rating and comment.');
    }
  };

  return (
    <div className="App flex items-center justify-center h-screen bg-gray-100 flex-col">
      
      {/* Album Cover Display */}
      {albumCover && (
        <div className="mt-4">
          <img src={albumCover} alt="Album Cover" className="w-48 h-48 object-cover rounded" />
        </div>
      )}

      {/* Star Rating */}
      <div className="text-6xl mt-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} filled={star <= rating} onClick={() => handleRating(star)} />
        ))}
      </div>

      {/* Search bar for Last.fm tracks */}
      <div className="mt-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a track..."
          className="p-2 border rounded border-gray-300"
        />
        <button onClick={handleSearch} className="ml-2 px-4 py-2 bg-blue-500 text-white rounded">
          Search
        </button>
      </div>

      {/* Dropdown for track selection */}
      <div className="mt-4">
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

      {/* Textbox for comments */}
      <textarea
        value={comment}
        onChange={handleCommentChange}
        placeholder="Leave a comment..."
        className="mt-4 p-2 w-full max-w-md h-24 border rounded border-gray-300"
      />

      {/* Submit Button */}
      <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Submit Rating & Comment
      </button>
    </div>
  );
}

export default App;
