/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                    ELECTRON PRELOAD SCRIPT [SENTINEL-BRIDGE-441]                   ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Secure bridge between Electron and renderer processes                             ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * CIPHER-X: Exposed API to renderer process
 * Provides secure access to main process functionality
 * while maintaining context isolation for security
 */
contextBridge.exposeInMainWorld('electron', {
  // Window controls
  windowControls: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    quit: () => ipcRenderer.send('app:quit')
  },
  
  // App info
  appInfo: {
    version: process.env.npm_package_version || '1.0.0',
    isDev: process.env.NODE_ENV === 'development'
  },
  
  // IPC communication
  on: (channel: string, callback: (...args: any[]) => void) => {
    // Whitelist channels that can be listened to
    const validChannels = [
      'status-change',
      'update-available',
      'update-downloaded',
      'update-error'
    ];
    
    if (validChannels.includes(channel)) {
      // Filtering for security
      const filteredCallback = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, filteredCallback);
      
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener(channel, filteredCallback);
      };
    }
    
    return () => {}; // Empty cleanup for invalid channels
  },
  
  // Send message to main process
  send: (channel: string, data?: any) => {
    // Whitelist channels that can be sent to
    const validChannels = [
      'app:quit',
      'check-for-updates',
      'install-update'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  }
});
