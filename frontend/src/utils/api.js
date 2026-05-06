import axios from 'axios';

// Determine the API base URL
// In production this MUST be set as VITE_API_URL in Cloudflare Pages env vars
const BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:5001/api' : null);

if (!BASE_URL) {
  console.error('VITE_API_URL is not set. API calls will fail.');
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30s timeout for Render cold starts
});

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('otms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
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
