import { marked } from 'marked';

/**
 * Renders note markdown as React elements instead of HTML. This page holds
 * extension privileges, so marked's tokens never become DOM: raw HTML shows as
 * text, images are dropped, and links are limited to http(s) and mailto.
 */

const SAFE_SCHEME = /^(https?:|mailto:)/i;

const safeHref = (href) => {
  const value = String(href || '').trim();

  // A relative link has nowhere to go on a new tab page.
  return SAFE_SCHEME.test(value) ? value : null;
};

const inline = (tokens = []) =>
  tokens.map((token, index) => {
    const key = `${token.type}-${index}`;

    switch (token.type) {
      case 'strong':
        return <strong key={key}>{inline(token.tokens)}</strong>;
      case 'em':
        return <em key={key}>{inline(token.tokens)}</em>;
      case 'del':
        return <del key={key}>{inline(token.tokens)}</del>;
      case 'codespan':
        return <code key={key}>{token.text}</code>;
      case 'br':
        return <br key={key} />;
      case 'link': {
        const href = safeHref(token.href);

        return href ? (
          <a key={key} href={href} target="_blank" rel="noreferrer noopener">
            {inline(token.tokens)}
          </a>
        ) : (
          <span key={key}>{inline(token.tokens)}</span>
        );
      }
      // Drawing an image would fetch a third-party server; only its alt text is shown.
      case 'image':
        return <span key={key}>{token.text}</span>;
      case 'text':
        return token.tokens ? <span key={key}>{inline(token.tokens)}</span> : token.text;
      case 'escape':
        return token.text;
      case 'html':
        return <span key={key}>{token.text}</span>;
      default:
        return token.text ?? token.raw ?? null;
    }
  });

const blocks = (tokens = []) =>
  tokens.map((token, index) => {
    const key = `${token.type}-${index}`;

    switch (token.type) {
      case 'space':
        return null;
      case 'heading': {
        // Honours the depth written; clamping to h3 flattened every deeper heading.
        const Tag = `h${Math.min(6, Math.max(1, token.depth || 1))}`;

        return <Tag key={key}>{inline(token.tokens)}</Tag>;
      }
      case 'paragraph':
        return <p key={key}>{inline(token.tokens)}</p>;
      case 'list': {
        const Tag = token.ordered ? 'ol' : 'ul';

        return (
          <Tag key={key} start={token.ordered && token.start !== 1 ? token.start : undefined}>
            {token.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>{blocks(item.tokens || [])}</li>
            ))}
          </Tag>
        );
      }
      case 'blockquote':
        return <blockquote key={key}>{blocks(token.tokens)}</blockquote>;
      case 'code':
        return (
          <pre key={key}>
            <code>{token.text}</code>
          </pre>
        );
      case 'hr':
        return <hr key={key} />;
      // Tables are beyond a sticky note, so the raw text is shown.
      case 'table':
      case 'html':
        return (
          <p key={key} className="scratchNoteRaw">
            {token.raw}
          </p>
        );
      // Tight list items arrive as bare text tokens that still carry inline markup.
      default:
        return token.tokens?.length ? (
          <p key={key}>{inline(token.tokens)}</p>
        ) : (
          <p key={key} className="scratchNoteRaw">
            {token.raw ?? token.text}
          </p>
        );
    }
  });

const Markdown = ({ text }) => <>{blocks(marked.lexer(text || ''))}</>;

export { Markdown as default, Markdown };
