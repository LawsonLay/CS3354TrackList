import { useState } from 'react';
import axios from 'axios';

function PostForm({ onPostSubmit }) {
  const [text, setText] = useState('');
  const [video, setVideo] = useState(null);

  // Handle video file change
  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]); // Capture the selected video file
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
   console.log(text , video);
    const formData = new FormData(); // Create form data object
    formData.append('text', text); // Append text
    formData.append('video', video); // Append video

    try {
      // Submit to backend
      const response = await axios.post('http://localhost:4000/uploadPost', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, // Ensure correct headers
      });

      // Call the parent function to update post list
      onPostSubmit(response.data);

      // Clear form inputs
      setText('');
      setVideo(null);
      document.getElementById('videoInput').value = ''; // Reset the file input
    } catch (error) {
      console.error('Error uploading post', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto p-8 border rounded shadow-md space-y-6 bg-white">
      <textarea
        placeholder="Write something..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 p-4 border border-gray-300 rounded-lg text-sm"
        required
      />
      <input
        type="file"
        id="videoInput" // Add ID for resetting file input
        accept="video/*"
        onChange={handleVideoChange}
        className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
        required
      />
      <button type="submit" className="w-full px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition duration-200 hover:bg-blue-600">
        Submit Post
      </button>
    </form>
  );
}

export default PostForm;



