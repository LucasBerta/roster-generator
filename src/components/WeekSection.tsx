import type { Dispatch } from 'react';
import { PrintPageHeader } from './PrintPageHeader';
import { RosterTable } from './RosterTable';
import { addDays, formatDisplayDate, getWeekNumber } from '../utils/date';
import type { RosterAction } from '../state/rosterReducer';
import type { Employee, OpeningHours, Week, WeekRecord } from '../types';

interface WeekSectionProps {
  week: Week;
  record: WeekRecord;
  employees: Employee[];
  openingHours: OpeningHours;
  canDelete: boolean;
  dispatch: Dispatch<RosterAction>;
}

export function WeekSection({ week, record, employees, openingHours, canDelete, dispatch }: WeekSectionProps) {
  const displayEmployees = record.saved ? record.savedEmployees : employees;

  return (
    <article className="week-section">
      <PrintPageHeader />
      <div className="week-toolbar">
        <div className="week-title-group">
          <button
            className="button week-nav-button no-print"
            type="button"
            aria-label="Previous week"
            title="Previous week"
            onClick={() => dispatch({ type: 'SHIFT_ALL_WEEKS', deltaDays: -7 })}
          >
            ‹
          </button>
          <strong className="week-total">
            Week {getWeekNumber(week.startDate)} · {formatDisplayDate(week.startDate)} – {formatDisplayDate(addDays(week.startDate, 6))}
          </strong>
          <button
            className="button week-nav-button no-print"
            type="button"
            aria-label="Next week"
            title="Next week"
            onClick={() => dispatch({ type: 'SHIFT_ALL_WEEKS', deltaDays: 7 })}
          >
            ›
          </button>
          {record.saved && <span className="saved-badge">Saved</span>}
        </div>
        <div className="week-actions no-print">
          <button
            className="button"
            type="button"
            title="Reset this week to start the week after the previous one"
            onClick={() => dispatch({ type: 'RESET_WEEK_DATE', weekId: week.id })}
          >
            Reset to following week
          </button>
          <button
            className="button generate-week"
            type="button"
            disabled={record.saved}
            title={record.saved ? 'Unlock this week to regenerate' : undefined}
            onClick={() => dispatch({ type: 'GENERATE_WEEK', weekId: week.id })}
          >
            Generate
          </button>
          <button
            className="button clear-week"
            type="button"
            disabled={record.saved}
            title={record.saved ? 'Unlock this week to clear' : undefined}
            onClick={() => dispatch({ type: 'CLEAR_WEEK', weekId: week.id })}
          >
            Clear week
          </button>
          {record.saved ? (
            <button className="button" type="button" onClick={() => dispatch({ type: 'UNSAVE_WEEK', weekId: week.id })}>
              Unlock
            </button>
          ) : (
            <button className="button save-week" type="button" onClick={() => dispatch({ type: 'SAVE_WEEK', weekId: week.id })}>
              Save roster
            </button>
          )}
          <button
            className="button danger delete-week"
            type="button"
            disabled={!canDelete}
            title={canDelete ? 'Delete week' : 'At least one week is required'}
            onClick={() => dispatch({ type: 'DELETE_WEEK', weekId: week.id })}
          >
            Delete week
          </button>
        </div>
      </div>
      <RosterTable
        weekId={week.id}
        startDate={week.startDate}
        roster={record.roster}
        employees={displayEmployees}
        openingHours={openingHours}
        saved={record.saved}
        dispatch={dispatch}
      />
    </article>
  );
}
