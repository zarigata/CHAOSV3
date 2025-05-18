// ==========================================================
// 🔄 C.H.A.O.S. REDIS CONNECTION SERVICE 🔄
// ==========================================================
// - HANDLES REDIS CONNECTION FOR CACHING AND PRESENCE
// - PROVIDES HELPER METHODS FOR COMMON OPERATIONS
// - ENSURES CONNECTION STABILITY WITH RETRY MECHANISM
// ==========================================================

import Redis from 'ioredis';
import { dbLogger as logger } from '../utils/logger';

// Create Redis client with connection options
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    // Exponential backoff strategy
    const delay = Math.min(times * 50, 2000);
    logger.info(`Retrying Redis connection in ${delay}ms...`);
    return delay;
  }
});

// Connect to Redis and handle events
export const connectRedis = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Handle connection events
    redisClient.on('connect', () => {
      logger.info('✅ Connected to Redis successfully');
      resolve();
    });

    redisClient.on('error', (err) => {
      logger.error({ err }, '❌ Redis connection error');
      if (!redisClient.status.includes('ready')) {
        reject(err);
      }
    });

    // Set a timeout for initial connection
    const timeout = setTimeout(() => {
      if (!redisClient.status.includes('ready')) {
        const error = new Error('Redis connection timeout');
        logger.error({ err: error }, '❌ Redis connection failed');
        reject(error);
      }
    }, 10000); // 10 second timeout

    // Clear timeout if connected
    redisClient.on('ready', () => {
      clearTimeout(timeout);
      logger.info('✅ Redis client ready');
    });
  });
};

// ==========================================================
// 👤 USER PRESENCE TRACKING
// ==========================================================

// Key prefixes for Redis
const PRESENCE_PREFIX = 'chaos:presence:';
const USER_STATUS_PREFIX = 'chaos:status:';

/**
 * Update a user's online status
 * @param userId User ID
 * @param status User status enum value
 * @param statusMessage Optional status message
 */
export const setUserStatus = async (
  userId: string,
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'INVISIBLE' | 'OFFLINE',
  statusMessage?: string
): Promise<void> => {
  try {
    // Store user status and last seen timestamp
    await redisClient.hset(
      `${USER_STATUS_PREFIX}${userId}`,
      {
        status,
        statusMessage: statusMessage || '',
        lastSeen: Date.now(),
      }
    );
    
    // If user is ONLINE, add to presence set with expiration
    if (status === 'ONLINE') {
      await redisClient.sadd(PRESENCE_PREFIX, userId);
      // Auto-expire after 5 minutes of inactivity
      await redisClient.expire(`${USER_STATUS_PREFIX}${userId}`, 300);
    } else {
      // Remove from presence set if not online
      await redisClient.srem(PRESENCE_PREFIX, userId);
    }
  } catch (err) {
    logger.error({ err, userId }, 'Failed to update user status');
    throw err;
  }
};

/**
 * Get a user's current status
 * @param userId User ID
 * @returns Status object or null if not found
 */
export const getUserStatus = async (userId: string) => {
  try {
    const status = await redisClient.hgetall(`${USER_STATUS_PREFIX}${userId}`);
    if (!status || Object.keys(status).length === 0) return null;
    
    // Parse lastSeen timestamp
    return {
      ...status,
      lastSeen: parseInt(status.lastSeen)
    };
  } catch (err) {
    logger.error({ err, userId }, 'Failed to get user status');
    return null;
  }
};

/**
 * Get all online users
 * @returns Array of user IDs
 */
export const getOnlineUsers = async (): Promise<string[]> => {
  try {
    return await redisClient.smembers(PRESENCE_PREFIX);
  } catch (err) {
    logger.error({ err }, 'Failed to get online users');
    return [];
  }
};

// ==========================================================
// 💾 CACHING UTILITIES
// ==========================================================

/**
 * Set a cached value with expiration
 * @param key Cache key
 * @param value Value to store
 * @param ttlSeconds Time to live in seconds
 */
export const setCacheValue = async (
  key: string, 
  value: string | object, 
  ttlSeconds: number = 3600
): Promise<void> => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await redisClient.set(key, stringValue, 'EX', ttlSeconds);
  } catch (err) {
    logger.error({ err, key }, 'Failed to set cache value');
    throw err;
  }
};

/**
 * Get a cached value
 * @param key Cache key
 * @returns Cached value or null
 */
export const getCacheValue = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (err) {
    logger.error({ err, key }, 'Failed to get cached value');
    return null;
  }
};

/**
 * Get a cached object
 * @param key Cache key
 * @returns Parsed object or null
 */
export const getCacheObject = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    logger.error({ err, key }, 'Failed to get cached object');
    return null;
  }
};

/**
 * Delete a cached value
 * @param key Cache key
 */
export const deleteCacheValue = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.error({ err, key }, 'Failed to delete cached value');
    throw err;
  }
};

// Export Redis client for direct use when needed
export { redisClient };
