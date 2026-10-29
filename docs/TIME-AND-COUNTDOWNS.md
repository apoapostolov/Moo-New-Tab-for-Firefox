# Time, Focus and Countdowns

## Clock gestures and world clocks

When Progress has double-click switching enabled, double-clicking the clock only changes between Progress and its normal clock. The same interaction cannot create a note. Background double-clicks wait for the 700 ms triple-click window to finish; a nearby third press cancels the pending note.

Settings → Time includes World clocks. Add a location label and time zone, then choose a separate row or placement beside the location clock. Up to six compact clocks can be shown. They follow the digital clock's 12/24-hour format, leading-zero, seconds and numeral preferences, including while the location clock shows Progress. Time-zone conversion follows daylight-saving changes.

## Focus

Enable Focus under Settings → Navbar → Widgets. Settings → Focus controls its session mode. Focus keeps Time and Date, where enabled, and hides the other widgets, notes and pasted images until the session ends. Pomodoro alternates work sessions and breaks, with configurable work, short-break and long-break durations and a work-session count before each long break. The navbar uses one Focus control. Starting a session shows its counter inside the control: elapsed time for Focus, or time remaining for Pomodoro. Click once to turn the control red, then again within four seconds to end the session. Moving focus away or pressing Escape cancels confirmation. Widgets return during Pomodoro breaks.

Timers use saved deadlines rather than counting ticks, so suspended tabs catch up when opened again. The active session is shared between tabs on the same origin and is excluded from backups.

## Source (Fallback)

Settings → Background places Source (Fallback) below the primary Source. Click its card to open the selected provider's settings. It uses the same provider options and API keys, with a separate colour/gradient setting. Custom images use the existing uploaded background collection. The bundled offline image is the final recovery source if both providers fail.

The Fallback Background handles missing provider content and failed image or video playback. It can also be selected during active Progress work shifts or during Focus and Pomodoro work sessions. Primary provider settings remain saved. After the temporary condition ends, the primary provider returns; a work shift can continue to require the Fallback Background after a Focus session ends.

## Floating Countdowns

Enable Floating Notes in Settings → Floats. Double-click empty background space, open the ⋮ menu beside the delete button and choose Switch to countdown. The menu inherits the note's rotation. The form accepts an optional title, local date and time, update interval, display format and multiline Markdown notes. Titles and notes both render Markdown, including bold, italic, strikethrough, code, headings and quotes. The editor keeps the original Markdown source. An empty title leaves no title line on the countdown. Five minutes is the default update interval. Choose one second when a display with seconds should tick every second.

The result can be dragged, edited and removed like a note. Use the same menu to edit its countdown or switch back to the saved Note version. Human-readable countdowns describe past dates after the deadline; exact countdowns stop at zero.

Style appears below Update every and Countdown format. Choose Value, Value + progress bar or Progress bar. Either bar style reveals an editable Start timestamp before the target date. New countdowns remember their creation time as the default start, including when saved with Value style. Legacy countdowns without a start time use the moment a bar style is first selected. Switching styles hides or reveals the field without losing its value; editing the deadline also preserves the start. The start must precede the deadline when using a bar.

The bar uses the Progress clock's text colour and faint track, and fills from the saved start time to the target date. In Progress bar style, hovering over the bar or focusing it with the keyboard shows the remaining value in small uppercase text at its centre. When the fill reaches the label, a rounded translucent background keeps the value readable, without a border. The overlap point follows the label's width, including translated text. Existing countdowns use Value until changed.

## Countdown widget

Enable the Countdown widget in Settings → Floats or Overview. Use + on the widget to open its modal form. Each entry has its own date, update interval, format, style and Markdown notes. The edit control opens the same form; removal requires a second click. Overview controls its placement, and Floats includes the existing Classic/Glass panel choice. Countdowns no longer has a separate settings page; older links open Floats.

Countdowns in notes and in the widget are included in backups. Profile resets that keep personal data also retain countdowns and world-clock locations.

## Floating Lists

Open a note's ⋮ menu and choose Switch to List. The compact editor accepts an optional title and entries; existing note lines become entries, and Markdown task lists retain their checked state and nesting. The editor uses the same fields and actions as the compact countdown editor. Untitled lists retain the header's drag area and controls.

The saved checklist's header shows its title on the left, with +, ⋮ and delete controls on the right. Use + to open the editor with a new entry ready to type.

Drag the title to move the whole checklist. Clicking the title without dragging opens its editor; entry grab handles reorder individual tasks.

Titles and individual tasks render Markdown, including **bold**, *italic*, ~~strikethrough~~, inline code, headings and quotes. Edit the original Markdown in the title and entry fields. Formatting stays with each task when it is checked, indented or reordered. Link and image markup displays its text label inside the edit control; raw HTML remains text.

Press Enter in an entry to add the next one at the same level. Tab indents an entry under its preceding sibling; Shift+Tab moves it out. The indentation controls offer the same actions. Arrow keys move between text fields, and Backspace on an empty entry removes it. Lists support three nested levels and up to 500 entries.

Use a grab handle to reorder entries in the editor or on the saved list. A parent moves with its subtasks. Moving a subtask to a top-level position, or dragging its handle left, makes it a normal task. Keyboard users can press Space on a handle, move with the arrow keys and press Space to drop; Escape cancels the move without closing the editor.

Checking a parent completes its subtasks. Unchecking a subtask also unchecks its ancestors. The footer shows a progress bar and the percentage of completed, nonempty entries, including subtasks. Removing a parent keeps its children and moves them out one level.

Save applies editor changes; Cancel or Escape leaves the saved list unchanged. The ⋮ menu can reopen the editor or switch to another type. Returning to Checklist restores its title, entries, nesting and completion state. Checklists use the existing note storage and are included in backups and personal-data-preserving resets.

## Switching note types

Each note can display Note, Checklist or Countdown. These types keep separate saved content: Note keeps its Markdown text; Checklist keeps its title, entries and completion state; Countdown keeps its title, target date, update interval, display format, style, progress start time and Markdown notes. Editing one type does not overwrite the others.

The ⋮ menu places Transparent first, then Show in Focus, followed by Edit for the current type. The remaining Switch options follow the order Note, Checklist, Countdown, omitting the current type.

The first conversion opens the target type's editor, using the current content as a starting point. Save creates that version; Cancel keeps the current type. Once a version exists, switching back restores it immediately. Use its edit option to change it. All three versions survive reloads and backups, and share the note's position, tilt and transparency preference. A countdown's target date stays fixed while another type is shown, so its remaining time reflects the time that has passed when it returns.

## Note transparency

The Transparent checkbox in each note's ⋮ menu controls its resting appearance. Floating Notes, Lists and Countdowns follow Settings → Floats → Transparent by default until you change their individual checkbox. That choice stays with the note through countdown and checklist conversions, reloads and backups. Transparent notes bring their frame back while focused, edited or dragged.

## Floating Images

Click a pasted image to reveal its frame and controls. The padlock immediately left of Delete switches between unlocked and locked icons; a locked padlock uses the same red as delete confirmation. Locking preserves position, size and tilt, and places the image above unlocked images and notes. Selecting or moving unlocked content cannot raise it over a locked item. Locked images keep their relative stacking order when selected.

Clicking a locked image still reveals its frame, copy, download and delete controls. Unlock it to move or resize it again. Lock state is saved with the image and included in backups.

## Standard and Focus workspaces

Settings → Overview has a Standard / Focus selector. Each layout keeps its own widget visibility, order, side placement and centre lanes. Editing this selector previews that layout without starting a Focus session. Focus initially keeps the clock and date; enable any additional widgets in its Overview layout.

An active Focus or Pomodoro work session, or a scheduled work shift while the clock uses Progress mode, selects the Focus layout. Breaks, paused sessions and time outside the shift use Standard unless another active Focus or shift still applies. Shift boundaries follow the clock timezone and working-day rules, including overnight shifts. Fallback Background switches do not control workspace selection.

Quick Links → Separate Focus/Work is off by default. Enabling it shows a second editable list beneath Standard and makes Quick Links available in Focus unless you explicitly hide it in the Focus layout. The second list replaces the normal list during Focus or a Progress work shift. Disabling the setting keeps that list saved. Both lists share appearance and link-opening preferences.

Floating Notes, Lists and Countdowns have Show in Focus directly below Transparent in their ⋮ menu. Click a Floating Image to reveal its ⋮ menu and the same checkbox. Existing items are unchecked and remain in Standard; checked items appear in both workspaces. Items created during Focus are checked automatically. Their positions and contents are shared, and hidden items remain saved. The preference survives note-type conversions, reloads and backups.

## Floating item locks

Floating Notes, Lists and Countdowns have a padlock immediately left of Delete, matching Floating Images. The unlocked icon switches to a red locked icon when selected. A locked item keeps its position and tilt, ignores drag and movement keys, and stays above unlocked floating content. Selecting it still reveals its frame and controls. Editing text, checking tasks and changing note type remain available.

Locked items share one stacking order across notes and images; selecting an existing lock keeps that order. Unlock an item to move it again. Lock state survives type changes, reloads and backups. Transparent items hide the padlock with their other controls while unfocused.
