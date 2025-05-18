// ==========================================================
// ⚡ C.H.A.O.S. WEBSOCKET STATE MANAGEMENT ⚡
// ==========================================================
// - REAL-TIME CONNECTION MANAGEMENT WITH SOCKET.IO
// - USER PRESENCE AND STATUS SYNCHRONIZATION
// - TYPING INDICATORS AND MESSAGE DELIVERY
// - CROSS-PLATFORM CONNECTION STABILITY
// ==========================================================

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, UserStatus, SOUNDS } from '@/lib/constants';

// Define socket store state interface
interface SocketState {
  // Socket connection
  socket: Socket | null;
  isConnected: boolean;
  status: UserStatus;
  
  // Online users
  onlineUsers: Set<string>;
  typingUsers: Map<string, NodeJS.Timeout>;
  
  // Actions
  connect: (token: string) => void;
  disconnect: () => void;
  setStatus: (status: UserStatus, statusMessage?: string) => void;
  sendDirectMessage: (recipientId: string, content: string, messageType?: string) => Promise<string>;
  sendTypingIndicator: (recipientId: string, isTyping: boolean) => void;
}

// Create socket store with Zustand
export const useSocketStore = create<SocketState>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  status: UserStatus.OFFLINE,
  onlineUsers: new Set<string>(),
  typingUsers: new Map<string, NodeJS.Timeout>(),
  
  // Connect to WebSocket server
  connect: (token: string) => {
    const { socket } = get();
    
    // Don't reconnect if already connected
    if (socket && socket.connected) {
      return;
    }
    
    // Create new socket connection with auth token
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    // Setup event listeners
    newSocket.on('connect', () => {
      console.log('Socket connected');
      
      // Update connection state
      set({
        isConnected: true,
        socket: newSocket, 
        status: UserStatus.ONLINE,
      });
      
      // Send initial online status
      newSocket.emit('user:status', { status: UserStatus.ONLINE });
      
      // Play connection sound (MSN style)
      try {
        const loginSound = new Audio(SOUNDS.ONLINE);
        loginSound.volume = 0.2;
        loginSound.play().catch(e => {
          // Browser may block autoplay
          console.log('Sound blocked by browser policy');
        });
      } catch (err) {
        console.error('Failed to play sound');
      }
    });
    
    // Handle disconnect
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false, status: UserStatus.OFFLINE });
    });
    
    // Handle status updates from other users
    newSocket.on('user:status', ({ userId, status }) => {
      const { onlineUsers } = get();
      const newOnlineUsers = new Set(onlineUsers);
      
      if (status === UserStatus.ONLINE) {
        newOnlineUsers.add(userId);
      } else if (status === UserStatus.OFFLINE) {
        newOnlineUsers.delete(userId);
      }
      
      set({ onlineUsers: newOnlineUsers });
    });
    
    // Handle typing indicators
    newSocket.on('typing:start', ({ userId }) => {
      const { typingUsers } = get();
      const newTypingUsers = new Map(typingUsers);
      
      // Clear existing timeout if any
      if (newTypingUsers.has(userId)) {
        clearTimeout(newTypingUsers.get(userId));
      }
      
      // Set typing timeout (auto-clear after 5 seconds)
      const timeout = setTimeout(() => {
        const currentTypingUsers = get().typingUsers;
        const updatedTypingUsers = new Map(currentTypingUsers);
        updatedTypingUsers.delete(userId);
        set({ typingUsers: updatedTypingUsers });
      }, 5000);
      
      // Add to typing users
      newTypingUsers.set(userId, timeout);
      set({ typingUsers: newTypingUsers });
      
      // Play typing sound (soft, MSN style)
      try {
        const typingSound = new Audio(SOUNDS.TYPING);
        typingSound.volume = 0.1;
        typingSound.play().catch(() => {});
      } catch (err) {
        // Silence sound errors
      }
    });
    
    // Handle typing stop
    newSocket.on('typing:stop', ({ userId }) => {
      const { typingUsers } = get();
      const newTypingUsers = new Map(typingUsers);
      
      // Clear timeout
      if (newTypingUsers.has(userId)) {
        clearTimeout(newTypingUsers.get(userId));
      }
      
      // Remove from typing users
      newTypingUsers.delete(userId);
      set({ typingUsers: newTypingUsers });
    });
    
    // Handle incoming direct messages
    newSocket.on('message:direct', (message) => {
      // Play message sound (MSN style)
      try {
        const messageSound = new Audio(SOUNDS.MESSAGE);
        messageSound.volume = 0.3;
        messageSound.play().catch(() => {});
      } catch (err) {
        // Silence sound errors
      }
      
      // Dispatch event for message handlers to process
      window.dispatchEvent(new CustomEvent('chat:new-message', {
        detail: { message }
      }));
    });
    
    // Store socket in state
    set({ socket: newSocket });
  },
  
  // Disconnect socket
  disconnect: () => {
    const { socket } = get();
    
    if (socket) {
      // Send offline status before disconnecting
      socket.emit('user:status', { status: UserStatus.OFFLINE });
      
      // Close socket connection
      socket.disconnect();
      set({ 
        socket: null, 
        isConnected: false, 
        status: UserStatus.OFFLINE,
        onlineUsers: new Set(),
        typingUsers: new Map(),
      });
    }
  },
  
  // Update user status
  setStatus: (status: UserStatus, statusMessage?: string) => {
    const { socket, isConnected } = get();
    
    // Update local state
    set({ status });
    
    // Send status update to server if connected
    if (socket && isConnected) {
      socket.emit('user:status', { status, statusMessage });
    }
  },
  
  // Send direct message
  sendDirectMessage: (recipientId: string, content: string, messageType = 'TEXT') => {
    return new Promise<string>((resolve, reject) => {
      const { socket, isConnected } = get();
      
      if (!socket || !isConnected) {
        reject(new Error('Not connected to server'));
        return;
      }
      
      // Generate temporary ID for optimistic updates
      const tempId = `temp-${Date.now()}`;
      
      // Send message data to server
      socket.emit('message:direct', {
        recipientId,
        content,
        messageType,
      });
      
      // Listen for acknowledgement (once)
      socket.once('message:sent', (data) => {
        resolve(data.id || tempId);
      });
      
      // Listen for error (once)
      socket.once('message:error', (error) => {
        reject(new Error(error.message || 'Failed to send message'));
      });
      
      // Set timeout for response
      setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 5000);
    });
  },
  
  // Send typing indicator
  sendTypingIndicator: (recipientId: string, isTyping: boolean) => {
    const { socket, isConnected } = get();
    
    if (!socket || !isConnected) {
      return;
    }
    
    // Emit appropriate typing event
    if (isTyping) {
      socket.emit('typing:start', { recipientId });
    } else {
      socket.emit('typing:stop', { recipientId });
    }
  },
}));
