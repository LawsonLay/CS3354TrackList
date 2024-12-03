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
      <div className="flex flex-col items-center justify-start min-h-screen mt-8">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-32 w-32 mb-4"></div>
        <div className="text-4xl" style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="profile-container flex flex-col items-center justify-start min-h-screen" style={{ color: 'white' }}>
      <div className="flex items-center space-x-4 mt-8">
        <img src={photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'white' }}>{displayName}</h1>
          <p className="text-sm">{user.email}</p>
          <p className="text-sm">Followers: {followersCount}</p> {/* Display followers count */}
        </div>
      </div>
      <div className="mt-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'white' }}>Your Ratings</h2>
        {ratings.length === 0 ? (
          <p className="text-sm" style={{ color: 'white' }}>None found... Start now!</p>
        ) : (
          ratings.map((rating, index) => (
            // Add 'relative' to position the button absolutely within this container
            <div key={index} className="bg-gray-800 p-4 rounded-lg mb-4 relative">
              <h2 className="text-xl font-bold" style={{ color: 'white' }}>{rating.track} by {rating.artist}</h2>
              <p className="text-sm" style={{ color: 'white' }}>{rating.comment}</p>
              <p className="text-sm" style={{ color: 'white' }}>Rating: {rating.rating}</p>
              <p className="text-sm" style={{ color: 'white' }}>Hashtags: {rating.hashtags.join(', ')}</p>
              <p className="text-sm" style={{ color: 'white' }}>Date: {new Date(rating.timestamp.seconds * 1000).toLocaleDateString()}</p>
              <p className="text-sm" style={{ color: 'white' }}>Time: {new Date(rating.timestamp.seconds * 1000).toLocaleTimeString()}</p>
              <button 
                onClick={() => handleDeleteRating(rating.id)} 
                className="delete-button absolute bottom-2 right-2"
              >
                X
              </button>
            </div>
          ))
        )}
      </div>
      <div className="mt-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'white' }}>Your Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm" style={{ color: 'white' }}>None found... Start now!</p>
        ) : (
          posts.map((post, index) => (
            // Add 'relative' to position the button absolutely within this container
            <div key={index} className="bg-gray-800 p-4 rounded-lg mb-4 relative">
              <p className="text-sm break-words" style={{ color: 'white' }}>{post.text}</p>
              <p className="text-sm" style={{ color: 'white' }}>Likes: {post.likes || 0}</p>
              <p className="text-sm" style={{ color: 'white' }}>Date: {new Date(post.timestamp.seconds * 1000).toLocaleDateString()}</p>
              <p className="text-sm" style={{ color: 'white' }}>Time: {new Date(post.timestamp.seconds * 1000).toLocaleTimeString()}</p>
              <button 
                onClick={() => handleDeletePost(post.id)} 
                className="delete-button absolute bottom-2 right-2"
              >
                X
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserProfile;