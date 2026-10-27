import { marked } from 'marked';

// Render tokens as React elements; raw HTML remains text in this privileged page.

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
      case 'image': {
        const src = safeHref(token.href);
        return src && /^https?:/i.test(src) ? (
          <img key={key} src={src} alt={token.text || ''} title={token.title || undefined} loading="lazy" referrerPolicy="no-referrer" />
        ) : <span key={key}>{token.text}</span>;
      }
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
              <li key={`${key}-${itemIndex}`}>
                {item.task && <input type="checkbox" checked={Boolean(item.checked)} disabled aria-label={item.checked ? 'Completed' : 'Not completed'} />}
                {blocks(item.tokens || [])}
              </li>
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
      case 'table':
        return (
          <div className="scratchNoteTable" key={key}>
            <table>
              <thead><tr>{token.header.map((cell, i) => <th key={i} style={{ textAlign: token.align[i] || undefined }}>{inline(cell.tokens)}</th>)}</tr></thead>
              <tbody>{token.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} style={{ textAlign: token.align[j] || undefined }}>{inline(cell.tokens)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        );
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
