import { useState, useEffect } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import PostForm from './PostForm';
import PostList from './PostList';
import { initializeApp } from 'firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrTmGzkd-KV8NDXWAhSssXf80i3Z06yRc",
  authDomain: "tracklist-bf80d.firebaseapp.com",
  projectId: "tracklist-bf80d",
  storageBucket: "tracklist-bf80d.appspot.com",
  messagingSenderId: "887919704413",
  appId: "1:887919704413:web:b8826835f3321ea9f8d0b4"
};


const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

function App() {
  const [posts, setPosts] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const fetchVideoURLs = async () => {
    const videoPaths = [
      'videos/v1.mp4', 
      'videos/v2.mp4',
      'videos/v3.mp4',
      'videos/v4.mp4',
      'videos/v5.mp4'
    ];

    const videoURLs = await Promise.all(
      videoPaths.map(async (path) => {
        const videoRef = ref(storage, path);
        return await getDownloadURL(videoRef);
      })
    );

    // Generate mock posts with fetched video URLs
    const mockPosts = videoURLs.map((url, i) => ({
      id: i + 1,
      text: `This is the text content for random post #${i + 1}.`,
      videoURL: url
    }));

    setPosts(mockPosts);
  };

  useEffect(() => {
    fetchVideoURLs();
  }, []);

  const handlePostSubmit = (newPost) => {
    setPosts([...posts, newPost]);
  };

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div className="min-h-screen bg-gray-100 py-6 relative">
      <h1 className="text-3xl text-center font-bold mb-6">Tracklist</h1>

      <button
        className="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded"
        onClick={openPopup}
      >
        Create New Post
      </button>

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

      <PostList posts={posts} />
    </div>
  );
}

export default App;
