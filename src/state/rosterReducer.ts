import { createRosterEntry } from '../storage';
import { selectWeekRecord } from './selectors';
import { generateWeekRoster } from '../logic/schedule';
import { addDays, formatDateInput, nextMonday } from '../utils/date';
import { createId } from '../utils/id';
import type { DayHours, DayId, DayShift, Employee, RosterState, Week, WeekRecord } from '../types';

export type RosterAction =
  | { type: 'ADD_EMPLOYEE'; employee: Employee }
  | { type: 'UPDATE_EMPLOYEE'; id: string; changes: Partial<Omit<Employee, 'id'>> }
  | { type: 'DELETE_EMPLOYEE'; id: string }
  | { type: 'ADD_WEEK' }
  | { type: 'DELETE_WEEK'; weekId: string }
  | { type: 'SHIFT_ALL_WEEKS'; deltaDays: number }
  | { type: 'RESET_WEEK_DATE'; weekId: string }
  | { type: 'GENERATE_WEEK'; weekId: string }
  | { type: 'CLEAR_WEEK'; weekId: string }
  | { type: 'SAVE_WEEK'; weekId: string }
  | { type: 'UNSAVE_WEEK'; weekId: string }
  | { type: 'SET_EMPLOYEE_WEEK_LOCK'; weekId: string; employeeId: string; locked: boolean }
  | { type: 'UPDATE_SHIFT'; weekId: string; employeeId: string; dayId: DayId; shift: DayShift }
  | { type: 'UPDATE_OPENING_HOURS'; dayId: DayId; changes: Partial<DayHours> };

function findWeek(state: RosterState, weekId: string): Week | undefined {
  return state.weeks.find((week) => week.id === weekId);
}

function emptyDays(): WeekRecord['roster'][string]['days'] {
  return createRosterEntry().days;
}

/** Applies `updater` to the WeekRecord for the given week card's current date, creating a blank one if none exists yet. No-ops if the week card doesn't exist. */
function updateRecordForWeek(state: RosterState, weekId: string, updater: (record: WeekRecord) => WeekRecord): RosterState {
  const week = findWeek(state, weekId);
  if (!week) return state;
  const current = selectWeekRecord(state, week.startDate);
  return { ...state, weekRecords: { ...state.weekRecords, [week.startDate]: updater(current) } };
}

export function rosterReducer(state: RosterState, action: RosterAction): RosterState {
  switch (action.type) {
    case 'ADD_EMPLOYEE': {
      return { ...state, employees: [...state.employees, action.employee] };
    }

    case 'UPDATE_EMPLOYEE': {
      return {
        ...state,
        employees: state.employees.map((employee) =>
          employee.id === action.id ? { ...employee, ...action.changes } : employee,
        ),
      };
    }

    case 'DELETE_EMPLOYEE': {
      // Week records are left untouched: unsaved weeks display the live
      // employee list (so the deleted employee simply stops appearing),
      // and saved weeks must keep their frozen roster/employee snapshot.
      return { ...state, employees: state.employees.filter((employee) => employee.id !== action.id) };
    }

    case 'ADD_WEEK': {
      const lastWeek = state.weeks[state.weeks.length - 1];
      const startDate = lastWeek ? addDays(lastWeek.startDate, 7) : formatDateInput(nextMonday(new Date()));
      return { ...state, weeks: [...state.weeks, { id: createId('week'), startDate }] };
    }

    case 'DELETE_WEEK': {
      if (state.weeks.length <= 1) return state;
      return { ...state, weeks: state.weeks.filter((week) => week.id !== action.weekId) };
    }

    case 'SHIFT_ALL_WEEKS': {
      // Pure navigation: paging never mutates a week's roster, so it's never
      // blocked by a saved week. All cards move together so they keep the
      // same relative spacing when there's more than one on screen.
      return {
        ...state,
        weeks: state.weeks.map((week) => ({ ...week, startDate: addDays(week.startDate, action.deltaDays) })),
      };
    }

    case 'RESET_WEEK_DATE': {
      const index = state.weeks.findIndex((week) => week.id === action.weekId);
      if (index === -1) return state;
      const previousWeek = state.weeks[index - 1];
      const startDate = previousWeek ? addDays(previousWeek.startDate, 7) : formatDateInput(nextMonday(new Date()));
      return {
        ...state,
        weeks: state.weeks.map((week, i) => (i === index ? { ...week, startDate } : week)),
      };
    }

    case 'GENERATE_WEEK': {
      return updateRecordForWeek(state, action.weekId, (record) => {
        if (record.saved) return record;
        return { ...record, roster: generateWeekRoster(state.employees, record.roster, state.settings.openingHours) };
      });
    }

    case 'CLEAR_WEEK': {
      return updateRecordForWeek(state, action.weekId, (record) => {
        if (record.saved) return record;
        const ids = new Set([...Object.keys(record.roster), ...state.employees.map((employee) => employee.id)]);
        const roster: WeekRecord['roster'] = {};
        ids.forEach((employeeId) => {
          roster[employeeId] = { cleared: false, days: emptyDays() };
        });
        return { ...record, roster };
      });
    }

    case 'SAVE_WEEK': {
      return updateRecordForWeek(state, action.weekId, (record) => ({
        ...record,
        saved: true,
        savedEmployees: state.employees.map((employee) => ({ ...employee })),
      }));
    }

    case 'UNSAVE_WEEK': {
      return updateRecordForWeek(state, action.weekId, (record) => ({ ...record, saved: false }));
    }

    case 'SET_EMPLOYEE_WEEK_LOCK': {
      return updateRecordForWeek(state, action.weekId, (record) => {
        if (record.saved) return record;
        const existing = record.roster[action.employeeId] ?? createRosterEntry();
        // Clearing backs up the current shift so Restore can bring it back
        // instead of leaving the employee blank until the next Generate.
        const nextEntry = action.locked
          ? { cleared: true, days: emptyDays(), previousDays: existing.days }
          : { cleared: false, days: existing.previousDays ?? existing.days };
        return { ...record, roster: { ...record.roster, [action.employeeId]: nextEntry } };
      });
    }

    case 'UPDATE_SHIFT': {
      return updateRecordForWeek(state, action.weekId, (record) => {
        if (record.saved) return record;
        const entry = record.roster[action.employeeId] ?? createRosterEntry();
        return {
          ...record,
          roster: {
            ...record.roster,
            [action.employeeId]: {
              cleared: false,
              days: { ...entry.days, [action.dayId]: action.shift },
            },
          },
        };
      });
    }

    case 'UPDATE_OPENING_HOURS': {
      const current = state.settings.openingHours[action.dayId];
      return {
        ...state,
        settings: {
          ...state.settings,
          openingHours: {
            ...state.settings.openingHours,
            [action.dayId]: { ...current, ...action.changes },
          },
        },
      };
    }

    default:
      return state;
  }
}
