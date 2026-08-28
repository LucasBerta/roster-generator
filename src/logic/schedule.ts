import { DAYS } from '../constants';
import { calcNetHours, minutesToTime, timeToMinutes } from '../utils/time';
import type { DayHours, DayId, Employee, OpeningHours, RosterEntry } from '../types';

export function isDayClosed(openingHours: OpeningHours, dayId: DayId): boolean {
  const hours = openingHours[dayId];
  return !hours || hours.closed;
}

function emptyDays(): RosterEntry['days'] {
  return DAYS.reduce((days, day) => {
    days[day.id] = { start: '', end: '' };
    return days;
  }, {} as RosterEntry['days']);
}

interface ShiftStep {
  /** Clock-in to clock-out span, in hours. */
  gross: number;
  /** Paid hours once the shift's unpaid break is deducted. */
  net: number;
}

/**
 * The only shift lengths the shop schedules, shortest first. 6.5h and 7h
 * both net 6 paid hours, so the shorter 6.5h shift is used instead of 7h
 * (same pay, less time on the floor) — 7h is left out entirely.
 */
const SHIFT_STEPS: ShiftStep[] = [
  { gross: 4, net: 3.75 },
  { gross: 5, net: 4.5 },
  { gross: 6, net: 5.5 },
  { gross: 6.5, net: 6 },
  { gross: 7.5, net: 6.5 },
  { gross: 8, net: 7 },
  { gross: 8.5, net: 7.5 },
];

/** 9h+ shifts, used only once every day is already at its longest regular option and more hours are still needed. */
const LAST_RESORT_STEPS: ShiftStep[] = [
  { gross: 9, net: 8 },
  { gross: 9.5, net: 8.5 },
  { gross: 10, net: 9 },
];

function windowGrossHours(hours: DayHours): number {
  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);
  if (openMin === null || closeMin === null || closeMin <= openMin) return 0;
  return (closeMin - openMin) / 60;
}

interface DayAssignment {
  dayId: DayId;
  steps: ShiftStep[];
  /** Number of entries at the start of `steps` that are regular (non-last-resort) options. */
  regularCount: number;
  /** Index into `steps` of the currently chosen shift length. */
  index: number;
}

/** Shift lengths that fit within a day's opening window, shortest first, with any 9h+ last resorts appended only if they fit. */
function stepsForWindow(windowHours: number): { steps: ShiftStep[]; regularCount: number } {
  const regular = SHIFT_STEPS.filter((step) => step.gross <= windowHours + 1e-9);
  const lastResort = LAST_RESORT_STEPS.filter((step) => step.gross <= windowHours + 1e-9);
  return { steps: [...regular, ...lastResort], regularCount: regular.length };
}

/** The highest step index that isn't a 9h+ last resort, if any regular option is present. */
function maxRegularIndex(day: DayAssignment): number {
  return day.regularCount - 1;
}

/**
 * Each employee's per-day GROSS shift length, chosen only from the shop's
 * fixed shift-length options, aiming for their weekly (net, paid) hours
 * target. Every work day starts at the shortest option (4h); hours are then
 * added a step at a time, round-robin across the days, until the target is
 * met — reaching for the 9h/9.5h/10h last-resort options only once every day
 * is already at its longest regular option and more hours are still needed. If
 * even the shortest shift on every work day would already overshoot the
 * target, the employee is scheduled on fewer of those days instead.
 */
function computeDailyGrossAssignment(employee: Employee, openingHours: OpeningHours): Partial<Record<DayId, number>> {
  const weeklyHours = Number(employee.weeklyHours) || 0;
  const workDayIds = DAYS.filter((day) => !employee.daysOff.includes(day.id) && !isDayClosed(openingHours, day.id)).map(
    (day) => day.id,
  );
  if (weeklyHours <= 0 || workDayIds.length === 0) return {};

  const days: DayAssignment[] = workDayIds
    .map((dayId): DayAssignment | null => {
      const { steps, regularCount } = stepsForWindow(windowGrossHours(openingHours[dayId]!));
      return steps.length > 0 ? { dayId, steps, regularCount, index: 0 } : null;
    })
    .filter((day): day is DayAssignment => day !== null);

  if (days.length === 0) return {};

  // If even the shortest shift on every available day already overshoots
  // the weekly target, work fewer days instead of forcing a shift everywhere.
  while (days.length > 1 && days.reduce((sum, day) => sum + day.steps[0].net, 0) > weeklyHours) {
    days.pop();
  }

  let total = days.reduce((sum, day) => sum + day.steps[0].net, 0);
  const TARGET_EPSILON = 1e-9;

  const bumpRound = (canBump: (day: DayAssignment) => boolean) => {
    let progressed = true;
    while (total < weeklyHours - TARGET_EPSILON && progressed) {
      progressed = false;
      for (const day of days) {
        if (total >= weeklyHours - TARGET_EPSILON) break;
        if (canBump(day)) {
          total += day.steps[day.index + 1].net - day.steps[day.index].net;
          day.index += 1;
          progressed = true;
        }
      }
    }
  };

  bumpRound((day) => day.index < maxRegularIndex(day));
  bumpRound((day) => day.index < day.steps.length - 1);

  const result: Partial<Record<DayId, number>> = {};
  days.forEach((day) => {
    result[day.dayId] = day.steps[day.index].gross;
  });
  return result;
}

/**
 * Computes a fresh roster for a week from each employee's weekly hours and
 * days off, honoring shop opening hours. Employees whose existing entry is
 * `cleared` are left untouched (e.g. on holiday). Does not mutate any input.
 *
 * For each day, shifts are positioned to try to satisfy the "at least 2
 * people opening, at least 2 closing" staffing rule. Employees with an
 * `open` or `close` priority always get that role; everyone else is
 * alternated (longest shifts first, since they're most likely to span the
 * whole day and count as both an opener and a closer) to fill in whichever
 * role still needs more people.
 */
export function generateWeekRoster(
  employees: Employee[],
  existingRoster: Record<string, RosterEntry>,
  openingHours: OpeningHours,
): Record<string, RosterEntry> {
  const roster: Record<string, RosterEntry> = {};
  const activeEmployees: Employee[] = [];

  employees.forEach((employee) => {
    const existing = existingRoster[employee.id];
    if (existing?.cleared) {
      roster[employee.id] = existing;
      return;
    }
    activeEmployees.push(employee);
    roster[employee.id] = { cleared: false, days: emptyDays() };
  });

  const dailyGrossAssignments = new Map(
    activeEmployees.map((employee) => [employee.id, computeDailyGrossAssignment(employee, openingHours)]),
  );

  DAYS.forEach((day) => {
    const hours = openingHours[day.id];
    if (!hours || hours.closed) return;

    const openMin = timeToMinutes(hours.open);
    const closeMin = timeToMinutes(hours.close);
    if (openMin === null || closeMin === null || closeMin <= openMin) return;

    const participants = activeEmployees
      .map((employee) => ({ employee, gross: dailyGrossAssignments.get(employee.id)?.[day.id] || 0 }))
      .filter((participant) => participant.gross > 0);

    // Employees with an open/close priority always get that role. Everyone
    // else is alternated (longest shifts first) to fill in whichever role
    // still needs more people, so the 2-opener/2-closer goal is met around
    // the fixed preferences rather than despite them.
    const priorityOpeners = participants.filter((participant) => participant.employee.priority === 'open');
    const priorityClosers = participants.filter((participant) => participant.employee.priority === 'close');
    const flexible = participants
      .filter((participant) => participant.employee.priority !== 'open' && participant.employee.priority !== 'close')
      .sort((a, b) => b.gross - a.gross);

    let openCount = priorityOpeners.length;
    let closeCount = priorityClosers.length;
    const opensShopById = new Map<string, boolean>();
    priorityOpeners.forEach((participant) => opensShopById.set(participant.employee.id, true));
    priorityClosers.forEach((participant) => opensShopById.set(participant.employee.id, false));

    flexible.forEach((participant, index) => {
      let opensShop: boolean;
      if (openCount < closeCount) opensShop = true;
      else if (closeCount < openCount) opensShop = false;
      else opensShop = index % 2 === 0;
      if (opensShop) openCount += 1;
      else closeCount += 1;
      opensShopById.set(participant.employee.id, opensShop);
    });

    participants.forEach((participant) => {
      const grossMinutes = Math.min(Math.round(participant.gross * 60), closeMin - openMin);
      const opensShop = opensShopById.get(participant.employee.id) ?? true;
      const startMin = opensShop ? openMin : closeMin - grossMinutes;
      const endMin = startMin + grossMinutes;
      roster[participant.employee.id].days[day.id] = { start: minutesToTime(startMin), end: minutesToTime(endMin) };
    });
  });

  return roster;
}

const MIN_STAFF_PER_DAY = 3;
const MIN_OPENERS = 2;
const MIN_CLOSERS = 2;

/**
 * Staffing coverage for one day: at least 3 people working, at least 2
 * arriving at or before opening time, and at least 2 staying until at least
 * closing time. Uses >=/<= rather than an exact match, since someone who
 * stays later than closing (or arrives earlier than opening) is still
 * covering that end of the day, not missing it.
 */
export function checkDayCoverage(
  dayId: DayId,
  employees: Employee[],
  roster: Record<string, RosterEntry>,
  openingHours: OpeningHours,
): boolean {
  const hours = openingHours[dayId];
  if (!hours || hours.closed) return true;

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);

  let working = 0;
  let opening = 0;
  let closing = 0;

  employees.forEach((employee) => {
    const shift = roster[employee.id]?.days[dayId];
    if (!shift || calcNetHours(shift.start, shift.end) <= 0) return;
    working += 1;

    const shiftStartMin = timeToMinutes(shift.start);
    const shiftEndMin = timeToMinutes(shift.end);
    if (openMin !== null && shiftStartMin !== null && shiftStartMin <= openMin) opening += 1;
    if (closeMin !== null && shiftEndMin !== null && shiftEndMin >= closeMin) closing += 1;
  });

  return working >= MIN_STAFF_PER_DAY && opening >= MIN_OPENERS && closing >= MIN_CLOSERS;
}
