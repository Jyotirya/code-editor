export let currentFolderPath = null;
export let fileTreeData = [];

let contextTarget = null;
const ctxMenu = document.getElementById('tree-context-menu');

document.addEventListener('click', () => {
  if (ctxMenu) ctxMenu.style.display = 'none';
});

if (ctxMenu) {
  document.getElementById('ctx-new-file').addEventListener('click', () => {
    console.log('New File clicked on', contextTarget);
  });
  document.getElementById('ctx-new-folder').addEventListener('click', () => {
    console.log('New Folder clicked on', contextTarget);
  });
  document.getElementById('ctx-rename').addEventListener('click', () => {
    console.log('Rename clicked on', contextTarget);
  });
  document.getElementById('ctx-delete').addEventListener('click', () => {
    console.log('Delete clicked on', contextTarget);
  });
}

export async function openFolder() {
  const folderPath = await window.electronAPI.openFolder();
  if (!folderPath) return;

  currentFolderPath = folderPath;
  await loadDirectory(folderPath, fileTreeData);
  renderFileTree();
}

export async function loadDirectory(folderPath, targetArray) {
  try {
    const items = await window.electronAPI.readDir(folderPath);
    targetArray.length = 0; 
    
    for (const item of items) {
      targetArray.push({
        name: item.name,
        path: item.path,
        isDirectory: item.isDirectory,
        isExpanded: false,
        children: []
      });
    }
  } catch (error) {
    console.error("Failed to load directory:", error);
  }
}

export function renderFileTree(data = fileTreeData, containerElement = document.getElementById('file-tree'), depth = 0) {
  if (depth === 0) containerElement.innerHTML = '';
  
  data.forEach(item => {
    const itemEl = document.createElement('div');
    
    const rowEl = document.createElement('div');
    rowEl.className = 'tree-item';
    rowEl.style.paddingLeft = `${8 + (depth * 12)}px`;
    
    const iconEl = document.createElement('span');
    iconEl.className = 'tree-icon';
    iconEl.textContent = item.isDirectory ? (item.isExpanded ? '📂' : '📁') : '📄';
    rowEl.appendChild(iconEl);
    
    const nameEl = document.createElement('span');
    nameEl.textContent = item.name;
    rowEl.appendChild(nameEl);
    
    itemEl.appendChild(rowEl);
    
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    if (item.isExpanded) childrenContainer.classList.add('expanded');
    itemEl.appendChild(childrenContainer);
    
    rowEl.onclick = async (e) => {
      e.stopPropagation();
      if (item.isDirectory) {
        item.isExpanded = !item.isExpanded;
        if (item.isExpanded && item.children.length === 0) {
          await loadDirectory(item.path, item.children);
        }
        renderFileTree();
      } else {
        import('./fileManager.js').then(fm => fm.openFile(item.path));
      }
    };
    
    rowEl.oncontextmenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      contextTarget = item;
      
      if (ctxMenu) {
        ctxMenu.style.left = e.clientX + 'px';
        ctxMenu.style.top = e.clientY + 'px';
        ctxMenu.style.display = 'flex';
      }
    };
    
    if (item.isExpanded && item.children.length > 0) {
      renderFileTree(item.children, childrenContainer, depth + 1);
    }
    
    containerElement.appendChild(itemEl);
  });
}
