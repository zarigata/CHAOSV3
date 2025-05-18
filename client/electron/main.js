/**
 * /////////////////////////////////////////////////////////////////////////
 * //                                                                     //
 * //   ███████╗██╗     ███████╗ ██████╗████████╗██████╗  ██████╗ ███╗   ██╗ //
 * //   ██╔════╝██║     ██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║ //
 * //   █████╗  ██║     █████╗  ██║        ██║   ██████╔╝██║   ██║██╔██╗ ██║ //
 * //   ██╔══╝  ██║     ██╔══╝  ██║        ██║   ██╔══██╗██║   ██║██║╚██╗██║ //
 * //   ███████╗███████╗███████╗╚██████╗   ██║   ██║  ██║╚██████╔╝██║ ╚████║ //
 * //   ╚══════╝╚══════╝╚══════╝ ╚═════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ //
 * //                                                                     //
 * //  ELECTRON MAIN PROCESS - Cross-platform desktop entry point         //
 * //                                                                     //
 * //  [CODEX:ELECTRON]                                                   //
 * //  Platform detection: Windows/Linux compatibility layer              //
 * //  Process isolation: Renderer and main process separation            //
 * //  IPC handlers: Security-focused messaging between processes         //
 * //                                                                     //
 * //  Window state persistence: User preferences maintained              //
 * //  Voice module: WebRTC integration for cross-platform voice          //
 * //                                                                     //
 * /////////////////////////////////////////////////////////////////////////
 */

const { app, BrowserWindow, ipcMain, dialog, Menu, Tray } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const url = require('url');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Platform detection for OS-specific behavior
const isPlatformWindows = process.platform === 'win32';
const isPlatformLinux = process.platform === 'linux';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow = null;
let tray = null;
let isQuitting = false;

/**
 * [CODEX:CREATE_WINDOW]
 * Creates the main application window with platform-specific settings
 * Handles window state persistence and proper cleanup
 */
const createWindow = () => {
  // Load window state from storage or use defaults
  const windowState = loadWindowState();

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 940,
    minHeight: 600,
    frame: true,
    title: 'C.H.A.O.S. Messenger',
    icon: path.join(__dirname, '../../assets/icons', 
      isPlatformWindows ? 'win/icon.ico' : 'png/512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Set proper content security policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [`
          default-src 'self';
          script-src 'self';
          img-src 'self' data:;
          style-src 'self' 'unsafe-inline';
          connect-src 'self' ws: wss: http://localhost:*;
          media-src 'self' blob:;
        `]
      }
    });
  });

  // Load the application entry point
  // In production, load from the local build directory
  // In development, load from the dev server
  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development mode
    mainWindow.webContents.openDevTools({ mode: 'bottom' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../frontend/out/index.html'));
  }

  // Save window state when window is moved or resized
  const storeWindowState = () => {
    if (!mainWindow.isMaximized() && !mainWindow.isMinimized()) {
      const bounds = mainWindow.getBounds();
      saveWindowState({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        isMaximized: false,
      });
    } else {
      saveWindowState({
        ...loadWindowState(),
        isMaximized: mainWindow.isMaximized(),
      });
    }
  };

  mainWindow.on('resize', storeWindowState);
  mainWindow.on('move', storeWindowState);

  // Restore maximized state if needed
  if (windowState.isMaximized) {
    mainWindow.maximize();
  }

  // Handle window closing for tray minimization
  mainWindow.on('close', (event) => {
    if (!isQuitting && !isPlatformLinux) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });

  // Handle window closed completely
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create tray icon for Windows and Linux
  createTray();
};

/**
 * [CODEX:CREATE_TRAY]
 * Creates system tray icon and context menu
 * Platform-specific implementation for consistent experience
 */
const createTray = () => {
  const iconPath = path.join(
    __dirname, 
    '../../assets/icons',
    isPlatformWindows ? 'win/icon.ico' : 'png/16x16.png'
  );
  
  tray = new Tray(iconPath);
  tray.setToolTip('C.H.A.O.S. Messenger');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open C.H.A.O.S. Messenger', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    { type: 'separator' },
    { 
      label: 'Status',
      submenu: [
        { label: 'Online', type: 'radio', checked: true },
        { label: 'Away', type: 'radio' },
        { label: 'Do Not Disturb', type: 'radio' },
        { label: 'Invisible', type: 'radio' },
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
  
  tray.setContextMenu(contextMenu);
  
  // Double-click behavior shows window
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
};

/**
 * [CODEX:WINDOW_STATE]
 * Save and load window position and size
 * Ensures persistent user experience across sessions
 */
const saveWindowState = (state) => {
  const userDataPath = app.getPath('userData');
  const stateFilePath = path.join(userDataPath, 'window-state.json');
  
  try {
    fs.writeFileSync(stateFilePath, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save window state', e);
  }
};

const loadWindowState = () => {
  const userDataPath = app.getPath('userData');
  const stateFilePath = path.join(userDataPath, 'window-state.json');
  const defaultState = {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false,
  };
  
  try {
    if (fs.existsSync(stateFilePath)) {
      return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load window state', e);
  }
  
  return defaultState;
};

// Launch app when Electron is ready
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Linux platform needs explicit quit
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle explicit quit action for tray behavior
app.on('before-quit', () => {
  isQuitting = true;
});

// Set up IPC communication channels between main and renderer processes
ipcMain.handle('show-open-dialog', async (event, options) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(options);
  return { canceled, filePaths };
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const { canceled, filePath } = await dialog.showSaveDialog(options);
  return { canceled, filePath };
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform-info', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.getSystemVersion(),
    osVersion: os.release(),
    hostname: os.hostname(),
  };
});
