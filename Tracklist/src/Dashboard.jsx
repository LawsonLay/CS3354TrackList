import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Dashboard = () => {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logOut();
      navigate("/login");
    } catch (err) {
      console.error("Failed to log out:", err.message);
    }
  };

  const reviews = [
    {
      title: "Mystic Harmony",
      year: "2023",
      author: "melodymaker",
      rating: "★★★★½",
      text: "The way each track seamlessly blends into the next, it feels like a single, ethereal journey through sound.",
      likes: "1,209"
    },
    {
      title: "Reverie in Blue",
      year: "2022",
      author: "basslinebuddy",
      rating: "★★★★",
      text: "A solid jazz fusion record that brings you to a smoky club at midnight. Sax solos are to die for.",
      likes: "842"
    },
    {
      title: "Electric Dawn",
      year: "2024",
      author: "groovesmith",
      rating: "★★★★★",
      text: "This album changed my perspective on electronic music. Every sound is handcrafted and intentional.",
      likes: "2,304"
    }
  ];

  const popularLists = [
    {
      name: "Albums everyone should hear at least once",
      author: "audiophile123",
      likes: "5,628"
    },
    {
      name: "Top 250 Influential Records",
      author: "crate_digger",
      likes: "3,140"
    },
    {
      name: "Best Lo-Fi Tracks",
      author: "chillhop",
      likes: "1,089"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-white">
      {/* Navigation */}
      <nav className="py-4 bg-transparent">
        <div className="container mx-auto flex justify-between items-center px-4">
          <div className="flex items-center space-x-2">
            <img src="/tracklist.svg" alt="Tracklist Logo" className="h-8 w-8" />
            <span className="text-2xl font-bold text-white">Tracklist</span>
          </div>

          <div className="flex items-center space-x-6 text-white font-medium">
            {!user && (
              <>
                <NavLink
                  to="/login"
                  className="hover:text-[#F5EFE6] transition-colors"
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/signup"
                  className="hover:text-[#F5EFE6] transition-colors"
                >
                  Create Account
                </NavLink>
              </>
            )}
            {user && (
              <>
                <NavLink
                  to={`/profile/${user.uid}`}
                  className="flex items-center space-x-2 hover:text-[#F5EFE6] transition-colors"
                >
                  <img
                    src={user.photoURL || "/default-avatar.png"}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{user.displayName}</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="hover:text-[#F5EFE6] transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section with a uniform blended background */}
      <div
        className="relative w-full h-[60vh] flex items-center justify-center bg-cover bg-center"
        style={{
          // Using a gradient close to #111827 (gray-900) with slight transparency
          backgroundImage: `linear-gradient(rgba(17,24,39,0.7), rgba(17,24,39,0.7)), url('/')`,
          backgroundBlendMode: "overlay",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="relative z-10 text-center max-w-2xl px-4">
          <h1 className="text-4xl md:text-4xl font-bold mb-4 leading-snug text-white">
            Track songs you’ve listened to.<br />
            Save those you want to discover.<br />
            Tell your friends what’s great.
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            The social network for music lovers.
          </p>
          {!user && (
            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-lg font-medium transition-all"
            >
              Join today.
            </button>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="container mx-auto py-16 px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">
          Write and share reviews. Compile your own playlists. Share your life in music.
        </h2>
        <p className="text-center text-gray-300 mb-12">
          Below are some popular reviews and lists from this week.{" "}
          {!user && (
            <span
              onClick={() => navigate("/signup")}
              className="cursor-pointer text-[#F5EFE6] hover:underline"
            >
              Sign up
            </span>
          )}{" "}
          to create your own.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Popular Reviews This Week */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Popular Reviews This Week</h3>
              <button className="text-gray-400 hover:text-gray-200 text-sm transition-colors">
                More
              </button>
            </div>
            <div className="space-y-8">
              {reviews.map((review, index) => (
                <div key={index} className="border-b border-gray-700 pb-4">
                  <h4 className="text-lg font-semibold flex items-center space-x-2">
                    <span>{review.title}</span>
                    <span className="text-sm text-gray-400">({review.year})</span>
                    <span className="text-sm text-green-400">{review.rating}</span>
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">
                    by <span className="text-gray-200 font-medium">@{review.author}</span>
                  </p>
                  <p className="text-gray-100 mb-2">{review.text}</p>
                  <p className="text-sm text-gray-400">{review.likes} likes</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Popular Lists */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Popular Lists</h3>
              <button className="text-gray-400 hover:text-gray-200 text-sm transition-colors">
                More
              </button>
            </div>
            <ul className="space-y-4">
              {popularLists.map((listItem, index) => (
                <li key={index}>
                  <h4 className="font-semibold text-white hover:text-[#F5EFE6] transition-colors cursor-pointer">
                    {listItem.name}
                  </h4>
                  <p className="text-sm text-gray-400">
                    by @{listItem.author} · {listItem.likes} likes
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Tracklist. The social network for music lovers.
      </footer>
    </div>
  );
};

export default Dashboard;
