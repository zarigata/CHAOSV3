// ==========================================================
// 📐 C.H.A.O.S. MAIN APPLICATION LAYOUT 📐
// ==========================================================
// - MSN MESSENGER INSPIRED WINDOW STRUCTURE
// - RESPONSIVE SIDEBAR WITH CONTACTS AND HUBS
// - CROSS-PLATFORM WINDOW CONTROLS
// - FRAMER MOTION ANIMATIONS FOR TRANSITIONS
// ==========================================================

import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import { Sidebar } from '../sidebar/sidebar';
import { TopBar } from '../navigation/top-bar';
import { StatusBar } from '../navigation/status-bar';
import { MobileNav } from '../navigation/mobile-nav';

// Hooks and Utilities
import { useTheme } from '@/lib/theme-provider';
import { useAuthStore } from '@/store/auth-store';
import { useWindowSize } from '@/hooks/use-window-size';
import { IS_TAURI } from '@/lib/constants';

export function MainLayout() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const location = useLocation();
  const { width } = useWindowSize();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = width ? width < 768 : false;

  // Auto-close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  // Close sidebar when changing routes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Toggle sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Main MSN-inspired window container */}
      <div 
        className={`
          msn-window flex h-full w-full flex-col
          ${IS_TAURI ? 'rounded-none border-0' : 'rounded-lg border'}
        `}
      >
        {/* Application Top Bar */}
        <TopBar toggleSidebar={toggleSidebar} />

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Animated Sidebar */}
          <AnimatePresence mode="wait" initial={false}>
            {isSidebarOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ 
                  width: isMobile ? '85%' : '280px', 
                  opacity: 1 
                }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`
                  ${isMobile ? 'absolute z-20 h-[calc(100%-60px)]' : ''}
                  border-r border-border bg-card
                `}
              >
                <Sidebar />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area */}
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Status Bar (MSN-style footer) */}
        <StatusBar username={user?.displayName || user?.username || ''} />

        {/* Mobile Navigation (only shown on small screens) */}
        {isMobile && <MobileNav />}
      </div>
    </div>
  );
}
