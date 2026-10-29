import { useMemo } from 'react';
import { createElement } from 'react';
import { marked } from 'marked';
import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { githubBodyUrl } from './githubPresentation';

const ALLOWED = new Set([
  'p',
  'br',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'strong',
  'b',
  'em',
  'i',
  'del',
  's',
  'strike',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'colgroup',
  'col',
  'tr',
  'th',
  'td',
  'a',
  'img',
  'details',
  'summary',
  'div',
  'span',
  'kbd',
  'sub',
  'sup',
  'dl',
  'dt',
  'dd',
  'figure',
  'figcaption',
  'video',
  'audio',
  'source',
  'picture',
]);
const OMIT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
  'form',
  'button',
  'textarea',
  'select',
  'template',
  'noscript',
]);

export function githubBodyNodes(
  markdown,
  item,
  taskLabels = { done: uiText('task_completed'), pending: uiText('task_not_completed') },
) {
  const doc = new DOMParser().parseFromString(
    marked.parse(markdown || '', { gfm: true }),
    'text/html',
  );
  const render = (node, key) => {
    if (node.nodeType === 3) {
      if (
        !node.textContent.trim() &&
        ['TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'COLGROUP'].includes(node.parentElement?.tagName)
      )
        return null;
      return node.textContent;
    }
    if (node.nodeType !== 1) return null;
    const tag = node.tagName.toLowerCase();
    if (OMIT.has(tag)) return null;
    const children = () =>
      [...node.childNodes].map((child, index) => render(child, `${key}-${index}`));
    if (tag === 'input')
      return node.getAttribute('type') === 'checkbox' ? (
        <input
          key={key}
          type="checkbox"
          disabled
          checked={node.hasAttribute('checked')}
          aria-label={node.hasAttribute('checked') ? taskLabels.done : taskLabels.pending}
        />
      ) : null;
    if (!ALLOWED.has(tag)) return children();
    const props = { key };
    if (tag === 'a') {
      const href = githubBodyUrl(node.getAttribute('href'), item);
      if (!href) return <span key={key}>{children()}</span>;
      Object.assign(props, { href, target: '_blank', rel: 'noopener noreferrer' });
    }
    if (['img', 'video', 'audio', 'source'].includes(tag)) {
      const src = githubBodyUrl(node.getAttribute('src'), item, true);
      if (!src) return node.getAttribute('alt') || null;
      props.src = src;
      if (tag === 'img')
        Object.assign(props, {
          alt: node.getAttribute('alt') || '',
          loading: 'lazy',
          referrerPolicy: 'no-referrer',
        });
      if (tag === 'video' || tag === 'audio')
        Object.assign(props, { controls: true, preload: 'none' });
      if (
        tag === 'source' &&
        /^(image|audio|video)\/[a-z\d.+-]+$/i.test(node.getAttribute('type') || '')
      )
        props.type = node.getAttribute('type');
    }
    if (node.getAttribute('title')) props.title = node.getAttribute('title');
    if (tag === 'ol' && /^\d{1,6}$/.test(node.getAttribute('start') || ''))
      props.start = Number(node.getAttribute('start'));
    if (tag === 'details') props.open = node.hasAttribute('open');
    if (
      (tag === 'td' || tag === 'th') &&
      /^(left|right|center)$/.test(node.getAttribute('align') || '')
    )
      props.style = { textAlign: node.getAttribute('align') };
    if (tag === 'code' && /^language-[a-z\d_-]+$/i.test(node.className))
      props.className = node.className;
    if (['img', 'hr', 'br', 'source', 'col'].includes(tag)) return createElement(tag, props);
    return createElement(tag, props, children());
  };
  return [...doc.body.childNodes].map((node, index) => render(node, String(index)));
}

export default function GitHubBody({ item }) {
  useTranslationVersion();
  const done = uiText('task_completed');
  const pending = uiText('task_not_completed');
  const content = useMemo(() => {
    try {
      return githubBodyNodes(item.body || '', item, { done, pending });
    } catch {
      return <pre>{item.body}</pre>;
    }
  }, [item, done, pending]);
  return <div className="githubBody">{content}</div>;
}
