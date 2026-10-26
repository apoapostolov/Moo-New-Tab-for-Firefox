Moo 1.0.0 is the first tagged release of this Firefox-focused fork of [Mue](https://github.com/mue/mue). It puts your clock, weather, links, notes and optional Google widgets on a new-tab page you can arrange around a picture, video or live background.

- Read Google mail, see calendar events and manage tasks from the page. Calendar editing respects the account's access to each calendar.
- Arrange widgets across the page, with a scrollable layout for narrow or short windows and keyboard controls for moving widgets.
- Keep notes and pictures locally. Backups can include uploaded pictures, show a preview before import and keep sign-in credentials separate. Settings reset and local-data erasure are separate actions.
- Follow RSS feeds when you want them. RSS starts off and appears in the centre above Mail when enabled.
- Choose stock, local or live backgrounds. The README shows the selected Alpine clouds video with fictional mail, events, tasks and weather.

Language files load as needed. The main JavaScript entry is about 669 KB before compression, down from 1.62 MB during development; startup speed has not been measured.

### Installation

Download `firefox-1.0.0.zip` and extract it. In Firefox or Zen, open `about:debugging` → **This Firefox** → **Load Temporary Add-on** and select the extracted `manifest.json`.

**This is an unsigned development build.** Temporary installation ends when the browser restarts. Normal permanent installation in Firefox requires a Mozilla-signed XPI; renaming the ZIP does not sign it. See the [installation and release instructions](https://github.com/apoapostolov/Moo-New-Tab-for-Firefox/blob/v1.0.0/docs/RELEASE_PROCESS.md).

### Verification

All 28 regression tests, JavaScript and style lint, the production build and archive validation pass locally. Layout and selected interactions were checked in headless Chromium. Installed Firefox/Zen, connected-account operations, screen-reader use and sustained memory/CPU profiling still need verification; see the [audit record](https://github.com/apoapostolov/Moo-New-Tab-for-Firefox/blob/v1.0.0/docs/REFACTOR-PROGRESS.md).
