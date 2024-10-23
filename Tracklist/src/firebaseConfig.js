// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrTmGzkd-KV8NDXWAhSssXf80i3Z06yRc",
  authDomain: "tracklist-bf80d.firebaseapp.com",
  projectId: "tracklist-bf80d",
  storageBucket: "tracklist-bf80d.appspot.com",
  messagingSenderId: "887919704413",
  appId: "1:887919704413:web:b8826835f3321ea9f8d0b4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };