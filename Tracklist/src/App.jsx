import { useState } from 'react';
import PostForm from './PostForm';
import PostList from './PostList';

function App() {
  const [posts, setPosts] = useState([]); // Managing the posts (video + text)

  const handlePostSubmit = (newPost) => {
    setPosts([...posts, newPost]); // Update the post list with the new post
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <h1 className="text-3xl text-center font-bold mb-6">Video and Text Post System</h1>
      
      {/* Video and Text Post System */}
      <PostForm onPostSubmit={handlePostSubmit} />
      <PostList posts={posts} />
    </div>
  );
}

export default App;



