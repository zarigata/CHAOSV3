"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Home, Settings, Users, Bot, Hash } from "lucide-react"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ServerNavigationProps {
  serverId: string
  onBack: () => void
  onForward: () => void
  canGoBack: boolean
  canGoForward: boolean
}

export function ServerNavigation({ serverId, onBack, onForward, canGoBack, canGoForward }: ServerNavigationProps) {
  const serverName = getServerName(serverId)

  return (
    <div className="border border-[#D4D0C8] rounded-md bg-[#ECE9D8] p-2">
      <div className="flex items-center">
        <div className="flex items-center space-x-1 mr-3">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack} disabled={!canGoBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onForward} disabled={!canGoForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Home className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex items-center">
          <div className="w-6 h-6 bg-[#316AC5] rounded-md flex items-center justify-center text-white text-xs mr-2">
            {getServerIcon(serverId)}
          </div>
          <h2 className="text-sm font-semibold">{serverName}</h2>
        </div>

        <div className="flex items-center space-x-1">
          <Tabs defaultValue="channels" className="w-auto">
            <TabsList className="bg-[#ECE9D8] border border-[#D4D0C8] h-7">
              <TabsTrigger value="channels" className="text-xs h-5 data-[state=active]:bg-[#F5F4EA]">
                <Hash className="h-3 w-3 mr-1" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs h-5 data-[state=active]:bg-[#F5F4EA]">
                <Users className="h-3 w-3 mr-1" />
                Members
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-[#D4D0C8]">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                <span>Hub Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Hash className="w-4 h-4 mr-2" />
                <span>Manage Channels</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Users className="w-4 h-4 mr-2" />
                <span>Members</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Bot className="w-4 h-4 mr-2" />
                <span>Bots</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

/******************************************************************
 * CIPHER-X: DYNAMIC SERVER DATA HANDLER
 * Fetches and manages server data from the backend API
 * Provides server information throughout the application
 ******************************************************************/
function useServerData() {
  const [serverData, setServerData] = useState<Record<string, {name: string, icon: string}>>({});
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/servers`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch servers');
        }
        
        const data = await response.json();
        
        // Create a lookup object by server ID
        const serverMap: Record<string, {name: string, icon: string}> = {};
        data.data.forEach((server: any) => {
          serverMap[server._id] = {
            name: server.name,
            icon: server.icon || '🖥️' // Default icon if none provided
          };
        });
        
        setServerData(serverMap);
      } catch (error) {
        console.error('Error fetching server data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchServers();
  }, [token]);
  
  return { serverData, loading };
}

function getServerName(serverId: string | null): string {
  const { serverData } = useServerData();
  if (!serverId) return "Unknown Server";
  return serverData[serverId]?.name || "Unknown Server";
}

function getServerIcon(serverId: string | null): string {
  const { serverData } = useServerData();
  if (!serverId) return "?";
  return serverData[serverId]?.icon || "?";
}
