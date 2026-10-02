import { DEFAULT_COVERS, EVENTS, REGIONS, TYPES } from '../utils/constants.js';
import { assert, createId, normalize } from '../utils/helpers.js';

export class CatalogService {
  constructor(storage, events) { this.storage = storage; this.events = events; }

  getCatalog({ query = '', type = '', category = '', region = '', includeDisabled = false } = {}) {
    const needle = normalize(query);
    return this.storage.get('catalog', []).filter(item =>
      (includeDisabled || item.enabled) && (!type || item.type === type) &&
      (!category || item.category === category) && (!region || item.region === region) &&
      (!needle || normalize(`${item.title} ${item.creator} ${item.album} ${item.category} ${item.episode ?? ''}`).includes(needle)),
    );
  }

  getContentById(id, includeDisabled = false) {
    return this.getCatalog({ includeDisabled }).find(item => item.id === id) ?? null;
  }

  validate(input, existing = {}) {
    const type = input.type ?? existing.type;
    const title = String(input.title ?? existing.title ?? '').trim();
    const creator = String(input.creator ?? existing.creator ?? '').trim();
    const category = String(input.category ?? existing.category ?? '').trim();
    const duration = Number(input.duration ?? existing.duration);
    const royaltyRate = type === TYPES.MUSIC ? Number(input.royaltyRate ?? existing.royaltyRate ?? 0.01) : 0;
    const region = input.region ?? existing.region;
    assert(Object.values(TYPES).includes(type), 'Selecciona un tipo de contenido válido.');
    assert(title.length >= 2 && title.length <= 100, 'El título debe tener entre 2 y 100 caracteres.');
    assert(creator.length >= 2 && creator.length <= 80, 'El artista o autor debe tener entre 2 y 80 caracteres.');
    assert(category.length >= 2 && category.length <= 50, 'Ingresa un género o categoría de 2 a 50 caracteres.');
    assert(Number.isInteger(duration) && duration > 0 && duration <= 86400, 'La duración debe ser un entero entre 1 y 86400 segundos.');
    assert(REGIONS.includes(region), 'Selecciona una región válida.');
    assert(Number.isFinite(royaltyRate) && royaltyRate >= 0 && royaltyRate <= 1, 'La tarifa ficticia debe estar entre 0 y 1 USD.');
    const album = String(input.album ?? existing.album ?? '').trim();
    const episode = String(input.episode ?? existing.episode ?? '').trim();
    assert(album.length <= 100 && episode.length <= 100, 'El álbum o episodio no puede superar 100 caracteres.');
    assert(type !== TYPES.MUSIC || album.length >= 2, 'Ingresa el álbum de la canción.');
    assert(type !== TYPES.PODCAST || episode.length >= 2, 'Ingresa el nombre del episodio.');
    return {
      ...existing, type, title, creator, category, duration, royaltyRate, region,
      genre: type === TYPES.MUSIC ? category : '', artist: type === TYPES.MUSIC ? creator : '',
      author: type !== TYPES.MUSIC ? creator : '', album: type === TYPES.MUSIC ? album : '', episode: type === TYPES.PODCAST ? episode : '',
      cover: existing.type === type && existing.cover ? existing.cover : DEFAULT_COVERS[type],
      popularity: existing.popularity ?? 0, enabled: typeof input.enabled === 'boolean' ? input.enabled : (existing.enabled ?? true),
    };
  }

  save(input, id = null) {
    const catalog = this.storage.get('catalog', []);
    const existing = id ? catalog.find(item => item.id === id) : {};
    assert(existing, 'El contenido no existe.');
    const item = { ...this.validate(input, existing), id: id ?? createId('content') };
    this.storage.set('catalog', id ? catalog.map(entry => entry.id === id ? item : entry) : [...catalog, item]);
    this.events.emit(EVENTS.CATALOG, { contentId: item.id });
    return item;
  }

  setEnabled(id, enabled) {
    const item = this.getContentById(id, true);
    assert(item, 'El contenido no existe.');
    return this.save({ enabled: Boolean(enabled) }, id);
  }
}
