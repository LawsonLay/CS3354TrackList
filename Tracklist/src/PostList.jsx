import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, increment, collection, onSnapshot, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Adjust the path to your Firebase config
import { getAuth } from 'firebase/auth'; // Import Firebase Auth
import Star from './Star'; // Import the Star component

function PostList({ blockedTerms, selectedFeed }) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [commentText, setCommentText] = useState({}); // Tracks input for comments for each post
  const [ratingCommentText, setRatingCommentText] = useState({}); // Tracks input for comments for each rating

  const auth = getAuth();
  const user = auth.currentUser;
  const displayName = user ? (user.displayName || user.email) : 'Anonymous';
  const uid = user ? user.uid : null;

  // Define getTimestampInMillis outside of useEffect
  const getTimestampInMillis = (item) => {
    if (item.timestamp instanceof Date) {
      return item.timestamp.getTime();
    } else if (item.timestamp && item.timestamp.seconds !== undefined) {
      return item.timestamp.seconds * 1000 + Math.floor(item.timestamp.nanoseconds / 1000000);
    } else if (item.timestamp && item.timestamp.toDate) {
      return item.timestamp.toDate().getTime();
    } else {
      return 0;
    }
  };

  // Replace combined with separate state variables
  const [userPosts, setUserPosts] = useState([]);
  const [ratingPosts, setRatingPosts] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch posts in real-time from both collections
  useEffect(() => {
    const userDataRef = collection(db, "UserData");
    const ratingsRef = collection(db, "ratings");

    // Fetch posts from "UserData"
    const unsubscribeUserData = onSnapshot(userDataRef, (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({ id: doc.id, type: 'post', ...doc.data() }));
      setUserPosts(posts);
    });

    // Fetch ratings from "ratings"
    const unsubscribeRatings = onSnapshot(ratingsRef, (snapshot) => {
      const ratings = snapshot.docs.map((doc) => ({ id: doc.id, type: 'rating', ...doc.data() }));
      setRatingPosts(ratings);
    });

    return () => {
      unsubscribeUserData();
      unsubscribeRatings();
    };
  }, []); // Empty dependency array to set up listeners once

  // Fetch users in real-time
  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    });

    return () => {
      unsubscribeUsers();
    };
  }, []);

  // Combine and sort posts and ratings when data changes
  useEffect(() => {
    const combinedArray = [...userPosts, ...ratingPosts].map(item => {
      const user = users.find(u => u.id === item.uid);
      return { ...item, followers: user?.followers || [] };
    });

    let filtered = combinedArray.filter((item) => {
      const textToCheck = item.type === 'post' ? item.text : item.comment;
      return !blockedTerms.some((term) => textToCheck.toLowerCase().includes(term));
    });

    // Enhanced curated feed filtering
    if (selectedFeed === 'curated' && uid) {
      const currentUser = users.find(u => u.id === uid);
      const following = currentUser?.following || [];
      const followedTags = currentUser?.followedTags || [];

      // Get current user's rated songs
      const userRatings = ratingPosts.filter(rating => rating.uid === uid);
      
      // Get all ratings that match user's rated songs
      const matchingSongRatings = ratingPosts.filter(rating => {
        return userRatings.some(userRating => 
          userRating.artist.toLowerCase() === rating.artist.toLowerCase() &&
          userRating.track.toLowerCase() === rating.track.toLowerCase() &&
          userRating.uid !== rating.uid
        );
      });

      // Get posts from followed hashtags
      const hasFollowedTag = (item) => {
        if (!item.hashtags) return false;
        return item.hashtags.some(tag => 
          followedTags.includes(tag.replace(/^#/, '').toLowerCase())
        );
      };

      // Get posts from the last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const recentPosts = combinedArray.filter(item => {
        const postTime = getTimestampInMillis(item);
        return postTime >= oneDayAgo.getTime();
      });

      // Find top liked posts
      let maxLikes = 0;
      recentPosts.forEach(post => {
        if ((post.likes || 0) > maxLikes) {
          maxLikes = post.likes || 0;
        }
      });

      const topLikedPosts = recentPosts.filter(post => (post.likes || 0) === maxLikes && maxLikes > 0);

      // Combine all filtered content
      filtered = filtered.filter(item => 
        following.includes(item.uid) || // Include followed users' posts
        matchingSongRatings.some(rating => rating.id === item.id) || // Include matching song ratings
        topLikedPosts.some(post => post.id === item.id) || // Include highest liked posts
        hasFollowedTag(item) // Include posts with followed hashtags
      );
    }

    // Sort by timestamp in descending order
    filtered.sort((a, b) => {
      const timeA = getTimestampInMillis(a);
      const timeB = getTimestampInMillis(b);
      return timeB - timeA;
    });

    setFilteredPosts(filtered);
  }, [userPosts, ratingPosts, users, blockedTerms, selectedFeed, uid]);

  const handleLike = async (postId, likedBy) => {
    if (!uid) return;
    
    const hasLiked = likedBy?.includes(uid);
    
    try {
      const postRef = doc(db, "UserData", postId);
      if (hasLiked) {
        // Unlike the post
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(uid),
        });
      } else {
        // Like the post
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(uid),
        });
      }
    } catch (error) {
      console.error("Error updating like status:", error);
    }
  };

  const handleLikeRating = async (ratingId, likedBy) => {
    if (!uid) return;
    
    const hasLiked = likedBy?.includes(uid);
    
    try {
      const ratingRef = doc(db, "ratings", ratingId);
      if (hasLiked) {
        // Unlike the rating
        await updateDoc(ratingRef, {
          likes: increment(-1),
          likedBy: arrayRemove(uid),
        });
      } else {
        // Like the rating
        await updateDoc(ratingRef, {
          likes: increment(1),
          likedBy: arrayUnion(uid),
        });
      }
    } catch (error) {
      console.error("Error updating like status for rating:", error);
    }
  }

  const handleAddComment = async (postId) => {
    if (!commentText[postId] || commentText[postId].length > 280) return;

    try {
      const postRef = doc(db, "UserData", postId);
      const newComment = {
        text: commentText[postId],
        timestamp: new Date().toISOString(),
        displayName: displayName, // Include display name
        uid: uid, // Include user uid
      };

      // Update Firestore with the new comment
      await updateDoc(postRef, { comments: arrayUnion(newComment) });

      // Clear the input field for the specific post
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentText((prev) => ({ ...prev, [postId]: value.slice(0, 280) }));
  };

  const handleAddRatingComment = async (ratingId) => {
    if (!ratingCommentText[ratingId] || ratingCommentText[ratingId].length > 280) return;

    try {
      const ratingRef = doc(db, "ratings", ratingId);
      const newComment = {
        text: ratingCommentText[ratingId],
        timestamp: new Date().toISOString(),
        displayName: displayName, // Include display name
        uid: uid, // Include user uid
      };

      // Update Firestore with the new comment
      await updateDoc(ratingRef, { comments: arrayUnion(newComment) });

      // Clear the input field for the specific rating
      setRatingCommentText((prev) => ({ ...prev, [ratingId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleRatingCommentChange = (ratingId, value) => {
    setRatingCommentText((prev) => ({ ...prev, [ratingId]: value.slice(0, 280) }));
  };

  const handleFollow = async (followedUserId) => {
    if (!uid || followedUserId === uid) return; // Prevent following self
  
    try {
      const followedUserRef = doc(db, "users", followedUserId);
      const currentUserRef = doc(db, "users", uid); // Reference to current user
  
      const followedUserDoc = await getDoc(followedUserRef);
  
      if (followedUserDoc.exists()) {
        const followedUserData = followedUserDoc.data();
        const isFollowing = followedUserData.followers?.includes(uid);
  
        if (isFollowing) {
          await updateDoc(followedUserRef, {
            followers: arrayRemove(uid),
          });
          await updateDoc(currentUserRef, {
            following: arrayRemove(followedUserId), // Remove from following
          });
        } else {
          await updateDoc(followedUserRef, {
            followers: arrayUnion(uid),
          });
          await updateDoc(currentUserRef, {
            following: arrayUnion(followedUserId), // Add to following
          });
        }
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  // Function to render non-interactive stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star key={i} filled={i <= rating} interactive={false} />
      );
    }
    return <div className="text-xl mb-2">{stars}</div>;
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-6">
      {filteredPosts.length === 0 ? (
        <p className="text-gray-500">No posts available matching the criteria.</p>
      ) : (
        filteredPosts.map((item) => (
          <div key={item.id} className="p-4 border rounded shadow-md bg-gray-50 relative">
            {/* Move user info section to top */}
            <div className="flex justify-end items-center space-x-2 mb-4">
              <div className="text-right">
                <p className="text-gray-600 text-sm mb-1">
                  {item.displayName || 'Anonymous'}
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(getTimestampInMillis(item)).toLocaleString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </p>
              </div>
              {item.uid !== uid && (
                <button
                  onClick={() => handleFollow(item.uid)}
                  className={item.followers?.includes(uid) ? 'px-2 py-1 bg-blue-700 text-white font-semibold rounded' : 'px-2 py-1 bg-blue-500 text-white font-semibold rounded'}
                >
                  {item.followers?.includes(uid) ? '✅' : '👀'}
                </button>
              )}
            </div>

            {item.type === 'post' ? (
              <>
                <p className="mb-2 text-gray-800 whitespace-pre-wrap break-words">{item.text}</p>
                {item.fileType?.startsWith("image") && (
                  <img src={item.fileURL} alt="Uploaded content" className="w-full h-auto rounded-lg post-image" />
                )}
                {item.fileType?.startsWith("video") && (
                  <video width="100%" height="auto" controls preload="metadata" className="rounded-lg">
                    <source src={item.fileURL} type={item.fileType} />
                    Your browser does not support the video tag.
                  </video>
                )}
                {item.hashtags?.length > 0 && (
                  <div className="mb-2 space-x-2">
                    {item.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-500 text-white rounded-full px-3 py-1 text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Like and Comment Section */}
                <div className="mt-4 space-y-4">
                  {/* Like Button */}
                  <button
                    onClick={() => handleLike(item.id, item.likedBy)}
                    className="mr-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded flex items-center"
                  >
                    {item.likedBy?.includes(uid) ? '❤️' : '🤍'} ({item.likes || 0})
                  </button>

                  {/* Comment Section */}
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        value={commentText[item.id] || ""}
                        onChange={(e) => handleCommentChange(item.id, e.target.value.slice(0, 280))}
                        placeholder="Add a comment... (280 characters max)"
                        className="border rounded px-2 py-1 text-sm w-full mb-2"
                        maxLength={280}
                      />
                      <span className="absolute bottom-4 right-2 text-xs text-gray-500">
                        {(commentText[item.id] || "").length}/280
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddComment(item.id)}
                      className="px-4 py-2 bg-green-500 text-white font-semibold rounded"
                    >
                      Submit Comment
                    </button>
                  </div>

                  {/* Display Comments */}
                  {item.comments?.length > 0 && (
                    <ul className="space-y-2 border-t pt-2">
                      {item.comments.map((comment, idx) => (
                        <li key={idx} className="text-gray-700 text-sm break-words whitespace-pre-wrap">
                          <strong>{comment.displayName}</strong> - <strong>{new Date(comment.timestamp).toLocaleString()}</strong>: {comment.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-gray-800 font-bold">
                  {item.track} by {item.artist}
                </p>

                {/* Render stars below track and artist name */}
                {renderStars(item.rating)}

                {/* Display rating comment above the album cover */}
                <p className="mb-2 text-gray-800 whitespace-pre-wrap break-words">{item.comment}</p>

                {/* Display album cover if available */}
                {item.albumCover && (
                  <img src={item.albumCover} alt="Album Cover" className="w-full h-auto rounded-lg mb-2 post-image" />
                )}

                {item.hashtags?.length > 0 && (
                  <div className="mb-2 space-x-2">
                    {item.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-500 text-white rounded-full px-3 py-1 text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Like Button for Rating */}
                <button
                  onClick={() => handleLikeRating(item.id, item.likedBy)}
                  className="mr-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded flex items-center"
                >
                  {item.likedBy?.includes(uid) ? '❤️' : '🤍'} ({item.likes || 0})
                </button>

                {/* Comment Section for Rating */}
                <div className="mt-4 space-y-4">
                  {/* Comment Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={ratingCommentText[item.id] || ""}
                      onChange={(e) => handleRatingCommentChange(item.id, e.target.value.slice(0, 280))}
                      placeholder="Add a comment... (280 characters max)"
                      className="border rounded px-2 py-1 text-sm w-full mb-2"
                      maxLength={280}
                    />
                    <span className="absolute bottom-4 right-2 text-xs text-gray-500">
                      {(ratingCommentText[item.id] || "").length}/280
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddRatingComment(item.id)}
                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded"
                  >
                    Submit Comment
                  </button>

                  {/* Display Comments */}
                  {item.comments?.length > 0 && (
                    <ul className="space-y-2 border-t pt-2">
                      {item.comments.map((comment, idx) => (
                        <li key={idx} className="text-gray-700 text-sm break-words whitespace-pre-wrap">
                          <strong>{comment.displayName}</strong> - <strong>{new Date(comment.timestamp).toLocaleString()}</strong>: {comment.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default PostList;

