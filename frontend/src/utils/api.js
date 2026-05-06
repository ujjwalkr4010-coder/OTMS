import axios from 'axios';

// Production URL — fallback if VITE_API_URL is not set in build
const PROD_URL = 'https://otms-backend.onrender.com/api';
const DEV_URL  = 'http://localhost:5001/api';

const BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? DEV_URL : PROD_URL);

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('otms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('otms_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

