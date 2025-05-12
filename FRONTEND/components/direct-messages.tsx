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
import { MessageData, ConnectionState } from "@/lib/socket"
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
  const { user } = useAuth();
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

  const contacts: Contact[] = [
    {
      id: 1,
      name: "Jessica82",
      status: "online",
      lastMessage: "Hey, how are you?",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 2,
      name: "CoolDude99",
      status: "away",
      lastMessage: "Check out this cool website",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 3,
      name: "GamerGirl2000",
      status: "busy",
      lastMessage: "I'm playing that new game",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: 4,
      name: "TechWizard",
      status: "offline",
      lastMessage: "Did you fix that bug?",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]

  // CIPHER-X: Mock data for demonstration when no real messages available
  const mockMessages: Message[] = [
    {
      id: 1,
      sender: "Jessica82",
      content: "Hey, how are you?",
      timestamp: "10:30 AM",
      isCurrentUser: false,
    },
    {
      id: 2,
      sender: "You",
      content: "I'm good! Just working on this new project.",
      timestamp: "10:32 AM",
      isCurrentUser: true,
    },
    {
      id: 3,
      sender: "Jessica82",
      content: "That sounds cool! What are you building?",
      timestamp: "10:33 AM",
      isCurrentUser: false,
    },
    {
      id: 4,
      sender: "You",
      content: "A messaging app inspired by MSN Messenger and Discord!",
      timestamp: "10:35 AM",
      isCurrentUser: true,
    },
    {
      id: 5,
      sender: "Jessica82",
      content: "Wow, that's so nostalgic! I miss the old MSN days.",
      timestamp: "10:36 AM",
      isCurrentUser: false,
    },
  ]

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
              {/* OMEGA-MATRIX: Real-time message display with fallback to mock data */}
              {(messages && messages.length > 0 ? messages : mockMessages).map((message: Message) => (
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
              ))}

              {isTyping && <div className="text-xs text-gray-500 italic ml-2">{selectedContact.name} is typing...</div>}
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
