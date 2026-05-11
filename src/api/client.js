import axios from 'axios';

// Dynamic base URL for Axios
// Uses localhost:3000/api in development, and the environment variable in production
const baseURL = import.meta.env.DEV
    ? 'http://localhost:3000/api'
    : import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle 401 Unauthorized (Refresh token logic)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Avoid infinite loops by tagging retried requests
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token available');

                // Call the refresh endpoint
                const response = await axios.post(`${baseURL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                // Save new tokens
                localStorage.setItem('auth_token', accessToken);
                localStorage.setItem('refresh_token', newRefreshToken);

                // Update authorization header and retry original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);

            } catch (refreshError) {
                // Failed to refresh: clear local storage and redirect to login
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_data');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
