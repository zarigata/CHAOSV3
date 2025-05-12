/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║      << C.H.A.O.S.V3 - CODEX >> AUTHENTICATION CORE       ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Authentication service for frontend-backend communication  ║
 * ║ Handles token management, user sessions, and API requests  ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

// CIPHER-X: Environment configuration and types
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/******************************************************************
 * OMEGA-MATRIX: USER QUANTUM IDENTITY SCHEMA
 * Complete user profile data structure with preferences
 * Defines all modifiable and system-managed user properties
 ******************************************************************/
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'brb' | 'phone' | 'lunch' | 'offline';
  statusMessage?: string;
  personalMessage?: string;
  customStatus?: string;
  preferences?: {
    isAnimated?: boolean;
    enableWinks?: boolean;
    theme?: string;
    language?: string;
    notifications?: {
      sound?: boolean;
      messagePreview?: boolean;
      friendRequests?: boolean;
    }
  }
}

// OMEGA-MATRIX: Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  loading: boolean;
  error: string | null;
}

// OMEGA-MATRIX: Token refresh scheduling
let refreshTimeout: NodeJS.Timeout | null = null;

// CIPHER-X: Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// CIPHER-X: Local storage keys
const TOKEN_KEY = 'chaosv3_token';
const REFRESH_TOKEN_KEY = 'chaosv3_refresh_token';
const EXPIRES_AT_KEY = 'chaosv3_expires_at';
const USER_KEY = 'chaosv3_user';

/**
 * CIPHER-X: Save authentication data to local storage
 * Securely stores tokens and user information
 */
const saveAuthData = (data: {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: User;
}) => {
  if (!isBrowser) return;
  
  // Store tokens and expiration
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  localStorage.setItem(EXPIRES_AT_KEY, data.expiresAt.toString());
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
};

/**
 * CIPHER-X: Clear authentication data from local storage
 * Removes all traces of the user session
 */
const clearAuthData = () => {
  if (!isBrowser) return;
  
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * CIPHER-X: Load authentication data from local storage
 * Retrieves stored session information if available
 */
export const loadAuthData = (): AuthState => {
  if (!isBrowser) {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      loading: false,
      error: null
    };
  }
  
  const token = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const expiresAtStr = localStorage.getItem(EXPIRES_AT_KEY);
  const userJson = localStorage.getItem(USER_KEY);
  
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr) : null;
  const user = userJson ? JSON.parse(userJson) as User : null;
  
  // Check if token is still valid
  const isAuthenticated = !!(token && expiresAt && expiresAt > Date.now());
  
  return {
    isAuthenticated,
    user,
    token,
    refreshToken,
    expiresAt,
    loading: false,
    error: null
  };
};

/******************************************************************
 * CIPHER-X: PROFILE MANAGEMENT PROTOCOL
 * Updates user profile data on the backend
 * Returns updated user data on success
 ******************************************************************/
export const updateProfile = async (
  profileData: Partial<User>,
  token: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (response.ok) {
      // Update the user data in local storage
      const currentData = loadAuthData();
      if (currentData.user) {
        const updatedUser = { ...currentData.user, ...data.user };
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      }

      return {
        success: true,
        user: data.user
      };
    } else {
      return {
        success: false,
        error: data.message || 'Failed to update profile.'
      };
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: 'Network error occurred while updating profile.'
    };
  }
};

/**
 * CIPHER-X: Register a new user
 * Creates a new account and establishes authenticated session
 */
export const register = async (userData: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}): Promise<AuthState> => {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to register');
    }
    
    // Save authentication data
    saveAuthData({
      token: data.data.token,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.expiresAt,
      user: data.data.user
    });
    
    // Schedule token refresh
    scheduleTokenRefresh(data.data.expiresAt);
    
    return {
      isAuthenticated: true,
      user: data.data.user,
      token: data.data.token,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.expiresAt,
      loading: false,
      error: null
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
};

/**
 * CIPHER-X: User login
 * Authenticates user credentials and establishes session
 */
export const login = async (credentials: {
  email: string;
  password: string;
}): Promise<AuthState> => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Invalid credentials');
    }
    
    // Save authentication data
    saveAuthData({
      token: data.data.token,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.expiresAt,
      user: data.data.user
    });
    
    // Schedule token refresh
    scheduleTokenRefresh(data.data.expiresAt);
    
    return {
      isAuthenticated: true,
      user: data.data.user,
      token: data.data.token,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.expiresAt,
      loading: false,
      error: null
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
};

/**
 * CIPHER-X: Refresh authentication token
 * Obtains a new access token using the refresh token
 */
export const refreshAuthToken = async (refreshToken: string): Promise<AuthState> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to refresh token');
    }
    
    // Get current user data
    const currentUser = localStorage.getItem(USER_KEY);
    const user = currentUser ? JSON.parse(currentUser) as User : null;
    
    if (!user) {
      throw new Error('User data not found');
    }
    
    // Update token information
    saveAuthData({
      token: data.data.token,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.expiresAt,
      user
    });
    
    // Schedule next token refresh
    scheduleTokenRefresh(data.data.expiresAt);
    
    return {
      isAuthenticated: true,
      user,
      token: data.data.token,
      refreshToken: data.data.refreshToken,
      expiresAt: data.data.expiresAt,
      loading: false,
      error: null
    };
  } catch (error) {
    // Clear auth data on refresh failure
    clearAuthData();
    
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      expiresAt: null,
      loading: false,
      error: error instanceof Error ? error.message : 'Token refresh failed'
    };
  }
};

/**
 * CIPHER-X: User logout
 * Terminates the user session both locally and on the server
 */
export const logout = async (token: string): Promise<void> => {
  try {
    // Cancel any scheduled token refresh
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    
    // Call logout API if we have a token
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local auth data
    clearAuthData();
  }
};

/**
 * CIPHER-X: Get current user profile
 * Retrieves the latest user data from the server
 */
export const getCurrentUser = async (token: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user profile');
    }
    
    // Update stored user data
    const currentAuthData = loadAuthData();
    if (currentAuthData.token && currentAuthData.refreshToken && currentAuthData.expiresAt) {
      saveAuthData({
        token: currentAuthData.token,
        refreshToken: currentAuthData.refreshToken,
        expiresAt: currentAuthData.expiresAt,
        user: data.data.user
      });
    }
    
    return data.data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * CIPHER-X: Schedule token refresh
 * Sets up automatic token refresh before expiration
 */
const scheduleTokenRefresh = (expiresAt: number) => {
  if (!isBrowser) return;
  
  // Clear any existing refresh timeout
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  
  // Calculate time until refresh (5 minutes before expiration)
  const timeUntilRefresh = expiresAt - Date.now() - 5 * 60 * 1000;
  
  // Only schedule if expiration is in the future
  if (timeUntilRefresh <= 0) return;
  
  // Schedule refresh
  refreshTimeout = setTimeout(async () => {
    const authData = loadAuthData();
    if (authData.refreshToken) {
      await refreshAuthToken(authData.refreshToken);
    }
  }, timeUntilRefresh);
};

/**
 * CIPHER-X: Initialize authentication
 * Sets up auth state on application load
 */
export const initializeAuth = (): AuthState => {
  const authData = loadAuthData();
  
  // If authenticated, schedule token refresh
  if (authData.isAuthenticated && authData.expiresAt) {
    scheduleTokenRefresh(authData.expiresAt);
  }
  
  return authData;
};

/**
 * CIPHER-X: Create authenticated fetch
 * Utility for making authenticated API requests
 */
export const authFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const authData = loadAuthData();
  
  if (!authData.token) {
    throw new Error('No authentication token available');
  }
  
  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${authData.token}`
  };
  
  // Make the request
  return fetch(url, {
    ...options,
    headers
  });
};
