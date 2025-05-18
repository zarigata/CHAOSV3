// ==========================================================
// 📋 C.H.A.O.S. CONTACT GROUP COMPONENT 📋
// ==========================================================
// - MSN MESSENGER INSPIRED CONTACT GROUPING
// - COLLAPSIBLE GROUP WITH ANIMATION
// - USER STATUS INDICATORS AND AVATARS
// - CROSS-PLATFORM INTERACTION PATTERNS
// ==========================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import { ChevronRight, ChevronDown } from 'lucide-react';

// Types
import { Contact } from '@/lib/types';

interface ContactGroupProps {
  title: string;
  contacts: Contact[];
  onContactClick: (contactId: string) => void;
}

export function ContactGroup({ title, contacts, onContactClick }: ContactGroupProps) {
  // State for group expansion
  const [isExpanded, setIsExpanded] = useState(true);

  // Status color mapping
  const statusColors = {
    ONLINE: 'bg-msn-status-online',
    AWAY: 'bg-msn-status-away',
    BUSY: 'bg-msn-status-busy',
    INVISIBLE: 'bg-msn-status-offline',
    OFFLINE: 'bg-msn-status-offline',
  };

  // Status animation mapping
  const statusAnimation = {
    ONLINE: 'animate-status-pulse',
    AWAY: '',
    BUSY: '',
    INVISIBLE: '',
    OFFLINE: '',
  };

  // Toggle group expansion
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mb-1 overflow-hidden rounded-md border border-border/50 bg-card/50">
      {/* Group header */}
      <button
        onClick={toggleExpand}
        className="flex w-full items-center justify-between bg-muted/30 px-3 py-1.5 text-left text-xs font-medium transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-1.5">
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{title}</span>
          <span className="ml-1 text-muted-foreground">({contacts.length})</span>
        </div>
      </button>

      {/* Contacts list with animation */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="divide-y divide-border/30">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => onContactClick(contact.id)}
                  className="msn-contact w-full"
                >
                  {/* Status dot */}
                  <span
                    className={`status-dot ${statusColors[contact.status]} ${statusAnimation[contact.status]}`}
                    aria-label={`Status: ${contact.status.toLowerCase()}`}
                  />

                  {/* Avatar */}
                  <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
                    {contact.avatarUrl ? (
                      <img
                        src={contact.avatarUrl}
                        alt={contact.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xs font-semibold text-primary">
                        {contact.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium">
                      {contact.displayName}
                    </div>
                    {contact.statusMessage && (
                      <div className="truncate text-xs text-muted-foreground">
                        {contact.statusMessage}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
