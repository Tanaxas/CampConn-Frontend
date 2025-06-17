import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

import LogViewer from './LogViewer';
import { 
  getUsers, 
  updateUserStatus, 
  makeAdmin, 
  getPendingListings, 
  approveListing, 
  rejectListing,
  getAdminSettings,
  updateAdminSettings,
  getAdminStats
} from '../../services/api';

// Admin Dashboard Layout
const Dashboard = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Redirect to home if not admin
    if (!isAdmin) {
      toast.error('You are not authorized to access the admin panel');
      navigate('/');
    }
  }, [isAdmin, navigate]);
  
  // Get active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/stats')) return 'stats';
    if (path.includes('/admin/logs')) return 'logs';
    return 'listings';
  };
  
  const activeTab = getActiveTab();
  
  if (!isAdmin) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {/* Admin Nav Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <Link
              to="/admin"
              className={`inline-block py-4 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'listings'
                  ? 'text-primary-color border-primary-color'
                  : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Pending Listings
            </Link>
          </li>
          <li className="mr-2">
            <Link
              to="/admin/users"
              className={`inline-block py-4 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'users'
                  ? 'text-primary-color border-primary-color'
                  : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              User Management
            </Link>
          </li>
          <li className="mr-2">
            <Link
              to="/admin/settings"
              className={`inline-block py-4 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'settings'
                  ? 'text-primary-color border-primary-color'
                  : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Settings
            </Link>
          </li>
          <li className="mr-2">
            <Link
              to="/admin/stats"
              className={`inline-block py-4 px-4 text-sm font-medium text-center border-b-2 ${
                activeTab === 'stats'
                  ? 'text-primary-color border-primary-color'
                  : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Statistics
            </Link>
          </li>
          <li className="mr-2">
          <Link
            to="/admin/logs"
            className={`inline-block py-4 px-4 text-sm font-medium text-center border-b-2 ${
              activeTab === 'logs'
                ? 'text-primary-color border-primary-color'
                : 'text-gray-500 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              System Logs
            </div>
          </Link>
        </li>
        </ul>
      </div>
      
      {/* Admin Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <Routes>
          <Route path="/" element={<PendingListings />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/stats" element={<AdminStats />} />
          <Route path="/logs" element={<LogViewer />} />
        </Routes>
      </div>
    </div>
  );
};

// Pending Listings Component
const PendingListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch pending listings
  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        setLoading(true);
        const response = await getPendingListings();
        setListings(response.data.listings);
      } catch (error) {
        console.error('Error fetching pending listings:', error);
        toast.error('Failed to load pending listings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingListings();
  }, []);
  
  // Approve listing
  const handleApprove = async (id) => {
    try {
      await approveListing(id);
      
      // Remove from list
      setListings(prevListings => prevListings.filter(listing => listing.id !== id));
      
      toast.success('Listing approved successfully');
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error('Failed to approve listing');
    }
  };
  
  // Reject listing
  const handleReject = async (id) => {
    try {
      const reason = prompt('Enter reason for rejection (optional):');
      await rejectListing(id, reason || '');
      
      // Remove from list
      setListings(prevListings => prevListings.filter(listing => listing.id !== id));
      
      toast.success('Listing rejected successfully');
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast.error('Failed to reject listing');
    }
  };
  
  // Get random color
  const getRandomColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  };
  
  // Get initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format date
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  if (listings.length === 0) {
    return (
      <div className="text-center py-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-xl font-medium mb-2">No Pending Listings</h2>
        <p className="text-gray-600 dark:text-gray-400">All listings have been reviewed.</p>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pending Listings</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400">
        {listings.length} {listings.length === 1 ? 'listing' : 'listings'} waiting for approval
      </p>
      
      <div className="space-y-6">
        {listings.map(listing => (
          <div 
            key={listing.id} 
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
          >
            <div className="md:flex">
              <div className="md:w-1/4 h-48 bg-gray-200 dark:bg-gray-700 relative">
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
              </div>
              
              <div className="p-4 md:flex-1">
                <div className="mb-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold">{listing.title}</h3>
                    <span className="text-hit-secondary font-medium">${listing.price}</span>
                  </div>
                  
                  <div className="flex items-center mt-1 mb-2">
                    <span className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                      Pending
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Submitted: {formatDate(listing.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{listing.description}</p>
                  
                  <div className="flex items-center mb-4">
                    {listing.seller_profile_pic ? (
                      <img 
                        src={`http://localhost:5000${listing.seller_profile_pic}`} 
                        alt={listing.seller_name} 
                        className="w-8 h-8 rounded-full object-cover mr-2"
                      />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white mr-2"
                        style={{ backgroundColor: getRandomColor(listing.seller_name) }}
                      >
                        {getInitials(listing.seller_name)}
                      </div>
                    )}
                    
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {listing.seller_name}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(listing.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve
                  </button>
                  
                  <button
                    onClick={() => handleReject(listing.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                  
                  <Link
                    to={`/listings/${listing.id}`}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// User Management Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  
  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await getUsers();
        setUsers(response.data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Toggle user status
  const handleToggleStatus = async (userId, currentStatus) => {
    // Prevent deactivating self
    if (userId === currentUser.id && currentStatus) {
      toast.error('You cannot deactivate your own account');
      return;
    }
    
    try {
      await updateUserStatus(userId, currentStatus ? 0 : 1);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, active: currentStatus ? 0 : 1 } : user
        )
      );
      
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };
  
  // Make user admin
  const handleMakeAdmin = async (userId) => {
    try {
      await makeAdmin(userId);
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, type: 'admin' } : user
        )
      );
      
      toast.success('User promoted to admin successfully');
    } catch (error) {
      console.error('Error making user admin:', error);
      toast.error('Failed to promote user to admin');
    }
  };
  
  // Get user type display
  const getUserTypeDisplay = (type) => {
    switch (type) {
      case 'student': return 'Student';
      case 'lecturer': return 'Lecturer';
      case 'service_provider': return 'Service Provider';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };
  
  // Get user type class
  const getUserTypeClass = (type) => {
    switch (type) {
      case 'student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'lecturer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'service_provider': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Get random color
  const getRandomColor = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
  };
  
  // Get initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">User Management</h2>
      
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.profile_pic ? (
                      <img src={`http://localhost:5000${user.profile_pic}`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: getRandomColor(user.name) }}
                      >
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getUserTypeClass(user.type)}`}>
                    {getUserTypeDisplay(user.type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.active === 1
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {user.active === 1 ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.active === 1)}
                    className={`mr-2 px-3 py-1 rounded text-white ${
                      user.active === 1
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                    disabled={user.id === currentUser.id && user.active === 1}
                  >
                    {user.active === 1 ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  {user.type !== 'admin' && (
                    <button
                      onClick={() => handleMakeAdmin(user.id)}
                      className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      Make Admin
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Admin Settings Component
const AdminSettings = () => {
  const [settings, setSettings] = useState({
    require_listing_approval: true,
    require_mfa: false,
    allowed_categories: 'Textbooks,Electronics,Services,Accommodation,Other'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await getAdminSettings();
        
        setSettings(response.data.settings);
        setCategories(response.data.settings.allowed_categories.split(','));
      } catch (error) {
        console.error('Error fetching admin settings:', error);
        toast.error('Failed to load admin settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Handle setting change
  const handleSettingChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Add category
  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    
    if (categories.includes(newCategory.trim())) {
      toast.error('This category already exists');
      return;
    }
    
    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    setSettings(prev => ({
      ...prev,
      allowed_categories: updatedCategories.join(',')
    }));
    setNewCategory('');
  };
  
  // Remove category
  const handleRemoveCategory = (index) => {
    if (index < 5) {
      toast.error('Cannot remove default categories');
      return;
    }
    
    const updatedCategories = [...categories];
    updatedCategories.splice(index, 1);
    setCategories(updatedCategories);
    setSettings(prev => ({
      ...prev,
      allowed_categories: updatedCategories.join(',')
    }));
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await updateAdminSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Admin Settings</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">System Preferences</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="require_listing_approval"
                name="require_listing_approval"
                checked={settings.require_listing_approval === 1}
                onChange={handleSettingChange}
                className="w-4 h-4 text-primary-color border-gray-300 rounded dark:border-gray-600"
              />
              <label htmlFor="require_listing_approval" className="ml-2 text-gray-700 dark:text-gray-300">
                Require admin approval for new listings
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="require_mfa"
                name="require_mfa"
                checked={settings.require_mfa === 1}
                onChange={handleSettingChange}
                className="w-4 h-4 text-primary-color border-gray-300 rounded dark:border-gray-600"
              />
              <label htmlFor="require_mfa" className="ml-2 text-gray-700 dark:text-gray-300">
                Require two-factor authentication for all users
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-4">Listing Categories</h3>
          
          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <div 
                key={index} 
                className="flex items-center bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full"
              >
                <span className="text-gray-800 dark:text-gray-200">{category}</span>
                {index >= 5 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 bg-primary-color text-white rounded-r-lg hover:bg-opacity-90"
            >
              Add
            </button>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-primary-color text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Stats Component
const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getAdminStats();
        setStats(response.data.stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-color"></div>
      </div>
    );
  }
  
  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Failed to load statistics</p>
      </div>
    );
  }
  
  // Get random color
  const getRandomColor = (index) => {
    const colors = [
      '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', 
      '#F59E0B', '#10B981', '#3B82F6', '#6366F1'
    ];
    return colors[index % colors.length];
  };
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Site Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-lg font-medium mb-2">Total Users</h3>
          <p className="text-3xl font-bold">{stats.users}</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-lg font-medium mb-2">Active Listings</h3>
          <p className="text-3xl font-bold">{stats.listings}</p>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white">
          <h3 className="text-lg font-medium mb-2">Pending Listings</h3>
          <p className="text-3xl font-bold">{stats.pendingListings}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Category Distribution</h3>
          
          {stats.categories.length > 0 ? (
            <div className="space-y-4">
              {stats.categories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span>{category.category}</span>
                    <span>{category.count} listings</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full" 
                      style={{ 
                        width: `${Number(category.count / stats.listings * 100).toFixed(1)}%`,
                        backgroundColor: getRandomColor(index)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No category data available</p>
          )}
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Latest Listings</h4>
              {stats.recentListings.length > 0 ? (
                <ul className="space-y-2">
                  {stats.recentListings.map((listing, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-sm">{listing.title}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ${listing.price} • {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No recent listings</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium mb-2">New Users</h4>
              {stats.newUsers.length > 0 ? (
                <ul className="space-y-2">
                  {stats.newUsers.map((user, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No new users</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;