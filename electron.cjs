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

  // OTA Live Update & Local Offline Fallback Strategy
  const remoteUrl = 'https://software-jessica.vercel.app';
  let hasFallenBack = false;

  // Listen for DOM ready to check for Vercel's 404 error page (successful TCP load but logically failed deployment)
  mainWindow.webContents.on('dom-ready', () => {
    if (hasFallenBack) return;
    const currentUrl = mainWindow.webContents.getURL();
    if (currentUrl.startsWith(remoteUrl)) {
      mainWindow.webContents.executeJavaScript('document.title').then(title => {
        if (title && (title.includes('404: NOT_FOUND') || title.includes('NOT_FOUND') || title.includes('Deployment Not Found') || title.includes('Deployment not found'))) {
          console.log(`Detected Vercel 404 page ("${title}"). Triggering fallback to local offline index.html.`);
          hasFallenBack = true;
          mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(err => {
            console.error('Failed to load local offline fallback', err);
          });
        }
      }).catch(err => {
        console.error('Error reading page title:', err);
      });
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    // Avoid double fallbacks or loops
    if (hasFallenBack) return;
    
    // Only fall back to local file if the failure was for the remote URL or local dev server
    if (validatedURL.startsWith(remoteUrl) || validatedURL.startsWith('http://localhost')) {
      hasFallenBack = true;
      console.log('OTA loading failed. Falling back to local offline index.html.');
      mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html')).catch(err => {
        console.error('Failed to load local offline fallback', err);
      });
    }
  });

  if (!app.isPackaged) {
    // In development, load local vite dev server first
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      if (!hasFallenBack) {
        hasFallenBack = true;
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
      }
    });
  } else {
    // In production, load Vercel live production URL for OTA updates, with automatic offline fallback
    mainWindow.loadURL(remoteUrl).catch(() => {
      if (!hasFallenBack) {
        hasFallenBack = true;
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
      }
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
