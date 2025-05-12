/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                      DATABASE CONNECTOR [NEXUS-DATA-LINK]                          ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  MongoDB connection management for the CHAOS network                               ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * CIPHER-X: Database Connection Manager
 * Establishes and maintains connection to MongoDB
 * Provides error handling and connection events
 */
export const connectDatabase = async (): Promise<boolean> => {
  try {
    // Try to connect to the MongoDB instance specified in .env
    const primaryMongoURI = process.env.MONGODB_URI;
    const fallbackMongoURI = 'mongodb://localhost:27017/chaosv3';
    const mongoURI = primaryMongoURI || fallbackMongoURI;
    
    // Connection options
    const options = {
      autoIndex: true, // Build indexes
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Longer timeout for initial connection
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 30000, // Give plenty of time to connect
      family: 4, // Use IPv4, skip trying IPv6
      retryWrites: true,
      // For development, we're ok with less secure but more convenient setup
      ssl: process.env.NODE_ENV === 'production',
      tls: process.env.NODE_ENV === 'production'
    };
    
    logger.info(`✨ [DB] Attempting to connect to MongoDB at ${mongoURI}`);
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, options);
    
    logger.info('✨ [DB] Connected to MongoDB successfully');
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('✨ [DB] Mongoose connected to MongoDB');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error(`❌ [DB] Mongoose connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️ [DB] Mongoose disconnected from MongoDB');
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('✨ [DB] Mongoose connection closed due to application termination');
      process.exit(0);
    });
    
    return true;
  } catch (error) {
    logger.error(`❌ [DB] Failed to connect to MongoDB: ${error}`);
    
    // For development mode, we'll continue without MongoDB to test other components
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ [DB] Running in DEVELOPMENT MODE WITHOUT DATABASE - limited functionality');
      return false;
    }
    
    // In production, we'll exit if we can't connect to MongoDB
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    return false;
  }
};

/**
 * CIPHER-X: Database Disconnection
 * Safely disconnects from MongoDB database
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    logger.info('✨ [DB] Disconnected from MongoDB successfully');
  } catch (error) {
    logger.error(`❌ [DB] Error disconnecting from MongoDB: ${error}`);
  }
};

export default {
  connectDatabase,
  disconnectDatabase
};
