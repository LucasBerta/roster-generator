import { useState } from 'react';
import { Header } from './components/Header';
import { Modal } from './components/Modal';
import { SideMenu } from './components/SideMenu';
import { ShopHoursPanel } from './components/ShopHoursPanel';
import { EmployeeForm } from './components/EmployeeForm';
import { EmployeeList } from './components/EmployeeList';
import { WeekSection } from './components/WeekSection';
import { useRosterState } from './state/useRosterState';
import { selectWeekRecord } from './state/selectors';

type ActiveModal = 'hours' | 'employees' | null;

export default function App() {
  const [state, dispatch, lastSaved] = useRosterState();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  return (
    <>
      <Header savedAt={lastSaved} onPrint={() => window.print()} />

      <main className="app-shell">
        <section className="employees-panel no-print" aria-labelledby="setup-title">
          <div className="section-heading">
            <h2 id="setup-title">Setup</h2>
          </div>
          <SideMenu
            employeeCount={state.employees.length}
            onOpenHours={() => setActiveModal('hours')}
            onOpenEmployees={() => setActiveModal('employees')}
          />
        </section>

        <section className="roster-panel" aria-labelledby="rosters-title">
          <div className="section-heading rosters-heading no-print">
            <div>
              <h2 id="rosters-title">Rosters</h2>
            </div>
            <button className="button" type="button" onClick={() => dispatch({ type: 'ADD_WEEK' })}>
              Add week
            </button>
          </div>
          <div className="weeks-container">
            {state.weeks.map((week) => (
              <WeekSection
                week={week}
                record={selectWeekRecord(state, week.startDate)}
                employees={state.employees}
                openingHours={state.settings.openingHours}
                canDelete={state.weeks.length > 1}
                dispatch={dispatch}
                key={week.id}
              />
            ))}
          </div>
        </section>
      </main>

      {activeModal === 'hours' && (
        <Modal title="Opening Hours" onClose={() => setActiveModal(null)}>
          <ShopHoursPanel openingHours={state.settings.openingHours} dispatch={dispatch} />
        </Modal>
      )}

      {activeModal === 'employees' && (
        <Modal title="Employees" size="large" onClose={() => setActiveModal(null)}>
          <EmployeeForm dispatch={dispatch} />
          <EmployeeList employees={state.employees} dispatch={dispatch} />
        </Modal>
      )}
    </>
  );
}
