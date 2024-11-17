import React, { useContext, useState, useEffect } from "react";
import { auth } from "../firebase";


// Create the AuthContext
const AuthContext = React.createContext();

// Custom hook to access the AuthContext
export function useAuth() {
  return useContext(AuthContext);
}

// AuthProvider component to provide authentication state and methods to the rest of the app
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);

  // Sign up a new user
  function signup(email, password) {
    return auth.createUserWithEmailAndPassword(email, password);
  }

  // Log in a user
  function login(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  }

  // Log out the current user
  function logout() {
    return auth.signOut();
  }

  // Reset password for a user
  function resetPassword(email) {
    return auth.sendPasswordResetEmail(email);
  }

  // Update the current user's email
  function updateEmail(email) {
    return currentUser.updateEmail(email);
  }

  // Update the current user's password
  function updatePassword(password) {
    return currentUser.updatePassword(password);
  }

  // Set up an effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Clean up the listener when the component is unmounted
  }, []);

  // Provide authentication methods and state to the rest of the app
  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateEmail,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
