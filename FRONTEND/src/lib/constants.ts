// ==========================================================
// 🔧 C.H.A.O.S. SYSTEM CONSTANTS 🔧
// ==========================================================
// - ENVIRONMENT-AWARE CONFIGURATION SYSTEM
// - CROSS-PLATFORM COMPATIBILITY SETTINGS
// - DEFAULT VALUES FOR APPLICATION STATE
// - APPLICATION-WIDE FEATURE FLAGS
// ==========================================================

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Authentication Settings
export const TOKEN_EXPIRE_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
export const MIN_PASSWORD_LENGTH = 8;

// UI Constants
export const DEFAULT_AVATAR = '/assets/default-avatar.png';
export const APP_NAME = 'C.H.A.O.S.';
export const APP_FULL_NAME = 'Communication Hub for Animated Online Socializing';
export const APP_VERSION = '0.1.0';

// Animation Durations (in milliseconds)
export const ANIMATION = {
  FADE: 200,
  SLIDE: 300,
  BOUNCE: 500,
  NOTIFICATION: 400,
};

// MSN Sounds
export const SOUNDS = {
  LOGIN: '/assets/sounds/msn-login.mp3',
  LOGOUT: '/assets/sounds/msn-logout.mp3',
  MESSAGE: '/assets/sounds/msn-message.mp3',
  NUDGE: '/assets/sounds/msn-nudge.mp3',
  TYPING: '/assets/sounds/msn-typing.mp3',
  ONLINE: '/assets/sounds/msn-online.mp3',
};

// System and User Status Types
export enum UserStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  INVISIBLE = 'INVISIBLE',
  OFFLINE = 'OFFLINE',
}

// Message Types
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

// Feature Flags
export const FEATURES = {
  VOICE_CHAT: false,         // Voice chat features
  VIDEO_CHAT: false,         // Video chat features
  FILE_SHARING: true,        // File sharing capabilities
  END_TO_END_ENCRYPTION: true, // End-to-end encryption for DMs
  DARK_MODE: true,           // Dark mode support
  NOTIFICATIONS: true,       // System notifications
  SOUND_EFFECTS: true,       // MSN-style sound effects
  TYPING_INDICATOR: true,    // Typing indicators
};

// Ollama Model Configuration - Default to llama3.2
export const OLLAMA_CONFIG = {
  DEFAULT_MODEL: 'llama3.2',
  API_HOST: 'http://localhost:11434',
  MODELS: [
    'llama3.2',
    'codellama',
    'mistral',
    'phi',
    'gemma',
  ],
};

// Platform Detection
export const IS_WINDOWS = navigator.platform.indexOf('Win') > -1;
export const IS_MAC = navigator.platform.indexOf('Mac') > -1;
export const IS_LINUX = navigator.platform.indexOf('Linux') > -1;
export const IS_TAURI = 'TAURI' in window;

// Cross-Platform Key Shortcuts (for menu items, etc.)
export const KEY_SHORTCUTS = {
  NEW_MESSAGE: IS_MAC ? '⌘N' : 'Ctrl+N',
  SETTINGS: IS_MAC ? '⌘,' : 'Ctrl+,',
  SEARCH: IS_MAC ? '⌘F' : 'Ctrl+F',
  LOGOUT: IS_MAC ? '⌘L' : 'Ctrl+L',
};
