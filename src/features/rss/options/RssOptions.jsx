import { useEffect, useState } from 'react';
import { MdDeleteOutline } from 'react-icons/md';

import { Header, Row, Content, Action, Group } from 'components/Layout/Settings';
import { Checkbox, Dropdown } from 'components/Form/Settings';
import WidgetSurface from 'components/Form/Settings/WidgetSurface/WidgetSurface';
import EventBus from 'utils/eventbus';

import {
  feedAccess,
  feedTitle,
  forgetItems,
  grantAccess,
  normaliseUrl,
  readFeeds,
  saveFeeds,
} from '../feedStore';

const COUNTS = ['6', '8', '12', '20'];
const REFRESH = ['15', '30', '60', '120'];

const Section = ({ title, subtitle }) => (
  <Row>
    <Content title={title} subtitle={subtitle} />
  </Row>
);

/**
 * Feeds are one list, and the page draws them as one: the card has no idea which
 * feed a headline came from beyond naming it. Adding a feed asks the browser for
 * access to that host, since a feed on a host the page cannot reach answers nothing.
 */
const RssOptions = () => {
  const [feeds, setFeeds] = useState(readFeeds());
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [access, setAccess] = useState({});

  // The switches read a stored value, so the defaults have to exist before them.
  useEffect(() => {
    if (localStorage.getItem('rssFullArticle') === null) localStorage.setItem('rssFullArticle', 'true');
    if (localStorage.getItem('rssItemCount') === null) localStorage.setItem('rssItemCount', '12');
    if (localStorage.getItem('rssRefreshMinutes') === null) {
      localStorage.setItem('rssRefreshMinutes', '30');
    }
  }, []);

  useEffect(() => {
    let live = true;

    (async () => {
      const next = {};

      for (const feed of feeds) next[feed.url] = await feedAccess(feed.url);

      if (live) setAccess(next);
    })();

    return () => {
      live = false;
    };
  }, [feeds]);

  const commit = (next) => {
    saveFeeds(next);
    setFeeds(next);
    forgetItems();
    EventBus.emit('refresh', 'rss');
  };

  const add = async () => {
    const url = normaliseUrl(draft);

    if (!url) {
      setError('That does not look like an address.');
      return;
    }

    if (feeds.some((feed) => feed.url === url)) {
      setError('That feed is already in the list.');
      return;
    }

    setError('');

    // Permission has to be asked for inside the click that leads here.
    await grantAccess(url);

    commit([...feeds, { url, title: feedTitle(url) }]);
    setDraft('');
  };

  const allow = async (url) => {
    await grantAccess(url);
    setAccess((previous) => ({ ...previous, [url]: 'granted' }));
    forgetItems();
    EventBus.emit('refresh', 'rss');
  };

  const remove = (url) => commit(feeds.filter((feed) => feed.url !== url));

  return (
    <>
      <Header title="RSS" />

      <Group>
        <Section
          title="Feeds"
          subtitle="Every feed here is merged into one list, newest first. A duplicate story is shown once."
        />

        {feeds.map((feed) => (
          <Row key={feed.url}>
            <Content title={feed.title || feedTitle(feed.url)} subtitle={feed.url} />
            <Action>
              {access[feed.url] === 'missing' ? (
                <button className="rssOptionButton" type="button" onClick={() => allow(feed.url)}>
                  Allow
                </button>
              ) : null}
              <button
                className="rssOptionIcon"
                type="button"
                aria-label={`Remove ${feed.title || feed.url}`}
                onClick={() => remove(feed.url)}
              >
                <MdDeleteOutline />
              </button>
            </Action>
          </Row>
        ))}

        <Row>
          <Content
            title="Add a feed"
            subtitle="Any RSS or Atom address. Adding it asks the browser to let the page read that site."
          />
          <Action>
            <input
              className="rssOptionInput"
              type="url"
              value={draft}
              placeholder="example.com/feed.xml"
              aria-label="Feed address"
              onChange={(event) => {
                setDraft(event.target.value);
                setError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') add();
              }}
            />
            <button className="rssOptionButton" type="button" onClick={add}>
              Add
            </button>
          </Action>
        </Row>

        {error ? (
          <Row>
            <Content subtitle={error} />
          </Row>
        ) : null}
      </Group>

      <Group>
        <Section
          title="Reading"
          subtitle="What the card draws and how often it looks for new stories."
        />

        <Row>
          <Content title="Headlines shown" subtitle="How many of the merged stories the card lists." />
          <Action>
            <Dropdown
              name="rssItemCount"
              category="rss"
              items={COUNTS.map((value) => ({ value, text: value }))}
            />
          </Action>
        </Row>

        <Row>
          <Content title="Check for new stories every" subtitle="In minutes." />
          <Action>
            <Dropdown
              name="rssRefreshMinutes"
              category="rss"
              items={REFRESH.map((value) => ({ value, text: `${value} min` }))}
            />
          </Action>
        </Row>

        <Row>
          <Content
            title="Read the whole article"
            subtitle="Hovering a headline fetches the story and shows it in the reader. Turned off, the feed's own summary is shown."
          />
          <Action>
            <Checkbox
              name="rssFullArticle"
              category="rss"
              text="Fetch on hover"
            />
          </Action>
        </Row>

        <WidgetSurface setting="surfaceRss" category="rss" title="RSS panel" />
      </Group>
    </>
  );
};

export { RssOptions };

export default RssOptions;
