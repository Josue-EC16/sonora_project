import { EVENTS, REGIONS, TYPE_LABELS } from '../utils/constants.js';
import { escapeHtml as e, normalize } from '../utils/helpers.js';
import { number, money, duration } from '../utils/formatters.js';
import { icon } from '../ui/icons.js';
import { pageHeading, kpi, section, barChart, historyTable, emptyState, eventTrace } from '../ui/renderer.js';
import { openModal } from '../ui/modal.js';
import { notify } from '../ui/notifications.js';

const labels = { dashboard: 'Vista general', content: 'Contenido', users: 'Usuarios', plays: 'Reproducciones', royalties: 'Regalías', metrics: 'Métricas' };

function topContents(metrics) {
  if (!metrics.topContents.length) return emptyState('Todavía no hay un favorito', 'Reproduce contenido con una cuenta USER para crear actividad.');
  return `<div class="rank-list">${metrics.topContents.slice(0, 5).map((item, index) => `<div class="rank-item"><span class="rank-number">${String(index + 1).padStart(2, '0')}</span><div><strong>${e(item.title)}</strong><small>${e(item.creator)} · ${TYPE_LABELS[item.type]}</small></div><span class="rank-count">${number(item.count)}</span></div>`).join('')}</div>`;
}

function overview(gateway, metrics) {
  return `${pageHeading('Centro de administración', 'Una mirada a tu plataforma.', 'Métricas reales del uso de este navegador. Datos y tarifas ficticios.')}
    <div class="kpi-grid">${kpi('Usuarios', number(metrics.totalUsers), `${metrics.totalAccounts} cuentas, incluido ADMIN`, 'users')}${kpi('Contenido disponible', number(metrics.enabledContents), `${metrics.totalContents} títulos en el catálogo`, 'music')}${kpi('Reproducciones', number(metrics.totalPlays), 'Eventos registrados en el historial', 'play')}${kpi('Regalías acumuladas', money(metrics.totalRoyaltyUnits), 'Modelo académico, no pagos reales', 'wallet', true)}</div>
    <div class="section kpi-grid">${kpi('Canciones', metrics.contentCounts.music, 'Incluye habilitadas y deshabilitadas', 'music')}${kpi('Podcasts', metrics.contentCounts.podcast, 'Incluye habilitados y deshabilitados', 'podcast')}${kpi('Audiolibros', metrics.contentCounts.audiobook, 'Incluye habilitados y deshabilitados', 'book')}${kpi('Artistas', gateway.getArtists().length, 'Creadores de música en el catálogo', 'user')}</div>
    ${section('Así se escucha la plataforma', `<div class="two-columns"><section class="panel"><h2>Reproducciones por tipo</h2>${barChart(metrics.byType, TYPE_LABELS)}</section><section class="panel"><h2>Contenido más reproducido</h2>${topContents(metrics)}</section></div>`)}
    ${section('Géneros más escuchados', `<div class="panel">${barChart(metrics.byGenre)}</div>`)}
    ${section('Reproducciones recientes', historyTable(metrics.recent, { admin: true }), 'admin.html?section=plays', 'Ver registros')}
    ${eventTrace(metrics.recent[0])}`;
}

function royaltiesView(gateway) {
  const royalties = gateway.getRoyalties();
  return `${pageHeading('Contabilidad académica', 'Cada escucha cuenta.', 'Cálculo automático por reproducción de música.')}
    <div class="notice">${icon('info')}<div><strong>Tarifas y regalías.</strong><br></div></div>
    <div class="section kpi-grid">${kpi('Total acumulado', money(royalties.totalUnits), 'Suma de los registros individuales', 'wallet', true)}${kpi('Reproducciones musicales', royalties.records.length, 'Una tarifa por reproducción válida', 'music')}${kpi('Canciones con regalías', royalties.contents.length, 'Contenido con al menos una escucha', 'chart')}${kpi('Método', 'Tarifa × escuchas', 'Se conserva la tarifa histórica', 'info', true)}</div>
    ${section('Desglose por canción', royalties.contents.length ? `<div class="table-wrap"><table><caption class="sr-only">Regalías ficticias por canción</caption><thead><tr><th>Canción</th><th>Artista</th><th>Reproducciones</th><th>Tarifas aplicadas</th><th>Acumulado</th></tr></thead><tbody>${royalties.contents.map(item => `<tr><td><strong>${e(item.title)}</strong></td><td>${e(item.artist)}</td><td>${number(item.plays)}</td><td>${item.rates.map(rate => money(rate)).join('<br>')}</td><td>${money(item.amountUnits)}</td></tr>`).join('')}</tbody></table></div>` : emptyState('Sin regalías registradas', 'Inicia sesión como USER y reproduce una canción.'))}`;
}

function usersView(gateway, metrics) {
  const users = gateway.getUsers();
  const counts = Object.fromEntries(metrics.byUser.map(item => [item.label, item.count]));
  return `${pageHeading('Cuentas de demostración', 'Personas detrás de las escuchas.', 'Consulta de usuarios ficticios. No se muestran contraseñas.')}
    <div class="table-wrap"><table><caption class="sr-only">Usuarios y cuentas de demostración</caption><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Región</th><th>Reproducciones</th></tr></thead><tbody>${users.map(user => `<tr><td><div class="table-content"><span class="avatar">${e(user.name.charAt(0))}</span><strong>${e(user.name)}</strong></div></td><td>${e(user.email)}</td><td><span class="badge ${user.role === 'ADMIN' ? '' : 'badge-green'}">${user.role}</span></td><td>${e(user.region)}</td><td>${number(counts[user.id] ?? 0)}</td></tr>`).join('')}</tbody></table></div>`;
}

function metricsView(gateway, metrics) {
  const userNames = Object.fromEntries(gateway.getUsers().map(user => [user.id, user.name]));
  return `${pageHeading('Analítica de consumo', 'Escuchas que se convierten en datos.', 'Indicadores calculados a partir del historial persistido.')}
    <div class="kpi-grid">${kpi('Reproducciones totales', metrics.totalPlays, 'Todos los usuarios', 'play')}${kpi('Títulos reproducidos', metrics.uniqueContents, 'Contenidos diferentes', 'music')}${kpi('Tipo más consumido', TYPE_LABELS[metrics.byType[0]?.label] ?? 'Sin datos', 'Según las escuchas registradas', 'chart', true)}${kpi('Creador más escuchado', metrics.byCreator[0]?.label ?? 'Sin datos', 'Artistas y autores', 'user', true)}</div>
    <div class="section two-columns"><section class="panel"><h2>Tipos de contenido</h2>${barChart(metrics.byType, TYPE_LABELS)}</section><section class="panel"><h2>Reproducciones por usuario</h2>${barChart(metrics.byUser, userNames)}</section><section class="panel"><h2>Géneros musicales</h2>${barChart(metrics.byGenre)}</section><section class="panel"><h2>Creadores más escuchados</h2>${barChart(metrics.byCreator.slice(0, 6), {}, metrics.totalPlays)}</section></div>
    ${section('Contenido más reproducido', `<div class="panel">${topContents(metrics)}</div>`)}
    <div class="section notice">${icon('info')}<div><strong>Alcance de la analítica.</strong><br></div></div>`;
}

function artistsView(gateway) {
  return `<div class="table-wrap"><table><caption class="sr-only">Artistas ficticios</caption><thead><tr><th>Artista</th><th>Región</th><th>Canciones</th></tr></thead><tbody>${gateway.getArtists().map(artist => `<tr><td><div class="table-content"><img src="assets/images/artists/avatar.svg" alt=""><strong>${e(artist.name)}</strong></div></td><td>${e(artist.region)}</td><td>${artist.contents}</td></tr>`).join('')}</tbody></table></div>`;
}

function contentRows(items) {
  if (!items.length) return emptyState('No hay coincidencias', 'Prueba otra búsqueda o agrega contenido.');
  return `<div class="table-wrap"><table><caption class="sr-only">Administración del catálogo</caption><thead><tr><th>Contenido</th><th>Tipo</th><th>Género / categoría</th><th>Duración</th><th>Región</th><th>Escuchas</th><th>Tarifa ficticia</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${items.map(item => `<tr><td><div class="table-content"><img src="${e(item.cover)}" alt="" loading="lazy"><div><strong>${e(item.title)}</strong><span>${e(item.creator)}</span></div></div></td><td>${TYPE_LABELS[item.type]}</td><td>${e(item.category)}</td><td>${duration(item.duration)}</td><td>${e(item.region)}</td><td>${number(item.reproductions)}</td><td>${item.type === 'music' ? money(Math.round(item.royaltyRate * 1000000)) : 'No aplica'}</td><td><span class="badge ${item.enabled ? 'badge-green' : 'badge-disabled'}">${item.enabled ? 'Habilitado' : 'Deshabilitado'}</span></td><td><div class="table-actions"><button class="btn btn-small" type="button" data-edit="${e(item.id)}" aria-label="Editar ${e(item.title)}">Editar</button><button class="btn btn-small btn-outline" type="button" data-toggle="${e(item.id)}" aria-label="${item.enabled ? 'Deshabilitar' : 'Habilitar'} ${e(item.title)}">${item.enabled ? 'Deshabilitar' : 'Habilitar'}</button></div></td></tr>`).join('')}</tbody></table></div>`;
}

function contentForm(item = {}) {
  const field = (label, name, value = '', extra = '') => `<div class="form-field"><label for="edit-${name}">${label}</label><input id="edit-${name}" name="${name}" value="${e(value)}" ${extra}></div>`;
  return `<form id="content-form"><div class="form-grid"><div class="form-field"><label for="edit-type">Tipo de contenido</label><select id="edit-type" name="type">${Object.entries(TYPE_LABELS).map(([value, label]) => `<option value="${value}" ${item.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="form-field"><label for="edit-region">Región</label><select id="edit-region" name="region">${REGIONS.map(region => `<option ${item.region === region ? 'selected' : ''}>${region}</option>`).join('')}</select></div>${field('Título', 'title', item.title, 'required minlength="2" maxlength="100"')}${field('Artista / autor', 'creator', item.creator, 'required minlength="2" maxlength="80"')}${field('Género / categoría', 'category', item.category, 'required minlength="2" maxlength="50"')}${field('Duración en segundos', 'duration', item.duration ?? 210, 'type="number" required min="1" max="86400" step="1"')}${field('Álbum', 'album', item.album, 'maxlength="100"')}${field('Episodio', 'episode', item.episode, 'maxlength="100"')}${field('Tarifa ficticia en USD por reproducción', 'royaltyRate', item.royaltyRate ?? 0.01, 'type="number" min="0" max="1" step="0.000001" required')}<div class="form-field"><label>Portada</label><small>Se asigna una portada local según el tipo de contenido. No se utilizan imágenes externas.</small></div></div><label class="checkbox-field"><input name="enabled" type="checkbox" ${item.enabled !== false ? 'checked' : ''}>Contenido habilitado</label><p class="form-error" id="content-error" role="alert"></p><div class="modal-actions"><button class="btn btn-outline" type="button" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Guardar contenido</button></div></form>`;
}

export function initializeAdmin(gateway) {
  const container = document.getElementById('main-content');
  const requested = new URLSearchParams(location.search).get('section') ?? 'dashboard';
  const current = Object.hasOwn(labels, requested) ? requested : 'dashboard';
  let render;
  if (current === 'content') {
    container.innerHTML = `${pageHeading('Gestión del catálogo', 'Historias listas para descubrir.', 'Los cambios se guardan en este navegador.', `<button class="btn btn-primary" type="button" data-add>${icon('plus')}Agregar contenido</button>`)}<div class="filters"><div class="search-field">${icon('search')}<label class="sr-only" for="admin-search">Buscar contenido</label><input id="admin-search" type="search" placeholder="Buscar título o creador"></div><label class="sr-only" for="admin-type">Tipo</label><select class="filter-select" id="admin-type"><option value="">Todos los tipos</option>${Object.entries(TYPE_LABELS).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select><label class="sr-only" for="admin-status">Estado</label><select class="filter-select" id="admin-status"><option value="">Todos los estados</option><option value="enabled">Habilitados</option><option value="disabled">Deshabilitados</option></select></div><p class="result-count" id="admin-count" aria-live="polite"></p><div id="admin-content-list"></div>${section('Artistas del catálogo', '<div id="admin-artists"></div>')}`;
    const search = container.querySelector('#admin-search');
    const type = container.querySelector('#admin-type');
    const status = container.querySelector('#admin-status');
    render = () => {
      const items = gateway.getCatalog({ includeDisabled: true, query: search.value, type: type.value }).filter(item => !status.value || item.enabled === (status.value === 'enabled'));
      container.querySelector('#admin-count').textContent = `${items.length} contenidos · Habilitar o deshabilitar no elimina el historial.`;
      container.querySelector('#admin-content-list').innerHTML = contentRows(items);
      container.querySelector('#admin-artists').innerHTML = artistsView(gateway);
    };
    search.addEventListener('input', render); type.addEventListener('change', render); status.addEventListener('change', render);
    container.addEventListener('click', event => {
      const add = event.target.closest('[data-add]');
      const edit = event.target.closest('[data-edit]');
      const toggle = event.target.closest('[data-toggle]');
      try {
        if (toggle) {
          const item = gateway.getContentById(toggle.dataset.toggle);
          gateway.setContentEnabled(item.id, !item.enabled);
          notify(`${item.title}: ${item.enabled ? 'deshabilitado' : 'habilitado'}.`);
        }
        if (add || edit) {
          const item = edit ? gateway.getContentById(edit.dataset.edit) : {};
          const dialog = openModal(edit ? 'Editar contenido' : 'Agregar contenido', contentForm(item));
          const form = dialog.querySelector('form');
          const updateTypeFields = () => {
            const music = form.elements.type.value === 'music';
            const podcast = form.elements.type.value === 'podcast';
            for (const [name, enabled] of [['album', music], ['episode', podcast], ['royaltyRate', music]]) {
              const input = form.elements[name];
              input.disabled = !enabled; input.required = enabled;
              input.closest('.form-field').hidden = !enabled;
            }
          };
          form.elements.type.addEventListener('change', updateTypeFields); updateTypeFields();
          form.addEventListener('submit', event => {
            event.preventDefault();
            try {
              const data = Object.fromEntries(new FormData(form));
              data.enabled = form.elements.enabled.checked;
              gateway.saveContent(data, item.id);
              dialog.close(); notify(edit ? 'Contenido actualizado.' : 'Contenido agregado.');
            } catch (error) { dialog.querySelector('#content-error').textContent = error.message; }
          });
        }
      } catch (error) { notify(error.message, true); }
    });
  } else if (current === 'plays') {
    container.innerHTML = `${pageHeading('Registro de actividad', 'El recorrido de cada escucha.', 'Una fila por evento content.played, sin duplicar pausas y reanudaciones.')}<div class="filters"><div class="search-field">${icon('search')}<label class="sr-only" for="play-search">Buscar usuario o contenido</label><input id="play-search" type="search" placeholder="Buscar usuario, contenido o creador"></div></div><p class="result-count" id="play-count" aria-live="polite"></p><div id="play-list"></div>`;
    const search = container.querySelector('#play-search');
    render = () => {
      const query = normalize(search.value);
      const plays = gateway.getHistory().filter(play => normalize(`${play.title} ${play.creator} ${play.userName}`).includes(query));
      container.querySelector('#play-count').textContent = `${plays.length} reproducciones`;
      container.querySelector('#play-list').innerHTML = historyTable(plays, { admin: true });
    };
    search.addEventListener('input', render);
  } else {
    render = () => {
      const metrics = gateway.getDashboardMetrics();
      container.innerHTML = current === 'royalties' ? royaltiesView(gateway) : current === 'users' ? usersView(gateway, metrics) : current === 'metrics' ? metricsView(gateway, metrics) : overview(gateway, metrics);
    };
  }
  render();
  return gateway.subscribe(EVENTS.DATA, render);
}
