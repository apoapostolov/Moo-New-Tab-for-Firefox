# Habits, Air Quality and GitHub

Enable these widgets in Settings → Overview or on their settings screens. All start hidden. Place them in any widget column and choose Classic or Glass using the same panel control as the Google widgets. Focus hides them with the rest of the page.

## Habits

Use the plus button to add a habit. Give it a name, an optional description and a schedule: every day, selected weekdays, or a weekly goal of 1–7 confirmed days. Each habit accepts one confirmation per day. The start date determines the earliest date that can receive a confirmation. Existing counted history stays saved; each recorded day contributes one confirmation.

The table uses the same width as other centre widgets and opens on the current week's seven day columns. Slim arrows on either side of the weekday header browse earlier weeks and return to the current week. The earliest habit week is the lower limit; navigation stays available when a week has no visible habits. Long names end in an ellipsis; the hover shows the full name. Checks mark confirmed days, crosses mark missed daily habits, and dashes mark unscheduled days. Future days are disabled. The widget header keeps only the plus button, and there is no separate date toolbar. Today's progress bar stays on today while browsing history. Completed habits remain visible in historical weeks even when hidden from the current week.

Click an unconfirmed day once to show green confirmation, then again within four seconds to save it. Undo uses the same two clicks, with a red confirmation state. The first click leaves stored data unchanged. Escape, clicking outside a day, or waiting four seconds cancels the pending action. Concurrent changes are checked before saving. The white progress bar shows today's confirmed habits against all habits due today, reaching 100% when all are complete.

Hover or focus a name or day to see its description, schedule, confirmation state, monthly history and streaks. Clicking the name keeps this panel open. The panel opens beside the card, centred vertically in the window like the Google previews. Long content scrolls inside it while its header stays in place; wheel scrolling also works while the pointer remains over the card. The borderless Edit glyph sits beside Close in the panel header. Escape dismisses the panel and returns focus to its trigger. The monthly curve counts distinct confirmed dates, with year navigation and values on hover or keyboard focus; future months have no value.

Streaks count consecutive confirmed scheduled days. Rest days do not break a weekday habit, and an unfinished current day does not erase the previous streak. The ten badge thresholds are 2, 5, 10, 20, 30, 60, 90, 180, 270 and 365 days. The highest badge earned from the best streak appears after the name and remains earned after a later break. Correcting old confirmations recomputes badges. Each day's ring shows the streak reached on that date divided by its next threshold: 1/2, 2/2, 3/5 and so on. Exact milestones fill the ring and show the earned icon at its centre instead of a checkmark. Progress is capped at a full ring after 365 days.

| Setting | Operation |
| --- | --- |
| Sort order | Keep manual order, sort by name, or put unfinished habits first. |
| Visible items | Display 4–30 habits scheduled during the current week. Up to 200 habits can be stored, including archived ones. |
| Completed habits | Show or hide habits confirmed today. The progress bar includes all habits due today. |
| Streaks | Show or hide the earned row badge and streak details in the hover. The table always shows its seven day columns and milestone rings. |
| Time zone | Use this device's local zone or an IANA identifier such as `Europe/London`. |
| Day starts at | Keep early-morning entries on the previous calendar day, for example until 04:00. |
| Week starts on | Choose Monday or Sunday for weekly totals. |
| Your habits | Edit, reorder, archive, restore or remove habits. Removal needs a second click. |

Changing the calendar settings changes how periods are interpreted; existing counts retain their saved dates. Archiving preserves history. Settings backups include habits and progress, and Restore settings keeps them. Erase all local data removes them. Damaged habit data is reported rather than overwritten.

## Air Quality

Choose Information depth under Settings → Air Quality. Basic is the default: a wind icon, AQI, condition and location in a card about the size of small Weather. Summary adds the AQI scale and a 24-hour trend with its peak and time. Detailed adds the chosen pollutant readings and UV; pollen expands when needed. The forecast uses the curve and peak without an hourly table. Changing depth preserves all reading preferences. Air Quality and Weather share a 300 px width in either side column; centre cards follow the normal widget width.

The large value and category always follow the selected European or US AQI scale. These scales have different thresholds, so their numbers are not directly comparable. Pollutant concentrations use µg/m³, pollen uses grains/m³ and UV is an index. A dash means a reading is unavailable. The chart starts at zero, leaves gaps where hours are missing and shows the highest available AQI in the next 24-hour forecast, with time in the chosen location's zone.

| Setting | Operation |
| --- | --- |
| Information depth | Basic, Summary or Detailed. Forecasts appear in Summary and Detailed; measurements appear in Detailed. |
| Location | Reuse the saved Weather city, search and choose a city, or enter coordinates and an optional label. No new location permission is requested. |
| AQI scale | Choose European or US AQI without changing the location. |
| Refresh interval | Refresh every 10, 15, 30, 60 or 120 minutes while the page is visible. |
| Forecast model | Automatic, CAMS Europe or CAMS Global. Automatic selects the available regional coverage. |
| Pollutant readings | Choose any of PM₂.₅, PM₁₀, nitrogen dioxide, ozone, sulphur dioxide and carbon monoxide. Hide the entire group if only AQI is needed. |
| UV, pollen and forecast | Show each independently. Pollen is seasonal and limited to European coverage. |

These are model forecasts, rather than measurements from a nearby sensor. Provider attribution is shown under Settings → Air Quality. The [official API documentation](https://open-meteo.com/en/docs/air-quality-api) explains the models, scales and coverage. City lookup uses [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api).

Refresh failures and offline mode keep the last valid forecast for the same location and model, with a notice. A different location never inherits the previous location's result.

## GitHub

Enter a GitHub username to read public results. Add an optional personal access token for private repositories or authenticated limits. If the username is empty, a connected token supplies its account name. The widget makes no account changes.

The header keeps only reload. Four compact glyph tabs show review requests, pull requests, assigned issues and Actions, with their result counts. Rows use a status glyph, a two-line title and a repository/number line, with discussion count and an optional update date. Card glyphs use the text colour; semantic status colours appear only in the hover. The footer places the result count on the left and refresh date on the right in one row. The card keeps the shared widget width and Classic/Glass surfaces.

Hover or focus a row to read its full title, author, assignees, labels and timestamps. The preview opens beside the card and stays vertically centred, with the Google previews' internal scrolling and fixed header. Use the preview glyph to keep the panel open on click or touch. Escape or Close returns focus to the trigger; the external-link glyph opens the item on GitHub. Actions previews show the branch, event, commit and complete commit message where supplied.

Issue and pull request previews render the complete Markdown body in a scrollable panel, including headings, task lists, tables, code, images, links and collapsible details. Links resolve in repository context. HTML is rebuilt through an allowed element set; executable content and unsafe URLs are removed. Code and diagrams stay as source. Bodies arrive with the existing search response, so opening a preview adds no API request. Older caches refresh online to obtain descriptions and show a reload hint while offline. GitHub documents its [issue/PR search response](https://docs.github.com/en/rest/search/search#search-issues-and-pull-requests) and [raw Markdown body format](https://docs.github.com/en/rest/issues/issues#get-an-issue).

For a fine-grained token, select the repositories you need. GitHub's [issue and pull-request search](https://docs.github.com/en/rest/search/search#search-issues-and-pull-requests) does not require an additional token permission. Reading private [workflow runs](https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository) requires Actions: read. Organisation policy or SSO may also restrict access.

| Setting | Operation |
| --- | --- |
| Views | Independently enable review requests, authored pull requests, assigned issues and Actions. Arrow keys, Home and End move between visible tabs. |
| Repositories | Enter up to ten `owner/repository` names, separated by spaces, commas or new lines. Leave blank for account-wide search; Actions needs an explicit repository list. |
| Organisation | Restrict the issue and pull-request searches to an organisation. |
| State | Open, closed or all issues and authored pull requests. Review requests remain open. |
| Sort and visible items | Sort searches by update, creation or comment count; show 3–20 rows per view. Workflow runs remain newest first. |
| Draft pull requests | Include or omit drafts. |
| Extra search filters | Append GitHub search qualifiers such as `label:bug -label:blocked`. These affect issues and pull requests. |
| Actions branch and status | Restrict workflow runs to a branch and failed, running or all runs. |
| Refresh interval | Refresh every 5, 15, 30 or 60 minutes while visible. The default is 15 minutes. |
| Item update times | Show or hide timestamps below individual results. |

GitHub applies separate [API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), including stricter search limits. A rate-limit response pauses automatic and manual requests until the indicated retry time. Individual views can retain their previous results if another view succeeds. Notices identify partial or cached data. Rejected credentials clear private cached results.

The token is masked in Settings and saved locally. Tokens, cached GitHub results and retry timers are excluded from backups. Removing or replacing the token clears cached results. Restore settings preserves credentials; Erase all local data removes them. This implementation targets `github.com`, using the documented REST API version `2026-03-10`.
