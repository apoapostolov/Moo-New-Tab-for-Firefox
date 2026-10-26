# Moo

<p align="center">
  <img src="assets/icon.png" alt="Moo icon" width="96" />
</p>

<p align="center">
  <strong>A fast, open and free-to-use new tab page for Firefox.</strong><br />
  A simplified, Firefox-focused personal fork of <a href="https://github.com/mue/mue">Mue</a>.
</p>

<p align="center">
  <img src="assets/moo-newtab.gif" alt="Moo new tab page with a looping video background" width="800" />
</p>

## What is Moo?

Moo is a new-tab page extension for Firefox (Manifest V3). It is a personal,
simplified fork of [Mue](https://github.com/mue/mue) (BSD-3-Clause) that
targets Firefox only and removes features that are no longer maintained or
needed: Marketplace, Library, quotes, greetings, the achievement system and
search (deprecated in Mue 7.2).

It keeps the parts that matter: a clean clock, date, quick links, notes, todo,
weather, backgrounds and a configurable navbar — all customisable.

## Features

- Firefox-focused build (Manifest V3, `browser_specific_settings.gecko`)
- Beautiful and minimalist design
- Customisable layout and widget order
- Widgets: clock, date, quick links, notes, todo, weather
- Privacy-focused — does not track your browsing activity
- Open source under the BSD-3-Clause License
- Bulgarian (bg) locale included

## Installation (sideload)

Moo is not published to the Firefox Add-ons store. Sideload the built `.xpi`:

1. `bun install`
2. `bun run build`
3. Open Firefox (or Zen) and go to `about:debugging` → **This Firefox** → **Load Temporary Add-on** → select `build/firefox/manifest.json`

For a permanent install in Zen/Firefox, copy `build/firefox-1.0.0.zip` (renamed to
`moo@apoapostolov.xpi`) into your profile's `extensions/` folder and set
`xpinstall.signatures.required = false` in `about:config` (unsigned extensions).

## Development

- `bun install` — install dependencies
- `bun run dev` — development server with HMR
- `bun run build` — production build for Firefox (`build/firefox/`, `firefox-1.0.0.zip`)
- `bun run lint` / `bun run pretty` — lint / format

## Credits

Moo is a fork of [Mue](https://github.com/mue/mue) by The Mue Authors
(BSD-3-Clause). Mue's original code, design and assets remain credited to
their authors. Moo is a personal, simplified derivative and is not affiliated
with or endorsed by the Mue project.

Stock photos: [Pexels](https://pexels.com), [Unsplash](https://unsplash.com).
Stock video: [Coverr](https://coverr.co), [Pixabay](https://pixabay.com),
[Pexels](https://pexels.com). Live channels: WildEarth, ZenLIFE, Love Nature and
Red Bull TV, found through the [iptv-org](https://github.com/iptv-org/iptv)
index; each stream remains the property of its broadcaster.
Welcome modal images: [Undraw](https://undraw.co).

## License

BSD-3-Clause. See [LICENSE](LICENSE). The original copyright notice for
Mue is preserved in the `LICENSE` file, as required by the license.
