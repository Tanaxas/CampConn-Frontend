import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await getCurrentUser();
          setUser(response.data.user);
          
          // Connect to socket
          connectSocket(response.data.user.id);
        } catch (err) {
          console.error('Auth check error:', err);
          localStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
    
    // Cleanup
    return () => {
      disconnectSocket();
    };
  }, []);
  
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    connectSocket(userData.id);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    disconnectSocket();
    setUser(null);
  };
  
  const updateUser = (userData) => {
    setUser(userData);
  };
  
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.type === 'admin'
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};