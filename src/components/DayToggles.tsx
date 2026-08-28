import { DAYS } from '../constants';
import type { DayId } from '../types';

interface DayTogglesProps {
  selectedDays: DayId[];
  name: string;
  onChange: (days: DayId[]) => void;
  compact?: boolean;
}

export function DayToggles({ selectedDays, name, onChange, compact }: DayTogglesProps) {
  function toggleDay(dayId: DayId, checked: boolean) {
    const next = checked ? [...selectedDays, dayId] : selectedDays.filter((id) => id !== dayId);
    onChange(next);
  }

  return (
    <div className={compact ? 'day-toggles compact' : 'day-toggles'}>
      {DAYS.map((day) => (
        <label className="day-toggle" title={day.label} key={day.id}>
          <input
            type="checkbox"
            name={name}
            value={day.id}
            checked={selectedDays.includes(day.id)}
            onChange={(event) => toggleDay(day.id, event.target.checked)}
          />
          {day.short}
        </label>
      ))}
    </div>
  );
}
