import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/firebase";
import PostForm from "./PostForm";
import PostList from "./PostList";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

function Post() {
  const [posts, setPosts] = useState([]);
  const [blockedTerms, setBlockedTerms] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState('curated'); // Changed default to 'curated'

  const isLocal = process.env.NODE_ENV === "development"; // Environment check
  const baseURL = isLocal
    ? "http://127.0.0.1:5001/tracklist-bf80d/us-central1"
    : "https://us-central1-tracklist-bf80d.cloudfunctions.net";

  const loadPosts = async () => {
    const postsCollection = collection(db, "UserData");
    const postSnapshot = await getDocs(postsCollection);
    const postList = postSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPosts(postList);
  };

  const fetchBlockedTerms = async () => {
    try {
      const response = await fetch(`${baseURL}/getBlockedTerms`);
      const text = await response.text();
      console.log("Raw response:", text); // Debug raw response
      const data = JSON.parse(text);

      if (data.success) {
        setBlockedTerms(data.terms.map((term) => term.term.toLowerCase()));
      } else {
        toast.error(data.error || "Failed to fetch terms");
      }
    } catch (error) {
      console.error("Error fetching blocked terms:", error);
      toast.error("Failed to fetch blocked terms");
    }
  };

  useEffect(() => {
    loadPosts();
    fetchBlockedTerms();
  }, []);

  const handlePostSubmit = (newPost) => {
    setPosts([...posts, newPost]);
  };

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-6 relative">
      <div className="flex justify-start mb-6 ml-6 space-x-4">
        <button
          className={`text-lg font-semibold bg-transparent ${
            selectedFeed === 'curated' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-700 dark:text-gray-200'
          } transition-colors`}
          onClick={() => setSelectedFeed('curated')}
        >
          For You
        </button>
        <button
          className={`text-lg font-semibold bg-transparent ${
            selectedFeed === 'all' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-700 dark:text-gray-200'
          } transition-colors`}
          onClick={() => setSelectedFeed('all')}
        >
          All
        </button>
      </div>

      <div className="fixed bottom-6 right-6 flex items-center justify-end">
        <button
          className="bg-primary text-white font-semibold rounded-full shadow hover:bg-blue-700 transition-all duration-300 flex items-center group w-[48px] hover:w-[160px] overflow-hidden"
          onClick={openPopup}
        >
          <div className="flex items-center justify-center w-full px-2 py-3">
            <div className="flex items-center transition-all duration-300 w-0 group-hover:w-[100px]">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap mr-2">
                Create Post
              </span>
            </div>
            <span className="text-xl flex-shrink-0">✎</span>
          </div>
        </button>
      </div>

      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-light-surface dark:bg-gray-800 p-6 rounded-lg shadow-soft relative w-3/4 max-w-3xl">
            <button
              className="absolute top-4 right-4 text-3xl font-bold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 z-[60] transition-colors"
              onClick={closePopup}
            >
              ×
            </button>
            <PostForm onPostSubmit={handlePostSubmit} onClose={closePopup} />
          </div>
        </div>
      )}

      <PostList posts={posts} blockedTerms={blockedTerms} selectedFeed={selectedFeed} />
    </div>
  );
}

export default Post;

