const { app, BrowserWindow, Menu, session, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 380,
    minHeight: 520,
    title: 'PropManager',
    autoHideMenuBar: true,
    backgroundColor: '#f4f6fb',
    icon: path.join(__dirname, '..', 'icon-512.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));

  // Any external link (e.g. the GitHub Pages URL in Settings → About)
  // opens in the system browser instead of a new Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Desktop notifications: allow web notifications, and give Windows a proper toast identity.
  app.setAppUserModelId('com.missblac.propmanager');
  const allowedPermissions = new Set(['notifications', 'fullscreen', 'clipboard-sanitized-write']);
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    callback(allowedPermissions.has(permission));
  });

  createWindow();

  app.on('activate', () => {
    // macOS: re-create the window when the dock icon is clicked.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
