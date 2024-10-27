import { useState } from 'react';
import PostForm from './PostForm';
import PostList from './PostList';

function App() {
  // Array of example video URLs
  const videoURLs = [
    'https://www.w3schools.com/html/mov_bbb.mp4', // Big Buck Bunny
    'https://www.w3schools.com/html/movie.mp4', // Sample Video
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', // Flower Video
    'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Another Big Buck Bunny
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', // Elephants Dream
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // For Bigger Blazes
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', // For Bigger Escapes
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', // For Bigger Fun
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', // For Bigger Joyrides
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' // For Bigger Meltdowns
  ];
  

  // Generate 10 random mock posts with text and a unique fileURL and fileType
  const generateMockPosts = () => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      text: `This is the text content for random post #${i + 1}.`,
      fileURL: videoURLs[i % videoURLs.length], // Alternate between the available video URLs
      fileType: 'video' // Explicitly set to "video" for these posts
    }));
  };

  const [posts, setPosts] = useState(generateMockPosts()); // Initialize posts with 10 random posts

  const handlePostSubmit = (newPost) => {
    setPosts([...posts, newPost]); // Update the post list with the new post
  };

  const [isPopupOpen, setIsPopupOpen] = useState(false); // State for controlling popup visibility

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

export default App;

