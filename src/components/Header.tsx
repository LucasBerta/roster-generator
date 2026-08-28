interface HeaderProps {
  savedAt: Date | null;
  onPrint: () => void;
}

export function Header({ savedAt, onPrint }: HeaderProps) {
  const savedLabel = savedAt ? `Saved ${savedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Saved locally';

  return (
    <header className='app-header'>
      <div className='brand'>
        <img src='./assets/company-logo.png' alt='Company logo' className='logo' />
        <div>
          <h1>Roster Generator</h1>
          <p className='save-status'>{savedLabel}</p>
        </div>
      </div>
      <div className='header-actions no-print'>
        <button className='button primary' type='button' title='Print roster' onClick={onPrint}>
          <span aria-hidden='true'>Print</span>
        </button>
      </div>
    </header>
  );
}
