import { roundToQuarter } from './hours';

export function isValidTimeString(value: unknown): value is string {
  return /^\d{2}:\d{2}$/.test(String(value || ''));
}

export function timeToMinutes(value: string): number | null {
  if (!isValidTimeString(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.round(minutes));
  const hours = Math.floor(clamped / 60) % 24;
  const mins = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Unpaid break entitlement based on gross shift length, per the shop's
 * break policy: 15min for 4-4h59, 30min for 5-6h59, 60min for 7h+.
 */
export function calcBreakMinutes(grossHours: number): number {
  if (grossHours >= 7) return 60;
  if (grossHours >= 5) return 30;
  if (grossHours >= 4) return 15;
  return 0;
}

export function calcNetHours(start: string, end: string): number {
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (startMin === null || endMin === null || endMin <= startMin) return 0;
  const grossHours = (endMin - startMin) / 60;
  const breakMinutes = calcBreakMinutes(grossHours);
  return roundToQuarter(Math.max(0, grossHours - breakMinutes / 60));
}
