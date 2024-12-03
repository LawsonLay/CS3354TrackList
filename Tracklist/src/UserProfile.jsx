import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useAuth } from "./AuthContext"; 

const UserProfile = () => {
  const { uid } = useParams();
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);

  const displayName = user.displayName || "Anonymous";
  const photoURL = user.photoURL || "/tracklist.png";

  useEffect(() => {
    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setFollowersCount(userDoc.data().followers?.length || 0); // Set followers count
      } else {
        console.log('No such user!');
      }
    };

    const fetchUserRatings = async () => {
      try {
        const ratingsQuery = query(
          collection(db, 'ratings'),
          where('uid', '==', uid),
          orderBy('timestamp', 'asc')
        );
        const querySnapshot = await getDocs(ratingsQuery);
        const ratingsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRatings(ratingsList);
        console.log('Ratings fetched successfully:', ratingsList);
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    };

    const fetchUserPosts = async () => {
      try {
        const postsQuery = query(
          collection(db, 'UserData'),
          where('uid', '==', uid),
          orderBy('timestamp', 'asc')
        );
        const querySnapshot = await getDocs(postsQuery);
        const postsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPosts(postsList);
        console.log('Posts fetched successfully:', postsList);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    fetchUserData();
    fetchUserRatings();
    fetchUserPosts();
  }, [uid]);

  const handleDeleteRating = async (ratingId) => {
    if (window.confirm('Are you sure you want to delete this rating?')) {
      try {
        await deleteDoc(doc(db, 'ratings', ratingId));
        setRatings(ratings.filter(rating => rating.id !== ratingId));
      } catch (error) {
        console.error('Error deleting rating:', error);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'UserData', postId));
        setPosts(posts.filter(post => post.id !== postId));
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-start min-h-screen mt-8 bg-light-primary dark:bg-gray-900">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 dark:border-gray-700 h-32 w-32 mb-4"></div>
        <div className="text-4xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-container flex flex-col items-center justify-start min-h-screen bg-light-primary dark:bg-gray-900">
      <div className="flex items-center space-x-4 mt-8 p-4 bg-light-surface dark:bg-gray-800 rounded-lg shadow-soft">
        <img src={photoURL} alt="Profile" className="w-16 h-16 rounded-full shadow-lg" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{displayName}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Followers: {followersCount}</p>
        </div>
      </div>
      <div className="mt-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Ratings</h2>
        {ratings.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">None found... Start now!</p>
        ) : (
          ratings.map((rating, index) => (
            <div key={index} className="bg-light-surface dark:bg-gray-800 p-4 rounded-lg mb-4 relative shadow-card hover:shadow-soft transition-shadow duration-300">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{rating.track} by {rating.artist}</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">{rating.comment}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rating: {rating.rating}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hashtags: {rating.hashtags.join(', ')}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date: {new Date(rating.timestamp.seconds * 1000).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time: {new Date(rating.timestamp.seconds * 1000).toLocaleTimeString()}</p>
              <button 
                onClick={() => handleDeleteRating(rating.id)} 
                className="absolute bottom-2 right-2 p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
      <div className="mt-8 w-full max-w-2xl mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Your Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">None found... Start now!</p>
        ) : (
          posts.map((post, index) => (
            <div key={index} className="bg-light-surface dark:bg-gray-800 p-4 rounded-lg mb-4 relative shadow-card hover:shadow-soft transition-shadow duration-300">
              <p className="text-sm break-words text-gray-700 dark:text-gray-300">{post.text}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Likes: {post.likes || 0}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date: {new Date(post.timestamp.seconds * 1000).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time: {new Date(post.timestamp.seconds * 1000).toLocaleTimeString()}</p>
              <button 
                onClick={() => handleDeletePost(post.id)} 
                className="absolute bottom-2 right-2 p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserProfile;