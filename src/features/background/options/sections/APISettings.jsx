import variables from 'config/variables';
import { Dropdown, Text, ChipSelect } from 'components/Form/Settings';
import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { APIQualityOptions } from '../optionTypes';
import { LIVE_CHANNELS, LIVE_CHANNEL_ANY } from '../../api/live';

const clearPrefetch = () => {
  localStorage.removeItem('imageQueue');
  localStorage.removeItem('videoQueue');
};

const loadingItems = [
  { value: 'loading', text: variables.getMessage('modals.main.loading') },
  { value: 'loading', text: variables.getMessage('modals.main.loading') },
];

const APISettings = ({ backgroundAPI, backgroundCategories, unsplashTopics }) => {
  const loading = backgroundCategories[0] === variables.getMessage('modals.main.loading');

  const categoriesControl = (options) =>
    loading ? (
      <Dropdown
        label={variables.getMessage('modals.main.settings.sections.background.category')}
        name="apiCategories"
        items={loadingItems}
      />
    ) : (
      <ChipSelect
        key="apiCategories"
        label={variables.getMessage('modals.main.settings.sections.background.categories')}
        options={options}
        name="apiCategories"
        onChange={clearPrefetch}
      />
    );

  // A loaded topic list becomes chips; until then the dropdown shows the loading state.
  const topicsControl = Array.isArray(unsplashTopics) ? (
    <ChipSelect
      key="unsplashTopics"
      label={variables.getMessage('modals.main.settings.sections.background.unsplash.topics')}
      options={unsplashTopics}
      name="unsplashTopics"
      storageKey="unsplashTopics"
      onChange={clearPrefetch}
    />
  ) : (
    <Dropdown
      label={variables.getMessage('modals.main.settings.sections.background.unsplash.topics')}
      name="unsplashTopics"
      items={loadingItems}
    />
  );

  const qualityControl = (
    <Dropdown
      label={variables.getMessage('modals.main.settings.sections.background.source.quality.title')}
      name="apiQuality"
      element=".other"
      items={APIQualityOptions}
      onChange={clearPrefetch}
    />
  );

  if (backgroundAPI === 'coverr') {
    return (
      <Row final={true}>
        <Content
          title={variables.getMessage('modals.main.settings.sections.background.coverr.title')}
          subtitle={variables.getMessage(
            'modals.main.settings.sections.background.coverr.subtitle',
          )}
        />
        <Action>
          <Text
            title={variables.getMessage('modals.main.settings.sections.background.coverr.search')}
            subtitle={variables.getMessage(
              'modals.main.settings.sections.background.coverr.search_subtitle',
            )}
            placeholder="e.g. ocean, forest, city"
            name="coverrQuery"
            category="backgroundrefresh"
            onChange={clearPrefetch}
          />
        </Action>
      </Row>
    );
  }

  // Pixabay and Pexels both need a key the user creates on their own account.
  const keyedVideoSource = (source) => {
    const base = `modals.main.settings.sections.background.${source}`;

    return (
      <Row final={true}>
        <Content
          title={variables.getMessage(`${base}.title`)}
          subtitle={variables.getMessage(`${base}.subtitle`)}
        />
        <Action>
          <Text
            title={variables.getMessage(`${base}.key`)}
            subtitle={variables.getMessage(`${base}.key_subtitle`)}
            placeholder={variables.getMessage(`${base}.key_placeholder`)}
            name={`${source}Key`}
            category="backgroundrefresh"
            onChange={clearPrefetch}
          />
          <Text
            title={variables.getMessage(`${base}.search`)}
            subtitle={variables.getMessage(`${base}.search_subtitle`)}
            placeholder="e.g. ocean, forest, city"
            name={`${source}Query`}
            category="backgroundrefresh"
            onChange={clearPrefetch}
          />
        </Action>
      </Row>
    );
  };

  if (backgroundAPI === 'pixabay' || backgroundAPI === 'pexels') {
    return keyedVideoSource(backgroundAPI);
  }

  if (backgroundAPI === 'live') {
    const liveItems = [
      {
        value: LIVE_CHANNEL_ANY,
        text: variables.getMessage('modals.main.settings.sections.background.live.channel_any'),
      },
      ...LIVE_CHANNELS.map((channel) => ({
        value: channel.id,
        text: `${channel.name} (${channel.quality})`,
      })),
    ];

    return (
      <Row final={true}>
        <Content
          title={variables.getMessage('modals.main.settings.sections.background.live.title')}
          subtitle={variables.getMessage('modals.main.settings.sections.background.live.subtitle')}
        />
        <Action>
          <Dropdown
            label={variables.getMessage('modals.main.settings.sections.background.live.channel')}
            name="liveChannel"
            items={liveItems}
            category="backgroundrefresh"
            onChange={clearPrefetch}
          />
        </Action>
      </Row>
    );
  }

  // Unsplash is the fallback panel: a profile with an unknown API value still
  // renders settings rather than a blank section.
  return (
    <Row final={true}>
      <Content
        title={variables.getMessage(
          'modals.main.settings.sections.background.unsplash.section_title',
        )}
        subtitle={variables.getMessage(
          'modals.main.settings.sections.background.unsplash.section_subtitle',
        )}
      />
      <Action>
        {topicsControl}
        <Text
          title={variables.getMessage('modals.main.settings.sections.background.unsplash.id')}
          subtitle={variables.getMessage(
            'modals.main.settings.sections.background.unsplash.id_subtitle',
          )}
          placeholder="e.g. 123456, 654321"
          name="unsplashCollections"
          category="background"
          element="#backgroundImage"
          onChange={clearPrefetch}
        />
        {qualityControl}
      </Action>
    </Row>
  );
};

export default APISettings;