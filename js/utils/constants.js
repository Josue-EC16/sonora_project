export const ROLES = Object.freeze({ USER: 'USER', ADMIN: 'ADMIN' });
export const TYPES = Object.freeze({ MUSIC: 'music', PODCAST: 'podcast', AUDIOBOOK: 'audiobook' });
export const TYPE_LABELS = Object.freeze({ music: 'Música', podcast: 'Podcast', audiobook: 'Audiolibro' });
export const REGIONS = ['Colombia', 'México', 'Argentina', 'Chile', 'España'];
export const STORAGE_PREFIX = 'sonora-mvp:v1:';
export const MONEY_SCALE = 1000000;
export const EVENTS = Object.freeze({ PLAYED: 'content.played', PLAYER: 'player.changed', DATA: 'data.updated', CATALOG: 'catalog.updated' });
export const DEFAULT_COVERS = Object.freeze({ music: 'assets/images/albums/orbit.svg', podcast: 'assets/images/podcasts/conversations.svg', audiobook: 'assets/images/audiobooks/pages.svg' });
