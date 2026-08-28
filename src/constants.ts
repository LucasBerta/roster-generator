import type { DayDefinition } from './types';

export const STORAGE_KEY = 'roster-generator-state-v1';

export const DAYS: DayDefinition[] = [
  { id: 'mon', short: 'Mon', label: 'Monday' },
  { id: 'tue', short: 'Tue', label: 'Tuesday' },
  { id: 'wed', short: 'Wed', label: 'Wednesday' },
  { id: 'thu', short: 'Thu', label: 'Thursday' },
  { id: 'fri', short: 'Fri', label: 'Friday' },
  { id: 'sat', short: 'Sat', label: 'Saturday' },
  { id: 'sun', short: 'Sun', label: 'Sunday' },
];
