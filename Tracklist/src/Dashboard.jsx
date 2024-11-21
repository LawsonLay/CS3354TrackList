import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Import AuthContext

const Dashboard = () => {
  const { user, logOut } = useAuth(); // Get the current user and logout function
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/login"); // Redirect to login page after logout
    } catch (err) {
      console.error("Failed to log out:", err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <NavLink
              to="/"
              className="text-white font-semibold text-lg hover:text-gray-300"
            >
              Tracklist
            </NavLink>
          </div>
          <div className="flex space-x-4">
            {!user ? (
              <>
                <NavLink
                  to="/login"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  SignUp
                </NavLink>
              </>
            ) : (
              <>
                <span className="text-white font-semibold">
                  Welcome, {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Centered Content with Slide-Down Animation */}
      <div className="flex flex-grow justify-center items-center">
        <div
          className="text-center"
          style={{
            animation: "slideDown 1s ease-out",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <h1 className="text-4xl font-semibold text-gray-800">
            Welcome to Tracklist
          </h1>
          <p className="text-lg text-gray-600 mt-4">
            {user
              ? "You are logged in! Use the navigation bar to explore."
              : "Please log in or sign up to access the features."}
          </p>
        </div>
      </div>

      {/* Inline Keyframes for Animation */}
      <style>
        {`
          @keyframes slideDown {
            0% {
              opacity: 0;
              transform: translateY(-50px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;
