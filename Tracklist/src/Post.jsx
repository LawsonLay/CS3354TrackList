import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import PostForm from "./PostForm";
import PostList from "./PostList";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

function Post() {
  const [posts, setPosts] = useState([]);
  const [blockedTerms, setBlockedTerms] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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

      <PostList posts={posts} blockedTerms={blockedTerms} />
    </div>
  );
}

export default Post;

