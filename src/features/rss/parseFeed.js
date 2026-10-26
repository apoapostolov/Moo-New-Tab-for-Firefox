/**
 * Feeds arrive in three dialects: RSS 2.0 (`rss > channel > item`), RSS 1.0
 * (`rdf:RDF > item`) and Atom (`feed > entry`). All three leave here as the same
 * item, so nothing downstream has to know which one a headline came from.
 */

const NAMED = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  middot: '·',
  copy: '©',
};

const fromCodePoint = (value) => {
  try {
    return String.fromCodePoint(value);
  } catch {
    return '';
  }
};

/** Entities in a feed are often double-escaped: `&amp;nbsp;` is a space, not `&nbsp;`. */
const decode = (value) =>
  String(value || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => fromCodePoint(Number(dec)))
    .replace(/&([a-z]+[0-9]*);/gi, (match, name) => NAMED[name.toLowerCase()] ?? match);

/** Text only: tags removed, entities decoded, whitespace collapsed. */
const plain = (value) =>
  decode(decode(String(value || '').replace(/<[^>]*>/g, ' ')).replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const children = (element) => Array.from(element?.children || []);

/** Namespace prefixes are dropped, so `content:encoded` reads as `encoded`. */
const name = (element) => (element.localName || element.nodeName || '').toLowerCase();

const child = (element, ...names) => children(element).find((node) => names.includes(name(node)));

const childText = (element, ...names) => {
  const node = child(element, ...names);

  return node ? plain(node.textContent) : '';
};

/** Atom keeps the address in `href`, RSS and RDF keep it in the text. */
const linkOf = (element) => {
  const anchors = children(element)
    .filter((node) => name(node) === 'link')
    .sort(
      (a, b) =>
        Number(b.getAttribute('rel') === 'alternate') -
        Number(a.getAttribute('rel') === 'alternate'),
    );

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');

    if (href) return decode(href).trim();

    const text = plain(anchor.textContent);

    if (text) return text;
  }

  return childText(element, 'id');
};

export const resolveFeedUrl = (value, base) => {
  if (!value) return '';
  try {
    const url = new URL(value, base);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

const dateOf = (element) => {
  const raw = childText(element, 'pubdate', 'published', 'updated', 'date', 'created', 'issued');
  const parsed = raw ? Date.parse(raw) : NaN;

  return Number.isNaN(parsed) ? null : parsed;
};

const imageOf = (element, html) => {
  for (const node of children(element)) {
    const kind = name(node);
    const url = node.getAttribute('url');
    const type = node.getAttribute('type') || '';

    if (!url) continue;
    if ((kind === 'content' || kind === 'thumbnail') && (!type || type.startsWith('image'))) {
      return decode(url);
    }
    if (kind === 'enclosure' && type.startsWith('image')) return decode(url);
  }

  const match = String(html || '').match(/<img[^>]+src=["']([^"']+)["']/i);

  return match ? decode(match[1]) : null;
};

const titleOf = (element) => {
  const title = childText(element, 'title');

  if (title) return title;

  const link = linkOf(element);

  try {
    return new URL(link).hostname.replace(/^www\./, '');
  } catch {
    return 'Untitled';
  }
};

/**
 * `{ title, items }` for one feed, or a throw when the body is not a feed at all.
 * `feedUrl` only names the source when the feed does not name itself.
 */
export function parseFeed(xml, feedUrl) {
  if (!String(xml || '').trim()) throw new Error('empty feed');

  const doc = new DOMParser().parseFromString(String(xml), 'text/xml');

  if (doc.getElementsByTagName('parsererror').length) throw new Error('not a feed');

  const root = doc.documentElement;
  let channel = root;
  let entries = [];

  if (name(root) === 'feed') {
    entries = children(root).filter((node) => name(node) === 'entry');
  } else {
    channel = child(root, 'channel') || root;
    entries = children(channel).filter((node) => name(node) === 'item');

    // RSS 1.0 puts its items beside the channel, inside rdf:RDF.
    if (!entries.length) entries = children(root).filter((node) => name(node) === 'item');
  }

  let title = childText(channel, 'title');

  if (!title) {
    try {
      title = new URL(feedUrl).hostname.replace(/^www\./, '');
    } catch {
      title = 'Feed';
    }
  }

  const source = { title, url: feedUrl };

  const items = entries
    .map((entry, index) => {
      const html = child(entry, 'encoded', 'content', 'summary', 'description')?.textContent || '';
      const link = resolveFeedUrl(linkOf(entry), feedUrl);

      return {
        id: childText(entry, 'guid', 'id') || link || `${feedUrl}#${index}`,
        title: titleOf(entry),
        link,
        date: dateOf(entry),
        excerpt: plain(html),
        image: resolveFeedUrl(imageOf(entry, html), feedUrl) || null,
        source,
      };
    })
    .filter((item) => item.link);

  return { title, items };
}
