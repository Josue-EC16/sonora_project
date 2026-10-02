import { EVENTS } from '../utils/constants.js';
import { escapeHtml as e } from '../utils/helpers.js';
import { icon } from '../ui/icons.js';
import { pageHeading, contentCards, section, emptyState, eventTrace } from '../ui/renderer.js';

export function initializeDashboard(gateway) {
  const container = document.getElementById('main-content');
  const render = () => {
    const user = gateway.getSession();
    const catalog = gateway.getCatalog();
    const recommendations = gateway.getRecommendations(6);
    const history = gateway.getHistory();
    const available = new Map(catalog.map(item => [item.id, item]));
    const recent = [...new Set(history.map(play => play.contentId))].map(id => available.get(id)).filter(Boolean).slice(0, 6);
    const popular = [...catalog].sort((a, b) => (b.reproductions * 100 + b.popularity) - (a.reproductions * 100 + a.popularity)).slice(0, 6);
    const greeting = new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
    container.innerHTML = `${pageHeading('Hecho para ti', `${greeting}, ${user.name}.`, 'Dale play a algo que te acompañe hoy.')}<section class="hero"><div><p class="eyebrow">Un espacio, muchas formas de escuchar</p><h2>Descubre tu siguiente<br>gran conexión.</h2><p>De una canción que se queda contigo a una historia que cambia tu día. Explora música, podcasts y audiolibros.</p><a class="btn btn-primary" href="catalog.html">Explorar ahora ${icon('arrow')}</a></div><div class="hero-art" aria-hidden="true"><img src="assets/images/albums/orbit.svg" alt=""><img src="assets/images/albums/tide.svg" alt=""></div></section>
    ${section('Vuelve a lo que te gusta', recent.length ? `<div class="recent-grid" data-queue="${e(JSON.stringify(recent.map(item => item.id)))}">${recent.map(item => `<button class="recent-item" type="button" data-play="${e(item.id)}"><img src="${e(item.cover)}" alt=""><span><strong>${e(item.title)}</strong><small>${e(item.creator)}</small></span>${icon('play')}</button>`).join('')}</div>` : emptyState('Tu biblioteca está empezando', 'Lo que escuches aparecerá aquí.', 'catalog.html'), 'history.html', 'Ver historial')}
    ${section('Recomendado para ti', contentCards(recommendations), 'catalog.html?view=recommendations')}
    ${section('Encuentra tu próximo favorito', `<div class="category-grid"><a class="category-tile" href="catalog.html?type=music"><h3>Música</h3><p>Tu banda sonora diaria</p>${icon('music')}</a><a class="category-tile" href="catalog.html?type=podcast"><h3>Podcasts</h3><p>Ideas que conectan</p>${icon('podcast')}</a><a class="category-tile" href="catalog.html?type=audiobook"><h3>Audiolibros</h3><p>Historias para llevar</p>${icon('book')}</a></div>`)}
    ${section('Popular en la demo', contentCards(popular), 'catalog.html')}
    ${eventTrace(history[0])}</section>`;
  };
  render();
  return gateway.subscribe(EVENTS.DATA, render);
}
