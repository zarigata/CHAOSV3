/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                      USER CONTROLLER [NEXUS-IDENTITY-771]                          ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Controller for managing user profiles, friends, and status                         ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { UserStatus } from '@shared/types';

/**
 * CIPHER-X: Retrieve a user profile by ID
 * Access limited to owner and friends for private data
 * Public data accessible to all users
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId)
      .select('-password')
      .populate('friends', 'id username displayName avatar status customStatus lastActive');
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Determine if requesting user is the owner or a friend
    const isOwner = req.user && req.user._id.toString() === userId;
    const isFriend = req.user && user.friends.some(
      (friend: any) => friend._id.toString() === req.user._id.toString()
    );
    
    // Filter data based on permissions
    let userData: any = {
      id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      bio: user.bio
    };
    
    // Include status if user has appropriate privacy settings
    if (isOwner || isFriend || user.settings.statusPrivacy === 'public') {
      userData.status = user.status;
      userData.customStatus = user.customStatus;
      userData.lastActive = user.lastActive;
    }
    
    // Include private data for owner or friends depending on privacy settings
    if (isOwner || (isFriend && user.settings.statusPrivacy !== 'private')) {
      userData.friends = user.friends;
    }
    
    // Only owner can see these fields
    if (isOwner) {
      userData.email = user.email;
      userData.pendingFriends = user.pendingFriends;
      userData.blockedUsers = user.blockedUsers;
      userData.settings = user.settings;
    }
    
    // Return the profile data
    res.status(200).json({
      success: true,
      data: userData,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/******************************************************************
 * CIPHER-X: PROFILE MANAGEMENT PROTOCOL
 * Updates user profile data with advanced MSN-style fields
 * Handles preferences, statuses, and appearance settings
 ******************************************************************/
export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { 
      displayName, 
      bio, 
      avatar, 
      status, 
      statusMessage, 
      personalMessage, 
      customStatus,
      preferences 
    } = req.body;
    
    // Build update data object with all allowed fields
    const updateData: any = {};
    
    // Basic profile fields
    if (displayName) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (avatar !== undefined) updateData.avatar = avatar;
    
    // Status fields
    if (status !== undefined) {
      const validStatuses = ['online', 'away', 'busy', 'brb', 'phone', 'lunch', 'offline'];
      if (validStatuses.includes(status)) {
        updateData.status = status;
      } else {
        throw new ApiError('Invalid status value', 400);
      }
    }
    
    // Status messages
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage;
    if (personalMessage !== undefined) updateData.personalMessage = personalMessage;
    if (customStatus !== undefined) updateData.customStatus = customStatus;
    
    // User preferences
    if (preferences) {
      // Use $set with dot notation for nested objects
      if (preferences.isAnimated !== undefined) updateData['preferences.isAnimated'] = preferences.isAnimated;
      if (preferences.enableWinks !== undefined) updateData['preferences.enableWinks'] = preferences.enableWinks;
      if (preferences.theme !== undefined) updateData['preferences.theme'] = preferences.theme;
      if (preferences.language !== undefined) updateData['preferences.language'] = preferences.language;
      
      // Handle nested notification preferences
      if (preferences.notifications) {
        if (preferences.notifications.sound !== undefined) {
          updateData['preferences.notifications.sound'] = preferences.notifications.sound;
        }
        if (preferences.notifications.messagePreview !== undefined) {
          updateData['preferences.notifications.messagePreview'] = preferences.notifications.messagePreview;
        }
        if (preferences.notifications.friendRequests !== undefined) {
          updateData['preferences.notifications.friendRequests'] = preferences.notifications.friendRequests;
        }
      }
    }
    
    // Update the user profile with the new data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      throw new ApiError('User not found', 404);
    }
    
    // Log successful profile update
    logger.info(`User ${userId} updated their profile`);
    
    // Return the updated profile with success status
    res.status(200).json({
      success: true,
      user: updatedUser,
      timestamp: new Date()
    });
  } catch (error: any) {
    logger.error(`Profile update failed: ${error.message || 'Unknown error'}`);
    next(error);
  }
};

/**
 * CIPHER-X: Update user status with classic MSN-style presence
 * Allows setting custom status messages and availability
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { status, customStatus } = req.body;
    
    // Validate status if provided
    if (status && !Object.values(UserStatus).includes(status as UserStatus)) {
      throw new ApiError('Invalid status value', 400);
    }
    
    // Update data object
    const updateData: any = {
      lastActive: new Date()
    };
    
    if (status) updateData.status = status;
    if (customStatus !== undefined) updateData.customStatus = customStatus;
    
    // Update the user status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('_id username displayName status customStatus lastActive');
    
    if (!updatedUser) {
      throw new ApiError('User not found', 404);
    }
    
    // Return the updated status
    res.status(200).json({
      success: true,
      data: updatedUser,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Update user settings and preferences
 * Handles notification, privacy, and UI preferences
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const updateUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { theme, notifications, sounds, language, statusPrivacy, autoLogin } = req.body;
    
    // Build the settings update object
    const settingsUpdate: any = {};
    
    if (theme) settingsUpdate['settings.theme'] = theme;
    if (notifications !== undefined) settingsUpdate['settings.notifications'] = notifications;
    if (sounds !== undefined) settingsUpdate['settings.sounds'] = sounds;
    if (language) settingsUpdate['settings.language'] = language;
    if (statusPrivacy) settingsUpdate['settings.statusPrivacy'] = statusPrivacy;
    if (autoLogin !== undefined) settingsUpdate['settings.autoLogin'] = autoLogin;
    
    // Update user settings
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: settingsUpdate },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      throw new ApiError('User not found', 404);
    }
    
    // Return the updated settings
    res.status(200).json({
      success: true,
      data: updatedUser.settings,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Send friend request to another user
 * Initiates a friend connection between two users
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;
    
    // Validate target user ID
    if (!targetUserId) {
      throw new ApiError('Target user ID is required', 400);
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      throw new ApiError('User not found', 404);
    }
    
    // Check if trying to add self
    if (userId.toString() === targetUserId) {
      throw new ApiError('Cannot send friend request to yourself', 400);
    }
    
    // Check if already friends
    if (req.user.friends.includes(targetUserId)) {
      throw new ApiError('Already friends with this user', 400);
    }
    
    // Check if friend request is already pending
    if (targetUser.pendingFriends.includes(userId)) {
      throw new ApiError('Friend request already pending', 400);
    }
    
    // Add to target user's pending friends list
    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { pendingFriends: userId }
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        message: 'Friend request sent successfully'
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Accept a pending friend request
 * Completes the friend connection between two users
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const acceptFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { requesterId } = req.params;
    
    // Validate requester ID
    if (!requesterId) {
      throw new ApiError('Requester ID is required', 400);
    }
    
    // Check if requester exists
    const requester = await User.findById(requesterId);
    
    if (!requester) {
      throw new ApiError('Requester not found', 404);
    }
    
    // Check if request is actually pending
    if (!req.user.pendingFriends.includes(requesterId)) {
      throw new ApiError('No pending friend request from this user', 400);
    }
    
    // Transaction-like operations to update both users
    // Add each user to the other's friends list
    await User.findByIdAndUpdate(userId, {
      $pull: { pendingFriends: requesterId },
      $addToSet: { friends: requesterId }
    });
    
    await User.findByIdAndUpdate(requesterId, {
      $addToSet: { friends: userId }
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        message: 'Friend request accepted'
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Reject a pending friend request
 * Removes the friend request without creating a connection
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const rejectFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { requesterId } = req.params;
    
    // Validate requester ID
    if (!requesterId) {
      throw new ApiError('Requester ID is required', 400);
    }
    
    // Check if request is actually pending
    if (!req.user.pendingFriends.includes(requesterId)) {
      throw new ApiError('No pending friend request from this user', 400);
    }
    
    // Remove from pending friends
    await User.findByIdAndUpdate(userId, {
      $pull: { pendingFriends: requesterId }
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        message: 'Friend request rejected'
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Remove a user from friends list
 * Breaks the friend connection between two users
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const removeFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { friendId } = req.params;
    
    // Validate friend ID
    if (!friendId) {
      throw new ApiError('Friend ID is required', 400);
    }
    
    // Check if actually friends
    if (!req.user.friends.includes(friendId)) {
      throw new ApiError('User is not in your friends list', 400);
    }
    
    // Transaction-like operations to remove the friendship on both sides
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });
    
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        message: 'Friend removed successfully'
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Block a user
 * Prevents communication and automatically removes any friend connection
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const blockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;
    
    // Validate target user ID
    if (!targetUserId) {
      throw new ApiError('Target user ID is required', 400);
    }
    
    // Check if target user exists
    const targetExists = await User.exists({ _id: targetUserId });
    
    if (!targetExists) {
      throw new ApiError('User not found', 404);
    }
    
    // Check if trying to block self
    if (userId.toString() === targetUserId) {
      throw new ApiError('Cannot block yourself', 400);
    }
    
    // Series of operations to update relationships
    // 1. Add to blocked users
    // 2. Remove from friends if they are friends
    // 3. Remove from pending friends if there's a pending request
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: targetUserId },
      $pull: { 
        friends: targetUserId,
        pendingFriends: targetUserId
      }
    });
    
    // Also remove the user from the target's friends/pending
    await User.findByIdAndUpdate(targetUserId, {
      $pull: { 
        friends: userId,
        pendingFriends: userId
      }
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        message: 'User blocked successfully'
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Unblock a previously blocked user
 * Allows communication again but doesn't restore friend status
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const unblockUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { blockedUserId } = req.params;
    
    // Validate blocked user ID
    if (!blockedUserId) {
      throw new ApiError('Blocked user ID is required', 400);
    }
    
    // Check if user is actually blocked
    if (!req.user.blockedUsers.includes(blockedUserId)) {
      throw new ApiError('User is not in your blocked list', 400);
    }
    
    // Remove from blocked users
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: blockedUserId }
    });
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        message: 'User unblocked successfully'
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Get all friends with their online status
 * Returns a list of friends with online status and last activity
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getFriends = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    
    // Get user with populated friends
    const user = await User.findById(userId)
      .populate('friends', 'id username displayName avatar status customStatus lastActive')
      .select('friends');
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Return friends list
    res.status(200).json({
      success: true,
      data: user.friends,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Get all pending friend requests
 * Returns users who have sent friend requests to current user
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getPendingFriendRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    
    // Get user with populated pending friends
    const user = await User.findById(userId)
      .populate('pendingFriends', 'id username displayName avatar')
      .select('pendingFriends');
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Return pending requests
    res.status(200).json({
      success: true,
      data: user.pendingFriends,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  updateUserStatus,
  updateUserSettings,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  getFriends,
  getPendingFriendRequests
};
