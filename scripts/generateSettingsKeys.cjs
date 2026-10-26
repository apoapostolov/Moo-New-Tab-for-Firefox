const fs = require('node:fs');
const path = require('node:path');
const keys = new Set(require('../src/utils/data/default_settings.json').map((item) => item.name));
function scan(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (/\.(jsx?|json)$/.test(file) && !file.includes(`${path.sep}i18n${path.sep}`)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(
        /(?:getItem|setItem|removeItem|readNumber|readFlag|readText|readList)\(\s*['"]([\w-]+)['"]|(?:name|setting|storageKey)=["']([\w-]+)["']/g,
      ))
        keys.add(match[1] || match[2]);
    }
  }
}
scan(path.join(__dirname, '../src'));
for (const key of [
  'scratchNotesData',
  'scratchImagesData',
  'scratchTopZ',
  'signatureColour',
  'rssFeeds',
  'rssItemCount',
  'rssRefreshMinutes',
  'rssFullArticle',
  'rssArticleTtl',
  'liveChannels',
  'aiAskService',
  'surfaceMail',
  'surfaceCalendar',
  'surfaceTasks',
  'surfaceRss',
  'surfaceWeather',
  'surfaceQuicklinks',
  'surfaceBackground',
])
  keys.add(key);
fs.writeFileSync(
  path.join(__dirname, '../src/utils/data/settings_keys.json'),
  JSON.stringify([...keys].sort(), null, 2) + '\n',
);
