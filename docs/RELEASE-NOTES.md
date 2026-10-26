The first Moo release brings mail, plans, notes and a place to look things up to the Firefox new-tab page, with a layout you can arrange around them. Moo is a personal fork of [Mue](https://github.com/mue/mue).

### Added

- **Google widgets.** Read mail, check appointments and manage tasks without opening three separate apps. Set up your own Google OAuth client under Settings → Google, then connect your account and choose the calendars and task list you use.
- **Search/Ask Bar.** Type a question and choose a search engine, AI service or reference site from the menu. Use it for a quick fact, documentation or a question you want to talk through.
- **Picture, video and live backgrounds.** Choose a source under Settings → Background, use your own pictures or add a live stream. Triple-click a playing video to watch it with the widgets hidden; Escape brings them back.
- **A layout you can arrange.** Show, hide and move widgets under Settings → Overview, placing them on either side or in the centre. Keep mail beside your plans on a wide window, with a scrollable layout for narrow splits.
- **Clock and weather.** Choose a clock and set Progress around your working days and hours under Settings → Time. Add your location under Weather to see current conditions and a five-day forecast before making plans outside.
- **RSS reader.** Enable RSS in Overview and add feed addresses under Settings → RSS to follow several sites in one list. Hover a headline to read the article when available, or open the original site.
- **Notes, pictures and quick links.** Use New note for reminders, place pictures on the page and add regular destinations under Settings → Quick Links. Keep the things you need for a project within reach of the next tab.
- **Backups.** Export your setup under Settings → Advanced, with uploaded pictures included if you choose, then preview an import before applying it. Move your layout and notes to another profile while keeping sign-in credentials separate.

### Changed

### Removed

- From Mue: Marketplace and Library, quotes and greetings, achievements, the old search widget, the message form, and the About sections for support, contributors, supporters, photographers and curators. Search/Ask Bar provides the current search options.

### Installation

Download and extract `firefox-1.0.0.zip`. In Firefox or Zen, open `about:debugging` → **This Firefox** → **Load Temporary Add-on**, then select the extracted `manifest.json`.

**This is an unsigned development build.** Temporary installation ends when the browser restarts. Normal permanent installation in Firefox requires a Mozilla-signed XPI; renaming the ZIP does not sign it. See the [release process](https://github.com/apoapostolov/Moo-New-Tab-for-Firefox/blob/v1.0.0/docs/RELEASE_PROCESS.md).

The release passed 28 regression tests, lint, the production build and archive validation in GitHub CI. Layout checks used headless Chromium; installed Firefox/Zen and real-account operations still need verification. The [audit record](https://github.com/apoapostolov/Moo-New-Tab-for-Firefox/blob/v1.0.0/docs/REFACTOR-PROGRESS.md) covers the remaining checks.
