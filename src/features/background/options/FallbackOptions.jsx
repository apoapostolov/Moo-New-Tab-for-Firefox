import { useTranslationVersion } from 'contexts/TranslationContext';
import { uiText } from 'lib/translations';
import { Row, Content, Action } from 'components/Layout/Settings';
import { Dropdown } from 'components/Form/Settings';
import { MdBackup } from 'react-icons/md';
import NavigationCard from './sections/NavigationCard';
import './fallbackOptions.scss';
import { getBackgroundOptionItems } from './optionTypes';

export default function FallbackOptions({ onTypeChange, onOpen }) {
  useTranslationVersion();
  const subtitle = uiText('fallback_source_hint');
  const selector = (
    <Dropdown
      label={uiText('fallback_source')}
      name="fallbackBackgroundType"
      category="backgroundsource"
      onChange={onTypeChange}
      items={[
        { value: 'none', text: uiText('fallback_offline_image') },
        ...getBackgroundOptionItems(localStorage.getItem('photo_packs')),
      ]}
    />
  );
  return onOpen ? (
    <NavigationCard
      className="backgroundProviderCard fallbackProviderCard"
      icon={MdBackup}
      title={uiText('fallback_source')}
      subtitle={subtitle}
      onClick={onOpen}
      action={selector}
    />
  ) : (
    <Row>
      <Content title={uiText('fallback_source')} subtitle={subtitle} />
      <Action>{selector}</Action>
    </Row>
  );
}
