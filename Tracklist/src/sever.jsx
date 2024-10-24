const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors'); // Ensure cors is imported

const app = express();

// Enable CORS for all origins and methods
app.use(cors()); // Allow all origins

app.use(express.json());

// Serve static files from the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer configuration for handling video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Destination folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
  },
});

const upload = multer({ storage });

// API to handle video uploads and text posting
app.post('/uploadPost', upload.single('video'), (req, res) => {
  const { text } = req.body;
  const videoPath = `/uploads/${req.file.filename}`;
  res.json({ text, videoPath });
});

// Start the server
app.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});



