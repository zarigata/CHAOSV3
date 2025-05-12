/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                    CHANNEL DATABASE MODEL [NEXUS-STREAM-443]                       ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Database schema and model for server channels and direct messages                 ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import mongoose, { Document, Schema } from 'mongoose';

// Permission overrides for specific roles or users
const PermissionOverrideSchema = new Schema({
  // Either a role ID or user ID
  target: {
    type: Schema.Types.ObjectId,
    required: true
  },
  // Indicates if this is a role or user override
  type: {
    type: String,
    enum: ['role', 'user'],
    required: true
  },
  // Allowed permissions (override default)
  allow: [{
    type: String,
    enum: [
      'read_messages',
      'send_messages',
      'embed_links',
      'attach_files',
      'mention_everyone',
      'external_emojis',
      'manage_messages',
      'voice_connect',
      'voice_speak',
      'voice_mute_members',
      'voice_deafen_members',
      'voice_move_members',
      'voice_activity',
      'priority_speaker'
    ]
  }],
  // Denied permissions (override default)
  deny: [{
    type: String,
    enum: [
      'read_messages',
      'send_messages',
      'embed_links',
      'attach_files',
      'mention_everyone',
      'external_emojis',
      'manage_messages',
      'voice_connect',
      'voice_speak',
      'voice_mute_members',
      'voice_deafen_members',
      'voice_move_members',
      'voice_activity',
      'priority_speaker'
    ]
  }]
}, { _id: false });

// Interface for Direct Message Channel (user-to-user)
export interface IDirectMessageChannel extends Document {
  type: 'dm';
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Server Channel (inside a server)
export interface IServerChannel extends Document {
  type: 'text' | 'voice' | 'video' | 'category';
  name: string;
  server: mongoose.Types.ObjectId;
  description?: string;
  position: number;
  parentId?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  topic?: string;
  slowMode?: number; // Seconds of delay between messages
  permissionOverrides: Array<{
    target: mongoose.Types.ObjectId;
    type: 'role' | 'user';
    allow: string[];
    deny: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Group Channel (multi-user but not server-based)
export interface IGroupChannel extends Document {
  type: 'group';
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  avatar?: string;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  unreadCount: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// Combined Channel interface (union type)
export interface IChannel extends Document {
  type: 'dm' | 'text' | 'voice' | 'video' | 'category' | 'group';
  name?: string;
  server?: mongoose.Types.ObjectId;
  description?: string;
  participants?: mongoose.Types.ObjectId[];
  owner?: mongoose.Types.ObjectId;
  position?: number;
  parentId?: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastActivity: Date;
  topic?: string;
  slowMode?: number;
  avatar?: string;
  unreadCount?: Map<string, number>;
  permissionOverrides?: Array<{
    target: mongoose.Types.ObjectId;
    type: 'role' | 'user';
    allow: string[];
    deny: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Channel schema with discriminator for different types
const ChannelSchema = new Schema<IChannel>({
  type: {
    type: String,
    enum: ['dm', 'text', 'voice', 'video', 'category', 'group'],
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  server: {
    type: Schema.Types.ObjectId,
    ref: 'Server'
  },
  description: {
    type: String
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  position: {
    type: Number
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Channel'
  },
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  topic: {
    type: String
  },
  slowMode: {
    type: Number
  },
  avatar: {
    type: String
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  permissionOverrides: [PermissionOverrideSchema]
}, {
  timestamps: true,
  discriminatorKey: 'type'
});

// Create the base channel model
const Channel = mongoose.model<IChannel>('Channel', ChannelSchema);

// Create discriminators for specific channel types
export const DirectMessageChannel = Channel.discriminator<IDirectMessageChannel>(
  'dm',
  new Schema({
    participants: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      validate: [(val: any) => val.length === 2, 'DM channels must have exactly 2 participants']
    }
  })
);

export const ServerChannel = Channel.discriminator<IServerChannel>(
  'text',
  new Schema({
    name: {
      type: String,
      required: true
    },
    server: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      required: true
    }
  })
);

export const VoiceChannel = Channel.discriminator<IServerChannel>(
  'voice',
  new Schema({
    name: {
      type: String,
      required: true
    },
    server: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      required: true
    }
  })
);

export const VideoChannel = Channel.discriminator<IServerChannel>(
  'video',
  new Schema({
    name: {
      type: String,
      required: true
    },
    server: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      required: true
    }
  })
);

export const CategoryChannel = Channel.discriminator<IServerChannel>(
  'category',
  new Schema({
    name: {
      type: String,
      required: true
    },
    server: {
      type: Schema.Types.ObjectId,
      ref: 'Server',
      required: true
    }
  })
);

export const GroupChannel = Channel.discriminator<IGroupChannel>(
  'group',
  new Schema({
    name: {
      type: String,
      required: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    participants: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      validate: [(val: any) => val.length > 1, 'Group channels must have at least 2 participants']
    }
  })
);

// Export all models
export { Channel as default, Channel };
