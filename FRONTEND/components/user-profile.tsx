"use client"

import { useState, useEffect } from "react"
import { useAuth } from "./auth-provider"
import { User } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Upload, ImageIcon } from "lucide-react"

/******************************************************************
 * CIPHER-X: USER PROFILE CONTROL CENTER
 * Manages user identity, presence, and customization settings
 * Synchronizes with backend for persistent data storage
 ******************************************************************/
export function UserProfile() {
  // OMEGA-MATRIX: Connection to auth system
  const { user, token, updateProfile } = useAuth()
  
  // CIPHER-X: User editable profile fields
  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || "")
  const [status, setStatus] = useState<User['status']>(user?.status || "online")
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || "")
  const [personalMessage, setPersonalMessage] = useState(user?.personalMessage || "")
  const [isAnimated, setIsAnimated] = useState(user?.preferences?.isAnimated !== false)
  const [enableWinks, setEnableWinks] = useState(user?.preferences?.enableWinks !== false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // CIPHER-X: Sync profile data with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.username || "")
      setStatus(user.status || "online")
      setStatusMessage(user.statusMessage || "")
      setPersonalMessage(user.personalMessage || "")
      setIsAnimated(user.preferences?.isAnimated !== false)
      setEnableWinks(user.preferences?.enableWinks !== false)
    }
  }, [user])
  
  /******************************************************************
   * CIPHER-X: PROFILE DATA SYNCHRONIZATION PROTOCOL
   * Collects form data and submits to API via auth context
   * Handles success/error states and user feedback
   ******************************************************************/
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      // Prepare updated profile data
      const profileData: Partial<User> = {
        displayName,
        status,
        statusMessage,
        personalMessage,
        preferences: {
          ...(user.preferences || {}),
          isAnimated,
          enableWinks
        }
      };
      
      // Call the updateProfile method from auth context
      const result = await updateProfile(profileData);
      
      if (result) {
        setSuccess('✓ Profile updated successfully!');
        // Success notification disappears after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { value: "online", label: "Online" },
    { value: "away", label: "Away" },
    { value: "busy", label: "Busy" },
    { value: "brb", label: "Be Right Back" },
    { value: "phone", label: "On the Phone" },
    { value: "lunch", label: "Out to Lunch" },
    { value: "offline", label: "Appear Offline" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "away":
        return "bg-yellow-500"
      case "busy":
        return "bg-red-500"
      case "brb":
        return "bg-yellow-500"
      case "phone":
        return "bg-purple-500"
      case "lunch":
        return "bg-orange-500"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="border border-[#D4D0C8] rounded-md overflow-hidden bg-white">
      <Tabs defaultValue="profile" className="w-full">
        <div className="bg-[#ECE9D8] border-b border-[#D4D0C8] p-2">
          <TabsList className="bg-[#ECE9D8] border border-[#D4D0C8]">
            <TabsTrigger value="profile" className="text-xs data-[state=active]:bg-[#F5F4EA]">
              Profile
            </TabsTrigger>
            <TabsTrigger value="display-picture" className="text-xs data-[state=active]:bg-[#F5F4EA]">
              Display Picture
            </TabsTrigger>
            <TabsTrigger value="emoticons" className="text-xs data-[state=active]:bg-[#F5F4EA]">
              Emoticons
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="p-4 m-0">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <div className="border border-[#D4D0C8] rounded-md p-4 bg-[#F5F4EA] flex flex-col items-center">
                <div className="relative mb-4">
                  <img
                    src="/placeholder.svg?height=128&width=128"
                    alt="Display Picture"
                    className={`w-32 h-32 rounded-md border-2 border-[#316AC5] ${isAnimated ? "animate-pulse" : ""}`}
                  />
                  <span
                    className={`absolute bottom-2 right-2 w-4 h-4 ${getStatusColor(status)} rounded-full border-2 border-white`}
                  ></span>
                </div>
                <h3 className="text-lg font-bold mb-1">{displayName}</h3>
                <p className="text-sm text-gray-600 italic mb-3">"{personalMessage}"</p>
                <div className="flex items-center text-sm">
                  <span className={`w-2 h-2 ${getStatusColor(status)} rounded-full mr-1`}></span>
                  <span className="capitalize">{status}</span>
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              <div className="border border-[#D4D0C8] rounded-md p-4 bg-[#F5F4EA]">
                <h3 className="text-md font-semibold mb-4 border-b border-[#D4D0C8] pb-2">Edit Profile</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Display Name</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-white border-[#D4D0C8]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <Select 
                  value={status} 
                  onValueChange={(value) => setStatus(value as User['status'])}>
                
                      <SelectTrigger className="bg-white border-[#D4D0C8]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center">
                              <span className={`w-2 h-2 ${getStatusColor(option.value)} rounded-full mr-2`}></span>
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status Message</label>
                    <Input
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      className="bg-white border-[#D4D0C8]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Personal Message</label>
                    <Textarea
                      value={personalMessage}
                      onChange={(e) => setPersonalMessage(e.target.value)}
                      className="bg-white border-[#D4D0C8]"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end mt-6">
                    {error && <p className="text-red-500 text-sm mr-auto">{error}</p>}
                    {success && <p className="text-green-500 text-sm mr-auto">{success}</p>}
                    <Button 
                      className="bg-[#316AC5] hover:bg-[#2A5BD7]"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    
                    {/******************************************************************
                     * CIPHER-X: PROFILE SAVE HANDLER 
                     * Processes profile updates and sends to backend
                     * Confirms success or displays errors to user
                     ******************************************************************/}
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="display-picture" className="p-4 m-0">
          <div className="border border-[#D4D0C8] rounded-md p-4 bg-[#F5F4EA]">
            <h3 className="text-md font-semibold mb-4 border-b border-[#D4D0C8] pb-2">Display Picture</h3>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3 flex flex-col items-center">
                <img
                  src="/placeholder.svg?height=128&width=128"
                  alt="Current Display Picture"
                  className={`w-32 h-32 rounded-md border-2 border-[#316AC5] mb-4 ${isAnimated ? "animate-pulse" : ""}`}
                />
                <p className="text-sm text-center mb-4">Current Display Picture</p>
                <Button className="bg-[#316AC5] hover:bg-[#2A5BD7] w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Picture
                </Button>
              </div>

              <div className="md:w-2/3">
                <h4 className="text-sm font-medium mb-3">Choose from Gallery</h4>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div
                      key={index}
                      className="border border-[#D4D0C8] rounded-md overflow-hidden cursor-pointer hover:border-[#316AC5]"
                    >
                      <img
                        src={`/placeholder.svg?height=80&width=80&text=Avatar${index + 1}`}
                        alt={`Avatar option ${index + 1}`}
                        className="w-full h-auto"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Display Picture Options</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="animated"
                        className="mr-2"
                        checked={isAnimated}
                        onChange={(e) => setIsAnimated(e.target.checked)}
                      />
                      <label htmlFor="animated" className="text-sm">
                        Enable animated display picture
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="winks"
                        className="mr-2"
                        checked={enableWinks}
                        onChange={(e) => setEnableWinks(e.target.checked)}
                      />
                      <label htmlFor="winks" className="text-sm">
                        Enable winks and emotions
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emoticons" className="p-4 m-0">
          <div className="border border-[#D4D0C8] rounded-md p-4 bg-[#F5F4EA]">
            <h3 className="text-md font-semibold mb-4 border-b border-[#D4D0C8] pb-2">Custom Emoticons</h3>

            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">My Emoticon Packs</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["Classic C.H.A.O.S.", "Animated Fun", "Retro Gaming"].map((pack, index) => (
                  <div
                    key={index}
                    className="border border-[#D4D0C8] rounded-md p-3 bg-white cursor-pointer hover:border-[#316AC5]"
                  >
                    <h5 className="text-sm font-medium mb-2">{pack}</h5>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 5 }).map((_, emoIndex) => (
                        <div key={emoIndex} className="w-6 h-6 bg-gray-200 rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Upload Custom Emoticons</h4>
              <p className="text-xs text-gray-600 mb-3">
                Upload your own emoticons to use in chats (16x16 pixels recommended)
              </p>

              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Emoticon shortcut (e.g., :cool:)"
                  className="bg-white border-[#D4D0C8]"
                />
                <Button variant="outline" className="border-[#D4D0C8]">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </div>

              <Button className="bg-[#316AC5] hover:bg-[#2A5BD7] mt-3">
                <Upload className="w-4 h-4 mr-2" />
                Add Emoticon
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
