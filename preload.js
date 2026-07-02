const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFile: (filePath, content) => ipcRenderer.invoke('dialog:saveFile', filePath, content),
  saveFileAs: (content) => ipcRenderer.invoke('dialog:saveFileAs', content),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  readDir: (folderPath) => ipcRenderer.invoke('fs:readDir', folderPath),
  onMenuAction: (callback) => ipcRenderer.on('menu:action', (event, action) => callback(action)),
  platform: process.platform,
  showConfirmDialog: (options) => ipcRenderer.invoke('dialog:confirm', options),
  showMessageDialog: (options) => ipcRenderer.invoke('dialog:message', options),
  rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  delete: (targetPath) => ipcRenderer.invoke('fs:delete', targetPath),
  createFile: (targetPath) => ipcRenderer.invoke('fs:createFile', targetPath),
  createFolder: (targetPath) => ipcRenderer.invoke('fs:createFolder', targetPath)
});
