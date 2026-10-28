/* Desktop inputs and Start menu. */
window.closeStartMenu = function () {
  document.getElementById('start-menu').style.display = 'none';
  document.getElementById('start-btn').setAttribute('aria-expanded', 'false');
};
window.toggleStartMenu = function () {
  const menu = document.getElementById('start-menu');
  if (menu.style.display !== 'none') return closeStartMenu();
  closeDesktopContext();
  menu.style.display = 'block';
  document.getElementById('start-btn').setAttribute('aria-expanded', 'true');
  menu.querySelector('button').focus();
};
window.closeDesktopContext = function () {
  document.getElementById('desktop-context').hidden = true;
};
window.toggleCRT = function () {
  const enabled = document.body.classList.toggle('crt-enabled');
  const button = document.getElementById('menu-crt');
  button.setAttribute('aria-pressed', String(enabled));
  button.setAttribute('aria-label', enabled ? '关闭 CRT 屏幕效果' : '开启 CRT 屏幕效果');
};
document.getElementById('welcome-btn').addEventListener('click', function () {
  const balloon = document.getElementById('welcome-balloon');
  balloon.hidden = !balloon.hidden;
  this.setAttribute('aria-expanded', String(!balloon.hidden));
});
document.getElementById('tray-toggle').addEventListener('click', function () {
  const icons = document.getElementById('tray-icons');
  icons.hidden = !icons.hidden;
  this.setAttribute('aria-expanded', String(!icons.hidden));
  this.setAttribute('aria-label', icons.hidden ? '显示托盘图标' : '隐藏托盘图标');
  this.title = icons.hidden ? '显示托盘图标' : '隐藏托盘图标';
});
document.getElementById('menu-crt').addEventListener('click', () => { toggleCRT(); closeStartMenu(); });
document.getElementById('volume-btn').addEventListener('click', function () {
  const muted = this.getAttribute('aria-pressed') !== 'true';
  this.setAttribute('aria-pressed', String(muted));
  this.setAttribute('aria-label', muted ? '取消静音' : '静音');
  this.title = muted ? '取消静音' : '静音';
  MusicPlayer.setMuted(muted);
});

document.querySelectorAll('[data-app]').forEach(button => {
  button.addEventListener('click', event => {
    if (button.classList.contains('desktop-icon')) {
      document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.toggle('selected', icon === button));
      if (event.detail !== 0 && event.pointerType !== 'touch' && event.pointerType !== 'pen' && !matchMedia('(pointer: coarse)').matches) return;
    }
    openWindow(button.dataset.app);
    closeStartMenu();
  });
  if (button.classList.contains('desktop-icon')) {
    button.addEventListener('dblclick', () => { openWindow(button.dataset.app); closeStartMenu(); });
  }
});

document.addEventListener('click', event => {
  if (!event.target.closest('#start-menu, #start-btn')) closeStartMenu();
  if (!event.target.closest('#desktop-context')) closeDesktopContext();
  if (event.target.id === 'desktop' || event.target.classList.contains('desktop-icons')) {
    document.querySelectorAll('.desktop-icon').forEach(icon => icon.classList.remove('selected'));
  }
});
document.getElementById('desktop').addEventListener('contextmenu', event => {
  if (event.target.closest('.window, #taskbar, #start-menu')) return;
  event.preventDefault();
  closeStartMenu();
  const menu = document.getElementById('desktop-context');
  menu.hidden = false;
  menu.style.left = Math.max(0, Math.min(event.clientX, innerWidth - menu.offsetWidth - 4)) + 'px';
  menu.style.top = Math.max(0, Math.min(event.clientY, innerHeight - menu.offsetHeight - 34)) + 'px';
  menu.querySelector('button').focus();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const menuWasOpen = document.getElementById('start-menu').style.display !== 'none';
    closeStartMenu();
    closeDesktopContext();
    if (menuWasOpen) document.getElementById('start-btn').focus();
  }
  if (event.altKey && event.key === 'F4') {
    const win = document.querySelector('.active-window');
    if (!win) return;
    event.preventDefault();
    WM.close(win.id.slice(4));
  }
  if (!event.target.closest('#start-menu') || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const buttons = Array.from(document.querySelectorAll('#start-menu button'));
  const index = buttons.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
  buttons[next].focus();
});
document.querySelector('.balloon-close').addEventListener('click', () => {
  document.getElementById('welcome-balloon').hidden = true;
  document.getElementById('welcome-btn').setAttribute('aria-expanded', 'false');
});
