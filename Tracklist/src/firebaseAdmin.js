const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Path to your downloaded service account key

// Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'tracklist-bf80d.appspot.com' // Add your storage bucket if you need Firebase Storage
});

const db = admin.firestore(); // Initialize Firestore (server-side)
const storage = admin.storage().bucket(); // Initialize Firebase Storage (server-side)

module.exports = { db, storage };
