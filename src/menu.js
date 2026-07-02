import { handleAction } from './renderer.js';

export function setupMenu() {
  const menuItems = document.querySelectorAll('.menu-item');
  let openMenu = null;

  function closeMenu() {
    if (openMenu) {
      openMenu.classList.remove('open');
      openMenu = null;
    }
  }

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      if (openMenu === item) {
        closeMenu();
      } else {
        closeMenu();
        item.classList.add('open');
        openMenu = item;
      }
    });

    item.addEventListener('mouseenter', () => {
      if (openMenu && openMenu !== item) {
        closeMenu();
        item.classList.add('open');
        openMenu = item;
      }
    });
  });

  document.addEventListener('click', closeMenu);

  document.querySelectorAll('.dropdown-item').forEach(dropdown => {
    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
      const action = dropdown.dataset.action;
      handleAction(action);
    });
  });
}
