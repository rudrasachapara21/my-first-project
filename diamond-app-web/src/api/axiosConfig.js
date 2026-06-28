import axios from 'axios';

// AUTO-DETECT: Uses localhost when testing, and Render when built.
const BASE_URL = import.meta.env.VITE_API_URL || 'https://diamond-connect-backend.onrender.com';

const apiClient = axios.create({
    baseURL: BASE_URL,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        
        const originalRequest = error.config;

        // Handle JWT expiry with auto-refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
                        refreshToken: refreshToken
                    });
                    
                    const { token } = response.data;
                    localStorage.setItem('token', token);
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails, clear local storage and force login
                localStorage.clear();
                window.location.href = '#/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// ✅ CRITICAL FIX: Export the client so other files can use it
export default apiClient;