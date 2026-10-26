# Translation context

Use `useT()` for translated text and `useTranslation()` for the current language and asynchronous `changeLanguage(locale)`. The external translation store loads the selected locale and English fallback before publishing a new snapshot. A late language request cannot replace a newer selection.

Legacy components that use `variables.getMessage()` also call `useTranslationVersion()` to subscribe. Reading a global function alone does not subscribe React. `uiText(key)` addresses the `ui` keys in the same store. Missing translations fall back to UK English.

Keep exact locale tags and await `changeLanguage` before dependent refreshes. See `docs/TRANSLATING.md` for local coverage and contribution instructions.
