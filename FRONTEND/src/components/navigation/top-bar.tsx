// ==========================================================
// 🎮 C.H.A.O.S. APPLICATION TOP BAR 🎮
// ==========================================================
// - MSN MESSENGER INSPIRED HEADER BAR
// - WINDOW CONTROLS FOR DESKTOP APPLICATIONS
// - USER PROFILE QUICK ACCESS
// - CROSS-PLATFORM COMPATIBILITY LAYER
// ==========================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Icons
import { Menu, X, Settings, Bell, LogOut, Moon, Sun } from 'lucide-react';

// Hooks
import { useTheme } from '@/lib/theme-provider';
import { useAuthStore } from '@/store/auth-store';

// Constants
import { APP_NAME, IS_TAURI, KEY_SHORTCUTS } from '@/lib/constants';

interface TopBarProps {
  toggleSidebar: () => void;
}

export function TopBar({ toggleSidebar }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Handle logout action
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Toggle theme between light/dark
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="msn-header sticky top-0 z-50 shadow-sm">
      {/* Logo and menu toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        
        <motion.div 
          className="font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {APP_NAME}
        </motion.div>
      </div>

      {/* User profile and actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/app/settings')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
          aria-label="Settings"
          title={`Settings ${KEY_SHORTCUTS.SETTINGS}`}
        >
          <Settings size={18} />
        </button>

        {/* Profile dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/20"
          >
            <div className="h-7 w-7 overflow-hidden rounded-full bg-msn-primary/30">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user?.displayName || user?.username || 'User'} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                  {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="max-w-[100px] truncate text-sm text-white">
              {user?.displayName || user?.username}
            </span>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-1 w-48 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
            >
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50"
              >
                <LogOut size={16} />
                <span>Sign Out {KEY_SHORTCUTS.LOGOUT}</span>
              </button>
            </motion.div>
          )}
        </div>

        {/* Close button (for native app) */}
        {IS_TAURI && (
          <button
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
            aria-label="Close application"
            title="Close"
            onClick={() => window.__TAURI__?.app.exit(0)}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
