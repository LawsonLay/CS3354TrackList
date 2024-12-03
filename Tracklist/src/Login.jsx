import React, { useState } from "react";
import {
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useAuth } from "./AuthContext"; // Import AuthContext
import { auth, db } from "./firebase"; // Import Firebase auth and Firestore instance
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Import Firestore functions

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false); // Track if reset email was sent

  const { logIn, user } = useAuth(); // Use `logIn` and `user` from AuthContext
  const navigate = useNavigate(); // Initialize `useNavigate` for navigation

  // Function to check and create user document in Firestore
  const checkAndCreateUserDoc = async (uid) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, { uid });
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await logIn(email, password); // Authenticate user
      await checkAndCreateUserDoc(userCredential.user.uid); // Check and create user document
      navigate("/"); // Redirect to the home page after successful login
    } catch (err) {
      setError(err.message || "Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider); // Sign in with Google
      await checkAndCreateUserDoc(result.user.uid); // Check and create user document
      navigate("/"); // Redirect to the home page after successful login
    } catch (err) {
      setError(err.message || "Failed to log in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email to reset your password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendPasswordResetEmail(auth, email); // Reset password with Firebase
      setResetSent(true);
    } catch (err) {
      setError("Error sending reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect to home if already logged in
  if (user) {
    navigate("/");
    return null; // Do not render the login form
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-sm w-full">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
          Log In
        </h2>

        {/* Display error messages */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {resetSent && (
          <p className="text-green-500 text-sm mb-4">
            Password reset email sent. Check your inbox.
          </p>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-semibold rounded-md ${
              loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
            } transition-colors`}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Forgot Password */}
        <div className="mt-4 text-center">
          <button
            onClick={handlePasswordReset}
            disabled={loading}
            className="text-blue-500 hover:underline focus:outline-none"
          >
            Forgot Password?
          </button>
        </div>

        {/* Google Sign-In */}
        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 text-white font-semibold rounded-md bg-red-500 hover:bg-red-600 transition-colors"
          >
            {loading ? "Signing in with Google..." : "Sign In with Google"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
