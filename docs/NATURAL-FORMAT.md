# Natural Format

Calendar and Tasks editors accept English phrases in the title. Natural Format in the header opens a guide on hover, keyboard focus or click. Escape closes the guide before closing the editor. Recognition happens locally after typing pauses. Save reads the latest sentence immediately, so a quick submission uses the same field mapping as the preview.

Only title edits activate recognition on an existing record. Opening and saving an unchanged event or task preserves its title, dates and notes. Manually changed fields take priority over extracted values. Check the interpretation beneath the title and the editable fields before saving.

## Calendar

| Detail | Examples |
| --- | --- |
| Day | tomorrow; next Friday; in two business days; 12 November 2027; 2027-11-12 |
| Numeric date | 12/11/2027 means 12 November; dotted dates need on or by |
| Time | at 9:30; at nine o’clock; quarter to five in the afternoon; noon |
| Time range | from 9 to 5pm; between 9am and 11am; at 11pm until 1am |
| Length | for 90 minutes; for 1h30m; for an hour and a half |
| Both endpoints | Conference; starts 12 Nov at 9am; ends 13 Nov at 5pm |
| All day | Holiday from 2026-12-24 through 2027-01-03 all day |
| Location | at the office; at "Studio 54"; location: "Sofia, Bulgaria" |
| Notes | notes: Bring ID; description: "Discuss tomorrow" |
| New-event repeat | every Monday and Thursday; every other week on Friday; every last Friday of the month; every month on the 1st |
| Repeat boundary | for six occurrences; until 31 Dec 2027. Choose one boundary. |
| New-event calendar | calendar: "Work" matches a supplied writable calendar name |

Fields can precede or follow the title. Semicolons delimit explicit notes, location and calendar fields; quotes protect literal text from interpretation. A date alone creates an all-day event. Clock-only new events use today; clock-only edits retain the selected day. Morning, afternoon and evening with a date use 09:00, 15:00 and 19:00 when no clock is given. Times use the browser’s local timezone. Overnight ranges advance the end to the following day; explicit multi-day ends retain their date. Invalid dates and clocks are left as text instead of being rolled into another date.

For example: Tomorrow from 9 to 10:30, planning at the office; notes: Bring the figures. Another: Design review every other week on Monday and Thursday at 4pm for six occurrences. Timed repeat rules include the local timezone for expansion across daylight-saving changes. All-day repeat endings use a date; timed endings include the final local day. Repeat rules and calendar changes are interpreted for new events only. Use Google Calendar to change an existing recurring series.

## Tasks

Task phrases cover the title, due day, notes and a status set with status: done or status: open. For example: Please remind me to send the invoice by the day after tomorrow; notes: Keep a copy; status: done. Notes can also be set with description.

Clock times and unsupported repeat clauses remain in task titles. The Tasks API stores only the scheduled day and exposes no recurrence field. Task titles and notes are checked against its 1,024 and 8,192 character limits. Selecting a task list and the separate Complete/Reopen actions retain their existing behavior.

This is a bounded English interpreter. It does not create guests, reminders, conferencing, attachments or timezone overrides from sentences. These are available through the full Google Calendar interface. It does not guess vague quantities such as a few.

## Audit coverage

The regression corpus covers reordered clauses, 120 field-order permutations, named and numeric dates, explicit years, business days, all-day and timed ranges, overnight ends, compound lengths, colloquial clocks, recurrence intervals and boundaries, quoted literals, notes, task status, manual overrides and unchanged records. Every shipped placeholder example is exercised. The audit corrected partial-date rollover, dropped notes, incomplete weekday lists, wrong meridiem inference, early-save races and automatic interpretation of saved titles. Browser fixtures inspect the actual request payloads without changing a connected account.

References: [Google Calendar events](https://developers.google.com/workspace/calendar/api/v3/reference/events), [Google Tasks fields and limits](https://developers.google.com/workspace/tasks/reference/rest/v1/tasks).
