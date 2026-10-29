import { createElement, Fragment, useMemo } from 'react';

import { eventUrl } from '../eventDetails';

const elements = new Set([
  'p',
  'div',
  'br',
  'strong',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'code',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
]);
const omitted = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'img',
  'svg',
  'math',
  'link',
  'meta',
  'template',
  'form',
  'input',
  'button',
]);

/** Read inert template nodes into React; source markup and resource elements are never inserted. */
export default function EventDescription({ text }) {
  const content = useMemo(() => {
    if (!globalThis.document?.createElement) return text;
    const template = document.createElement('template');
    template.innerHTML = String(text || '');
    const render = (nodes, path = '') =>
      [...nodes].map((node, index) => {
        const key = `${path}:${index}`;
        if (node.nodeType === 3) return node.textContent;
        if (node.nodeType !== 1) return null;
        const tag = node.tagName.toLowerCase();
        if (omitted.has(tag)) return null;
        const children = render(node.childNodes, key);
        if (tag === 'a') {
          const href = eventUrl(node.getAttribute('href'));
          return href ? (
            <a key={key} href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ) : (
            <Fragment key={key}>{children}</Fragment>
          );
        }
        const safeTag = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag;
        if (!elements.has(safeTag)) return <Fragment key={key}>{children}</Fragment>;
        return createElement(safeTag, { key }, ...(safeTag === 'br' ? [] : children));
      });
    return render(template.content.childNodes);
  }, [text]);
  return <div className="gwEventDescription">{content}</div>;
}
