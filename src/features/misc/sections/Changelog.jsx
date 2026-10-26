import { useMemo } from 'react';
import { marked } from 'marked';

import changelogSource from '../../../../CHANGELOG.md?raw';

import './Changelog.scss';

// A changelog link leaves the new tab page, so it opens in its own tab.
const linkProps = {
  target: '_blank',
  rel: 'noopener noreferrer',
};

const renderInline = (tokens = []) =>
  tokens.map((token, index) => {
    switch (token.type) {
      case 'text':
        return token.tokens
          ? <span key={index}>{renderInline(token.tokens)}</span>
          : token.text;

      case 'strong':
        return <strong key={index}>{renderInline(token.tokens)}</strong>;

      case 'em':
        return <em key={index}>{renderInline(token.tokens)}</em>;

      case 'codespan':
        return <code key={index}>{token.text}</code>;

      case 'link':
        return (
          <a key={index} href={token.href} {...linkProps}>
            {renderInline(token.tokens)}
          </a>
        );

      case 'br':
        return <br key={index} />;

      default:
        return token.raw ?? token.text ?? null;
    }
  });

// A list item wraps its content in a text token and a paragraph does not; unwrap
// it so both render alike.
const inlineOf = (token) => token.tokens?.[0]?.tokens ?? token.tokens ?? [];

const splitHeading = (text) => {
  const [version, date] = text.split(/\s+[—–-]\s+/);

  return { version: version?.trim() || text, date: date?.trim() };
};

const renderBlock = (token, index) => {
  switch (token.type) {
    case 'paragraph':
      return (
        <p key={index} className="releaseSummary">
          {renderInline(token.tokens)}
        </p>
      );

    case 'heading':
      return (
        <h3 key={index} className="releaseGroup">
          {renderInline(token.tokens)}
        </h3>
      );

    case 'list':
      return (
        <ul key={index} className="releaseItems">
          {token.items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(inlineOf(item))}</li>
          ))}
        </ul>
      );

    case 'hr':
      return <hr key={index} className="releaseRule" />;

    default:
      return null;
  }
};

const readReleases = (source) => {
  const releases = [];
  let current = null;

  marked.lexer(source).forEach((token) => {
    if (token.type === 'heading' && token.depth === 2) {
      current = { version: splitHeading(token.text), blocks: [] };
      releases.push(current);
      return;
    }

    // Everything after a release heading belongs to it, including the depth-3 group titles.
    if (!current) return;

    current.blocks.push(token);
  });

  return releases;
};

const Changelog = () => {
  const releases = useMemo(() => readReleases(changelogSource), []);

  return (
    <div className="changelog">
      {releases.map((release) => (
        <section className="release" key={release.version.version}>
          <header className="releaseHead">
            <h2 className="releaseVersion">{release.version.version}</h2>
            {release.version.date && <span className="releaseDate">{release.version.date}</span>}
          </header>
          {release.blocks.map(renderBlock)}
        </section>
      ))}
    </div>
  );
};

export { Changelog as default, Changelog };
