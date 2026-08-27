import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('verifyle_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 (expired token)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('verifyle_token');
      localStorage.removeItem('verifyle_user');
      // Only redirect if not already on auth page
      if (!window.location.pathname.startsWith('/login') && 
          !window.location.pathname.startsWith('/register') &&
          !window.location.pathname.startsWith('/verify-otp')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
