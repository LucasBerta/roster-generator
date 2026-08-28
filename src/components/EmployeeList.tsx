import type { Dispatch } from 'react';
import { EmployeeCard } from './EmployeeCard';
import type { RosterAction } from '../state/rosterReducer';
import type { Employee } from '../types';

interface EmployeeListProps {
  employees: Employee[];
  dispatch: Dispatch<RosterAction>;
}

export function EmployeeList({ employees, dispatch }: EmployeeListProps) {
  if (!employees.length) {
    return (
      <div className="employee-list">
        <p className="empty-state">No employees yet.</p>
      </div>
    );
  }

  return (
    <div className="employee-list">
      {employees.map((employee) => (
        <EmployeeCard employee={employee} dispatch={dispatch} key={employee.id} />
      ))}
    </div>
  );
}
