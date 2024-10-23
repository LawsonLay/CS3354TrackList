import { useState } from 'react';
import axios from 'axios';

function PostForm({ onPostSubmit }) {
  const [text, setText] = useState('');
  const [video, setVideo] = useState(null);

  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]); // Capture the selected video file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('text', text); // Append text to form data
    formData.append('video', video); // Append video to form data

    // Submit to backend
    const response = await axios.post('http://localhost:4000/uploadPost', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }, // Ensure correct headers
    });

    onPostSubmit(response.data); // Update the post list in the parent component
    setText(''); // Clear the form text input
    setVideo(null); // Clear the form video input
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-4 border rounded shadow-md space-y-4">
      <textarea
        placeholder="Write something..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
        required
      />
      <input
        type="file"
        accept="video/*"
        onChange={handleVideoChange}
        className="block w-full text-sm text-gray-500"
        required
      />
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        Submit Post
      </button>
    </form>
  );
}

export default PostForm;


