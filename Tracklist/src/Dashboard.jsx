import React, { useEffect } from "react";
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

  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col transition-all duration-500">
      <nav className="bg-white dark:bg-gray-800 shadow-lg p-4 transition-colors duration-300">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/tracklist.png" alt="Tracklist Logo" className="h-8 w-8" />
            <NavLink
              to="/"
              className="text-blue-600 dark:text-blue-400 font-semibold text-lg hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              TrackList
            </NavLink>
          </div>
          <div className="flex space-x-4">
            {!user ? (
              <>
                <NavLink
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-sm hover:shadow-md"
                >
                  Sign Up
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to={`/profile/${user.uid}`}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {user.displayName}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-6 animate-slideUp hover:scale-105 transition-transform duration-300">
            Discover Your Next Favorite Song
          </h1>
          <p className="text-xl text-blue-800 dark:text-blue-200 max-w-3xl mx-auto mb-8 animate-slideUp delay-150">
            TrackList is your personal music discovery platform. Share, rate, and discuss music
            while connecting with a community that shares your passion.
          </p>
          {!user && (
            <button 
              onClick={() => navigate('/signup')}
              className="bg-blue-600 text-white px-8 py-3 rounded-full text-lg font-semibold 
                hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl 
                animate-scaleIn delay-300 hover:scale-105 transform-gpu"
            >
              Join TrackList Today
            </button>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 py-16 transform-gpu">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-blue-600 dark:text-blue-400 mb-12 animate-slideUp">
              Everything You Need to Explore Music
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Discover & Share",
                  description: "Browse and share songs from Last.fm's extensive library. Rate tracks and share your thoughts in 280 characters.",
                  icon: "🎵"
                },
                {
                  title: "Connect",
                  description: "Join music communities, follow other users, and engage in discussions about your favorite genres and artists.",
                  icon: "👥"
                },
                {
                  title: "Stay Updated",
                  description: "Experience real-time updates of ratings, comments, and posts from your network and communities.",
                  icon: "🔄"
                }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="p-6 bg-blue-50 dark:bg-gray-700 rounded-xl shadow-lg 
                    hover:shadow-xl transition-all duration-300 animate-fadeIn 
                    hover:scale-105 transform-gpu hover:-translate-y-1"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="text-4xl mb-4 animate-bounce-slow">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-3 text-blue-600 dark:text-blue-400">{feature.title}</h3>
                  <p className="text-blue-800 dark:text-blue-200">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 animate-slideRight">
              <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">
                Join a Growing Community of Music Lovers
              </h2>
              <ul className="space-y-4 text-blue-800 dark:text-blue-200">
                <li className="flex items-center">
                  <span className="mr-3">✓</span>
                  Rate and review your favorite tracks
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✓</span>
                  Share text and video posts in real-time
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✓</span>
                  Follow users and join music communities
                </li>
                <li className="flex items-center">
                  <span className="mr-3">✓</span>
                  Discover new music through personalized recommendations
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 animate-float">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-soft 
                hover:shadow-xl transition-all duration-500 transform-gpu hover:scale-105">
                <img src="/tracklist.png" alt="TrackList Community" className="w-full rounded-lg" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-blue-600 text-white py-16 transform-gpu">
          <div className="container mx-auto px-4 text-center animate-slideUp">
            <h2 className="text-3xl font-bold mb-6 animate-slideUp">
              Ready to Start Your Musical Journey?
            </h2>
            {!user && (
              <div className="space-x-4">
                <button 
                  onClick={() => navigate('/signup')}
                  className="bg-white text-blue-600 px-8 py-3 rounded-full text-lg font-semibold 
                    hover:bg-gray-100 transition-all duration-300 shadow-soft hover:shadow-lg 
                    hover:scale-105 transform-gpu animate-scaleIn"
                >
                  Sign Up Now
                </button>
                <button 
                  onClick={() => navigate('/login')}
                  className="bg-transparent border-2 border-white px-8 py-3 rounded-full text-lg 
                    font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 
                    hover:scale-105 transform-gpu animate-scaleIn delay-150"
                >
                  Log In
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
