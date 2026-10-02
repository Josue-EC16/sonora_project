import { EVENTS } from '../utils/constants.js';
import { pageHeading, historyTable, eventTrace } from '../ui/renderer.js';
import { number } from '../utils/formatters.js';

export function initializeHistory(gateway) {
  const container = document.getElementById('main-content');
  const render = () => {
    const plays = gateway.getHistory();
    container.innerHTML = `${pageHeading('Tu actividad', 'Cada escucha, una historia.', `${number(plays.length)} reproducciones registradas · Más recientes primero`)}${historyTable(plays, { availableIds: gateway.getCatalog().map(item => item.id) })}${eventTrace(plays[0])}`;
  };
  render();
  return gateway.subscribe(EVENTS.DATA, render);
}
