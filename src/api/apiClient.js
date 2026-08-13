import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const API_URL = API_BASE ? `${API_BASE}/api/v1` : '/api/v1';

// Create unified Axios client with 10s default timeout
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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

// Request Interceptor: Attach bearer token if present (with 300ms max timeout for Clerk)
apiClient.interceptors.request.use(
  async (config) => {
    let token = null;
    if (clerkGetTokenFn) {
      try {
        const tokenPromise = clerkGetTokenFn();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Clerk token timeout')), 300)
        );
        token = await Promise.race([tokenPromise, timeoutPromise]);
      } catch (err) {
        // Silent catch: if Clerk token takes >300ms or fails, fallback immediately to local token
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
        // If the refresh token request itself is failing, force logout reset
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
        const res = await apiClient.post('/auth/refresh-token');
        const newToken = res.data.token;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
