import { icon } from './icons.js';

export function openModal(title, body) {
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'modal-title');
  dialog.innerHTML = `<div class="modal-header"><h2 id="modal-title"></h2><button class="icon-button" type="button" data-close aria-label="Cerrar ventana">${icon('close')}</button></div>${body}`;
  dialog.querySelector('h2').textContent = title;
  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-close]')) dialog.close();
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => { dialog.remove(); previousFocus?.focus(); }, { once: true });
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}
