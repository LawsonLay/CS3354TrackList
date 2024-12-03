import React, { useState, useEffect } from 'react';
import { db } from './firebaseConfig';
import { collection, query, getDocs, orderBy, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { getAuth } from 'firebase/auth';

const Communities = () => {
  const [communities, setCommunities] = useState({});
  const [followedTags, setFollowedTags] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    fetchPostsByHashtags();
    if (user) {
      fetchUserFollowedTags();
    }
  }, [user]);

  const fetchUserFollowedTags = async () => {
    if (!user) return;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      setFollowedTags(userDoc.data().followedTags || []);
    }
  };

  const handleFollowTag = async (tag) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    const isFollowing = userData.followedTags?.includes(tag);

    try {
      if (isFollowing) {
        await updateDoc(userRef, {
          followedTags: arrayRemove(tag)
        });
        setFollowedTags(prev => prev.filter(t => t !== tag));
      } else {
        await updateDoc(userRef, {
          followedTags: arrayUnion(tag)
        });
        setFollowedTags(prev => [...prev, tag]);
      }
    } catch (error) {
      console.error('Error updating followed tags:', error);
    }
  };

  const fetchPostsByHashtags = async () => {
    const postsRef = collection(db, 'ratings');
    const q = query(postsRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    
    console.log('Total documents:', querySnapshot.size);

    const hashtagPosts = {};
    querySnapshot.forEach((doc) => {
      const post = doc.data();
      console.log('Processing post:', post);
      
      // Ensure hashtags exist and are in the correct format
      const hashtags = post.hashtags || [];
      console.log('Found hashtags:', hashtags);
      
      if (hashtags.length > 0) {
        hashtags.forEach((tag) => {
          // Remove # if it exists and convert to lowercase
          const cleanTag = tag.replace(/^#/, '').toLowerCase();
          if (!hashtagPosts[cleanTag]) {
            hashtagPosts[cleanTag] = [];
          }
          hashtagPosts[cleanTag].push({ 
            id: doc.id, 
            ...post,
            timestamp: post.timestamp.toDate()
          });
        });
      }
    });
    
    console.log('Processed hashtags:', hashtagPosts);
    setCommunities(hashtagPosts);
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-white">Communities</h1>
      {Object.keys(communities).length === 0 ? (
        <p className="text-white">No communities found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(communities).map(([hashtag, posts]) => (
            <div key={hashtag} className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-400">#{hashtag}</h2>
                {user && (
                  <button
                    onClick={() => handleFollowTag(hashtag)}
                    className={`px-2 py-1 ${followedTags.includes(hashtag) ? 'bg-blue-700' : 'bg-blue-500'} text-white font-semibold rounded`}
                  >
                    {followedTags.includes(hashtag) ? '✅' : '👀'}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">{post.track}</h3>
                      <span className="text-yellow-400">★ {post.rating}/5</span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">by {post.artist}</p>
                    <p className="text-gray-300">{post.comment}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {format(post.timestamp, 'PPpp')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Communities;
