// ==========================================================
// 🏠 C.H.A.O.S. HUB PAGE COMPONENT 🏠
// ==========================================================
// - DISCORD-INSPIRED SERVER/COMMUNITY INTERFACE
// - MSN MESSENGER STYLING AND ANIMATIONS
// - CHANNEL-BASED COMMUNICATION SYSTEM
// - CROSS-PLATFORM INTERACTION PATTERNS
// ==========================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Types
import { Hub, Channel, Message, HubMember } from '@/lib/types';

// Icons
import { 
  Hash, 
  Plus, 
  Settings, 
  Users, 
  Volume2,
  Search,
  Send,
  Paperclip,
  Smile
} from 'lucide-react';

// Mock data for development
const mockHub: Hub = {
  id: '1',
  name: 'Gaming Club',
  description: 'For all gaming enthusiasts',
  iconUrl: null,
  memberCount: 24,
  channels: [
    { id: 'c1', name: 'general', description: 'General chat for everyone', hubId: '1', isPrivate: false },
    { id: 'c2', name: 'gaming-news', description: 'Latest gaming news and updates', hubId: '1', isPrivate: false },
    { id: 'c3', name: 'off-topic', description: 'Discussions not related to gaming', hubId: '1', isPrivate: false },
    { id: 'c4', name: 'mods-only', description: 'Private channel for moderators', hubId: '1', isPrivate: true },
  ],
};

const mockMembers: HubMember[] = [
  {
    id: 'm1',
    hubId: '1',
    userId: 'u1',
    role: 'OWNER',
    user: {
      id: 'u1',
      username: 'sarah_parker',
      displayName: 'Sarah Parker',
      status: 'ONLINE',
    },
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
  },
  {
    id: 'm2',
    hubId: '1',
    userId: 'u2',
    role: 'ADMIN',
    user: {
      id: 'u2',
      username: 'mike_jones',
      displayName: 'Mike Jones',
      status: 'ONLINE',
    },
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(), // 25 days ago
  },
  {
    id: 'm3',
    hubId: '1',
    userId: 'u3',
    role: 'MEMBER',
    user: {
      id: 'u3',
      username: 'emma_wilson',
      displayName: 'Emma Wilson',
      status: 'AWAY',
    },
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
  },
];

const mockMessages: Message[] = [
  {
    id: 'm1',
    content: 'Has anyone played the new Zelda game?',
    senderId: 'u2',
    senderUsername: 'mike_jones',
    senderDisplayName: 'Mike Jones',
    channelId: 'c1',
    type: 'TEXT',
    isEncrypted: false,
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'm2',
    content: 'Yes! It\'s amazing. I\'ve been playing it non-stop all weekend.',
    senderId: 'u3',
    senderUsername: 'emma_wilson',
    senderDisplayName: 'Emma Wilson',
    channelId: 'c1',
    type: 'TEXT',
    isEncrypted: false,
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
];

export function HubPage() {
  const { hubId, channelId } = useParams<{ hubId: string; channelId?: string }>();
  const navigate = useNavigate();
  
  // State
  const [hub, setHub] = useState<Hub | null>(null);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [members, setMembers] = useState<HubMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  
  // Load hub data
  useEffect(() => {
    if (hubId) {
      // Simulate API call
      setIsLoading(true);
      
      // Fetch hub data
      setTimeout(() => {
        setHub(mockHub);
        setMembers(mockMembers);
        
        // Set active channel
        if (channelId) {
          const channel = mockHub.channels?.find(c => c.id === channelId) || null;
          setActiveChannel(channel);
        } else if (mockHub.channels && mockHub.channels.length > 0) {
          setActiveChannel(mockHub.channels[0]);
        }
        
        setIsLoading(false);
      }, 500);
    }
  }, [hubId, channelId]);
  
  // Load channel messages when active channel changes
  useEffect(() => {
    if (activeChannel) {
      // Fetch messages for channel
      setMessages(mockMessages.filter(m => m.channelId === activeChannel.id));
      
      // Update URL if needed
      if (!channelId || channelId !== activeChannel.id) {
        navigate(`/app/hub/${hubId}/channel/${activeChannel.id}`, { replace: true });
      }
    }
  }, [activeChannel, hubId, channelId, navigate]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeChannel) return;
    
    // Create new message
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageInput,
      senderId: 'current-user-id',
      senderUsername: 'current_user',
      senderDisplayName: 'Current User',
      channelId: activeChannel.id,
      type: 'TEXT',
      isEncrypted: false,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to messages
    setMessages(prev => [...prev, newMessage]);
    
    // Clear input
    setMessageInput('');
  };
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-msn-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading hub...</p>
        </div>
      </div>
    );
  }
  
  if (!hub) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="msn-window p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-destructive">Hub Not Found</h2>
          <p className="mb-4 text-muted-foreground">The hub you're looking for doesn't exist or you don't have access.</p>
          <button
            onClick={() => navigate('/app/dashboard')}
            className="rounded-md bg-msn-primary px-4 py-2 text-sm font-medium text-white"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Channel sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-border bg-card py-2">
        {/* Hub name and settings */}
        <div className="msn-header px-4 py-2 text-left">
          <h1 className="truncate text-sm font-bold">{hub.name}</h1>
        </div>
        
        {/* Channel list */}
        <div className="mt-2 px-2">
          <div className="flex items-center justify-between px-2 py-1 text-xs font-medium text-muted-foreground">
            <span>CHANNELS</span>
            <button 
              className="rounded hover:text-foreground"
              title="Create Channel"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="mt-1 space-y-1">
            {hub.channels?.map(channel => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel)}
                className={`
                  flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors
                  ${activeChannel?.id === channel.id 
                    ? 'bg-msn-primary/10 text-msn-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
              >
                <Hash size={16} />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Channel header */}
        {activeChannel && (
          <div className="flex items-center justify-between border-b border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <Hash size={18} className="text-muted-foreground" />
              <h2 className="font-medium">{activeChannel.name}</h2>
              {activeChannel.description && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-sm text-muted-foreground">{activeChannel.description}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Search Messages"
              >
                <Search size={18} />
              </button>
              <button 
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Channel Settings"
              >
                <Settings size={18} />
              </button>
              <button 
                onClick={() => setShowMembers(!showMembers)}
                className={`
                  rounded-full p-2 
                  ${showMembers 
                    ? 'bg-msn-primary/10 text-msn-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
                title={showMembers ? 'Hide Members' : 'Show Members'}
              >
                <Users size={18} />
              </button>
            </div>
          </div>
        )}
        
        {/* Messages and members area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Messages */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map(message => (
                    <div key={message.id} className="flex gap-3">
                      {/* User avatar */}
                      <div className="mt-0.5 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-primary/10">
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-primary">
                          {message.senderDisplayName?.charAt(0) || 'U'}
                        </div>
                      </div>
                      
                      {/* Message content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{message.senderDisplayName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <div className="mt-1">{message.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Hash size={24} className="mb-2 text-muted-foreground" />
                  <h3 className="text-sm font-medium">No messages yet</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Be the first to send a message in #{activeChannel?.name}
                  </p>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="border-t border-border p-3">
              <div className="flex items-center rounded-md border border-input bg-background px-3 py-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={`Message #${activeChannel?.name || 'channel'}`}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
                    title="Add attachment"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
                    title="Add emoji"
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className={`rounded-full p-1.5 ${
                      messageInput.trim()
                        ? 'text-msn-primary hover:bg-msn-primary/10'
                        : 'text-muted-foreground'
                    }`}
                    title="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Members sidebar */}
          {showMembers && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-60 flex-shrink-0 overflow-y-auto border-l border-border bg-card p-3"
            >
              <h3 className="mb-2 px-2 text-xs font-medium text-muted-foreground">
                MEMBERS — {members.length}
              </h3>
              
              {/* Group members by role */}
              {['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'].map(role => {
                const roleMembers = members.filter(m => m.role === role);
                if (roleMembers.length === 0) return null;
                
                return (
                  <div key={role} className="mb-4">
                    <h4 className="mb-1 px-2 text-xs font-medium capitalize text-muted-foreground">
                      {role.toLowerCase()}s
                    </h4>
                    
                    <div className="space-y-1">
                      {roleMembers.map(member => (
                        <button
                          key={member.id}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                        >
                          {/* Status dot */}
                          <span
                            className={`h-2 w-2 rounded-full ${
                              member.user.status === 'ONLINE'
                                ? 'bg-msn-status-online'
                                : member.user.status === 'AWAY'
                                ? 'bg-msn-status-away'
                                : member.user.status === 'BUSY'
                                ? 'bg-msn-status-busy'
                                : 'bg-msn-status-offline'
                            }`}
                          />
                          
                          {/* Username */}
                          <span className="truncate">{member.user.displayName || member.user.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
