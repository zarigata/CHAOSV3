// ==========================================================
// 🔐 C.H.A.O.S. AUTHENTICATION STATE MANAGEMENT 🔐
// ==========================================================
// - ZUSTAND STATE MANAGEMENT FOR AUTH
// - JWT TOKEN HANDLING WITH REFRESH MECHANISM
// - PERSISTENT LOGIN WITH SECURE STORAGE
// - CROSS-PLATFORM COMPATIBILITY LAYER
// ==========================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/constants';

// Token management utility
import { setAuthToken, removeAuthToken } from '@/lib/api-client';

// User interface
interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

// Auth store state
interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateProfile: (data: Partial<User>) => void;
}

// Create auth store with persistence
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      
      // Login action
      login: async (emailOrUsername: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            emailOrUsername,
            password,
          });
          
          const { user, accessToken, refreshToken } = response.data;
          
          // Set token in axios headers
          setAuthToken(accessToken);
          
          // Update state with user data
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          // Store refresh token in localStorage
          localStorage.setItem('refreshToken', refreshToken);
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to login. Please try again.';
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          
          console.error('Login error:', error);
        }
      },
      
      // Register action
      register: async (email: string, username: string, password: string, displayName?: string) => {
        try {
          set({ isLoading: true, error: null });
          
          await axios.post(`${API_BASE_URL}/auth/register`, {
            email,
            username,
            password,
            displayName,
          });
          
          // Auto login after successful registration
          await get().login(username, password);
          
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage,
          });
          
          console.error('Registration error:', error);
        }
      },
      
      // Logout action
      logout: () => {
        // Get refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Call logout endpoint if refresh token exists
        if (refreshToken) {
          axios.post(`${API_BASE_URL}/auth/logout`, { refreshToken })
            .catch(error => console.error('Logout API error:', error));
        }
        
        // Clear all auth data
        removeAuthToken();
        localStorage.removeItem('refreshToken');
        
        // Reset state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },
      
      // Check authentication status
      checkAuth: async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Skip if no refresh token
        if (!refreshToken) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }
        
        try {
          set({ isLoading: true });
          
          // Attempt to refresh token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          
          // Set new token
          setAuthToken(accessToken);
          
          // Get user profile with new token
          const userResponse = await axios.get(`${API_BASE_URL}/auth/me`);
          
          set({
            user: userResponse.data,
            isAuthenticated: true,
            isLoading: false,
          });
          
        } catch (error) {
          console.error('Auth check failed:', error);
          
          // Clear invalid auth data
          removeAuthToken();
          localStorage.removeItem('refreshToken');
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
      
      // Clear error state
      clearError: () => {
        set({ error: null });
      },
      
      // Update user profile data
      updateProfile: (data: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;
        
        set({
          user: {
            ...currentUser,
            ...data,
          },
        });
      },
    }),
    {
      name: 'chaos-auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
