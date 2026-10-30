# Moo documentation

Use the product's formal feature names in README and changelog labels, such as Google widgets, Search/Ask Bar, RSS reader, Widget layout and Backups. Explain capability, operation and practical use in plain prose. Avoid promotional lead-ins and bolded benefit claims.

Moo's release summaries use at most nine top-level bullets in total. For the initial 1.0.0 changelog, keep Changed empty and collect the features removed from Mue into one Removed bullet. These are Moo-specific formatting choices; do not copy them into shared guidance for other projects.

Keep README, CHANGELOG.md and release notes factually consistent. A documentation edit does not authorize moving the published v1.0.0 tag or replacing its archive.

## String exports for String Theory

String Theory is a local studio for rewriting UI strings against the width the layout really gives them. It wraps the text in the declared font, compares the line count and the widest line to the allowance, and hands replacements back by id. The tool is at `C:\git-public\string-theory`, public at <https://github.com/apoapostolov/string-theory> (MIT). `docs/format.md` there is canonical; this section records where Moo's copy and numbers come from.

### Where the strings are

`src/i18n/locales/en_GB.json` is the fallback catalogue and the key reference (`docs/TRANSLATING.md`). Keys are nested objects resolved with dots by `useT()`, so the export id is the dotted path, for example `modals.main.settings.surface.title`. Placeholders such as `{name}`, `{count}` and `{time}` stay in the text.

### Units

Moo is a web surface, so a CSS pixel is the tool's pixel with no conversion. The page font is user-configurable in Settings, and the default is `Inter` from `src/scss/_variables.scss`; declare `Inter` in the export and treat the budget as the default-font case.

### The numbers

| Field | Where it comes from in this app |
| --- | --- |
| `maxPxPerLine` | The container, not the window. `%widgetCard` is `width: var(--widget-card-width, 340px)` with `padding: 12px 14px`, so a widget label has a 312px box unless the widget overrides the width variable. The settings modal is `clamp(60vw, 1400px, 90vw)` wide, but its columns are much narrower, so read the column. |
| `maxLines` | `white-space: nowrap`, a single-line button or a tile label is 1. `.subtitle` hints take 2 in a narrow settings window, which is the window `docs/TRANSLATING.md` asks you to check copy in. |
| font | The typography beside the rule: `.title` is 18px, `.subtitle` is 14px, `%widgetCard` is 13px on a 1.4 line height. Weights come from the component, not the card. |

A worked entry, the widget card label:

```json
{
  "id": "widgets.quicklinks.new",
  "text": "New Link",
  "where": "Quick Links widget, add tile inside the widget card padding",
  "maxPxPerLine": 312,
  "maxLines": 1
}
```

### Handing it over

1. Write `C:\git-public\string-theory\inbox\moo\moo.strings.json`. The envelope carries `app`, one `context` line and `font` of `{"family": "Inter", "size": 13, "weight": 400}`; the settings modal strings at 18px and 14px carry their own `font`.
2. One file per surface, so widget copy, settings copy and modal copy can be reviewed separately without a 4000-line list.
3. Validate before calling it ready: `node C:\git-public\string-theory\scripts\validate-export.mjs <file>`, exit 0 with no errors.
4. When a key is shared by several surfaces, budget it for the narrowest one and say so in `where`.
