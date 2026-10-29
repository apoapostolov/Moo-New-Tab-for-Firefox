# Bookmarks

Enable Bookmarks in Settings → Bookmarks or Overview. The widget combines local browser bookmarks, Raindrop bookmarks and Readwise reading using the Google widgets' width, Classic/Glass surfaces and centred side preview. It only reads connected libraries.

## Connect sources

Browser appears first and is enabled by default. In the installed extension, choose Allow bookmark access to grant the optional browser permission. Moo reads HTTP and HTTPS bookmarks from this browser profile without editing them. Select a folder, include its subfolders, or search words in titles, addresses and folder paths. Browser bookmarks work offline and update when the library changes. Permission can be revoked in the browser; the widget then removes the local results. The development website cannot access the browser library.

For Raindrop, create an application in [Integrations](https://app.raindrop.io/settings/integrations) and paste its test token into Access token. Use Load collections to choose a collection by name. All collections and Unsorted work without loading names. Include subcollections is optional. Search filter accepts Raindrop search syntax, including tags and content types.

For Readwise, paste your [access token](https://readwise.io/access_token). Choose Reader library for saved reading, or Daily Review highlights for the latest review. Reader supports location, content type and tag filters. Reading queue includes Inbox, Later and Shortlist; All locations also includes Archive and Feed. Daily Review can be empty when no review exists. Moo does not create reviews or mark highlights reviewed.

Each source has its own on/off switch in Settings and at the top of the widget. Enable any combination; their filtered items form one library before the shared assortment rules apply. Unconnected services become available after adding their token in Settings. Duplicate original URLs merge across enabled sources, ignoring common tracking parameters. Their preview retains every source name and combined tags. Distinct highlights remain separate.

## Assortments

| Mode | Behaviour |
| --- | --- |
| Latest | Show the newest saves across enabled sources, updated on refresh. |
| Most opened | Rank by the number of times each link was opened from this widget, then its last open and saved date. |
| Mixed | Start with up to two recent saves and fill remaining places with older discoveries. |
| Shuffle | Randomly select from the indexed library. |
| Rediscover | Randomly select saves older than the minimum age. |

Choose 3–12 visible items. Mixed, Shuffle and Rediscover retain their assortment for a local calendar day, each new tab or until manually shuffled. The shuffle glyph immediately replaces it. Newly indexed content can fill empty places without replacing retained items.

Repeat avoidance applies to shuffled items and older discoveries. It records when Moo showed an item; zero allows repeats. Other controls limit items per website, balance enabled sources, require a minimum known reading time or hide opened items. The opened filter combines local Moo history with available browser and Reader last-opened information. Most opened uses Moo counts only; the browser Bookmarks API does not provide visit counts. Reset discovery history clears local history without changing Reader's records. Restrictive filters may leave fewer visible items than requested.

Reading times are estimated from Reader's word count at 250 words per minute. Browser bookmarks and Raindrop do not supply a reading time here, so requiring one excludes those bookmarks.

## Preview and open

Rows show a title, domain and optional thumbnail or reading time. Hover or focus a row for its cover, description, Markdown note, tags, collection, saved date and available Reader progress. The preview scrolls internally with a fixed header. Its glyph pins it for keyboard, mouse or touch. Escape or Close returns focus to the trigger.

Open links in chooses Same tab (the default) or New tab for bookmark rows, preview controls and links in notes. Descriptions and highlights use the smaller reader content type size beneath the title.

Readwise rows open in Reader by default; turn this off to open the original. The preview also offers original and service links. Opening records local history only; it does not mark items read, archive them or edit remote libraries.

## Sync and privacy

Remote indexes load one page per source and continues every 15 seconds while Moo is visible, respecting rate-limit backoff. Raindrop pages contain up to 50 items; Reader pages contain up to 100. The footer identifies an unfinished index. Reload resumes an unfinished scan. Random selection covers indexed items, so it does not represent the whole remote library until indexing finishes.

After the refresh interval, a new scan reconciles changes and removals. Sources fail independently. Offline mode uses matching cached data without network requests. Rejected credentials clear that source's cached content. Manual refresh cannot bypass service backoff.

Rebuild library starts a fresh index if a saved scan needs replacing. It requires a second click and does not change remote bookmarks or reading. Each source combination retains its own assortment. Local open counts survive source switching and apply to a deduplicated URL across services.

Tokens are local, masked and excluded from backups. Remote indexes, collection names, assortments and discovery history live in IndexedDB and are also excluded. A small localStorage cache records opens synchronously before same-tab navigation and is excluded from backups. Native bookmark snapshots stay in memory; Moo does not copy the native library into its database or send its URLs to the connected services. Cache identities include credentials and source filters, preventing another account or configuration from inheriting results. Profile restore and reset clear this rebuildable cache. Erase all local data also removes tokens. Data goes directly to the selected services; thumbnails send no referrer. Moo does not fetch article bodies or execute provider HTML.

References: [Browser Bookmarks API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/bookmarks), [optional permission requests](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions/request), [Raindrop authentication](https://developer.raindrop.io/v1/authentication/token), [bookmark API](https://developer.raindrop.io/v1/raindrops/multiple), [Reader API](https://readwise.io/reader_api), [Readwise Daily Review](https://readwise.io/api_deets).
