// ==========================================================
// 👤 C.H.A.O.S. REGISTRATION PAGE COMPONENT 👤
// ==========================================================
// - MSN MESSENGER INSPIRED SIGN-UP INTERFACE
// - SECURE USER ACCOUNT CREATION FLOW
// - CLIENT-SIDE VALIDATION WITH ERROR HANDLING
// - CROSS-PLATFORM COMPATIBILITY LAYER
// ==========================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Hooks and Utilities
import { useAuthStore } from '@/store/auth-store';
import { MIN_PASSWORD_LENGTH } from '@/lib/constants';

export function RegisterPage() {
  // Form state
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Validation state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Auth state from store
  const { register, isLoading, error, clearError } = useAuthStore();

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Email validation
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email is invalid';
    }
    
    // Username validation
    if (!username) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
      errors.password = 'Password must include uppercase, lowercase, number and special character';
    }
    
    // Confirm password validation
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms agreement validation
    if (!agreeTerms) {
      errors.agreeTerms = 'You must agree to the terms and conditions';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Submit registration
    await register(email, username, password, displayName || undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="msn-login-form overflow-auto"
    >
      <div className="mb-4 text-center">
        <h2 className="text-xl font-bold text-msn-primary">Create Account</h2>
        <p className="text-sm text-muted-foreground">Join the C.H.A.O.S. community</p>
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

      {/* Registration form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email input */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full rounded-md border ${
              formErrors.email ? 'border-destructive' : 'border-input'
            } bg-background px-3 py-2 text-sm focus:border-msn-primary focus:outline-none focus:ring-2 focus:ring-msn-primary/20`}
            placeholder="example@email.com"
            required
          />
          {formErrors.email && (
            <p className="text-xs text-destructive">{formErrors.email}</p>
          )}
        </div>

        {/* Username input */}
        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full rounded-md border ${
              formErrors.username ? 'border-destructive' : 'border-input'
            } bg-background px-3 py-2 text-sm focus:border-msn-primary focus:outline-none focus:ring-2 focus:ring-msn-primary/20`}
            placeholder="cooluser123"
            required
          />
          {formErrors.username && (
            <p className="text-xs text-destructive">{formErrors.username}</p>
          )}
        </div>

        {/* Display Name input (optional) */}
        <div className="space-y-1">
          <label htmlFor="displayName" className="text-sm font-medium">
            Display Name <span className="text-xs text-muted-foreground">(optional)</span>
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-msn-primary focus:outline-none focus:ring-2 focus:ring-msn-primary/20"
            placeholder="Your preferred name"
          />
        </div>

        {/* Password input */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full rounded-md border ${
              formErrors.password ? 'border-destructive' : 'border-input'
            } bg-background px-3 py-2 text-sm focus:border-msn-primary focus:outline-none focus:ring-2 focus:ring-msn-primary/20`}
            placeholder="Create a secure password"
            required
          />
          {formErrors.password && (
            <p className="text-xs text-destructive">{formErrors.password}</p>
          )}
        </div>

        {/* Confirm Password input */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full rounded-md border ${
              formErrors.confirmPassword ? 'border-destructive' : 'border-input'
            } bg-background px-3 py-2 text-sm focus:border-msn-primary focus:outline-none focus:ring-2 focus:ring-msn-primary/20`}
            placeholder="Confirm your password"
            required
          />
          {formErrors.confirmPassword && (.
            <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>
          )}
        </div>

        {/* Terms checkbox */}
        <div className="space-y-1">
          <div className="flex items-start">
            <input
              id="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className={`mt-1 h-4 w-4 rounded border-gray-300 text-msn-primary focus:ring-msn-primary/20 ${
                formErrors.agreeTerms ? 'border-destructive' : ''
              }`}
            />
            <label
              htmlFor="agreeTerms"
              className="ml-2 block text-sm text-muted-foreground"
            >
              I agree to the{' '}
              <Link to="/terms" className="text-msn-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-msn-primary hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {formErrors.agreeTerms && (
            <p className="text-xs text-destructive">{formErrors.agreeTerms}</p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-msn-primary py-2 text-sm font-medium text-white transition-colors hover:bg-msn-primary/90 focus:outline-none focus:ring-2 focus:ring-msn-primary/20 disabled:opacity-70"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Login link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-msn-primary hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
