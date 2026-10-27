import { uiText } from 'lib/translations';
import { useTranslationVersion } from 'contexts/TranslationContext';
import { Fragment, useCallback, useEffect, useState } from 'react';

import {
  MdInbox,
  MdPeople,
  MdLocalOffer,
  MdNotifications,
  MdForum,
  MdFolder,
} from 'react-icons/md';

import EventBus from 'utils/eventbus';

import { Row, Content, Action } from 'components/Layout/Settings/Item';
import { Checkbox, Dropdown, Text } from 'components/Form/Settings';

import { listCalendars } from '../services/calendar';
import { listLabels } from '../services/gmail';
import { listTaskLists } from '../services/tasks';
import {
  CALENDAR_RANGES,
  TASK_DATE_STYLES,
  MAIL_CATEGORIES,
  MAIL_QUERIES,
  REFRESH_OPTIONS,
  TASK_SORTS,
  readCalendarIds,
  readMailCategories,
  readMailFolders,
  readPrimaryCalendar,
} from '../settings';

const CATEGORY_ICONS = {
  primary: MdInbox,
  social: MdPeople,
  promotions: MdLocalOffer,
  updates: MdNotifications,
  forums: MdForum,
};

const options = (list) => list.map((entry) => ({ value: entry.value, text: entry.label }));

const MAX_EVENTS = [
  { value: '5', label: '5 events' },
  { value: '8', label: '8 events' },
  { value: '12', label: '12 events' },
  { value: '20', label: '20 events' },
  { value: '50', label: '50 events' },
];

const MAX_ITEMS = [
  { value: '5', label: '5 items' },
  { value: '10', label: '10 items' },
  { value: '20', label: '20 items' },
  { value: '50', label: '50 items' },
];

const MAX_MAIL = [
  { value: '3', label: '3 messages' },
  { value: '6', label: '6 messages' },
  { value: '10', label: '10 messages' },
  { value: '20', label: '20 messages' },
];

const Section = ({ title, subtitle, children }) => (
  <Row>
    <Content title={title} subtitle={subtitle} />
    <Action>{children}</Action>
  </Row>
);

/**
 * Calendars are a checkbox list, not a picker: a picker holding one value cannot express
 * "work and family but not birthdays".
 */
const CalendarPicker = () => {
  useTranslationVersion();
  const [calendars, setCalendars] = useState([]);
  const [selected, setSelected] = useState(readCalendarIds);
  const [primary, setPrimary] = useState(readPrimaryCalendar);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    listCalendars()
      .then(setCalendars)
      .catch(() => setFailed(true));
  }, []);

  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((entry) => entry !== id)
      : [...selected, id];

    setSelected(next);
    localStorage.setItem('googleCalendarIds', JSON.stringify(next));
    // The widgets listen for this category through the same bus the settings screen uses.
    EventBus.emit('refresh', 'google');
  };

  /**
   * Only one calendar can be the start calendar, so ticking a second moves the mark. Ticking the
   * marked one clears it, and the next new event opens on whichever calendar was used last.
   */
  const pickPrimary = (id) => {
    const next = primary === id ? '' : id;

    setPrimary(next);
    localStorage.setItem('googlePrimaryCalendar', next);
  };

  if (failed) {
    return (
      <p className="gwEmpty">{uiText('calendars_could_not_be_listed_disconnect_and_a35520')}</p>
    );
  }

  if (!calendars.length)
    return <p className="gwEmpty">{uiText('reading_your_calendars_e7d8b6')}</p>;

  return (
    <div className="gwCalendarPicker">
      {calendars.map((calendar) => {
        const writable = calendar.accessRole === 'owner' || calendar.accessRole === 'writer';

        return (
          // The row is not one label any more: a tick inside it would otherwise also switch the
          // calendar on or off.
          <div key={calendar.id} className="gwCalendarOption">
            <label className="gwCalendarTick">
              <input
                type="checkbox"
                checked={selected.includes(calendar.id)}
                onChange={() => toggle(calendar.id)}
              />
              <span
                className="gwDot"
                style={calendar.color ? { background: calendar.color } : {}}
              />
              <span className="gwCalendarName">{calendar.summary}</span>
              {calendar.primary && <span className="gwMuted">{uiText('primary_e3b7c9')}</span>}
            </label>
            <input
              type="checkbox"
              className="gwPrimaryTick"
              checked={primary === calendar.id}
              onChange={() => pickPrimary(calendar.id)}
              disabled={!writable}
              aria-label={`Start new events in ${calendar.summary}`}
              title={writable ? 'New events start here' : 'This calendar is read-only'}
            />
          </div>
        );
      })}
      <span className="gwMuted">
        {selected.length
          ? 'Only the ticked calendars are shown.'
          : 'Nothing ticked: only the primary calendar is shown.'}
      </span>
      <span className="gwMuted">
        {uiText('the_box_on_the_right_is_the_calendar_new_even_2286a9')}
      </span>
    </div>
  );
};

/** One reusable tick list for the mail categories and the labels. */
const OptionTicks = ({ options, selected, onToggle, empty }) => {
  useTranslationVersion();
  if (!options.length) return <p className="gwEmpty">{empty}</p>;

  return (
    <div className="gwOptionList">
      {options.map((option) => {
        const Icon = option.icon;

        return (
          <label key={option.id} className="gwOption">
            <input
              type="checkbox"
              checked={selected.includes(option.id)}
              onChange={() => onToggle(option.id)}
            />
            {Icon && <Icon className="gwOptionIcon" />}
            <span className="gwOptionName">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};

const CategoryPicker = () => {
  useTranslationVersion();
  const [selected, setSelected] = useState(readMailCategories);

  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((entry) => entry !== id)
      : [...selected, id];

    setSelected(next);
    localStorage.setItem('googleMailCategories', JSON.stringify(next));
    EventBus.emit('refresh', 'google');
  };

  return (
    <OptionTicks
      options={MAIL_CATEGORIES.map((category) => ({
        ...category,
        icon: CATEGORY_ICONS[category.id],
      }))}
      selected={selected}
      onToggle={toggle}
      empty="No categories."
    />
  );
};

const FolderPicker = () => {
  useTranslationVersion();
  const [labels, setLabels] = useState([]);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState(readMailFolders);

  useEffect(() => {
    listLabels()
      .then(setLabels)
      .catch(() => setFailed(true));
  }, []);

  const selectedIds = selected.map((folder) => (typeof folder === 'string' ? folder : folder.id));

  const toggle = (label) => {
    const next = selectedIds.includes(label.id)
      ? selected.filter((folder) => (typeof folder === 'string' ? folder : folder.id) !== label.id)
      : [...selected, { id: label.id, name: label.name }];

    setSelected(next);
    localStorage.setItem('googleMailFolders', JSON.stringify(next));
    EventBus.emit('refresh', 'google');
  };

  if (failed) {
    return (
      <p className="gwEmpty">{uiText('folders_could_not_be_read_reconnect_google_an_a7fcda')}</p>
    );
  }

  return (
    <OptionTicks
      options={labels.map((label) => ({ id: label.id, label: label.display, icon: MdFolder }))}
      selected={selectedIds}
      onToggle={(id) => toggle(labels.find((label) => label.id === id))}
      empty="Reading your folders…"
    />
  );
};

const TaskListPicker = () => {
  useTranslationVersion();
  const [lists, setLists] = useState([]);

  useEffect(() => {
    listTaskLists()
      .then(setLists)
      .catch(() => setLists([]));
  }, []);

  if (lists.length < 2) {
    return <span className="gwMuted">{lists[0]?.title ?? 'Your default task list'}</span>;
  }

  return (
    <Dropdown
      name="googleTasksList"
      category="google"
      items={lists.map((list) => ({ value: list.id, text: list.title }))}
    />
  );
};

/** Everything that only makes sense once an account is connected. */
export const GoogleWidgetSettings = () => {
  useTranslationVersion();
  // Nothing is open until one is picked: three sets of controls stacked on top of each other
  // made the page look like every option was already in play.
  const [tab, setTab] = useState(null);

  const tabs = [
    { id: 'mail', label: uiText('mail_92379c') },
    { id: 'calendar', label: uiText('calendar_adab50') },
    { id: 'tasks', label: uiText('tasks_090ec5') },
  ];

  const render = useCallback(() => {
    if (!tab) return null;

    if (tab === 'calendar') {
      return (
        <Fragment key={tab}>
          <Row>
            <Content
              title={uiText('calendars_shown_0b1365')}
              subtitle={uiText('choose_which_calendars_appear_on_your_page_07fd10')}
            />
            <Action>
              <CalendarPicker />
            </Action>
          </Row>
          <Section
            title={uiText('range_a16c5b')}
            subtitle={uiText('how_far_ahead_the_widget_looks_feda5c')}
          >
            <Dropdown
              name="googleCalendarRange"
              category="google"
              items={options(CALENDAR_RANGES)}
            />
          </Section>
          <Section
            title={uiText('events_shown_57f3eb')}
            subtitle={uiText('the_most_events_to_show_at_once_6546bc')}
          >
            <Dropdown name="googleCalendarMax" category="google" items={options(MAX_EVENTS)} />
          </Section>
          <Section
            title={uiText('event_details_bc2a9c')}
            subtitle={uiText('choose_which_details_to_show_with_each_event_211d3b')}
          >
            <Checkbox name="googleCalendarLocation" text="Location" category="google" />
            <Checkbox name="googleCalendarNotes" text="Notes" category="google" />
            <Checkbox name="googleCalendarDeclined" text="Declined events" category="google" />
            <Checkbox
              name="googleCalendarHideAllDay"
              text="Hide all-day events"
              category="google"
            />
          </Section>
          <Section
            title={uiText('layout_972ad8')}
            subtitle={uiText('choose_how_to_group_events_and_show_their_tim_268cbd')}
          >
            <Checkbox name="googleCalendarGroup" text="Group by day" category="google" />
            <Checkbox name="googleCalendar24Hour" text="24-hour times" category="google" />
          </Section>
          <Section
            title={uiText('refresh_56e3ba')}
            subtitle={uiText('how_often_to_check_for_updates_e7f165')}
          >
            <Dropdown
              name="googleCalendarRefresh"
              category="google"
              items={options(REFRESH_OPTIONS)}
            />
          </Section>
        </Fragment>
      );
    }

    if (tab === 'tasks') {
      return (
        <Fragment key={tab}>
          <Row>
            <Content
              title={uiText('task_list_91c40a')}
              subtitle={uiText('choose_where_to_view_and_add_tasks_a2c6f1')}
            />
            <Action>
              <TaskListPicker />
            </Action>
          </Row>
          <Section
            title={uiText('sorting_378e9e')}
            subtitle={uiText('choose_the_order_of_your_tasks_1c693d')}
          >
            <Dropdown name="googleTasksSort" category="google" items={options(TASK_SORTS)} />
            <Checkbox name="googleTasksGroup" text="Group by due date" category="google" />
          </Section>
          <Section
            title={uiText('filtering_9075ed')}
            subtitle={uiText('what_is_left_out_of_the_list_78c20b')}
          >
            <Checkbox name="googleTasksCompleted" text="Show completed tasks" category="google" />
            <Checkbox
              name="googleTasksHideUndated"
              text="Hide tasks without a date"
              category="google"
            />
          </Section>
          <Section
            title={uiText('due_dates_1e24cb')}
            subtitle={uiText('written_as_a_countdown_or_as_a_date_13a7f9')}
          >
            <Dropdown
              name="googleTasksDateStyle"
              category="google"
              items={options(TASK_DATE_STYLES)}
            />
          </Section>
          <Section title={uiText('details_dc3dec')} subtitle={uiText('what_each_row_shows_c9f5b1')}>
            <Checkbox name="googleTasksNotes" text="Notes" category="google" />
            <Dropdown name="googleTasksMax" category="google" items={options(MAX_ITEMS)} />
          </Section>
          <Section
            title={uiText('refresh_56e3ba')}
            subtitle={uiText('how_often_to_check_for_updates_e7f165')}
          >
            <Dropdown
              name="googleTasksRefresh"
              category="google"
              items={options(REFRESH_OPTIONS)}
            />
          </Section>
        </Fragment>
      );
    }

    return (
      <Fragment key={tab}>
        <Row>
          <Content
            title={uiText('inbox_categories_41ffe8')}
            subtitle={uiText('show_messages_from_these_gmail_categories_unt_9e4fb0')}
          />
          <Action>
            <CategoryPicker />
          </Action>
        </Row>
        <Row>
          <Content
            title={uiText('folders_and_labels_3d61b8')}
            subtitle={uiText('include_messages_from_these_folders_and_label_35adee')}
          />
          <Action>
            <FolderPicker />
          </Action>
        </Row>
        <Section
          title={uiText('filter_d7decf')}
          subtitle={uiText('which_messages_the_widget_lists_cb527b')}
        >
          <Dropdown name="googleMailQuery" category="google" items={options(MAIL_QUERIES)} />
        </Section>
        <Row>
          <Content
            title={uiText('custom_search_c6246f')}
            subtitle={uiText('overrides_the_filter_above_try_from_ana_examp_b68846')}
          />
          <Action>
            <Text
              name="googleMailCustomQuery"
              title={uiText('gmail_search_58ae54')}
              placeholder={uiText('from_ana_example_com_522bd1')}
              category="google"
            />
          </Action>
        </Row>
        <Section
          title={uiText('messages_shown_d051d6')}
          subtitle={uiText('the_most_messages_to_show_at_once_641f05')}
        >
          <Dropdown name="googleMailMax" category="google" items={options(MAX_MAIL)} />
        </Section>
        <Section
          title={uiText('first_line_ce405c')}
          subtitle={uiText('show_the_sender_or_the_subject_first_1850d5')}
        >
          <Dropdown
            name="googleMailPrimary"
            category="google"
            items={[
              { value: 'sender', text: 'Sender first' },
              { value: 'subject', text: 'Subject first' },
            ]}
          />
        </Section>
        <Section
          title={uiText('detail_7c9a7c')}
          subtitle={uiText('extra_text_and_the_unread_indicator_425e7c')}
        >
          <Checkbox name="googleMailSnippet" text="Preview text" category="google" />
          <Dropdown
            name="googleMailBadge"
            category="google"
            items={[
              { value: 'count', text: 'Unread count' },
              { value: 'dot', text: 'Unread dot' },
              { value: 'hidden', text: 'No indicator' },
            ]}
          />
        </Section>
        <Section
          title={uiText('refresh_56e3ba')}
          subtitle={uiText('how_often_to_check_for_updates_e7f165')}
        >
          <Dropdown name="googleMailRefresh" category="google" items={options(REFRESH_OPTIONS)} />
        </Section>
      </Fragment>
    );
  }, [tab]);

  return (
    <>
      <Row>
        <Content
          title={uiText('widget_settings_02de30')}
          subtitle={
            tab
              ? 'These controls change what the widget shows.'
              : 'Choose a widget to change what it shows.'
          }
        />
        <Action>
          <div
            className="gwSegmented"
            role="tablist"
            aria-label={uiText('which_widget_to_configure_0ad894')}
          >
            {tabs.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                className={`gwSegment${tab === entry.id ? ' active' : ''}`}
                onClick={() => setTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </Action>
      </Row>

      {render()}
    </>
  );
};

export default GoogleWidgetSettings;
