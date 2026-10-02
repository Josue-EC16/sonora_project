import { EVENTS, MONEY_SCALE, TYPES } from '../utils/constants.js';

export class RoyaltyService {
  constructor(storage, events) {
    this.storage = storage;
    events.on(EVENTS.PLAYED, play => {
      if (play.type !== TYPES.MUSIC) return;
      const records = storage.get('royalties', []);
      if (records.some(item => item.playId === play.id)) return;
      storage.set('royalties', [...records, {
        playId: play.id, contentId: play.contentId, title: play.title, artist: play.creator,
        rateUnits: Math.round(play.royaltyRate * MONEY_SCALE), amountUnits: Math.round(play.royaltyRate * MONEY_SCALE), playedAt: play.playedAt,
      }]);
    });
  }

  getRoyalties() {
    const records = this.storage.get('royalties', []);
    const groups = new Map();
    for (const record of records) {
      const group = groups.get(record.contentId) ?? { contentId: record.contentId, title: record.title, artist: record.artist, plays: 0, amountUnits: 0, rates: [] };
      group.plays++;
      group.amountUnits += record.amountUnits;
      if (!group.rates.includes(record.rateUnits)) group.rates.push(record.rateUnits);
      groups.set(record.contentId, group);
    }
    return { totalUnits: records.reduce((sum, record) => sum + record.amountUnits, 0), records, contents: [...groups.values()].sort((a, b) => b.amountUnits - a.amountUnits) };
  }
}
