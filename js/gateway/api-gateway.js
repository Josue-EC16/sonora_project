import { StorageService } from '../storage/storage.service.js';
import { EventBus } from '../events/event-bus.js';
import { seed } from '../data/seed.js';
import { AuthService } from '../services/auth.service.js';
import { CatalogService } from '../services/catalog.service.js';
import { HistoryService } from '../services/history.service.js';
import { RoyaltyService } from '../services/royalty.service.js';
import { RecommendationService } from '../services/recommendation.service.js';
import { AnalyticsService } from '../services/analytics.service.js';
import { PlaybackService } from '../services/playback.service.js';
import { EVENTS, ROLES } from '../utils/constants.js';
import { assert } from '../utils/helpers.js';

// The facade is the only business entry point used by pages and UI components.
export function createApiGateway(storage = new StorageService()) {
  seed(storage);
  const events = new EventBus();
  const auth = new AuthService(storage);
  const catalog = new CatalogService(storage, events);
  const history = new HistoryService(storage, events);
  const royalties = new RoyaltyService(storage, events);
  const recommendations = new RecommendationService(storage, events, catalog, history);
  const analytics = new AnalyticsService(events, history, catalog, royalties, auth);
  const playback = new PlaybackService(storage, events, catalog, auth);
  const withPlayCounts = items => {
    const counts = {};
    for (const play of history.getHistory()) counts[play.contentId] = (counts[play.contentId] ?? 0) + 1;
    return items.map(item => ({ ...item, reproductions: counts[item.id] ?? 0 }));
  };

  return Object.freeze({
    login(email, password) {
      playback.dispose();
      const user = auth.login(email, password);
      playback.restoreState();
      return user;
    },
    logout() { playback.dispose(); auth.logout(); },
    getSession: () => auth.getSession(),
    getCatalog(options = {}) {
      const user = auth.requireUser();
      return withPlayCounts(catalog.getCatalog({ ...options, includeDisabled: user.role === ROLES.ADMIN && Boolean(options.includeDisabled) }));
    },
    getContentById(id) {
      const user = auth.requireUser();
      const item = catalog.getContentById(id, user.role === ROLES.ADMIN);
      return item ? withPlayCounts([item])[0] : null;
    },
    playContent(id, queue) { return playback.playContent(id, queue); },
    pause() { auth.requireUser(ROLES.USER); playback.pause(); },
    resume: () => playback.resume(),
    next: () => playback.skip(1),
    previous: () => playback.skip(-1),
    seek: position => playback.seek(position),
    getPlayerState() { auth.requireUser(ROLES.USER); return playback.getState(); },
    getHistory() { const user = auth.requireUser(); return history.getHistory(user.role === ROLES.ADMIN ? null : user.id); },
    getRecommendations(limit = 8) { const user = auth.requireUser(ROLES.USER); return recommendations.getRecommendations(user, limit); },
    getRoyalties() { auth.requireUser(ROLES.ADMIN); return royalties.getRoyalties(); },
    getDashboardMetrics() { const user = auth.requireUser(); return analytics.getMetrics(user.role === ROLES.ADMIN ? null : user.id); },
    getUsers() { auth.requireUser(ROLES.ADMIN); return auth.getUsers(); },
    getArtists() {
      auth.requireUser(ROLES.ADMIN);
      const artists = new Map();
      for (const item of catalog.getCatalog({ type: 'music', includeDisabled: true })) {
        const artist = artists.get(item.creator) ?? { name: item.creator, region: item.region, contents: 0 };
        artist.contents++; artists.set(item.creator, artist);
      }
      return [...artists.values()];
    },
    saveContent(input, id) { auth.requireUser(ROLES.ADMIN); return catalog.save(input, id); },
    setContentEnabled(id, enabled) { auth.requireUser(ROLES.ADMIN); return catalog.setEnabled(id, enabled); },
    subscribe(event, callback) {
      auth.requireUser();
      assert(Object.values(EVENTS).includes(event), 'Evento no permitido.');
      return events.on(event, callback);
    },
    dispose: () => playback.dispose(),
  });
}

let instance;
export function getApiGateway() { return instance ??= createApiGateway(); }
