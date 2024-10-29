import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase'; // Import Firebase configuration
import PostForm from './PostForm';
import PostList from './PostList';

function Post() {
  const [posts, setPosts] = useState([]); // Initialize with empty array
  const [isPopupOpen, setIsPopupOpen] = useState(false); // State for controlling popup visibility

  // Function to load posts from Firestore
  const loadPosts = async () => {
    const postsCollection = collection(db, 'UserData');
    const postSnapshot = await getDocs(postsCollection);
    const postList = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPosts(postList); // Set the posts from Firestore to state
  };

  useEffect(() => {
    loadPosts(); // Fetch posts on initial load
  }, []);

  const handlePostSubmit = (newPost) => {
    setPosts([...posts, newPost]); // Update the post list with the new post
  };

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div className="min-h-screen bg-gray-100 py-6 relative">
      <h1 className="text-3xl text-center font-bold mb-6">Tracklist</h1>

      {/* Button to open the PostForm popup */}
      <button
        className="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded"
        onClick={openPopup}
      >
        Create New Post
      </button>

      {/* Conditionally render the PostForm popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg relative w-3/4 max-w-3xl">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={closePopup}
            >
              ✕
            </button>
            <PostForm onPostSubmit={handlePostSubmit} />
          </div>
        </div>
      )}

      {/* Display the list of posts */}
      <PostList posts={posts} />
    </div>
  );
}

export default Post;
