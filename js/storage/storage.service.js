import { STORAGE_PREFIX } from '../utils/constants.js';
import { clone } from '../utils/helpers.js';

export class StorageService {
  constructor(adapter = globalThis.localStorage, prefix = STORAGE_PREFIX) {
    this.adapter = adapter;
    this.prefix = prefix;
  }

  get(key, fallback = null) {
    try {
      const raw = this.adapter.getItem(this.prefix + key);
      return raw === null ? clone(fallback) : JSON.parse(raw);
    } catch {
      throw new Error('No se pudieron leer los datos locales. Revisa los permisos del navegador o el almacenamiento del sitio.');
    }
  }

  set(key, value) {
    try {
      this.adapter.setItem(this.prefix + key, JSON.stringify(value));
      return clone(value);
    } catch {
      throw new Error('No se pudieron guardar los datos. El almacenamiento local está bloqueado o lleno.');
    }
  }

  remove(key) {
    try { this.adapter.removeItem(this.prefix + key); }
    catch { throw new Error('No se pudo actualizar el almacenamiento local.'); }
  }
}
