const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  music: '<path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
  podcast: '<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  book: '<path d="M12 5C9 2 4 2 2 3v16c3-1 7-1 10 2 3-3 7-3 10-2V3c-2-1-7-1-10 2Zm0 0v16"/>',
  spark: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
  history: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6m3-4v6l4 2"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
  users: '<circle cx="9" cy="7" r="4"/><path d="M2 22v-2a7 7 0 0 1 14 0v2m1-19a4 4 0 0 1 0 8m2 4a6 6 0 0 1 3 5v2"/>',
  logout: '<path d="M9 3H4v18h5m5-14 5 5-5 5m-7-5h12"/>',
  chart: '<path d="M3 3v18h18M7 17v-4m5 4V9m5 8V5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  wallet: '<path d="M20 7V4H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h17V7H4m17 5h-5v5h5"/>',
  play: '<path d="m8 4 13 8-13 8Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="currentColor" stroke="none"/>',
  next: '<path d="m4 5 11 7L4 19Z" fill="currentColor" stroke="none"/><path d="M19 5v14"/>',
  previous: '<path d="m20 5-11 7 11 7Z" fill="currentColor" stroke="none"/><path d="M5 5v14"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  close: '<path d="m5 5 14 14M5 19 19 5"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10v1"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
};

export function icon(name, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.music}</svg>`;
}
