function Row(props) {
  const classes = `${props.final ? 'settingsRow settingsNoBorder' : 'settingsRow'} ${props.inactive ? 'preferencesInactive' : ''}`;
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
