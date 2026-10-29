import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { marked } from 'marked';

// Render tokens as React elements; raw HTML remains text in this privileged page.

const SAFE_SCHEME = /^(https?:|mailto:)/i;

const safeHref = (href) => {
  const value = String(href || '').trim();

  // A relative link has nowhere to go on a new tab page.
  return SAFE_SCHEME.test(value) ? value : null;
};

const inline = (tokens = [], label = false, linkTarget = '_blank') =>
  tokens.map((token, index) => {
    const key = `${token.type}-${index}`;

    switch (token.type) {
      case 'strong':
        return <strong key={key}>{inline(token.tokens, label, linkTarget)}</strong>;
      case 'em':
        return <em key={key}>{inline(token.tokens, label, linkTarget)}</em>;
      case 'del':
        return <del key={key}>{inline(token.tokens, label, linkTarget)}</del>;
      case 'codespan':
        return <code key={key}>{token.text}</code>;
      case 'br':
        return <br key={key} />;
      case 'link': {
        const href = safeHref(token.href);

        return href && !label ? (
          <a key={key} href={href} target={linkTarget} rel="noreferrer noopener">
            {inline(token.tokens, label, linkTarget)}
          </a>
        ) : (
          <span key={key}>{inline(token.tokens, label, linkTarget)}</span>
        );
      }
      case 'image': {
        const src = safeHref(token.href);
        return !label && src && /^https?:/i.test(src) ? (
          <img
            key={key}
            src={src}
            alt={token.text || ''}
            title={token.title || undefined}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span key={key}>{token.text}</span>
        );
      }
      case 'text':
        return token.tokens ? (
          <span key={key}>{inline(token.tokens, label, linkTarget)}</span>
        ) : (
          token.text
        );
      case 'escape':
        return token.text;
      case 'html':
        return <span key={key}>{token.text}</span>;
      default:
        return token.text ?? token.raw ?? null;
    }
  });

const blocks = (tokens = [], linkTarget = '_blank') =>
  tokens.map((token, index) => {
    const key = `${token.type}-${index}`;

    switch (token.type) {
      case 'checkbox':
        return null; // The list item renders its checkbox once, before its contents.
      case 'space':
        return null;
      case 'heading': {
        // Honours the depth written; clamping to h3 flattened every deeper heading.
        const Tag = `h${Math.min(6, Math.max(1, token.depth || 1))}`;

        return <Tag key={key}>{inline(token.tokens, false, linkTarget)}</Tag>;
      }
      case 'paragraph':
        return <p key={key}>{inline(token.tokens, false, linkTarget)}</p>;
      case 'list': {
        const Tag = token.ordered ? 'ol' : 'ul';

        return (
          <Tag key={key} start={token.ordered && token.start !== 1 ? token.start : undefined}>
            {token.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`}>
                {item.task && (
                  <input
                    type="checkbox"
                    checked={Boolean(item.checked)}
                    disabled
                    aria-label={
                      item.checked ? uiText('task_completed') : uiText('task_not_completed')
                    }
                  />
                )}
                {blocks(item.tokens || [], linkTarget)}
              </li>
            ))}
          </Tag>
        );
      }
      case 'blockquote':
        return <blockquote key={key}>{blocks(token.tokens, linkTarget)}</blockquote>;
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
              <thead>
                <tr>
                  {token.header.map((cell, i) => (
                    <th key={i} style={{ textAlign: token.align[i] || undefined }}>
                      {inline(cell.tokens, false, linkTarget)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {token.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ textAlign: token.align[j] || undefined }}>
                        {inline(cell.tokens, false, linkTarget)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
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
          <p key={key}>{inline(token.tokens, false, linkTarget)}</p>
        ) : (
          <p key={key} className="scratchNoteRaw">
            {token.raw ?? token.text}
          </p>
        );
    }
  });

const Markdown = ({ text, linkTarget = '_blank' }) => {
  useTranslationVersion();
  return <>{blocks(marked.lexer(text || ''), linkTarget)}</>;
};

// Checklist labels live inside edit buttons, so their markup must stay phrasing content.
const labelBlocks = (tokens) =>
  tokens.map((token, index) => {
    const key = `${token.type}-${index}`;
    if (token.type === 'space') return null;
    if (token.type === 'heading')
      return (
        <span key={key} className="scratchChecklistMarkdownHeading" data-level={token.depth}>
          {inline(token.tokens, true)}
        </span>
      );
    if (token.type === 'blockquote')
      return (
        <span key={key} className="scratchChecklistMarkdownQuote">
          {labelBlocks(token.tokens)}
        </span>
      );
    if (token.type === 'code') return <code key={key}>{token.text}</code>;
    if (token.type === 'hr') return <span key={key} className="scratchChecklistMarkdownRule" />;
    if (token.type === 'list')
      return (
        <span key={key} className="scratchChecklistMarkdownList">
          {token.items.map((item, i) => (
            <span key={i}>
              {token.ordered ? `${token.start + i}. ` : '• '}
              {labelBlocks(item.tokens)}
            </span>
          ))}
        </span>
      );
    return (
      <span key={key} className="scratchChecklistMarkdownParagraph">
        {token.tokens ? inline(token.tokens, true) : (token.text ?? token.raw)}
      </span>
    );
  });

export function ChecklistMarkdown({ text }) {
  return <span className="scratchChecklistMarkdown">{labelBlocks(marked.lexer(text || ''))}</span>;
}

const labelText = (tokens) =>
  tokens
    .map((token) => {
      if (token.type === 'space') return ' ';
      if (token.type === 'list') return token.items.map((item) => labelText(item.tokens)).join(' ');
      return token.tokens ? labelText(token.tokens) : token.text || '';
    })
    .join('');

export const checklistLabel = (text) =>
  labelText(marked.lexer(text || ''))
    .replace(/\s+/g, ' ')
    .trim();

export { Markdown as default, Markdown };
