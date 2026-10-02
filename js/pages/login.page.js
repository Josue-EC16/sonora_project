import { icon } from '../ui/icons.js';

export function initializeLogin(gateway) {
  document.getElementById('app').innerHTML = `<div class="login-page"><section class="login-story"><a class="brand" href="login.html"><img src="assets/icons/brand.svg" alt="">Sonora</a><div class="login-story-content"><p class="eyebrow">Todo lo que te mueve</p><h1>Tu mundo.<br>Tu ritmo.<br><span>Tu próxima escucha.</span></h1><p>Música, conversaciones e historias. Un solo lugar para descubrir lo que conecta contigo.</p><div class="login-tags"><span class="badge">Música</span><span class="badge">Podcasts</span><span class="badge">Audiolibros</span></div></div><div class="login-orbits" aria-hidden="true"></div><footer class="login-story-footer">SPOTIFY</footer></section><section class="login-form-side"><div class="login-box"><p class="eyebrow">Bienvenido a Sonora</p><h2>Entra en tu espacio.</h2><p class="subtitle">Tus próximas historias están a un clic.</p><form id="login-form"><div class="form-field"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" placeholder="tu@spotify.local" autocomplete="username" required maxlength="120"></div><div class="form-field"><label for="password">Contraseña</label><input id="password" name="password" type="password" placeholder="Tu contraseña de demostración" autocomplete="current-password" required></div><p id="login-error" class="form-error" role="alert"></p><button class="btn btn-primary" type="submit">Iniciar sesión ${icon('arrow')}</button></form><div class="demo-accounts"><h3>Prueba una cuenta de demostración</h3><div class="demo-account"><div><strong>Usuario · Marcelo</strong><span>user@spotify.local · user123</span></div><button class="btn btn-small" type="button" data-demo="user">Usar</button></div><div class="demo-account"><div><strong>Administrador · Alex</strong><span>admin@spotify.local · admin123</span></div><button class="btn btn-small" type="button" data-demo="admin">Usar</button></div></div><p class="login-disclaimer">Autenticación</p></div></section></div>`;
  const form = document.getElementById('login-form');
  document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => {
    const admin = button.dataset.demo === 'admin';
    form.elements.email.value = admin ? 'admin@spotify.local' : 'user@spotify.local';
    form.elements.password.value = admin ? 'admin123' : 'user123';
    form.querySelector('[type="submit"]').focus();
  }));
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const user = gateway.login(form.elements.email.value, form.elements.password.value);
      location.replace(user.role === 'ADMIN' ? 'admin.html' : 'dashboard.html');
    } catch (error) { document.getElementById('login-error').textContent = error.message; }
  });
}
