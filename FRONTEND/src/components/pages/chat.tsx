// ==========================================================
// 💬 C.H.A.O.S. DIRECT MESSAGING INTERFACE 💬
// ==========================================================
// - MSN MESSENGER INSPIRED CHAT EXPERIENCE
// - REAL-TIME MESSAGE DELIVERY AND STATUS
// - END-TO-END ENCRYPTION SUPPORT
// - CROSS-PLATFORM INTERACTION PATTERNS
// ==========================================================

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks and stores
import { useAuthStore } from '@/store/auth-store';
import { useSocketStore } from '@/store/socket-store';

// Components
import { MessageBubble } from '../chat/message-bubble';
import { TypingIndicator } from '../chat/typing-indicator';
import { ChatHeader } from '../chat/chat-header';
import { EmojiPicker } from '../chat/emoji-picker';

// Icons
import { Send, Paperclip, Smile, Lock, LockOpen, Image, UserPlus } from 'lucide-react';

// Types
import { Contact, Message } from '@/lib/types';

// Mock data for development
const mockContact: Contact = {
  id: '1',
  username: 'sarah_parker',
  displayName: 'Sarah Parker',
  status: 'ONLINE',
  avatarUrl: null,
  statusMessage: 'Working on the new project',
};

const mockMessages: Message[] = [
  {
    id: 'm1',
    content: 'Hey there! How are you doing today?',
    senderId: '1', // Contact
    recipientId: 'current-user-id',
    type: 'TEXT',
    isEncrypted: false,
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'm2',
    content: 'I\'m good! Just working on the C.H.A.O.S. project. It\'s coming along nicely!',
    senderId: 'current-user-id', // Current user
    recipientId: '1',
    type: 'TEXT',
    isEncrypted: false,
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
  },
  {
    id: 'm3',
    content: 'That sounds great! I can\'t wait to see the final product. Do you think we\'ll be able to launch soon?',
    senderId: '1', // Contact
    recipientId: 'current-user-id',
    type: 'TEXT',
    isEncrypted: false,
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'm4',
    content: 'Yes, we\'re on track for the deadline. Just need to finish up a few more features!',
    senderId: 'current-user-id', // Current user
    recipientId: '1',
    type: 'TEXT',
    isEncrypted: true,
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
];

export function ChatPage() {
  // URL parameter for contact ID
  const { userId } = useParams<{ userId: string }>();
  
  // Auth and socket state
  const { user } = useAuthStore();
  const {
    sendDirectMessage,
    sendTypingIndicator,
    typingUsers,
    isConnected,
  } = useSocketStore();
  
  // Local state
  const [contact, setContact] = useState<Contact | null>(mockContact);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if the contact is typing
  const isTyping = userId ? typingUsers.has(userId) : false;
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Load contact and chat history
  useEffect(() => {
    if (userId) {
      // In a real app, we would fetch contact data and message history here
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        setContact(mockContact);
        setMessages(mockMessages);
        setIsLoading(false);
      }, 500);
    }
  }, [userId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Listen for new messages from socket
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent<{ message: Message }>) => {
      const { message } = event.detail;
      
      // Only add message if it's from the current chat
      if (
        (message.senderId === userId && message.recipientId === 'current-user-id') ||
        (message.senderId === 'current-user-id' && message.recipientId === userId)
      ) {
        setMessages(prev => [...prev, message]);
      }
    };
    
    // Add event listener for new messages
    window.addEventListener('chat:new-message', handleNewMessage as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('chat:new-message', handleNewMessage as EventListener);
    };
  }, [userId]);
  
  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Send typing indicator if connected and input is not empty
    if (isConnected && userId) {
      if (value.length > 0) {
        sendTypingIndicator(userId, true);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set new timeout to stop typing indicator after 5 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          sendTypingIndicator(userId, false);
        }, 5000);
      } else {
        // If input is empty, stop typing indicator
        sendTypingIndicator(userId, false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
      }
    }
  };
  
  // Handle text area height adjustment
  const adjustTextareaHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };
  
  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userId || !isConnected) return;
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      senderId: 'current-user-id',
      recipientId: userId,
      type: 'TEXT',
      isEncrypted,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to messages list
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input
    setNewMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendTypingIndicator(userId, false);
    
    try {
      // Send message via socket
      const messageId = await sendDirectMessage(userId, newMessage, 'TEXT');
      
      // Update optimistic message with real ID
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, id: messageId }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Mark optimistic message as failed
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, content: `${msg.content} (failed to send)` }
            : msg
        )
      );
    }
  };
  
  // Add emoji to message
  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (but allow Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Close emoji picker on Escape
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat header with contact info */}
      {contact && (
        <ChatHeader
          contact={contact}
          isEncrypted={isEncrypted}
          toggleEncryption={() => setIsEncrypted(!isEncrypted)}
        />
      )}
      
      {/* Chat messages */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-msn-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading messages...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Message bubbles */}
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isMine={message.senderId === 'current-user-id'}
                contact={contact!}
              />
            ))}
            
            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <TypingIndicator name={contact?.displayName || 'User'} />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
      
      {/* Message input */}
      <div className="border-t border-border p-3">
        <div className="flex flex-col rounded-md border border-input bg-background">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-input px-3 py-2">
            <div className="flex items-center gap-2">
              {/* File attachment button */}
              <button
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Add attachment"
              >
                <Paperclip size={18} />
              </button>
              
              {/* Image upload button */}
              <button
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Add image"
              >
                <Image size={18} />
              </button>
              
              {/* Emoji picker */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Add emoji"
                >
                  <Smile size={18} />
                </button>
                
                {/* Emoji picker dropdown */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full left-0 mb-2"
                    >
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Encryption toggle */}
            <button
              onClick={() => setIsEncrypted(!isEncrypted)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
                isEncrypted
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}
              title={isEncrypted ? 'Encryption enabled' : 'Encryption disabled'}
            >
              {isEncrypted ? <Lock size={12} /> : <LockOpen size={12} />}
              <span>{isEncrypted ? 'Encrypted' : 'Not encrypted'}</span>
            </button>
          </div>
          
          {/* Text input */}
          <div className="flex items-end p-3">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                handleInputChange(e);
                adjustTextareaHeight(e);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="max-h-[150px] min-h-[40px] flex-1 resize-none bg-transparent py-1 text-sm focus:outline-none"
              disabled={!isConnected}
            />
            
            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className={`ml-2 flex h-9 w-9 items-center justify-center rounded-full ${
                newMessage.trim() && isConnected
                  ? 'bg-msn-primary text-white hover:bg-msn-primary/90'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        
        {/* Connection status */}
        {!isConnected && (
          <div className="mt-2 text-center text-xs text-destructive">
            You are currently offline. Reconnecting...
          </div>
        )}
      </div>
    </div>
  );
}
