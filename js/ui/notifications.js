export function notify(message, isError = false) {
  const container = document.getElementById('notifications');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' error' : ''}`;
  toast.textContent = message;
  container.append(toast);
  setTimeout(() => toast.remove(), isError ? 6500 : 4000);
}
