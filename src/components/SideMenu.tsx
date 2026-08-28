interface SideMenuProps {
  employeeCount: number;
  onOpenHours: () => void;
  onOpenEmployees: () => void;
}

export function SideMenu({ employeeCount, onOpenHours, onOpenEmployees }: SideMenuProps) {
  return (
    <nav className="side-menu">
      <button className="side-menu-item" type="button" onClick={onOpenHours}>
        <span>Opening Hours</span>
        <span className="side-menu-chevron" aria-hidden="true">
          ›
        </span>
      </button>
      <button className="side-menu-item" type="button" onClick={onOpenEmployees}>
        <span>Employees</span>
        <span className="side-menu-count">{employeeCount}</span>
        <span className="side-menu-chevron" aria-hidden="true">
          ›
        </span>
      </button>
    </nav>
  );
}
