import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getListings } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Rating from '@mui/material/Rating';


// Helper to get query params
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const query = useQuery();
  const navigate = useNavigate();
  
  // Get category from URL if present
  const categoryParam = query.get('category');
  const [currentCategory, setCurrentCategory] = useState(categoryParam || '');
  
  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const params = {};
        
        if (currentCategory) {
          params.category = currentCategory;
        }
        
        if (searchQuery) {
          params.search = searchQuery;
        }
        
        const response = await getListings(params);
        setListings(response.data.listings);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to load listings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [currentCategory, searchQuery]);
  
  // Update URL when category changes
  useEffect(() => {
    if (currentCategory) {
      navigate(`/?category=${currentCategory}`, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [currentCategory, navigate]);
  
  // Filter by category
  const filterByCategory = (category) => {
    setCurrentCategory(currentCategory === category ? '' : category);
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already handled by the useEffect with searchQuery dependency
  };
  
  // Get initials for placeholder image
  const getInitials = (title) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get random color based on string
  const getRandomColor = (seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  };
  
  // Get category class
  const getCategoryClass = (category) => {
    const classes = {
      'Textbooks': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Electronics': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Services': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Accommodation': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    
    return classes[category] || classes['Other'];
  };
  
  // Truncate description
  const truncateDescription = (text, length = 100) => {
    if (!text || text.length <= length) return text || '';
    return text.substring(0, length) + '...';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">HIT Campus Marketplace</h1>
        <div className="w-full md:w-1/3">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full p-4 pl-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Search listings..."
            />
            <button
              type="submit"
              className="absolute right-2.5 bottom-2.5 bg-primary-color hover:bg-opacity-90 text-white font-medium rounded-lg text-sm px-4 py-2"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['Textbooks', 'Electronics', 'Services', 'Accommodation', 'Other'].map((category) => (
          <button
            key={category}
            onClick={() => filterByCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              currentCategory === category 
                ? 'bg-primary-color text-white' 
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {category}
          </button>
        ))}
        {currentCategory && (
          <button
            onClick={() => setCurrentCategory('')}
            className="px-4 py-2 rounded-full text-sm font-medium bg-red-500 text-white"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Listings */}
      {isAuthenticated ? (
        loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
            <h2 className="text-xl font-bold mb-4">No listings found</h2>
            <p className="mb-4">Try changing your search criteria or check back later.</p>
            <Link 
              to="/create-listing" 
              className="inline-block px-6 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90 transition"
            >
              Create a Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div 
                key={listing.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800 transition-transform hover:-translate-y-1 hover:shadow-xl"
              >
                <Link to={`/listings/${listing.id}`}>
                  {listing.images && listing.images.length > 0 ? (
                    <div className="h-48 bg-gray-300 relative">
                      <img 
                        src={`https://campus-connect-ph1q.onrender.com${listing.images[0]}`} 
                        alt={listing.title} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div 
                      className="h-48 bg-gray-300 flex items-center justify-center"
                      style={{ backgroundColor: getRandomColor(listing.title) }}
                    >
                      <span className="text-3xl text-white font-bold">
                        {getInitials(listing.title)}
                      </span>
                    </div>
                  )}
                </Link>

                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <Link to={`/listings/${listing.id}`} className="text-lg font-bold mb-1 hover:text-primary-color">
                      {listing.title}
                    </Link>
                    <span className="text-sm font-semibold text-hit-secondary">
                      ${parseFloat(listing.price).toFixed(2)}
                    </span>
                  </div>
                  {/* Update the listing card JSX to include rating */}
                  {/*<div className="flex justify-between items-start">
                    <Link to={`/listings/${listing.id}`} className="text-lg font-bold mb-1 hover:text-primary-color">
                      {listing.title}
                    </Link>
                    <span className="text-sm font-semibold text-hit-secondary">
                      ${parseFloat(listing.price).toFixed(2)}
                    </span>
                  </div>*/}

                  {/* Add Rating component here */}
                  <div className="mb-2">
                    <Rating 
                      value={listing.ratings.average} 
                      count={listing.ratings.count}
                      size="sm"
                      />
                  </div>
                  <span 
                    className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getCategoryClass(listing.category)}`}
                  >
                    {listing.category}
                  </span>
                  <p className="text-sm mb-2 text-gray-700 dark:text-gray-300">
                    {truncateDescription(listing.description)}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center">
                      {listing.seller_profile_pic ? (
                        <img 
                          src={`https://campus-connect-ph1q.onrender.com${listing.seller_profile_pic}`} 
                          alt={listing.seller_name} 
                          className="w-6 h-6 rounded-full object-cover mr-2"
                        />
                      ) : (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-2"
                          style={{ backgroundColor: getRandomColor(listing.seller_name || '') }}
                        >
                          {listing.seller_name ? listing.seller_name.charAt(0).toUpperCase() : '?'}
                        </div>
                      )}
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {listing.seller_name}
                      </span>
                    </div>
                    <Link
                      to={`/listings/${listing.id}`}
                      className="text-sm px-3 py-1 rounded bg-primary-color text-white hover:bg-opacity-90 transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="p-6 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
          <h2 className="text-xl font-bold mb-4">Login Required</h2>
          <p className="mb-4">Please log in to view and interact with the HIT Campus Connect marketplace.</p>
          <div className="filter blur-sm mt-6 pointer-events-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg bg-white dark:bg-gray-800">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-1/4"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link 
            to="/login" 
            className="mt-6 inline-block px-6 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90 transition"
          >
            Login Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;