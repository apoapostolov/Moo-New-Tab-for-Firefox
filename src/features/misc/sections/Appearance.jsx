import { memo, useCallback, useEffect, useState } from 'react';

import variables from 'config/variables';
import EventBus from 'utils/eventbus';

import { Checkbox, Dropdown, Radio, Slider, Text } from 'components/Form/Settings';
import { Header, Section, Row, Content, Action, Group } from 'components/Layout/Settings';

import { MdAccessibility } from 'react-icons/md';

import values from 'utils/data/slider_values.json';

import {
  SIGNATURE_PRESETS as PRESETS,
  readSignature,
  setSignature,
  sampleBackgroundSignature,
} from '../signature';

import './Appearance.scss';

/**
 * Reads its translation keys from `misc`: the heading and subtitle exist there in
 * every locale, and a new path would be blank wherever it is missing.
 */
const SIGNATURE_SECTION = 'modals.main.settings.sections.misc.signature';

// Same shape the Misc page uses for a labelled group.
const GroupHeading = ({ title, subtitle }) => (
  <Row>
    <Content title={title} subtitle={subtitle} />
  </Row>
);

function AppearanceOptions({ currentSubSection, onSubSectionChange, sectionName }) {
  const ThemeSelection = () => {
    return (
      <Row>
        <Content
          title={variables.getMessage('modals.main.settings.sections.appearance.theme.title')}
          subtitle={variables.getMessage(
            'modals.main.settings.sections.appearance.theme.description',
          )}
        />
        <Action>
          <Radio
            name="theme"
            options={[
              {
                name: variables.getMessage('modals.main.settings.sections.appearance.theme.auto'),
                value: 'auto',
              },
              {
                name: variables.getMessage('modals.main.settings.sections.appearance.theme.light'),
                value: 'light',
              },
              {
                name: variables.getMessage('modals.main.settings.sections.appearance.theme.dark'),
                value: 'dark',
              },
            ]}
            category="other"
          />
        </Action>
      </Row>
    );
  };

  const [colour, setColour] = useState(readSignature);
  const [trouble, setTrouble] = useState('');
  const [sampling, setSampling] = useState(false);

  useEffect(() => {
    const reread = () => setColour(readSignature());

    EventBus.on('refresh', reread);

    return () => EventBus.off('refresh', reread);
  }, []);

  const choose = useCallback((hex) => {
    setTrouble('');
    setSignature(hex);
    setColour(hex);
  }, []);

  const takeFromBackground = useCallback(async () => {
    setTrouble('');
    setSampling(true);

    try {
      choose(await sampleBackgroundSignature());
    } catch (sampleError) {
      setTrouble(sampleError.message);
    } finally {
      setSampling(false);
    }
  }, [choose]);

  /**
   * Grouped with the theme and font: the colour runs through links, ticks and
   * switches, so it is a look decision, not an advanced one.
   */
  const SignatureOptions = () => {
    return (
      <Group>
        <GroupHeading
          title={variables.getMessage(`${SIGNATURE_SECTION}.title`)}
          subtitle={variables.getMessage(`${SIGNATURE_SECTION}.subtitle`)}
        />
        <Row>
          <Content
            title={variables.getMessage(`${SIGNATURE_SECTION}.colour.title`)}
            subtitle={trouble || variables.getMessage(`${SIGNATURE_SECTION}.colour.subtitle`)}
          />
          <Action>
            <div className="signaturePicker">
              {PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`signatureSwatch${colour.toLowerCase() === preset.value ? ' active' : ''}`}
                  style={{ '--swatch': preset.value }}
                  title={preset.name}
                  aria-label={preset.name}
                  onClick={() => choose(preset.value)}
                />
              ))}
              <label className="signatureCustom" title="Any colour you like">
                <input
                  type="color"
                  value={colour}
                  aria-label="Pick any colour"
                  onChange={(event) => choose(event.target.value)}
                />
              </label>
            </div>
            <button
              type="button"
              className="signatureSample"
              disabled={sampling}
              onClick={takeFromBackground}
            >
              {sampling ? 'Reading…' : 'From the background'}
            </button>
          </Action>
        </Row>
      </Group>
    );
  };

  const FontOptions = () => {
    const fontWeight = 'modals.main.settings.sections.appearance.font.weight';
    return (
      <Row final={true}>
        <Content
          title={variables.getMessage('modals.main.settings.sections.appearance.font.title')}
          subtitle={variables.getMessage(
            'modals.main.settings.sections.appearance.font.description',
          )}
        />
        <Action>
          <Checkbox
            name="fontGoogle"
            text={variables.getMessage('modals.main.settings.sections.appearance.font.google')}
            category="other"
          />
          <Text
            title={variables.getMessage('modals.main.settings.sections.appearance.font.custom')}
            name="font"
            upperCaseFirst={true}
            category="other"
          />
          {/* names are taken from https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight */}
          <Dropdown
            label={variables.getMessage(
              'modals.main.settings.sections.appearance.font.weight.title',
            )}
            name="fontweight"
            category="other"
            items={[
              {
                value: '100',
                text: variables.getMessage(fontWeight + '.thin'),
              },
              {
                value: '200',
                text: variables.getMessage(fontWeight + '.extra_light'),
              },
              {
                value: '300',
                text: variables.getMessage(fontWeight + '.light'),
              },
              {
                value: '400',
                text: variables.getMessage(fontWeight + '.normal'),
              },
              {
                value: '500',
                text: variables.getMessage(fontWeight + '.medium'),
              },
              {
                value: '600',
                text: variables.getMessage(fontWeight + '.semi_bold'),
              },
              {
                value: '700',
                text: variables.getMessage(fontWeight + '.bold'),
              },
              {
                value: '800',
                text: variables.getMessage(fontWeight + '.extra_bold'),
              },
            ]}
          />
          <Dropdown
            label={variables.getMessage(
              'modals.main.settings.sections.appearance.font.style.title',
            )}
            name="fontstyle"
            category="other"
            items={[
              {
                value: 'normal',
                text: variables.getMessage(
                  'modals.main.settings.sections.appearance.font.style.normal',
                ),
              },
              {
                value: 'italic',
                text: variables.getMessage(
                  'modals.main.settings.sections.appearance.font.style.italic',
                ),
              },
              {
                value: 'oblique',
                text: variables.getMessage(
                  'modals.main.settings.sections.appearance.font.style.oblique',
                ),
              },
            ]}
          />
        </Action>
      </Row>
    );
  };

  const AccessibilityOptions = () => {
    return (
      <Row final={true}>
        <Content
          title={variables.getMessage(
            'modals.main.settings.sections.appearance.accessibility.title',
          )}
          subtitle={variables.getMessage(
            'modals.main.settings.sections.appearance.accessibility.description',
          )}
        />
        <Action>
          <Dropdown
            label={variables.getMessage(
              'modals.main.settings.sections.appearance.accessibility.text_shadow.title',
            )}
            name="textBorder"
            category="other"
            items={[
              {
                value: 'new',
                text: variables.getMessage(
                  'modals.main.settings.sections.appearance.accessibility.text_shadow.new',
                ),
              },
              {
                value: 'true',
                text: variables.getMessage(
                  'modals.main.settings.sections.appearance.accessibility.text_shadow.old',
                ),
              },
              {
                value: 'none',
                text: variables.getMessage(
                  'modals.main.settings.sections.appearance.accessibility.text_shadow.none',
                ),
              },
            ]}
          />
          <Checkbox
            text={variables.getMessage(
              'modals.main.settings.sections.appearance.accessibility.animations',
            )}
            name="animations"
            category="other"
          />
          <Slider
            title={variables.getMessage(
              'modals.main.settings.sections.appearance.accessibility.toast_duration',
            )}
            name="toastDisplayTime"
            default="2500"
            step="100"
            min="500"
            max="5000"
            marks={values.toast}
            display={
              ' ' +
              variables.getMessage(
                'modals.main.settings.sections.appearance.accessibility.milliseconds',
              )
            }
          />
        </Action>
      </Row>
    );
  };

  const isAccessibilitySection = currentSubSection === 'accessibility';

  let header;
  if (isAccessibilitySection) {
    header = (
      <Header
        title={variables.getMessage('modals.main.settings.sections.appearance.title')}
        secondaryTitle={variables.getMessage(
          'modals.main.settings.sections.appearance.accessibility.title',
        )}
        goBack={() => onSubSectionChange(null, sectionName)}
        report={false}
      />
    );
  } else {
    header = (
      <Header
        title={variables.getMessage('modals.main.settings.sections.appearance.title')}
        report={false}
      />
    );
  }
  return (
    <>
      {header}
      {isAccessibilitySection ? (
        <AccessibilityOptions />
      ) : (
        <>
          <Section
            title={variables.getMessage(
              'modals.main.settings.sections.appearance.accessibility.title',
            )}
            subtitle={variables.getMessage(
              'modals.main.settings.sections.appearance.accessibility.description',
            )}
            icon={<MdAccessibility />}
            onClick={() => onSubSectionChange('accessibility', sectionName)}
          />
          <ThemeSelection />
          <SignatureOptions />
          <FontOptions />
        </>
      )}
    </>
  );
}

const MemoizedAppearanceOptions = memo(AppearanceOptions);
export { MemoizedAppearanceOptions as default, MemoizedAppearanceOptions as AppearanceOptions };
