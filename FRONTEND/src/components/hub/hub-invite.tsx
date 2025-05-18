// ==========================================================
// 🤝 C.H.A.O.S. HUB INVITATION COMPONENT 🤝
// ==========================================================
// █ █ █ █ █▄▄   █ █▄░█ █░█ █ ▀█▀ █▀▀   █▀▀ █░░ █▀█ █░█░█
// █▀█ █▄█ █▄█   █ █░▀█ ▀▄▀ █ ░█░ ██▄   █▀░ █▄▄ █▄█ ▀▄▀▄▀
// ==========================================================
// [CODEX-1337] THIS MODULE HANDLES INVITATIONS TO HUBS (SERVERS)
// [CODEX-1337] PROVIDES UI FOR CREATING AND MANAGING INVITES
// [CODEX-1337] SUPPORTS TEMPORARY AND PERMANENT INVITE LINKS
// [CODEX-1337] INCLUDES COPY-TO-CLIPBOARD FUNCTIONALITY
// ==========================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Clock, RefreshCw, Link, Mail, Users } from 'lucide-react';

type HubInviteProps = {
  hubId: string;
  hubName: string;
  onClose: () => void;
};

type InviteLink = {
  id: string;
  code: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  createdAt: string;
};

// Mock invite links for development
const mockInviteLinks: InviteLink[] = [
  {
    id: 'inv1',
    code: 'CHAOS-abc123',
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
    maxUses: 10,
    uses: 3,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'inv2',
    code: 'CHAOS-xyz789',
    expiresAt: null, // Never expires
    maxUses: null, // Unlimited uses
    uses: 12,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export function HubInvite({ hubId, hubName, onClose }: HubInviteProps) {
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>(mockInviteLinks);
  const [selectedExpiry, setSelectedExpiry] = useState<'1_day' | '7_days' | '30_days' | 'never'>('7_days');
  const [selectedUses, setSelectedUses] = useState<'10' | '25' | '50' | 'unlimited'>('10');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEmailInvite, setIsEmailInvite] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  
  // Format expiry time to human-readable format
  const formatExpiry = (expiresAt: string | null): string => {
    if (!expiresAt) return 'Never expires';
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `Expires in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return 'Expires soon';
    }
  };
  
  // Get milliseconds for selected expiry
  const getExpiryMs = (): number | null => {
    switch (selectedExpiry) {
      case '1_day': return 86400000;
      case '7_days': return 86400000 * 7;
      case '30_days': return 86400000 * 30;
      case 'never': return null;
    }
  };
  
  // Get max uses for selected option
  const getMaxUses = (): number | null => {
    switch (selectedUses) {
      case '10': return 10;
      case '25': return 25;
      case '50': return 50;
      case 'unlimited': return null;
    }
  };
  
  // Create a new invite link
  const createInviteLink = async () => {
    setIsCreating(true);
    
    try {
      // In a real app, this would make an API call
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const expiryMs = getExpiryMs();
      const maxUses = getMaxUses();
      
      const newInvite: InviteLink = {
        id: `inv${Date.now()}`,
        code: `CHAOS-${Math.random().toString(36).substring(2, 8)}`,
        expiresAt: expiryMs ? new Date(Date.now() + expiryMs).toISOString() : null,
        maxUses,
        uses: 0,
        createdAt: new Date().toISOString(),
      };
      
      setInviteLinks([newInvite, ...inviteLinks]);
    } catch (error) {
      console.error('Error creating invite link:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Delete an invite link
  const deleteInviteLink = async (id: string) => {
    try {
      // In a real app, this would make an API call
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setInviteLinks(inviteLinks.filter(link => link.id !== id));
    } catch (error) {
      console.error('Error deleting invite link:', error);
    }
  };
  
  // Copy invite link to clipboard
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(`https://chaos-app.example/invite/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  
  // Send email invite
  const sendEmailInvite = async () => {
    if (!emailInput.trim() || !/^\S+@\S+\.\S+$/.test(emailInput)) {
      alert('Please enter a valid email address');
      return;
    }
    
    try {
      // In a real app, this would make an API call
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear the input after successful send
      setEmailInput('');
      alert(`Invitation sent to ${emailInput}`);
    } catch (error) {
      console.error('Error sending email invite:', error);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="msn-window max-w-md"
    >
      <div className="msn-header flex items-center justify-between text-sm font-medium">
        <h2 className="flex items-center">
          <Users className="mr-2 h-4 w-4" />
          Invite People to {hubName}
        </h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          &times;
        </button>
      </div>
      
      <div className="p-4">
        {/* Tab toggle */}
        <div className="mb-4 flex rounded-md bg-muted">
          <button
            onClick={() => setIsEmailInvite(false)}
            className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm ${
              !isEmailInvite ? 'bg-msn-primary text-white' : 'text-muted-foreground'
            }`}
          >
            <Link className="mr-2 h-4 w-4" />
            Invite Link
          </button>
          <button
            onClick={() => setIsEmailInvite(true)}
            className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm ${
              isEmailInvite ? 'bg-msn-primary text-white' : 'text-muted-foreground'
            }`}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email Invite
          </button>
        </div>
        
        {!isEmailInvite ? (
          <>
            {/* Create invite link */}
            <div className="mb-6 rounded-md border border-border p-3">
              <h3 className="mb-2 text-sm font-medium">Create Invite Link</h3>
              
              {/* Expiry options */}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Expires After
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '1_day', label: '1 day' },
                    { value: '7_days', label: '7 days' },
                    { value: '30_days', label: '30 days' },
                    { value: 'never', label: 'Never' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedExpiry(option.value as any)}
                      className={`rounded-md px-2 py-1 text-xs ${
                        selectedExpiry === option.value
                          ? 'bg-msn-primary/10 text-msn-primary'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Max uses options */}
              <div className="mb-3">
                <label className="mb-1 block text-xs text-muted-foreground">
                  Max Number of Uses
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: '10', label: '10 uses' },
                    { value: '25', label: '25 uses' },
                    { value: '50', label: '50 uses' },
                    { value: 'unlimited', label: 'Unlimited' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedUses(option.value as any)}
                      className={`rounded-md px-2 py-1 text-xs ${
                        selectedUses === option.value
                          ? 'bg-msn-primary/10 text-msn-primary'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={createInviteLink}
                disabled={isCreating}
                className="mt-2 flex w-full items-center justify-center rounded-md bg-msn-primary px-4 py-2 text-sm text-white disabled:opacity-70"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Generate Invite Link'
                )}
              </button>
            </div>
            
            {/* Existing invite links */}
            <div>
              <h3 className="mb-2 text-sm font-medium">Active Invite Links</h3>
              
              {inviteLinks.length === 0 ? (
                <p className="rounded-md bg-muted p-4 text-center text-sm text-muted-foreground">
                  No active invite links. Create one above.
                </p>
              ) : (
                <div className="space-y-3">
                  {inviteLinks.map((link) => (
                    <div
                      key={link.id}
                      className="rounded-md border border-border bg-card p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="overflow-hidden">
                          <div className="flex items-center">
                            <Link className="mr-2 h-4 w-4 text-muted-foreground" />
                            <code className="text-xs">{link.code}</code>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatExpiry(link.expiresAt)}</span>
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {link.maxUses 
                              ? `${link.uses}/${link.maxUses} uses` 
                              : `${link.uses} uses (unlimited)`}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => copyToClipboard(link.code, link.id)}
                            className="rounded-md bg-background p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Copy invite link"
                          >
                            {copiedId === link.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => deleteInviteLink(link.id)}
                            className="rounded-md bg-background p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            title="Delete invite link"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Email invite */}
            <div className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-medium">Invite via Email</h3>
              <p className="mb-4 text-xs text-muted-foreground">
                Send an invitation directly to someone's email address.
              </p>
              
              <label htmlFor="email" className="mb-1 block text-xs font-medium">
                Email Address
              </label>
              <div className="flex gap-2">
                <input
                  id="email"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="friend@example.com"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={sendEmailInvite}
                  className="rounded-md bg-msn-primary px-4 py-2 text-sm text-white"
                >
                  Send
                </button>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p className="mb-2">Tips:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Invitations are valid for 7 days</li>
                <li>Users will need to create an account if they don't have one</li>
                <li>You can revoke access by removing them from the hub later</li>
              </ul>
            </div>
          </>
        )}
      </div>
      
      <div className="msn-footer border-t border-border p-3 text-center text-xs text-muted-foreground">
        Only invite people you trust. Hub owners can see invitation history.
      </div>
    </motion.div>
  );
}
