export function authGuard(gateway) {
  if (gateway.getSession()) return true;
  window.location.replace('login.html');
  return false;
}
