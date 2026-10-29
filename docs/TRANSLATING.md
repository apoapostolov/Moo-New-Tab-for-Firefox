# Translating Moo

Moo keeps its locale files in `src/i18n/locales`. UK English (`en_GB.json`) is the fallback and key reference; US English has its own file. Existing locale tags such as `pt_BR` and `zh_Hant` are retained. The app loads English and the selected locale, with English used for missing keys.

Edit a locale file and submit the change to Moo's repository. Upstream Mue's Weblate project is not a submission destination for Moo-specific strings. Keep placeholders and interpolation syntax unchanged, and check the text in a narrow settings window. Hints should explain what the setting does in ordinary language, without implementation terms or promotional claims.

Run `bun run translations:percentages` to regenerate coverage from the local UK English keys. Coverage measures present, nonempty keys; copied English text still counts as present, so the number is not a measure of translation quality. Some translations include machine-assisted drafts and need fluent-speaker review. Prefer short, natural widget labels where possible, without sacrificing their meaning. Preserve existing reviewed translations rather than replacing them solely to increase coverage.

Old Persian, Egyptian Arabic and South Azerbaijani are no longer offered in the language selector because their translations could not be completed reliably. Their locale files remain available for existing profiles and future work.

Legacy strings and dormant feature keys remain available for reuse. New visible literals belong in the locale data. `useT()` subscribes a component to language changes; legacy components use `useTranslationVersion()` while reading `variables.getMessage()`.

When English changes, review existing translations as well as missing keys. Synchronising keys does not update stale wording, removed limits or renamed controls. Recent additions include Habits, Air Quality, GitHub, Focus, Source (Fallback), World clocks and note actions. Use Floating Notes, Floating Lists, Floating Images and Floating Countdowns as feature names; their settings live under Floats. The separate Countdown widget also has its controls in Floats. The settings screen called Feeds retains the internal `rss` key; the RSS widget keeps its own label.

Translate complete messages around placeholders such as `{name}`, `{phase}`, `{time}` and `{error}`; keep those tokens intact. User-entered titles, notes, symbols and time-zone identifiers remain unchanged. Check a live language switch, including countdown relative dates, validation messages and accessible labels, then check long labels in a narrow window. Run `bun test` for catalogue and placeholder checks.

Bookmarks adds new source, reading and discovery messages. English strings are currently explicit fallbacks in other catalogues; those additions still need translation and fluent-speaker review.

Standard / Focus layouts, Separate Focus/Work and Show in Focus add workspace messages. They have explicit English fallbacks in other catalogues pending translation review.

Calendar event previews add recurrence, guest response, event settings and map messages. Other catalogues currently contain explicit English fallbacks for these additions and need translation review.
