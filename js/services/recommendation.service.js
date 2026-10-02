import { EVENTS, TYPES } from '../utils/constants.js';

const increment = (map, key) => { if (key) map[key] = (map[key] ?? 0) + 1; };
const favorite = map => Object.entries(map).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];

export class RecommendationService {
  constructor(storage, events, catalog, history) {
    this.storage = storage;
    this.catalog = catalog;
    this.history = history;
    events.on(EVENTS.PLAYED, play => {
      const all = storage.get('preferences', {});
      const preferences = { genres: {}, creators: {}, categories: {}, total: 0 };
      // Rebuild from the ledger: repeating the same event cannot inflate preferences.
      for (const entry of history.getHistory(play.userId)) {
        if (entry.type === TYPES.MUSIC) increment(preferences.genres, entry.category);
        increment(preferences.creators, entry.creator);
        increment(preferences.categories, entry.category);
        preferences.total++;
      }
      all[play.userId] = preferences;
      storage.set('preferences', all);
    });
  }

  getRecommendations(user, limit = 8) {
    const preferences = this.storage.get('preferences', {})[user.id] ?? { genres: {}, creators: {}, categories: {} };
    const topGenre = favorite(preferences.genres);
    const topCreator = favorite(preferences.creators);
    const topCategory = favorite(preferences.categories);
    const counts = {};
    for (const play of this.history.getHistory(user.id)) increment(counts, play.contentId);
    return this.catalog.getCatalog().map(item => {
      let score = 0;
      const reasons = [];
      if ((topGenre && item.genre === topGenre) || (!topGenre && user.favoriteGenres.includes(item.genre))) { score += 3; reasons.push('Tu género favorito'); }
      if (topCreator && item.creator === topCreator) { score += 2; reasons.push('Un creador que escuchas'); }
      if (topCategory && item.category === topCategory) { score += 2; reasons.push('Afinidad de categoría'); }
      if (item.region === user.region) { score++; reasons.push('De tu región'); }
      if (item.popularity >= 700) { score++; reasons.push('Popular en la demo'); }
      score -= Math.min(3, Math.floor((counts[item.id] ?? 0) / 3));
      return { ...item, score, reason: reasons[0] ?? 'Descubre algo diferente' };
    }).sort((a, b) => b.score - a.score || b.popularity - a.popularity || a.id.localeCompare(b.id)).slice(0, limit);
  }
}
