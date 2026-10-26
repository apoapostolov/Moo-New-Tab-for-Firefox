const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../src/i18n');
const flatten = (value, prefix = '', output = {}) => {
  for (const [key, item] of Object.entries(value)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === 'object') flatten(item, name, output);
    else if (typeof item === 'string') output[name] = item;
  }
  return output;
};
const source = flatten(JSON.parse(fs.readFileSync(path.join(root, 'locales/en_GB.json'), 'utf8')));
const output = {};
for (const file of fs
  .readdirSync(path.join(root, 'locales'))
  .filter((file) => file.endsWith('.json'))) {
  const locale = file.replace('.json', '');
  const values = flatten(JSON.parse(fs.readFileSync(path.join(root, 'locales', file), 'utf8')));
  const present = Object.keys(source).filter(
    (key) => typeof values[key] === 'string' && values[key].trim(),
  ).length;
  output[locale] = {
    percent: Math.round((present / Object.keys(source).length) * 1000) / 10,
    present,
    total: Object.keys(source).length,
  };
}
output.pt_PT = output.pt;
fs.writeFileSync(
  path.join(root, 'translationPercentages.json'),
  JSON.stringify(output, null, 2) + '\n',
);
console.log(
  'Updated local key coverage. Copied English values count as present; this is not a translation-quality score.',
);
