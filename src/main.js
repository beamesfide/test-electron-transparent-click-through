// https://github.com/electron/electron/issues/1335

const { app, BrowserWindow, screen } = require('electron');
const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    x: 100,
    y: 100,
    transparent: true,
    alwaysOnTop: true,
    focusable: false,
    nodeIntegration: true,
    contextIsolation: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false,
    title: 'main',
  });

  mainWindow.setIgnoreMouseEvents(true);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  return mainWindow;
};

app.whenReady().then(async () => {
  const mainWindow = createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  // Copied from:
  // https://github.com/electron/electron/issues/1335#issuecomment-1585787243
  setInterval(() => {
    const point = screen.getCursorScreenPoint();
    const [x, y] = mainWindow.getPosition();
    const [w, h] = mainWindow.getSize();

    if (point.x > x && point.x < x + w && point.y > y && point.y < y + h) {
      updateIgnoreMouseEvents(point.x - x, point.y - y);
    }
  }, 100);

  const updateIgnoreMouseEvents = async (x, y) => {
    console.log('updateIgnoreMouseEvents');

    // capture 1x1 image of mouse position.
    const image = await mainWindow.webContents.capturePage({
      x,
      y,
      width: 1,
      height: 1,
    });

    var buffer = image.getBitmap();

    // set ignore mouse events by alpha.
    mainWindow.setIgnoreMouseEvents(!buffer[3], { forward: true });
    console.log('setIgnoreMouseEvents', !buffer[3]);
  };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
