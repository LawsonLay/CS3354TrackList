import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; 
import { collection, addDoc } from 'firebase/firestore'; 
import { db, storage } from './firebase'; // Import Firebase configuration
import { v4 as uuidv4 } from 'uuid'; // To create unique IDs for file uploads

function PostForm({ onPostSubmit }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null); // For both image and video files
  const [fileType, setFileType] = useState(''); // Track file type (image or video)
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false); // State to handle button disable during upload
  
  const dberf = collection(db, 'UserData'); // Firestore collection reference

  // Handle file selection (either image or video)
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png'];
    const validVideoTypes = ['video/mp4'];

    if (validImageTypes.includes(selectedFile.type)) {
      setFileType('image');
    } else if (validVideoTypes.includes(selectedFile.type)) {
      setFileType('video');
    } else {
      alert('Invalid file type. Only JPEG, PNG, and MP4 files are allowed.');
      setFile(null);
      return;
    }

    setFile(selectedFile); // Capture the selected file
  };

  // Handle form submission (upload file and save text, file URL, and type to Firestore)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      console.error('No file selected');
      return;
    }
    
    setUploading(true); // Set the uploading state to disable the button during upload

    // Create a reference to the file in Firebase Storage, storing in a folder based on file type
    const folder = fileType === 'image' ? 'images' : 'videos';
    const storageRef = ref(storage, `${folder}/${Date.now()}_${uuidv4()}_${file.name}`);

    // Start the upload process
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Track upload progress and handle completion/errors
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress); // Update the progress state
      },
      (error) => {
        console.error('Upload error:', error);
        setUploading(false); // Reset the uploading state in case of an error
      },
      async () => {
        // Handle successful upload
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Save post data (text, file URL, and type) to Firestore
        await addDoc(dberf, { text, fileURL: downloadURL, fileType });

        // Call the parent function to update the post list
        onPostSubmit({ text, fileURL: downloadURL, fileType });

        // Clear form inputs after success
        setText('');
        setFile(null);
        setFileType('');
        setUploadProgress(0);
        document.getElementById('fileInput').value = ''; // Reset the file input
        setUploading(false); // Re-enable the submit button after success
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
        id="fileInput"
        accept=".jpeg,.png,.mp4" // Restrict file selection to JPEG, PNG, and MP4
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 border border-gray-300 rounded-lg p-2"
        required
      />
      {uploadProgress > 0 && <p>Uploading: {uploadProgress}%</p>}
      <button 
        type="submit" 
        className="w-full px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition duration-200 hover:bg-blue-600"
        disabled={uploading} // Disable the button while uploading
      >
        {uploading ? 'Uploading...' : 'Submit Post'}
      </button>
    </form>
  );
}

export default PostForm;
