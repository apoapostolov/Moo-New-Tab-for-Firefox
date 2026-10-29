import { feedTitle, normaliseUrl, SEPARATOR } from './feedStore';

/**
 * OPML is a nested list of <outline> elements: one carrying xmlUrl is a feed, one
 * carrying only a title is a folder. Exporters disagree about attribute case, about
 * whether the label lives in text or title, and about escaping, so the document is
 * scanned tag by tag instead of parsed as XML. One unescaped ampersand from another
 * reader should cost that line, not the whole import.
 */

const TOKEN = /<\s*(\/?)\s*outline\b([^>]*)>/gi;
const ATTR = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
const ENTITY = /&(#\d+|#x[0-9a-f]+|[a-z][a-z\d]*);/gi;
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** A pasted subscription list can be long; this is a stop, not a target. */
const MAX_FEEDS = 1000;

const decode = (value) =>
  String(value ?? '').replace(ENTITY, (match, code) => {
    if (code[0] === '#') {
      const point =
        code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1));

      return Number.isFinite(point) && point > 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : match;
    }

    return NAMED[code.toLowerCase()] ?? match;
  });

const attributes = (source) => {
  const found = {};

  for (const match of String(source || '').matchAll(ATTR)) {
    found[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4] ?? '');
  }

  return found;
};

const folderOf = (stack) =>
  stack
    .filter(Boolean)
    .join(SEPARATOR)
    .trim();

const escape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * `{ feeds, skipped, error }`. A feed is `{ url, title, folder }`, where the folder is
 * the path an exporter nested it under, joined with the same separator the writer reads
 * back, so an export of an import lands the feeds where they were.
 */
export function parseOpml(text) {
  const source = String(text || '');

  if (!/<opml[\s>]/i.test(source)) return { feeds: [], skipped: 0, error: 'not_opml' };

  const feeds = [];
  const seen = new Set();
  const stack = [];
  let skipped = 0;

  for (const token of source.matchAll(TOKEN)) {
    const body = token[2] || '';

    if (token[1] === '/') {
      stack.pop();
      continue;
    }

    const selfClosing = /\/\s*$/.test(body);
    const attrs = attributes(body);
    const url = normaliseUrl(attrs.xmlurl || attrs.url || '');
    const label = (attrs.title || attrs.text || '').trim();

    if (url) {
      if (seen.has(url)) {
        skipped += 1;
      } else if (feeds.length >= MAX_FEEDS) {
        skipped += 1;
      } else {
        seen.add(url);
        feeds.push({ url, title: label || feedTitle(url), folder: folderOf(stack) });
      }

      // A feed element that is not self-closing still has a closing tag to consume.
      if (!selfClosing) stack.push('');

      continue;
    }

    if (!selfClosing) stack.push(label);
  }

  return { feeds, skipped, error: feeds.length ? '' : 'no_feeds' };
}

/**
 * A Feedly, Inoreader or NetNewsWire export of what Moo holds, as OPML 2.0. Feeds with
 * no folder sit at the top level; folders are written as nested outlines in the order
 * they were first seen.
 */
export function buildOpml(feeds, { title = 'Moo feeds' } = {}) {
  const root = { children: new Map(), feeds: [] };

  for (const feed of Array.isArray(feeds) ? feeds : []) {
    const url = normaliseUrl(feed?.url);

    if (!url) continue;

    const path = String(feed.folder || '')
      .split(SEPARATOR)
      .map((part) => part.trim())
      .filter(Boolean);

    let node = root;

    for (const name of path) {
      if (!node.children.has(name)) node.children.set(name, { children: new Map(), feeds: [] });
      node = node.children.get(name);
    }

    node.feeds.push({ url, title: String(feed.title || '').trim() || feedTitle(url) });
  }

  const rows = [];

  const walk = (node, depth) => {
    const pad = '  '.repeat(depth);

    for (const [name, child] of node.children) {
      if (!child.children.size && !child.feeds.length) {
        rows.push(`${pad}<outline text="${escape(name)}" title="${escape(name)}"/>`);
        continue;
      }

      rows.push(`${pad}<outline text="${escape(name)}" title="${escape(name)}">`);
      walk(child, depth + 1);
      rows.push(`${pad}</outline>`);
    }

    for (const feed of node.feeds) {
      const label = escape(feed.title);
      rows.push(
        `${pad}<outline type="rss" text="${label}" title="${label}" xmlUrl="${escape(feed.url)}"/>`,
      );
    }
  };

  walk(root, 2);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="2.0">',
    '  <head>',
    `    <title>${escape(title)}</title>`,
    '  </head>',
    '  <body>',
    ...rows,
    '  </body>',
    '</opml>',
    '',
  ].join('\n');
}

/** The file name an export is saved under, dated so two exports cannot overwrite. */
export const opmlFilename = (stamp = new Date()) =>
  `moo-feeds-${stamp.toISOString().slice(0, 10)}.opml`;
