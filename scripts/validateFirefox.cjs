const fs = require('node:fs');
const assert = require('node:assert/strict');
const Zip = require('adm-zip');
const pkg = require('../package.json');
const manifest = JSON.parse(fs.readFileSync('build/firefox/manifest.json', 'utf8'));
const zip = new Zip(`build/firefox-${pkg.version}.zip`);
const entries = new Set(zip.getEntries().map((entry) => entry.entryName));
assert.equal(manifest.version, pkg.version, 'Package and manifest versions differ');
assert.equal(manifest.manifest_version, 3);
for (const file of [
  manifest.chrome_url_overrides.newtab,
  ...Object.values(manifest.icons),
  ...manifest.background.scripts,
  'LICENSE',
]) {
  assert(entries.has(file), `Missing extension file: ${file}`);
}
const html = zip.readAsText(manifest.chrome_url_overrides.newtab);
for (const [, asset] of html.matchAll(/(?:src|href)="([^"#]+\.(?:js|css))"/g))
  assert(entries.has(asset.replace(/^\//, '')), `Missing bundle: ${asset}`);
assert.deepEqual(JSON.parse(zip.readAsText('manifest.json')), manifest);
assert(!entries.has('manifest/chrome.json'));
console.log(`Validated Firefox ${manifest.version}: ${entries.size} files`);
