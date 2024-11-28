import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, increment, collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase"; // Adjust the path to your Firebase config

function PostList({ blockedTerms }) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [commentText, setCommentText] = useState({}); // Tracks input for comments for each post

  // Fetch posts in real-time and filter them based on blocked terms
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "UserData"), (snapshot) => {
      const postList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filtered = postList.filter(
        (post) => !blockedTerms.some((term) => post.text.toLowerCase().includes(term))
      );
      setFilteredPosts(filtered);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [blockedTerms]);

  const handleLike = async (postId) => {
    try {
      const postRef = doc(db, "UserData", postId);
      await updateDoc(postRef, { likes: increment(1) }); // Increment likes count in Firestore
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async (postId) => {
    if (!commentText[postId]) return;

    try {
      const postRef = doc(db, "UserData", postId);
      const newComment = {
        text: commentText[postId],
        timestamp: new Date().toISOString(),
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
    setCommentText((prev) => ({ ...prev, [postId]: value }));
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-6">
      {filteredPosts.length === 0 ? (
        <p className="text-gray-500">No posts available matching the criteria.</p>
      ) : (
        filteredPosts.map((post) => (
          <div key={post.id} className="p-4 border rounded shadow-md bg-gray-50">
            <p className="mb-2 text-gray-800">{post.text}</p>
            {post.fileType?.startsWith("image") && (
              <img src={post.fileURL} alt="Uploaded content" className="w-full h-auto rounded-lg" />
            )}
            {post.fileType?.startsWith("video") && (
              <video width="100%" height="auto" controls preload="metadata" className="rounded-lg">
                <source src={post.fileURL} type={post.fileType} />
                Your browser does not support the video tag.
              </video>
            )}

            {/* Like and Comment Section */}
            <div className="mt-4 space-y-4">
              {/* Like Button */}
              <button
                onClick={() => handleLike(post.id)}
                className="mr-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded"
              >
                Like ({post.likes || 0})
              </button>

              {/* Comment Section */}
              <div>
                <input
                  type="text"
                  value={commentText[post.id] || ""}
                  onChange={(e) => handleCommentChange(post.id, e.target.value)}
                  placeholder="Add a comment..."
                  className="border rounded px-2 py-1 text-sm w-full mb-2"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  className="px-4 py-2 bg-green-500 text-white font-semibold rounded"
                >
                  Submit Comment
                </button>
              </div>

              {/* Display Comments */}
              {post.comments?.length > 0 && (
                <ul className="space-y-2 border-t pt-2">
                  {post.comments.map((comment, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">
                      <strong>{new Date(comment.timestamp).toLocaleString()}</strong>: {comment.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default PostList;

