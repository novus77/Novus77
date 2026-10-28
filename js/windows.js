/* Shared window state and viewport-constrained pointer interactions. */
const WM = (function () {
  let zTop = 100;
  const wins = {};
  const icons = {
    about: 'assets/xp/about.webp', resume: 'assets/xp/resume.webp',
    projects: 'assets/xp/projects.webp', contact: 'assets/xp/contact.webp',
    notes: 'assets/xp/notes.webp', music: 'assets/xp/music.webp',
  };

  function create(opts) {
    if (wins[opts.id]) {
      restore(opts.id);
      return wins[opts.id].el;
    }
    const id = opts.id;
    const desktop = document.getElementById('desktop');
    const width = Math.min(opts.width || 640, desktop.clientWidth);
    const height = Math.min(opts.height || 480, desktop.clientHeight);
    const offset = Object.keys(wins).length * 24;
    const win = document.createElement('section');
    win.className = 'window';
    win.id = 'win-' + id;
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-labelledby', 'title-' + id);
    win.tabIndex = -1;
    win.style.cssText = `left:${Math.max(0, Math.min(opts.x ?? 154 + offset, desktop.clientWidth - width))}px;top:${Math.max(0, Math.min(opts.y ?? 28 + offset, desktop.clientHeight - height))}px;width:${width}px;height:${height}px;`;
    const icon = icons[id] ? `<img src="${icons[id]}" alt="" />` : '';
    win.innerHTML = `
      <div class="title-bar" id="tb-${id}">
        <div class="title-bar-text" id="title-${id}">${icon}${opts.title}</div>
        <div class="title-bar-controls">
          <button aria-label="Minimize" title="最小化" onclick="WM.minimize('${id}')"></button>
          <button aria-label="Maximize" title="最大化" onclick="WM.toggleMaximize('${id}')"></button>
          <button aria-label="Close" title="关闭" onclick="WM.close('${id}')"></button>
        </div>
      </div>
      ${opts.menubar ? `<div class="xp-menubar">${opts.menubar}<img class="window-brand" src="assets/xp/login-logo.svg" alt="" /></div>` : ''}
      ${opts.toolbar ? `<div class="xp-toolbar">${opts.toolbar}</div>` : ''}
      ${opts.addressbar ? `<div class="xp-addressbar">${opts.addressbar}</div>` : ''}
      <div class="window-body" id="wb-${id}">${opts.content || ''}</div>
      ${opts.statusbar ? `<div class="status-bar">${opts.statusbar}</div>` : opts.statusText ? `<div class="status-bar"><p class="status-bar-field">${opts.statusText}</p></div>` : ''}
      ${opts.resizable !== false ? `<div class="win-resize" id="wr-${id}"></div>` : ''}`;
    desktop.querySelector('#windows-container').appendChild(win);
    wins[id] = { el: win, minimized: false, maximized: false, savedRect: null, timer: null };
    const btn = document.createElement('button');
    btn.className = 'taskbar-btn';
    btn.id = 'tbtn-' + id;
    btn.title = opts.title;
    btn.innerHTML = `${icon}<span>${opts.title}</span>`;
    btn.onclick = () => {
      if (wins[id].minimized) return restore(id);
      if (win.classList.contains('active-window')) return minimize(id);
      focus(id);
    };
    document.getElementById('taskbar-buttons').appendChild(btn);
    win.addEventListener('pointerdown', () => focus(id, false));
    win.addEventListener('focusin', () => focus(id, false));
    initPointer(id, document.getElementById('tb-' + id), false);
    document.getElementById('tb-' + id).addEventListener('dblclick', event => {
      if (!event.target.closest('button')) toggleMaximize(id);
    });
    if (opts.resizable !== false) initPointer(id, document.getElementById('wr-' + id), true);
    focus(id);
    return win;
  }

  function focus(id, moveFocus = true) {
    const win = wins[id];
    if (!win || win.minimized) return;
    Object.entries(wins).forEach(([key, item]) => {
      item.el.classList.toggle('active-window', key === id);
      item.el.querySelector('.title-bar').classList.toggle('inactive', key !== id);
      document.getElementById('tbtn-' + key).classList.toggle('active-task', key === id);
    });
    win.el.style.zIndex = ++zTop;
    if (moveFocus) win.el.focus({ preventScroll: true });
  }

  function focusNext() {
    const next = Object.entries(wins).filter(([, win]) => !win.minimized)
      .sort((a, b) => Number(b[1].el.style.zIndex) - Number(a[1].el.style.zIndex))[0];
    if (next) return focus(next[0]);
    document.getElementById('start-btn').focus({ preventScroll: true });
  }

  function close(id) {
    const win = wins[id];
    if (!win) return;
    const wasActive = win.el.classList.contains('active-window');
    clearTimeout(win.timer);
    win.el.remove();
    document.getElementById('tbtn-' + id).remove();
    delete wins[id];
    if (id === 'music') MusicPlayer.onWindowClose();
    if (wasActive) focusNext();
  }

  function minimize(id) {
    const win = wins[id];
    if (!win || win.minimized) return;
    win.minimized = true;
    win.el.classList.remove('active-window', 'restoring');
    win.el.querySelector('.title-bar').classList.add('inactive');
    win.el.classList.add('minimizing');
    win.el.inert = true;
    document.getElementById('tbtn-' + id).classList.remove('active-task');
    clearTimeout(win.timer);
    win.timer = setTimeout(() => {
      win.el.hidden = true;
      win.el.classList.remove('minimizing');
    }, 160);
    focusNext();
  }

  function restore(id) {
    const win = wins[id];
    if (!win) return;
    clearTimeout(win.timer);
    win.el.hidden = false;
    win.el.inert = false;
    win.el.classList.remove('minimizing');
    if (win.minimized) {
      win.el.classList.add('restoring');
      win.timer = setTimeout(() => win.el.classList.remove('restoring'), 160);
    }
    win.minimized = false;
    fit(win);
    focus(id);
  }

  function toggleMaximize(id) {
    const win = wins[id];
    if (!win) return;
    if (win.maximized) {
      Object.assign(win.el.style, win.savedRect);
      win.maximized = false;
      fit(win);
    } else {
      win.savedRect = { left: win.el.style.left, top: win.el.style.top, width: win.el.style.width, height: win.el.style.height };
      win.maximized = true;
      Object.assign(win.el.style, { left: '0px', top: '0px', width: '100%', height: '100%' });
    }
    win.el.classList.toggle('maximized', win.maximized);
    const button = win.el.querySelector('.title-bar-controls button:nth-child(2)');
    button.setAttribute('aria-label', win.maximized ? 'Restore' : 'Maximize');
    button.title = win.maximized ? '还原' : '最大化';
    focus(id);
  }

  function fit(win) {
    if (win.maximized || win.minimized) return;
    const desktop = document.getElementById('desktop');
    const width = Math.min(win.el.offsetWidth, desktop.clientWidth);
    const height = Math.min(win.el.offsetHeight, desktop.clientHeight);
    Object.assign(win.el.style, {
      width: width + 'px', height: height + 'px',
      left: Math.max(0, Math.min(win.el.offsetLeft, desktop.clientWidth - width)) + 'px',
      top: Math.max(0, Math.min(win.el.offsetTop, desktop.clientHeight - height)) + 'px',
    });
  }

  function initPointer(id, handle, resizing) {
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button') || wins[id].maximized) return;
      event.preventDefault();
      const el = wins[id].el;
      const desktop = document.getElementById('desktop');
      const origin = { x: event.clientX, y: event.clientY, left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
      handle.setPointerCapture(event.pointerId);
      const move = event => {
        if (resizing) {
          el.style.width = Math.min(desktop.clientWidth - origin.left, Math.max(Math.min(280, desktop.clientWidth), origin.width + event.clientX - origin.x)) + 'px';
          el.style.height = Math.min(desktop.clientHeight - origin.top, Math.max(Math.min(180, desktop.clientHeight), origin.height + event.clientY - origin.y)) + 'px';
          return;
        }
        el.style.left = Math.max(0, Math.min(desktop.clientWidth - el.offsetWidth, origin.left + event.clientX - origin.x)) + 'px';
        el.style.top = Math.max(0, Math.min(desktop.clientHeight - el.offsetHeight, origin.top + event.clientY - origin.y)) + 'px';
      };
      const stop = () => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('lostpointercapture', stop);
      };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('lostpointercapture', stop);
    });
  }

  function showDesktop() {
    Object.keys(wins).forEach(minimize);
  }

  function closeAll() {
    Object.keys(wins).forEach(close);
  }

  window.addEventListener('resize', () => Object.values(wins).forEach(fit));
  return { create, close, focus, minimize, restore, toggleMaximize, showDesktop, closeAll };
})();
