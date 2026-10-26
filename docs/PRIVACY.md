# Data and connections

Moo stores preferences, notes, links and local activity counters in your browser. Uploaded backgrounds and scratch pictures are kept in IndexedDB. Google tokens use extension storage; OAuth client details and optional media-provider keys use local settings. Backups omit sign-in and private keys. Include pictures when exporting if you want to keep them in the backup. Imported files are validated before application. Your browser profile and exported backups can contain private notes and images, so store copies accordingly.

The local counters are not sent to an analytics service. The inherited Sentry error-reporting connection has been removed. Report buttons open Moo's GitHub issue form; review what you include before submitting. This document describes the checked-in code, not the retention policies of outside services.

| Feature | Destination and data |
| --- | --- |
| Weather | `api.muetab.com/v2/weather` receives the configured city. If you use automatic location, the browser first asks for location access and the GPS lookup sends coordinates to `api.muetab.com/v2/gps`. Expanded forecasts also use Open-Meteo geocoding and forecast endpoints. |
| Library backgrounds | Mue's image API receives source/filter/quality choices. Images load from the returned provider/CDN address. Explicit view/download/heart actions may update the image's counter through that API. |
| Video and live backgrounds | Coverr, Mixkit, Pixabay, Pexels or the selected broadcaster/CDN receives normal media requests, including your IP address. Provider search choices and optional keys are sent to that provider. Live streams stop loading while the tab is hidden. |
| Google widgets | After you connect, Google receives OAuth requests and the selected mail searches, calendar/task reads and edits. The OAuth client secret is sent to Google's token endpoint; it is not a confidential secret in a Desktop app client. Disconnect removes the local token and attempts remote revocation. |
| RSS | Selected feed and article websites receive requests. Full-article mode can fetch stories before you open the reader; turn it off to use feed summaries only. Embedded article pictures contact their hosts when displayed. |
| Quick links | Custom images load from their supplied addresses. Automatic title/icon lookup contacts the selected site or configured icon service. |
| Search/Ask Bar | Submitting opens the selected service with your query in its URL. It is then handled by that service. Typing alone does not submit the query. |
| Fonts and photo maps | A custom Google Font contacts Google's font service. Displaying the photo map contacts the configured map provider. |
| Support and translations | These actions open Moo's GitHub repository or local documentation links; issue text is submitted only when you submit the GitHub form. |

Offline mode stops application API entry points. Already displayed external images, custom CSS URLs and browser-managed media can have their own resource lifecycles; offline mode is not a network firewall.

The manifest requests `storage` for saved data, `identity` for Google sign-in and `clipboardWrite` for explicit copy actions. Google hosts are declared for the connected widgets. Optional HTTP(S) host access allows user-selected feed/media sites; requesting access can show a browser prompt, and granted hosts can be reviewed in the add-on's permissions. See [Mozilla's host-permission documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/host_permissions).

Restore settings keeps personal data and sign-in. Erase all local data removes local preferences, notes, links, uploaded pictures and stored Google sign-in; it does not delete account data at Google, revoke every previously granted host permission or remove backups outside the browser.
