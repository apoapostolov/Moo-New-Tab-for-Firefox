# Google Calendar event preview

Hover an agenda event to read its details beside the Calendar widget. The panel stays centred vertically, uses the same reader surface as Gmail and scrolls internally. Moving into the panel keeps it open. Focus an event with the keyboard to preview it, to read the preview without a separate row icon. Escape or Close dismisses it and returns focus to the trigger.

The preview includes the full event description, start and end dates, all-day status, event timezone and your local start time when those zones differ. When, start and end share one row separated by dots. The event zone and your local time sit at opposite ends of the next row. Repeat summaries, calendar-default reminder labels and edit access sit beside their section headings. Long date text stays on one line with an ellipsis and its full value available on hover. All-day end dates are shown inclusively, although Google stores an exclusive end date. Calendar descriptions retain basic formatting and safe links; scripts, remote pictures, embedded pages, styles and source HTML attributes are not inserted.

Repeated events show the series pattern, selected weekdays, interval and any occurrence count or end date. Expanded calendar instances do not contain their parent rules, so Moo reads the series separately. Changes made to an individual occurrence retain that occurrence's own time, location and other details. Exact recurrence rules and exception dates are available in an expandable section. Unusual rules retain their exact representation rather than receiving a misleading simplified summary.

Guests show names, addresses, response glyphs, optional or resource status, additional guests and comments when Google supplies them. Organizer and creator are shown separately. When Google uses a secondary calendar as the organizer, Moo shows the known organizer attendee or event creator instead of the calendar address. Matching account or attendee names fill missing names; an address remains the fallback when no name is available. Organizer addresses are not repeated beneath their names. A partial guest list is marked as partial; Moo cannot recover details that Google has not shared with the connected account.

Conference details include the join link, dial-in entries and available access codes. The preview also shows event or calendar-default reminders and linked attachments. Event settings includes status, availability, visibility, event type, guest permissions, edit access, creation/update times and calendar identifiers. Working-location and automatic-decline details appear when present.

Passed and In progress pills appear before the agenda time and update while the page is open.

Natural Format in the Calendar and Tasks editor headers explains their supported English phrases. [Syntax and interpreter audit](NATURAL-FORMAT.md).

The Edit glyph opens Moo's existing event editor for title, dates, location and description. Open in Google Calendar opens Google's complete event interface for invitations, advanced repeat changes and other Calendar controls. Read-only calendars and locked event copies do not offer Moo's Edit action.

## Location maps

Choose Show map beneath a location to load its OpenStreetMap preview. An address is looked up through Photon only after this action, not when the agenda loads or when an event is hovered. If a location already contains coordinates, address lookup is unnecessary. Several matches are offered in a compact selector with their resolved addresses. No match, a failed service or offline mode leaves the location text and OpenStreetMap search link available.

The map is a compact preview; opening it launches OpenStreetMap with its marker. Its attribution remains visible. The map does not consume the event reader's scroll gestures. Neither map service receives a Google token, event description or guest list. Address matches stay in a bounded, short-lived memory cache scoped to the connected account.

## Data and requests

Event details use the existing Google sign-in scopes. Full event and parent-series responses are cached in memory for five minutes, with keys including the account, authentication revision, calendar and event. New edits invalidate that cache. Pending requests are aborted when a preview closes, and an account change cannot commit an obsolete response. A failed detail request leaves the agenda information readable; a missing series does not hide the individual occurrence.

The interface and request behavior follow the [Google Calendar event resource](https://developers.google.com/workspace/calendar/api/v3/reference/events) and [event retrieval documentation](https://developers.google.com/workspace/calendar/api/v3/reference/events/get). Address matching uses the public [Photon API](https://github.com/komoot/photon), with lookups limited to explicit user actions and cached results. Photon offers no service-availability guarantee; OpenStreetMap remains available as a direct link when lookup fails.
