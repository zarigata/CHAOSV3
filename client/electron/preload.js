/**
 * /////////////////////////////////////////////////////////////////////////
 * //                                                                     //
 * //   ██████╗ ██████╗ ███████╗██╗      ██████╗  █████╗ ██████╗         //
 * //   ██╔══██╗██╔══██╗██╔════╝██║     ██╔═══██╗██╔══██╗██╔══██╗        //
 * //   ██████╔╝██████╔╝█████╗  ██║     ██║   ██║███████║██║  ██║        //
 * //   ██╔═══╝ ██╔══██╗██╔══╝  ██║     ██║   ██║██╔══██║██║  ██║        //
 * //   ██║     ██║  ██║███████╗███████╗╚██████╔╝██║  ██║██████╔╝        //
 * //   ╚═╝     ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝         //
 * //                                                                     //
 * //  PRELOAD SCRIPT - Secure bridge between worlds                      //
 * //                                                                     //
 * //  [CODEX:PRELOAD]                                                    //
 * //  Security level: Maximum                                            //
 * //  Context: Isolated                                                  //
 * //  API access: Controlled and limited                                 //
 * //                                                                     //
 * //  Process boundary: Main <-> Renderer                                //
 * //  Exposed APIs: File dialogs, app info, platform details             //
 * //                                                                     //
 * /////////////////////////////////////////////////////////////////////////
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * [CODEX:API_EXPOSE]
 * Selectively expose APIs to renderer process
 * All exposed functions are proxied through IPC
 * No direct Node.js access is provided to renderer
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatformInfo: () => ipcRenderer.invoke('get-platform-info'),
  
  // Voice features
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  
  // Listen for events from main process
  onNotification: (callback) => {
    ipcRenderer.on('notification', (event, ...args) => callback(...args));
    return () => {
      ipcRenderer.removeAllListeners('notification');
    };
  },
  
  // Status updates
  onStatusChange: (callback) => {
    ipcRenderer.on('status-change', (event, ...args) => callback(...args));
    return () => {
      ipcRenderer.removeAllListeners('status-change');
    };
  },
  
  // Message events
  onNewMessage: (callback) => {
    ipcRenderer.on('new-message', (event, ...args) => callback(...args));
    return () => {
      ipcRenderer.removeAllListeners('new-message');
    };
  },
  
  // Update status in main process
  setUserStatus: (status) => ipcRenderer.invoke('set-user-status', status),
});

/**
 * [CODEX:VERSION_INFO]
 * Provide version information directly in preload
 * Allows renderer to show version without IPC call
 */
contextBridge.exposeInMainWorld('versionInfo', {
  appVersion: process.env.npm_package_version || 'Unknown',
  electronVersion: process.versions.electron,
  chromeVersion: process.versions.chrome,
  nodeVersion: process.versions.node,
  platform: process.platform,
  arch: process.arch,
});

/**
 * [CODEX:LOGGER]
 * Safe console logging wrapper
 * Prefixes all logs with [RENDERER] for easy identification
 */
contextBridge.exposeInMainWorld('logger', {
  log: (...args) => console.log('[RENDERER]', ...args),
  error: (...args) => console.error('[RENDERER]', ...args),
  warn: (...args) => console.warn('[RENDERER]', ...args),
  info: (...args) => console.info('[RENDERER]', ...args),
});
