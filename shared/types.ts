/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                         SHARED TYPE DEFINITIONS [CRYPTO-257]                       ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Core type definitions used across frontend and backend                            ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

// ==================== USER INTERFACES ====================

/******************************************************************
 * OMEGA-MATRIX: USER QUANTUM IDENTITY SCHEMA
 * Complete user profile data structure with preferences
 * Defines all modifiable and system-managed user properties
 ******************************************************************/
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  statusMessage?: string;
  personalMessage?: string;
  customStatus?: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: {
    isAnimated?: boolean;
    enableWinks?: boolean;
    theme?: string;
    language?: string;
    notifications?: {
      sound?: boolean;
      messagePreview?: boolean;
      friendRequests?: boolean;
    }
  }
}

export interface UserProfile extends User {
  bio?: string;
  friends: string[]; // Array of friend user IDs
  pendingFriends: string[]; // Array of pending friend requests
  blockedUsers: string[]; // Array of blocked user IDs
  settings: UserSettings;
}

export interface UserSettings {
  theme: 'default' | 'dark' | 'light' | 'retro' | 'classic-msn';
  notifications: boolean;
  sounds: boolean;
  language: string;
  statusPrivacy: 'public' | 'friends-only' | 'private';
  autoLogin: boolean;
}

/******************************************************************
 * NEXUS-IDENTITY: USER STATUS CODEX
 * Classic MSN-style user presence indicators
 * Used for real-time availability tracking
 ******************************************************************/
export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  BRB = 'brb',
  PHONE = 'phone',
  LUNCH = 'lunch',
  OFFLINE = 'offline'
}

// ==================== MESSAGE INTERFACES ====================

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  readBy: string[]; // Array of user IDs who read the message
  edited: boolean;
  replyTo?: string; // ID of the message being replied to
  attachments?: Attachment[];
  reactions?: Reaction[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // Array of user IDs who reacted
}

// ==================== CHANNEL INTERFACES ====================

export interface DirectMessage {
  id: string;
  participants: string[]; // Array of user IDs (always 2)
  messages: Message[];
  unreadCount: Record<string, number>; // Map of user ID to unread count
  lastActivity: Date;
}

export interface GroupChannel {
  id: string;
  name: string;
  description?: string;
  owner: string; // User ID of the channel owner
  moderators: string[]; // Array of user IDs who are moderators
  members: string[]; // Array of user IDs who are members
  avatar?: string;
  isPrivate: boolean;
  messages: Message[];
  unreadCount: Record<string, number>; // Map of user ID to unread count
  lastActivity: Date;
  createdAt: Date;
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  owner: string; // User ID of the server owner
  moderators: string[]; // Array of user IDs who are moderators
  members: string[]; // Array of user IDs who are members
  icon?: string;
  banner?: string;
  channels: ServerChannel[];
  roles: Role[];
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerChannel {
  id: string;
  serverId: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'video';
  position: number;
  messages: Message[];
  unreadCount: Record<string, number>; // Map of user ID to unread count
  lastActivity: Date;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: Permission[];
  position: number;
}

export enum Permission {
  ADMINISTRATOR = 'administrator',
  MANAGE_SERVER = 'manage_server',
  MANAGE_CHANNELS = 'manage_channels',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_MESSAGES = 'manage_messages',
  KICK_MEMBERS = 'kick_members',
  BAN_MEMBERS = 'ban_members',
  CREATE_INVITE = 'create_invite',
  CHANGE_NICKNAME = 'change_nickname',
  MANAGE_NICKNAMES = 'manage_nicknames',
  READ_MESSAGES = 'read_messages',
  SEND_MESSAGES = 'send_messages',
  EMBED_LINKS = 'embed_links',
  ATTACH_FILES = 'attach_files',
  MENTION_EVERYONE = 'mention_everyone',
  EXTERNAL_EMOJIS = 'external_emojis',
  VOICE_CONNECT = 'voice_connect',
  VOICE_SPEAK = 'voice_speak',
  VOICE_MUTE_MEMBERS = 'voice_mute_members',
  VOICE_DEAFEN_MEMBERS = 'voice_deafen_members',
  VOICE_MOVE_MEMBERS = 'voice_move_members',
  VOICE_ACTIVITY = 'voice_activity',
  PRIORITY_SPEAKER = 'priority_speaker'
}

// ==================== CALL INTERFACES ====================

export interface CallSession {
  id: string;
  participants: string[]; // Array of user IDs
  type: 'audio' | 'video';
  startTime: Date;
  endTime?: Date;
  active: boolean;
}

// ==================== API INTERFACES ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: number; // Timestamp in milliseconds
}

export interface MessageRequest {
  content: string;
  replyTo?: string;
  attachments?: string[]; // Array of attachment IDs
}

// ==================== SOCKET EVENTS ====================

export enum SocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  USER_CONNECTED = 'user:connected',
  USER_DISCONNECTED = 'user:disconnected',
  USER_STATUS_CHANGED = 'user:status_changed',
  USER_TYPING = 'user:typing',
  USER_STOP_TYPING = 'user:stop_typing',
  MESSAGE_CREATED = 'message:created',
  MESSAGE_UPDATED = 'message:updated',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_REACTION = 'message:reaction',
  CALL_INITIATED = 'call:initiated',
  CALL_ACCEPTED = 'call:accepted',
  CALL_REJECTED = 'call:rejected',
  CALL_ENDED = 'call:ended',
  SIGNAL_OFFER = 'signal:offer',
  SIGNAL_ANSWER = 'signal:answer',
  SIGNAL_ICE_CANDIDATE = 'signal:ice_candidate',
  CHANNEL_CREATED = 'channel:created',
  CHANNEL_UPDATED = 'channel:updated',
  CHANNEL_DELETED = 'channel:deleted',
  SERVER_CREATED = 'server:created',
  SERVER_UPDATED = 'server:updated',
  SERVER_DELETED = 'server:deleted',
  FRIEND_REQUEST = 'friend:request',
  FRIEND_ACCEPTED = 'friend:accepted',
  FRIEND_DECLINED = 'friend:declined',
  FRIEND_REMOVED = 'friend:removed'
}
