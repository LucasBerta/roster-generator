import { useEffect, useReducer, useState } from 'react';
import { loadState, saveState } from '../storage';
import { rosterReducer } from './rosterReducer';
import type { RosterAction } from './rosterReducer';
import type { RosterState } from '../types';

export function useRosterState(): [RosterState, React.Dispatch<RosterAction>, Date | null] {
  const [state, dispatch] = useReducer(rosterReducer, undefined, loadState);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    saveState(state);
    setLastSaved(new Date());
  }, [state]);

  return [state, dispatch, lastSaved];
}
