import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; 
import { collection, addDoc } from 'firebase/firestore'; 
import { db, storage } from './firebase'; // Import Firebase config

function PostForm({ onPostSubmit }) {
  const [text, setText] = useState('');
  const [video, setVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const dberf = collection(db, 'UserData'); 

  // Handle video selection
  const handleVideoChange = (e) => {
    setVideo(e.target.files[0]); // Capture the selected video file
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!video) {
      console.error('No video selected');
      return;
    }

    // Create a reference to the video in Firebase Storage
    const storageRef = ref(storage, `videos/${Date.now()}_${video.name}`);
    
    // Start the upload process
    const uploadTask = uploadBytesResumable(storageRef, video);

    // Track upload progress and handle completion/errors
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress); // Update the progress state
      },
      (error) => {
        console.error('Upload error:', error);
      },
      async () => {
        // Handle successful upload
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Save post data (text and video URL) to Firestore
        await addDoc(dberf, { text, videoURL: downloadURL });

        // Call the parent function to update the post list
        onPostSubmit({ text, videoURL: downloadURL });

        // Clear form inputs
        setText('');
        setVideo(null);
        setUploadProgress(0);
        document.getElementById('videoInput').value = ''; // Reset the file input
      }
    );
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
        id="videoInput"
        accept="video/*"
        onChange={handleVideoChange}
        className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
        required
      />
      {uploadProgress > 0 && <p>Uploading: {uploadProgress}%</p>}
      <button type="submit" className="w-full px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition duration-200 hover:bg-blue-600">
        Submit Post
      </button>
    </form>
  );
}

export default PostForm;

