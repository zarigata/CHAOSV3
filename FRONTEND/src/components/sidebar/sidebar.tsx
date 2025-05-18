// ==========================================================
// 👥 C.H.A.O.S. SIDEBAR COMPONENT 👥
// ==========================================================
// - MSN MESSENGER INSPIRED CONTACTS LIST
// - GROUPED CONTACTS WITH EXPANSION CONTROLS
// - ONLINE/OFFLINE STATUS INDICATORS
// - CROSS-PLATFORM INTERACTION PATTERNS
// ==========================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { ContactGroup } from './contact-group';
import { HubList } from './hub-list';

// Icons
import { Search, Plus, UserPlus, Users } from 'lucide-react';

// Types
import { Contact, Hub } from '@/lib/types';

// Tabs enum for sidebar navigation
enum SidebarTab {
  CONTACTS = 'contacts',
  HUBS = 'hubs',
}

// Mock data for development - will be replaced with API data
const mockContacts: Record<string, Contact[]> = {
  'Online': [
    { id: '1', username: 'sarah_parker', displayName: 'Sarah', status: 'ONLINE', avatarUrl: null, statusMessage: 'Working on the new project' },
    { id: '2', username: 'mike_jones', displayName: 'Mike', status: 'ONLINE', avatarUrl: null, statusMessage: 'Available for chat' },
  ],
  'Away': [
    { id: '3', username: 'emma_wilson', displayName: 'Emma', status: 'AWAY', avatarUrl: null, statusMessage: 'In a meeting' },
  ],
  'Offline': [
    { id: '4', username: 'john_doe', displayName: 'John', status: 'OFFLINE', avatarUrl: null, statusMessage: 'Last seen 2 hours ago' },
    { id: '5', username: 'alex_brown', displayName: 'Alex', status: 'OFFLINE', avatarUrl: null, statusMessage: 'Back tomorrow' },
    { id: '6', username: 'taylor_swift', displayName: 'Taylor', status: 'OFFLINE', avatarUrl: null, statusMessage: 'Working from home' },
  ],
};

const mockHubs: Hub[] = [
  { id: '1', name: 'Gaming Club', description: 'For all gaming enthusiasts', iconUrl: null, memberCount: 24 },
  { id: '2', name: 'Developer Chat', description: 'Coding discussions and help', iconUrl: null, memberCount: 156 },
  { id: '3', name: 'Movie Buffs', description: 'Film recommendations and reviews', iconUrl: null, memberCount: 47 },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SidebarTab>(SidebarTab.CONTACTS);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter contacts based on search query
  const filteredContacts = Object.entries(mockContacts).reduce(
    (acc, [groupName, contacts]) => {
      if (searchQuery) {
        const filtered = contacts.filter(
          (contact) =>
            contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[groupName] = filtered;
        }
      } else {
        acc[groupName] = contacts;
      }
      return acc;
    },
    {} as Record<string, Contact[]>
  );

  // Filter hubs based on search query
  const filteredHubs = searchQuery
    ? mockHubs.filter(
        (hub) =>
          hub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hub.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockHubs;

  return (
    <aside className="flex h-full flex-col overflow-hidden">
      {/* Tab navigation */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab(SidebarTab.CONTACTS)}
          className={`flex flex-1 items-center justify-center border-b-2 py-3 text-sm font-medium transition-colors ${
            activeTab === SidebarTab.CONTACTS
              ? 'border-msn-primary text-msn-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserPlus size={16} className="mr-2" />
          Contacts
        </button>
        <button
          onClick={() => setActiveTab(SidebarTab.HUBS)}
          className={`flex flex-1 items-center justify-center border-b-2 py-3 text-sm font-medium transition-colors ${
            activeTab === SidebarTab.HUBS
              ? 'border-msn-primary text-msn-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users size={16} className="mr-2" />
          Hubs
        </button>
      </div>

      {/* Search bar */}
      <div className="border-b border-border p-3">
        <div className="flex items-center rounded-md border border-input bg-background px-3 py-1">
          <Search size={16} className="mr-2 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Search ${activeTab === SidebarTab.CONTACTS ? 'contacts' : 'hubs'}...`}
            className="w-full bg-transparent py-1 text-sm focus:outline-none"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="wait">
          {activeTab === SidebarTab.CONTACTS ? (
            <motion.div
              key="contacts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {/* Add contact button */}
              <button
                onClick={() => navigate('/app/search')}
                className="flex w-full items-center gap-2 rounded-md bg-msn-primary/10 p-2 text-sm text-msn-primary hover:bg-msn-primary/20"
              >
                <Plus size={16} />
                <span>Add Contact</span>
              </button>

              {/* Contact groups */}
              {Object.entries(filteredContacts).map(([groupName, contacts]) => (
                <ContactGroup
                  key={groupName}
                  title={groupName}
                  contacts={contacts}
                  onContactClick={(contactId) => navigate(`/app/chat/${contactId}`)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="hubs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Add hub button */}
              <button
                onClick={() => navigate('/app/create-hub')}
                className="mb-3 flex w-full items-center gap-2 rounded-md bg-msn-primary/10 p-2 text-sm text-msn-primary hover:bg-msn-primary/20"
              >
                <Plus size={16} />
                <span>Create Hub</span>
              </button>

              {/* Hubs list */}
              <HubList
                hubs={filteredHubs}
                onHubClick={(hubId) => navigate(`/app/hub/${hubId}`)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
