import { EVENTS, ROLES } from '../utils/constants.js';
import { assert, createId } from '../utils/helpers.js';

export class PlaybackService {
  constructor(storage, events, catalog, auth) {
    this.storage = storage; this.events = events; this.catalog = catalog; this.auth = auth;
    this.timer = null;
    this.restoreState();
  }

  restoreState() {
    const user = this.auth.getSession();
    const saved = user ? this.storage.get(`player:${user.id}`) : null;
    this.state = { contentId: saved?.contentId ?? null, position: saved?.position ?? 0, status: saved?.status === 'ended' ? 'ended' : 'paused', playId: saved?.playId ?? null, queue: saved?.queue ?? [] };
    const content = this.catalog.getContentById(this.state.contentId);
    if (!content) this.state = { contentId: null, position: 0, status: 'paused', playId: null, queue: [] };
    else this.state.position = Math.min(content.duration, Math.max(0, this.state.position));
  }

  getState() {
    return { ...this.state, queue: [...this.state.queue], content: this.catalog.getContentById(this.state.contentId) };
  }

  persist() {
    const user = this.auth.getSession();
    if (user) this.storage.set(`player:${user.id}`, this.state);
  }

  publish() { this.events.emit(EVENTS.PLAYER, this.getState()); }

  playContent(id, queue = []) {
    const user = this.auth.requireUser(ROLES.USER);
    const content = this.catalog.getContentById(id);
    assert(content, 'Este contenido no está disponible.');
    const play = {
      id: createId('play'), userId: user.id, userName: user.name, contentId: content.id,
      title: content.title, creator: content.creator, type: content.type, category: content.category,
      region: content.region, duration: content.duration, cover: content.cover, royaltyRate: content.royaltyRate,
      playedAt: new Date().toISOString(),
    };
    this.pause(false);
    this.events.emit(EVENTS.PLAYED, Object.freeze(play));
    this.state = { contentId: id, position: 0, status: 'playing', playId: play.id, queue: queue.length ? [...new Set(queue)] : this.catalog.getCatalog().map(item => item.id) };
    this.persist(); this.startTimer(); this.publish();
    return play;
  }

  resume() {
    this.auth.requireUser(ROLES.USER);
    const content = this.catalog.getContentById(this.state.contentId);
    assert(content, 'Selecciona contenido disponible para reproducir.');
    if (!this.state.playId || this.state.status === 'ended') return this.playContent(content.id, this.state.queue);
    if (this.state.status === 'playing') return;
    this.state.status = 'playing'; this.persist(); this.startTimer(); this.publish();
  }

  pause(notify = true) {
    clearInterval(this.timer); this.timer = null;
    if (this.state.status === 'playing') this.state.status = 'paused';
    this.persist(); if (notify) this.publish();
  }

  startTimer() {
    clearInterval(this.timer);
    let previous = Date.now();
    this.timer = setInterval(() => {
      try {
        if (!this.auth.getSession()) { this.pause(); return; }
        const content = this.catalog.getContentById(this.state.contentId);
        if (!content) { this.pause(); return; }
        const now = Date.now();
        this.state.position = Math.min(content.duration, this.state.position + (now - previous) / 1000);
        previous = now;
        if (this.state.position >= content.duration) { clearInterval(this.timer); this.timer = null; this.state.status = 'ended'; }
        this.persist(); this.publish();
      } catch (error) {
        clearInterval(this.timer); this.timer = null; this.state.status = 'paused';
        console.error(error); this.publish();
      }
    }, 1000);
  }

  seek(position) {
    this.auth.requireUser(ROLES.USER);
    const content = this.catalog.getContentById(this.state.contentId);
    assert(content, 'Selecciona contenido disponible.');
    const seconds = Number(position);
    assert(Number.isFinite(seconds), 'La posición no es válida.');
    this.state.position = Math.max(0, Math.min(content.duration, seconds));
    if (this.state.position >= content.duration) { clearInterval(this.timer); this.timer = null; this.state.status = 'ended'; }
    else if (this.state.status === 'ended') this.state.status = 'paused';
    this.persist(); this.publish();
  }

  skip(direction) {
    this.auth.requireUser(ROLES.USER);
    const available = this.state.queue.filter(id => this.catalog.getContentById(id));
    const queue = available.length ? available : this.catalog.getCatalog().map(item => item.id);
    assert(queue.length, 'No hay contenido disponible.');
    const index = queue.indexOf(this.state.contentId);
    const next = index < 0 ? (direction > 0 ? 0 : queue.length - 1) : (index + direction + queue.length) % queue.length;
    return this.playContent(queue[next], queue);
  }

  dispose() { this.pause(false); }
}
