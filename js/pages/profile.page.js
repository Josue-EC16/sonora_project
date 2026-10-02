import { EVENTS, TYPE_LABELS } from '../utils/constants.js';
import { escapeHtml as e } from '../utils/helpers.js';
import { number } from '../utils/formatters.js';
import { kpi, barChart, section } from '../ui/renderer.js';
import { icon } from '../ui/icons.js';

export function initializeProfile(gateway) {
  const container = document.getElementById('main-content');
  const render = () => {
    const user = gateway.getSession();
    const metrics = gateway.getDashboardMetrics();
    container.innerHTML = `<div class="profile-header"><span class="avatar profile-avatar">${e(user.name.charAt(0))}</span><div><p class="eyebrow">Tu perfil</p><h1>${e(user.name)}</h1><p class="subtitle">${e(user.email)}</p></div></div><div class="kpi-grid">${kpi('Reproducciones', number(metrics.totalPlays), 'Solo tus escuchas', 'play')}${kpi('Contenidos descubiertos', number(metrics.uniqueContents), 'Títulos diferentes', 'music')}${kpi('Género favorito', metrics.byGenre[0]?.label ?? 'Por descubrir', 'Según tu historial', 'spark', true)}${kpi('Creador más escuchado', metrics.byCreator[0]?.label ?? 'Por descubrir', 'Según tu historial', 'user', true)}</div>${section('Tu forma de escuchar', '<div class="two-columns"><section class="panel"><h2>Reproducciones por tipo</h2>' + barChart(metrics.byType, TYPE_LABELS) + '</section><section class="panel"><h2>Tu cuenta de demostración</h2><div class="profile-details"><div class="profile-detail"><span>Nombre</span><strong>' + e(user.name) + '</strong></div><div class="profile-detail"><span>Región</span><strong>' + e(user.region) + '</strong></div><div class="profile-detail"><span>Rol</span><strong>USER</strong></div><div class="profile-detail"><span>Preferencias iniciales</span><strong>' + e(user.favoriteGenres.join(', ')) + '</strong></div></div></section></div>')}<div class="section notice">${icon('info')}<div><strong>Las recomendaciones evolucionan contigo.</strong><br>Aprendizaje automático.</div></div>`;
  };
  render();
  return gateway.subscribe(EVENTS.DATA, render);
}
