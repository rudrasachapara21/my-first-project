import axios from 'axios';

// Create a new Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// This interceptor ADDS the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- THE FIX: This new interceptor CHECKS every response ---
apiClient.interceptors.response.use(
  // If the response is successful (e.g., status 200), just return it
  (response) => {
    return response;
  },
  // If the response has an error...
  (error) => {
    // Check if the error is a 401 Unauthorized error
    if (error.response && error.response.status === 401) {
      // If it is, the token is invalid or expired.
      console.log('Stale or invalid token detected. Logging out.');
      
      // 1. Clear the bad credentials from storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 2. Redirect the user to the login page
      // We use window.location.href for a hard redirect to clear all app state.
      window.location.href = '/login';
    }
    
    // For any other error, just pass it along
    return Promise.reject(error);
  }
);


export default apiClient;