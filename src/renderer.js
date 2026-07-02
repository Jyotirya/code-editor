import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, 
         highlightSpecialChars, drawSelection, dropCursor, 
         rectangularSelection, crosshairCursor, highlightActiveLine } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, 
         foldGutter, indentOnInput } from '@codemirror/language'
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { python } from '@codemirror/lang-python'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { cpp } from '@codemirror/lang-cpp'

import * as tabManager from './tabManager.js'
import * as fileManager from './fileManager.js'
import * as explorerManager from './explorerManager.js'
import { setupMenu } from './menu.js'

const languageCompartment = new Compartment();

const updateListener = EditorView.updateListener.of((update) => {
  if (update.selectionSet || update.docChanged) {
    const cursor = update.state.selection.main.head;
    const line = update.state.doc.lineAt(cursor);
    const col = cursor - line.from + 1;
    
    const statusCursor = document.getElementById('status-cursor');
    if (statusCursor) {
      statusCursor.textContent = `Ln ${line.number}, Col ${col}`;
    }
    
    const selLength = update.state.selection.main.to - update.state.selection.main.from;
    const selEl = document.getElementById('status-selection');
    if (selEl) {
      selEl.textContent = selLength > 0 ? `(${selLength} selected)` : '';
    }
    
    if (update.docChanged) {
      const activeTab = tabManager.getActiveTab();
      if (activeTab) {
        const wasUnsaved = activeTab.isUnsaved;
        const newContent = update.state.doc.toString();
        tabManager.updateTabContent(activeTab.id, newContent);
        
        if (wasUnsaved !== activeTab.isUnsaved) {
          // Re-render tabs to show or hide the bullet
          // But since renderTabs replaces DOM elements, we only do it when the state flips
          renderTabs();
        }
      }
    }
  }
});

export function createEditor(parentElement, initialContent = '') {
  const state = EditorState.create({
    doc: initialContent,
    extensions: [
      updateListener,
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      foldGutter(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
      oneDark,
      languageCompartment.of([])
    ]
  });

  const view = new EditorView({
    state,
    parent: parentElement
  });

  return view;
}

const editorArea = document.getElementById('editor-area');
const placeholder = document.getElementById('editor-placeholder');
if (placeholder) {
  placeholder.remove();
}

window.editorView = createEditor(editorArea);

export let currentLanguage = 'Plain Text';

export function getLanguageExtension(filePath) {
  if (!filePath) {
    currentLanguage = 'Plain Text';
    return [];
  }
  
  const ext = filePath.split('.').pop().toLowerCase();
  
  switch(ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
      currentLanguage = 'JavaScript';
      return javascript();
    case 'ts':
      currentLanguage = 'TypeScript';
      return javascript({ typescript: true });
    case 'jsx':
      currentLanguage = 'JSX';
      return javascript({ jsx: true });
    case 'tsx':
      currentLanguage = 'TSX';
      return javascript({ jsx: true, typescript: true });
    case 'html':
    case 'htm':
      currentLanguage = 'HTML';
      return html();
    case 'css':
      currentLanguage = 'CSS';
      return css();
    case 'py':
      currentLanguage = 'Python';
      return python();
    case 'json':
      currentLanguage = 'JSON';
      return json();
    case 'md':
    case 'markdown':
      currentLanguage = 'Markdown';
      return markdown();
    case 'cpp':
    case 'cc':
    case 'h':
    case 'hpp':
      currentLanguage = 'C++';
      return cpp();
    default:
      currentLanguage = 'Plain Text';
      return [];
  }
}

export function setEditorLanguage(filePath) {
  const langExt = getLanguageExtension(filePath);
  window.editorView.dispatch({
    effects: languageCompartment.reconfigure(langExt)
  });
  
  const statusLanguage = document.getElementById('status-language');
  if (statusLanguage) {
    statusLanguage.textContent = currentLanguage;
  }
}

export function renderTabs() {
  const container = document.getElementById('tabs-container');
  container.innerHTML = '';
  
  const tabs = tabManager.getAllTabs();
  const activeTabId = tabManager.getActiveTab()?.id;
  
  tabs.forEach(tab => {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    if (tab.id === activeTabId) tabEl.classList.add('active');
    if (tab.isUnsaved) tabEl.classList.add('unsaved');
    tabEl.dataset.tabId = tab.id;
    
    const nameEl = document.createElement('span');
    nameEl.className = 'tab-name';
    nameEl.textContent = tab.fileName;
    tabEl.appendChild(nameEl);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.innerHTML = '✕';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeTabHandler(tab.id);
    };
    tabEl.appendChild(closeBtn);
    
    tabEl.onclick = () => switchTab(tab.id);
    container.appendChild(tabEl);
  });
}

async function closeTabHandler(id) {
  const tab = tabManager.getTab(id);
  if (!tab) return;
  
  if (tab.isUnsaved) {
    const response = await window.electronAPI.showConfirmDialog({
      type: 'question',
      message: `Save changes to ${tab.fileName} before closing?`,
      buttons: ['Save', "Don't Save", 'Cancel']
    });
    
    if (response === 2) {
      return;
    } else if (response === 0) {
      if (tab.id !== tabManager.getActiveTab()?.id) {
        switchTab(tab.id);
      }
      await fileManager.saveFile();
    }
  }
  
  tabManager.closeTab(id);
  renderTabs();
  const activeTab = tabManager.getActiveTab();
  if (activeTab) {
    loadTabIntoEditor(activeTab);
  } else {
    window.editorView.dispatch({
      changes: { from: 0, to: window.editorView.state.doc.length, insert: '' }
    });
    setEditorLanguage(null);
  }
}

export function switchTab(id) {
  const currentTab = tabManager.getActiveTab();
  if (currentTab) {
    const content = window.editorView.state.doc.toString();
    tabManager.updateTabContent(currentTab.id, content);
    tabManager.updateTabCursor(currentTab.id, window.editorView.state.selection.main.head, 0);
  }
  
  tabManager.setActiveTab(id);
  renderTabs();
  
  const newTab = tabManager.getActiveTab();
  if (newTab) {
    loadTabIntoEditor(newTab);
    document.title = `${newTab.fileName} — NeoEdit`;
  }
}

function loadTabIntoEditor(tab) {
  window.editorView.dispatch({
    changes: { from: 0, to: window.editorView.state.doc.length, insert: tab.content },
    selection: { anchor: tab.cursorPos }
  });
  setEditorLanguage(tab.filePath);
}

// Hook up new tab btn
document.getElementById('new-tab-btn').addEventListener('click', () => {
  fileManager.newFile();
});

export function handleAction(action) {
  if (action === 'open-file') fileManager.openFile()
  if (action === 'open-folder') explorerManager.openFolder()
  if (action === 'save') fileManager.saveFile()
  if (action === 'save-as') fileManager.saveFileAs()
  if (action === 'new-file') fileManager.newFile()
  if (action === 'close-tab') {
    const activeTab = tabManager.getActiveTab();
    if (activeTab) closeTabHandler(activeTab.id);
  }
  if (action === 'toggle-sidebar') {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.style.display === 'none') {
      sidebar.style.display = 'flex';
    } else {
      sidebar.style.display = 'none';
    }
  }
  if (['undo', 'redo', 'cut', 'copy', 'paste'].includes(action)) {
    document.execCommand(action);
  }
  if (action === 'about') {
    window.electronAPI.showMessageDialog({
      type: 'info',
      title: 'About NeoEdit',
      message: 'NeoEdit',
      detail: 'Built with Electron and CodeMirror 6'
    });
  }
}

window.electronAPI.onMenuAction(handleAction);

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 's' || e.key === 'S') {
      if (e.shiftKey) fileManager.saveFileAs();
      else fileManager.saveFile();
      e.preventDefault();
    } else if (e.key === 'o' || e.key === 'O') {
      fileManager.openFile();
      e.preventDefault();
    } else if (e.key === 'n' || e.key === 'N') {
      fileManager.newFile();
      e.preventDefault();
    } else if (e.key === 'w' || e.key === 'W') {
      const activeTab = tabManager.getActiveTab();
      if (activeTab) closeTabHandler(activeTab.id);
      e.preventDefault();
    }
  }
});

// Sidebar Resizer Logic
const sidebar = document.getElementById('sidebar');
const resizer = document.getElementById('sidebar-resizer');
let isResizing = false;

resizer.addEventListener('mousedown', (e) => {
  isResizing = true;
  document.body.style.cursor = 'col-resize';
});

document.addEventListener('mousemove', (e) => {
  if (!isResizing) return;
  const newWidth = e.clientX;
  if (newWidth > 100 && newWidth < 800) {
    sidebar.style.width = newWidth + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = 'default';
  }
});

// Initial render
renderTabs();
setupMenu();
