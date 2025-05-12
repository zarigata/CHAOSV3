/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                      ELECTRON MAIN PROCESS [MATRIX-SHELL-007]                      ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Entry point for the Electron application - creates windows and manages lifecycle  ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { autoUpdater } from 'electron-updater';

// Global references to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let backendProcess: any = null;
let isQuitting = false;

// Configuration
const isDev = process.env.NODE_ENV === 'development';
const PORT = process.env.PORT || 3000;
const backendPort = process.env.BACKEND_PORT || 5000;

/**
 * CIPHER-X: Creates and configures the main application window
 * Initializes with MSN-inspired visual theme and system tray integration
 */
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icons', 'icon.png'),
    frame: false, // For custom window frame
    titleBarStyle: 'hidden',
    backgroundColor: '#ECE9D8', // MSN-inspired background
    show: false // Don't show until ready
  });

  // Load the app - either from dev server or from build
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../.next/server/pages/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Set up event listeners
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      return false;
    }
    return true;
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create tray icon
  createTray();

  return mainWindow;
}

/**
 * CIPHER-X: Sets up the system tray icon and menu
 * Provides quick actions and allows app to run in background
 */
function createTray() {
  const iconPath = path.join(__dirname, 'icons', 'tray.png');
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  
  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open CHAOSV3', 
      click: () => {
        mainWindow?.show();
      }
    },
    { 
      label: 'Status',
      submenu: [
        { 
          label: 'Online',
          type: 'radio',
          checked: true,
          click: () => {
            mainWindow?.webContents.send('status-change', 'online');
          }
        },
        { 
          label: 'Away',
          type: 'radio',
          click: () => {
            mainWindow?.webContents.send('status-change', 'away');
          }
        },
        { 
          label: 'Busy',
          type: 'radio',
          click: () => {
            mainWindow?.webContents.send('status-change', 'busy');
          }
        },
        { 
          label: 'Appear Offline',
          type: 'radio',
          click: () => {
            mainWindow?.webContents.send('status-change', 'offline');
          }
        }
      ]
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('CHAOSV3 Chat Platform');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
    }
  });
}

/**
 * CIPHER-X: Launches and manages the embedded backend process
 * For standalone .exe deployment where both frontend and backend are packaged
 */
function startBackendServer() {
  if (isDev) {
    console.log('Development mode: Backend should be started separately');
    return;
  }

  const backendPath = path.join(process.resourcesPath, 'backend', 'dist', 'server.js');
  
  if (fs.existsSync(backendPath)) {
    console.log('Starting embedded backend server...');
    
    // Spawn Node.js process for backend
    backendProcess = spawn('node', [backendPath], {
      env: {
        ...process.env,
        PORT: backendPort.toString(),
        NODE_ENV: 'production'
      }
    });
    
    backendProcess.stdout.on('data', (data: Buffer) => {
      console.log(`Backend: ${data.toString()}`);
    });
    
    backendProcess.stderr.on('data', (data: Buffer) => {
      console.error(`Backend error: ${data.toString()}`);
    });
    
    backendProcess.on('close', (code: number) => {
      console.log(`Backend process exited with code ${code}`);
      if (code !== 0 && !isQuitting) {
        dialog.showErrorBox('Backend Error', 
          'The CHAOSV3 backend server stopped unexpectedly. The application may not function correctly.');
      }
    });
  } else {
    console.error('Backend server executable not found:', backendPath);
    dialog.showErrorBox('Backend Error', 
      'Could not find the backend server. The application will run with limited functionality.');
  }
}

/**
 * CIPHER-X: App initialization and lifecycle management
 * Handles startup, shutdown, and system integration
 */
app.whenReady().then(() => {
  // Start backend (for packaged app)
  startBackendServer();
  
  // Create main window
  createWindow();
  
  // Set up IPC handlers
  setupIpcHandlers();
  
  // Check for updates (in production)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  // Clean up backend process if it exists
  if (backendProcess) {
    backendProcess.kill();
  }
});

/**
 * CIPHER-X: Sets up communication channels between renderer and main process
 * Enables window control and system integration from the UI
 */
function setupIpcHandlers() {
  // Window controls
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });
  
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  
  ipcMain.on('window:close', () => {
    mainWindow?.hide();
  });
  
  // App controls
  ipcMain.on('app:quit', () => {
    isQuitting = true;
    app.quit();
  });
}
