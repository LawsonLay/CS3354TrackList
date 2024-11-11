import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Import Firebase storage
import { getAuth } from "firebase/auth"; // Import Firebase auth


// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: "AIzaSyBrTmGzkd-KV8NDXWAhSssXf80i3Z06yRc",
    authDomain: "tracklist-bf80d.firebaseapp.com",
    projectId: "tracklist-bf80d",
    storageBucket: "tracklist-bf80d.appspot.com",
    messagingSenderId: "887919704413",
    appId: "1:887919704413:web:b8826835f3321ea9f8d0b4"
  };
console.log("Storage Bucket:", firebaseConfig.storageBucket);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app); // Initialize storage using app
const videoDB = getStorage(app);
const textDB = getStorage(app);
export {videoDB,textDB, db, storage };

// Initialize authentication
const auth = getAuth();


