import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { useEffect, useState } from 'react';
import { MdAdd, MdDeleteOutline } from 'react-icons/md';

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

// The card lists what the profile asks for, one at a time up to a dozen.
const COUNTS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const REFRESH = ['15', '30', '60', '120'];
// Hours a kept article may sit unused before the page drops it.
const KEEP = [
  { value: '24', text: '1 day' },
  { value: '72', text: '3 days' },
  { value: '168', text: '7 days' },
  { value: '336', text: '14 days' },
];

/**
 * The controls read their stored value when they mount, so the defaults have to be in
 * place before the panel renders. Written in an effect they arrive after it, and a
 * profile that has never touched these shows the first option instead of the default.
 */
const seedDefaults = () => {
  const defaults = {
    rssFullArticle: 'true',
    rssItemCount: '3',
    rssRefreshMinutes: '30',
    rssArticleTtl: '168',
  };

  for (const [key, value] of Object.entries(defaults)) {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
  }
};

seedDefaults();

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
  useTranslationVersion();
  const [feeds, setFeeds] = useState(readFeeds());
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [access, setAccess] = useState({});

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
    const granted = await grantAccess(url);
    setAccess((previous) => ({ ...previous, [url]: granted ? 'granted' : 'missing' }));
    forgetItems();
    EventBus.emit('refresh', 'rss');
  };

  const remove = (url) => commit(feeds.filter((feed) => feed.url !== url));

  return (
    <>
      <Header title={uiText('rss_fcae0f')} />

      <Group>
        <Section
          title={uiText('feeds_ffe8e9')}
          subtitle={uiText('see_stories_from_all_your_feeds_in_one_list_n_0f4b60')}
        />

        {feeds.map((feed) => (
          <Row key={feed.url} className="rssFeedRow">
            <Content title={feed.title || feedTitle(feed.url)} subtitle={feed.url} />
            <Action>
              {access[feed.url] === 'missing' ? (
                <button className="rssOptionButton" type="button" onClick={() => allow(feed.url)}>
                  {uiText('allow_3ad0e3')}
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
            title={uiText('add_a_feed_f00cf4')}
            subtitle={uiText('any_rss_or_atom_address_adding_it_asks_the_br_d4723c')}
          />
        </Row>

        {/* The address is the longest thing typed in these settings, so it takes the row
            rather than the action column, with the add itself as the glyph at its end. */}
        <Row>
          <div className="rssFeedField">
            <input
              className="rssOptionInput"
              type="url"
              value={draft}
              placeholder={uiText('example_com_feed_xml_098287')}
              aria-label={uiText('feed_address_3d4c56')}
              onChange={(event) => {
                setDraft(event.target.value);
                setError('');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') add();
              }}
            />
            <button
              className="rssOptionGlyph"
              type="button"
              onClick={add}
              aria-label={uiText('add_feed_6aa1f2')}
              title={uiText('add_feed_6aa1f2')}
            >
              <MdAdd />
            </button>
          </div>
        </Row>

        {error ? (
          <Row>
            <Content subtitle={error} />
          </Row>
        ) : null}
      </Group>

      <Group>
        <Section
          title={uiText('reading_cffa2a')}
          subtitle={uiText('choose_how_many_stories_to_show_and_when_to_c_3ab1a2')}
        />

        <Row>
          <Content
            title={uiText('headlines_shown_a65e5c')}
            subtitle={uiText('the_number_of_stories_shown_on_your_page_8534f1')}
          />
          <Action>
            <Dropdown
              name="rssItemCount"
              category="rss"
              items={COUNTS.map((value) => ({ value, text: value }))}
            />
          </Action>
        </Row>

        <Row>
          <Content
            title={uiText('check_for_new_stories_every_04beb9')}
            subtitle={uiText('in_minutes_952e8d')}
          />
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
            title={uiText('full_articles_7f2177')}
            subtitle={uiText('load_articles_in_advance_so_you_can_read_them_cb2d13')}
          />
          <Action>
            <Checkbox name="rssFullArticle" category="rss" text="Full Articles on Hover" />
          </Action>
        </Row>

        <Row>
          <Content
            title={uiText('keep_full_articles_for_c11890')}
            subtitle={uiText('save_articles_for_this_long_before_loading_th_c0a27c')}
          />
          <Action>
            <Dropdown name="rssArticleTtl" category="rss" items={KEEP} />
          </Action>
        </Row>

        <WidgetSurface setting="surfaceRss" category="rss" title={uiText('rss_panel_07f858')} />
      </Group>
    </>
  );
};

export { RssOptions };

export default RssOptions;
