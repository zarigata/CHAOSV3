// ==========================================================
// 🌠 C.H.A.O.S. MAIN APPLICATION COMPONENT 🌠
// ==========================================================
// - MSN-INSPIRED UI WITH MODERN ARCHITECTURE
// - RESPONSIVE LAYOUT WITH TAILWIND CSS
// - ANIMATED TRANSITIONS WITH FRAMER MOTION
// - CROSS-PLATFORM COMPATIBILITY LAYER
// ==========================================================

import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Authentication & State Management
import { useAuthStore } from '@/store/auth-store';

// Layout Components
import { MainLayout } from '@/components/layouts/main-layout';
import { AuthLayout } from '@/components/layouts/auth-layout';

// Pages
import { LoginPage } from '@/components/pages/login';
import { RegisterPage } from '@/components/pages/register';
import { DashboardPage } from '@/components/pages/dashboard';
import { ChatPage } from '@/components/pages/chat';
import { HubPage } from '@/components/pages/hub';
import { SettingsPage } from '@/components/pages/settings';
import { NotFoundPage } from '@/components/pages/not-found';

// Authentication Guard Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    // Show loading state while checking authentication
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="msn-window p-8 text-center">
          <div className="mb-4 text-3xl font-bold text-msn-primary">C.H.A.O.S.</div>
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Main App Component
export default function App() {
  const [isMounted, setIsMounted] = useState(false);
  const { checkAuth } = useAuthStore();
  const location = useLocation();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
    setIsMounted(true);
  }, [checkAuth]);

  // Prevent flash of unstyled content
  if (!isMounted) {
    return null;
  }

  return (
    // Page transition animations
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Authentication Routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Protected Application Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="chat/:userId" element={<ChatPage />} />
          <Route path="hub/:hubId" element={<HubPage />} />
          <Route path="hub/:hubId/channel/:channelId" element={<HubPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}
