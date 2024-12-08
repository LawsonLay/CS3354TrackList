import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, db } from "../Firebase/firebase"; // Ensure firebase.js exports `auth` and `db`
import { doc, setDoc } from "firebase/firestore";

// Create the AuthContext
const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // Initial user state is null
  const [loading, setLoading] = useState(true); // Track loading state

  // Monitor the authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Set loading to false once the auth state is determined
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign up function
  const signUp = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create a new document in Firestore for the user
      await setDoc(doc(db, "users", user.uid), {
        favshow: [], // Example initial data
      });

      return user;
    } catch (error) {
      console.error("Error during sign-up:", error.message);
      throw error;
    }
  };

  // Log in function
  const logIn = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error during login:", error.message);
      throw error;
    }
  };

  // Log out function
  const logOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during logout:", error.message);
    }
  };

  // Provide the user state and auth functions to children
  const value = { user, signUp, logIn, logOut };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;
