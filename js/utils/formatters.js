import { MONEY_SCALE } from './constants.js';

export function duration(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` : `${minutes}:${String(total % 60).padStart(2, '0')}`;
}

export const number = value => new Intl.NumberFormat('es').format(value ?? 0);
export const money = units => `${new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format((units ?? 0) / MONEY_SCALE)} USD`;
export const dateTime = value => new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
