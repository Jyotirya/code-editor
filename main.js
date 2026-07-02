const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  const isMac = process.platform === 'darwin';

  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'new-file') },
        { label: 'Open File...', accelerator: 'CmdOrCtrl+O', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'open-file') },
        { label: 'Open Folder...', accelerator: 'CmdOrCtrl+Shift+O', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'open-folder') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'save-as') },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'close-tab') },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'toggle-sidebar') },
        { label: 'Toggle Word Wrap', accelerator: 'Alt+Z', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'toggle-word-wrap') },
        { label: 'Increase Font Size', accelerator: 'CmdOrCtrl+=', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'font-size-up') },
        { label: 'Decrease Font Size', accelerator: 'CmdOrCtrl+-', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'font-size-down') },
        { label: 'Reset Font Size', accelerator: 'CmdOrCtrl+0', click: () => mainWindow && mainWindow.webContents.send('menu:action', 'font-size-reset') },
        { type: 'separator' },
        { role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Shift+I' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: async () => {
            const version = require('./package.json').version;
            await dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About NeoEdit',
              message: 'NeoEdit',
              detail: `Version: ${version}\nBuilt with Electron and CodeMirror 6`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    backgroundColor: '#0a0a0f',
    frame: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 10 },
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the index.html of the app.
  mainWindow.loadFile('index.html');
}

const fileFilters = [
  { name: 'All Files', extensions: ['*'] },
  { name: 'Text', extensions: ['txt', 'md'] },
  { name: 'JavaScript', extensions: ['js', 'ts', 'jsx', 'tsx'] },
  { name: 'Web', extensions: ['html', 'css'] },
  { name: 'Data', extensions: ['json', 'yaml', 'yml'] },
  { name: 'Python', extensions: ['py'] }
];

// IPC Handlers
ipcMain.handle('dialog:openFile', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: fileFilters
  });
  if (canceled) return null;
  return { canceled, filePath: filePaths[0] };
});

ipcMain.handle('dialog:openFolder', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('dialog:saveFile', async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('dialog:saveFileAs', async (event, content) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: fileFilters
  });
  if (canceled) return null;
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { filePath };
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('dialog:confirm', async (event, options) => {
  const { response } = await dialog.showMessageBox(mainWindow, options);
  return response;
});

ipcMain.handle('dialog:message', async (event, options) => {
  await dialog.showMessageBox(mainWindow, options);
});

ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { content, filePath };
  } catch (err) {
    throw new Error(`Failed to read file: ${err.message}`);
  }
});

ipcMain.handle('fs:writeFile', async (event, filePath, content) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('fs:readDir', async (event, folderPath) => {
  try {
    const dirents = await fs.promises.readdir(folderPath, { withFileTypes: true });
    const items = dirents.map(dirent => ({
      name: dirent.name,
      isDirectory: dirent.isDirectory(),
      path: path.join(folderPath, dirent.name)
    }));
    // Sort: directories first, then files, both alphabetically
    items.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });
    return items;
  } catch (err) {
    throw new Error(`Failed to read directory: ${err.message}`);
  }
});

// IPC stubs for file operations (Step 17)
ipcMain.handle('fs:rename', async (event, oldPath, newPath) => {});
ipcMain.handle('fs:delete', async (event, targetPath) => {});
ipcMain.handle('fs:createFile', async (event, targetPath) => {});
ipcMain.handle('fs:createFolder', async (event, targetPath) => {});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
