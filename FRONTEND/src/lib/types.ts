// ==========================================================
// 📊 C.H.A.O.S. TYPE DEFINITIONS SYSTEM 📊
// ==========================================================
// - TYPESCRIPT INTERFACES FOR SYSTEM ENTITIES
// - CROSS-PLATFORM DATA STRUCTURES
// - STRICT TYPE SAFETY FOR APPLICATION STATE
// - SHARED TYPE DEFINITIONS FOR FRONTEND/BACKEND
// ==========================================================

// User status options (mirrors backend enum)
export type UserStatusType = 'ONLINE' | 'AWAY' | 'BUSY' | 'INVISIBLE' | 'OFFLINE';

// Message types (mirrors backend enum)
export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM' | 'AUDIO' | 'VIDEO';

// User profile interface
export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string | null;
  statusMessage?: string | null;
  status: UserStatusType;
  createdAt: string;
}

// Contact interface (user in contact list)
export interface Contact {
  id: string;
  username: string;
  displayName: string;
  nickname?: string;
  groupName?: string;
  avatarUrl: string | null;
  status: UserStatusType;
  statusMessage?: string | null;
}

// Message interface
export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderUsername?: string;
  senderDisplayName?: string;
  recipientId?: string;
  channelId?: string;
  type: MessageType;
  isEncrypted: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
}

// Chat conversation interface
export interface Conversation {
  contactId: string;
  contact: Contact;
  lastMessage?: Message;
  unreadCount: number;
  isTyping: boolean;
}

// Hub (Discord-style server) interface
export interface Hub {
  id: string;
  name: string;
  description?: string | null;
  iconUrl?: string | null;
  ownerId?: string;
  memberCount: number;
  channels?: Channel[];
  createdAt?: string;
}

// Channel interface
export interface Channel {
  id: string;
  name: string;
  description?: string | null;
  hubId: string;
  isPrivate: boolean;
  lastMessage?: Message;
  unreadCount?: number;
  createdAt?: string;
}

// Hub member interface with roles
export interface HubMember {
  id: string;
  hubId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  nickname?: string | null;
  user: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string | null;
    status: UserStatusType;
  };
  joinedAt: string;
}

// App notification interface
export interface Notification {
  id: string;
  type: 'MESSAGE' | 'FRIEND_REQUEST' | 'HUB_INVITE' | 'SYSTEM';
  title: string;
  message: string;
  senderId?: string;
  read: boolean;
  createdAt: string;
  data?: any; // Additional context data
}

// API response interfaces
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}
