import { createWeekRecord } from '../storage';
import type { RosterState, WeekRecord } from '../types';

export function selectWeekRecord(state: RosterState, startDate: string): WeekRecord {
  return state.weekRecords[startDate] ?? createWeekRecord();
}
