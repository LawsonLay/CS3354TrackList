import React, { useState } from 'react';
import Star from './Star';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

function App() {

  // State to hold the rating and comment input
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState(''); // New state for comment

  const handleRating = (rate) => {
    setRating(rate);
  };

  // Handle the comment input
  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      // Submit both rating and comment to Firestore
      await addDoc(collection(db, 'ratings'), {
        rating: rating,
        comment: comment, // Include comment in submission
        timestamp: new Date()
      });
      alert('Rating and comment submitted successfully!');
      // Clear the input fields after successful submission
      setRating(0);
      setComment('');
    } catch (e) {
      console.error('Error adding document: ', e);
      alert('Failed to submit rating and comment.');
    }
  };

  return (
    <div className="App flex items-center justify-center h-screen bg-gray-100 flex-col">
      <div className="text-6xl">
        {/* Star Rating */}
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            filled={star <= rating}
            onClick={() => handleRating(star)}
          />
        ))}
      </div>

      {/* Textbox for comments */}
      <textarea
        value={comment}
        onChange={handleCommentChange}
        placeholder="Leave a comment..."
        className="mt-4 p-2 w-full max-w-md h-24 border rounded border-gray-300"
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      >
        Submit Rating & Comment
      </button>
    </div>
  );
}

export default App;
