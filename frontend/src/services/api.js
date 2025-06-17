import axios from 'axios';

const API_URL = 'http://localhost:5000/api';


// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});




// request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Remove token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const login = (email, password) => {
  return api.post('/users/login', { email, password });
};

export const register = (userData) => {
  return api.post('/users/register', userData);
};

export const verifyMfa = (email, code) => {
  return api.post('/users/verify-mfa', { email, code });
};

export const getCurrentUser = () => {
  return api.get('/users/me');
};

// User profile services
export const updateProfile = (userData) => {
  const formData = new FormData();
  
  Object.keys(userData).forEach(key => {
    if (userData[key] !== null && userData[key] !== undefined) {
      formData.append(key, userData[key]);
    }
  });
  
  return api.put('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const changePassword = (currentPassword, newPassword) => {
  return api.put('/users/change-password', { currentPassword, newPassword });
};

export const setupMfa = () => {
  return api.post('/users/setup-mfa');
};

export const enableMfa = (code) => {
  return api.post('/users/enable-mfa', { code });
};

export const disableMfa = (code) => {
  return api.post('/users/disable-mfa', { code });
};

export const getUserById = (id) => {
  return api.get(`/users/${id}`);
};

// Listings services
export const getListings = (params) => {
  return api.get('/listings', { params });
};

export const getListing = (id) => {
  return api.get(`/listings/${id}`);
};

export const createListing = (listingData) => {
  const formData = new FormData();
  
  // Add text fields
  Object.keys(listingData).forEach(key => {
    if (key !== 'images' && listingData[key] !== null && listingData[key] !== undefined) {
      formData.append(key, listingData[key]);
    }
  });
  
  // Add images
  if (listingData.images && listingData.images.length > 0) {
    listingData.images.forEach(image => {
      formData.append('listing_images', image);
    });
  }
  
  return api.post('/listings', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

export const updateListing = (id, listingData, replaceImages = false) => {
  const formData = new FormData();
  
  // Add text fields
  Object.keys(listingData).forEach(key => {
    if (key !== 'images' && listingData[key] !== null && listingData[key] !== undefined) {
      formData.append(key, listingData[key]);
    }
  });
  
  // Add replace_images flag
  formData.append('replace_images', replaceImages.toString());
  
  // Add images
  if (listingData.images && listingData.images.length > 0) {
    listingData.images.forEach(image => {
      if (image instanceof File) {
        formData.append('listing_images', image);
      }
    });
  }
  
  return api.put(`/listings/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};


export const registerInitiate = (userData) => {
  return api.post('/users/register-initiate', userData);
};

export const registerComplete = (email, otp) => {
  return api.post('/users/register-complete', { email, otp });
};

export const resendOtp = (email, type = 'registration') => {
  return api.post('/users/resend-otp', { email, type });
};

export const deleteListing = (id) => {
  return api.delete(`/listings/${id}`);
};

export const getMyListings = () => {
  return api.get('/listings/user/me');
};

export const getListingsBySeller = (sellerId) => {
  return api.get(`/listings/seller/${sellerId}`);
};

// Messaging services
export const getConversations = () => {
  return api.get('/messages/conversations');
};

export const getMessages = (conversationId) => {
  return api.get(`/messages/conversations/${conversationId}`);
};

export const sendMessage = async (conversationId, text) => {
  try {
    const response = await api.post(`/messages/conversations/${conversationId}`, { text });
    return response.data;
  } catch (error) {
    console.error('API sendMessage error:', error);
    throw error;
  }
};

export const startConversation = (recipientId, initialMessage) => {
  // Make sure recipientId is a number
  const payload = {
    recipientId: parseInt(recipientId, 10),
    initialMessage
  };
  
  console.log("API startConversation payload:", payload);
  return api.post('/messages/conversations', payload);
};

export const getUnreadCount = () => {
  return api.get('/messages/unread');
};

// Admin services
export const getUsers = () => {
  return api.get('/admin/users');
};

export const updateUserStatus = (userId, active) => {
  return api.put(`/admin/users/${userId}/status`, { active });
};

export const makeAdmin = (userId) => {
  return api.put(`/admin/users/${userId}/make-admin`);
};

export const getPendingListings = () => {
  return api.get('/admin/listings/pending');
};

export const approveListing = (id) => {
  return api.put(`/admin/listings/${id}/approve`);
};

export const rejectListing = (id, reason) => {
  return api.put(`/admin/listings/${id}/reject`, { reason });
};

export const getAdminSettings = () => {
  return api.get('/admin/settings');
};

export const updateAdminSettings = (settings) => {
  return api.put('/admin/settings', settings);
};

export const getAdminStats = () => {
  return api.get('/admin/stats');
};

// Admin logs
export const getLogs = (params) => {
  return api.get('/admin/logs', { params });
};

export const getLogStats = () => {
  return api.get('/admin/logs/stats');
};

export const exportLogs = (params) => {
  const queryString = new URLSearchParams(params).toString();
  return `${api.defaults.baseURL}/admin/logs/export?${queryString}`;
};

// Listing reviews
export const getListingReviews = (listingId) => {
  return api.get(`/listings/${listingId}/reviews`);
};

export const addListingReview = (listingId, reviewData) => {
  return api.post(`/listings/${listingId}/reviews`, reviewData);
};




// Export the axios instance for custom requests
export default api;