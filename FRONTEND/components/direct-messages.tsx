/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║     << C.H.A.O.S.V3 - CODEX >> DIRECT MESSAGES INTERFACE    ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ One-on-one messaging functionality with real-time updates    ║
 * ║ Includes typing indicators and message delivery status      ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, Paperclip, Smile, Wand2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "./auth-provider"
import { useMessaging } from "./messaging-provider"
import { Alert, AlertDescription } from "./ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
// CIPHER-X: Import socket types and utilities
import { 
  connectSocket, 
  disconnectSocket, 
  sendMessage, 
  joinChannel, 
  leaveChannel,
  subscribeToEvent,
  MessageData,
  ConnectionState
} from "@/lib/socket"
import { ChaosLogo } from "./chaos-logo"

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  isCurrentUser: boolean
}

interface Contact {
  id: number
  name: string
  status: "online" | "away" | "busy" | "offline"
  lastMessage: string
  avatar: string
}

/******************************************************************
 * OMEGA-MATRIX CONVERSION ALGORITHM
 * Transforms raw socket message data into standardized UI format
 * Ensures consistent display regardless of message source
 ******************************************************************/
const convertMessageToUiFormat = (msg: MessageData, currentUserId: string): Message => {
  return {
    id: parseInt(msg.id as string) || Math.floor(Math.random() * 10000),
    sender: msg.sender?.displayName || msg.sender?.username || 'Unknown',
    content: msg.content || '',
    timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isCurrentUser: msg.sender?.id === currentUserId
  };
};

export function DirectMessages() {
  // OMEGA-MATRIX: Authentication & Messaging Systems
  const { user, token } = useAuth();
  const { 
    messages: socketMessages, 
    sendMessage, 
    connectionState, 
    error: messagingError, 
    typingUsers, 
    sendTypingIndicator, 
    activeChannel,
    setActiveChannel,
    joinChannel
  } = useMessaging();
  
  // CIPHER-X: Convert socket messages to UI format
  const messages = socketMessages && Array.isArray(socketMessages) 
    ? socketMessages.map(msg => convertMessageToUiFormat(msg, user?.id || ''))
    : [];
  
  // CIPHER-X: UI State Management
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)
  const messageEndRef = useRef<HTMLDivElement>(null)
  
  // CIPHER-X: Message delivery tracking
  const [sending, setSending] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /******************************************************************
   * CIPHER-X: REAL-TIME USER CONTACTS SYSTEM
   * Maintains active users list with connection status
   * Automatically refreshes when users come online/offline
   ******************************************************************/
  const [contacts, setContacts] = useState<Contact[]>([])

  // OMEGA-MATRIX: Load real user contacts from the backend
  useEffect(() => {
    if (!user?.id) return
    
    // CIPHER-X: Function to fetch contacts from the backend
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/users/contacts`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          // Transform backend data to Contact format
          const contactsList = data.data.map((contact: any) => ({
            id: contact.id,
            name: contact.displayName || contact.username,
            status: contact.status || 'offline',
            lastMessage: contact.lastMessage || 'Start a conversation...',
            avatar: contact.avatar || `/api/avatar/${contact.id}`,
          }))
          setContacts(contactsList)
        } else {
          // If no contacts found, set empty array
          setContacts([])
          setError('Failed to load contacts')
        }
      } catch (err) {
        console.error('Error fetching contacts:', err)
        setError('Failed to load contacts')
        setContacts([])
      }
    }
    
    fetchContacts()
    
    // OMEGA-MATRIX: Real-time contact status updates
    const handleUserOnline = (data: any) => {
      setContacts(prev => 
        prev.map(contact => {
          if (contact.id === data.userId) {
            return { ...contact, status: 'online' }
          }
          return contact
        })
      )
    }
    
    const handleUserOffline = (data: any) => {
      setContacts(prev => 
        prev.map(contact => {
          if (contact.id === data.userId) {
            return { ...contact, status: 'offline' }
          }
          return contact
        })
      )
    }
    
    const handleUserStatusChanged = (data: any) => {
      setContacts(prev => 
        prev.map(contact => {
          if (contact.id === data.userId) {
            return { ...contact, status: data.status }
          }
          return contact
        })
      )
    }
    
    // Subscribe to events
    if (connectionState === ConnectionState.CONNECTED) {
      subscribeToEvent('userOnline', handleUserOnline)
      subscribeToEvent('userOffline', handleUserOffline)
      subscribeToEvent('userStatusChanged', handleUserStatusChanged)
    }
    
    // Refresh contacts list periodically
    const refreshInterval = setInterval(fetchContacts, 60000) // Refresh every minute
    
    return () => {
      clearInterval(refreshInterval)
    }
  }, [user?.id, token, connectionState])

  /******************************************************************
   * CIPHER-X: QUANTUM CONVERSATION LOADER
   * Initializes chat history when contact is selected
   * Loads and formats historical messages from the backend
   ******************************************************************/
  useEffect(() => {
    if (!selectedContact || !user?.id) return;
    
    // Create direct channel ID (user_[contactId])
    const directChannelId = `user_${selectedContact.id}`;
    setActiveChannel(directChannelId);
    
    // Join the channel to receive real-time updates
    joinChannel({
      channelId: directChannelId
    });
    
    // Reset message input
    setMessageInput('');
    
    // Scroll to bottom of messages
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return () => {
      // Leave the channel when unmounting or changing contacts
      if (directChannelId) {
        leaveChannel({
          channelId: directChannelId
        });
      }
      setActiveChannel(null);
    };
  }, [selectedContact, user?.id]);
  // CIPHER-X: Message history management
  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // OMEGA-MATRIX: Connection management
  useEffect(() => {
    if (connectionState === ConnectionState.DISCONNECTED && user?.id) {
      /******************************************************************
       * CIPHER-X: COMMUNICATION PROTOCOL INITIALIZATION
       * Reconnects the socket with proper authentication credentials
       * Uses global auth token stored in the auth context
       ******************************************************************/
      // Connect to the socket server
      connectSocket();
    }
    
    return () => {
      // Clean up socket connection
      if (connectionState === ConnectionState.CONNECTED) {
        disconnectSocket();
      }
    };
  }, [connectionState, user, token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "busy":
        return "bg-red-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  /******************************************************************
 * CIPHER-X MESSAGE TRANSMITTER
 * Processes, validates and dispatches user messages
 * Handles delivery confirmation and error states
 ******************************************************************/
  const handleSendMessage = async () => {
    if (messageInput.trim() && (selectedContact || activeChannel)) {
      try {
        // OMEGA-MATRIX: Visual feedback during message sending
        setSending(true);
        
        /******************************************************************
         * OMEGA-MATRIX TRANSMISSION PROTOCOL
         * Structured message format with required metadata
         * Ensures consistent message handling across system
         ******************************************************************/
        await sendMessage({
          content: messageInput,
          channel: activeChannel || `user_${selectedContact?.id}`,
          sender: {
            id: user?.id || 'unknown',
            username: user?.username || 'user',
            displayName: user?.displayName || user?.username || 'User'
          }
        });
        
        // CIPHER-X: Reset input and typing state
        setMessageInput("");
        setTyping(false);
        sendTypingIndicator(activeChannel || `user_${selectedContact?.id}`, false);
        
        // CIPHER-X: Scroll to bottom after sending
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        setError('Failed to send message. Please try again.');
        console.error('Message send error:', err);
      } finally {
        setSending(false);
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)

    // Show typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true)
      // In a real app, we would send a typing indicator to the server
      setTimeout(() => setIsTyping(false), 3000)
    }
  }

  const sendNudge = () => {
    // In a real app, we would send a nudge to the contact
    const chatWindow = document.getElementById("chat-window")
    if (chatWindow) {
      chatWindow.classList.add("nudge-animation")
      setTimeout(() => {
        chatWindow.classList.remove("nudge-animation")
      }, 1000)
    }
  }

  return (
    <div className="flex h-full border border-[#D4D0C8] rounded-md overflow-hidden bg-white">
      <div className="w-64 border-r border-[#D4D0C8] bg-[#F5F4EA]">
        <div className="p-3 bg-[#ECE9D8] border-b border-[#D4D0C8]">
          <h3 className="text-sm font-semibold">Contacts</h3>
        </div>
        <div className="overflow-y-auto h-[calc(100%-40px)]">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`p-2 cursor-pointer hover:bg-[#EBE8D8] ${
                selectedContact?.id === contact.id ? "bg-[#EBE8D8]" : ""
              }`}
            >
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={contact.avatar || "/placeholder.svg"}
                    alt={contact.name}
                    className="w-8 h-8 rounded-full border border-[#D4D0C8]"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-2 h-2 ${getStatusColor(contact.status)} rounded-full border border-white`}
                  ></span>
                </div>
                <div className="ml-2">
                  <div className="text-sm font-medium">{contact.name}</div>
                  <div className="text-xs text-gray-500 truncate w-40">{contact.lastMessage}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <div className="p-2 bg-[#ECE9D8] border-b border-[#D4D0C8] flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={selectedContact.avatar || "/placeholder.svg"}
                    alt={selectedContact.name}
                    className="w-6 h-6 rounded-full border border-[#D4D0C8]"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-1.5 h-1.5 ${getStatusColor(selectedContact.status)} rounded-full border border-white`}
                  ></span>
                </div>
                <div className="ml-2 text-sm font-medium">{selectedContact.name}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-xs bg-[#F5F4EA] border-[#D4D0C8]"
                onClick={sendNudge}
              >
                <Wand2 className="h-3 w-3 mr-1" />
                Nudge
              </Button>
            </div>

            <div id="chat-window" className="flex-1 overflow-y-auto p-3 bg-[#FFFFFF]">
              {/* OMEGA-MATRIX: Real-time message display */}
              {messages.length > 0 ? (
                messages.map((message: Message) => (
                  <div key={message.id} className={`mb-3 ${message.isCurrentUser ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block max-w-[80%] p-2 rounded-md ${
                        message.isCurrentUser ? "bg-[#D9E7F5] text-[#333333]" : "bg-[#F5F5F5] text-[#333333]"
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1">{message.isCurrentUser ? "You" : message.sender}</div>
                      <div className="text-sm">{message.content}</div>
                      <div className="text-xs text-gray-500 mt-1">{message.timestamp}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="mb-4 opacity-50">
                    <ChaosLogo />
                  </div>
                  <p className="text-sm">
                    {selectedContact ? 'No messages yet. Start the conversation!' : 'Select a contact to start chatting'}
                  </p>
                </div>
              )}

              {isTyping && selectedContact && (
                <div className="text-xs text-gray-500 italic ml-2">{selectedContact.name} is typing...</div>
              )}
            </div>

            <div className="p-3 bg-[#ECE9D8] border-t border-[#D4D0C8]">
              <div className="flex items-center">
                <Button variant="outline" size="icon" className="h-8 w-8 mr-2 bg-[#F5F4EA] border-[#D4D0C8]">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 mr-2 bg-[#F5F4EA] border-[#D4D0C8]">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  className="flex-1 border-slate-200 focus:ring-1 focus:ring-slate-300 mr-2"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    // CIPHER-X: Typing indicator management
                    if (!typing && e.target.value.length > 0) {
                      setTyping(true);
                      sendTypingIndicator(activeChannel || `user_${selectedContact?.id}`, true);
                    } else if (typing && e.target.value.length === 0) {
                      setTyping(false);
                      sendTypingIndicator(activeChannel || `user_${selectedContact?.id}`, false);
                    }
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="text-slate-500">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-500">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    className="bg-[#0078D4] hover:bg-[#106EBE] text-white px-3 py-1 h-8"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending || connectionState !== ConnectionState.CONNECTED}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {sending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4">
                <ChaosLogo className="w-16 h-16" />
              </div>
              <p>Select a contact to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
