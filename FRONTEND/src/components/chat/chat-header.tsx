// ==========================================================
// 🎭 C.H.A.O.S. CHAT HEADER COMPONENT 🎭
// ==========================================================
// - MSN MESSENGER INSPIRED CONTACT HEADER
// - USER PRESENCE AND STATUS DISPLAY
// - ENCRYPTION CONTROL AND INDICATORS
// - CROSS-PLATFORM ACTION CONTROLS
// ==========================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Types and Constants
import { Contact } from '@/lib/types';

// Icons
import { 
  Phone, 
  Video, 
  Lock, 
  LockOpen, 
  MoreVertical,
  UserPlus,
  UserMinus,
  Bell,
  BellOff,
  Search
} from 'lucide-react';

interface ChatHeaderProps {
  contact: Contact;
  isEncrypted: boolean;
  toggleEncryption: () => void;
}

export function ChatHeader({ contact, isEncrypted, toggleEncryption }: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Status color mapping
  const statusColors = {
    ONLINE: 'bg-msn-status-online',
    AWAY: 'bg-msn-status-away',
    BUSY: 'bg-msn-status-busy',
    INVISIBLE: 'bg-msn-status-offline',
    OFFLINE: 'bg-msn-status-offline',
  };

  // Status text mapping
  const statusText = {
    ONLINE: 'Online',
    AWAY: 'Away',
    BUSY: 'Busy',
    INVISIBLE: 'Offline',
    OFFLINE: 'Offline',
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-card p-3 shadow-sm">
      {/* Contact info */}
      <div className="flex items-center gap-3">
        {/* Avatar with status */}
        <div className="relative">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-primary/10">
            {contact.avatarUrl ? (
              <img
                src={contact.avatarUrl}
                alt={contact.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                {contact.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Status indicator */}
          <span
            className={`status-dot absolute bottom-0 right-0 border-2 border-card ${statusColors[contact.status]}`}
            aria-label={`Status: ${statusText[contact.status].toLowerCase()}`}
          />
        </div>
        
        {/* Name and status */}
        <div>
          <h2 className="font-medium">{contact.displayName}</h2>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{statusText[contact.status]}</span>
            {contact.statusMessage && (
              <>
                <span>•</span>
                <span className="italic">{contact.statusMessage}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Call button */}
        <button
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Start voice call"
        >
          <Phone size={18} />
        </button>
        
        {/* Video call button */}
        <button
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Start video call"
        >
          <Video size={18} />
        </button>
        
        {/* Search messages button */}
        <button
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Search in conversation"
        >
          <Search size={18} />
        </button>
        
        {/* Encryption toggle button */}
        <button
          onClick={toggleEncryption}
          className={`rounded-full p-2 ${
            isEncrypted
              ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
              : 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
          }`}
          title={isEncrypted ? 'Encryption enabled' : 'Encryption disabled'}
        >
          {isEncrypted ? <Lock size={18} /> : <LockOpen size={18} />}
        </button>
        
        {/* More options dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="More options"
          >
            <MoreVertical size={18} />
          </button>
          
          {/* Dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-border bg-card shadow-lg"
              >
                <div className="py-1">
                  {/* Menu items */}
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                    <UserPlus size={16} />
                    <span>Add to Contacts</span>
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                    <UserMinus size={16} />
                    <span>Remove Contact</span>
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                    <Bell size={16} />
                    <span>Mute Notifications</span>
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted">
                    <span>Block User</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
