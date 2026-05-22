const { app, BrowserWindow } = require('electron');
const path = require('path');

// Set App User Model ID for Windows taskbar grouping and custom icon association
if (process.platform === 'win32') {
  app.setAppUserModelId("com.xessia.softwarejessica");
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "XESSIA Software Jessica",
    icon: path.join(__dirname, 'dist', 'img', 'Logo.png'),
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  // Load local build file in production or connect to Vite dev server in development
  if (!app.isPackaged) {
    // In development, load local vite dev server first
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(err => {
        console.error('Failed to load local fallback index.html', err);
      });
    });
  } else {
    // In production, always load the local index.html directly
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(err => {
      console.error('Failed to load local index.html', err);
    });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 1. Remove Default Application Menu (hides file, edit, view, etc.)
  mainWindow.setMenu(null);

  // 2. Strict Security: Block opening of DevTools in production
  if (app.isPackaged) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools();
    });

    // 3. Block development shortcuts (F12, Inspect, Reload)
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const isControl = input.control || input.meta;
      const isShift = input.shift;
      const key = input.key.toLowerCase();

      // Block F12
      if (key === 'f12') {
        event.preventDefault();
      }
      // Block Ctrl+Shift+I (inspect)
      if (isControl && isShift && key === 'i') {
        event.preventDefault();
      }
      // Block Ctrl+Shift+J (inspect console)
      if (isControl && isShift && key === 'j') {
        event.preventDefault();
      }
      // Block Ctrl+R and F5 (reload)
      if ((isControl && key === 'r') || key === 'f5') {
        event.preventDefault();
      }
      // Block Ctrl+Shift+R (force reload)
      if (isControl && isShift && key === 'r') {
        event.preventDefault();
      }
    });
  } else {
    // Open devtools in development mode
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock to prevent running multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
