
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  NavLink,
  useLocation,
  Navigate,
} from "react-router-dom";
import Star from "./Star";
import { db } from "./firebaseConfig.js";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import ReviewPage from "./ReviewPage";
import Post from "./Post.jsx";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx"; // Import the Dashboard component
import UserProfile from './UserProfile';
import { auth } from "./firebaseConfig.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { AuthContextProvider, useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import ContentModerationDashboard from "./ContentModerationDashboard";
import Communities from './Communities';


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
  <div className="mt-4 flex items-center space-x-4">
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search for a track..."
      className="p-3 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
    />
    <button
      onClick={handleSearch}
      className="px-5 py-3 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition transform hover:-translate-y-0.5 hover:shadow-lg"
    >
      Search
    </button>
  </div>
);

const TrackDropdown = ({ tracks, selectedTrack, handleTrackSelection }) => (
  <div className="dropdown-container mt-4">
    <select
      value={selectedTrack}
      onChange={handleTrackSelection}
      className="p-3 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
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
        className="w-48 h-48 object-cover rounded-lg shadow-2xl animate-fadeIn"
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
  <div className="text-6xl mt-4 flex space-x-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star 
        key={star} 
        filled={star <= (hoveredStar || rating)} 
        onClick={() => handleRating(star)}
        onMouseEnter={() => setHoveredStar(star)}
        onMouseLeave={() => setHoveredStar(0)}
        className="cursor-pointer transform transition-transform hover:scale-110"
      />
    ))}
  </div>
);

const Home = () => {
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
  const [hashtags, setHashtags] = useState([]);

  // Get the user's displayName
  const displayName = auth.currentUser
    ? auth.currentUser.displayName || auth.currentUser.email || 'Anonymous'
    : 'Anonymous';

  const handleRating = (rate) => {
    setRating(rate);
  };

  const extractHashtags = (text) => {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    console.log('Extracted hashtags from text:', matches); // Debug log
    return matches ? matches.map(tag => tag.replace('#', '')) : [];
  };

  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    if (newComment.length <= 280) {
      setComment(newComment);
      const extractedTags = extractHashtags(newComment);
      setHashtags(extractedTags);
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

    setIsLoading(true);
    try {
      const extractedHashtags = extractHashtags(comment);
      console.log('Hashtags to save:', extractedHashtags); // Debug log
      
      const docData = {
        rating: rating,
        comment: comment,
        track: selectedTrack,
        artist: selectedArtist,
        timestamp: new Date(),
        hashtags: extractedHashtags,
        uid: auth.currentUser.uid,
        displayName: displayName, // Include displayName in docData
        albumCover: albumCover, // Include albumCover URL
      };

      console.log('Saving document with hashtags:', docData); // Debug log
      await addDoc(collection(db, 'ratings'), docData);
      
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
      setRating(0);
      setComment('');
      setSelectedTrack('');
      setSelectedArtist('');
      setAlbumCover('');
      setHashtags([]);
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

  const HashtagPreview = () => (
    <div className="mt-2">
      {hashtags.map((tag, index) => (
        <span 
          key={index} 
          className="inline-block bg-blue-500 text-white rounded px-2 py-1 text-sm mr-2"
        >
          #{tag}
        </span>
      ))}
    </div>
  );

  return (
    <div className="App relative flex items-center justify-center min-h-screen flex-col w-full max-w-4xl mx-auto">
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

          <div className="mt-4 flex flex-col items-center">
            <textarea
              value={comment}
              onChange={handleCommentChange}
              placeholder="What's up with it? Up to 280 characters. Use #hashtags to add to communities!"
              className="p-3 w-full max-w-xl h-24 rounded-lg bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <HashtagPreview />

            <button
              onClick={handleSubmit}
              className={`mt-4 px-6 py-3 rounded-full shadow-md text-white transition transform hover:-translate-y-0.5 hover:shadow-lg ${
                isSubmitted ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner-border" role="status" aria-hidden="true"></span>
              ) : isSubmitted ? 'Posted!' : 'Post'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};


const App = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // Add this state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = doc(collection(db, 'users'), currentUser.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setIsAdmin(userData.type && userData.type.includes('admin')); // Set admin status
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContextProvider>
      <Router>
        <AppContent user={user} setUser={setUser} isAdmin={isAdmin} /> {/* Pass isAdmin */}
        <Routes>
          <Route
            path="/profile/:uid"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              isAdmin ? (
                <ProtectedRoute>
                  <ReviewPage />
                </ProtectedRoute>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/moderation-dashboard"
            element={
              isAdmin ? (
                <ProtectedRoute>
                  <ContentModerationDashboard />
                </ProtectedRoute>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/communities" element={<Communities />} />
        </Routes>
      </Router>
    </AuthContextProvider>
  );
};

const AppContent = ({ user, setUser, isAdmin }) => {
  const location = useLocation();
  const currentRoute = location.pathname;

  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      window.location.href = "/dashboard"; // Redirect to dashboard
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const isDashboard = currentRoute === "/dashboard";

  return (
    <div>
      {/* Navbar: Only visible if user is logged in and not on Dashboard */}
      {!isDashboard && user && (
        <nav className="bg-gray-800 p-4 flex items-center justify-between z-50 relative">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/dashboard">
              <img src="/tracklist.png" alt="Tracklist Logo" className="w-10 h-10 mr-4" />
            </NavLink>
          </div>
          {/* Centered Links */}
          <div className="flex-grow flex justify-center">
            <ul className="flex items-center space-x-6">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    isActive
                      ? "text-white px-4 py-2 bg-blue-700 rounded"
                      : "text-white px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                  }
                >
                  Rating
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/post"
                  className={({ isActive }) =>
                    isActive
                      ? "text-white px-4 py-2 bg-blue-700 rounded"
                      : "text-white px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                  }
                >
                  Post
                </NavLink>
              </li>
              {isAdmin && ( // Conditionally render admin tabs
                <>
                  <li>
                    <NavLink
                      to="/reviews"
                      className={({ isActive }) =>
                        isActive
                          ? "text-white px-4 py-2 bg-blue-700 rounded"
                          : "text-white px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                      }
                    >
                      Reviews
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/moderation-dashboard"
                      className={({ isActive }) =>
                        isActive
                          ? "text-white px-4 py-2 bg-blue-700 rounded"
                          : "text-white px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                      }
                    >
                      Moderation Dashboard
                    </NavLink>
                  </li>
                </>
              )}
              <li>
                <NavLink 
                  to="/communities" 
                  className={({ isActive }) => 
                    isActive 
                      ? "white-text px-4 py-2 bg-blue-700 rounded" 
                      : "white-text px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                  }>
                  Communities
                </NavLink>
              </li>
            </ul>
          </div>
          <div className="relative dropdown-container">
            {/* Display profile info */}
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 focus:outline-none"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span className="text-white font-medium">
                  {user?.email ? user.email : "Guest"}
                </span>
              )}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-50">
                <div className="p-4 border-b">
                  <p className="text-gray-800 font-medium">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div>
                  <button
                    onClick={() => window.location.href = `/profile/${user.uid}`}
                    className="w-full px-4 py-2 text-left text-blue-600 hover:bg-gray-100"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Routes */}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/post"
          element={
            <ProtectedRoute>
              <Post />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moderation-dashboard"
          element={
            <ProtectedRoute>
              <ContentModerationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communities"
          element={
            <ProtectedRoute>
              <Communities />
            </ProtectedRoute>
          }
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/communities" element={<Communities />} />
      </Routes>
    </div>
  );
};

export default App;