import { TYPE_LABELS } from '../utils/constants.js';
import { escapeHtml as e } from '../utils/helpers.js';
import { duration, number, dateTime } from '../utils/formatters.js';
import { icon } from './icons.js';

export function renderShell(user, page) {
  const admin = user.role === 'ADMIN';
  const params = new URLSearchParams(location.search);
  const type = params.get('type');
  const section = params.get('section') ?? 'dashboard';
  const recommendations = params.get('view') === 'recommendations';
  const navigation = admin ? [
    ['Dashboard', 'grid', 'admin.html', section === 'dashboard'],
    ['Contenido', 'music', 'admin.html?section=content', section === 'content'],
    ['Usuarios', 'users', 'admin.html?section=users', section === 'users'],
    ['Reproducciones', 'history', 'admin.html?section=plays', section === 'plays'],
    ['Regalías', 'wallet', 'admin.html?section=royalties', section === 'royalties'],
    ['Métricas', 'chart', 'admin.html?section=metrics', section === 'metrics'],
  ] : [
    ['Inicio', 'home', 'dashboard.html', page === 'dashboard'],
    ['Explorar', 'search', 'catalog.html', page === 'catalog' && !type && !recommendations],
    ['Música', 'music', 'catalog.html?type=music', page === 'catalog' && type === 'music'],
    ['Podcasts', 'podcast', 'catalog.html?type=podcast', page === 'catalog' && type === 'podcast'],
    ['Audiolibros', 'book', 'catalog.html?type=audiobook', page === 'catalog' && type === 'audiobook'],
    ['Recomendaciones', 'spark', 'catalog.html?view=recommendations', page === 'catalog' && recommendations],
    ['Historial', 'history', 'history.html', page === 'history'],
    ['Mi perfil', 'user', 'profile.html', page === 'profile'],
  ];
  const activeLabel = navigation.find(item => item[3])?.[0] ?? 'Sonora';
  document.getElementById('app').innerHTML = `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    <div class="app-shell ${admin ? '' : 'has-player'}">
      <button class="menu-overlay" type="button" aria-label="Cerrar menú" hidden></button>
      <aside class="sidebar" id="sidebar" aria-label="Navegación principal">
        <a class="brand" href="${admin ? 'admin.html' : 'dashboard.html'}"><img src="assets/icons/brand.svg" alt="">Sonora<span class="sr-only">Inicio</span></a>
        <p class="nav-label">${admin ? 'Administración' : 'Tu espacio'}</p>
        <nav class="nav-links">${navigation.map(([label, symbol, href, active]) => `<a class="nav-link ${active ? 'active' : ''}" href="${href}" ${active ? 'aria-current="page"' : ''}>${icon(symbol)}${label}</a>`).join('')}</nav>
        <div class="sidebar-footer"><button class="nav-link" type="button" data-logout>${icon('logout')}Cerrar sesión</button><p class="demo-notice">SONORA<br>Oficial.</p></div>
      </aside>
      <div class="main-panel">
        <header class="topbar"><div class="topbar-left"><button class="icon-button menu-toggle" type="button" aria-label="Abrir menú" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button><span class="topbar-location">Tu biblioteca / <strong>${e(activeLabel)}</strong></span></div><div class="topbar-right"><span class="badge ${admin ? '' : 'badge-green'}">${admin ? 'ADMIN' : ' MVP '}</span><a class="profile-pill" href="${admin ? 'admin.html?section=users' : 'profile.html'}" aria-label="${e(user.name)}, ${admin ? 'usuarios' : 'mi perfil'}"><span class="avatar">${e(user.name.charAt(0))}</span><span>${e(user.name)}</span></a></div></header>
        <main class="page-content" id="main-content" tabindex="-1"></main>
      </div>
      ${admin ? '' : '<footer id="player" class="player" aria-label="Reproductor simulado"></footer>'}
    </div>`;
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.menu-toggle');
  const overlay = document.querySelector('.menu-overlay');
  const mobile = matchMedia('(max-width: 760px)');
  const setOpen = value => {
    sidebar.classList.toggle('open', value);
    sidebar.inert = mobile.matches && !value;
    overlay.hidden = !value;
    toggle.setAttribute('aria-expanded', String(value));
  };
  setOpen(false);
  mobile.addEventListener('change', () => setOpen(false));
  toggle.addEventListener('click', () => {
    const open = !sidebar.classList.contains('open');
    setOpen(open);
    if (open) sidebar.querySelector('.nav-link')?.focus();
  });
  overlay.addEventListener('click', () => { setOpen(false); toggle.focus(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && sidebar.classList.contains('open')) { setOpen(false); toggle.focus(); } });
}

export function pageHeading(kicker, title, subtitle = '', action = '') {
  return `<div class="page-heading"><div><p class="eyebrow">${e(kicker)}</p><h1>${e(title)}</h1>${subtitle ? `<p class="subtitle">${e(subtitle)}</p>` : ''}</div>${action}</div>`;
}

export function emptyState(title, message, href = '', label = 'Explorar catálogo') {
  return `<div class="empty-state">${icon('music')}<strong>${e(title)}</strong><p>${e(message)}</p>${href ? `<a class="btn btn-small" href="${e(href)}">${e(label)}</a>` : ''}</div>`;
}

export function contentCards(items) {
  if (!items.length) return emptyState('Sin contenido por aquí', 'Prueba otros filtros o explora el catálogo.');
  const queue = e(JSON.stringify(items.map(item => item.id)));
  return `<div class="cards-grid" data-queue="${queue}">${items.map(item => `<article class="content-card"><div class="cover-wrap"><img class="content-cover" src="${e(item.cover)}" alt="Portada de ${e(item.title)}" loading="lazy"><button class="card-play" type="button" data-play="${e(item.id)}" aria-label="Reproducir ${e(item.title)}">${icon('play')}</button></div><h3 title="${e(item.title)}">${e(item.title)}</h3><p>${e(item.creator)}</p><div class="card-meta"><span>${TYPE_LABELS[item.type]}</span><span>${duration(item.duration)}</span></div>${item.reason ? `<p class="recommendation-reason" title="Puntuación: ${item.score}">${e(item.reason)}</p>` : ''}</article>`).join('')}</div>`;
}

export function section(title, body, href = '', linkLabel = 'Ver todo') {
  return `<section class="section"><div class="section-heading"><h2>${e(title)}</h2>${href ? `<a class="section-link" href="${e(href)}">${e(linkLabel)} ${icon('arrow', 'inline-icon')}</a>` : ''}</div>${body}</section>`;
}

export function kpi(label, value, note = '', symbol = 'chart', isText = false) {
  return `<article class="kpi"><div class="kpi-top"><span>${e(label)}</span>${icon(symbol)}</div><p class="kpi-value ${isText ? 'text' : ''}">${e(value)}</p>${note ? `<p class="kpi-note">${e(note)}</p>` : ''}</article>`;
}

export function barChart(items, labels = {}, total = null) {
  if (!items.length) return emptyState('Aún no hay reproducciones', 'Las métricas aparecerán al escuchar contenido.');
  const maximum = Math.max(...items.map(item => item.count));
  const sum = total ?? items.reduce((value, item) => value + item.count, 0);
  return `<div class="bar-list">${items.map(item => `<div><div class="bar-header"><span>${e(labels[item.label] ?? item.label)}</span><span>${number(item.count)} · ${sum ? Math.round(item.count / sum * 100) : 0}%</span></div><div class="bar-track" aria-hidden="true"><div class="bar-fill" style="width:${item.count / maximum * 100}%"></div></div></div>`).join('')}</div>`;
}

export function historyTable(plays, { admin = false, availableIds = [] } = {}) {
  if (!plays.length) return emptyState('Tu próxima escucha empieza aquí', 'Reproduce una canción, podcast o audiolibro para registrar actividad.', admin ? '' : 'catalog.html');
  const available = new Set(availableIds);
  return `<div class="table-wrap" data-queue="${e(JSON.stringify([...available]))}"><table><caption class="sr-only">${admin ? 'Registro de reproducciones' : 'Historial de escuchas'}</caption><thead><tr><th>Contenido</th>${admin ? '<th>Usuario</th>' : ''}<th>Tipo</th><th>Fecha y hora</th><th>${admin ? 'ID del evento' : 'Reproducir'}</th></tr></thead><tbody>${plays.map(play => `<tr><td><div class="table-content"><img src="${e(play.cover)}" alt="" loading="lazy"><div><strong>${e(play.title)}</strong><span>${e(play.creator)}</span></div></div></td>${admin ? `<td>${e(play.userName)}</td>` : ''}<td><span class="badge">${TYPE_LABELS[play.type]}</span></td><td class="nowrap">${dateTime(play.playedAt)}</td><td>${admin ? `<span class="muted" title="${e(play.id)}">${e(play.id.slice(0, 17))}…</span>` : `<button class="icon-button" type="button" data-play="${e(play.contentId)}" aria-label="Reproducir ${e(play.title)}" ${available.has(play.contentId) ? '' : 'disabled title="Contenido no disponible"'}>${icon('play')}</button>`}</td></tr>`).join('')}</tbody></table></div>`;
}

export function eventTrace(play) {
  return `<div 
  class="event-trace"><strong>Flujo del MVP</strong><br>UI → API Gateway → PlaybackService → content.played<br>↳ Historial · Regalías · Preferencias · Analítica${play ? `<br>Último evento: ${e(play.id)}<br>${e(play.title)} · ${dateTime(play.playedAt)}` : '<br>Reproduce contenido para activar el flujo.'}</div>`;
}
