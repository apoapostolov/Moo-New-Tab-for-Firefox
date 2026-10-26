const fs = require('node:fs');
const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) throw new Error('Use a Firefox version such as 1.2.3');
for (const path of ['package.json', 'manifest/firefox.json']) {
  const value = JSON.parse(fs.readFileSync(path, 'utf8'));
  value.version = version;
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}
const path = 'src/config/constants.js';
fs.writeFileSync(
  path,
  fs
    .readFileSync(path, 'utf8')
    .replace(/export const VERSION = '[^']*'/, `export const VERSION = '${version}'`),
);
console.log(`Set Firefox version to ${version}. Review, commit and tag this change manually.`);
