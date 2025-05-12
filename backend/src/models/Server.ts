/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                    SERVER DATABASE MODEL [NEXUS-PROTOCOL-127]                      ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Database schema and model for communication servers and hubs                      ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Role subdocument schema
const RoleSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#99AAB5'
  },
  permissions: [{
    type: String,
    enum: [
      'administrator',
      'manage_server',
      'manage_channels',
      'manage_roles',
      'manage_messages',
      'kick_members',
      'ban_members',
      'create_invite',
      'change_nickname',
      'manage_nicknames',
      'read_messages',
      'send_messages',
      'embed_links',
      'attach_files',
      'mention_everyone',
      'external_emojis',
      'voice_connect',
      'voice_speak',
      'voice_mute_members',
      'voice_deafen_members',
      'voice_move_members',
      'voice_activity',
      'priority_speaker'
    ]
  }],
  position: {
    type: Number,
    default: 0
  }
}, { _id: true });

// Member subdocument schema (extends a basic user reference with server-specific properties)
const MemberSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nickname: {
    type: String,
    default: null
  },
  roles: [{
    type: Schema.Types.ObjectId
  }],
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Ban subdocument schema
const BanSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String
  },
  bannedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Interface for Server document
export interface IServer extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  moderators: mongoose.Types.ObjectId[];
  members: Array<{
    user: mongoose.Types.ObjectId;
    nickname?: string;
    roles: mongoose.Types.ObjectId[];
    joinedAt: Date;
    lastActive: Date;
  }>;
  bannedUsers: Array<{
    user: mongoose.Types.ObjectId;
    reason?: string;
    bannedBy: mongoose.Types.ObjectId;
    date: Date;
  }>;
  icon?: string;
  banner?: string;
  roles: Array<{
    name: string;
    color: string;
    permissions: string[];
    position: number;
  }>;
  inviteCodes: Array<{
    code: string;
    createdBy: mongoose.Types.ObjectId;
    expiresAt?: Date;
    maxUses?: number;
    uses: number;
  }>;
  settings: {
    defaultChannelId?: mongoose.Types.ObjectId;
    allowDirectMessages: boolean;
    isPrivate: boolean;
    verificationLevel: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the Server schema
const ServerSchema = new Schema<IServer>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [MemberSchema],
  bannedUsers: [BanSchema],
  icon: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  roles: [RoleSchema],
  inviteCodes: [{
    code: {
      type: String,
      default: () => uuidv4().substring(0, 8)
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      default: null
    },
    maxUses: {
      type: Number,
      default: null
    },
    uses: {
      type: Number,
      default: 0
    }
  }],
  settings: {
    defaultChannelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel'
    },
    allowDirectMessages: {
      type: Boolean,
      default: true
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    verificationLevel: {
      type: String,
      enum: ['none', 'low', 'medium', 'high'],
      default: 'low'
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to create default roles
ServerSchema.pre('save', function(next) {
  // Only create default roles if this is a new server (no roles yet)
  if (this.isNew && (!this.roles || this.roles.length === 0)) {
    // @everyone role
    this.roles.push({
      name: '@everyone',
      color: '#99AAB5',
      permissions: [
        'read_messages',
        'send_messages',
        'embed_links',
        'attach_files',
        'voice_connect',
        'voice_speak',
        'voice_activity'
      ],
      position: 0
    });

    // Administrator role
    this.roles.push({
      name: 'Administrator',
      color: '#FF5500',
      permissions: ['administrator'],
      position: 1
    });

    // Moderator role
    this.roles.push({
      name: 'Moderator',
      color: '#00AA00',
      permissions: [
        'manage_messages', 
        'kick_members',
        'manage_nicknames',
        'read_messages',
        'send_messages',
        'embed_links',
        'attach_files',
        'mention_everyone',
        'external_emojis',
        'voice_connect',
        'voice_speak',
        'voice_mute_members',
        'voice_move_members'
      ],
      position: 2
    });
  }
  
  next();
});

// Create and export the Server model
export default mongoose.model<IServer>('Server', ServerSchema);
