import React, { useState } from 'react';
import Star from './Star';
import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

function App() {

  const [rating, setRating] = useState(0);

  const handleRating = (rate) => {
    setRating(rate);
  };

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'ratings'), {
        rating: rating,
        timestamp: new Date()
      });
      alert('Rating submitted successfully!');
    } catch (e) {
      console.error('Error adding document: ', e);
      alert('Failed to submit rating.');
    }
  };

  return (
    <div className="App flex items-center justify-center h-screen bg-gray-100">
      <div className="text-6xl">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            filled={star <= rating}
            onClick={() => handleRating(star)}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
      >
        Submit Rating
      </button>
    </div>

);  

}

export default App;



