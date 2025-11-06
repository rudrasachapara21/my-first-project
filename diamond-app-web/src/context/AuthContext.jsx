import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axiosConfig'; // Import our central API client

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  // Start isLoading as true
  const [isLoading, setIsLoading] = useState(true);

  // This effect checks for a saved session when the app loads
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        // 1. Set the token in state
        setToken(storedToken);
        
        // 2. Set the token in axios for all future requests
        // This is the fix for initial page loads
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // 3. Set the user in state
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error initializing auth from localStorage:", error);
      // If error, clear everything
      localStorage.clear();
      setToken(null);
      setUser(null);
      delete apiClient.defaults.headers.common['Authorization'];
    } finally {
      // Whether we succeeded or failed, we are done loading.
      setIsLoading(false);
    }
  }, []); // Empty dependency array means this runs only once on app start

  const login = async (email, password, role) => {
    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      
      const { token, user: userData } = response.data;

      if (token && userData) {
        if (role && userData.role !== role) {
          throw new Error(`You are registered as a '${userData.role}', not a '${role}'.`);
        }
        
        setToken(token);
        setUser(userData);
        // Also set the token in axios headers *during* login
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        return { success: true, user: userData };
      }
      throw new Error('Invalid server response.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed.';
      return { success: false, message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    // Also remove the token from axios headers *during* logout
    delete apiClient.defaults.headers.common['Authorization'];

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = { user, token, isLoading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};