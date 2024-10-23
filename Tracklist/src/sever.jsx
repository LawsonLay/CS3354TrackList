const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the uploads folder
app.use('/uploads', express.static('uploads'));

// Multer configuration for handling video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set upload destination to 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Name files uniquely
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
