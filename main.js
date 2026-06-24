const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#1e1e1e', // Sleek dark theme background to prevent white flashing
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Set to false to allow Node.js APIs in renderer (used in subsequent weeks)
    }
  });

  // Load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Remove the default menu bar for a cleaner, modern look
  // (We can customize/add custom menus in later weeks)
  // mainWindow.setMenuBarVisibility(false);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
