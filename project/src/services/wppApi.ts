import axios from 'axios';
import { getAuthToken } from '../lib/authService';
import env from '../config/env';

// Determine Base URL. The backend runs on port 3333/3000 usually.
// If VITE_API_BASE is set, use it. Otherwise fallback to localhost.
// Note: server.js routes are at root, not /api.
const BASE_URL = env.API_BASE || 'http://localhost:3333';

const wppApi = axios.create({
    baseURL: BASE_URL,
    timeout: 30000, // WhatsApp operations can be slow
});

wppApi.interceptors.request.use(
    async (config) => {
        const token = await getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling if needed
wppApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // Optional: Handle 401 Unauthorized globally
        if (error.response?.status === 401) {
            console.warn('WPP API Unauthorized. Token might be expired.');
        }
        return Promise.reject(error);
    }
);

export default wppApi;
