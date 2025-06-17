import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getMyListings, deleteListing, setupMfa, disableMfa } from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    phone: '',
    location: '',
    business_name: '',
    business_description: '',
    business_hours: ''
  });
  const [mfaVerificationCode, setMfaVerificationCode] = useState(['', '', '', '', '', '']);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaModalError, setMfaModalError] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        location: user.location || '',
        business_name: user.business_name || '',
        business_description: user.business_description || '',
        business_hours: user.business_hours || ''
      });
    }
  }, [user]);
  
  // Fetch user listings
  useEffect(() => {
    const fetchMyListings = async () => {
      try {
        setLoading(true);
        const response = await getMyListings();
        setMyListings(response.data.listings);
      } catch (error) {
        console.error('Error fetching listings:', error);
        toast.error('Failed to load your listings');
      } finally {
        setLoading(false);
      }
    };
    
    if (activeTab === 'listings') {
      fetchMyListings();
    }
  }, [activeTab]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('bio', profileData.bio);
      formData.append('phone', profileData.phone);
      formData.append('location', profileData.location);
      
      if (user.type === 'service_provider') {
        formData.append('business_name', profileData.business_name);
        formData.append('business_description', profileData.business_description);
        formData.append('business_hours', profileData.business_hours);
      }
      
      if (profileImageFile) {
        formData.append('profile_pic', profileImageFile);
      }
      
      // Update user profile using API
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      
      // Update user in context
      updateUser(data.user);
      
      // Reset state
      setEditMode(false);
      setProfileImageFile(null);
      setPreviewImage(null);
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }
    
    // Set file and preview
    setProfileImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle listing deletion
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteListing(listingId);
      
      // Update listings list
      setMyListings(prevListings => prevListings.filter(listing => listing.id !== listingId));
      
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };
  
  // Set up MFA
  const handleSetupMfa = () => {
    // Navigate to MFA setup page
    window.location.href = '/mfa-setup';
  };
  
  // Disable MFA
  const handleDisableMfa = () => {
    setMfaVerificationCode(['', '', '', '', '', '']);
    setMfaModalError('');
    setShowMfaModal(true);
  };
  
  // Handle MFA code input
  const handleMfaCodeChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newCode = [...mfaVerificationCode];
      newCode[index] = value;
      setMfaVerificationCode(newCode);
      
      // Auto focus next input
      if (value && index < 5) {
        const inputs = document.querySelectorAll('.mfa-input');
        if (inputs[index + 1]) {
          inputs[index + 1].focus();
        }
      }
    }
  };
  
  // Handle MFA code verification for disabling
  const verifyAndDisableMfa = async () => {
    try {
      setMfaModalError('');
      
      const code = mfaVerificationCode.join('');
      if (code.length !== 6) {
        setMfaModalError('Please enter all 6 digits');
        return;
      }
      
      setLoading(true);
      await disableMfa(code);
      
      // Update user state
      updateUser({ ...user, mfa_enabled: false });
      
      // Close modal
      setShowMfaModal(false);
      
      toast.success('Two-factor authentication disabled successfully');
    } catch (error) {
      console.error('Error disabling MFA:', error);
      setMfaModalError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };
  
  // Get random color for avatar
  const getRandomColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  };
  
  // Get user initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            <div className="mb-4 md:mb-0 md:mr-6">
              {editMode ? (
                <div className="relative w-32 h-32 rounded-full overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : user.profile_pic ? (
                    <img 
                      src={`http://localhost:5000${user.profile_pic}`} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white text-3xl"
                      style={{ backgroundColor: getRandomColor(user.name) }}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                  
                  <label className="absolute bottom-0 right-0 bg-primary-color text-white rounded-full p-2 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full overflow-hidden">
                  {user.profile_pic ? (
                    <img 
                      src={`http://localhost:5000${user.profile_pic}`} 
                      alt={user.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white text-3xl"
                      style={{ backgroundColor: getRandomColor(user.name) }}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-2xl font-bold mb-2">{user.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{user.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs font-medium">
                  {user.type === 'student' ? 'Student' : 
                   user.type === 'lecturer' ? 'Lecturer' : 
                   user.type === 'service_provider' ? 'Service Provider' : 
                   user.type === 'admin' ? 'Administrator' : 'User'}
                </span>
                
                {user.mfa_enabled && (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-medium">
                    2FA Enabled
                  </span>
                )}
              </div>
              
              <p className="text-sm mt-2">
                {user.bio || 'No bio available'}
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-2">
            {editMode ? (
              <>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90"
                >
                  Edit Profile
                </button>
                
                {user.mfa_enabled ? (
                  <button 
                    onClick={handleDisableMfa}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-opacity-90"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button 
                    onClick={handleSetupMfa}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-opacity-90"
                  >
                    Enable 2FA
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Profile Edit Form */}
        {editMode && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <input
                  type="text"
                  name="location"
                  value={profileData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              {user.type === 'service_provider' && (
                <>
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label>
                    <input
                      type="text"
                      name="business_name"
                      value={profileData.business_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Business Description</label>
                    <textarea
                      name="business_description"
                      value={profileData.business_description}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Business Hours</label>
                    <input
                      type="text"
                      name="business_hours"
                      value={profileData.business_hours}
                      onChange={handleChange}
                      placeholder="e.g. Mon-Fri: 9am-5pm, Sat: 10am-3pm"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </>
              )}
            </form>
          </div>
        )}
        
        {/* Profile Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'profile'
                  ? 'border-primary-color text-primary-color'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Profile
            </button>
            
            <button
              onClick={() => setActiveTab('listings')}
              className={`py-4 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'listings'
                  ? 'border-primary-color text-primary-color'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              My Listings
            </button>
            
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-4 px-1 font-medium text-sm border-b-2 ${
                activeTab === 'saved'
                  ? 'border-primary-color text-primary-color'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Saved Items
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'profile' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold mb-4">About Me</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                <p className="mb-2">
                  <strong className="text-gray-700 dark:text-gray-300">Email:</strong> {user.email}
                </p>
                {user.phone && (
                  <p className="mb-2">
                    <strong className="text-gray-700 dark:text-gray-300">Phone:</strong> {user.phone}
                  </p>
                )}
                {user.location && (
                  <p className="mb-2">
                    <strong className="text-gray-700 dark:text-gray-300">Location:</strong> {user.location}
                  </p>
                )}
              </div>
              
              {user.type === 'service_provider' && user.business_name && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Business Information</h3>
                  <p className="mb-2">
                    <strong className="text-gray-700 dark:text-gray-300">Business Name:</strong> {user.business_name}
                  </p>
                  {user.business_description && (
                    <p className="mb-2">
                      <strong className="text-gray-700 dark:text-gray-300">Description:</strong> {user.business_description}
                    </p>
                  )}
                  {user.business_hours && (
                    <p className="mb-2">
                      <strong className="text-gray-700 dark:text-gray-300">Business Hours:</strong> {user.business_hours}
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium mb-2">Account Security</h3>
                <p className="mb-2">
                  <strong className="text-gray-700 dark:text-gray-300">Two-Factor Authentication:</strong> {user.mfa_enabled ? 'Enabled' : 'Disabled'}
                </p>
                <p className="mb-2">
                  <strong className="text-gray-700 dark:text-gray-300">Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'listings' && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Listings</h2>
                <Link 
                  to="/create-listing" 
                  className="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90"
                >
                  Create New Listing
                </Link>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color"></div>
                </div>
              ) : myListings.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <p className="mb-4">You haven't created any listings yet.</p>
                  <Link 
                    to="/create-listing" 
                    className="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90 inline-block"
                  >
                    Create Your First Listing
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myListings.map((listing) => (
                    <div 
                      key={listing.id} 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
                        {listing.images && listing.images.length > 0 ? (
                          <img 
                            src={`http://localhost:5000${listing.images[0]}`} 
                            alt={listing.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center text-3xl text-white"
                            style={{ backgroundColor: getRandomColor(listing.title) }}
                          >
                            {getInitials(listing.title)}
                          </div>
                        )}
                        
                        {listing.status === 'pending' && (
                          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                            Pending Approval
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold">{listing.title}</h3>
                          <span className="text-hit-secondary font-semibold">${listing.price}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(listing.created_at).toLocaleDateString()}
                          </span>
                          
                          <div className="flex space-x-2">
                            <Link
                              to={`/edit-listing/${listing.id}`}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {activeTab === 'saved' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p>You haven't saved any listings yet.</p>
              <Link 
                to="/" 
                className="mt-4 px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90 inline-block"
              >
                Browse Listings
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* MFA Verification Modal */}
      {showMfaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Verify Authentication</h3>
            <p className="mb-4">Please enter the verification code from your authenticator app to disable 2FA.</p>
            
            <div className="mb-6">
              <div className="flex justify-center space-x-2 mb-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    className="mfa-input w-10 h-12 text-center text-xl font-medium border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={mfaVerificationCode[index]}
                    onChange={(e) => handleMfaCodeChange(index, e.target.value)}
                  />
                ))}
              </div>
              
              {mfaModalError && (
                <p className="text-center text-sm text-red-600 mb-4">{mfaModalError}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMfaModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              
              <button
                onClick={verifyAndDisableMfa}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Disable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;