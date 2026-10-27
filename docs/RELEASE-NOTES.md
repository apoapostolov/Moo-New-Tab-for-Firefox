Moo is a personal fork of [Mue](https://github.com/mue/mue) for Firefox and Zen. New profiles and resets open directly in English with digital time, Search/Ask Bar, basic weather in the bottom-left corner and Unsplash backgrounds. Enable other widgets in Settings.

The 1.0.0 archive was rebuilt on 27 October 2026. All selectable languages have complete key coverage, including machine-assisted translations that still need fluent-speaker review.

### Added

- **Google widgets.** Read mail, check appointments and manage tasks without opening three separate apps. Set up your own Google OAuth client under Settings → Google, then connect your account and choose the calendars and task list you use.
- **Search/Ask Bar.** Type a question and choose a search engine, AI service or reference site for a quick fact, documentation or a longer conversation. The menu stays visible in smaller windows.
- **Picture, video and live backgrounds.** Choose a source under Settings → Background, use your own pictures or add a live stream. Triple-click a playing video to watch it with the widgets hidden; Escape brings them back.
- **Widget layout.** Show, hide and move widgets under Settings → Overview, placing them on either side or in the centre. Centre columns scroll independently, with a scrollbar that fades after use.
- **Clock and weather.** Choose a clock and set Progress around your working days and hours under Settings → Time. Add your location under Weather to see current conditions and a five-day forecast before making plans outside.
- **RSS reader.** Enable RSS in Overview and add feed addresses under Settings → RSS to follow several sites in one list. Hover a headline to read the article when available, or open the original site.
- **Notes, pictures and quick links.** Double-click an empty part of the page to create a note, place pictures on the page and add regular destinations under Settings → Quick Links. Keep the things you need for a project within reach of the next tab.
- **Backups.** Export your setup under Settings → Advanced, with uploaded pictures included if you choose, then preview an import before applying it. Move your layout and notes to another profile while keeping sign-in credentials separate.

### Changed

### Removed

- From Mue: the setup wizard, Marketplace and Library, quotes and greetings, achievements, the old search widget, the message form, and the About sections for support, contributors, supporters, photographers and curators. Search/Ask Bar provides the current search options. Old Persian, Egyptian Arabic and South Azerbaijani were removed from the language selector because their translations are incomplete.

### Installation

The ZIP and XPI contain the same unsigned extension. In Zen builds that permit unsigned extensions, open `about:addons`, use the gear menu's **Install Add-on From File** action and select `moo-1.0.0.xpi`.

For temporary development installation in Firefox or Zen, extract `firefox-1.0.0.zip`, open `about:debugging` → **This Firefox** → **Load Temporary Add-on**, then select `manifest.json`. Temporary installation ends when the browser restarts. Normal permanent installation in Firefox requires a Mozilla-signed XPI; the XPI in this release is unsigned. See the [release process](https://github.com/apoapostolov/Moo-New-Tab-for-Firefox/blob/v1.0.0/docs/RELEASE_PROCESS.md).

The build passes 32 regression tests, lint and archive validation. Browser checks cover fresh startup, both resets, retired wizard flags, location denial, narrow/short layouts and scrolling. Real Google account operations, fluent-speaker translation review and sustained memory/CPU profiling still need verification; see the [audit record](https://github.com/apoapostolov/Moo-New-Tab-for-Firefox/blob/v1.0.0/docs/REFACTOR-PROGRESS.md).
