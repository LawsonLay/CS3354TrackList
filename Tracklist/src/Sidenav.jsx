import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaStar, FaPen, FaUsers, FaClipboardList, FaShieldAlt, FaBars } from 'react-icons/fa';
import { useAuth } from './UserLogin/AuthContext';
import { auth } from './Firebase/firebaseConfig';
import { signOut } from 'firebase/auth';

const Sidenav = ({ isAdmin }) => {
  const [nav, setNav] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { user } = useAuth();

  const handleNav = () => {
    setNav(!nav);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const navItems = [
    { path: '/', icon: FaStar, label: 'Rating' },
    { path: '/post', icon: FaPen, label: 'Post' },
    { path: '/communities', icon: FaUsers, label: 'Communities' },
    ...(isAdmin ? [
      { path: '/reviews', icon: FaClipboardList, label: 'Reviews' },
      { path: '/moderation-dashboard', icon: FaShieldAlt, label: 'Moderation' }
    ] : [])
  ];

  return (
    <div>
      {/* Mobile Menu Button */}
      <FaBars
        onClick={handleNav}
        className='md:hidden fixed top-4 right-4 z-[99] text-gray-800 dark:text-gray-200 cursor-pointer'
        size={24}
      />

      {/* Desktop Navigation */}
      <div className='hidden md:block fixed top-0 w-full bg-white dark:bg-gray-800 shadow-md z-50'>
        <div className='max-w-screen-xl mx-auto px-4'>
          <div className='flex justify-between items-center h-16'>
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center">
              <img src="/tracklist.png" alt="Tracklist Logo" className="w-8 h-8" />
            </NavLink>
            
            {/* Navigation Items */}
            <div className='flex items-center space-x-8'>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-md transition-colors duration-200
                    ${isActive 
                      ? 'text-blue-500 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'}`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            {/* Profile/Login Section */}
            <div className="relative dropdown-container">
              {user ? (
                <>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 text-gray-800 dark:text-gray-200 hover:text-blue-500 focus:outline-none"
                  >
                    <span>{user.displayName || user.email}</span>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1">
                      <NavLink
                        to="/profile"
                        className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Profile
                      </NavLink>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex space-x-4">
                  <NavLink
                    to="/login"
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    Sign Up
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {nav && (
        <div className='md:hidden fixed w-full h-screen bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex flex-col justify-center items-center z-20'>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNav}
              className={({ isActive }) =>
                `w-[75%] flex justify-center items-center rounded-full shadow-lg 
                ${isActive 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'} 
                shadow-gray-400 dark:shadow-gray-900 m-2 p-4 cursor-pointer 
                hover:scale-110 ease-in duration-200`
              }
            >
              <item.icon size={20} />
              <span className='pl-4'>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sidenav;
