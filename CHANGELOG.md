# Moo changelog

## Unreleased

Google Calendar adds a centred, scrollable event hover with recurrence, guests, full descriptions, conferencing, reminders, attachments and event settings. Locations have an on-demand OpenStreetMap preview. [Details](docs/GOOGLE-CALENDAR.md).

Overview saves separate Standard and Focus widget layouts, including visibility, order and placement. Focus sessions and scheduled Progress clock work shifts activate the Focus layout. Quick Links can use a separate Focus/Work list, and floating items have a Show in Focus checkbox. Quick Links occupies a full-width centre row above paired widgets.

Bookmarks combines local browser bookmarks, Raindrop, Readwise Reader and Daily Review highlights in one Google-style widget. Independent source switches mix enabled libraries before Latest, Most opened, Mixed, Shuffle or Rediscover selection, with shared filters, repeat avoidance and a centred detail preview. [Setup and options](docs/BOOKMARKS.md).

GitHub uses status glyphs and compact count tabs, with full issue/PR descriptions and developer details in a hover preview. The header keeps only reload.

Floats brings Floating Notes, Floating Lists, Floating Images and Floating Countdowns together in Settings, including the Countdown widget controls. Misc keeps Triple click to hide the UI. Padlocks keep Floating Notes, Lists, Countdowns and Images fixed above unlocked floating content. Saved content and preferences carry over.

Habits uses the standard widget width with two-click daily confirmations, milestone progress rings and earned streak badges. Full names, details, monthly history and an Edit glyph appear in the hover panel; today's completion bar stays above the table.

Air Quality now defaults to a compact reading, with Summary and Detailed views for forecasts and measurements. It matches Weather's width in the side columns. Settings links use bold theme text.

Habits tracks daily, weekday and weekly targets with local history and streaks. Air Quality adds European and US AQI, pollutants, UV, pollen and forecasts from Open-Meteo / CAMS. GitHub brings review requests, authored pull requests, assigned issues and workflow runs into a read-only widget. Each has Classic and Glass panels, layout controls and its own settings. [Setup and options](docs/HABITS-AIR-QUALITY-GITHUB.md).

RSS reads a Feedly account as well as the feed list. Paste a developer token under Settings → Feeds; the card shows the unread total, opens the article from Feedly's own copy and marks a story read when you open it. Feedly allows 50 calls a day on that token, so the card spends one call per refresh and Settings reports what is used.

RSS imports and exports OPML. Choose a file another reader exported to add its feeds, keeping the folders they came from; Save file writes the whole list back as OPML.

## 1.0.0 — 26 October 2026

Moo is a personal fork of [Mue](https://github.com/mue/mue) for Firefox and Zen. New profiles and resets open directly in English with digital time, Search/Ask Bar, basic weather in the bottom-left corner and Unsplash backgrounds. Enable other widgets in Settings.

The 1.0.0 archive was rebuilt on 27 October 2026. All selectable languages have complete key coverage, including machine-assisted translations that still need fluent-speaker review.

### Added

- **Google widgets.** Read mail, check appointments and manage tasks without opening three separate apps. Set up your own Google OAuth client under Settings → Google, then connect your account and choose the calendars and task list you use. Calendar and Tasks accept English scheduling phrases with a Natural Format guide, notes and a review of the interpreted fields. [Supported syntax](docs/NATURAL-FORMAT.md).
- **Search/Ask Bar.** Type a question and choose a search engine, AI service or reference site for a quick fact, documentation or a longer conversation. The menu stays visible in smaller windows.
- **Picture, video and live backgrounds.** Choose a source under Settings → Background, use your own pictures or add a live stream. Triple-click a playing video to watch it with the widgets hidden; Escape brings them back.
- **Widget layout.** Show, hide and move widgets under Settings → Overview, placing them on either side or in the centre. Weather and Image Info match the Google card width in the centre; split columns scroll independently with a scrollbar that fades after use.
- **Clock and weather.** Choose a clock and set Progress around your working days and hours under Settings → Time. Add your location under Weather to see current conditions and a five-day forecast before making plans outside.
- **RSS reader.** Enable RSS in Overview and add feed addresses under Settings → RSS to follow several sites in one list. Hover a headline to read the article when available, or open the original site.
- **Notes, pictures and quick links.** Double-click an empty part of the page to create a note, place pictures on the page and add regular destinations under Settings → Quick Links. Notes support Markdown links, images and tables, with a fading scrollbar while editing long notes.
- **Backups.** Export your setup under Settings → Advanced, with uploaded pictures included if you choose, then preview an import before applying it. Move your layout and notes to another profile while keeping sign-in credentials separate.

### Changed

### Removed

- From Mue: the setup wizard, Marketplace and Library, quotes and greetings, achievements, the old search widget, the message form, and the About sections for support, contributors, supporters, photographers and curators. Search/Ask Bar provides the current search options. Old Persian, Egyptian Arabic and South Azerbaijani were removed from the language selector because their translations are incomplete.
