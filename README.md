# Roster Generator

A React + TypeScript roster generator, built with Vite and deployed to GitHub Pages. It stores employees, shop hours, week setup, generated rosters, and manual edits in the browser's `localStorage` — no backend or database.

## Structure

- `src/types.ts` - shared data types
- `src/constants.ts` - day-of-week definitions
- `src/storage.ts` - localStorage load/save and state normalization
- `src/utils/` - date, time-and-break, and hours-formatting helpers
- `src/logic/schedule.ts` - roster generation (distributes weekly hours across work days, honoring shop opening hours)
- `src/state/` - the reducer that owns all state mutations, and the hook that wires it to localStorage
- `src/components/` - `Header`, `ShopHoursPanel`, `EmployeeForm`/`EmployeeList`/`EmployeeCard`, `WeekSection`/`RosterTable`/`RosterRow`, `DayToggles`
- `src/index.css` - screen and print styles
- `public/assets/company-logo.png` - company logo used in the header

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + production build to dist/
```

## GitHub Pages

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the app and deploys `dist/` via GitHub Pages on every push to `main`. Enable Pages for the repo with source "GitHub Actions" — no build output is committed to the repo.
