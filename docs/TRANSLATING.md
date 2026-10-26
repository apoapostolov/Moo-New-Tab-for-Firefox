# Translating Moo

Moo keeps its locale files in `src/i18n/locales`. UK English (`en_GB.json`) is the fallback and key reference; US English has its own file. Existing locale tags such as `pt_BR` and `zh_Hant` are retained. The app loads English and the selected locale, with English used for missing keys.

Edit a locale file and submit the change to Moo's repository. Upstream Mue's Weblate project is not a submission destination for Moo-specific strings. Keep placeholders and interpolation syntax unchanged, and check the text in a narrow settings window. Hints should explain what the setting does in ordinary language, without implementation terms or promotional claims.

Run `bun run translations:percentages` to regenerate coverage from the local UK English keys. Coverage measures present, nonempty keys; copied English text still counts as present, so the number is not a measure of translation quality. Do not replace unreviewed translations with newly generated prose just to increase the number.

Legacy strings and dormant feature keys remain available for reuse. New visible literals belong in the locale data. `useT()` subscribes a component to language changes; legacy components use `useTranslationVersion()` while reading `variables.getMessage()`.
