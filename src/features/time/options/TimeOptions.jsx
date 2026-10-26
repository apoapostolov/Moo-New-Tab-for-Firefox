import variables from 'config/variables';
import React, { useState } from 'react';

import {
  Header,
  Row,
  Content,
  Action,
  Group,
  PreferencesWrapper,
} from 'components/Layout/Settings';
import { Checkbox, Dropdown, Radio, Text } from 'components/Form/Settings';

import EventBus from 'utils/eventbus';

import { MdRefresh } from 'react-icons/md';

import DateOptions from './DateOptions';
import {
  WEEKDAYS,
  readPercentageDays,
  readPercentageFallback,
  savePercentageDays,
} from 'utils/clockDays';

import './timeOptions.scss';

const TimeOptions = () => {
  const [timeType, setTimeType] = useState(localStorage.getItem('timeType') || 'digital');
  const [hourColour, setHourColour] = useState(localStorage.getItem('hourColour') || '#ffffff');
  const [minuteColour, setMinuteColour] = useState(
    localStorage.getItem('minuteColour') || '#ffffff',
  );
  const [secondColour, setSecondColour] = useState(
    localStorage.getItem('secondColour') || '#ffffff',
  );
  // Tracked here because this section toggles the date and dims its options like the rest.
  const [dateEnabled, setDateEnabled] = useState(localStorage.getItem('date') === 'true');
  const [percentageDays, setPercentageDays] = useState(readPercentageDays);
  // Off means the Progress clock applies every day, so the day rows below stop applying.
  const [percentageFallback, setPercentageFallback] = useState(readPercentageFallback);
  const TIME_SECTION = 'modals.main.settings.sections.time';

  const updateColour = (type, event) => {
    const colour = event.target.value;
    if (type === 'hourColour') {
      setHourColour(colour);
    } else if (type === 'minuteColour') {
      setMinuteColour(colour);
    } else if (type === 'secondColour') {
      setSecondColour(colour);
    }
    localStorage.setItem(type, colour);
  };

  const WidgetType = () => {
    return (
      <Row final={timeType !== 'percentageComplete'}>
        <Content
          title={variables.getMessage(`${TIME_SECTION}.type`)}
          subtitle={variables.getMessage(`${TIME_SECTION}.type_subtitle`)}
        />
        <Action>
          <Dropdown
            name="timeType"
            onChange={(value) => setTimeType(value)}
            category="clock"
            items={[
              { value: 'digital', text: variables.getMessage(`${TIME_SECTION}.digital.title`) },
              { value: 'analogue', text: variables.getMessage(`${TIME_SECTION}.analogue.title`) },
              {
                value: 'percentageComplete',
                text: variables.getMessage(`${TIME_SECTION}.percentage_complete`),
              },
              {
                value: 'verticalClock',
                text: variables.getMessage(`${TIME_SECTION}.vertical_clock.title`),
              },
            ]}
          />
        </Action>
      </Row>
    );
  };

  const toggleDay = (day) => {
    const next = percentageDays.includes(day)
      ? percentageDays.filter((item) => item !== day)
      : [...percentageDays, day];

    setPercentageDays(next);
    savePercentageDays(next);
    EventBus.emit('refresh', 'clock');
  };

  /**
   * A work shift turns the percentage into progress through the working day:
   * 9 and 17 means 50% at one in the afternoon, not 54% of the whole day.
   */
  const percentageSettings = (
    <>
      <Row>
        <Content
          title={variables.getMessage(`${TIME_SECTION}.percentage.shift_title`)}
          subtitle={variables.getMessage(`${TIME_SECTION}.percentage.shift_subtitle`)}
        />
        <Action>
          <Text
            name="percentageStart"
            title={variables.getMessage(`${TIME_SECTION}.percentage.shift_start`)}
            placeholder="9:00"
            onChange={() => EventBus.emit('refresh', 'clock')}
          />
          <Text
            name="percentageEnd"
            title={variables.getMessage(`${TIME_SECTION}.percentage.shift_end`)}
            placeholder="17:00"
            onChange={() => EventBus.emit('refresh', 'clock')}
          />
        </Action>
      </Row>

      {/* The clock answers only on the days switched on here, so a work week
          keeps its percentage and the weekend stays an ordinary clock. */}
      <Row>
        <Content
          title={variables.getMessage(`${TIME_SECTION}.percentage.days_title`)}
          subtitle={variables.getMessage(`${TIME_SECTION}.percentage.days_subtitle`)}
        />
        <Action>
          <div className="daySwitcher">
            {WEEKDAYS.map((day) => {
              const on = percentageDays.includes(day.value);

              return (
                <button
                  type="button"
                  key={day.label}
                  className={on ? 'daySwitch daySwitchOn' : 'daySwitch'}
                  aria-pressed={on}
                  disabled={!percentageFallback}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </Action>
      </Row>

      {/* The days above mean nothing once the clock stops switching, and neither
          does the fallback picked below, so both say so by dimming. */}
      <Row>
        <Content
          title={variables.getMessage(`${TIME_SECTION}.percentage.fallback_title`)}
          subtitle={variables.getMessage(`${TIME_SECTION}.percentage.fallback_subtitle`)}
        />
        <Action>
          <Checkbox
            name="percentageFallback"
            text={variables.getMessage(`${TIME_SECTION}.percentage.fallback_switch`)}
            category="clock"
            onChange={(value) => setPercentageFallback(value)}
          />
        </Action>
      </Row>

      <Row>
        <Content
          title={variables.getMessage(`${TIME_SECTION}.percentage.other_title`)}
          subtitle={variables.getMessage(`${TIME_SECTION}.percentage.other_subtitle`)}
        />
        <Action>
          <Dropdown
            name="percentageOffType"
            category="clock"
            disabled={!percentageFallback}
            items={[
              { value: 'digital', text: variables.getMessage(`${TIME_SECTION}.digital.title`) },
              { value: 'analogue', text: variables.getMessage(`${TIME_SECTION}.analogue.title`) },
              {
                value: 'verticalClock',
                text: variables.getMessage(`${TIME_SECTION}.vertical_clock.title`),
              },
            ]}
          />
        </Action>
      </Row>

      {/* A glance at the other clock without leaving the page. It only applies while
          Progress is the clock being replaced; outside its days and shift the fallback
          is already showing. */}
      <Row final>
        <Content
          title={variables.getMessage(`${TIME_SECTION}.percentage.doubleclick_title`)}
          subtitle={variables.getMessage(`${TIME_SECTION}.percentage.doubleclick_subtitle`)}
        />
        <Action>
          <Checkbox
            name="percentageDoubleClick"
            text={variables.getMessage(`${TIME_SECTION}.percentage.doubleclick_switch`)}
            category="clock"
          />
        </Action>
      </Row>
    </>
  );

  const digitalSettings = (
    <Row final={true}>
      <Content
        title={variables.getMessage(`${TIME_SECTION}.digital.title`)}
        subtitle={variables.getMessage(`${TIME_SECTION}.digital.subtitle`)}
      />
      <Action>
        <Radio
          name="timeformat"
          options={[
            {
              name: variables.getMessage(`${TIME_SECTION}.digital.twentyfourhour`),
              value: 'twentyfourhour',
            },
            {
              name: variables.getMessage(`${TIME_SECTION}.digital.twelvehour`),
              value: 'twelvehour',
            },
          ]}
          smallTitle={true}
          category="clock"
        />
        <Checkbox
          name="seconds"
          text={variables.getMessage(`${TIME_SECTION}.digital.seconds`)}
          category="clock"
        />
        <Checkbox
          name="zero"
          text={variables.getMessage(`${TIME_SECTION}.digital.zero`)}
          category="clock"
        />
      </Action>
    </Row>
  );

  const analogSettings = (
    <Row final={true}>
      <Content
        title={variables.getMessage(`${TIME_SECTION}.analogue.title`)}
        subtitle={variables.getMessage(`${TIME_SECTION}.analogue.subtitle`)}
      />
      <Action>
        <Checkbox
          name="secondHand"
          text={variables.getMessage(`${TIME_SECTION}.analogue.second_hand`)}
          category="clock"
        />
        <Checkbox
          name="minuteHand"
          text={variables.getMessage(`${TIME_SECTION}.analogue.minute_hand`)}
          category="clock"
        />
        <Checkbox
          name="hourHand"
          text={variables.getMessage(`${TIME_SECTION}.analogue.hour_hand`)}
          category="clock"
        />
        <Checkbox
          name="hourMarks"
          text={variables.getMessage(`${TIME_SECTION}.analogue.hour_marks`)}
          category="clock"
        />
        <Checkbox
          name="minuteMarks"
          text={variables.getMessage(`${TIME_SECTION}.analogue.minute_marks`)}
          category="clock"
        />
      </Action>
    </Row>
  );

  const verticalClock = (
    <>
      <Row>
        <Content
          title={variables.getMessage(
            'modals.main.settings.sections.time.vertical_clock.change_hour_colour',
          )}
        />
        <Action>
          <div className="colourInput">
            <input
              type="color"
              name="hourColour"
              className="minuteColour"
              onChange={(event) => updateColour('hourColour', event)}
              value={hourColour}
            ></input>
            <label htmlFor={'hourColour'} className="customBackgroundHex">
              {hourColour}
            </label>
          </div>
          <span className="link" onClick={() => localStorage.setItem('hourColour', '#ffffff')}>
            <MdRefresh />
            {variables.getMessage('modals.main.settings.buttons.reset')}
          </span>
        </Action>
      </Row>
      <Row>
        <Content
          title={variables.getMessage(
            'modals.main.settings.sections.time.vertical_clock.change_minute_colour',
          )}
        />
        <Action>
          <div className="colourInput">
            <input
              type="color"
              name="minuteColour"
              className="minuteColour"
              onChange={(event) => updateColour('minuteColour', event)}
              value={minuteColour}
            ></input>
            <label htmlFor={'minuteColour'} className="customBackgroundHex">
              {minuteColour}
            </label>
          </div>
          <span className="link" onClick={() => localStorage.setItem('minuteColour', '#ffffff')}>
            <MdRefresh />
            {variables.getMessage('modals.main.settings.buttons.reset')}
          </span>
        </Action>
      </Row>
      <Row>
        <Content
          title={variables.getMessage(
            'modals.main.settings.sections.time.vertical_clock.change_second_colour',
          )}
        />
        <Action>
          <div className="colourInput">
            <input
              type="color"
              name="secondColour"
              className="secondColour"
              onChange={(event) => updateColour('secondColour', event)}
              value={secondColour}
            ></input>
            <label htmlFor={'secondColour'} className="customBackgroundHex">
              {secondColour}
            </label>
          </div>
          <span className="link" onClick={() => localStorage.setItem('secondColour', '#ffffff')}>
            <MdRefresh />
            {variables.getMessage('modals.main.settings.buttons.reset')}
          </span>
        </Action>
      </Row>

      {digitalSettings}
    </>
  );

  const getTimeSettings = () => {
    switch (timeType) {
      case 'digital':
        return digitalSettings;
      case 'analogue':
        return analogSettings;
      case 'verticalClock':
        return verticalClock;
      case 'percentageComplete':
        return percentageSettings;
      default:
        return null;
    }
  };

  return (
    <>
      <Header
        title={variables.getMessage(`${TIME_SECTION}.title`)}
        setting="time"
        category="clock"
        element=".clock-container"
        zoomSetting="zoomClock"
        visibilityToggle={true}
      />
      <PreferencesWrapper
        setting="time"
        zoomSetting="zoomClock"
        category="clock"
        visibilityToggle={true}
      >
        <Group>
          <WidgetType />
          {getTimeSettings()}
        </Group>
      </PreferencesWrapper>

      {/* The date is part of the clock, so it sits at the end of the time
          options instead of owning a tab of its own. The switch below is the
          date's on/off, the same flag the widget order reads. */}
      <Group>
        <Row>
          <Content
            title={variables.getMessage('modals.main.settings.sections.date.title')}
            subtitle={variables.getMessage('modals.main.settings.sections.date.show_subtitle')}
          />
          <Action>
            <Checkbox
              name="date"
              text={variables.getMessage('modals.main.settings.sections.date.show')}
              category="widgets"
              onChange={setDateEnabled}
            />
          </Action>
        </Row>
        <PreferencesWrapper
          key={dateEnabled ? 'date-on' : 'date-off'}
          setting="date"
          zoomSetting="zoomDate"
          category="date"
        >
          <DateOptions />
        </PreferencesWrapper>
      </Group>
    </>
  );
};

export { TimeOptions as default, TimeOptions };
