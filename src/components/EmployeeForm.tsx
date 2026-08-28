import { useState } from 'react';
import type { Dispatch, FormEvent } from 'react';
import { DayToggles } from './DayToggles';
import { PrioritySelector } from './PrioritySelector';
import { createId } from '../utils/id';
import { toNumber } from '../utils/hours';
import type { RosterAction } from '../state/rosterReducer';
import type { DayId, SchedulePriority } from '../types';

interface EmployeeFormProps {
  dispatch: Dispatch<RosterAction>;
}

export function EmployeeForm({ dispatch }: EmployeeFormProps) {
  const [name, setName] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [daysOff, setDaysOff] = useState<DayId[]>([]);
  const [priority, setPriority] = useState<SchedulePriority>('none');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    dispatch({
      type: 'ADD_EMPLOYEE',
      employee: {
        id: createId('emp'),
        name: trimmedName,
        weeklyHours: toNumber(weeklyHours),
        daysOff,
        priority,
      },
    });

    setName('');
    setWeeklyHours('');
    setDaysOff([]);
    setPriority('none');
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input type="text" autoComplete="off" required value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Weekly hours
        <input
          type="number"
          min="0"
          step="0.25"
          inputMode="decimal"
          value={weeklyHours}
          onChange={(event) => setWeeklyHours(event.target.value)}
        />
      </label>
      <fieldset className="days-fieldset">
        <legend>Days off</legend>
        <DayToggles selectedDays={daysOff} name="new-days-off" onChange={setDaysOff} />
      </fieldset>
      <fieldset className="days-fieldset">
        <legend>Priority</legend>
        <PrioritySelector value={priority} name="new-priority" onChange={setPriority} />
      </fieldset>
      <button className="button primary full-width" type="submit">
        Add employee
      </button>
    </form>
  );
}
