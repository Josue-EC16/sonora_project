import { createApiGateway } from '../js/gateway/api-gateway.js';
import { StorageService } from '../js/storage/storage.service.js';
import { EventBus } from '../js/events/event-bus.js';
import { HistoryService } from '../js/services/history.service.js';
import { RoyaltyService } from '../js/services/royalty.service.js';
import { RecommendationService } from '../js/services/recommendation.service.js';
import { EVENTS, MONEY_SCALE } from '../js/utils/constants.js';
import { duration, money } from '../js/utils/formatters.js';
import { escapeHtml } from '../js/utils/helpers.js';
import { renderShell } from '../js/ui/renderer.js';
import { initializePlayer } from '../js/ui/player.js';
import { initializeLogin } from '../js/pages/login.page.js';
import { initializeDashboard } from '../js/pages/dashboard.page.js';
import { initializeCatalog } from '../js/pages/catalog.page.js';
import { initializeHistory } from '../js/pages/history.page.js';
import { initializeProfile } from '../js/pages/profile.page.js';
import { initializeAdmin } from '../js/pages/admin.page.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });
function assert(condition, message = 'Aserción fallida') { if (!condition) throw new Error(message); }
function equal(actual, expected) { assert(JSON.stringify(actual) === JSON.stringify(expected), `Esperado ${JSON.stringify(expected)}, recibido ${JSON.stringify(actual)}`); }
function throws(run, fragment = '') {
  try { run(); } catch (error) { assert(error.message.includes(fragment), `Error inesperado: ${error.message}`); return; }
  throw new Error('Se esperaba un error.');
}
function fixture() {
  const map = new Map();
  const adapter = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
  const storage = new StorageService(adapter, 'test:');
  const gateway = createApiGateway(storage);
  return { gateway, storage, map };
}
const loginUser = gateway => gateway.login('user@spotify.local', 'user123');
const loginAdmin = gateway => gateway.login('admin@spotify.local', 'admin123');
const newSong = { type: 'music', title: 'Canción de prueba', creator: 'Artista de prueba', category: 'Indie', album: 'Pruebas', duration: 60, region: 'Colombia', royaltyRate: 0.01, enabled: true };

test('Semilla: 18 canciones, 5 podcasts, 5 audiolibros, 4 cuentas', () => {
  const { gateway } = fixture(); loginAdmin(gateway);
  equal(gateway.getCatalog().length, 28); equal(gateway.getUsers().length, 4);
  equal(gateway.getDashboardMetrics().contentCounts, { music: 18, podcast: 5, audiobook: 5 }); gateway.dispose();
});
test('El catálogo contiene los campos mínimos por tipo', () => {
  const { gateway } = fixture(); loginUser(gateway);
  for (const content of gateway.getCatalog()) {
    assert(content.id && content.title && content.creator && content.cover && content.region && content.duration > 0 && content.enabled);
    if (content.type === 'music') assert(content.artist && content.album && content.genre && content.royaltyRate >= 0);
    if (content.type === 'podcast') assert(content.author && content.episode && content.category);
    if (content.type === 'audiobook') assert(content.author && content.category);
  } gateway.dispose();
});
test('La semilla no sobrescribe modificaciones existentes', () => {
  const { gateway, storage } = fixture(); loginAdmin(gateway); gateway.saveContent(newSong);
  const reloaded = createApiGateway(storage); equal(reloaded.getCatalog().length, 29); reloaded.dispose(); gateway.dispose();
});
test('Rechaza credenciales incorrectas sin abrir sesión', () => {
  const { gateway } = fixture(); throws(() => gateway.login('user@spotify.local', 'incorrecta'), 'incorrectos'); equal(gateway.getSession(), null);
});
test('Login reconoce USER y normaliza el correo', () => {
  const { gateway } = fixture(); const user = gateway.login(' USER@SPOTIFY.LOCAL ', 'user123'); equal(user.role, 'USER'); assert(!('password' in user)); gateway.dispose();
});
test('Login reconoce ADMIN', () => {
  const { gateway } = fixture(); equal(loginAdmin(gateway).role, 'ADMIN'); gateway.dispose();
});
test('La sesión persiste al reconstruir el gateway', () => {
  const { gateway, storage } = fixture(); loginUser(gateway); const reloaded = createApiGateway(storage); equal(reloaded.getSession().id, 'user-1'); reloaded.dispose(); gateway.dispose();
});
test('Logout elimina la sesión y bloquea el catálogo', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.logout(); equal(gateway.getSession(), null); throws(() => gateway.getCatalog(), 'Inicia sesión');
});
test('Visitantes no pueden consultar historial, recomendaciones ni métricas', () => {
  const { gateway } = fixture(); for (const method of ['getHistory', 'getRecommendations', 'getDashboardMetrics', 'getRoyalties', 'getUsers']) throws(() => gateway[method](), 'Inicia sesión');
});
test('USER no puede ejecutar operaciones ADMIN', () => {
  const { gateway } = fixture(); loginUser(gateway);
  for (const method of ['getRoyalties', 'getUsers', 'getArtists']) throws(() => gateway[method](), 'permisos');
  throws(() => gateway.saveContent(newSong), 'permisos'); throws(() => gateway.setContentEnabled('music-1', false), 'permisos'); gateway.dispose();
});
test('ADMIN no crea reproducciones de usuario', () => {
  const { gateway } = fixture(); loginAdmin(gateway); throws(() => gateway.playContent('music-1'), 'permisos'); gateway.dispose();
});
test('Búsqueda sin sensibilidad a acentos o mayúsculas', () => {
  const { gateway } = fixture(); loginUser(gateway); assert(gateway.getCatalog({ query: 'SOFIA' }).every(item => item.creator === 'Sofía Alba')); equal(gateway.getCatalog({ query: 'SOFIA' }).length, 2); gateway.dispose();
});
test('Filtros por tipo, región y categoría se combinan', () => {
  const { gateway } = fixture(); loginUser(gateway); equal(gateway.getCatalog({ type: 'music', region: 'Colombia', category: 'Indie' }).length, 2); equal(gateway.getCatalog({ type: 'podcast' }).length, 5); equal(gateway.getCatalog({ type: 'audiobook' }).length, 5); gateway.dispose();
});
test('USER no puede incluir contenido deshabilitado ni reproducirlo', () => {
  const { gateway } = fixture(); loginAdmin(gateway); gateway.setContentEnabled('music-1', false); loginUser(gateway);
  equal(gateway.getContentById('music-1'), null); equal(gateway.getCatalog({ includeDisabled: true }).length, 27); throws(() => gateway.playContent('music-1'), 'disponible'); gateway.dispose();
});
test('ADMIN agrega, edita y rehabilita contenido', () => {
  const { gateway } = fixture(); loginAdmin(gateway); const item = gateway.saveContent(newSong);
  gateway.saveContent({ title: 'Título actualizado' }, item.id); equal(gateway.getContentById(item.id).title, 'Título actualizado');
  gateway.setContentEnabled(item.id, false); equal(gateway.getCatalog({ includeDisabled: true }).length, 29); gateway.setContentEnabled(item.id, true); equal(gateway.getContentById(item.id).enabled, true); gateway.dispose();
});
test('ADMIN puede agregar podcasts y audiolibros sin regalías', () => {
  const { gateway } = fixture(); loginAdmin(gateway);
  const podcast = gateway.saveContent({ ...newSong, type: 'podcast', episode: 'Primer episodio' });
  const book = gateway.saveContent({ ...newSong, type: 'audiobook' }); equal(podcast.royaltyRate, 0); equal(book.royaltyRate, 0); gateway.dispose();
});
test('Valida título, duración, tarifa, región, álbum y episodio', () => {
  const { gateway } = fixture(); loginAdmin(gateway);
  for (const patch of [{ title: '' }, { duration: -1 }, { duration: 1.5 }, { royaltyRate: 2 }, { region: 'Desconocida' }, { album: '' }, { type: 'podcast', episode: '' }]) throws(() => gateway.saveContent({ ...newSong, ...patch })); gateway.dispose();
});
test('Event Bus entrega a varios suscriptores y permite desuscribir', () => {
  const bus = new EventBus(); let a = 0; let b = 0; const off = bus.on('test', () => a++); bus.on('test', () => b++); bus.emit('test', {}); off(); bus.emit('test', {}); equal(a, 1); equal(b, 2);
});
test('Un suscriptor con error no impide notificar a los demás', () => {
  const bus = new EventBus(); let notified = false; bus.on('test', () => { throw new Error('fallo'); }); bus.on('test', () => { notified = true; }); throws(() => bus.emit('test'), 'fallo'); assert(notified);
});
test('Una reproducción emite content.played y registra su instantánea', () => {
  const { gateway } = fixture(); loginUser(gateway); let received; gateway.subscribe(EVENTS.PLAYED, event => { received = event; });
  const play = gateway.playContent('music-1'); gateway.pause(); equal(received.id, play.id); equal(gateway.getHistory().length, 1); equal(gateway.getHistory()[0].title, 'Luces de ciudad'); equal(play.userId, 'user-1'); assert(play.playedAt && play.type === 'music'); gateway.dispose();
});
test('Un evento repetido no duplica historial, regalías ni preferencias', () => {
  const { gateway, storage } = fixture(); loginUser(gateway);
  const bus = new EventBus(); const historyService = new HistoryService(storage, bus); const royaltyService = new RoyaltyService(storage, bus);
  new RecommendationService(storage, bus, gateway, historyService);
  const play = { id: 'same-event', userId: 'user-1', contentId: 'music-1', title: 'Prueba', creator: 'Luna Norte', type: 'music', category: 'Indie', royaltyRate: 0.01, playedAt: new Date().toISOString() };
  bus.emit(EVENTS.PLAYED, play); bus.emit(EVENTS.PLAYED, play);
  equal(historyService.getHistory().length, 1); equal(royaltyService.getRoyalties().records.length, 1); equal(storage.get('preferences')['user-1'].total, 1); gateway.dispose();
});
test('El catálogo expone reproducciones derivadas del historial', () => {
  const { gateway } = fixture(); loginUser(gateway); equal(gateway.getContentById('music-1').reproductions, 0); gateway.playContent('music-1'); gateway.pause(); equal(gateway.getContentById('music-1').reproductions, 1); equal(gateway.getCatalog().find(item => item.id === 'music-1').reproductions, 1); gateway.dispose();
});
test('Pausar, reanudar y buscar posición no duplican reproducciones', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.pause(); gateway.resume(); gateway.seek(40); gateway.pause(); equal(gateway.getHistory().length, 1); equal(gateway.getPlayerState().position, 40); gateway.dispose();
});
test('Siguiente y anterior respetan la cola', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.next(); equal(gateway.getPlayerState().contentId, 'music-1'); gateway.playContent('music-1', ['music-1', 'music-2', 'music-3']); gateway.next(); equal(gateway.getPlayerState().contentId, 'music-2'); gateway.previous(); equal(gateway.getPlayerState().contentId, 'music-1'); equal(gateway.getHistory().length, 4); gateway.dispose();
});
test('El progreso avanza con el temporizador', async () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); await new Promise(resolve => setTimeout(resolve, 1200)); gateway.pause(); assert(gateway.getPlayerState().position >= 1); gateway.dispose();
});
test('Finalizar y volver a reproducir genera una nueva escucha', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.seek(218); equal(gateway.getPlayerState().status, 'ended'); gateway.resume(); equal(gateway.getHistory().length, 2); equal(gateway.getPlayerState().position, 0); gateway.dispose();
});
test('Buscar una posición limita el progreso al rango del contenido', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.seek(-20); equal(gateway.getPlayerState().position, 0); gateway.seek(99999); equal(gateway.getPlayerState().position, 218); throws(() => gateway.seek('no es un número')); gateway.dispose();
});
test('Recargar restaura contenido y progreso pausados sin registrar otra escucha', () => {
  const { gateway, storage } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.seek(35); gateway.dispose();
  const reloaded = createApiGateway(storage); equal(reloaded.getPlayerState().position, 35); equal(reloaded.getPlayerState().status, 'paused'); reloaded.resume(); reloaded.pause(); equal(reloaded.getHistory().length, 1); reloaded.dispose();
});
test('El reproductor se restaura por usuario al volver a iniciar sesión', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.seek(25); gateway.logout(); loginAdmin(gateway); gateway.logout(); loginUser(gateway); equal(gateway.getPlayerState().position, 25); equal(gateway.getPlayerState().contentId, 'music-1'); gateway.dispose();
});
test('Historial aislado por usuario y visible globalmente para ADMIN', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.pause(); gateway.logout(); gateway.login('valentina@spotify.local', 'user123'); equal(gateway.getHistory().length, 0); gateway.playContent('podcast-1'); gateway.pause(); equal(gateway.getHistory().length, 1); gateway.logout(); loginAdmin(gateway); equal(gateway.getHistory().length, 2); gateway.dispose();
});
test('Historial está ordenado de más reciente a más antiguo', () => {
  const { gateway, storage } = fixture(); loginUser(gateway);
  storage.set('plays', [{ id: 'a', userId: 'user-1', playedAt: '2026-01-01T00:00:00.000Z' }, { id: 'b', userId: 'user-1', playedAt: '2026-02-01T00:00:00.000Z' }, { id: 'c', userId: 'user-1', playedAt: '2026-02-01T00:00:00.000Z' }]); equal(gateway.getHistory().map(item => item.id), ['c', 'b', 'a']); gateway.dispose();
});
test('Las recomendaciones tienen score y explicación en arranque frío', () => {
  const { gateway } = fixture(); loginUser(gateway); const list = gateway.getRecommendations(); equal(list.length, 8); assert(list.every(item => Number.isFinite(item.score) && item.reason)); assert(list[0].score >= list.at(-1).score); gateway.dispose();
});
test('Escuchar un nuevo género cambia las recomendaciones', () => {
  const { gateway } = fixture(); loginUser(gateway); const before = gateway.getRecommendations(100).find(item => item.id === 'music-6').score;
  gateway.playContent('music-5'); gateway.pause(); const after = gateway.getRecommendations(100).find(item => item.id === 'music-6').score; assert(after > before); equal(gateway.getRecommendations()[0].creator, 'Los Días'); gateway.dispose();
});
test('Las preferencias persisten y penalizan repetición frecuente', () => {
  const { gateway, storage } = fixture(); loginUser(gateway); gateway.playContent('music-5'); gateway.pause(); const first = gateway.getRecommendations(100).find(item => item.id === 'music-5').score;
  gateway.playContent('music-5'); gateway.playContent('music-5'); gateway.pause(); const third = gateway.getRecommendations(100).find(item => item.id === 'music-5').score; equal(third, first - 1); equal(storage.get('preferences')['user-1'].total, 3); gateway.dispose();
});
test('Recomendaciones excluyen contenido deshabilitado', () => {
  const { gateway } = fixture(); loginAdmin(gateway); gateway.setContentEnabled('music-1', false); gateway.logout(); loginUser(gateway); assert(!gateway.getRecommendations(100).some(item => item.id === 'music-1')); gateway.dispose();
});
test('Una canción genera exactamente su tarifa ficticia', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.pause(); gateway.resume(); gateway.pause(); gateway.logout(); loginAdmin(gateway); equal(gateway.getRoyalties().records.length, 1); equal(gateway.getRoyalties().totalUnits, 0.01 * MONEY_SCALE); gateway.dispose();
});
test('Podcasts y audiolibros no generan regalías en este modelo', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('podcast-1'); gateway.playContent('audiobook-1'); gateway.pause(); gateway.logout(); loginAdmin(gateway); equal(gateway.getRoyalties().totalUnits, 0); equal(gateway.getHistory().length, 2); gateway.dispose();
});
test('Regalías conservan la tarifa histórica tras editarla', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.pause(); gateway.logout(); loginAdmin(gateway); gateway.saveContent({ royaltyRate: 0.02 }, 'music-1'); gateway.logout(); loginUser(gateway); gateway.playContent('music-1'); gateway.pause(); gateway.logout(); loginAdmin(gateway); equal(gateway.getRoyalties().totalUnits, 30000); equal(gateway.getRoyalties().contents[0].rates, [10000, 20000]); gateway.dispose();
});
test('Métricas derivadas coinciden con historial y regalías', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.playContent('music-1'); gateway.playContent('podcast-1'); gateway.pause(); gateway.logout(); loginAdmin(gateway); const metrics = gateway.getDashboardMetrics(); equal(metrics.totalPlays, 3); equal(metrics.uniqueContents, 2); equal(metrics.topContents[0].count, 2); equal(metrics.totalRoyaltyUnits, 20000); equal(metrics.byType.reduce((sum, item) => sum + item.count, 0), 3); gateway.dispose();
});
test('Datos iniciales de popularidad no se cuentan como reproducciones', () => {
  const { gateway } = fixture(); loginAdmin(gateway); equal(gateway.getDashboardMetrics().totalPlays, 0); equal(gateway.getDashboardMetrics().totalRoyaltyUnits, 0); gateway.dispose();
});
test('Storage devuelve copias y soporta eliminar claves', () => {
  const { storage } = fixture(); storage.set('test', { a: 1 }); const value = storage.get('test'); value.a = 2; equal(storage.get('test').a, 1); storage.remove('test'); equal(storage.get('test'), null);
});
test('Storage informa errores de permisos, cuota y JSON corrupto', () => {
  const blocked = new StorageService({ getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('lleno'); } }); throws(() => blocked.get('test'), 'leer'); throws(() => blocked.set('test', []), 'guardar'); const corrupt = new StorageService({ getItem: () => '{no-json' }); throws(() => corrupt.get('test'), 'leer');
});
test('Formatos de duración, dinero y escape HTML', () => {
  equal(duration(218), '3:38'); equal(duration(3601), '1:00:01'); equal(duration(-1), '0:00'); assert(money(10000).includes('USD ficticios')); equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
});

function mount(gateway, page, query = '') {
  history.replaceState(null, '', location.pathname + query);
  renderShell(gateway.getSession(), page);
}
test('UI: login muestra credenciales y permite autocompletar la cuenta demo', () => {
  const { gateway } = fixture(); initializeLogin(gateway); document.querySelector('[data-demo="admin"]').click(); equal(document.querySelector('#email').value, 'admin@spotify.local'); equal(document.querySelector('#password').value, 'admin123'); gateway.dispose();
});
test('UI: dashboard de usuario muestra recomendaciones y categorías', () => {
  const { gateway } = fixture(); loginUser(gateway); mount(gateway, 'dashboard'); const off = initializeDashboard(gateway); assert(document.querySelectorAll('.content-card').length === 12); equal(document.querySelectorAll('.category-tile').length, 3); off(); gateway.dispose();
});
test('UI: catálogo combina chips, búsqueda y estados vacíos', () => {
  const { gateway } = fixture(); loginUser(gateway); mount(gateway, 'catalog'); const off = initializeCatalog(gateway); equal(document.querySelectorAll('.content-card').length, 28); document.querySelector('[data-type="podcast"]').click(); equal(document.querySelectorAll('.content-card').length, 5); const input = document.querySelector('#catalog-search'); input.value = 'no existe'; input.dispatchEvent(new Event('input')); equal(document.querySelectorAll('.content-card').length, 0); assert(document.querySelector('.empty-state')); off(); gateway.dispose();
});
test('UI: reproductor cambia play/pause sin duplicar el historial', () => {
  const { gateway } = fixture(); loginUser(gateway); mount(gateway, 'dashboard'); const off = initializePlayer(gateway); gateway.playContent('music-1'); equal(document.querySelector('[data-player="toggle"]').getAttribute('aria-label'), 'Pausar'); document.querySelector('[data-player="toggle"]').click(); equal(gateway.getPlayerState().status, 'paused'); document.querySelector('[data-player="toggle"]').click(); gateway.pause(); equal(gateway.getHistory().length, 1); off(); gateway.dispose();
});
test('UI: historial y perfil muestran estadísticas personales', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.pause(); mount(gateway, 'history'); const off = initializeHistory(gateway); equal(document.querySelectorAll('tbody tr').length, 1); off(); mount(gateway, 'profile'); const offProfile = initializeProfile(gateway); assert(document.querySelector('#main-content').textContent.includes('Indie')); offProfile(); gateway.dispose();
});
test('UI: ADMIN puede crear contenido mediante el formulario modal', () => {
  const { gateway } = fixture(); loginAdmin(gateway); mount(gateway, 'admin', '?section=content'); const off = initializeAdmin(gateway); document.querySelector('[data-add]').click(); const form = document.querySelector('#content-form'); for (const [key, value] of Object.entries(newSong)) { if (form.elements[key] && key !== 'enabled') form.elements[key].value = value; } form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); equal(gateway.getCatalog().length, 29); equal(document.querySelectorAll('#admin-content-list tbody tr').length, 29); assert(!document.querySelector('dialog[open]')); off(); gateway.dispose();
});
test('UI: ADMIN puede editar y deshabilitar contenido', () => {
  const { gateway } = fixture(); loginAdmin(gateway); mount(gateway, 'admin', '?section=content'); const off = initializeAdmin(gateway); document.querySelector('[data-edit="music-1"]').click(); const form = document.querySelector('#content-form'); form.elements.title.value = 'Nuevo título UI'; form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); equal(gateway.getContentById('music-1').title, 'Nuevo título UI'); document.querySelector('[data-toggle="music-1"]').click(); equal(gateway.getContentById('music-1').enabled, false); off(); gateway.dispose();
});
test('UI: todas las vistas ADMIN se renderizan sin excepciones', () => {
  const { gateway } = fixture(); loginUser(gateway); gateway.playContent('music-1'); gateway.pause(); gateway.logout(); loginAdmin(gateway);
  for (const view of ['dashboard', 'users', 'plays', 'royalties', 'metrics']) { mount(gateway, 'admin', `?section=${view}`); const off = initializeAdmin(gateway); assert(document.querySelector('h1')); assert(document.querySelector('#main-content').textContent.length > 100); off(); } gateway.dispose();
});

let passed = 0;
const resultList = document.getElementById('results');
for (const { name, run } of tests) {
  const row = document.createElement('li');
  try { await run(); passed++; row.className = 'pass'; row.textContent = `✓ ${name}`; }
  catch (error) { row.className = 'fail'; row.textContent = `✗ ${name}: ${error.message}`; console.error(name, error); }
  document.querySelectorAll('dialog').forEach(dialog => { dialog.close(); dialog.remove(); });
  resultList.append(row);
}
history.replaceState(null, '', location.pathname);
document.getElementById('fixture').replaceChildren();
const summary = document.getElementById('summary');
summary.textContent = `${passed}/${tests.length} pruebas correctas. ${tests.length - passed} fallos.`;
summary.className = passed === tests.length ? 'pass' : 'fail';
document.body.dataset.testStatus = passed === tests.length ? 'passed' : 'failed';
document.body.dataset.testCount = String(tests.length);
