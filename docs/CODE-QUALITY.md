# Quality checks

`bun run lint` runs ESLint with no warnings allowed, followed by Stylelint. Both CI and manual release preparation enforce this check, the regression tests and Firefox archive validation. A successful lint run does not establish runtime correctness.

Effects subscribe to external changes, own their timers/requests and release them on cleanup. Initial preferences belong in state initializers; labels and date text are derived from current values. Settings navigation stores section identity rather than translated labels. Effect events keep upload and timer callbacks current without reinstalling listeners on each render.

The Floating UI tooltip uses its documented `refs.setFloating` callback directly. That JSX line has a narrow compiler-rule exception: passing the callback does not read `ref.current` during render. Other ref diagnostics remain enabled.

SCSS identifiers accept existing camelCase and kebab-case names, including IDs shared with JSX and retained legacy styles. The pattern still restricts identifiers to letters, numbers, underscores and hyphens. Class naming and descending specificity retain the repository's existing policy; the refactor does not delete hidden styles or browser compatibility declarations to pass lint. Formatting and safe Stylelint fixes are applied separately from behavioral changes.

Regression fixtures cover imports and recovery, notes and picture migration, request ownership, account refresh races, calendar/task pagination, date handling and locale fallback. Installed Firefox/Zen, connected Google accounts, a real exhausted storage quota, screen readers and sustained memory/CPU behavior require separate runtime checks.
