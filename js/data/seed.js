import { initialUsers } from './users.js';
import { initialCatalog } from './catalog.js';

export function seed(storage) {
  if (storage.get('schemaVersion') === null) {
    storage.set('users', initialUsers);
    storage.set('catalog', initialCatalog);
    storage.set('plays', []);
    storage.set('royalties', []);
    storage.set('preferences', {});
    storage.set('schemaVersion', 1);
  }
}
