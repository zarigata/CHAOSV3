// ==========================================================
// 🌐 C.H.A.O.S. API CLIENT SYSTEM 🌐
// ==========================================================
// - AXIOS-BASED HTTP CLIENT WITH INTERCEPTORS
// - JWT TOKEN MANAGEMENT
// - ERROR HANDLING AND RETRY MECHANISM
// - CROSS-PLATFORM REQUEST HANDLING
// ==========================================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL } from './constants';

// Create Axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ==========================================================
// 🔑 AUTHENTICATION TOKEN MANAGEMENT
// ==========================================================

/**
 * Set the authentication token for all future requests
 * @param token JWT token
 */
export const setAuthToken = (token: string): void => {
  if (token) {
    // Set token in axios instance
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Also store in localStorage for potential platform-specific handling
    localStorage.setItem('auth_token', token);
  }
};

/**
 * Remove authentication token
 */
export const removeAuthToken = (): void => {
  // Remove from axios instance
  delete apiClient.defaults.headers.common['Authorization'];
  
  // Remove from localStorage
  localStorage.removeItem('auth_token');
};

// Try to initialize with token from storage on load
const initializeToken = (): void => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    setAuthToken(token);
  }
};

// Initialize on module load
initializeToken();

// ==========================================================
// 🔄 REQUEST INTERCEPTORS
// ==========================================================

apiClient.interceptors.request.use(
  (config) => {
    // You can modify requests here before they are sent
    // For example, add timestamps, logging, etc.
    return config;
  },
  (error) => {
    // Handle request errors
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// ==========================================================
// 🔄 RESPONSE INTERCEPTORS
// ==========================================================

apiClient.interceptors.response.use(
  (response) => {
    // You can modify successful responses here
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          
          // Update token for future requests
          setAuthToken(accessToken);
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          }
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If token refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        
        // Clear tokens
        removeAuthToken();
        localStorage.removeItem('refreshToken');
        
        // Can't directly navigate here, but can publish an event
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'session_expired' }
        }));
      }
    }
    
    // Format error for consistent handling
    const formattedError = {
      message: error.response?.data?.message || 'An unexpected error occurred',
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    };
    
    return Promise.reject(formattedError);
  }
);

// ==========================================================
// 📦 TYPED API REQUEST METHODS
// ==========================================================

/**
 * GET request with type safety
 * @param url Endpoint URL
 * @param config Axios request config
 * @returns Promise with response data
 */
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.get(url, config);
  return response.data;
};

/**
 * POST request with type safety
 * @param url Endpoint URL
 * @param data Request body
 * @param config Axios request config
 * @returns Promise with response data
 */
export const post = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, data, config);
  return response.data;
};

/**
 * PUT request with type safety
 * @param url Endpoint URL
 * @param data Request body
 * @param config Axios request config
 * @returns Promise with response data
 */
export const put = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.put(url, data, config);
  return response.data;
};

/**
 * DELETE request with type safety
 * @param url Endpoint URL
 * @param config Axios request config
 * @returns Promise with response data
 */
export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.delete(url, config);
  return response.data;
};

// Export the axios instance for direct use if needed
export default apiClient;
