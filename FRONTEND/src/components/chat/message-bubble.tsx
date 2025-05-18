// ==========================================================
// 💬 C.H.A.O.S. MESSAGE BUBBLE COMPONENT 💬
// ==========================================================
// - MSN MESSENGER INSPIRED MESSAGE STYLING
// - SECURE CONTENT RENDERING WITH ENCRYPTION INDICATORS
// - CONTEXTUAL DISPLAY BASED ON SENDER/RECIPIENT
// - CROSS-PLATFORM RENDERING COMPATIBILITY
// ==========================================================

import { useState } from 'react';
import { motion } from 'framer-motion';

// Icons
import { CheckCheck, Clock, Edit, Lock, MoreVertical, Reply, Trash } from 'lucide-react';

// Types
import { Message, Contact } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  contact: Contact;
}

export function MessageBubble({ message, isMine, contact }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  
  // Format message timestamp
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format message date if needed (for message grouping)
  const formatMessageDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if same day
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise return full date
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Reply reference if message is a reply */}
        {message.replyToId && message.replyTo && (
          <div 
            className={`
              mb-1 flex items-center gap-1 rounded-md border-l-2 border-msn-primary/50 
              bg-muted/30 px-2 py-1 pl-3 text-xs text-muted-foreground
            `}
          >
            <Reply size={12} className="shrink-0" />
            <span className="font-medium">
              {message.replyTo.senderId === 'current-user-id' ? 'You' : contact.displayName}:
            </span>
            <span className="line-clamp-1 overflow-hidden text-ellipsis">
              {message.replyTo.content}
            </span>
          </div>
        )}
        
        {/* Message content bubble */}
        <div
          className={`
            message-bubble relative
            ${isMine 
              ? 'sent rounded-bl-lg rounded-tl-lg rounded-tr-sm bg-msn-primary text-white' 
              : 'received rounded-br-lg rounded-tr-lg rounded-tl-sm bg-muted'}
          `}
        >
          {/* Message content */}
          <div className="break-words">
            {message.isDeleted ? (
              <span className="italic text-muted-foreground">
                {isMine ? 'You deleted this message' : 'This message was deleted'}
              </span>
            ) : (
              <div>
                {message.content}
                {message.isEdited && (
                  <span className="ml-1 inline-flex items-center text-xs opacity-70">
                    (edited)
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Encryption indicator */}
          {message.isEncrypted && (
            <div className="mt-1 flex items-center justify-end gap-1 text-xs opacity-70">
              <Lock size={10} className="shrink-0" />
              <span>Encrypted</span>
            </div>
          )}
          
          {/* Message metadata (time & status) */}
          <div 
            className={`
              mt-1 flex items-center gap-1 text-xs opacity-70
              ${isMine ? 'justify-end' : 'justify-start'}
            `}
          >
            <span>{formatMessageTime(message.createdAt)}</span>
            
            {/* Delivery status (for sent messages) */}
            {isMine && (
              message.id.startsWith('temp-') 
                ? <Clock size={10} /> 
                : <CheckCheck size={10} />
            )}
          </div>
        </div>
        
        {/* Message actions */}
        {showActions && !message.isDeleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mt-1 flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}
          >
            <button 
              className="rounded-full p-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Reply"
            >
              <Reply size={14} />
            </button>
            
            {isMine && (
              <>
                <button 
                  className="rounded-full p-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                
                <button 
                  className="rounded-full p-1 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
                >
                  <Trash size={14} />
                </button>
              </>
            )}
            
            <button 
              className="rounded-full p-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              title="More options"
            >
              <MoreVertical size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
