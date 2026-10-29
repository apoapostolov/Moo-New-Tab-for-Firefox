# Widget and time feature tasks

## Calendar status and Natural Format

- [x] Remove event preview glyphs while retaining row hover and keyboard previews.
- [x] Place Passed and In progress pills before the event time and refresh their state.
- [x] Add shared Natural Format help to Calendar and Tasks editor headers.
- [x] Expand English parsing for reordered clauses, notes, compound lengths, clocks, date ranges and repeat rules.
- [x] Preserve literal titles, manual fields and unchanged existing records; parse synchronously on save.
- [x] Verify editor payloads, hover help, status layout and packages.

Verification: All 172 tests pass, including 120 field-order permutations, legacy examples, date validation, compound durations, AM/PM inference, overnight and multi-day bounds, task notes/status, recurrence boundaries and timezone payloads. Browser fixtures confirm pills before times, Natural Format in both headers, pointer hover and Escape, the narrow/light reader surface, synchronous quick saves, preserved existing titles and manual-note priority. Captured mock requests contain the expected event times, calendar, notes, repeat rule and task status. No live account was changed. JavaScript and touched SCSS lint, production build and Firefox package validation pass.

## Calendar hover row polish

- [x] Keep When, start and end on one row with dot separators.
- [x] Align timezone/local time, repeat summary, default reminders and edit access in compact paired rows.
- [x] Resolve organizer display to a known person and remove the calendar-address subline.
- [x] Preserve expandable settings, recurrence details and read-only/locked behavior.
- [x] Finish browser and package verification.

Verification: The actual hover keeps dates on one line and aligns timezone/local time, recurrence, default reminders and edit access across their rows. At 390 px, the panel stays within the viewport; long dates use ellipses with full-value tooltips. Organizer display uses the available person name without a secondary calendar-address line. Expanded metadata, all-day end handling and read-only/locked controls remain available. All 156 tests, targeted JavaScript and SCSS lint, production build and Firefox package validation pass. Isolated browser fixtures used mock event and account data.

## Browser bookmarks and shared source selection

- [x] Add Browser first with optional, user-triggered read access.
- [x] Support folders, subfolders, text filtering, offline use and live library changes.
- [x] Switch sources independently and apply assortment rules to their combined library.
- [x] Add Most opened with locally recorded widget opens preserved across source switches.
- [x] Keep native libraries unchanged and native snapshots out of the persistent index.
- [x] Verify rendered controls, permission changes, filters, sorting and packages.

Verification: All 155 tests pass. Browser fixtures confirm independent source switches, mixed results, all-off recovery, native folder filtering, permission denial and grant, revocation, native detail previews, Most opened ordering and synchronized source switches in Settings. Classic and Glass retain the existing widget layout; the three controls fit a 280 px card. Native data and permissions were mocked; no personal library was accessed. JavaScript and touched SCSS lint, the production build and Firefox package validation pass.

## Empty Countdown notes

- [x] Hide the empty notes placeholder while unfocused.
- [x] Verify focused editing and populated notes remain available.

Verification: The actual floating Countdown renders no empty notes prompt while unfocused. Clicking it opens the notes editor; blurring hides the empty section again. Populated Markdown notes remain visible.

## Quick Links centre row

- [x] Treat Quick Links as a full-width single row above the Overview separator.
- [x] Ignore legacy second-lane assignments in Standard and Focus layouts.
- [x] Verify the Overview preview and runtime layout.

Verification: The actual Overview component places Quick Links alone above the separator and removes its legacy second-lane assignment. The runtime renders Quick Links outside and immediately before the paired card columns. Tests cover both Standard and Focus layouts.

## Calendar event hover

- [x] Retain full event metadata and retrieve recurring-series rules.
- [x] Add a centred Google-style preview with internal scrolling and keyboard access.
- [x] Show times, recurrence, guests, organizer, conference links, reminders and attachments.
- [x] Include event visibility, availability, guest permissions and advanced metadata.
- [x] Add an on-demand OpenStreetMap location preview with address matching.
- [x] Keep detail caches account-scoped and address lookups separate from Google credentials.
- [x] Verify hover, scrolling, maps, errors, account changes and packages.

Verification: All 149 tests pass, including full metadata retention, parent recurrence rules, account and permission scoping, cancellations, exclusive all-day end dates, safe URLs, map coordinates and cached lookups. Browser fixtures confirm the centred 430 px hover, internal spring scrolling, safe rich descriptions, guest status glyphs, on-demand map matching and hiding, read-only behavior, edit action, keyboard focus restoration, account-switch dismissal and error fallbacks. The checked hover accessibility scan has no violations in the light, narrow layout. No live Google account was changed. JavaScript and touched SCSS lint, production build and Firefox package validation pass.

## Bookmark note typography

- [x] Match personal note text and its label to the description typography.
- [x] Verify rendered text sizes and Markdown formatting.

Verification: The actual Bookmarks preview renders the description, personal note, note label and list text at 12.5 px, weight 400 and line height 1.55 in the same font family. Markdown bold remains weight 700 and italic remains italic. Touched SCSS lint passes.

## Floating note locks

- [x] Add image-style padlocks beside Delete on Notes, Lists and Countdowns.
- [x] Prevent pointer, keyboard and resize movement while locked.
- [x] Keep locked items above unlocked floating content with stable selection order.
- [x] Preserve locks across type changes, reloads and backups.
- [x] Verify interactions, transparent states and packages.

Verification: All 139 tests pass, including mixed image/note stacking, note-type conversions and backup round-trips. Browser checks confirm matching red padlocks on all three note types, blocked pointer and keyboard movement, usable checklist tasks, restored movement after unlocking, saved locks after reload, fixed positions on resize and hidden controls on transparent unfocused notes. The lock-control accessibility scan reports no violations. JavaScript and touched SCSS lint pass. Original browser content and settings are restored.

## World clocks row polish

- [x] Align clock names, timezones and borderless delete glyphs on one row.
- [x] Align the add glyph with the delete controls in the input row.
- [x] Reword the Overview hint to begin “You can choose a separate…”.
- [x] Verify layout, adding and deleting clocks.

Verification: Browser checks confirm single-line rows, matching action-column positions, borderless glyphs and input-centred add controls at wide and narrow settings widths. Adding and deleting a test clock works; original clock and note data are restored. All 40 relevant tests, JavaScript and SCSS lint, the production build and Firefox package validation pass.

## Standard and Focus workspaces

- [x] Add an optional, independently editable Focus/Work Quick Links list.
- [x] Save separate widget visibility, order, columns and lanes from Overview.
- [x] Share automatic switching between Focus sessions and Progress clock work shifts.
- [x] Add Show in Focus to Floating Notes, Lists, Countdowns and Images.
- [x] Include both workspaces and per-item visibility in backups.
- [x] Verify switching, persistence, layout isolation and browser interactions.

Verification: All 137 tests pass, including isolated widget layouts, Quick Links replacement, timezone and overnight shift boundaries, backup validation and resets that retain personal data. Browser checks confirm the separate list editor, Focus start/end, automatic work-shift switching, all four floating types, image menu tilt, menu stacking, saved preferences and notes created during Focus. The Overview selector passes the checked accessibility scan and fits a narrow light-theme settings window. JavaScript and touched SCSS lint, the production build and Firefox package validation pass. Original browser settings, the original note and image storage are restored.

## Bookmark descriptions and link destination

- [x] Use the smaller reader content typography for descriptions and highlights.
- [x] Add Open links in with Same tab as the default and New tab as an option.
- [x] Apply the preference to rows, preview controls and links in Markdown notes.

Verification: Browser measurements confirm 12.5 px regular descriptions beneath 16 px titles. The shared settings dropdown defaults to Same tab and saves New tab; all tested row, preview and note anchors follow the selected target. All 130 tests, touched JavaScript and SCSS lint, production build and Firefox package validation pass. Original browser settings and cached records are restored.

## Bookmarks

- [x] Research Raindrop, Reader and Daily Review APIs.
- [x] Add service adapters, progressive indexing and private local cache.
- [x] Build the Google-style card, source tabs and centred detail preview.
- [x] Add service settings, filters, selection modes and repeat history.
- [x] Verify accounts, pagination, errors, offline data, backups and resets.
- [x] Verify visual polish, keyboard access, themes, layouts and packages.

Verification: All 128 tests pass, including source pagination, URL normalization, duplicate merging, discovery filters, independent source assortments, reloads, account changes during requests, cursor recovery, rate-limit backoff, offline results, backup exclusions and cache removal on profile erase. Browser fixtures confirm the shared 340 px width, source tabs, full scrollable previews, Daily Review switching, masked token inputs, named collection loading, white settings links, narrow bounds, light Glass and reduced motion. Checked card and preview accessibility scans report no violations. Full JavaScript lint, touched SCSS lint, production build and Firefox package validation pass. Original local settings and IndexedDB records are restored. Live service accounts were not connected; API responses were tested with fixtures against official documentation. New labels have explicit English fallbacks in other locales and still need translation review.

## Preview consistency and compact status details

- [x] Keep GitHub card icons monochrome and reserve status colours for its hover.
- [x] Combine the GitHub result count and update date into one footer row.
- [x] Show a borderless translucent countdown pill when the fill reaches the centre label.
- [x] Match Google preview side placement, vertical centring and internal spring scrolling for Habits and GitHub.
- [x] Verify hover interactions, scroll boundaries, themes and packages.

Verification: Browser checks confirm white GitHub status glyphs on the card and semantic colours inside the preview. Result count and refresh date share one baseline. Countdown labels have no border and gain a translucent rounded background only when the fill reaches their measured width. Both previews stay vertically centred, cap at 62% of the viewport height, and scroll their bodies without moving their headers or the page. Checks cover pointer transfer, dismissal, keyboard focus, narrow and short windows, light surfaces and reduced motion. The checked card and panels have no axe violations. All 115 tests, full JavaScript lint, touched SCSS lint, production build and Firefox package validation pass. Original browser settings and data are restored after testing.

## Image Info stacking and habit hover polish

- [x] Raise hovered or focused Image Info above Floating Notes, Lists, Countdowns and Images.
- [x] Keep the habit schedule and right-aligned date on one row.
- [x] Add a checkmark before the confirmed-day label.
- [x] Verify stacking, pointer access, keyboard focus and layouts.

Verification: Browser hit testing confirms hovered/focused Image Info sits above an overlapping floating layer even when its child uses the highest internal order. Checks cover left/right rails, centre, split-centre and compact layouts; empty space remains clickable and inactive cards return below floats. Habit schedule and date share one baseline, the date reaches the row's right edge, and a decorative checkmark precedes confirmed text. The compact habit panel has no axe violations. All 113 tests, touched JavaScript/SCSS lint, production build and Firefox package validation pass. Original browser settings and data are restored after testing.

## GitHub visual rows and body previews

- [x] Keep only reload in the header and use glyph tabs with counts.
- [x] Simplify rows around status, title, repository, discussion count and optional update date.
- [x] Add a scrollable hover/focus preview with full Markdown bodies and developer metadata.
- [x] Verify rendering, interaction, stale/auth changes, themes, narrow layouts and packages.

Verification: The header exposes only reload, and all four glyph/count tabs stay on one line in the shared 340 px card. Browser checks cover complete scrollable Markdown bodies, task lists, tables, collapsible details, monospace code, merged/draft/workflow states, keyboard tabs, Escape focus return, pointer transfer into the panel, view changes and rejected credentials. Account changes hide previews immediately; auth failures clear cached results. Body checks remove executable tags, event handlers, unsafe URLs and autoplay while preserving formatting and read-only task boxes. At 390 px the 366 px preview stays inside the viewport without horizontal overflow. Axe reports no violations in the checked dark and light Glass card/panel. All 113 tests, full JavaScript lint, touched SCSS lint, production build and Firefox package validation pass. All 34 locale files share 1,312 keys; machine-assisted wording remains subject to fluent-speaker review. Original browser data is restored after testing.

## Habits week navigation

- [x] Add slim previous/next arrows around the weekday header at the shared widget width.
- [x] Keep today's progress independent of the displayed week and cancel pending confirmations on navigation.
- [x] Verify history, empty weeks, keyboard operation and narrow layout.

Verification: Previous/next arrows sit around the weekday header within the 340 px card. Browser checks cover the earliest-week boundary, keyboard return to the current week, retained navigation with completed rows hidden and cancellation of pending confirmations. Today's progress stays unchanged while browsing history. At 390 px the table has no horizontal overflow; axe reports no violations in the checked widget. All 109 tests, touched JavaScript/SCSS lint, production build and Firefox package validation pass. Original browser data is restored after testing.

## Overview grouping

- [x] Remove the Move widgets with buttons section.
- [x] Separate full-width centre lines from widgets that can share a row.
- [x] Keep keyboard movement on the drag handles.
- [x] Verify the divider, movement, layout persistence and packages.

Verification: The movement disclosure is removed. Centre full-width items precede one divider, followed by cards that can share a row. Browser checks cover pointer dragging into a paired row, keyboard reordering, moving between columns and Shift+Left/Right lane changes. Arrow keys work from the focused handle; the test layout is restored afterwards. The checked Overview dialog has no axe violations. All 109 tests, JavaScript and touched SCSS lint, production build and Firefox package validation pass.

## Habits daily confirmations and milestones

- [x] Use the shared widget width, truncate names and remove the date toolbar.
- [x] Keep today's completion bar and only the Add glyph in the widget header.
- [x] Add green/red two-click confirmation and one confirmation per day.
- [x] Add ten earned streak milestones and a monthly curve in the hover panel.
- [x] Show each day's progress toward its next milestone, with the earned icon centred at exact thresholds.
- [x] Move the borderless Edit glyph beside Close in each habit's hover header.
- [x] Verify confirmation, undo, concurrency, streaks, charts, themes and narrow layouts.

Verification: Habits and the neighbouring GitHub card both measure 340 px in the centre. Names truncate with an ellipsis; the full name appears in the hover. Browser checks cover green confirmation, red undo, Escape cancellation, today's bar reaching 100%, month/year navigation, keyboard chart values and editing without losing history. Rings show 1/2, 10/10 and 11/20 on the corresponding days; exact milestones use a 12 px icon centred inside the 24 px ring. At 390 px the table has no horizontal overflow and the details panel stays inside the viewport. Axe reports no violations in the checked dark and light Glass table/panel after correcting light-theme heading contrast. All 108 tests, full JavaScript lint, touched SCSS lint, production build and Firefox package validation pass. All 34 locale files share 1,298 keys; machine-assisted wording remains subject to fluent-speaker review. Original browser data and preferences are restored.

## Floats settings

- [x] Move floating-content controls from Misc into a new Floats page.
- [x] Embed Countdown widget settings in Floats and remove its separate navigation item.
- [x] Rename the features to Floating Notes, Floating Lists, Floating Images and Floating Countdowns.
- [x] Keep only Triple click to hide the UI in Misc; preserve saved data and preferences.
- [x] Verify navigation, toggles, translations and existing checks.

Verification: Floats replaces the standalone Countdowns entry in the sidebar and compact selector. Old Countdown settings links resolve to Floats. Countdown and Floating Notes switches update the page immediately, with saved content retained. Misc contains only the triple-click switch. At 390 px the settings dialog fits the viewport and all five switches align on the right; axe reports no violations in the checked page. All 103 tests, full JavaScript lint, touched SCSS lint, production build and Firefox package validation pass. All 34 locale files share 1,279 keys; new wording uses machine-assisted translations pending fluent-speaker review. Browser test preferences are restored.

## Habits weekly table

- [x] Replace stacked habit rows with a landscape week table and completion rings.
- [x] Show only habit names in row labels; move details and counters into a hover/focus panel.
- [x] Preserve daily, weekday and weekly targets, historical correction and existing progress.
- [x] Verify pointer, keyboard, date navigation, themes, narrow layouts and packages.

Verification: Habits uses a 440 px landscape card with seven aligned day columns. Descriptions, targets, counts and streaks appear only in the hover/focus panel. Browser checks cover direct daily completion, counted increments, week navigation, pointer transfer into the panel, Escape dismissal, editing without losing logs and 390 px reflow. The table has no horizontal overflow at that size, and the details panel stays inside the viewport. Axe reports no violations in the checked table/panel in dark mode and light Glass. All 102 tests, full JavaScript and SCSS lint, production build and Firefox package validation pass. All 34 locale files share 1,279 keys; machine-assisted translations remain subject to fluent-speaker review. Preview data is restored after testing.

## Air Quality chrome cleanup

- [x] Remove corner settings/refresh controls and the source/update footer from the widget.
- [x] Keep provider attribution in Settings.
- [x] Remove hourly tables from Summary and Detailed, retaining the forecast curve and peak.

## Air Quality information depth and Settings links

- [x] Replace coloured Settings links with bold theme text.
- [x] Add Basic, Summary and Detailed presentations, defaulting to Basic.
- [x] Match Air Quality and Weather widths in both side columns.
- [x] Add a forecast visual, readable measurements and expandable hourly/pollen details.
- [x] Update translations, documentation and verification.

Verification: Basic measures 300 × 68 px beside small Weather at 300 × 65 px. Both side columns align at 300 px; narrow layouts use the normal shared card width without horizontal overflow. Summary adds a scale and forecast; Detailed adds icon-led measurements, with hourly values and pollen expandable by keyboard. Switching depth retains the configured readings. Settings links measure bold white in dark mode and bold black in light mode. The checked Detailed card has no axe violations in Classic and light Glass. All 100 tests, full JavaScript and SCSS lint, production build and Firefox package validation pass. All 34 locale files share 1,268 reference keys. Preview fixtures are restored after verification.

## Habits, Air Quality and GitHub

- [x] Research official data sources, authentication, rate limits and data coverage.
- [x] Implement local Habits schedules, targets, history, streaks and management.
- [x] Implement Air Quality with location controls, AQI scales, pollutants, pollen, UV and forecasts.
- [x] Implement GitHub review requests, authored pull requests, assigned issues and workflow failures.
- [x] Integrate placement, settings, surfaces, previews, backups, resets and translations.
- [x] Verify calculations, network failures, keyboard flows, themes, narrow layouts and packages.

Verification: 97 tests pass, including calendar boundaries, scheduled streaks, concurrent habit writes, profile changes, AQI thresholds, missing readings, invalid caches, stale results, revoked tokens and partial rate limits. Browser checks cover habit creation, weekly editing, completion, city lookup, AQI switching, keyboard tabs, invalid GitHub filters and offline use. Live Open-Meteo requests cover Berlin and Los Angeles; GitHub checks use public repositories, with private authentication failures covered by fixtures. The checked cards, settings and compact editor have no axe violations after the light Glass text adjustment. Layout checks cover 1280 px and 390 px, dark/light themes and translated labels. Full JavaScript and SCSS lint, production build and Firefox package validation pass. All 34 locale files share 1,256 reference keys; machine-assisted translations still need fluent-speaker review. [Setup, options and source references](HABITS-AIR-QUALITY-GITHUB.md).

## Earlier widget and time work

- [x] Audit and complete Portfolio; use Moo's themed form controls.
- [x] Protect clock double-clicks and defer note creation until a triple-click is ruled out.
- [x] Add compact digital world clocks with inline and separate-row layouts.
- [x] Add Focus settings and navbar controls.
- [x] Add Fallback Background, recovery, work-shift and Focus switching.
- [x] Add Countdowns to notes and a menu that inherits note rotation.
- [x] Add Countdown widget, modal editor, layout and settings integration.
- [x] Verify persistence, backups, 52 regression tests, lint, build, Firefox package, accessibility and responsive layouts.

Verification: 52/52 tests pass. ESLint and Stylelint pass with no warnings or errors. Production build and Firefox package validation pass. Axe reports no violations in the checked Portfolio settings and Countdown modal. Portfolio was checked in dark/light themes and at 1280 px and 390 px. See [PORTFOLIO-AUDIT.md](PORTFOLIO-AUDIT.md) for scope and limits and [TIME-AND-COUNTDOWNS.md](TIME-AND-COUNTDOWNS.md) for usage.

## Polish follow-up

- [x] Put Focus in Navbar Widgets and rename its settings and controls.
- [x] Use switches for work-shift and Focus fallback settings.
- [x] Match the Fallback Background block to Source and shorten its description.
- [x] Keep the Sinoptik.bg page link at the standard field width.
- [x] Shorten the Countdown widget description to two lines.
- [x] Align Holdings into three equal columns, with single-line headings and borderless row actions.
- [x] Remove number steppers and move Add to the right.
- [x] Verify the changed settings, layouts and existing checks.

Polish verification: Navbar Widgets controls Focus visibility; both fallback controls expose switch roles. Sinoptik.bg uses a 300 px field. Holdings has three equal 238.7 px fields at the checked desktop size, no number steppers, borderless row actions and a right-aligned Add button. At 390 px, the Fallback description stays within two lines, Countdown copy takes two lines, and the Holdings table scrolls inside its container without widening the page. The updated Portfolio settings pass 23 applicable axe checks with no violations. All 52 tests, lint, production build and Firefox package validation pass.

## Preview and Focus control

- [x] Clip overflowing widget columns at Preview edges.
- [x] Keep Focus in one navbar control with an internal counter.
- [x] Require a red confirmation click before ending Focus.
- [x] Verify counters, confirmation, preview clipping and existing checks.

Verification: Browser checks confirm that tall columns clip at both Preview edges, Focus counts up, Pomodoro counts down, and the first click arms the red control while the second ends the session. Escape cancels confirmation. All 53 tests, ESLint, Stylelint, the production build and Firefox package validation pass.

## Labels, Holdings and weather prompts

- [x] Use Source (Fallback) in Background and Fallback Background in other settings.
- [x] Reserve one square delete control in Holdings and widen its three columns equally.
- [x] Match weather status messages to Google widget warning typography.

Verification: Browser checks show three equal 250.7 px fields and 36 × 36 px delete controls at the checked desktop size. Clicking a holding symbol opens its editor. Both weather widgets show the Sinoptik.bg prompt at 11.5 px, including with Weather set to 200% size. All 53 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass.

## Empty states, fallback settings and larger portfolios

- [x] Give empty Weather states vertical padding and a minimum height.
- [x] Open the selected fallback provider's settings from Source (Fallback).
- [x] Right-align fallback switches with Enabled/Disabled labels.
- [x] Remove the eight-stock storage, form and backup limits; show the eight largest holdings by current value.
- [x] Remove the limit from the Holdings description in every translated version.
- [x] Verify the browser flows, regression tests, lint, build and Firefox package.

Verification: Weather Full has an 80 px minimum height and 24 px vertical padding; Weather Now has 20 px vertical padding. Both fallback switch tracks align with the row's right edge, and their labels follow the enabled state. The fallback card opens the colour picker or selected API panel. A 12-stock portfolio shows eight rows, includes all twelve in its total and leaves Add available. All 55 tests, ESLint, Stylelint, the production build and Firefox package validation pass.

## Navbar To-do entries

- [x] Widen multiline task fields and use compact themed completion, delete and move controls.
- [x] Focus newly added tasks, preserve autosave and keyboard reordering, and keep the panel inside the viewport and above notes.
- [x] Verify dark desktop and light 390 px layouts, long text, empty state, adding, editing, completing, removing, reordering and reload persistence.

Verification: Task fields measure 224.7 px wide, action buttons are 28 × 28 px, and the panel keeps a 12 px viewport inset. All 55 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass.

- [x] Match task-entry borders to the standard window border and keep an unpinned panel open during dragging.

Drag follow-up verification: Pointer dragging across the panel gutter and beyond its bounds keeps all three test cards mounted; dropping reorders and saves them. Escape cancels keyboard dragging without changing the order. Outside clicks close the unpinned panel afterward. The computed entry and window border shadows match. All 55 tests, targeted lint, the production build and Firefox package validation pass.

- [x] Remove the inner field focus outline, thicken the outer card border to 2 px, and prevent dragging from moving the page sideways.

Axis and focus verification: The focused field has no border or outline; focus remains visible on the outer card. Pointer dragging left and right leaves page scroll, navbar position and panel position unchanged. Automatic scrolling is confined to the To-do list, and clipping its content prevents the dragged card from enlarging the scroll area. A 12-card list retains its measured 1128 px scroll height throughout edge dragging, stops at the end and saves the reordered cards. Keyboard reordering also passes. All 55 tests, targeted lint, the production build and Firefox package validation pass.

## Image Info map attribution

- [x] Keep attribution inside the map at its bottom edge, with small, light, partly transparent text.
- [x] Preserve attribution links and keep the expanded map available during keyboard focus.

Verification: The live map loads and the attribution stays within its bounds at desktop width. All three links use 10 px text at weight 300, with 80% white text over a translucent dark strip. Hover and keyboard focus keep the attribution visible. The narrow-layout photo had no coordinates, so map attribution was not checked there. All 55 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass.

## Park Navbar Notes and To-do

- [x] Comment out both mini-app integrations and their Navbar Widgets selectors until a future redesign.
- [x] Preserve their component files and saved content. Existing enabled or pinned preferences cannot render the parked apps.

Verification: Targeted ESLint, all 55 tests, the production build and Firefox package validation pass.

## Settings menu order

- [x] Put core page setup first, optional widgets next, and language, advanced controls and reference screens last.
- [x] Place dividers after Navbar and Misc to match these groups; use the same order in the desktop sidebar and compact screen selector.

## Feeds and translation refresh

- [x] Rename the RSS settings screen to Feeds, including its sidebar, compact selector and heading.
- [x] Extract recent Focus, fallback background, World clocks, Countdown and note messages into locale data.
- [x] Refresh all 31 active catalogues against English, preserving existing translations and interpolation tokens. Keep archived languages unavailable, with English fallback for new keys.
- [x] Localise relative countdown dates using the selected interface language and keep new form validation messages responsive to language changes.
- [x] Verify live language switching, narrow layouts, catalogue checks, lint, build and the Firefox package.

Verification: All 34 locale files contain the same 1,024 English reference keys and preserve interpolation tokens. Active catalogues include machine-assisted translations with terminology corrections; archived languages retain English fallback for new keys. Live checks cover Bulgarian, German and Arabic at 390 px, French countdown form labels, translated relative dates and immediate clock numeral changes. All 56 tests, ESLint, Stylelint, the production build and Firefox package validation pass.

## Compact countdown editor

- [x] Use Google widget form fields and compact actions for note conversion, with update rate and format on one row.
- [x] Keep the editor near its note and fit it inside the viewport when its size or the window changes.
- [x] Preserve Markdown, countdown options and the note's saved position. Support Cancel and Escape with focus returned to the note's menu control.
- [x] Verify conversion, editing, cancellation, reload persistence, dark and light themes, and a 390 px viewport.

Verification: The editor measures 320 × 369 px with 36 px text inputs and 13 px input text. A note near the bottom-right edge opens an editor that stays within the resized viewport. All 56 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass. Preview test data was restored.

## Checklists

- [x] Add Switch to List and the compact title and entry editor.
- [x] Implement Enter, Tab, Shift+Tab, indentation controls, pointer and keyboard dragging, subtree moves and subtask promotion.
- [x] Show completion progress in the footer and preserve lists through storage, Markdown conversion and backups.
- [x] Localise the controls and drag announcements; verify dark and light themes at 390 px.
- [x] Verify regression tests, lint, build and Firefox packaging.

Verification: Parent completion updates its descendants; an unchecked child also unchecks its ancestors. Progress checks cover 0%, 33% and 100%. Both pointer and keyboard moves preserve branches, and moving a subtask out makes it a normal task. Enter and indentation controls retain input focus; Escape cancels a drag before it can close the editor. Reload and note/list round trips preserve nesting and completion. All 65 tests, ESLint, Stylelint, the production build and Firefox package validation pass. Preview data was restored after the checks.

## Per-note transparency

- [x] Add a translated Transparent checkbox to each note's ⋮ menu, inheriting the global default until changed.
- [x] Persist explicit transparent and framed choices through reloads, conversions and backups.
- [x] Verify mixed appearances with the global default both enabled and disabled, and restore preview data afterward.

Verification: An unchecked note retains its frame when the global default is transparent; a checked note remains transparent when the global default is framed. All 66 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass.

## Remember content for each note type

- [x] Keep independent Note, Countdown and Checklist content and restore saved versions immediately when switching types.
- [x] Preserve legacy countdown Markdown before either the Note or Countdown version is edited.
- [x] Include inactive versions in backups and reject malformed type data.
- [x] Verify all three types, repeated switches, body editing, reload persistence and existing checks.

Verification: The browser restores the original Countdown title, date, interval, format and Markdown after Note edits. A separate Checklist retains its title, nesting and checked state; Note text remains independent. All versions survive reloads and backup round trips. All 69 tests, ESLint, the production build and Firefox package validation pass. Preview data was restored after testing.

## Checklist header controls

- [x] Keep the saved title and controls on one row, with +, ⋮ and delete aligned at the right.
- [x] Remove Add entry from below the list and retain its action as an accessible plus glyph.
- [x] Verify that + opens the editor with the new entry focused and Cancel preserves the saved list.

Verification: Header controls follow the requested order and share a common row. The title truncates rather than displacing the controls. All 69 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass. Preview data was restored.

## Countdown display styles and note menu order

- [x] Add Style below Update every and Countdown format in both countdown editors, with Value, Value + progress bar and Progress bar options.
- [x] Use the Progress clock's text colour and faint track. Show the bar-only value in a small centred uppercase pill on hover or keyboard focus.
- [x] Preserve the progress start through style edits, type switches, reloads and backups; restart it when the target date changes.
- [x] Put Transparent first in every note menu, Edit for the current type second, then Switch options in Note, Checklist, Countdown order.
- [x] Translate the new labels and verify compact layouts, persistence and existing checks.

Verification: All three styles render correctly, and the hover pill is also available with keyboard focus. Style-only edits preserve the exact target date and progress start. Browser checks cover both editors, a 390 px compact editor, dark and light themes, reload persistence and the menus for all three note types. All 73 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass. The 1,049 reference keys match across all 34 locale files. Preview data was restored after testing.

## Editable countdown start time

- [x] Show Start before the deadline in either progress-bar style, and retain its value when the field is hidden.
- [x] Save creation time for new countdowns. For legacy countdowns without a start, use the first selection of a progress-bar style.
- [x] Keep the start when editing the deadline and allow it to be changed independently, with validation before saving a bar style.
- [x] Remove the hover value's border, background and shadow.
- [x] Verify creation, legacy conversion, edited progress, hidden-field persistence and existing checks.

Verification: A legacy Value edit leaves its start unset; first selecting a bar fills Start with the current time. An edited start produces the expected progress and survives reloads. New Value countdowns save their creation time and retain it through deadline edits. Both editors show the field before the deadline; the compact editor fits at 390 px. The hover value has no background, border or shadow. All 73 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass. All 34 locale files share 1,051 reference keys. Preview data was restored.

## Image Info map loading

- [x] Load enabled location maps when Image Info is created, without waiting for hover.
- [x] Preload the legacy card's map while its expanded content is unmounted.
- [x] Preserve hover expansion and the map visibility setting.

Verification: A 450 px map finishes loading before hover; expanding the card reuses the same image without another request. The legacy card also requests its map while collapsed. All 73 tests, targeted ESLint, the production build and Firefox package validation pass. Preview settings were restored.

## Image padlock

- [x] Add unlocked and locked padlock glyphs immediately left of image deletion, using delete-confirmation red when locked.
- [x] Preserve locked position, size and tilt; retain selection and frame controls while preventing drag and resize.
- [x] Keep locked images above unlocked images and notes, including newly pasted or lifted content.
- [x] Save locks in image storage and backups, with existing images remaining unlocked by default.
- [x] Translate the controls and verify pointer and keyboard interactions, persistence and existing checks.

Verification: Dragging a locked image leaves its geometry unchanged. Another image moves behind it, and a new paste also stays below it. Reload retains the lock; clicking the image reveals its frame and red padlock. Keyboard unlocking restores the resize handle and movement. All 75 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass. All 34 locale files share 1,053 reference keys. Preview images and settings were restored after testing.

## Checklist dragging, note controls and Finnhub

- [x] Allow dragging a checklist by its title, preserving click-to-edit and individual task reordering.
- [x] Match the note menu and delete controls at 20 × 20 px with 15 px glyphs, including checklist headers.
- [x] Replace Finnhub's CORS-blocked custom authentication header with its token parameter for quotes and company currency.
- [x] Verify a live AAPL request with an authorized API key, keep credentials out of saved quote data, and restore preview settings.

Verification: Title dragging moves the complete checklist without opening its editor; clicking still edits. Individual task reordering leaves the checklist's position unchanged. Browser measurements confirm matching menu/delete dimensions. The live Finnhub call returned a positive AAPL price, USD currency and a quote timestamp. All 76 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass. Preview content and portfolio settings were restored.

## Checklist Markdown

- [x] Render Markdown in checklist titles and individual tasks: bold, italic, strikethrough, inline code, headings, quotes and list styling.
- [x] Preserve editable Markdown source through completion, task moves, title dragging, saves and reloads.
- [x] Keep edit-button markup valid, raw HTML inert, and accessibility labels free of formatting markers.
- [x] Verify the rendered styles and 390 px layout, including rapid title drags outside the card.

Verification: Browser checks cover formatted titles and tasks, source editing, completion, keyboard task reordering, title dragging and reload persistence. Links and image syntax display their labels inside edit controls without adding nested links or loading images. Raw HTML is escaped. All 77 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass. Preview content was restored after testing.

## Countdown Markdown and optional titles

- [x] Render Markdown in countdown titles with the same typography as notes, in both the widget and note versions. Preserve the existing Markdown notes and readable accessibility labels.
- [x] Make Countdown and Checklist titles optional in forms, validation, storage, type memories and backups.
- [x] Hide empty countdown title lines and retain an empty checklist header's controls and 28 px drag target.
- [x] Remove the checklist footer divider while retaining spacing above progress.
- [x] Translate the revised validation messages and accessible countdown fallback name.

Verification: Both countdown versions render formatted titles and notes. Saving empty titles preserves notes, progress settings and checklist entries, including after reload. Untitled checklist headers remain draggable, and the footer border measures 0 px. All 80 tests, targeted ESLint and Stylelint, the production build and Firefox package validation pass. All 34 locale files share 1,054 reference keys. Preview data was restored after testing.

## Checklist spacing and transparent controls

- [x] Match the progress footer's 8 px gap to the title/list gap by removing its extra top padding.
- [x] Hide the header's + control with the other controls while transparent and unfocused; retain selection and keyboard-focus visibility.
- [x] Match checklist progress to countdown and clock bars, using the text colour and a faint track instead of the signature colour.

Verification: Targeted Stylelint, the production build and Firefox package validation pass.
