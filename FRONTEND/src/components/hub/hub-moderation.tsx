// ==========================================================
// 🛡️ C.H.A.O.S. HUB MODERATION COMPONENT 🛡️
// ==========================================================
// [CODEX-1337] HUB MODERATION FEATURES FOR SERVER ADMINISTRATORS
// [CODEX-1337] ENABLES MESSAGE DELETION, USER BANNING, AND ROLE MANAGEMENT
// [CODEX-1337] PROVIDES AUDIT LOG OF MODERATION ACTIONS
// [CODEX-1337] CROSS-PLATFORM COMPATIBLE INTERFACE
// ==========================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Trash, Ban, UserCheck, Clock, Search, AlertTriangle } from 'lucide-react';

// Types
type ModAction = {
  id: string;
  action: 'delete_message' | 'ban_user' | 'kick_user' | 'change_role';
  targetId: string;
  targetName: string;
  targetType: 'message' | 'user';
  performedBy: string;
  performedById: string;
  reason: string | null;
  timestamp: string;
};

type ModUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
  joinedAt: string;
  isBanned: boolean;
};

type HubModerationProps = {
  hubId: string;
  hubName: string;
};

// Mock data for development
const mockActions: ModAction[] = [
  {
    id: 'act1',
    action: 'delete_message',
    targetId: 'msg123',
    targetName: 'Inappropriate message',
    targetType: 'message',
    performedBy: 'John Admin',
    performedById: 'user2',
    reason: 'Violated community guidelines',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'act2',
    action: 'kick_user',
    targetId: 'user3',
    targetName: 'ToxicGamer99',
    targetType: 'user',
    performedBy: 'John Admin',
    performedById: 'user2',
    reason: 'Spamming in channels',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'act3',
    action: 'change_role',
    targetId: 'user4',
    targetName: 'FriendlyHelper',
    targetType: 'user',
    performedBy: 'Sarah Owner',
    performedById: 'user1',
    reason: 'Promoted to moderator for helpful contributions',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const mockUsers: ModUser[] = [
  {
    id: 'user1',
    username: 'sarah_owner',
    displayName: 'Sarah Owner',
    avatarUrl: null,
    role: 'OWNER',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    isBanned: false,
  },
  {
    id: 'user2',
    username: 'john_admin',
    displayName: 'John Admin',
    avatarUrl: null,
    role: 'ADMIN',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    isBanned: false,
  },
  {
    id: 'user3',
    username: 'toxicgamer99',
    displayName: 'ToxicGamer99',
    avatarUrl: null,
    role: 'MEMBER',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    isBanned: false,
  },
  {
    id: 'user4',
    username: 'friendlyhelper',
    displayName: 'FriendlyHelper',
    avatarUrl: null,
    role: 'MODERATOR',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    isBanned: false,
  },
  {
    id: 'user5',
    username: 'banned_user',
    displayName: 'Banned User',
    avatarUrl: null,
    role: 'MEMBER',
    joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    isBanned: true,
  },
];

export function HubModeration({ hubId, hubName }: HubModerationProps) {
  // State
  const [activeTab, setActiveTab] = useState<'members' | 'audit'>('members');
  const [users, setUsers] = useState<ModUser[]>(mockUsers);
  const [actions, setActions] = useState<ModAction[]>(mockActions);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBannedOnly, setShowBannedOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ModUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [currentAction, setCurrentAction] = useState<'ban' | 'kick' | 'role' | null>(null);
  const [selectedRole, setSelectedRole] = useState<ModUser['role']>('MEMBER');
  
  // Filter users based on search and banned status
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBanFilter = showBannedOnly ? user.isBanned : true;
    return matchesSearch && matchesBanFilter;
  });
  
  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };
  
  // Handle ban user
  const handleBanUser = (user: ModUser) => {
    setSelectedUser(user);
    setCurrentAction('ban');
    setActionReason('');
    setIsModalOpen(true);
  };
  
  // Handle kick user
  const handleKickUser = (user: ModUser) => {
    setSelectedUser(user);
    setCurrentAction('kick');
    setActionReason('');
    setIsModalOpen(true);
  };
  
  // Handle change role
  const handleChangeRole = (user: ModUser) => {
    setSelectedUser(user);
    setCurrentAction('role');
    setSelectedRole(user.role);
    setIsModalOpen(true);
  };
  
  // Submit moderation action
  const submitAction = () => {
    if (!selectedUser || !currentAction) return;
    
    // Create a new action record
    const newAction: ModAction = {
      id: `act${Date.now()}`,
      action: currentAction === 'ban' ? 'ban_user' : 
              currentAction === 'kick' ? 'kick_user' : 'change_role',
      targetId: selectedUser.id,
      targetName: selectedUser.displayName,
      targetType: 'user',
      performedBy: 'Current User', // Would be actual user in production
      performedById: 'current-user-id',
      reason: actionReason || null,
      timestamp: new Date().toISOString(),
    };
    
    // Update user state
    const updatedUsers = users.map(user => {
      if (user.id === selectedUser.id) {
        if (currentAction === 'ban') {
          return { ...user, isBanned: true };
        } else if (currentAction === 'role') {
          return { ...user, role: selectedRole };
        }
      }
      return user;
    });
    
    // Update state
    setUsers(updatedUsers);
    setActions([newAction, ...actions]);
    
    // Close modal
    setIsModalOpen(false);
    setSelectedUser(null);
    setCurrentAction(null);
  };
  
  return (
    <div className="msn-window h-full">
      <div className="msn-header flex items-center justify-between">
        <h2 className="flex items-center text-sm font-medium">
          <Shield className="mr-2 h-4 w-4" />
          {hubName} Moderation
        </h2>
        
        {/* Tabs */}
        <div className="flex items-center text-xs">
          <button
            onClick={() => setActiveTab('members')}
            className={`px-3 py-1 ${activeTab === 'members' ? 'text-msn-primary' : 'text-muted-foreground'}`}
          >
            <Users className="mr-1 inline-block h-3 w-3" />
            Members
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 ${activeTab === 'audit' ? 'text-msn-primary' : 'text-muted-foreground'}`}
          >
            <Clock className="mr-1 inline-block h-3 w-3" />
            Audit Log
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {activeTab === 'members' ? (
          <>
            {/* Search and filters */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search members..."
                  className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="bannedOnly"
                  type="checkbox"
                  checked={showBannedOnly}
                  onChange={() => setShowBannedOnly(!showBannedOnly)}
                  className="h-4 w-4 rounded border-input"
                />
                <label htmlFor="bannedOnly" className="ml-2 text-xs">
                  Banned only
                </label>
              </div>
            </div>
            
            {/* Member list */}
            <div className="max-h-96 overflow-y-auto rounded-md border border-border">
              <table className="w-full">
                <thead className="bg-muted text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Member</th>
                    <th className="px-4 py-2 text-left font-medium">Role</th>
                    <th className="px-4 py-2 text-left font-medium">Joined</th>
                    <th className="px-4 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className={user.isBanned ? 'bg-destructive/5' : ''}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-primary/10">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.displayName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-primary">
                                {user.displayName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.displayName}</div>
                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                          </div>
                          {user.isBanned && (
                            <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                              Banned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          user.role === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'MODERATOR' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Ban/Unban button */}
                          <button
                            onClick={() => handleBanUser(user)}
                            disabled={user.role === 'OWNER' || user.id === 'current-user-id'}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:pointer-events-none"
                            title={user.isBanned ? 'Unban user' : 'Ban user'}
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          
                          {/* Kick button */}
                          <button
                            onClick={() => handleKickUser(user)}
                            disabled={user.role === 'OWNER' || user.isBanned || user.id === 'current-user-id'}
                            className="rounded p-1 text-muted-foreground hover:bg-amber-100 hover:text-amber-600 disabled:opacity-50 disabled:pointer-events-none"
                            title="Kick from hub"
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          
                          {/* Change role button */}
                          <button
                            onClick={() => handleChangeRole(user)}
                            disabled={user.role === 'OWNER' || user.isBanned || user.id === 'current-user-id'}
                            className="rounded p-1 text-muted-foreground hover:bg-blue-100 hover:text-blue-600 disabled:opacity-50 disabled:pointer-events-none"
                            title="Change role"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            {/* Audit log */}
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">Recent Moderation Actions</h3>
              <div className="text-xs text-muted-foreground">
                Showing last {actions.length} actions
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {actions.map((action) => (
                <div key={action.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {action.action === 'delete_message' && <Trash className="mr-2 h-4 w-4 text-destructive" />}
                      {action.action === 'ban_user' && <Ban className="mr-2 h-4 w-4 text-destructive" />}
                      {action.action === 'kick_user' && <Users className="mr-2 h-4 w-4 text-amber-500" />}
                      {action.action === 'change_role' && <UserCheck className="mr-2 h-4 w-4 text-blue-500" />}
                      <span className="font-medium">
                        {action.action === 'delete_message' && 'Message Deleted'}
                        {action.action === 'ban_user' && 'User Banned'}
                        {action.action === 'kick_user' && 'User Kicked'}
                        {action.action === 'change_role' && 'Role Changed'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(action.timestamp)}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Target: </span>
                      <span>{action.targetName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">By: </span>
                      <span>{action.performedBy}</span>
                    </div>
                    {action.reason && (
                      <div className="mt-1 rounded-md bg-muted p-2 text-sm">
                        <span className="block text-xs text-muted-foreground">Reason:</span>
                        {action.reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Moderation action modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md rounded-md bg-background p-4 shadow-lg"
          >
            <div className="mb-4 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-bold">
                {currentAction === 'ban' && (selectedUser.isBanned ? 'Unban' : 'Ban')}
                {currentAction === 'kick' && 'Kick'}
                {currentAction === 'role' && 'Change Role'}
                {' '}User
              </h3>
            </div>
            
            <div className="mb-4">
              <p>
                You are about to {' '}
                {currentAction === 'ban' && (selectedUser.isBanned ? 'unban' : 'ban')}
                {currentAction === 'kick' && 'kick'}
                {currentAction === 'role' && 'change the role of'}
                {' '}
                <strong>{selectedUser.displayName}</strong>.
                {currentAction !== 'role' && ' This action can be reversed later.'}
              </p>
              
              {currentAction === 'role' && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium">Select Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as ModUser['role'])}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="MEMBER">Member</option>
                  </select>
                </div>
              )}
              
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium">Reason (optional)</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Explain why you are taking this action..."
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitAction}
                className="rounded-md bg-destructive px-4 py-2 text-sm text-white"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
