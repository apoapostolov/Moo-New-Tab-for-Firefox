function Row(props) {
  // `className` lets a page mark rows that are not settings — a feed in a list, a line of
  // content — without wrapping them, which would break the group's own child selectors.
  const classes = ['settingsRow', props.final && 'settingsNoBorder', props.inactive && 'preferencesInactive', props.className]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{props.children}</div>;
}

function Content(props) {
  return (
    <div className="content">
      <span className="title">{props.title}</span>
      <span className="subtitle">{props.subtitle}</span>
    </div>
  );
}

function Action(props) {
  return <div className="action">{props.children}</div>;
}

/** A row that configures one thing. Rows in a group are not separated: a rule between two halves
 * of one setting implies a seam that is not there. The last row in a group must not be `final`. */
function Group(props) {
  return <div className="settingsGroup">{props.children}</div>;
}

export { Row, Content, Action, Group };
