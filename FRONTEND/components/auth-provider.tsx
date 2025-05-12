/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║    << C.H.A.O.S.V3 - CODEX >> AUTHENTICATION PROVIDER     ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Global authentication state manager using React Context    ║
 * ║ Provides login, register, and session management          ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { 
  AuthState, 
  User, 
  initializeAuth, 
  login as loginApi, 
  register as registerApi,
  logout as logoutApi,
  getCurrentUser,
  refreshAuthToken,
  updateProfile as updateProfileApi
} from '@/lib/auth'

/******************************************************************
 * CIPHER-X: QUANTUM AUTHENTICATION INTERFACE
 * Defines all available authentication operations
 * Provides strong typing for auth context consumers
 ******************************************************************/
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  setError: (error: string | null) => void;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
}

// OMEGA-MATRIX: Create authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// CIPHER-X: Provider component for authentication state
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // OMEGA-MATRIX: Initialize state from local storage or defaults
  const [authState, setAuthState] = useState<AuthState>(() => ({
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    expiresAt: null,
    loading: true,
    error: null
  }))

  // CIPHER-X: Initialize authentication on component mount
  useEffect(() => {
    const initialState = initializeAuth()
    setAuthState({
      ...initialState,
      loading: false
    })
    
    // Refresh user data if authenticated
    if (initialState.isAuthenticated && initialState.token) {
      getCurrentUser(initialState.token)
        .then(user => {
          if (user) {
            setAuthState(prev => ({
              ...prev,
              user
            }))
          }
        })
        .catch(console.error)
    }
  }, [])
  
  // CIPHER-X: Handle authentication errors
  const setError = useCallback((error: string | null) => {
    setAuthState(prev => ({ ...prev, error }))
  }, [])
  
  // CIPHER-X: Update user profile information
  const updateUser = useCallback((user: User) => {
    setAuthState(prev => ({ ...prev, user }))
  }, [])
  
  // OMEGA-MATRIX: User registration handler
  const register = useCallback(async (
    username: string, 
    email: string, 
    password: string, 
    displayName?: string
  ): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await registerApi({ username, email, password, displayName })
      
      setAuthState({
        ...result,
        loading: false
      })
      
      return result.isAuthenticated
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      }))
      return false
    }
  }, [])
  
  // OMEGA-MATRIX: User login handler
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await loginApi({ email, password })
      
      setAuthState({
        ...result,
        loading: false
      })
      
      return result.isAuthenticated
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }))
      return false
    }
  }, [])
  
  // OMEGA-MATRIX: User logout handler
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (authState.token) {
        await logoutApi(authState.token)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        expiresAt: null,
        loading: false,
        error: null
      })
    }
  }, [authState.token])
  
  /******************************************************************
   * OMEGA-MATRIX: PROFILE UPDATE PROTOCOL
   * Updates user profile data via authenticated API
   * Synchronizes local user state with backend
   ******************************************************************/
  const updateProfile = useCallback(async (profileData: Partial<User>): Promise<boolean> => {
    if (!authState.token) return false
    
    try {
      // Clear any previous errors
      setAuthState(prev => ({
        ...prev,
        error: null
      }))
      
      // Call the API to update the profile
      const result = await updateProfileApi(profileData, authState.token)
      
      if (result.success) {
        // Update the local state with the new user data
        setAuthState(prev => ({
          ...prev,
          user: {
            ...prev.user!,
            ...result.user
          }
        }))
        return true
      } else {
        setAuthState(prev => ({
          ...prev,
          error: result.error || 'Failed to update profile'
        }))
        return false
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: 'Network error occurred while updating profile'
      }))
      return false
    }
  }, [authState.token])
  
  // CIPHER-X: Context provider value with all state and actions
  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUser,
    setError,
    updateProfile
  }

  // CIPHER-X: Provide authentication context to child components
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// CIPHER-X: Custom hook for accessing authentication state
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
