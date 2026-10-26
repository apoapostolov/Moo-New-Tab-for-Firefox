# Moo changelog

## 1.0.0 — 25 October 2026

Moo is a Firefox-only fork of [Mue](https://muetab.com), the new tab extension by The Mue Authors. It keeps the backgrounds, the weather and the widgets, drops the store and the account extras, and adds what this setup was missing.

### Added

- Unsplash topics: pick from the live topic list instead of four fixed collections.
- Coverr: free looping video clips as a background source, with an optional search.
- Pixabay and Pexels video clips, each using your own free API key.
- Live channels: 24/7 ambient streams (WildEarth, ZenLIFE, Love Nature, Red Bull TV) played behind the clock.
- Google widgets: mail, calendar and tasks, each with its own sign-in, and dialogs to create, edit or delete appointments and to add, rename, complete or delete tasks. Off by default, and they use your own Google OAuth client.
- A panel style switch in the weather, quick links and background information sections: Classic paints a dark panel, Glass lets the wallpaper show through.
- Google widgets gained their own settings once connected: which calendars feed the agenda and how far ahead it looks, what each event line carries, task list, sorting, grouping and filters, and the Gmail filter, custom search, preview text and unread indicator.
- Video backgrounds are queued ahead: the next clip is resolved and warmed, so a new tab starts on it at once.
- Unsplash is picked directly as an image source, with its own settings.
- Favouriting or downloading a library image now records it, so the trending picks improve as you use them.
- Animated background: a slow pan and zoom across the image. Off by default.
- Automatic background change on an interval you choose. Off by default.
- Background Information section, keeping the photo details and the location map apart from the display options.
- Weather Now: a one-line weather widget under the clock, with its own toggle and a place in the widget order.
- Five-day forecast from Open-Meteo, replacing the single-day extra information.
- Show and hide toggles for each widget in Overview.
- The Progress clock can be limited to chosen days, switched on and off with MON to SUN buttons that start on the working week. Every other day falls back to a clock picked below them, Digital unless changed.
- Three columns for the new tab page: any widget can sit in a rail down the left side, a rail down the right, or the middle column. In Overview the widgets are dropped into a Left, Right or Centre box around the preview, and moving one between those boxes moves it on the page.
- Weather Full and Image Info are widgets now, so the full weather card and the photographer credit can be placed like any other. A profile that has never moved them keeps them in the corners they were always in.
- Bulgarian language.
- Brand icons for new quick links. Typing an address that matches one of 409 known sites fills the icon field with that site's mark, drawn as a plain white glyph instead of a coloured favicon. The marks come from Simple Icons (plus an older release of it for the brands that asked to be removed), Material Design Icons and Font Awesome brands, and the row stays visually even across all three.

### Changed

- Scratch pictures keep their corner controls out of the way: copy, close, download and the resize grip appear on the picture you clicked or dragged, and leave when another note or picture takes over.
- A scratch picture with transparency is drawn as a sticker, with no panel, frame or rectangle behind it, so a cut-out sits on the wallpaper as its own shape. Click or drag it and the frame and the controls come back.
- Firefox only, with its own add-on id so it installs next to Mue.
- The first run keeps the settings already in use in Mue.
- Background effects each get their own heading (blur, brightness, filter) instead of one shared block.
- Statistics fit on a single row with centred values.
- Only the current widget style remains; the old style switch is gone.
- Weather finds the location on its own at first launch, now that the search box is gone.
- Excluded images are actually skipped, and the background service is asked again when a request fails.
- Background sources are ordered by popularity, and only Coverr is marked as a video source, since Pixabay and Pexels fall back to an image without a key.
- The date lives inside the Time section now, after the clock options, with its own switch to show or hide it.
- The mail preview no longer follows the pointer: it opens beside the mail card, level with the middle of the window, on whichever side the card leaves free. The wheel belongs to it while it is open, wherever the pointer is, and the message glides to a stop instead of jumping a line per notch.
- The widget list in Overview became three drop containers around a centred preview, with the grab handle on the left of each row and the switch on the right.
- Settings rows that configure one thing are drawn as one block: a heading and the controls under it, or a switch and the options it reveals, no longer have a rule between them. Only separate settings do.
- The Image Info card keeps its counts to itself until you look at it: views, downloads and likes appear when the card is hovered, and the resting card is just the place and the credit. The words "Photo by" are a plain grey label now, with the signature colour left to the photographer's name.
- The Image Info card stops growing sideways. Its width is capped a wide margin short of the middle column, and a long place name or credit ends in an ellipsis instead of running into the clock.
- The signature colour choices are circles now: six in one row, all the same size, with “From the background” as a full-width button underneath. They had been squeezed into a single line until the browser squashed them into ovals.
- The Image Info card reads at one scale: the place and the credit sit close together instead of two lines a card-height apart, and the view, download and like counts are small detail on the right rather than the largest text on the card.
- Scratch notes and pasted pictures arrive instead of appearing: each one lifts a few pixels and settles from slightly small as it fades in, 60ms after the one before it, so a page full of them assembles in one run. Hovering a note deepens its shadow without moving it.
- A pasted picture no longer disappears on one click. Its close control turns red and asks again, the way a note's does, and lets go after four seconds if the second click never comes.
- The location pin in the Image Info card is a bare glyph now. It shared the card's surface rule, so a 50px tile with a background, a 1px ring and its own backdrop blur sat behind a 24px icon; without the tile the pin also sits 6px from the text instead of 30.

- Glass in the light theme is paper, not a lighter dark card. The panels state their own text colour, so mail, calendar, tasks and metro quick links read as dark type on the white scrim instead of white on white, with their hovers, badges and calendar dots drawn in ink too.

- The Settings header no longer repeats a Settings button beside the close X. The modal is the settings panel already, so the tab row in its header was a second way to say where you are.

- The three quick-link icons in the Overview preview are about 40% smaller: 11px circles with 6px glyphs instead of 20px ones, so they read as the tiles they stand for instead of three big buttons in the middle of the page.
- The Progress clock has a switch for the days outside its own. It is on to begin with, which is how the clock already behaved: the percentage on the days you tick, and the clock picked under **Outside Work** on the rest of the week. Switched off, the Progress clock is the clock for every day and the days and that picker dim, because neither of them applies any more.
- The unread count on the Mail card follows what the widget is filtered to. It read the inbox's own unread number whatever the categories, folders or query asked for, so it disagreed with the list underneath it; it now counts the messages the filter actually matches, and reads `1000+` rather than paging a whole mailbox forever.
- The hints under the settings rows say what the control changes. They used to describe the control ("Change how the digital clock looks", "Make Moo comfortable and accessible"); they now name the outcome, with the real options or the cost where it matters: the digital clock hint lists hours, seconds and the leading zero, offline mode says which widgets stop updating, and the live background hint says it costs far more data than a looping clip.
- Every card in the Overview preview is the width of a card now. The middle column clones the real widgets, so the clock and the date made it about half again as wide as the rails beside it; the clock, the date, the one-line weather and the query line are now drawn two cards wide because that is what they are across the page, and every other card is drawn at the same width as the cards on the rails.
- The middle column's cards can sit in two columns. Hold a card over another card in the Centre list and that one steps aside, and dropping into the space it opened leaves the pair side by side on one row. After that a card dropped beside one in either column joins that column, so both grow downwards; drop the last card of the second column beside one in the first and the middle is one column again. The clock, the date, the weather line and the Ask line always read across the whole middle column and are never part of the split.
- The Overview preview no longer draws a shrunken Weather Full card in one of its corners. The zone list beside the preview already says which column it lives in, and a squashed copy of the card read as a mistake.

- **AI Ask**: a query line at the foot of the middle column. Type a question, press Enter, and it opens Google AI Mode — the AI view of a search, not the ordinary results page — or ChatGPT search, and the glyph on the right picks which. The line takes the keyboard when the page appears, so you can start typing without clicking.

- Background Information gains **Show Info if image has known location**. With it on, a picture that carries no place — Pexels, Pixabay and video sources carry none — shows no Image Info card at all, instead of a credit line with nowhere on it to learn.
- Mail, Calendar and Tasks fade in over a tenth of a second when their data arrives and the card appears, so a card that had to wait for the network no longer snaps into place.
- Scratch notes keep the heading level they are written at, on a real six-step scale. `####` and `#####` used to be flattened into `h3`, and every heading sat at the note's own 13px while its paragraphs rendered at the app's 16px, so a heading came out smaller than the words under it. Text no longer grows when a note stops being edited, either.

### Fixed

- The Add Link dialog had no room on its right: the form width excluded its own padding while the inputs added theirs, so the right edge was clipped. The box now measures from the border, and the dialog is 560px wide.
- The animated background can no longer pan past the edge of the image and show black strips.
- Weather spacing, and the min/max temperature alignment in the widget and the forecast.
- The weather widget no longer jumps in size while it loads: the placeholder matches the real layout.
- Hearts on library images were counted as missing likes.
- The quick link dialog had unlabelled fields rendered as raw browser inputs, and no backdrop behind it.
- The appointment and task dialogs sized themselves to their content and use the same panel as the weather and background information widgets.
- The analogue clock draws straight onto the wallpaper: no panel, no frost and no shadow behind the ring.
- Google widget rows keep to the card's own insets, the add button is a bare glyph, the task list name is plain text, and a ticked task stays in the list struck through instead of vanishing.
- The percentage clock can follow a work shift: set the start and end of your day (9 and 17, 9am and 5pm, or 9:30 and 17:30) and the percentage counts through the shift, not the whole 24 hours. Empty fields keep counting the whole day, and a shift that ends before it starts runs over midnight.
- Dropdowns near the bottom of a settings pane open upwards, so the panel style switch is never cut off by the window edge.
- The mail widget understands Gmail's inbox categories and can leave any of them out, with a tick list of Primary, Social, Promotions, Updates and Forums, plus your own folders and labels as extra sources. Mail now sits first in the Google widget settings.
- The widget order lists the Google widgets by their plain names, Mail, Calendar and Tasks, instead of prefixing each with Google.
- The calendar and folder tick lists line up with the other controls in Google settings instead of drifting to the right edge.
- The Mail, Calendar and Tasks cards each carry their own Classic or Glass panel switch at the bottom of the Google settings, so one card can go see-through while the others stay dark.
- The task list picker in the tasks card opens white on dark instead of near-black on dark grey, and the selects in the Google dialogs and settings follow the theme in their own lists.
- The Google setup steps say what to do in plain sentences instead of lecturing about what does not work yet.
- The widget settings in Google use one segmented Mail / Calendar / Tasks control instead of three small buttons, and nothing is shown until you pick one, so no widget's options look switched on by default.
- The event and task dialogs open in the middle of the page instead of inside whichever card launched them, and they keep the solid dark panel even when the cards are switched to Glass.
- The title field of a new event or task reads plain english: "lunch with Ana friday at 13:00 at Cafe Central" or "play in 9 days for 2 days each day at 11:00" fills the dates, the clock, the length, the place and the repeat on its own, a moment after typing stops.
- The event and task dialogs live in the browser's top layer now, so a widget card can never paint over them, whatever its glass surface or stacking order.
- Hovering a message in the mail card opens a panel of your own that shows the whole email, sender, subject, date, attachments and all, instead of the browser's one line tooltip.
- Task due dates can read as a countdown or as a date: "in 12 days", "Today", "2 days ago" or "7 nov". The countdown is the default and the switch lives in Settings → Google → Tasks.
- The clock type that was called Percentage complete is called Progress.
- The Progress clock draws a soft bar under the percentage, faint for the whole day and firmer for the part already gone, set in from the edges of the number.
- The checkbox, the title and the due date of a task now share one middle line, whatever the text size.
- The event and task dialogs are one steady width, with the fields kept inside them and the same space on both sides instead of a sideways scrollbar.
- New events open on the calendar you used last. In Settings → Google → Calendar the tick on the right of the list picks one calendar as the starting point instead; with nothing ticked there, the last one wins.
- The empty title box now shows one of twenty example sentences, picked at random each time it opens, so the plain-English reader is discoverable without a manual. Reading them also taught the reader three things it had wrong: "3-5 dec" was a clock instead of three days, "on the 1st of december" left an "on" in the title, and "next sunday" typed on a sunday meant today.
- Google sits with the other widgets in the settings sidebar, just after Weather, inside the same group.
- Scratch notes: double-click any empty part of the page and a small tilted note opens under your cursor, ready to type. Drag it to move it, click it to write, and it takes markdown. Each note carries an × that needs a second click before it goes, and a note always sits above the ones it is picked up over. Off by default, in Settings → Misc.
- Mail, Calendar and Tasks appear only once their first answer has arrived, instead of sitting there empty while the data loads.
- The signature colour is the Moo navy now instead of orange: the colour of the app icon, lifted so it reads on a dark page. Links, ticks, switches, sliders, the order picker and the ring around the buttons all follow it.
- Settings → Appearance carries a signature colour of your own, between the theme and the font: five fixed choices, any colour you pick, or one read out of the wallpaper you are looking at.
- A scratch note keeps the lean it was dragged with, and holds that lean while your hand is still, instead of standing back up or jumping to a new angle when you let go.
- Scratch images: paste a picture anywhere on the page and it lands under the pointer at the size of a note, keeping the picture's own proportions and filling its card to the edges. Drag it to move it, pull the bottom-right corner to resize it, and use the corners to copy it, save it or remove it. Off by default, its own switch in Settings → Misc.
- The clipboard permission is declared, so copying a pasted picture actually reaches the system clipboard instead of failing silently.
- The mail preview scrolls with the wheel now: a long message can be read inside the panel instead of the panel snapping shut the moment you scroll. Any other scroll still closes it, because the panel hangs off the row it belongs to.
- The “click the row to open in Gmail” line is gone from the preview footer.
- The example sentence in the event and task title box is a flat mid grey now, instead of a theme colour faded with opacity. Placeholders across the whole page use the same grey, so an empty field can never be mistaken for one that already holds something.
- The mail preview now measures itself before it decides where to sit. Beside the row while the whole message fits below it, and lifted higher when a long message would run past the bottom of the window, so the last line is always on screen and the message scrolls inside the panel.
- The weather preview in Settings → Overview stays inside its preview box. It used to keep the real card's corner position and hang in the bottom-right corner of the settings panel as a stray pill labelled Weather.
- The navbar is shown unless you ask otherwise: “Only display on hover” is off by default now, so a fresh page has its buttons in plain sight. A profile that was set up when it was on loses that one setting once, and the checkbox decides from then on.
- The mail preview follows the hand: running the pointer down the list moves the panel from message to message instead of leaving the previous one up until you leave the row and hover it again. Each message keeps its own panel, so a cached one can never show the previous message's text.
- The Progress clock fills its bar when the page opens: the completed part of the day sweeps up from empty, fast off the mark and slowing into place with one small spring overshoot before it settles exactly on the real percentage.
- The Mue library is no longer offered as an image source; Unsplash, Coverr, the live channels, Pixabay and Pexels remain. A profile that was pointed at it moves to Unsplash on its own, and a picture already queued for it is dropped rather than shown once more.
- About's Contact Us is a settings row now: the label sits on the left and the three contact buttons on the right, level with it.
- About writes to the new address, theapoapostolov@gmail.com, and no longer carries the resources section.
- The Overview preview draws Mail, Calendar and Tasks instead of naming them: a thumbnail of a widget card with grey bars where the text would be, a dot, a date square or a tick box where the card carries its glyph, and a single entry inside. Stacked widgets keep a few pixels between them so each one reads as its own card.
- Settings has a Misc page after Google for the things that are not a widget of their own.
- A live channel that publishes captions no longer draws them over the wallpaper. The background has no text of its own, and a webcam stream that ships a caption rendition used to have it switched on automatically.

### Removed

- Marketplace and Library.
- Quotes and greetings.
- Achievements.
- Search.
- The message form, and the support, contributors, supporters, photographers and curators sections in About.
