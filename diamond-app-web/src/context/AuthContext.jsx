import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axiosConfig'; // Import our central API client

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error initializing auth from localStorage:", error);
      localStorage.clear();
      setToken(null);
      setUser(null);
      delete apiClient.defaults.headers.common['Authorization'];
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    delete apiClient.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ## --- THIS IS THE NEW FUNCTION --- ##
  /**
   * Updates the user object in both React state and localStorage.
   * @param {object} newUserData - The new user data object from the API.
   */
  const updateUser = (newUserData) => {
    // 1. Merge new data with old data, in case the API only returns some fields
    const updatedUser = { ...user, ...newUserData };
    
    // 2. Update the React state immediately
    setUser(updatedUser);
    
    // 3. Update localStorage so it's correct on next page load
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // ## --- ADD 'updateUser' TO THE VALUE --- ##
  const value = { user, token, isLoading, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};