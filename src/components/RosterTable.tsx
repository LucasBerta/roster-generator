import type { Dispatch } from 'react';
import { DAYS } from '../constants';
import { createRosterEntry } from '../storage';
import { checkDayCoverage } from '../logic/schedule';
import { RosterRow } from './RosterRow';
import { addDays, formatDisplayDate } from '../utils/date';
import type { RosterAction } from '../state/rosterReducer';
import type { DayId, Employee, OpeningHours, RosterEntry } from '../types';

interface RosterTableProps {
  weekId: string;
  startDate: string;
  roster: Record<string, RosterEntry>;
  employees: Employee[];
  openingHours: OpeningHours;
  saved: boolean;
  dispatch: Dispatch<RosterAction>;
}

export function RosterTable({ weekId, startDate, roster, employees, openingHours, saved, dispatch }: RosterTableProps) {
  const understaffedDays = new Set<DayId>(
    DAYS.filter(day => !checkDayCoverage(day.id, employees, roster, openingHours)).map(day => day.id),
  );

  return (
    <div className='table-wrap'>
      <table className='roster-table'>
        <thead>
          <tr>
            <th className='row-employee-head'>Employee</th>
            {DAYS.map((day, index) => {
              const hours = openingHours[day.id];
              const subtitle = !hours || hours.closed ? 'Closed' : `${hours.open}–${hours.close}`;
              return (
                <th className={understaffedDays.has(day.id) ? 'understaffed' : undefined} key={day.id}>
                  <div>
                    {day.short} {formatDisplayDate(addDays(startDate, index))}
                  </div>
                  <div className='header-subtitle'>{subtitle}</div>
                </th>
              );
            })}
            <th className='row-total-head'>Total</th>
            <th className='no-print row-actions-head'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length === 0 && (
            <tr>
              <td className='empty-state' colSpan={DAYS.length + 3}>
                Add employees to build a roster.
              </td>
            </tr>
          )}
          {employees.map(employee => (
            <RosterRow
              employee={employee}
              entry={roster[employee.id] ?? createRosterEntry()}
              weekId={weekId}
              openingHours={openingHours}
              understaffedDays={understaffedDays}
              saved={saved}
              dispatch={dispatch}
              key={employee.id}
            />
          ))}
        </tbody>
      </table>
      {understaffedDays.size > 0 && (
        <p className='coverage-note'>Highlighted days need at least 3 people working, with at least 2 opening and 2 closing.</p>
      )}
    </div>
  );
}
