import { EVENTS, TYPES } from '../utils/constants.js';

function rank(plays, key) {
  const counts = new Map();
  for (const play of plays) {
    const label = play[key];
    if (label) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export class AnalyticsService {
  constructor(events, history, catalog, royalties, auth) {
    this.history = history; this.catalog = catalog; this.royalties = royalties; this.auth = auth;
    // Metrics are derived, never persisted as a second, potentially divergent counter.
    events.on(EVENTS.PLAYED, play => events.emit(EVENTS.DATA, { playId: play.id, userId: play.userId }));
    events.on(EVENTS.CATALOG, data => events.emit(EVENTS.DATA, data));
  }

  getMetrics(userId = null) {
    const plays = this.history.getHistory(userId);
    const counts = new Map();
    for (const play of plays) {
      const item = counts.get(play.contentId) ?? { id: play.contentId, title: play.title, creator: play.creator, type: play.type, count: 0 };
      item.count++;
      counts.set(play.contentId, item);
    }
    const catalog = this.catalog.getCatalog({ includeDisabled: true });
    return {
      totalPlays: plays.length,
      uniqueContents: counts.size,
      totalUsers: this.auth.getUsers().filter(user => user.role === 'USER').length,
      totalAccounts: this.auth.getUsers().length,
      totalContents: catalog.length,
      enabledContents: catalog.filter(item => item.enabled).length,
      contentCounts: Object.fromEntries(Object.values(TYPES).map(type => [type, catalog.filter(item => item.type === type).length])),
      byType: rank(plays, 'type'), byGenre: rank(plays.filter(play => play.type === TYPES.MUSIC), 'category'),
      byCreator: rank(plays, 'creator'), byUser: rank(plays, 'userId'),
      topContents: [...counts.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title)),
      totalRoyaltyUnits: userId ? null : this.royalties.getRoyalties().totalUnits,
      recent: plays.slice(0, 10),
    };
  }
}
