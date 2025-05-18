// ==========================================================
// 🟢 C.H.A.O.S. STATUS BAR COMPONENT 🟢
// ==========================================================
// - MSN MESSENGER INSPIRED STATUS FOOTER
// - USER PRESENCE AND STATUS CONTROLS
// - CROSS-PLATFORM STATUS INDICATORS
// - ANIMATED STATUS TRANSITIONS
// ==========================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks and Utilities
import { useSocketStore } from '@/store/socket-store';

// Constants
import { UserStatus } from '@/lib/constants';

// Icons
import { MessageSquare, Check, ChevronUp } from 'lucide-react';

interface StatusBarProps {
  username: string;
}

export function StatusBar({ username }: StatusBarProps) {
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const { status, setStatus } = useSocketStore((state) => ({
    status: state.status,
    setStatus: state.setStatus,
  }));

  // Status options with labels and colors
  const statusOptions = [
    { value: UserStatus.ONLINE, label: 'Online', color: 'bg-msn-status-online' },
    { value: UserStatus.AWAY, label: 'Away', color: 'bg-msn-status-away' },
    { value: UserStatus.BUSY, label: 'Busy', color: 'bg-msn-status-busy' },
    { value: UserStatus.INVISIBLE, label: 'Appear Offline', color: 'bg-msn-status-offline' },
  ];

  // Get current status display properties
  const currentStatus = statusOptions.find((option) => option.value === status) || statusOptions[0];

  // Change user status
  const changeStatus = (newStatus: UserStatus) => {
    setStatus(newStatus);
    setStatusMenuOpen(false);
  };

  return (
    <footer className="relative border-t border-border bg-card px-3 py-2 text-xs text-muted-foreground shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side: Status controls */}
        <div className="flex items-center gap-2">
          {/* Status indicator and selector */}
          <div className="relative">
            <button
              onClick={() => setStatusMenuOpen(!statusMenuOpen)}
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
              aria-label="Change status"
            >
              <span className={`status-dot ${currentStatus.value.toLowerCase()}`} />
              <span>{currentStatus.label}</span>
              <ChevronUp 
                size={14} 
                className={`transition-transform ${statusMenuOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {/* Status dropdown menu */}
            <AnimatePresence>
              {statusMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-1 w-40 rounded-md border border-border bg-card py-1 shadow-md"
                >
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => changeStatus(option.value)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-muted"
                    >
                      <span className={`status-dot ${option.value.toLowerCase()}`} />
                      <span>{option.label}</span>
                      {status === option.value && (
                        <Check size={14} className="ml-auto" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Username display */}
          <div className="ml-2">
            <span className="font-medium">{username}</span>
          </div>
        </div>

        {/* Right side: Quick actions */}
        <div className="flex items-center gap-2">
          {/* New message button */}
          <button
            className="rounded-full p-1 hover:bg-muted"
            aria-label="New message"
            title="New message"
          >
            <MessageSquare size={14} />
          </button>

          {/* Custom message (like MSN personal message) */}
          <span className="max-w-[280px] truncate italic opacity-70">
            {"/* coding nostalgia with modern tech */"}
          </span>
        </div>
      </div>
    </footer>
  );
}
