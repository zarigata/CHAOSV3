/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║    << C.H.A.O.S.V3 - CODEX >> MESSAGING PROVIDER          ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Global messaging state manager using React Context         ║
 * ║ Handles WebSocket events and message synchronization       ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import io from 'socket.io-client'
import { 
  connectSocket, 
  disconnectSocket, 
  sendMessage, 
  joinChannel, 
  leaveChannel,
  subscribeToEvent,
  MessageData,
  ConnectionState,
  getConnectionState
} from '@/lib/socket'
import { useAuth } from './auth-provider'

// CIPHER-X: Types and interfaces for messaging context
interface MessagingContextType {
  // Connection state
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Messages state and actions
  messages: Record<string, MessageData[]>;
  sendMessage: (message: Omit<MessageData, 'id' | 'timestamp'>) => Promise<MessageData>;
  clearMessages: (channelId: string) => void;
  
  // Channel management
  activeChannel: string | null;
  setActiveChannel: (channelId: string | null) => void;
  joinChannel: (data: { serverId?: string; channelId: string }) => Promise<void>;
  leaveChannel: (data: { serverId?: string; channelId: string }) => Promise<void>;
  
  // Typing indicators
  typingUsers: Record<string, string[]>;
  sendTypingIndicator: (channelId: string, isTyping: boolean) => void;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

// OMEGA-MATRIX: Create messaging context
const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

// CIPHER-X: Messaging provider component
export function MessagingProvider({ children }: { children: React.ReactNode }) {
  // OMEGA-MATRIX: Socket reference
  const socketRef = useRef<ReturnType<typeof io> | null>(null)
  
  // OMEGA-MATRIX: Authentication state
  const { isAuthenticated, token } = useAuth()
  
  // OMEGA-MATRIX: Connection & messaging state
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, MessageData[]>>({})
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({})
  
  // CIPHER-X: Connect to WebSocket server
  const connect = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setError('Authentication required to connect')
      return
    }
    
    try {
      setConnectionState(ConnectionState.CONNECTING)
      
      const socket = await connectSocket()
      socketRef.current = socket
      
      setConnectionState(ConnectionState.CONNECTED)
      setError(null)
    } catch (err) {
      setConnectionState(ConnectionState.ERROR)
      setError(err instanceof Error ? err.message : 'Failed to connect to messaging server')
    }
  }, [isAuthenticated, token])
  
  // CIPHER-X: Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    disconnectSocket()
    socketRef.current = null
    setConnectionState(ConnectionState.DISCONNECTED)
  }, [])
  
  // CIPHER-X: Send message to channel
  const sendMessageHandler = useCallback(async (messageData: Omit<MessageData, 'id' | 'timestamp'>) => {
    try {
      return await sendMessage(messageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      throw err
    }
  }, [])
  
  // CIPHER-X: Join a channel
  const joinChannelHandler = useCallback(async (data: { serverId?: string; channelId: string }) => {
    try {
      await joinChannel(data)
      
      // Initialize message array for channel if it doesn't exist
      setMessages(prev => {
        if (!prev[data.channelId]) {
          return { ...prev, [data.channelId]: [] }
        }
        return prev
      })
      
      // Set as active channel if none is active
      if (!activeChannel) {
        setActiveChannel(data.channelId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join channel')
    }
  }, [activeChannel])
  
  // CIPHER-X: Leave a channel
  const leaveChannelHandler = useCallback(async (data: { serverId?: string; channelId: string }) => {
    try {
      await leaveChannel(data)
      
      // Clear active channel if leaving the active one
      if (activeChannel === data.channelId) {
        setActiveChannel(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave channel')
    }
  }, [activeChannel])
  
  // CIPHER-X: Clear messages for a channel
  const clearMessages = useCallback((channelId: string) => {
    setMessages(prev => ({
      ...prev,
      [channelId]: []
    }))
  }, [])
  
  // CIPHER-X: Send typing indicator
  const sendTypingIndicator = useCallback((channelId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { channelId, isTyping })
    }
  }, [])
  
  // CIPHER-X: Clear error message
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  
  // OMEGA-MATRIX: Handle received messages
  const handleReceivedMessage = useCallback((message: MessageData) => {
    const channelId = message.channel || message.recipient || ''
    
    if (channelId) {
      setMessages(prev => {
        const channelMessages = prev[channelId] || []
        
        // Avoid duplicates
        if (!channelMessages.some(m => m.id === message.id)) {
          return {
            ...prev,
            [channelId]: [...channelMessages, message]
          }
        }
        return prev
      })
    }
  }, [])
  
  // OMEGA-MATRIX: Handle typing indicators
  const handleTypingIndicator = useCallback((data: { channelId: string; userId: string; isTyping: boolean }) => {
    setTypingUsers(prev => {
      const currentTyping = prev[data.channelId] || []
      
      if (data.isTyping) {
        // Add user if not already typing
        if (!currentTyping.includes(data.userId)) {
          return {
            ...prev,
            [data.channelId]: [...currentTyping, data.userId]
          }
        }
      } else {
        // Remove user from typing list
        return {
          ...prev,
          [data.channelId]: currentTyping.filter(id => id !== data.userId)
        }
      }
      
      return prev
    })
  }, [])
  
  // OMEGA-MATRIX: Set up event listeners when socket changes
  useEffect(() => {
    if (!socketRef.current?.connected) return
    
    // Subscribe to message events
    const unsubscribeMessage = subscribeToEvent<MessageData>('message', handleReceivedMessage)
    
    // Subscribe to typing events
    const unsubscribeTyping = subscribeToEvent<{ channelId: string; userId: string; isTyping: boolean }>(
      'typing',
      handleTypingIndicator
    )
    
    // Subscribe to connection state changes
    const unsubscribeDisconnect = subscribeToEvent('disconnect', () => {
      setConnectionState(ConnectionState.DISCONNECTED)
    })
    
    const unsubscribeReconnect = subscribeToEvent('reconnect', () => {
      setConnectionState(ConnectionState.CONNECTED)
    })
    
    // Cleanup subscriptions
    return () => {
      unsubscribeMessage()
      unsubscribeTyping()
      unsubscribeDisconnect()
      unsubscribeReconnect()
    }
  }, [handleReceivedMessage, handleTypingIndicator])
  
  // OMEGA-MATRIX: Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && connectionState === ConnectionState.DISCONNECTED) {
      connect()
    }
    
    // Disconnect when logging out
    if (!isAuthenticated && connectionState !== ConnectionState.DISCONNECTED) {
      disconnect()
    }
    
    // Cleanup on unmount
    return () => {
      if (connectionState !== ConnectionState.DISCONNECTED) {
        disconnect()
      }
    }
  }, [isAuthenticated, connectionState, connect, disconnect])
  
  // CIPHER-X: Create context value
  const contextValue: MessagingContextType = {
    connectionState,
    connect,
    disconnect,
    messages,
    sendMessage: sendMessageHandler,
    clearMessages,
    activeChannel,
    setActiveChannel,
    joinChannel: joinChannelHandler,
    leaveChannel: leaveChannelHandler,
    typingUsers,
    sendTypingIndicator,
    error,
    clearError
  }
  
  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  )
}

// CIPHER-X: Custom hook for accessing messaging context
export function useMessaging(): MessagingContextType {
  const context = useContext(MessagingContext)
  
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  
  return context
}
