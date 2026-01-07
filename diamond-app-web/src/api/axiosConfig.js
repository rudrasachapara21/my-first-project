import axios from 'axios';

// ✅ AUTO-DETECT: Uses localhost when testing, and Render when built.
const BASE_URL = import.meta.env.VITE_API_URL || 'https://diamond-connect-backend.onrender.com';

const apiClient = axios.create({
  baseURL: BASE_URL,
});
import { showLoader, hideLoader } from '../utils/loaderService';

apiClient.interceptors.request.use(
  (config) => {
    // Start global loader for all requests
    try { showLoader(); } catch (e) {}
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Hide loader for responses and errors
    try { hideLoader(); } catch (e) {}
    const originalRequest = error.config;
    
    // Handle JWT expiry with auto-refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
            refreshToken: refreshToken
          });
          
          const { token } = response.data;
          localStorage.setItem('token', token);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.log('Token refresh failed, logging out.');
      }
      
      // If refresh fails or no refresh token, logout gracefully
      console.log('JWT expired and refresh failed. Initiating graceful logout.');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;