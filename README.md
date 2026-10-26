# Moo

<p align="center">
  <img src="assets/icon.png" alt="Moo icon" width="96" />
</p>

<p align="center">
  <strong>A fast, open and free-to-use new tab page for Firefox.</strong><br />
  A simplified, Firefox-focused personal fork of <a href="https://github.com/mue/mue">Mue</a>.
</p>

<p align="center">
  <img src="assets/moo-newtab.gif" alt="Moo with an alpine clouds video background and fictional mail, calendar and tasks" width="800" />
</p>

The preview uses fictional mail, events, tasks and weather. [Compare the three video backgrounds](assets/previews/README.md).

Bugs and requests: [issues](https://github.com/apoapostolov/Moo-New-Tab-for-Firefox/issues).

## What is Moo?

Moo is a new-tab page extension for Firefox (Manifest V3). It is a personal,
simplified derivative of [Mue](https://github.com/mue/mue) (BSD-3-Clause) that
targets Firefox only and removes features that are no longer maintained or
needed: Marketplace, Library, quotes, greetings, the achievement system and
search (deprecated in Mue 7.2).

It keeps the parts that matter: a clean clock, date, quick links, notes, todo,
weather, backgrounds and a configurable navbar — all customisable.

## Features

- Clock, date, weather, quick links, RSS, notes and pictures on the page
- Optional Google mail, calendar and task widgets
- Local pictures, stock video and live backgrounds
- Widget placement, compact layouts and panel/glass surfaces
- Versioned backups, optional pictures, validated import preview and separate reset scopes
- Local settings and counters; optional services make the connections described in [Data and connections](docs/PRIVACY.md)

## Installation

For development, install Bun 1.3.1 and Node 22, then run:

```sh
bun install --frozen-lockfile
bun run build
node scripts/validateFirefox.cjs
```

In Firefox or Zen, open `about:debugging` → **This Firefox** → **Load Temporary Add-on** and select `build/firefox/manifest.json`. This is a temporary development installation. The browser preview at localhost covers layout but cannot exercise Google sign-in or extension permission prompts.

The ZIP in `build/` is unsigned. A normal permanent Firefox installation requires a Mozilla-signed XPI; renaming the ZIP does not sign it. See the [release process](docs/RELEASE_PROCESS.md) and Mozilla's [signing overview](https://www.extensionworkshop.com/documentation/publish/signing-and-distribution-overview/). Zen installation behavior should be checked against the installed Zen version.

## Development

- `bun run dev` starts the local preview.
- `bun run test` runs regression fixtures; `bun run lint` checks JavaScript and styles.
- `bun run build` writes `build/firefox/` and `build/firefox-<version>.zip`.
- `node scripts/validateFirefox.cjs` checks package references and versions.
- [Translation guide](docs/TRANSLATING.md), [release process](docs/RELEASE_PROCESS.md) and [audit](docs/AUDIT-2026-10-26.md).

## Credits

Moo builds on [Mue](https://github.com/mue/mue) by The Mue Authors
(BSD-3-Clause). Mue's original code, design and assets remain credited to
their authors. Moo is a personal, simplified derivative and is not affiliated
with or endorsed by the Mue project.

Stock photos: [Pexels](https://pexels.com), [Unsplash](https://unsplash.com).
Stock video: [Coverr](https://coverr.co), [Pixabay](https://pixabay.com),
[Pexels](https://pexels.com). Live channels: thirty free-to-stream nature, travel,
weather and documentary channels, found through the
[iptv-org](https://github.com/iptv-org/iptv) index; each stream remains the property
of its broadcaster.
Welcome modal images: [Undraw](https://undraw.co).

## License

BSD-3-Clause. See [LICENSE](LICENSE). The original copyright notice for
Mue is preserved in the `LICENSE` file, as required by the license.
