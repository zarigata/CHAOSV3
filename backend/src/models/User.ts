/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                     USER DATABASE MODEL [SENTINEL-PROFILES-311]                    ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Database schema and model for user accounts and profiles                          ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserStatus } from '../../../shared/types';

// Interface for User document extending the base Document type
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar?: string;
  status: UserStatus;
  customStatus?: string;
  bio?: string;
  friends: mongoose.Types.ObjectId[];
  pendingFriends: mongoose.Types.ObjectId[];
  blockedUsers: mongoose.Types.ObjectId[];
  settings: {
    theme: string;
    notifications: boolean;
    sounds: boolean;
    language: string;
    statusPrivacy: string;
    autoLogin: boolean;
  };
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define the User schema
const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.OFFLINE
  },
  customStatus: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: null
  },
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingFriends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    theme: {
      type: String,
      enum: ['default', 'dark', 'light', 'retro', 'classic-msn'],
      default: 'classic-msn'
    },
    notifications: {
      type: Boolean,
      default: true
    },
    sounds: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    statusPrivacy: {
      type: String,
      enum: ['public', 'friends-only', 'private'],
      default: 'friends-only'
    },
    autoLogin: {
      type: Boolean,
      default: true
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create and export the User model
export default mongoose.model<IUser>('User', UserSchema);
