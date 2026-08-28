import type { SchedulePriority } from '../types';

const OPTIONS: { value: SchedulePriority; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'close', label: 'Close' },
  { value: 'none', label: 'None' },
];

interface PrioritySelectorProps {
  value: SchedulePriority;
  name: string;
  onChange: (value: SchedulePriority) => void;
  compact?: boolean;
}

export function PrioritySelector({ value, name, onChange, compact }: PrioritySelectorProps) {
  return (
    <div className={compact ? 'day-toggles compact priority-toggles' : 'day-toggles priority-toggles'}>
      {OPTIONS.map((option) => (
        <label className="day-toggle" title={`Always ${option.value === 'none' ? 'no preference' : option.value + ' the shop'}`} key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
