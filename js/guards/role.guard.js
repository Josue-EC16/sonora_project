export function roleGuard(gateway, role) {
  const user = gateway.getSession();
  if (user?.role === role) return true;
  window.location.replace(user ? (user.role === 'ADMIN' ? 'admin.html' : 'dashboard.html') : 'login.html');
  return false;
}
