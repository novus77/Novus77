/* Boot, login and power actions share one screen transition. */
(function () {
  const startupSound = new Audio('assets/sounds/windows-xp-startup.mp3');
  const wallpaper = new Image();
  wallpaper.src = 'assets/images/novus77-hillside.png';
  startupSound.preload = 'auto';
  let timer;
  let entering = false;

  function showScreen(id) {
    ['boot-screen', 'login-screen', 'desktop', 'shutdown-screen'].forEach(key => {
      const screen = document.getElementById(key);
      screen.style.display = key === id ? (key === 'desktop' ? 'block' : key === 'shutdown-screen' ? 'grid' : 'flex') : 'none';
      screen.classList.remove('fade-in', 'fade-out');
      screen.inert = key !== id;
    });
    document.getElementById(id).classList.add('fade-in');
  }

  function showLogin() {
    clearTimeout(timer);
    entering = false;
    showScreen('login-screen');
    document.getElementById('login-btn').focus({ preventScroll: true });
  }

  function showDesktop() {
    if (entering) return;
    entering = true;
    startupSound.muted = document.getElementById('volume-btn').getAttribute('aria-pressed') === 'true';
    startupSound.currentTime = 0;
    startupSound.play().catch(() => {});
    showScreen('desktop');
    document.getElementById('desktop').focus({ preventScroll: true });
    document.getElementById('welcome-balloon').hidden = true;
    document.getElementById('welcome-btn').setAttribute('aria-expanded', 'false');
  }

  function leaveDesktop() {
    clearTimeout(timer);
    startupSound.pause();
    WM.closeAll();
    document.getElementById('welcome-balloon').hidden = true;
    document.getElementById('welcome-btn').setAttribute('aria-expanded', 'false');
    closeStartMenu();
    closeDesktopContext();
  }

  window.restartDesktop = function () {
    leaveDesktop();
    entering = false;
    showScreen('boot-screen');
    timer = setTimeout(showLogin, 1800);
  };
  window.logOffDesktop = function () {
    leaveDesktop();
    showLogin();
  };
  window.handleShutdown = function () {
    leaveDesktop();
    showScreen('shutdown-screen');
    document.querySelector('#shutdown-screen button').focus();
  };
  document.getElementById('login-btn').addEventListener('click', showDesktop);
  document.getElementById('boot-skip').addEventListener('click', showLogin);
  timer = setTimeout(showLogin, matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 2400);
})();
