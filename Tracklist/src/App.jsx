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
import { collection, addDoc, doc, getDoc, query, where, getDocs, deleteDoc } from "firebase/firestore";
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
import { TransitionGroup, CSSTransition } from 'react-transition-group';



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
  <div className="mt-4 fade-in flex justify-center">
    <div className="flex items-center">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search for a track..."
        className="p-4 w-64 bg-light-surface dark:bg-gray-800 border-light-tertiary dark:border-gray-700 shadow-sm focus:shadow-md transition-all duration-300 rounded-lg text-gray-700 dark:text-gray-200"
      />
      <button 
        onClick={handleSearch} 
        className="ml-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
      >
        Search
      </button>
    </div>
  </div>
);

const TrackDropdown = ({ tracks, selectedTrack, handleTrackSelection }) => (
  <div className="dropdown-container mt-4 slide-up w-full flex justify-center">
    <select
      value={selectedTrack}
      onChange={handleTrackSelection}
      className="p-4 w-full max-w-md bg-light-surface dark:bg-gray-800 border-light-tertiary dark:border-gray-700 shadow-sm focus:shadow-md transition-all duration-300 rounded-lg text-gray-700 dark:text-gray-200"
    >
      <option value="" className="dark:bg-gray-800 dark:text-gray-200">Select a Track</option>
      {tracks.map((track) => (
        <option 
          key={track.mbid || track.url} 
          value={`${track.name} by ${track.artist}`}
          className="dark:bg-gray-800 dark:text-gray-200"
        >
          {track.name} by {track.artist}
        </option>
      ))}
    </select>
  </div>
);

const AlbumCover = ({ albumCover, selectedTrack, selectedArtist, isAlbumCoverLoading, textColor }) => (
  <div className="album-cover-container mt-8 flex flex-col items-center scale-in">
    {isAlbumCoverLoading ? (
      <div className="album-cover-spinner" role="status"></div>
    ) : (
      <div className="relative group">
        <img 
          src={albumCover || '/noCover.png'} 
          alt="Album Cover" 
          className="w-48 h-48 object-cover rounded-lg shadow-2xl hover-transform transition-transform duration-300 ease-in-out" 
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg" />
      </div>
    )}
    {selectedTrack && (
      <div className="mt-4 text-lg font-semibold text-center" 
           style={{ color: textColor, textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
        <div className="text-xl mb-1">{selectedTrack}</div>
        <div className="text-sm opacity-90">{selectedArtist}</div>
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
  const [backgroundStyle, setBackgroundStyle] = useState({ backgroundColor: 'rgb(17 24 39)' }); // Updated initial color
  const [textColor, setTextColor] = useState('white');
  const [errorMessage, setErrorMessage] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [isClosing, setIsClosing] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [isDustifying, setIsDustifying] = useState(false);
  const [isFormResetting, setIsFormResetting] = useState(false);

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
      setBackgroundStyle({
        backgroundImage: coverUrl ? `url(${coverUrl})` : 'none',
        backgroundColor: 'var(--blur-bg-color)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      });
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching album cover:', error);
      setErrorMessage('Failed to fetch album cover. Please try again later.');
    } finally {
      setIsAlbumCoverLoading(false);
    }
  };

  const resetForm = () => {
    setIsDustifying(true);
    setIsFormResetting(true);
    
    // First, hide the form elements while keeping the background
    setTimeout(() => {
      setIsSearchPerformed(false);
      setIsAlbumCoverVisible(false);
    }, 100);

    // Then, start the background dust effect and complete reset
    setTimeout(() => {
      setRating(0);
      setComment('');
      setSelectedTrack('');
      setSelectedArtist('');
      setAlbumCover('');
      setHashtags([]);
      setBackgroundStyle({
        backgroundImage: 'none',
        backgroundColor: 'var(--blur-bg-color)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      });
      setIsDustifying(false);
      setIsFormResetting(false);
    }, 1500);
  }; // Added missing closing brace

  const checkExistingRating = async (trackName, artistName, userId) => {
    const ratingsRef = collection(db, "ratings");
    const q = query(
      ratingsRef,
      where("uid", "==", userId),
      where("track", "==", trackName),
      where("artist", "==", artistName)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  };

  const ReplaceRatingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          You've already rated this song
        </h3>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          Your previous rating: {existingRating?.rating} stars
          <br />
          Previous comment: {existingRating?.comment}
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowReplaceModal(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleReplaceRating}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Replace Rating
          </button>
        </div>
      </div>
    </div>
  );

  const handleReplaceRating = async () => {
    if (existingRating?.id) {
      try {
        await deleteDoc(doc(db, "ratings", existingRating.id));
        await submitRating();
        setShowReplaceModal(false);
      } catch (error) {
        console.error("Error replacing rating:", error);
        setErrorMessage("Failed to replace rating. Please try again.");
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedTrack) {
      alert('Please select a track to rate.');
      return;
    }

    try {
      const existing = await checkExistingRating(selectedTrack, selectedArtist, auth.currentUser.uid);
      
      if (existing) {
        setExistingRating(existing);
        setShowReplaceModal(true);
        return;
      }

      await submitRating();
    } catch (error) {
      console.error("Error during submission:", error);
      setErrorMessage("Failed to submit rating. Please try again.");
    }
  };

  const submitRating = async () => {
    setIsLoading(true);
    try {
      const extractedHashtags = extractHashtags(comment);
      
      const docData = {
        rating: rating,
        comment: comment,
        track: selectedTrack,
        artist: selectedArtist,
        timestamp: new Date(),
        hashtags: extractedHashtags,
        uid: auth.currentUser.uid,
        displayName: displayName,
        albumCover: albumCover,
      };

      await addDoc(collection(db, 'ratings'), docData);
      
      setIsSubmitted(true);
      setIsClosing(true);
      
      setTimeout(() => {
        resetForm();
        setIsClosing(false);
        setIsSubmitted(false);
      }, 1500);

    } catch (error) {
      throw error;
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
    <div className="App relative flex items-center justify-center min-h-screen flex-col w-full max-w-4xl mx-auto p-8">
      <div className={`background-blur ${isDustifying ? 'dust-effect' : ''}`} style={{
        ...backgroundStyle,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}></div>
      
      <div className={`glass-effect p-8 rounded-xl w-full max-w-2xl relative z-10 flex flex-col items-center
        ${isSubmitted ? 'success-pulse' : ''}`}>
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearch={handleSearch} />

        {errorMessage && (
          <div className="mt-4 text-red-500 text-center">
            {errorMessage}
          </div>
        )}

        {isSearchPerformed && !isClosing && !isFormResetting && (
          <div className={`w-full flex flex-col items-center ${isClosing ? 'slide-out-top' : 'slide-up'}`}>
            <TrackDropdown tracks={tracks} selectedTrack={selectedTrack} handleTrackSelection={handleTrackSelection} />

            {isAlbumCoverVisible && (
              <AlbumCover 
                albumCover={albumCover} 
                selectedTrack={selectedTrack} 
                selectedArtist={selectedArtist} 
                isAlbumCoverLoading={isAlbumCoverLoading} 
                textColor={textColor} 
              />
            )}

            <StarRating 
              rating={rating} 
              hoveredStar={hoveredStar} 
              handleRating={handleRating} 
              setHoveredStar={setHoveredStar} 
            />

            <div className="mt-4 flex flex-col items-center w-full">
              <textarea
                value={comment}
                onChange={handleCommentChange}
                placeholder="What's up with it? Up to 280 characters. Use #hashtags to add to communities!"
                className="p-4 w-full max-w-xl h-24 bg-light-surface dark:bg-gray-800 border-light-tertiary dark:border-gray-700 shadow-sm focus:shadow-md transition-all duration-300 rounded-lg text-gray-700 dark:text-gray-200"
                style={{ resize: 'none' }}
              />
              <HashtagPreview />

              <button
                onClick={handleSubmit}
                className={`mt-4 px-6 py-3 rounded-lg ${isSubmitted ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'} text-white hover-transform`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                ) : isSubmitted ? 'Posted!' : 'Post'}
              </button>
            </div>
          </div>
        )}
      </div>
      {showReplaceModal && <ReplaceRatingModal />}
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
        <AppContent user={user} setUser={setUser} isAdmin={isAdmin} />
      </Router>
    </AuthContextProvider>
  );
};

const PageTransitionWrapper = ({ children }) => {
  const location = useLocation();
  return (
    <TransitionGroup>
      <CSSTransition
        key={location.key}
        timeout={200}
        classNames="page-transition"
        unmountOnExit
      >
        <div className="page">
          {children}
        </div>
      </CSSTransition>
    </TransitionGroup>
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
        <nav className="bg-white dark:bg-gray-800 p-4 flex items-center justify-between z-50 relative font-sans font-bold">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/dashboard">
              <img src="/tracklist.png" alt="Tracklist Logo" className="w-10 h-10 mr-4 logo-spin" />
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
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-800 dark:text-gray-200 hover:text-blue-500"
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
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-800 dark:text-gray-200 hover:text-blue-500"
                  }
                >
                  Post
                </NavLink>
              </li>
              {isAdmin && (
                <>
                  <li>
                    <NavLink
                      to="/reviews"
                      className={({ isActive }) =>
                        isActive
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-gray-800 dark:text-gray-200 hover:text-blue-500"
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
                          ? "text-blue-500 dark:text-blue-400"
                          : "text-gray-800 dark:text-gray-200 hover:text-blue-500"
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
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-800 dark:text-gray-200 hover:text-blue-500"
                  }
                >
                  Communities
                </NavLink>
              </li>
            </ul>
          </div>
          <div className="relative dropdown-container">
            {/* Display profile info */}
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-500 focus:outline-none"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <span className="font-medium">
                  {user?.email ? user.email : "Guest"}
                </span>
              )}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded shadow-lg z-50">
                <div className="p-4 border-b dark:border-gray-600">
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {user?.displayName || "User"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user?.email}</p>
                </div>
                <div>
                  <button
                    onClick={() => window.location.href = `/profile/${user.uid}`}
                    className="w-full px-4 py-2 text-left text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
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
      <PageTransitionWrapper>
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
        </Routes>
      </PageTransitionWrapper>
    </div>
  );
};

export default App;