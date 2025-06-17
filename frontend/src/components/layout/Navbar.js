import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUnreadCount } from '../../services/api';

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();
  
  // Fetch unread message count when user is authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const fetchUnreadCount = async () => {
        try {
          const response = await getUnreadCount();
          setUnreadMessages(response.data.count);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      };
      
      fetchUnreadCount();
      
      // Set up polling for unread messages (every 30 seconds)
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <nav className="bg-hit-primary border-gray-200 px-4 lg:px-6 py-3 text-white">
      <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
        <Link to="/" className="flex items-center">
          <span className="self-center text-xl font-semibold whitespace-nowrap text-white">Campus Connect</span>
        </Link>
        
        <div className="flex items-center lg:order-2">
          {isAuthenticated ? (
            <>
              {/* Notification Icon */}
              <div className="mr-3 relative">
                <Link to="/messages" className="text-white hover:text-hit-secondary p-2 relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>
              </div>
              
              {/* Profile Link */}
              <Link to="/profile" className="mr-3 flex items-center hover:text-hit-secondary">
                {user.profile_pic ? (
                  <img
                    src={`http://localhost:5000${user.profile_pic}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover mr-1"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white mr-1"
                    style={{ backgroundColor: `hsl(${user.name.length * 10}, 70%, 50%)` }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline-block">{user.name}</span>
              </Link>
              
              {/* Admin Link */}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="text-white bg-purple-600 hover:bg-purple-700 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2"
                >
                  Admin
                </Link>
              )}
              
              {/* New Listing Button */}
              <Link 
                to="/create-listing" 
                className="text-gray-900 bg-hit-secondary hover:bg-yellow-500 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2"
              >
                + New Listing
              </Link>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="text-white bg-red-600 hover:bg-red-700 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              className="text-white bg-primary-color hover:bg-opacity-90 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2"
            >
              Log in
            </Link>
          )}
          
          {/* Mobile menu button */}
          <button 
            onClick={toggleMobileMenu} 
            className="inline-flex items-center p-2 ml-1 text-sm text-white rounded-lg lg:hidden hover:bg-green-800"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
        
        {/* Navigation Links */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} w-full lg:flex lg:w-auto lg:order-1`}>
          <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
            <li>
              <Link to="/" className="block py-2 pr-4 pl-3 text-white lg:p-0">Home</Link>
            </li>
            <li>
              <Link to="/?category=Textbooks" className="block py-2 pr-4 pl-3 text-white lg:p-0">Textbooks</Link>
            </li>
            <li>
              <Link to="/?category=Electronics" className="block py-2 pr-4 pl-3 text-white lg:p-0">Electronics</Link>
            </li>
            <li>
              <Link to="/?category=Services" className="block py-2 pr-4 pl-3 text-white lg:p-0">Services</Link>
            </li>
            <li>
              <Link to="/?category=Accommodation" className="block py-2 pr-4 pl-3 text-white lg:p-0">Accommodation</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;