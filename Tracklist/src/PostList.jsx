import { useState, useEffect, useCallback } from "react";
import { doc, updateDoc, arrayUnion, increment, collection, onSnapshot, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "./firebase"; // Adjust the path to your Firebase config
import { getAuth } from 'firebase/auth'; // Import Firebase Auth
import Star from './Star'; // Import the Star component

function PostList({ blockedTerms, selectedFeed }) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [commentText, setCommentText] = useState({}); // Tracks input for comments for each post
  const [ratingCommentText, setRatingCommentText] = useState({}); // Tracks input for comments for each rating
  const [selectedPost, setSelectedPost] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

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

  // Add/update useEffect to handle body scroll lock
  useEffect(() => {
    if (selectedPost) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [selectedPost]);

  // Add this new useEffect to keep selectedPost in sync with filteredPosts
  useEffect(() => {
    if (selectedPost) {
      const updatedPost = filteredPosts.find(post => post.id === selectedPost.id);
      if (updatedPost) {
        setSelectedPost(updatedPost);
      }
    }
  }, [filteredPosts]);

  // Add this new function to check if the click target is interactive
  const isInteractiveElement = (element) => {
    const interactiveElements = ['BUTTON', 'TEXTAREA', 'INPUT'];
    let current = element;
    
    // Check the clicked element and its parents up to the post container
    while (current && !current.classList.contains('post-container')) {
      if (interactiveElements.includes(current.tagName)) {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  };

  // Modify handlePostClick to check for interactive elements
  const handlePostClick = useCallback((event, post) => {
    if (isInteractiveElement(event.target)) {
      return;
    }
    setSelectedPost(post);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedPost(null);
      setIsClosing(false);
    }, 300);
  }, []);

  // Close modal when clicking outside
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  }, [handleCloseModal]);

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
    <div className="space-y-6 max-w-2xl mx-auto mt-6">
      {filteredPosts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No posts available matching the criteria.</p>
      ) : (
        filteredPosts.map((item) => (
          <div
            key={item.id}
            onClick={(e) => handlePostClick(e, item)}
            className="post-container p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105 hover:shadow-lg animate-fadeIn cursor-pointer"
          >
            {/* Updated User Info Header */}
            <div className="flex justify-end items-start mb-4">
              <div className="text-right space-y-1">
                <p className="text-gray-800 dark:text-white font-semibold">
                  {item.displayName || 'Anonymous'}
                </p>
                {item.uid !== uid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollow(item.uid);
                    }}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      item.followers?.includes(uid)
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                  >
                    {item.followers?.includes(uid) ? '✓ Following' : 'Follow'}
                  </button>
                )}
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  {new Date(getTimestampInMillis(item)).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-4">
              {item.type === 'post' ? (
                // Normal Post Content
                <div className="space-y-3">
                  <p className="text-gray-800 dark:text-white text-lg whitespace-pre-wrap break-words">{item.text}</p>
                  {item.fileType?.startsWith("image") && (
                    <img src={item.fileURL} alt="Uploaded content" className="w-full h-auto rounded-lg post-image" />
                  )}
                  {item.fileType?.startsWith("video") && (
                    <video controls preload="metadata" className="w-full rounded-lg">
                      <source src={item.fileURL} type={item.fileType} />
                    </video>
                  )}
                </div>
              ) : (
                // Rating Post Content
                <div className="space-y-3">
                  <p className="text-gray-800 dark:text-white text-lg font-bold">
                    {item.track} by {item.artist}
                  </p>
                  {renderStars(item.rating)}
                  <p className="text-gray-800 dark:text-white whitespace-pre-wrap break-words">{item.comment}</p>
                  {item.albumCover && (
                    <img src={item.albumCover} alt="Album Cover" className="w-full h-auto rounded-lg post-image" />
                  )}
                </div>
              )}
            </div>

            {/* Hashtags */}
            {item.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {item.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-block bg-primary/20 text-primary dark:text-white rounded-full px-3 py-1 text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Interaction Section */}
            <div className="space-y-4" onClick={e => e.stopPropagation()}>
              {/* Like Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  item.type === 'post' ? handleLike(item.id, item.likedBy) : handleLikeRating(item.id, item.likedBy);
                }}
                className="flex items-center space-x-2 text-primary hover:text-blue-700 transition-colors"
              >
                <span>{item.likedBy?.includes(uid) ? '❤️' : '🤍'}</span>
                <span className="text-gray-800 dark:text-white">({item.likes || 0})</span>
              </button>

              {/* Comment Section */}
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    value={item.type === 'post' ? (commentText[item.id] || "") : (ratingCommentText[item.id] || "")}
                    onChange={(e) => 
                      item.type === 'post' 
                        ? handleCommentChange(item.id, e.target.value)
                        : handleRatingCommentChange(item.id, e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Add a comment... (280 characters max)"
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    rows="2"
                    maxLength={280}
                  />
                  <span className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                    {(item.type === 'post' ? (commentText[item.id] || "") : (ratingCommentText[item.id] || "")).length}/280
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    item.type === 'post' ? handleAddComment(item.id) : handleAddRatingComment(item.id);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Comment
                </button>
              </div>

              {/* Display Comments */}
              {item.comments?.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <ul className="space-y-3">
                    {item.comments.map((comment, idx) => (
                      <li key={idx} className="text-gray-800 dark:text-white text-sm break-words">
                        <span className="font-semibold">{comment.displayName}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                          {new Date(comment.timestamp).toLocaleString()}
                        </span>
                        <p className="mt-1 whitespace-pre-wrap">{comment.text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {selectedPost && (
        <div
          className={`modal-overlay ${isClosing ? 'modal-closing' : ''}`}
          onClick={handleOverlayClick}
        >
          <div className={`modal-content ${isClosing ? 'modal-content-closing' : ''}`}>
            <div className="p-6 bg-gray-50 dark:bg-gray-800 shadow-xl"> {/* Updated this line */}
              {/* User Info Header */}
              <div className="flex justify-end items-start mb-4">
                <div className="text-right space-y-1">
                  <p className="text-gray-800 dark:text-white font-semibold">
                    {selectedPost.displayName || 'Anonymous'}
                  </p>
                  {selectedPost.uid !== uid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(selectedPost.uid);
                      }}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedPost.followers?.includes(uid)
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      {selectedPost.followers?.includes(uid) ? '✓ Following' : 'Follow'}
                    </button>
                  )}
                  <p className="text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(getTimestampInMillis(selectedPost)).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                {selectedPost.type === 'post' ? (
                  <div className="space-y-3">
                    <p className="text-gray-800 dark:text-white text-lg whitespace-pre-wrap break-words">
                      {selectedPost.text}
                    </p>
                    {selectedPost.fileType?.startsWith("image") && (
                      <img
                        src={selectedPost.fileURL}
                        alt="Uploaded content"
                        className="w-full h-auto rounded-lg"
                      />
                    )}
                    {selectedPost.fileType?.startsWith("video") && (
                      <video controls className="w-full rounded-lg">
                        <source src={selectedPost.fileURL} type={selectedPost.fileType} />
                      </video>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-800 dark:text-white text-lg font-bold">
                      {selectedPost.track} by {selectedPost.artist}
                    </p>
                    {renderStars(selectedPost.rating)}
                    <p className="text-gray-800 dark:text-white whitespace-pre-wrap break-words">
                      {selectedPost.comment}
                    </p>
                    {selectedPost.albumCover && (
                      <img
                        src={selectedPost.albumCover}
                        alt="Album Cover"
                        className="w-full h-auto rounded-lg"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Hashtags */}
              {selectedPost.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedPost.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-block bg-primary/20 text-primary dark:text-white rounded-full px-3 py-1 text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Interactions */}
              <div className="space-y-4">
                {/* Like Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    selectedPost.type === 'post' 
                      ? handleLike(selectedPost.id, selectedPost.likedBy) 
                      : handleLikeRating(selectedPost.id, selectedPost.likedBy);
                  }}
                  className="flex items-center space-x-2 text-primary hover:text-blue-700 transition-colors"
                >
                  <span>{selectedPost.likedBy?.includes(uid) ? '❤️' : '🤍'}</span>
                  <span className="text-gray-800 dark:text-white">({selectedPost.likes || 0})</span>
                </button>

                {/* Comment Section */}
                <div className="space-y-2">
                  <div className="relative">
                    <textarea
                      value={selectedPost.type === 'post' 
                        ? (commentText[selectedPost.id] || "") 
                        : (ratingCommentText[selectedPost.id] || "")}
                      onChange={(e) => {
                        e.stopPropagation();
                        selectedPost.type === 'post'
                          ? handleCommentChange(selectedPost.id, e.target.value)
                          : handleRatingCommentChange(selectedPost.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Add a comment... (280 characters max)"
                      className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      rows="2"
                      maxLength={280}
                    />
                    <span className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                      {(selectedPost.type === 'post' 
                        ? (commentText[selectedPost.id] || "") 
                        : (ratingCommentText[selectedPost.id] || "")).length}/280
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectedPost.type === 'post'
                        ? handleAddComment(selectedPost.id)
                        : handleAddRatingComment(selectedPost.id);
                    }}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Comment
                  </button>
                </div>

                {/* Display Comments */}
                {selectedPost.comments?.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <ul className="space-y-3">
                      {selectedPost.comments.map((comment, idx) => (
                        <li key={idx} className="text-gray-800 dark:text-white text-sm break-words">
                          <span className="font-semibold">{comment.displayName}</span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs ml-2">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                          <p className="mt-1 whitespace-pre-wrap">{comment.text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostList;

