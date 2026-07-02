import * as tabManager from './tabManager.js';
import { switchTab, renderTabs } from './renderer.js';

export async function openFile(targetPath = null) {
  let filePath = targetPath;
  if (!filePath) {
    const result = await window.electronAPI.openFile();
    if (!result || result.canceled) return null;
    filePath = result.filePath;
  }
  
  const existingTab = tabManager.getTabByFilePath(filePath);
  if (existingTab) {
    switchTab(existingTab.id);
    return;
  }
  
  try {
    const { content } = await window.electronAPI.readFile(filePath);
    const newTab = tabManager.createTab(filePath, content);
    switchTab(newTab.id);
    renderTabs();
  } catch (error) {
    console.error("Failed to open file:", error);
    await window.electronAPI.showMessageDialog({
      type: 'error',
      message: `Failed to open file:\n${error.message}`
    });
  }
}

export async function saveFile() {
  const activeTab = tabManager.getActiveTab();
  if (!activeTab) return;
  
  const content = window.editorView.state.doc.toString();
  tabManager.updateTabContent(activeTab.id, content);
  
  if (!activeTab.filePath) {
    return saveFileAs();
  }
  
  const result = await window.electronAPI.saveFile(activeTab.filePath, content);
  if (result.success) {
    tabManager.markTabSaved(activeTab.id);
    renderTabs();
  } else {
    console.error("Failed to save file:", result.error);
    await window.electronAPI.showMessageDialog({
      type: 'error',
      message: `Failed to save file:\n${result.error}`
    });
  }
}

export async function saveFileAs() {
  const activeTab = tabManager.getActiveTab();
  if (!activeTab) return;
  
  const content = window.editorView.state.doc.toString();
  
  const result = await window.electronAPI.saveFileAs(content);
  if (!result || !result.filePath) return null;
  
  activeTab.filePath = result.filePath;
  activeTab.fileName = result.filePath.split(/[/\\]/).pop();
  
  tabManager.markTabSaved(activeTab.id);
  
  document.title = `${activeTab.fileName} — NeoEdit`;
  renderTabs();
}

export function newFile() {
  const newTab = tabManager.createTab(null, '');
  switchTab(newTab.id);
}
