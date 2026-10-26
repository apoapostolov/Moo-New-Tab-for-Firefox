/**
 * The article behind a headline, reduced to what a reader needs: a lead image and
 * blocks of text. Nothing from the page is kept as markup, so a page cannot put
 * anything of its own into the new tab.
 */

const DROP = [
  'script',
  'style',
  'noscript',
  'iframe',
  'form',
  'nav',
  'footer',
  'header',
  'aside',
  'svg',
  'button',
  'figcaption',
  'video',
  'audio',
  '.share',
  '.sharing',
  '.social',
  '.related',
  '.newsletter',
  '.comments',
  '.advert',
  '.advertisement',
  '[aria-hidden="true"]',
].join(', ');

/** The places a story usually lives. The one holding the most text wins. */
const CANDIDATES = [
  'article',
  '[role="main"]',
  'main',
  '.post-content',
  '.entry-content',
  '.article-body',
  '.article__body',
  '.story-body',
  '.post-body',
  '#content',
  '.content',
].join(', ');

const BLOCKS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre']);

const MAX_BLOCKS = 260;
const MAX_CHARS = 16000;

const clean = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

const blockTag = (tag) => {
  if (tag === 'blockquote') return 'quote';
  if (tag === 'li') return 'li';
  if (tag === 'pre') return 'pre';
  if (tag === 'h1') return 'h2';

  return tag;
};

const collect = (container) => {
  const blocks = [];
  const seen = new Set();
  let characters = 0;

  const walk = (node) => {
    for (const element of Array.from(node.children)) {
      if (blocks.length >= MAX_BLOCKS || characters >= MAX_CHARS) return;

      const tag = element.localName;

      if (BLOCKS.has(tag)) {
        const text = clean(element.textContent);

        // A paragraph inside a list item repeats the item's text; keep the first.
        if (text.length > 1 && !seen.has(text)) {
          seen.add(text);
          blocks.push({ tag: blockTag(tag), text });
          characters += text.length;
        }
      } else {
        walk(element);
      }
    }
  };

  walk(container);

  return blocks;
};

const leadImage = (doc, container) => {
  for (const image of Array.from(container.querySelectorAll('img'))) {
    const src = image.getAttribute('src') || image.getAttribute('data-src');

    if (src && /^https?:/i.test(src)) return src;
  }

  const meta = doc.querySelector('meta[property="og:image"], meta[name="og:image"]');

  return meta?.getAttribute('content') || null;
};

/**
 * `{ title, image, blocks }` from a page's HTML. Text is taken as text, so the
 * result is safe to render whatever the page contained.
 */
export function extractArticle(html, url) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');

  doc.querySelectorAll(DROP).forEach((node) => node.remove());

  const candidates = Array.from(doc.querySelectorAll(CANDIDATES));
  const scored = (candidates.length ? candidates : [doc.body])
    .filter(Boolean)
    .map((node) => ({ node, size: clean(node.textContent).length }))
    .sort((a, b) => b.size - a.size);

  const container = scored[0]?.node || doc.body;
  const heading = container.querySelector('h1') || doc.querySelector('h1');
  const title = clean(heading?.textContent) || clean(doc.title);

  return {
    url,
    title,
    image: container ? leadImage(doc, container) : null,
    blocks: container ? collect(container) : [],
  };
}

/** Fetches the page and reads it. Credentials are left out: this is not a signed-in visit. */
export async function fetchArticle(url, { signal } = {}) {
  if (localStorage.getItem('offlineMode') === 'true') throw new Error('Moo is in offline mode.');
  const response = await fetch(url, {
    headers: { Accept: 'text/html,application/xhtml+xml' },
    credentials: 'omit',
    redirect: 'follow',
    signal,
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const article = extractArticle(await response.text(), url);

  if (!article.blocks.length) throw new Error('nothing to read');

  return article;
}
