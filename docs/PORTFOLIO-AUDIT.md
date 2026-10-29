# Portfolio audit and completion

Reviewed 27 October 2026 against the current working tree. The audit covers Portfolio's settings, validation, cached valuations, failure states, keyboard access and responsive layout. The related Time, Focus, Fallback Background and Countdown work is tracked in [FEATURE-TASKS.md](FEATURE-TASKS.md).

The forms now follow Moo's existing settings controls: labelled, themed inputs with a 56 px height, visible focus, and three equal table columns with single-line headings. The widget keeps its total, daily change and largest movers as the main information. No aggregate quality score is assigned because performance and a full accessibility conformance audit were not measured.

## Findings addressed

| Severity | Finding and effect | Resolution |
| --- | --- | --- |
| P1 | Refreshing discarded exchange rates while displaying cached quotes, temporarily preventing a complete converted valuation. | Cached rates and the selected currency remain available through refresh and request failure. |
| P1 | Failed refreshes replaced usable quotes with missing data. | Retain the last quote for each failed holding, identify the failure, and display quote timestamps. Failed refreshes do not create new historical valuations. |
| P2 | Holdings used a separate form structure with limited space and inconsistent controls. | Reuse the shared themed field styling; provide a submit form, associated labels, visible validation and equal columns. |
| P2 | A hidden exchange MIC could remain in a holding edited for Finnhub. | Saving with Finnhub clears the MIC; Twelve Data retains the optional exchange field. |
| P2 | A damaged transient quote cache could reach rendering with invalid rows. | Validate cached quote records and ignore damaged cache entries. Preserve damaged holdings rather than overwrite them. |
| P2 | A failed local save could clear the draft without explaining the problem. | Report the storage failure and retain the draft. Validate saves against the latest holdings and preserve unrelated holdings when removing one. |
| P1 | New filled actions used the lighter accent, giving white text a measured contrast of 3.74:1. | Use the existing stronger accent token for filled actions and give Cancel a secondary surface. |
| P2 | Controls lacked explicit keyboard focus styling, and the provider link used the browser's default blue. | Add visible focus to widget actions and use Moo's themed link colour. |

## Verification

Browser checks used the local app in the Codex browser. At 1280 px, holdings use aligned columns. At 390 px, Holdings keeps its three columns in a contained horizontal scroll area so headings stay on one line; the document has no horizontal overflow. The Countdown dialog's fields measure 302 × 56 px at the same viewport. Holding creation, countdown date editing, Markdown rendering, note conversion, reload persistence, clock switching, Focus background switching and Pomodoro pause/resume were exercised.

Axe checks using the WCAG 2 A/AA and WCAG 2.1 AA tags reported no violations or incomplete results in Portfolio settings in settled dark and light themes (21 applicable checks each). The Countdown modal passed the same scan after the contrast fix (16 applicable checks). Theme transitions were allowed to settle before contrast results were recorded.

Regression tests cover incomplete valuations, currency conversion, British pence, quote caching, failed refresh retention, damaged caches, credential exclusion and backups. The new time-feature tests also cover double/triple-click arbitration, Pomodoro suspension and reloads, overnight work shifts, world-clock formats, countdown deadlines and Markdown safety.

Existing strengths retained include provider-specific cache identity, incomplete-total detection, delayed-quote notices, separate quote timestamps, API key exclusion from backups, and preservation of damaged holdings.

The original audit checked provider behavior with controlled responses. A follow-up on 28 October 2026 verified a live Finnhub AAPL quote, USD currency lookup and quote timestamp in the browser after replacing custom-header authentication with token-parameter authentication. The custom header was blocked by Finnhub's browser CORS response. Twelve Data live account requests remain untested, and access still depends on the configured key and provider account. Screen-reader operation, coarse-pointer testing and performance profiling remain untested. These checks do not establish full WCAG conformance.

The polish follow-up moves Focus visibility to Navbar Widgets, uses switches for the two fallback options, matches the Fallback Background block to Source, and shortens the Countdown settings copy. Holdings keeps equal-width inputs, removes number steppers, provides borderless row actions and places Add at the right. The Sinoptik.bg page field uses the standard 300 px settings width.
