const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

// Serve static files from the uploads folder (if you still have any static files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Example endpoint (You can use this for other purposes)
app.get('/status', (req, res) => {
  res.send({ status: 'Server is running' });
});

// Start the server
app.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
