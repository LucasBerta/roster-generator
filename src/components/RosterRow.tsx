import type { Dispatch } from 'react';
import { DAYS } from '../constants';
import { isDayClosed } from '../logic/schedule';
import { calcNetHours } from '../utils/time';
import { formatHours, roundToQuarter } from '../utils/hours';
import type { RosterAction } from '../state/rosterReducer';
import type { DayId, Employee, OpeningHours, RosterEntry } from '../types';

interface RosterRowProps {
  employee: Employee;
  entry: RosterEntry;
  weekId: string;
  openingHours: OpeningHours;
  understaffedDays: Set<DayId>;
  saved: boolean;
  dispatch: Dispatch<RosterAction>;
}

function sumEntry(entry: RosterEntry): number {
  return roundToQuarter(
    DAYS.reduce((sum, day) => {
      const shift = entry.days[day.id];
      return sum + calcNetHours(shift.start, shift.end);
    }, 0),
  );
}

export function RosterRow({ employee, entry, weekId, openingHours, understaffedDays, saved, dispatch }: RosterRowProps) {
  const total = sumEntry(entry);
  const target = Number(employee.weeklyHours) || 0;
  const diff = roundToQuarter(total - target);

  let totalClass = '';
  let totalText = `${formatHours(total)}h`;
  if (target > 0) {
    if (Math.abs(diff) < 0.001) {
      totalClass = 'match';
      totalText = `${formatHours(total)}h / ${formatHours(target)}h`;
    } else {
      totalClass = diff > 0 ? 'over' : 'under';
      const marker = diff > 0 ? '+' : '';
      totalText = `${formatHours(total)}h / ${formatHours(target)}h (${marker}${formatHours(diff)}h)`;
    }
  }

  return (
    <tr className={entry.cleared ? 'cleared-row' : undefined}>
      <td className="employee-name-cell">{employee.name || 'Unnamed'}</td>
      {DAYS.map((day) => {
        const closed = isDayClosed(openingHours, day.id);
        const shift = entry.days[day.id];

        const classNames = ['day-cell'];
        if (employee.daysOff.includes(day.id) || closed) classNames.push('off-day');
        if (understaffedDays.has(day.id)) classNames.push('understaffed');

        return (
          <td className={classNames.join(' ')} key={day.id}>
            <div className="time-range no-print">
              <input
                className="time-input start-time"
                type="time"
                aria-label={`${employee.name || 'Employee'} ${day.label} start time`}
                value={shift.start}
                disabled={saved}
                onChange={(event) =>
                  dispatch({
                    type: 'UPDATE_SHIFT',
                    weekId,
                    employeeId: employee.id,
                    dayId: day.id,
                    shift: { ...shift, start: event.target.value },
                  })
                }
              />
              <span className="time-sep">–</span>
              <input
                className="time-input end-time"
                type="time"
                aria-label={`${employee.name || 'Employee'} ${day.label} end time`}
                value={shift.end}
                disabled={saved}
                onChange={(event) =>
                  dispatch({
                    type: 'UPDATE_SHIFT',
                    weekId,
                    employeeId: employee.id,
                    dayId: day.id,
                    shift: { ...shift, end: event.target.value },
                  })
                }
              />
            </div>
            {/* Native time inputs render inconsistently (clipped/misaligned) when printed, so print shows plain text instead. */}
            <div className="time-range-print print-only">{shift.start && shift.end ? `${shift.start} – ${shift.end}` : '–'}</div>
            {closed && <div className="closed-note">Shop closed</div>}
          </td>
        );
      })}
      <td className={totalClass ? `total-cell ${totalClass}` : 'total-cell'}>
        <span className="no-print">{totalText}</span>
        <span className="print-only">{formatHours(total)}h</span>
      </td>
      <td className="row-actions no-print">
        <button
          className="button"
          type="button"
          disabled={saved}
          title={saved ? 'Unlock this week to change' : 'Clear this employee for this week'}
          onClick={() => dispatch({ type: 'SET_EMPLOYEE_WEEK_LOCK', weekId, employeeId: employee.id, locked: true })}
        >
          Clear
        </button>
        <button
          className="button"
          type="button"
          disabled={saved}
          title={saved ? 'Unlock this week to change' : 'Allow generation from employee days off'}
          onClick={() => dispatch({ type: 'SET_EMPLOYEE_WEEK_LOCK', weekId, employeeId: employee.id, locked: false })}
        >
          Restore
        </button>
      </td>
    </tr>
  );
}
