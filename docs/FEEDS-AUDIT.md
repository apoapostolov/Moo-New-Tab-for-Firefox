# RSS reader and Feedly audit

The RSS reader supports one active source: local RSS/Atom subscriptions or a Feedly account. Switching sources preserves the other configuration. OPML import/export operates on local subscriptions and never changes Feedly subscriptions.

## Findings and repairs

- Credential changes could leave cached stories or late profile responses from a previous account. Feedly cache and profile records now carry a SHA-256 credential fingerprint, and requests check credentials, profile revision, offline state and cancellation before committing. Clearing an account clears its cache and counters. Credential fields hide their values and commit on blur.
- Concurrent tabs could repeat refreshes and race token renewal. Loads and markers now use a shared browser lock; a short cache window coalesces simultaneous forced reloads. A 401 renews with the optional developer refresh token once and retries once. Aborted or obsolete renewals cannot write new credentials.
- Missing rate-limit headers were read as zero, which erased usage. Missing headers now increment an estimated local count, supplied headers remain authoritative, and a 429 stops automatic requests until reset. The fallback budget is 50 calls per day. A refresh normally uses two calls for stories and counts; initial profile lookup adds one, as do token checks and read markers.
- The card removed stories before the read marker succeeded. A failed marker now leaves the story visible with an error. Opening a story is the only read action; hover does not change the account. Remote entry links and image URLs accept HTTP(S) only.
- OPML scanning could import commented-out outlines and truncate labels containing a greater-than sign. Tag scanning now respects quoted attributes, skips comments/CDATA, checks nesting and the root, rejects external entity declarations, and limits size and depth. Nested folders and escaped labels round-trip. Imports normalize duplicates, reject relative and credential-bearing feed addresses, and cap the combined local list at 1,000.
- The widget discarded offline cache results because its request guard required an online state. It now accepts cached results while retaining cancellation on superseding loads and unmount. Changing the refresh preference also restarts the timer.
- Feedly's transient account/cache/rate records were eligible for backup. They are now excluded along with credentials.

## Verification and limits

Automated tests exercise token renewal, stale requests after disconnect, scoped offline caches, simultaneous reloads, quota headers and 429s, marker failure/retry, safe links, nested OPML round trips, comments, quoted delimiters, malformed roots and feed normalization. Browser checks use isolated local fixtures. No live Feedly account or system notification was used during this audit.

Feedly access depends on the token and account. Its [current authorization guide](https://developers.feedly.com/reference/authorization) describes Enterprise API tokens; it does not promise ordinary Pro/Pro+ API access. The retained developer refresh exchange follows [Feedly staff's published explanation](https://groups.google.com/g/feedly-cloud/c/vJEAL6NWS0I/m/ZeFT_d6-AQAJ). The 50-call developer allowance is described by [Feedly staff](https://groups.google.com/g/feedly-cloud/c/kFe3OvQaTrM); it is a conservative fallback when response headers are unavailable. The widget reads only the requested newest unread slice, so continuation paging is unnecessary for its 12-story maximum. See [stream collection and pagination](https://developers.feedly.com/reference/collect-articles).

The final combined check ran 202 regression tests, ESLint, stylelint, the production build and Firefox archive validation. Browser checks covered masked credential entry and forgetting the account, alongside the calendar and countdown forms.
Offline browser fixtures also verified cached local and Feedly headlines without remote requests.
