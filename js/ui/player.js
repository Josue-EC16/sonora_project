import { EVENTS, TYPE_LABELS } from '../utils/constants.js';
import { duration } from '../utils/formatters.js';
import { escapeHtml as e } from '../utils/helpers.js';
import { icon } from './icons.js';
import { notify } from './notifications.js';

export function initializePlayer(gateway) {
  const container = document.getElementById('player');
  if (!container) return () => {};
  container.innerHTML = `<div class="player-track" id="player-track"></div><div><div class="player-controls"><button class="icon-button" type="button" data-player="previous" aria-label="Contenido anterior">${icon('previous')}</button><button class="player-toggle" type="button" data-player="toggle" aria-label="Reproducir">${icon('play')}</button><button class="icon-button" type="button" data-player="next" aria-label="Contenido siguiente">${icon('next')}</button></div><div class="player-progress"><time id="player-elapsed">0:00</time><input id="player-seek" type="range" min="0" max="1" value="0" step="1" aria-label="Progreso de reproducción"><time id="player-duration">0:00</time></div></div><div class="player-status"><span class="status-dot"></span><span id="player-status">Simulación · Sin audio real</span></div>`;
  let previousId;
  const render = state => {
    const content = state.content;
    if (previousId !== content?.id) {
      container.querySelector('#player-track').innerHTML = content ? `<img src="${e(content.cover)}" alt=""><div class="player-track-text"><strong>${e(content.title)}</strong><small>${e(content.creator)} · ${TYPE_LABELS[content.type]}</small></div>` : `<div class="player-track-text"><strong>¿Qué quieres escuchar?</strong><small>Elige algo de tu catálogo</small></div>`;
      previousId = content?.id;
    }
    // Populate the initial empty state even when both ids are undefined.
    if (!container.querySelector('#player-track').children.length) container.querySelector('#player-track').innerHTML = '<div class="player-track-text"><strong>¿Qué quieres escuchar?</strong><small>Elige algo de tu catálogo</small></div>';
    const playing = state.status === 'playing';
    const toggle = container.querySelector('[data-player="toggle"]');
    toggle.innerHTML = icon(playing ? 'pause' : 'play');
    toggle.setAttribute('aria-label', playing ? 'Pausar' : (state.status === 'ended' ? 'Volver a reproducir' : 'Reproducir'));
    toggle.disabled = !content;
    const hasCatalog = gateway.getCatalog().length > 0;
    container.querySelectorAll('[data-player="previous"], [data-player="next"]').forEach(button => { button.disabled = !hasCatalog; });
    const seek = container.querySelector('#player-seek');
    seek.max = content?.duration ?? 1;
    seek.value = state.position;
    seek.disabled = !content;
    seek.setAttribute('aria-valuetext', `${duration(state.position)} de ${duration(content?.duration)}`);
    container.querySelector('#player-elapsed').textContent = duration(state.position);
    container.querySelector('#player-duration').textContent = duration(content?.duration);
    container.querySelector('.status-dot').classList.toggle('playing', playing);
    container.querySelector('#player-status').textContent = `${playing ? 'Reproduciendo' : state.status === 'ended' ? 'Finalizado' : 'En pausa'} · Simulación sin audio`;
  };
  render(gateway.getPlayerState());
  const off = gateway.subscribe(EVENTS.PLAYER, render);
  container.addEventListener('click', event => {
    const button = event.target.closest('[data-player]');
    if (!button) return;
    try {
      if (button.dataset.player === 'toggle') {
        gateway.getPlayerState().status === 'playing' ? gateway.pause() : gateway.resume();
      } else gateway[button.dataset.player]();
    } catch (error) { notify(error.message, true); }
  });
  container.querySelector('#player-seek').addEventListener('input', event => {
    try { gateway.seek(event.target.value); } catch (error) { notify(error.message, true); }
  });
  return off;
}
