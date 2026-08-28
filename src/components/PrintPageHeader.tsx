/** Repeated on every printed week page (each week starts a fresh page), since the on-screen app header only appears once and print doesn't repeat elements across pages on its own. */
export function PrintPageHeader() {
  return (
    <div className='print-page-header'>
      <img src='./assets/company-logo.png' alt='Company logo' className='logo' />
    </div>
  );
}
