import axios from 'axios';

const API_URL = '/api/v1';

// Create unified Axios client
export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for receiving/sending secure HttpOnly cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Access token holder (stored in memory for security)
let memoryAccessToken = null;
let clerkGetTokenFn = null;

export const setClerkGetToken = (fn) => {
  clerkGetTokenFn = fn;
};

export const setAccessToken = (token) => {
  memoryAccessToken = token;
  if (token) {
    localStorage.setItem('has_active_session', 'true');
  } else {
    localStorage.removeItem('has_active_session');
  }
};

export const getAccessToken = () => {
  return memoryAccessToken;
};

// Request Interceptor: Attach bearer token if present
apiClient.interceptors.request.use(
  async (config) => {
    let token = null;
    if (clerkGetTokenFn) {
      try {
        token = await clerkGetTokenFn();
      } catch (err) {
        console.error('Failed to retrieve Clerk token:', err);
      }
    }
    if (!token) {
      token = getAccessToken();
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 and try to refresh tokens automatically
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 error and request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh-token' || originalRequest.url === '/auth/login' || originalRequest.url === '/auth/sync') {
        // If the refresh token request itself is failing, we must force logout
        setAccessToken(null);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while token is being refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint to rotate tokens
        const response = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const { token: newAccessToken } = response.data;
        
        setAccessToken(newAccessToken);
        
        // Update authorization header of failed request
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);
        isRefreshing = false;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        setAccessToken(null);
        
        // Custom event to alert AuthProvider that user session has terminated
        window.dispatchEvent(new Event('auth_session_expired'));
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
