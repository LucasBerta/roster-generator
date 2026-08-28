export type DayId = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayDefinition {
  id: DayId;
  short: string;
  label: string;
}

export type SchedulePriority = 'open' | 'close' | 'none';

export interface Employee {
  id: string;
  name: string;
  weeklyHours: number;
  daysOff: DayId[];
  /** Preference for which role this employee should get when the roster is generated: always open the shop, always close it, or no preference. */
  priority: SchedulePriority;
}

export interface DayShift {
  start: string;
  end: string;
}

export interface RosterEntry {
  cleared: boolean;
  days: Record<DayId, DayShift>;
  /** Shift times backed up when this entry was cleared, so "Restore" can bring them back instead of leaving the employee blank. */
  previousDays?: Record<DayId, DayShift>;
}

/** A navigable card in the UI. Its roster data lives in RosterState.weekRecords, keyed by startDate, so paging the card to a different date shows that date's own (possibly blank) record. */
export interface Week {
  id: string;
  startDate: string;
}

/** The roster data for one calendar week, keyed by startDate in RosterState.weekRecords. */
export interface WeekRecord {
  roster: Record<string, RosterEntry>;
  saved: boolean;
  /** Snapshot of the employees (name, weekly hours, days off) as they were when the roster was saved, so later edits or deletions in the live employee list don't alter this week's record. */
  savedEmployees: Employee[];
}

export interface DayHours {
  closed: boolean;
  open: string;
  close: string;
}

export type OpeningHours = Record<DayId, DayHours>;

export interface Settings {
  openingHours: OpeningHours;
}

export interface RosterState {
  employees: Employee[];
  weeks: Week[];
  weekRecords: Record<string, WeekRecord>;
  settings: Settings;
}
