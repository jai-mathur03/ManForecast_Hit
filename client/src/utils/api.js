import axios from 'axios';

// Set base URL for all axios requests
axios.defaults.baseURL = 'http://localhost:5000';

// Only set request interceptor for adding token
// (Auth error handling is now in AuthContext)
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 Adding token to request:', config.url);
    } else {
      console.log('⚠️ No token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    console.error('📤 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

export default axios;
