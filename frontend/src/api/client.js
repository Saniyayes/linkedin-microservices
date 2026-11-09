import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
const baseURL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const client = axios.create({
  baseURL,
  timeout: 35000 // 35-second timeout to handle free-tier cold starts without hanging indefinitely
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      error.friendlyMessage = 'Server took too long to respond. It may be waking up from free-tier sleep. Please retry.';
    } else if (error.response?.status === 502 || error.response?.status === 503) {
      error.friendlyMessage = 'Backend service is starting up on Render. Please wait ~20 seconds and retry.';
    } else if (error.response && error.response.status === 401) {
      // Token expired or invalid
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default client;
