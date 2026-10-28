/* Keep the desktop clock in the visitor's local timezone. */
function updateClock() {
  const el = document.getElementById('tray-clock');
  const now = new Date();
  el.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  el.dateTime = now.toISOString();
  el.title = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}
setInterval(updateClock, 1000);
updateClock();
