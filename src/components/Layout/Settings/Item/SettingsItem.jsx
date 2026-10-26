import { useTranslationVersion } from 'contexts/TranslationContext';
import { createContext, useContext, useId } from 'react';

export const RowLabelContext = createContext(null);

function Row(props) {
  useTranslationVersion();
  const labelId = useId();
  // `className` lets a page mark rows that are not settings — a feed in a list, a line of
  // content — without wrapping them, which would break the group's own child selectors.
  const classes = [
    'settingsRow',
    props.final && 'settingsNoBorder',
    props.inactive && 'preferencesInactive',
    props.className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <RowLabelContext.Provider value={labelId}>
      <div className={classes}>{props.children}</div>
    </RowLabelContext.Provider>
  );
}

function Content(props) {
  useTranslationVersion();
  const labelId = useContext(RowLabelContext);
  return (
    <div className="content">
      <span className="title" id={labelId || undefined}>
        {props.title}
      </span>
      <span className="subtitle">{props.subtitle}</span>
    </div>
  );
}

function Action(props) {
  useTranslationVersion();
  return <div className="action">{props.children}</div>;
}

/** A row that configures one thing. Rows in a group are not separated: a rule between two halves
 * of one setting implies a seam that is not there. The last row in a group must not be `final`. */
function Group(props) {
  useTranslationVersion();
  return <div className="settingsGroup">{props.children}</div>;
}

export { Row, Content, Action, Group };
