import { DAYS } from '../constants';
import type { Dispatch } from 'react';
import type { RosterAction } from '../state/rosterReducer';
import type { OpeningHours } from '../types';
import { isValidTimeString } from '../utils/time';

interface ShopHoursPanelProps {
  openingHours: OpeningHours;
  dispatch: Dispatch<RosterAction>;
}

export function ShopHoursPanel({ openingHours, dispatch }: ShopHoursPanelProps) {
  return (
    <>
      <div className="shop-hours-list">
        {DAYS.map((day) => {
          const hours = openingHours[day.id];
          return (
            <div className="shop-hours-row" key={day.id}>
              <span className="shop-hours-day">{day.short}</span>
              <label className="shop-hours-closed-toggle">
                <input
                  type="checkbox"
                  checked={hours.closed}
                  onChange={(event) =>
                    dispatch({ type: 'UPDATE_OPENING_HOURS', dayId: day.id, changes: { closed: event.target.checked } })
                  }
                />
                Closed
              </label>
              <label className="compact-label">
                Open
                <input
                  type="time"
                  disabled={hours.closed}
                  value={hours.open}
                  onChange={(event) => {
                    if (isValidTimeString(event.target.value)) {
                      dispatch({ type: 'UPDATE_OPENING_HOURS', dayId: day.id, changes: { open: event.target.value } });
                    }
                  }}
                />
              </label>
              <label className="compact-label">
                Close
                <input
                  type="time"
                  disabled={hours.closed}
                  value={hours.close}
                  onChange={(event) => {
                    if (isValidTimeString(event.target.value)) {
                      dispatch({ type: 'UPDATE_OPENING_HOURS', dayId: day.id, changes: { close: event.target.value } });
                    }
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
}
