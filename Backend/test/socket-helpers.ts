// ==========================================================
// 📡 C.H.A.O.S. SOCKET TESTING HELPERS 📡
// ==========================================================
// █▀ █▀█ █▀▀ █▄▀ █▀▀ ▀█▀   ▀█▀ █▀▀ █▀ ▀█▀ █▀
// ▄█ █▄█ █▄▄ █░█ ██▄ ░█░   ░█░ ██▄ ▄█ ░█░ ▄█
// ==========================================================
// [CODEX-1337] WEBSOCKET TESTING UTILITIES FOR REAL-TIME TESTS
// [CODEX-1337] CLIENT AND SERVER SOCKET MOCKING
// [CODEX-1337] CROSS-PLATFORM MESSAGE DELIVERY VALIDATION
// ==========================================================

import { io as clientIO, Socket as ClientSocket } from 'socket.io-client';
import { Server as SocketIOServer } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { promisify } from 'util';
import { logger } from '../src/utils/logger';
import * as path from 'path';

/**
 * [CODEX-1337] WebSocket test context
 */
export interface SocketTestContext {
  clientSocket: ClientSocket;
  messages: Record<string, any[]>;
}

/**
 * [CODEX-1337] Create a WebSocket client connected to server
 * @param fastifyApp Fastify app with Socket.IO server
 * @param token Auth token for authenticated connection
 */
export const createSocketClient = async (
  fastifyApp: FastifyInstance,
  token: string
): Promise<SocketTestContext> => {
  // Get server port
  const address = fastifyApp.server.address();
  const port = typeof address === 'object' && address ? address.port : 3001;
  
  // Context to track received messages
  const context: SocketTestContext = {
    clientSocket: {} as ClientSocket,
    messages: {},
  };
  
  // Connect to server with auth token
  context.clientSocket = clientIO(`http://localhost:${port}`, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
  });
  
  // Wait for connection
  await new Promise<void>((resolve) => {
    context.clientSocket.on('connect', () => {
      logger.info('Test client socket connected');
      resolve();
    });

    context.clientSocket.on('connect_error', (err) => {
      logger.error({ error: err }, 'Socket connection error');
    });
  });
  
  // Configure message tracking
  const eventTypes = [
    'message',
    'typing',
    'presence',
    'read',
    'notification'
  ];
  
  eventTypes.forEach(eventType => {
    context.messages[eventType] = [];
    context.clientSocket.on(eventType, (data) => {
      context.messages[eventType].push(data);
    });
  });
  
  return context;
};

/**
 * [CODEX-1337] Clean up WebSocket client
 * @param context Socket test context to clean up
 */
export const cleanupSocketClient = async (
  context: SocketTestContext
): Promise<void> => {
  if (context.clientSocket.connected) {
    context.clientSocket.disconnect();
  }
};

/**
 * [CODEX-1337] Platform-agnostic path for socket.io test resources
 * @param relativePath Relative path to resource
 */
export const getSocketTestPath = (relativePath: string): string => {
  return path.join(__dirname, 'socket-resources', relativePath)
    .replace(/\\/g, '/'); // Normalize for both Windows and Linux
};

/**
 * [CODEX-1337] Emit message and wait for response
 * @param socket Client socket
 * @param eventName Event to emit
 * @param data Data to send
 * @param responseEvent Event to wait for
 */
export const emitAndWait = async (
  socket: ClientSocket,
  eventName: string, 
  data: any,
  responseEvent: string,
  timeout: number = 1000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for ${responseEvent} after sending ${eventName}`));
    }, timeout);
    
    socket.once(responseEvent, (response) => {
      clearTimeout(timer);
      resolve(response);
    });
    
    socket.emit(eventName, data);
  });
};

/**
 * [CODEX-1337] Wait for specific number of events
 * @param socket Client socket
 * @param eventName Event to wait for
 * @param count Number of events to wait for
 */
export const waitForEvents = async (
  socket: ClientSocket,
  eventName: string,
  count: number = 1,
  timeout: number = 1000
): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const received: any[] = [];
    const timer = setTimeout(() => {
      if (received.length >= count) {
        resolve(received);
      } else {
        reject(new Error(`Timeout waiting for ${count} ${eventName} events, got ${received.length}`));
      }
    }, timeout);
    
    const listener = (data: any) => {
      received.push(data);
      if (received.length >= count) {
        socket.off(eventName, listener);
        clearTimeout(timer);
        resolve(received);
      }
    };
    
    socket.on(eventName, listener);
  });
};
