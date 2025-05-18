// ==========================================================
// 🔑 C.H.A.O.S. LOGIN PAGE COMPONENT 🔑
// ==========================================================
// - MSN MESSENGER INSPIRED LOGIN INTERFACE
// - SECURE AUTHENTICATION FLOW
// - ANIMATED TRANSITIONS AND EFFECTS
// - CROSS-PLATFORM COMPATIBILITY LAYER
// ==========================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Hooks and Utilities
import { useAuthStore } from '@/store/auth-store';

export function LoginPage() {
  // Form state
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Auth state from store
  const { login, isLoading, error, clearError } = useAuthStore();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!emailOrUsername || !password) {
      return;
    }
    
    await login(emailOrUsername, password);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="msn-login-form"
    >
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-msn-primary">Sign In</h2>
        <p className="text-sm text-muted-foreground">Welcome back to C.H.A.O.S.</p>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email/Username input */}
        <div className="space-y-2">
          <label htmlFor="emailOrUsername" className="text-sm font-medium">
            Email or Username
          </label>
          <input
            id="emailOrUsername"
            type="text"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-msn-primary focus:outline-none focus:ring-2 focus:ring-msn-primary/20"
            placeholder="Enter your email or username"
            required
            autoFocus
          />
        </div>

        {/* Password input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-msn-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-msn-primary focus:outline-none focus:ring-2 focus:ring-msn-primary/20"
            placeholder="Enter your password"
            required
          />
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-msn-primary focus:ring-msn-primary/20"
          />
          <label
            htmlFor="rememberMe"
            className="ml-2 block text-sm text-muted-foreground"
          >
            Remember me
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-msn-primary py-2 text-sm font-medium text-white transition-colors hover:bg-msn-primary/90 focus:outline-none focus:ring-2 focus:ring-msn-primary/20 disabled:opacity-70"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Register link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link to="/register" className="text-msn-primary hover:underline">
            Sign up
          </Link>
        </div>
      </form>

      {/* MSN-style decorative element */}
      <div className="mt-6 text-center">
        <span className="inline-block text-xs text-muted-foreground">
          <span className="msn-wink text-lg">😉</span> Bringing back the nostalgia
        </span>
      </div>
    </motion.div>
  );
}
