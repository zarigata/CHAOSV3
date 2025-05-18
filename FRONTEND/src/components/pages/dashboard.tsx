// ==========================================================
// 🏠 C.H.A.O.S. DASHBOARD COMPONENT 🏠
// ==========================================================
// - MSN MESSENGER INSPIRED HOME SCREEN
// - RECENT CONVERSATIONS AND ACTIVITY FEED
// - ANIMATED STATUS UPDATES AND NOTIFICATIONS
// - CROSS-PLATFORM RESPONSIVE LAYOUT
// ==========================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// Components & Hooks
import { useAuthStore } from '@/store/auth-store';
import { useSocketStore } from '@/store/socket-store';

// Icons and Constants
import { MessageSquare, Users, Bell, Clock, ArrowRight } from 'lucide-react';
import { APP_NAME } from '@/lib/constants';

// Types
import { Conversation, Hub, Notification } from '@/lib/types';

// Mock data for development
const mockConversations: Conversation[] = [
  {
    contactId: '1',
    contact: {
      id: '1',
      username: 'sarah_parker',
      displayName: 'Sarah',
      status: 'ONLINE',
      avatarUrl: null,
      statusMessage: 'Working on the new project',
    },
    lastMessage: {
      id: 'm1',
      content: 'Hey, how\'s the project coming along?',
      senderId: '1',
      recipientId: 'current-user-id',
      type: 'TEXT',
      isEncrypted: false,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    unreadCount: 2,
    isTyping: false,
  },
  {
    contactId: '2',
    contact: {
      id: '2',
      username: 'mike_jones',
      displayName: 'Mike',
      status: 'ONLINE',
      avatarUrl: null,
      statusMessage: 'Available for chat',
    },
    lastMessage: {
      id: 'm2',
      content: 'Did you see the latest update?',
      senderId: '2',
      recipientId: 'current-user-id',
      type: 'TEXT',
      isEncrypted: false,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    unreadCount: 0,
    isTyping: true,
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'FRIEND_REQUEST',
    title: 'New Friend Request',
    message: 'Emma Wilson wants to add you as a contact',
    senderId: '3',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'n2',
    type: 'HUB_INVITE',
    title: 'Hub Invitation',
    message: 'You\'ve been invited to join "Developer Chat"',
    senderId: '2',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    data: { hubId: '2' },
  },
];

const mockRecentHubs: Hub[] = [
  {
    id: '1',
    name: 'Gaming Club',
    description: 'For all gaming enthusiasts',
    iconUrl: null,
    memberCount: 24,
  },
  {
    id: '2',
    name: 'Developer Chat',
    description: 'Coding discussions and help',
    iconUrl: null,
    memberCount: 156,
  },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { status, onlineUsers } = useSocketStore(state => ({
    status: state.status,
    onlineUsers: state.onlineUsers,
  }));
  
  const [recentConversations, setRecentConversations] = useState<Conversation[]>(mockConversations);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [recentHubs, setRecentHubs] = useState<Hub[]>(mockRecentHubs);

  // Format timestamp to relative time (e.g. "5 min ago")
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Welcome message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.displayName || user?.username || 'Friend'}!
        </h1>
        <p className="text-muted-foreground">
          {status === 'ONLINE' 
            ? `You're online with ${onlineUsers.size} other users` 
            : `You appear ${status.toLowerCase()} to others`}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="msn-window overflow-hidden"
        >
          <div className="msn-header">
            <h2 className="flex items-center text-sm font-medium">
              <MessageSquare size={16} className="mr-2" />
              Recent Conversations
            </h2>
          </div>
          
          <div className="divide-y divide-border">
            {recentConversations.length > 0 ? (
              recentConversations.map((conversation) => (
                <button
                  key={conversation.contactId}
                  onClick={() => navigate(`/app/chat/${conversation.contactId}`)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50"
                >
                  {/* Status and avatar */}
                  <div className="relative">
                    <div className="h-10 w-10 overflow-hidden rounded-full bg-primary/10">
                      {conversation.contact.avatarUrl ? (
                        <img
                          src={conversation.contact.avatarUrl}
                          alt={conversation.contact.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                          {conversation.contact.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Status indicator */}
                    <span
                      className={`status-dot absolute bottom-0 right-0 border-2 border-card ${
                        conversation.contact.status === 'ONLINE'
                          ? 'bg-msn-status-online'
                          : conversation.contact.status === 'AWAY'
                          ? 'bg-msn-status-away'
                          : conversation.contact.status === 'BUSY'
                          ? 'bg-msn-status-busy'
                          : 'bg-msn-status-offline'
                      }`}
                    />
                  </div>
                  
                  {/* Conversation preview */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">
                        {conversation.contact.displayName}
                      </p>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <p className="truncate text-sm text-muted-foreground">
                      {conversation.isTyping ? (
                        <span className="flex items-center">
                          <span className="mr-1 italic">typing</span>
                          <span className="flex space-x-1">
                            <span className="animate-bounce duration-500">.</span>
                            <span className="animate-bounce delay-100 duration-500">.</span>
                            <span className="animate-bounce delay-200 duration-500">.</span>
                          </span>
                        </span>
                      ) : conversation.lastMessage ? (
                        <>
                          {conversation.lastMessage.senderId !== 'current-user-id' ? '' : 'You: '}
                          {conversation.lastMessage.content}
                        </>
                      ) : (
                        'Start a conversation'
                      )}
                    </p>
                  </div>
                  
                  {/* Unread count */}
                  {conversation.unreadCount > 0 && (
                    <div className="flex h-5 min-w-5 items-center justify-center rounded-full bg-msn-primary px-1.5 text-xs font-medium text-white">
                      {conversation.unreadCount}
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MessageSquare size={24} className="mb-2 text-muted-foreground" />
                <h3 className="text-sm font-medium">No recent conversations</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start chatting with your contacts
                </p>
              </div>
            )}
          </div>
          
          {/* View all link */}
          {recentConversations.length > 0 && (
            <button
              onClick={() => navigate('/app/chats')}
              className="flex w-full items-center justify-center bg-muted/30 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              View all conversations
              <ArrowRight size={14} className="ml-1" />
            </button>
          )}
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="msn-window overflow-hidden"
        >
          <div className="msn-header">
            <h2 className="flex items-center text-sm font-medium">
              <Bell size={16} className="mr-2" />
              Notifications
            </h2>
          </div>
          
          <div className="divide-y divide-border">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3"
                >
                  {/* Notification icon */}
                  <div className={`
                    flex h-8 w-8 items-center justify-center rounded-full
                    ${notification.type === 'FRIEND_REQUEST' ? 'bg-msn-primary/10 text-msn-primary' :
                      notification.type === 'HUB_INVITE' ? 'bg-msn-secondary/10 text-msn-secondary' :
                      'bg-msn-accent/10 text-msn-accent'}
                  `}>
                    {notification.type === 'FRIEND_REQUEST' ? (
                      <UserPlus size={14} />
                    ) : notification.type === 'HUB_INVITE' ? (
                      <Users size={14} />
                    ) : (
                      <Bell size={14} />
                    )}
                  </div>
                  
                  {/* Notification content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {notification.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    
                    {/* Action buttons */}
                    <div className="mt-2 flex gap-2">
                      {notification.type === 'FRIEND_REQUEST' ? (
                        <>
                          <button className="rounded-md bg-msn-primary px-3 py-1 text-xs font-medium text-white">
                            Accept
                          </button>
                          <button className="rounded-md bg-muted px-3 py-1 text-xs font-medium">
                            Decline
                          </button>
                        </>
                      ) : notification.type === 'HUB_INVITE' ? (
                        <>
                          <button className="rounded-md bg-msn-primary px-3 py-1 text-xs font-medium text-white">
                            Join
                          </button>
                          <button className="rounded-md bg-muted px-3 py-1 text-xs font-medium">
                            Ignore
                          </button>
                        </>
                      ) : (
                        <button className="rounded-md bg-muted px-3 py-1 text-xs font-medium">
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Unread indicator */}
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-msn-primary"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell size={24} className="mb-2 text-muted-foreground" />
                <h3 className="text-sm font-medium">No notifications</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You're all caught up!
                </p>
              </div>
            )}
          </div>
          
          {/* View all link */}
          {notifications.length > 0 && (
            <button
              onClick={() => navigate('/app/notifications')}
              className="flex w-full items-center justify-center bg-muted/30 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              View all notifications
              <ArrowRight size={14} className="ml-1" />
            </button>
          )}
        </motion.div>

        {/* Recent Hubs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="msn-window overflow-hidden"
        >
          <div className="msn-header">
            <h2 className="flex items-center text-sm font-medium">
              <Users size={16} className="mr-2" />
              Your Hubs
            </h2>
          </div>
          
          <div className="divide-y divide-border">
            {recentHubs.length > 0 ? (
              recentHubs.map((hub) => (
                <button
                  key={hub.id}
                  onClick={() => navigate(`/app/hub/${hub.id}`)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50"
                >
                  {/* Hub icon */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {hub.iconUrl ? (
                      <img
                        src={hub.iconUrl}
                        alt={hub.name}
                        className="h-full w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-md text-sm font-semibold">
                        {hub.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Hub info */}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {hub.name}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users size={10} className="mr-1" />
                      <span>{hub.memberCount} members</span>
                    </div>
                  </div>
                  
                  <ArrowRight size={16} className="text-muted-foreground" />
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users size={24} className="mb-2 text-muted-foreground" />
                <h3 className="text-sm font-medium">No hubs joined</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Join or create a hub to get started
                </p>
              </div>
            )}
          </div>
          
          {/* View all link */}
          <button
            onClick={() => navigate('/app/hubs')}
            className="flex w-full items-center justify-center bg-muted/30 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            {recentHubs.length > 0 ? 'View all hubs' : 'Browse hubs'}
            <ArrowRight size={14} className="ml-1" />
          </button>
        </motion.div>

        {/* Activity / System Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="msn-window overflow-hidden"
        >
          <div className="msn-header">
            <h2 className="flex items-center text-sm font-medium">
              <Clock size={16} className="mr-2" />
              Recent Activity
            </h2>
          </div>
          
          <div className="p-4">
            <div className="mb-4 rounded-md bg-primary/5 p-3">
              <h3 className="mb-1 text-sm font-medium">Welcome to {APP_NAME}! 🎉</h3>
              <p className="text-xs text-muted-foreground">
                We're bringing back the nostalgic feel of MSN Messenger with modern features. 
                Customize your profile, add contacts, and start chatting!
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Users size={14} className="text-muted-foreground" />
                </div>
                <div className="text-sm">
                  <p><span className="font-medium">Mike Jones</span> came online</p>
                  <p className="text-xs text-muted-foreground">10 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <MessageSquare size={14} className="text-muted-foreground" />
                </div>
                <div className="text-sm">
                  <p><span className="font-medium">Sarah Parker</span> sent you a message</p>
                  <p className="text-xs text-muted-foreground">25 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Clock size={14} className="text-muted-foreground" />
                </div>
                <div className="text-sm">
                  <p>You signed in</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
