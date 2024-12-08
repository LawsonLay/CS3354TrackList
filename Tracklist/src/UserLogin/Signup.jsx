import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../Firebase/firebaseConfig';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setEmail('');
      setPassword('');
      setError('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-light-primary dark:bg-gray-900 transition-colors duration-300">
      <div className="bg-light-surface dark:bg-gray-800 p-8 rounded-lg shadow-card max-w-sm w-full animate-formAppear transition-all">
        <div className="flex justify-center mb-6">
          <img src="/tracklist.png" alt="Tracklist Logo" className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-semibold text-center text-gray-700 dark:text-white mb-6">
          Sign Up
        </h2>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 bg-light-primary dark:bg-gray-700 border border-light-tertiary dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 bg-light-primary dark:bg-gray-700 border border-light-tertiary dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-md bg-primary hover:bg-blue-600 transition-all duration-300 shadow-sm hover:shadow-md disabled:bg-gray-400"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
