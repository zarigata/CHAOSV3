/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║   << C.H.A.O.S.V3 - CODEX >> SOCKET COMMUNICATION CORE    ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Real-time communication layer using Socket.IO              ║
 * ║ Manages connections and event handling with the backend    ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

import { Socket as IOSocket } from 'socket.io-client';
import io from 'socket.io-client';
import { loadAuthData } from './auth';

// CIPHER-X: Configuration constants
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// OMEGA-MATRIX: Socket instance singleton
let socket: ReturnType<typeof io> | null = null;

// CIPHER-X: Socket connection states
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// CIPHER-X: Interface for message data
export interface MessageData {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  channel?: string;
  server?: string;
  recipient?: string;
  timestamp: Date | string;
  attachments?: Array<{
    id: string;
    url: string;
    type: string;
    name: string;
  }>;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
  }>;
}

// CIPHER-X: Interface for user status
export interface UserStatus {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  customStatus?: string;
  lastActive?: Date | string;
}

/**
 * CIPHER-X: Initialize socket connection
 * Creates and configures the WebSocket connection to the server
 */
export const initializeSocket = (): ReturnType<typeof io> => {
  if (socket) {
    return socket;
  }

  // OMEGA-MATRIX: Get authentication data
  const auth = loadAuthData();

  // OMEGA-MATRIX: Create socket instance with auth token
  socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 10000,
    auth: auth.token ? { token: auth.token } : undefined,
    transports: ['websocket', 'polling']
  });

  // CIPHER-X: Configure default event handlers
  socket.on('connect', () => {
    console.log('✓ Socket connected:', socket?.id);
  });

  socket.on('connect_error', (err: Error) => {
    console.error('✗ Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason: string) => {
    console.log('! Socket disconnected:', reason);
  });

  return socket;
};

/**
 * CIPHER-X: Connect to socket server
 * Establishes connection and handles authentication
 */
export const connectSocket = (): Promise<ReturnType<typeof io>> => {
  const socketInstance = initializeSocket();
  
  return new Promise((resolve, reject) => {
    // OMEGA-MATRIX: Set up temporary handlers for connection process
    const onConnect = () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('connect_error', onConnectError);
      resolve(socketInstance);
    };

    const onConnectError = (err: Error) => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('connect_error', onConnectError);
      reject(err);
    };

    // OMEGA-MATRIX: Register temporary handlers
    socketInstance.on('connect', onConnect);
    socketInstance.on('connect_error', onConnectError);

    // OMEGA-MATRIX: Initiate connection
    if (!socketInstance.connected) {
      socketInstance.connect();
    } else {
      resolve(socketInstance);
    }
  });
};

/**
 * CIPHER-X: Disconnect from socket server
 * Closes the WebSocket connection
 */
export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
  }
};

/**
 * CIPHER-X: Send a message via socket
 * Emits message data to the appropriate channel
 */
export const sendMessage = (messageData: Omit<MessageData, 'id' | 'timestamp'>): Promise<MessageData> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit('message:send', messageData, (response: { success: boolean; data?: MessageData; error?: string }) => {
      if (response.success && response.data) {
        resolve(response.data);
      } else {
        reject(new Error(response.error || 'Failed to send message'));
      }
    });
  });
};

/**
 * CIPHER-X: Join a chat channel or server
 * Subscribes to messages from a specific channel
 */
export const joinChannel = (channelData: { serverId?: string; channelId: string }): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit('channel:join', channelData, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        resolve(true);
      } else {
        reject(new Error(response.error || 'Failed to join channel'));
      }
    });
  });
};

/**
 * CIPHER-X: Leave a chat channel or server
 * Unsubscribes from messages in a channel
 */
export const leaveChannel = (channelData: { serverId?: string; channelId: string }): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit('channel:leave', channelData, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        resolve(true);
      } else {
        reject(new Error(response.error || 'Failed to leave channel'));
      }
    });
  });
};

/**
 * CIPHER-X: Get socket connection state
 * Returns current connection status
 */
export const getConnectionState = (): ConnectionState => {
  if (!socket) {
    return ConnectionState.DISCONNECTED;
  }

  if (socket.connected) {
    return ConnectionState.CONNECTED;
  }

  // Socket.IO v4 doesn't expose a 'connecting' property directly
  // So we assume if it's not connected and not disconnected, it must be connecting
  if (!socket.disconnected) {
    return ConnectionState.CONNECTING;
  }

  return ConnectionState.DISCONNECTED;
};

/**
 * CIPHER-X: Subscribe to socket events
 * Sets up event listeners for specific socket events
 */
export const subscribeToEvent = <T>(event: string, callback: (data: T) => void): () => void => {
  const socketInstance = initializeSocket();

  socketInstance.on(event, callback);

  // OMEGA-MATRIX: Return unsubscribe function
  return () => {
    socketInstance.off(event, callback);
  };
};

/**
 * CIPHER-X: Update user status
 * Broadcasts status changes to other users
 */
export const updateUserStatus = (status: Omit<UserStatus, 'userId'>): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit('user:status', status, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        resolve(true);
      } else {
        reject(new Error(response.error || 'Failed to update status'));
      }
    });
  });
};

/**
 * CIPHER-X: Get current socket instance
 * Returns the active socket or null if not connected
 */
export const getSocket = (): ReturnType<typeof io> | null => {
  return socket;
};
