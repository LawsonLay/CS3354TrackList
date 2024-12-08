import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./UserLogin/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  // Redirect unauthenticated users to the dashboard page
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;