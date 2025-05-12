"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "./auth-provider"
import { useMessaging } from "./messaging-provider"
import { Send, Paperclip, Smile, Users, PlusCircle, Video, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  avatar: string
}

/******************************************************************
 * NEXUS-IDENTITY: GROUP MEMBER SCHEMA
 * User entry with classic MSN-style presence indicators
 * Matches expanded status options in shared User type
 ******************************************************************/
interface GroupMember {
  id: number;
  name: string;
  status: "online" | "away" | "busy" | "brb" | "phone" | "lunch" | "offline";
  avatar: string;
}

interface ChatGroup {
  id: number
  name: string
  members: GroupMember[]
  messages: Message[]
}

/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║ << C.H.A.O.S.V3 - CODEX >> GROUP CHAT INTERFACE          ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ Real-time group messaging with user presence and history   ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/
export function GroupChat() {
  // CIPHER-X: Core state management
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [groups, setGroups] = useState<ChatGroup[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const messageEndRef = useRef<HTMLDivElement>(null)
  
  // OMEGA-MATRIX: Authentication & Messaging
  const { user, token } = useAuth()
  const { 
    messages: socketMessages, 
    sendMessage, 
    connectionState, 
    typingUsers, 
    sendTypingIndicator, 
    activeChannel,
    setActiveChannel,
    joinChannel
  } = useMessaging()
  
  /******************************************************************
   * CIPHER-X: GROUP DATA ACQUISITION PROTOCOL
   * Fetches all available groups from the backend API
   * Populates the groups list with real data
   ******************************************************************/
  /******************************************************************
   * CIPHER-X: GROUP DATA ACQUISITION PROTOCOL
   * Tries to fetch groups from API with fallback to local mock data
   * Handles API connectivity issues gracefully
   ******************************************************************/
  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.id) return
      
      try {
        setLoading(true)
        setError(null)
        
        // Attempt to fetch from API
        let apiDataFetched = false;
        
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/servers/channels`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            // Short timeout to prevent long waits if API is down
            signal: AbortSignal.timeout(5000)
          })
          
          if (response.ok) {
            const data = await response.json()
            console.log('Successfully fetched group data:', data)
            
            // When API endpoint is implemented, we'll process real data here
            // const transformedGroups = data.data.map(...)
            // setGroups(transformedGroups)
            // apiDataFetched = true;
          }
        } catch (apiError) {
          console.warn('API fetch failed, using fallback data:', apiError)
        }
        
        // If API data wasn't successfully fetched, use fallback mock data
        if (!apiDataFetched) {
          // Mock data for development/fallback
          const mockGroups: ChatGroup[] = [
            {
              id: 1,
              name: "CHAOS Development",
              members: [
                {
                  id: 1,
                  name: user.displayName || user.username,
                  status: "online",
                  avatar: user.avatar || `/api/avatar/${user.id}`
                },
                {
                  id: 2,
                  name: "Alice Dev",
                  status: "away",
                  avatar: "/avatars/alice.png"
                },
                {
                  id: 3,
                  name: "Bob Tester",
                  status: "busy",
                  avatar: "/avatars/bob.png"
                }
              ],
              messages: [
                {
                  id: 101,
                  sender: "Alice Dev",
                  content: "Just pushed some updates to the server controller",
                  timestamp: new Date(Date.now() - 3600000).toISOString(),
                  avatar: "/avatars/alice.png"
                },
                {
                  id: 102,
                  sender: "Bob Tester",
                  content: "I'll test it right away",
                  timestamp: new Date(Date.now() - 1800000).toISOString(),
                  avatar: "/avatars/bob.png"
                },
                {
                  id: 103,
                  sender: user.displayName || user.username,
                  content: "Great work team! Let me know if you need anything.",
                  timestamp: new Date(Date.now() - 900000).toISOString(),
                  avatar: user.avatar || `/api/avatar/${user.id}`
                }
              ]
            },
            {
              id: 2,
              name: "UI/UX Design Group",
              members: [
                {
                  id: 1,
                  name: user.displayName || user.username,
                  status: "online",
                  avatar: user.avatar || `/api/avatar/${user.id}`
                },
                {
                  id: 4,
                  name: "Charlie Designer",
                  status: "online",
                  avatar: "/avatars/charlie.png"
                },
                {
                  id: 5,
                  name: "Diana UX",
                  status: "brb",
                  avatar: "/avatars/diana.png"
                }
              ],
              messages: []
            },
          ];
          
          setGroups(mockGroups);
          console.info('Using mock group data until API is implemented');
        }
      } catch (error) {
        console.error('Error in group data handling:', error);
        setError('Failed to load groups. Please try again later.');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroups();
  }, [user, token])
  
  // OMEGA-MATRIX: Load real message history when a group is selected
  useEffect(() => {
    if (!selectedGroup || !user?.id) return;
    
    // Create group channel ID
    const groupChannelId = `group_${selectedGroup.id}`;
    setActiveChannel(groupChannelId);
    
    // Join the channel to receive real-time updates
    joinChannel({
      channelId: groupChannelId
    });
    
    // Fetch message history for the selected group
    const fetchGroupMessages = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/groups/${selectedGroup.id}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Transform message data
          const messageHistory = data.data.map((msg: any) => ({
            id: msg._id,
            sender: msg.sender.displayName || msg.sender.username,
            content: msg.content,
            timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: msg.sender.avatar || `/api/avatar/${msg.sender._id}`,
          }));
          
          // Update the selected group with message history
          setSelectedGroup(prev => prev ? {...prev, messages: messageHistory} : null);
        }
      } catch (err) {
        console.error('Error fetching group messages:', err);
        setError('Failed to load message history');
      }
    };
    
    fetchGroupMessages();
    
    // Cleanup when unmounting or changing groups
    return () => {
      const groupChannelId = `group_${selectedGroup.id}`;
      setActiveChannel(null);
    };
  }, [selectedGroup?.id, user?.id, token]);

  // CIPHER-X: Message sending functionality
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedGroup || !user?.id) return;
    
    try {
      setSending(true);
      
      await sendMessage({
        content: messageInput,
        channel: `group_${selectedGroup.id}`,
        sender: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || user.username
        }
      });
      
      setMessageInput('');
      
      // Scroll to bottom
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };
  
  /******************************************************************
   * CIPHER-X: UI INTERACTION HANDLERS
   * Process user interactions with the group chat interface
   * Handle message input, selection, and display
   ******************************************************************/
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator to group channel
    if (selectedGroup) {
      sendTypingIndicator(`group_${selectedGroup.id}`, e.target.value.length > 0);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleGroupSelect = (group: ChatGroup) => {
    setSelectedGroup(group);
    setMessageInput('');
    setError(null);
  };
  
  // CIPHER-X: Keep messages scrolled to bottom on new messages
  useEffect(() => {
    if (messageEndRef.current && selectedGroup?.messages) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedGroup?.messages?.length]);

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
   * CIPHER-X: MESSAGE RENDERING UTILITIES
   * Helper functions for consistent UI display of messages and statuses
   ******************************************************************/

  return (
    <div className="flex h-full border border-[#D4D0C8] rounded-md overflow-hidden bg-white">
      <div className="w-64 border-r border-[#D4D0C8] bg-[#F5F4EA]">
        <div className="p-3 bg-[#ECE9D8] border-b border-[#D4D0C8] flex justify-between items-center">
          <h3 className="text-sm font-semibold">Groups</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-40px)]">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className={`p-2 cursor-pointer hover:bg-[#EBE8D8] ${
                selectedGroup?.id === group.id ? "bg-[#EBE8D8]" : ""
              }`}
            >
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-[#316AC5] to-[#1C3E9C] text-white rounded-full w-8 h-8 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="ml-2">
                  <div className="text-sm font-medium">{group.name}</div>
                  <div className="text-xs text-gray-500">{group.members.length} members</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <div className="p-2 bg-[#ECE9D8] border-b border-[#D4D0C8] flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-[#316AC5] to-[#1C3E9C] text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <Users className="w-3 h-3" />
                </div>
                <div className="ml-2 text-sm font-medium">{selectedGroup.name}</div>
              </div>
              <div className="flex items-center">
                <Button variant="outline" size="icon" className="h-6 w-6 mr-1 bg-[#F5F4EA] border-[#D4D0C8]">
                  <Phone className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="icon" className="h-6 w-6 mr-2 bg-[#F5F4EA] border-[#D4D0C8]">
                  <Video className="h-3 w-3" />
                </Button>
                <TabsList className="bg-[#ECE9D8] border border-[#D4D0C8]">
                  <TabsTrigger value="chat" className="text-xs data-[state=active]:bg-[#F5F4EA]">
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="members" className="text-xs data-[state=active]:bg-[#F5F4EA]">
                    Members
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
              <div className="flex-1 overflow-y-auto p-3 bg-[#FFFFFF]">
                {selectedGroup.messages.map((message) => (
                  <div key={message.id} className="mb-3">
                    <div className="flex">
                      <img
                        src={message.avatar || "/placeholder.svg"}
                        alt={message.sender}
                        className="w-8 h-8 rounded-full border border-[#D4D0C8] mr-2"
                      />
                      <div className="bg-[#F5F5F5] p-2 rounded-md max-w-[80%]">
                        <div className="text-xs font-semibold mb-1">{message.sender}</div>
                        <div className="text-sm">{message.content}</div>
                        <div className="text-xs text-gray-500 mt-1">{message.timestamp}</div>
                      </div>
                    </div>
                  </div>
                ))}
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
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 h-8 bg-white border-[#D4D0C8]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage()
                      }
                    }}
                  />
                  <Button onClick={handleSendMessage} className="ml-2 h-8 bg-[#316AC5] hover:bg-[#2A5BD7] text-white">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="members" className="flex-1 p-0 m-0 overflow-y-auto">
              <div className="p-3">
                <h4 className="text-sm font-semibold mb-2">Members ({selectedGroup.members.length})</h4>
                <div className="space-y-2">
                  {selectedGroup.members.map((member) => (
                    <div key={member.id} className="flex items-center p-2 hover:bg-[#EBE8D8] rounded-md">
                      <div className="relative">
                        <img
                          src={member.avatar || "/placeholder.svg"}
                          alt={member.name}
                          className="w-8 h-8 rounded-full border border-[#D4D0C8]"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-2 h-2 ${getStatusColor(member.status)} rounded-full border border-white`}
                        ></span>
                      </div>
                      <div className="ml-2">
                        <div className="text-sm font-medium">{member.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{member.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="bg-gradient-to-r from-[#316AC5] to-[#1C3E9C] text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <p>Select a group to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
