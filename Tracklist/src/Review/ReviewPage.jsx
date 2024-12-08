// src/ReviewPage.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../Firebase/firebaseConfig';
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
    <div className="bg-light-primary dark:bg-gray-900 p-6 min-h-screen transition-colors duration-300">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-10">Reviews</h1>
        <ul className="space-y-6">
            {reviews.map((review, index) => (
                <li key={index} className="card-base p-6 rounded-lg animate-fadeIn">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                        {review.track}
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">Artist: {review.artist}</p>
                    <p className="text-gray-600 dark:text-gray-400 break-words mb-2">
                        Comment: {review.comment}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">Rating: {review.rating}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted: {format(review.timestamp, 'PPpp')}
                    </p>
                </li>
            ))}
        </ul>
    </div>
);
};

export default ReviewPage;