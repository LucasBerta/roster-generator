import { useEffect, useState } from 'react';
import type { Dispatch } from 'react';
import { DayToggles } from './DayToggles';
import { PrioritySelector } from './PrioritySelector';
import { formatNumberForInput, toNumber } from '../utils/hours';
import type { RosterAction } from '../state/rosterReducer';
import type { Employee } from '../types';

interface EmployeeCardProps {
  employee: Employee;
  dispatch: Dispatch<RosterAction>;
}

export function EmployeeCard({ employee, dispatch }: EmployeeCardProps) {
  const [name, setName] = useState(employee.name);
  const [hours, setHours] = useState(formatNumberForInput(employee.weeklyHours));

  useEffect(() => setName(employee.name), [employee.name]);
  useEffect(() => setHours(formatNumberForInput(employee.weeklyHours)), [employee.weeklyHours]);

  function commitName() {
    const trimmed = name.trim();
    dispatch({ type: 'UPDATE_EMPLOYEE', id: employee.id, changes: { name: trimmed } });
  }

  function commitHours() {
    const value = toNumber(hours);
    setHours(formatNumberForInput(value));
    dispatch({ type: 'UPDATE_EMPLOYEE', id: employee.id, changes: { weeklyHours: value } });
  }

  return (
    <article className="employee-card">
      <div className="employee-card-main">
        <input
          className="employee-edit-name"
          type="text"
          aria-label="Employee name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
        />
        <label className="compact-label">
          Hours
          <input
            className="employee-edit-hours"
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            onBlur={commitHours}
          />
        </label>
      </div>
      <fieldset className="days-fieldset compact">
        <legend>Days off</legend>
        <DayToggles
          selectedDays={employee.daysOff}
          name={`days-off-${employee.id}`}
          compact
          onChange={(daysOff) => dispatch({ type: 'UPDATE_EMPLOYEE', id: employee.id, changes: { daysOff } })}
        />
      </fieldset>
      <fieldset className="days-fieldset compact">
        <legend>Priority</legend>
        <PrioritySelector
          value={employee.priority}
          name={`priority-${employee.id}`}
          compact
          onChange={(priority) => dispatch({ type: 'UPDATE_EMPLOYEE', id: employee.id, changes: { priority } })}
        />
      </fieldset>
      <div className="employee-actions">
        <button
          className="button danger delete-employee"
          type="button"
          onClick={() => dispatch({ type: 'DELETE_EMPLOYEE', id: employee.id })}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
