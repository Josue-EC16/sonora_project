import { EVENTS } from '../utils/constants.js';

export class HistoryService {
  constructor(storage, events) {
    this.storage = storage;
    events.on(EVENTS.PLAYED, play => {
      const plays = storage.get('plays', []);
      if (!plays.some(item => item.id === play.id)) storage.set('plays', [...plays, play]);
    });
  }

  getHistory(userId = null) {
    return this.storage.get('plays', []).filter(play => !userId || play.userId === userId).reverse().sort((a, b) => b.playedAt.localeCompare(a.playedAt));
  }
}
