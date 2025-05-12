/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                    TYPE DECLARATIONS [SENTINEL-TYPESYSTEM-993]                     ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Global TypeScript declarations for third-party modules                            ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

// This file contains custom type declarations for modules that don't have TypeScript support
// or for extending existing module types with custom functionality

// Declare additional environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT?: string;
    MONGODB_URI: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRATION?: string;
    JWT_REFRESH_EXPIRATION?: string;
    CORS_ORIGIN?: string;
    SOCKET_CORS_ORIGIN?: string;
    UPLOAD_DIR?: string;
    MAX_FILE_SIZE?: string;
    ICE_SERVER_URLS?: string;
    LOG_LEVEL?: string;
  }
}
