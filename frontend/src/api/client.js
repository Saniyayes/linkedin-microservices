import axios from 'axios';

// In local dev, VITE_API_BASE_URL is unset and requests go through the Vite
// proxy (see vite.config.js). In a deployed build, this must point at the
// real API gateway URL - set as a build-time env var in Amplify.
const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
