// ==========================================================
// 🔐 C.H.A.O.S. AUTHENTICATION LAYOUT 🔐
// ==========================================================
// - MSN MESSENGER INSPIRED LOGIN SCREEN
// - NOSTALGIC UI WITH MODERN SECURITY
// - ANIMATED TRANSITIONS AND EFFECTS
// - CROSS-PLATFORM WINDOW HANDLING
// ==========================================================

import { useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { APP_NAME, APP_FULL_NAME, SOUNDS } from '@/lib/constants';

export function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Play MSN login sound effect on component mount
  useEffect(() => {
    const loginSound = new Audio(SOUNDS.LOGIN);
    loginSound.volume = 0.3;
    
    // Only play if not already authenticated
    if (!isAuthenticated && !isLoading) {
      try {
        loginSound.play().catch(e => {
          // Browser may block autoplay - silent fail
          console.log('Sound blocked by browser policy');
        });
      } catch (err) {
        console.error('Failed to play sound:', err);
      }
    }
    
    return () => {
      loginSound.pause();
      loginSound.currentTime = 0;
    };
  }, [isLoading]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-msn-gradient p-4">
      {/* Background pattern (MSN-style bubbles) */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-msn-primary blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-40 w-40 rounded-full bg-msn-secondary blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 h-52 w-52 rounded-full bg-msn-accent blur-3xl" />
      </div>

      {/* Authentication container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 flex w-full max-w-md flex-col items-center"
      >
        {/* Logo */}
        <div className="mb-6 text-center">
          <motion.div 
            className="flex items-center justify-center text-4xl font-bold text-msn-primary"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            {APP_NAME}
          </motion.div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {APP_FULL_NAME}
          </p>
        </div>

        {/* Auth Forms (Login/Register) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-full"
        >
          <Outlet />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400"
        >
          <p>© {new Date().getFullYear()} {APP_NAME} - All rights reserved</p>
          <p className="mt-1">Bringing back the nostalgia of MSN Messenger</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
