// ==========================================================
// 📱 C.H.A.O.S. MOBILE NAVIGATION BAR 📱
// ==========================================================
// - RESPONSIVE BOTTOM NAVIGATION FOR MOBILE DEVICES
// - MSN MESSENGER INSPIRED ICONOGRAPHY
// - ANIMATED TRANSITIONS AND INDICATORS
// - ADAPTIVE STATUS AND NOTIFICATION DISPLAY
// ==========================================================

import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Icons
import { 
  MessageSquare, 
  Users, 
  Home, 
  Settings
} from 'lucide-react';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  // Navigation items
  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/app/dashboard',
    },
    {
      label: 'Chats',
      icon: MessageSquare,
      path: '/app/chats',
    },
    {
      label: 'Hubs',
      icon: Users,
      path: '/app/hubs',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/app/settings',
    },
  ];

  // Check if path is active (for highlighting)
  const isActive = (path: string) => {
    // Exact match or starts with path for nested routes
    return currentPath === path || 
      (path !== '/app/dashboard' && currentPath.startsWith(path));
  };

  return (
    <nav className="fixed bottom-0 left-0 z-40 flex w-full items-center justify-around border-t border-border bg-background py-1 shadow-sm md:hidden">
      {navItems.map((item) => {
        const active = isActive(item.path);
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`
              relative flex w-1/4 flex-col items-center justify-center py-2 text-xs
              ${active ? 'text-msn-primary' : 'text-muted-foreground'}
            `}
          >
            {/* Active indicator dot */}
            {active && (
              <motion.div
                layoutId="activeNavIndicator"
                className="absolute -top-1 h-1 w-1 rounded-full bg-msn-primary"
                transition={{ type: 'spring', duration: 0.5 }}
                initial={false}
              />
            )}
            
            {/* Icon */}
            <item.icon size={20} className="mb-0.5" />
            
            {/* Label */}
            <span className="text-[10px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
