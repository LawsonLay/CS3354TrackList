// src/ReviewPage.jsx
import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

const ReviewPage = () => {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      const q = query(collection(db, 'ratings'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate() // Convert Firestore timestamp to JavaScript Date
      }));
      setReviews(reviewsData);
    };

    fetchReviews();
  }, []);

return (
    <div className="white-background p-4 min-h-screen">
        <h1 style={{ fontSize: '2em', fontWeight: 'bold', marginBottom: '40px' }}>Reviews</h1>
        <ul>
            {reviews.map((review, index) => (
                <li key={index} style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontWeight: 'bold' }}>{review.track}</h2> {/* Make the track text bold */}
                    <p>Artist: {review.artist}</p>
                    <p style={{ wordWrap: 'break-word' }}>Comment: {review.comment}</p>
                    <p>Rating: {review.rating}</p>
                    <p>ID: {review.id}</p>
                    <p>Submitted: {format(review.timestamp, 'PPpp')}</p> {/* Format the timestamp */}
                </li>
            ))}
        </ul>
    </div>
);
};

export default ReviewPage;