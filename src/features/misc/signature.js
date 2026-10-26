import EventBus from 'utils/eventbus';

/**
 * The app icon's navy, lifted until it reads as text on a dark page. Everything tinted reads
 * `--signature`, so a change is one write here. The colour can also be sampled from the wallpaper.
 */

const STORE = 'signatureColour';
const DEFAULT_SIGNATURE = '#6b86a8';

// Presets offered before anything is sampled; the first is the logo colour.
const PRESETS = [
  { name: 'Moo navy', value: DEFAULT_SIGNATURE },
  { name: 'Steel blue', value: '#4f6d92' },
  { name: 'Grey teal', value: '#6c8f97' },
  { name: 'Deep teal', value: '#3f6f7a' },
  { name: 'Slate', value: '#7d8fa6' },
];

const HEX = /^#[0-9a-f]{6}$/i;

const read = () => {
  const stored = localStorage.getItem(STORE);

  return stored && HEX.test(stored) ? stored : DEFAULT_SIGNATURE;
};

const apply = (hex = read()) => {
  document.documentElement.style.setProperty('--signature', hex);
};

const setSignature = (hex) => {
  if (hex && HEX.test(hex)) localStorage.setItem(STORE, hex);
  else localStorage.removeItem(STORE);

  apply();

  // The settings screen owns the picker; the page owns the colour.
  EventBus.emit('refresh', 'signature');
};

// Sampling

const clampByte = (value) => Math.min(255, Math.max(0, Math.round(value)));

const toHex = (r, g, b) => `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`;

const rgbToHsl = (r, g, b) => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;

  if (!d) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h;

  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;

  return { h: (h * 60 + 360) % 360, s, l };
};

const hslToRgb = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const seg = Math.floor(h / 60) % 6;
  const table = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][seg] ?? [0, 0, 0];

  return table.map((v) => (v + m) * 255);
};

/** The current background image URL, or '' when a video background leaves no still. */
const backgroundImageUrl = () => {
  const element = document.getElementById('backgroundImage');
  const background = element && getComputedStyle(element).backgroundImage;

  if (!background || background === 'none') return '';

  const match = background.match(/url\((['"]?)(.*?)\1\)/);

  return match ? match[2] : '';
};

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    // Without CORS the canvas is tainted and the sample silently reads as black.
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The background image could not be read.'));

    image.src = url;
  });

/**
 * One colour for the picture: the hue the eye remembers, not the average, which
 * drifts to mud. Pixels are bucketed by hue, weighted by saturation and count,
 * and the winner is pulled into a usable link-colour range.
 */
const sample = async () => {
  const url = backgroundImageUrl();

  if (!url) throw new Error('There is no background image to take a colour from.');

  const image = await loadImage(url);
  const size = 64;
  const canvas = document.createElement('canvas');

  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d', { willReadFrequently: true });

  context.drawImage(image, 0, 0, size, size);

  const { data } = context.getImageData(0, 0, size, size);
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];

    if (a < 200) continue;

    const { h, s, l } = rgbToHsl(r, g, b);

    // Near-black, near-white and near-grey say nothing about the picture.
    if (l < 0.12 || l > 0.9 || s < 0.12) continue;

    const key = Math.round(h / 12) * 12;
    const bucket = buckets.get(key) ?? { weight: 0, r: 0, g: 0, b: 0, count: 0 };

    bucket.weight += s * (1 - Math.abs(l - 0.5));
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  if (!buckets.size) throw new Error('The background has no colour strong enough to take.');

  const winner = [...buckets.values()].sort((a, b) => b.weight - a.weight)[0];
  const { h, s, l } = rgbToHsl(winner.r / winner.count, winner.g / winner.count, winner.b / winner.count);

  // A near-monochrome picture still has to yield a colour you can pick out.
  const lifted = hslToRgb(h, Math.min(0.75, Math.max(0.28, s)), Math.min(0.66, Math.max(0.44, l)));

  return toHex(...lifted);
};

const signature = {
  DEFAULT_SIGNATURE,
  PRESETS,
  read,
  apply,
  set: setSignature,
  sample,
  hasBackgroundImage: () => Boolean(backgroundImageUrl()),
};

export {
  DEFAULT_SIGNATURE,
  PRESETS as SIGNATURE_PRESETS,
  read as readSignature,
  apply as applySignature,
  setSignature,
  sample as sampleBackgroundSignature,
};
export default signature;
