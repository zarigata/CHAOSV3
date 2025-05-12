/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                   MESSAGE DATABASE MODEL [CRYPTO-MESSENGER-553]                    ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Database schema and model for chat messages and attachments                       ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import mongoose, { Document, Schema } from 'mongoose';

// Attachment subdocument schema
const AttachmentSchema = new Schema({
  type: {
    type: String,
    enum: ['image', 'video', 'audio', 'file'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  }
}, { _id: true });

// Reaction subdocument schema
const ReactionSchema = new Schema({
  emoji: {
    type: String,
    required: true
  },
  users: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { _id: false });

// Interface for Message document
export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient?: mongoose.Types.ObjectId;
  channel?: mongoose.Types.ObjectId;
  server?: mongoose.Types.ObjectId;
  content: string;
  readBy: mongoose.Types.ObjectId[];
  edited: boolean;
  editHistory?: Array<{
    content: string;
    timestamp: Date;
  }>;
  replyTo?: mongoose.Types.ObjectId;
  attachments?: Array<{
    type: string;
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }>;
  reactions?: Array<{
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Message schema
const MessageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // For direct messages (one-to-one)
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // For server channels
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'Channel'
  },
  // Reference to server (for easier querying)
  server: {
    type: Schema.Types.ObjectId,
    ref: 'Server'
  },
  content: {
    type: String,
    required: true
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    timestamp: Date
  }],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  attachments: [AttachmentSchema],
  reactions: [ReactionSchema]
}, {
  timestamps: true
});

// Pre-save middleware to handle message edits
MessageSchema.pre('findOneAndUpdate', function(next) {
  const update: any = this.getUpdate();
  
  // If content is being updated and it's not a new message
  if (update.content) {
    // Get the original document
    this.findOne({}).then((original: IMessage | null) => {
      if (original) {
        // Initialize editHistory array if it doesn't exist
        if (!update.$set) {
          update.$set = {};
        }
        
        if (!update.$set.editHistory) {
          update.$set.editHistory = original.editHistory || [];
        }
        
        // Add the original content to edit history
        update.$set.editHistory.push({
          content: original.content,
          timestamp: new Date()
        });
        
        // Mark as edited
        update.$set.edited = true;
        
        next();
      } else {
        next();
      }
    }).catch((err) => next(err));
  } else {
    next();
  }
});

// Create and export the Message model
export default mongoose.model<IMessage>('Message', MessageSchema);
