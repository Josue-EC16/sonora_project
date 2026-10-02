import { EVENTS, REGIONS, TYPE_LABELS } from '../utils/constants.js';
import { escapeHtml as e, normalize } from '../utils/helpers.js';
import { pageHeading, contentCards } from '../ui/renderer.js';
import { icon } from '../ui/icons.js';

export function initializeCatalog(gateway) {
  const container = document.getElementById('main-content');
  const params = new URLSearchParams(location.search);
  const recommended = params.get('view') === 'recommendations';
  let type = Object.hasOwn(TYPE_LABELS, params.get('type')) ? params.get('type') : '';
  container.innerHTML = `${pageHeading(recommended ? 'Tu selección personal' : 'Todo en un lugar', recommended ? 'Recomendado para ti' : 'Descubre algo nuevo.', recommended ? 'Una selección basada en tus escuchas, preferencias y región.' : 'Música, podcasts y audiolibros. Encuentra lo que te mueve.')}<div class="chips" aria-label="Tipos de contenido">${[['', 'Todo'], ...Object.entries(TYPE_LABELS)].map(([value, label]) => `<button class="chip ${type === value ? 'active' : ''}" type="button" data-type="${value}" aria-pressed="${type === value}">${label}</button>`).join('')}</div><div class="filters"><div class="search-field">${icon('search')}<label class="sr-only" for="catalog-search">Buscar título, artista, autor o álbum</label><input id="catalog-search" type="search" placeholder="¿Qué quieres escuchar?" autocomplete="off"></div><label class="sr-only" for="category-filter">Género o categoría</label><select class="filter-select" id="category-filter"><option value="">Todas las categorías</option></select><label class="sr-only" for="region-filter">Región</label><select class="filter-select" id="region-filter"><option value="">Todas las regiones</option>${REGIONS.map(region => `<option>${region}</option>`).join('')}</select></div><p class="result-count" id="catalog-count" aria-live="polite"></p><div id="catalog-results"></div>${recommended ? '<p class="subtitle">Puntuación</p>' : ''}`;
  const search = container.querySelector('#catalog-search');
  const category = container.querySelector('#category-filter');
  const region = container.querySelector('#region-filter');
  const updateCategories = () => {
    const previous = category.value;
    const categories = [...new Set(gateway.getCatalog({ type }).map(item => item.category))].sort();
    category.innerHTML = '<option value="">Todas las categorías</option>' + categories.map(value => `<option value="${e(value)}">${e(value)}</option>`).join('');
    if (categories.includes(previous)) category.value = previous;
  };
  const renderResults = () => {
    const query = normalize(search.value);
    const items = recommended ? gateway.getRecommendations(100).filter(item => (!type || item.type === type) && (!category.value || item.category === category.value) && (!region.value || item.region === region.value) && (!query || normalize(`${item.title} ${item.creator} ${item.album} ${item.category} ${item.episode ?? ''}`).includes(query))) : gateway.getCatalog({ type, query: search.value, category: category.value, region: region.value });
    container.querySelector('#catalog-count').textContent = `${items.length} contenido${items.length === 1 ? '' : 's'} disponible${items.length === 1 ? '' : 's'}`;
    container.querySelector('#catalog-results').innerHTML = contentCards(items);
  };
  container.querySelector('.chips').addEventListener('click', event => {
    const button = event.target.closest('[data-type]');
    if (!button) return;
    type = button.dataset.type;
    container.querySelectorAll('[data-type]').forEach(chip => { chip.classList.toggle('active', chip.dataset.type === type); chip.setAttribute('aria-pressed', String(chip.dataset.type === type)); });
    updateCategories(); renderResults();
  });
  search.addEventListener('input', renderResults);
  category.addEventListener('change', renderResults);
  region.addEventListener('change', renderResults);
  updateCategories(); renderResults();
  return gateway.subscribe(EVENTS.DATA, () => { updateCategories(); renderResults(); });
}
