import { DAYS, STORAGE_KEY } from './constants';
import { formatDateInput, isValidDateString, nextMonday } from './utils/date';
import { createId } from './utils/id';
import { isValidTimeString } from './utils/time';
import type {
  DayHours,
  DayId,
  DayShift,
  Employee,
  OpeningHours,
  RosterEntry,
  RosterState,
  SchedulePriority,
  Settings,
  Week,
  WeekRecord,
} from './types';

function isValidDay(dayId: unknown): dayId is DayId {
  return DAYS.some((day) => day.id === dayId);
}

function normalizePriority(value: unknown): SchedulePriority {
  return value === 'open' || value === 'close' ? value : 'none';
}

export function defaultOpeningHours(): OpeningHours {
  return DAYS.reduce((acc, day) => {
    const isSunday = day.id === 'sun';
    acc[day.id] = { closed: isSunday, open: '09:00', close: isSunday ? '09:00' : '17:30' };
    return acc;
  }, {} as OpeningHours);
}

function normalizeDayHours(entry: Partial<DayHours> | undefined, fallback: DayHours): DayHours {
  return {
    closed: Boolean(entry?.closed),
    open: isValidTimeString(entry?.open) ? (entry!.open as string) : fallback.open,
    close: isValidTimeString(entry?.close) ? (entry!.close as string) : fallback.close,
  };
}

export function normalizeSettings(settings: Partial<Settings> | undefined): Settings {
  const sourceHours = settings?.openingHours ?? ({} as Partial<OpeningHours>);
  const defaults = defaultOpeningHours();
  const openingHours = DAYS.reduce((acc, day) => {
    acc[day.id] = normalizeDayHours(sourceHours[day.id], defaults[day.id]);
    return acc;
  }, {} as OpeningHours);
  return { openingHours };
}

export function normalizeEmployee(employee: Partial<Employee>): Employee {
  return {
    id: employee.id || createId('emp'),
    name: String(employee.name || '').trim(),
    weeklyHours: Number(employee.weeklyHours) || 0,
    daysOff: Array.isArray(employee.daysOff) ? employee.daysOff.filter(isValidDay) : [],
    priority: normalizePriority(employee.priority),
  };
}

function normalizeDayShift(value: Partial<DayShift> | undefined): DayShift {
  return {
    start: isValidTimeString(value?.start) ? (value!.start as string) : '',
    end: isValidTimeString(value?.end) ? (value!.end as string) : '',
  };
}

export function createRosterEntry(): RosterEntry {
  return {
    cleared: false,
    days: DAYS.reduce((days, day) => {
      days[day.id] = { start: '', end: '' };
      return days;
    }, {} as RosterEntry['days']),
  };
}

function normalizeRosterEntry(entry: Partial<RosterEntry> | undefined): RosterEntry {
  const days = DAYS.reduce((acc, day) => {
    acc[day.id] = normalizeDayShift(entry?.days?.[day.id]);
    return acc;
  }, {} as RosterEntry['days']);

  if (!entry?.previousDays) return { cleared: Boolean(entry?.cleared), days };

  const previousDays = DAYS.reduce((acc, day) => {
    acc[day.id] = normalizeDayShift(entry.previousDays?.[day.id]);
    return acc;
  }, {} as RosterEntry['days']);
  return { cleared: Boolean(entry?.cleared), days, previousDays };
}

export function createWeekRecord(): WeekRecord {
  return { roster: {}, saved: false, savedEmployees: [] };
}

function normalizeWeekRecord(record: Partial<WeekRecord> | undefined): WeekRecord {
  const sourceRoster = record?.roster && typeof record.roster === 'object' ? record.roster : {};
  const roster = Object.keys(sourceRoster).reduce((acc, employeeId) => {
    acc[employeeId] = normalizeRosterEntry(sourceRoster[employeeId]);
    return acc;
  }, {} as WeekRecord['roster']);

  return {
    roster,
    saved: Boolean(record?.saved),
    savedEmployees: Array.isArray(record?.savedEmployees) ? record.savedEmployees.map(normalizeEmployee) : [],
  };
}

function normalizeWeek(week: Partial<Week>): Week {
  return {
    id: week.id || createId('week'),
    startDate: isValidDateString(week.startDate) ? (week.startDate as string) : formatDateInput(nextMonday(new Date())),
  };
}

export function createWeek(startDate: string): Week {
  return { id: createId('week'), startDate };
}

function ensureOneWeek(state: RosterState): RosterState {
  if (!state.weeks.length) {
    state.weeks.push(createWeek(formatDateInput(nextMonday(new Date()))));
  }
  return state;
}

export function createInitialState(): RosterState {
  return ensureOneWeek({ employees: [], weeks: [], weekRecords: {}, settings: normalizeSettings(undefined) });
}

export function loadState(): RosterState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || !Array.isArray(saved.employees) || !Array.isArray(saved.weeks)) {
      return createInitialState();
    }

    const weeks: Week[] = saved.weeks.map(normalizeWeek);

    const sourceRecords = saved.weekRecords && typeof saved.weekRecords === 'object' ? saved.weekRecords : {};
    const weekRecords: Record<string, WeekRecord> = Object.keys(sourceRecords).reduce((acc, startDate) => {
      acc[startDate] = normalizeWeekRecord(sourceRecords[startDate]);
      return acc;
    }, {} as Record<string, WeekRecord>);

    // Older saves kept the roster/saved fields directly on each week entry
    // instead of a separate date-keyed store; fold any of those in without
    // overwriting a record that already exists under the new format.
    saved.weeks.forEach((rawWeek: Partial<Week> & Partial<WeekRecord>, index: number) => {
      if (!rawWeek.roster && rawWeek.saved === undefined) return;
      const startDate = weeks[index]?.startDate;
      if (!startDate || weekRecords[startDate]) return;
      weekRecords[startDate] = normalizeWeekRecord(rawWeek);
    });

    const loaded: RosterState = {
      employees: saved.employees.map(normalizeEmployee),
      weeks,
      weekRecords,
      settings: normalizeSettings(saved.settings),
    };
    return ensureOneWeek(loaded);
  } catch {
    return createInitialState();
  }
}

export function saveState(state: RosterState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
