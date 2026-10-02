import { getApiGateway } from './gateway/api-gateway.js';
import { authGuard } from './guards/auth.guard.js';
import { roleGuard } from './guards/role.guard.js';
import { renderShell } from './ui/renderer.js';
import { initializePlayer } from './ui/player.js';
import { notify } from './ui/notifications.js';
import { initializeLogin } from './pages/login.page.js';
import { initializeDashboard } from './pages/dashboard.page.js';
import { initializeCatalog } from './pages/catalog.page.js';
import { initializeHistory } from './pages/history.page.js';
import { initializeProfile } from './pages/profile.page.js';
import { initializeAdmin } from './pages/admin.page.js';

function start() {
  const gateway = getApiGateway();
  const page = document.body.dataset.page;
  const user = gateway.getSession();
  if (page === 'index' || (page === 'login' && user)) {
    location.replace(user ? (user.role === 'ADMIN' ? 'admin.html' : 'dashboard.html') : 'login.html');
    return;
  }
  if (page === 'login') { initializeLogin(gateway); return; }
  if (!authGuard(gateway) || !roleGuard(gateway, page === 'admin' ? 'ADMIN' : 'USER')) return;
  renderShell(user, page);
  const controllers = { dashboard: initializeDashboard, catalog: initializeCatalog, history: initializeHistory, profile: initializeProfile, admin: initializeAdmin };
  const disposePage = controllers[page]?.(gateway);
  const disposePlayer = initializePlayer(gateway);
  document.getElementById('app').addEventListener('click', event => {
    const logout = event.target.closest('[data-logout]');
    const play = event.target.closest('[data-play]');
    try {
      if (logout) { gateway.logout(); location.replace('login.html'); }
      if (play && !play.disabled) {
        const queue = JSON.parse(play.closest('[data-queue]')?.dataset.queue ?? '[]');
        const record = gateway.playContent(play.dataset.play, queue);
        notify(`Reproducción registrada: ${record.title}`);
      }
    } catch (error) { notify(error.message, true); }
  });
  window.addEventListener('pagehide', () => { disposePage?.(); disposePlayer(); gateway.dispose(); });
  // Revalidate after a bfcache restoration or a session change in another tab.
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  window.addEventListener('storage', event => { if (event.key?.startsWith('sonora-mvp:') && !event.key.includes('player:')) location.reload(); });
}

try { start(); }
catch (error) {
  const target = document.getElementById('app') ?? document.body;
  target.replaceChildren();
  const box = document.createElement('main');
  box.className = 'boot-message';
  const heading = document.createElement('h1');
  heading.textContent = 'No se pudo iniciar el MVP';
  const message = document.createElement('p');
  message.textContent = error.message;
  const help = document.createElement('p');
  help.textContent = 'Usa un servidor HTTP estático local y permite LocalStorage en el navegador. Consulta README.md.';
  box.append(heading, message, help); target.append(box);
  console.error(error);
}
