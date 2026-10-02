export class EventBus {
  constructor() { this.listeners = new Map(); }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) this.listeners.set(eventName, new Set());
    this.listeners.get(eventName).add(callback);
    return () => this.listeners.get(eventName)?.delete(callback);
  }

  emit(eventName, data) {
    const errors = [];
    for (const callback of [...(this.listeners.get(eventName) ?? [])]) {
      try { callback(data); } catch (error) { errors.push(error); }
    }
    if (errors.length) throw new Error(errors.map(error => error.message).join(' '));
  }
}
