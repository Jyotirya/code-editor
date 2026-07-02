let tabs = [];
let activeTabId = null;

export function createTab(filePath, content) {
  let fileName = 'Untitled';
  if (filePath) {
    fileName = filePath.split(/[/\\]/).pop();
  }

  const tab = {
    id: crypto.randomUUID(),
    filePath: filePath || null,
    fileName: fileName,
    content: content || '',
    savedContent: content || '',
    isUnsaved: false,
    language: 'Plain Text',
    cursorPos: 0,
    scrollTop: 0
  };

  tabs.push(tab);
  
  if (!activeTabId) {
    activeTabId = tab.id;
  }
  
  return tab;
}

export function getTab(id) {
  return tabs.find(t => t.id === id) || null;
}

export function getAllTabs() {
  return tabs;
}

export function setActiveTab(id) {
  const tab = getTab(id);
  if (tab) {
    activeTabId = id;
    return true;
  }
  return false;
}

export function getActiveTab() {
  return getTab(activeTabId);
}

export function updateTabContent(id, content) {
  const tab = getTab(id);
  if (tab) {
    tab.content = content;
    tab.isUnsaved = tab.content !== tab.savedContent;
  }
}

export function updateTabCursor(id, pos, scrollTop) {
  const tab = getTab(id);
  if (tab) {
    tab.cursorPos = pos;
    tab.scrollTop = scrollTop;
  }
}

export function markTabSaved(id) {
  const tab = getTab(id);
  if (tab) {
    tab.savedContent = tab.content;
    tab.isUnsaved = false;
  }
}

export function closeTab(id) {
  const index = tabs.findIndex(t => t.id === id);
  if (index === -1) return activeTabId;

  tabs.splice(index, 1);

  if (activeTabId === id) {
    if (tabs.length === 0) {
      activeTabId = null;
    } else if (tabs[index]) {
      activeTabId = tabs[index].id;
    } else {
      activeTabId = tabs[index - 1].id;
    }
  }
  
  return activeTabId;
}

export function getTabByFilePath(filePath) {
  if (!filePath) return null;
  return tabs.find(t => t.filePath === filePath) || null;
}

export function hasUnsavedTabs() {
  return tabs.some(t => t.isUnsaved);
}
