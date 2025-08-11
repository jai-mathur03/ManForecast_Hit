import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      // Ensure token is stored in localStorage
      localStorage.setItem('token', action.payload.token);
      // Set axios default header immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${action.payload.token}`;
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Token validation helper
  const isTokenValid = (token) => {
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const isValid = payload.exp > currentTime;
      
      console.log('🔐 Token validation:', {
        expires: new Date(payload.exp * 1000),
        current: new Date(),
        valid: isValid
      });
      
      return isValid;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      return false;
    }
  };

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      console.log('🔍 Loading user on app start...', { hasToken: !!token });
      
      if (token && isTokenValid(token)) {
        try {
          // Set authorization header before making the request
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          console.log('📡 Fetching user profile...');
          const response = await axios.get('/api/auth/profile');
          
          console.log('✅ User profile loaded:', response.data);
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: response.data, token: token }
          });
        } catch (error) {
          console.error('❌ Failed to load user profile:', error);
          console.log('🚪 Logging out due to profile load failure');
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        console.log('❌ No valid token found, setting loading to false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, []);

  // Set up response interceptor for handling 401 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('📥 Axios response error:', error.response?.status, error.response?.data);
        
        if (error.response?.status === 401) {
          console.log('🚪 401 Unauthorized - logging out');
          dispatch({ type: 'LOGOUT' });
        }
        
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('🔑 Attempting login for:', email);
      
      const response = await axios.post('/api/auth/login', { email, password });
      
      console.log('✅ Login response:', response.data);
      
      if (response.data.token && response.data.user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
        return { success: true };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Check if user is authenticated with valid token
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const hasValidToken = token && isTokenValid(token);
    const hasUser = !!state.user;
    
    console.log('🔐 Authentication check:', {
      hasToken: !!token,
      tokenValid: hasValidToken,
      hasUser: hasUser,
      authenticated: hasValidToken && hasUser
    });
    
    return hasValidToken && hasUser;
  };

  const value = {
    ...state,
    login,
    logout,
    clearError,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
