import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MdAttachFile,
  MdCheck,
  MdChevronRight,
  MdClose,
  MdDescription,
  MdEdit,
  MdGroup,
  MdHelpOutline,
  MdInfoOutline,
  MdLocationOn,
  MdNotificationsNone,
  MdOpenInNew,
  MdPersonOutline,
  MdRepeat,
  MdSchedule,
  MdTune,
  MdVideocam,
} from 'react-icons/md';
import { uiText } from 'lib/translations';
import useSidePreview from 'features/widgetKit/useSidePreview';
import usePreviewScroll from 'features/widgetKit/usePreviewScroll';
import { eventKey, getEventDetails } from '../services/calendar';
import {
  eventDate,
  eventEnd,
  eventOrganizer,
  eventUrl,
  recurrenceText,
  reminderText,
} from '../eventDetails';
import EventDescription from './EventDescription';
import EventMap from './EventMap';
import './eventPreview.scss';

const Section = ({ icon: Glyph, title, value, when = false, children }) => (
  <section className={`gwEventSection${when ? ' gwEventWhenSection' : ''}`}>
    <div className="gwEventSectionHead">
      <h4>
        <Glyph aria-hidden="true" />
        {title}
      </h4>
      {when && (
        <span className="gwEventDot" aria-hidden="true">
          ·
        </span>
      )}
      {value && (
        <div className="gwEventSectionValue" title={typeof value === 'string' ? value : undefined}>
          {value}
        </div>
      )}
    </div>
    {children}
  </section>
);
const Fact = ({ label, children }) =>
  children !== null && children !== undefined && children !== '' ? (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  ) : null;
const Person = ({ person, compact = false }) => {
  if (!person) return null;
  const label = person.displayName || person.email || uiText('calendar_guest');
  return (
    <span className="gwEventPerson">
      {person.email && /^[^\s@]+@[^\s@]+$/.test(person.email) ? (
        <a href={`mailto:${encodeURIComponent(person.email)}`}>{label}</a>
      ) : (
        label
      )}
      {!compact && person.displayName && person.email && <small>{person.email}</small>}
    </span>
  );
};
const responseName = (status) =>
  uiText(
    `calendar_response_${['accepted', 'declined', 'tentative'].includes(status) ? status : 'needsAction'}`,
  );
const conferenceHref = (uri) => {
  if (eventUrl(uri)) return eventUrl(uri);
  try {
    return ['tel:', 'sip:'].includes(new URL(uri).protocol) ? uri : null;
  } catch {
    return null;
  }
};

export default function EventPreview({ event, preview, account, viewer, use24Hour, onEdit }) {
  const { panelRef } = preview;
  const body = useRef(null);
  const style = useSidePreview(preview.active.anchor, panelRef, 430);
  const [state, setState] = useState({ data: event, loading: true, error: false });
  usePreviewScroll(body, eventKey(event));
  useEffect(() => {
    const controller = new AbortController();
    getEventDetails(event, { signal: controller.signal, account }).then(
      (data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: false });
      },
      () => {
        if (!controller.signal.aborted) setState({ data: event, loading: false, error: true });
      },
    );
    return () => controller.abort();
  }, [event, account]);
  const data = state.data;
  const organizer = eventOrganizer(data, viewer);
  const date = (value, allDay = data.allDay, timeZone = data.timeZone) =>
    eventDate(value, { use24Hour, allDay, timeZone });
  const finish = eventEnd(data);
  const self = data.attendees?.find((attendee) => attendee.self);
  const ResponseIcon =
    self?.responseStatus === 'accepted'
      ? MdCheck
      : self?.responseStatus === 'declined'
        ? MdClose
        : MdHelpOutline;
  const recurrence = recurrenceText(data.recurrence, { timeZone: data.timeZone });
  const original = data.originalStartTime?.dateTime || data.originalStartTime?.date;
  const moved = original && new Date(original).getTime() !== new Date(data.start).getTime();
  const location =
    data.location ||
    data.workingLocationProperties?.customLocation?.label ||
    data.workingLocationProperties?.officeLocation?.label;
  const locationLink = eventUrl(location);
  const reminders = data.reminders?.useDefault ? data.defaultReminders : data.reminders?.overrides;
  const conferences = data.conferenceData?.entryPoints || [];
  const video = conferences.find((entry) => entry.entryPointType === 'video');
  const join = eventUrl(video?.uri || data.hangoutLink);
  const attachments = data.attachments || [];
  const openUrl = eventUrl(data.htmlLink);
  const yesNo = (value) => uiText(value ? 'calendar_yes' : 'calendar_no');
  const special = data.outOfOfficeProperties || data.focusTimeProperties;
  return createPortal(
    <div
      className="gwPreview gwEventPreview"
      popover="manual"
      role="dialog"
      aria-label={uiText('calendar_event_preview', { title: data.title })}
      tabIndex={-1}
      ref={panelRef}
      style={style}
      onMouseEnter={preview.enter}
      onMouseLeave={preview.leave}
      onFocus={preview.enter}
      onBlur={preview.leave}
    >
      <header className="gwPreviewHead gwEventPreviewHead">
        <span className="gwPreviewFrom">{data.calendarName || uiText('calendar_adab50')}</span>
        {data.canEdit && (
          <button
            type="button"
            className="gwIconButton"
            title={uiText('calendar_edit_event')}
            aria-label={uiText('calendar_edit_event')}
            onClick={() => onEdit(data)}
          >
            <MdEdit aria-hidden="true" />
          </button>
        )}
        {openUrl && (
          <a
            className="gwIconButton"
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={uiText('calendar_open_event')}
            aria-label={uiText('calendar_open_event')}
          >
            <MdOpenInNew aria-hidden="true" />
          </a>
        )}
        <button
          type="button"
          className="gwIconButton"
          title={uiText('close_bbfa77')}
          aria-label={uiText('close_bbfa77')}
          onClick={() => preview.close(true)}
        >
          <MdClose aria-hidden="true" />
        </button>
      </header>
      <h3 className="gwPreviewSubject">{data.title}</h3>
      <div
        ref={body}
        className="gwPreviewBody gwEventPreviewBody"
        tabIndex={0}
        aria-label={uiText('calendar_event_contents')}
      >
        {state.loading && (
          <p className="gwEventMuted" role="status">
            {uiText('calendar_details_loading')}
          </p>
        )}
        {state.error && (
          <p className="gwEventMuted" role="status">
            {uiText('calendar_details_error')}
          </p>
        )}
        <Section
          icon={MdSchedule}
          title={uiText('calendar_when')}
          when
          value={
            <span className="gwEventTime">
              <time dateTime={data.start} title={date(data.start)}>
                {date(data.start)}
              </time>
              {!data.endTimeUnspecified && finish && finish !== data.start && (
                <>
                  <span className="gwEventDot" aria-hidden="true">
                    ·
                  </span>
                  <time dateTime={finish} title={uiText('calendar_until', { date: date(finish) })}>
                    {uiText('calendar_until', { date: date(finish) })}
                  </time>
                </>
              )}
            </span>
          }
        >
          <p className="gwEventMuted gwEventZoneRow">
            <span title={data.timeZone}>
              {data.allDay
                ? uiText('all_day_114574')
                : data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
            {!data.allDay &&
              data.timeZone &&
              data.timeZone !== Intl.DateTimeFormat().resolvedOptions().timeZone && (
                <span title={uiText('calendar_your_time', { date: date(data.start, false, '') })}>
                  {uiText('calendar_your_time', { date: date(data.start, false, '') })}
                </span>
              )}
          </p>
          {self && (
            <p className={`gwEventResponse ${self.responseStatus}`}>
              <ResponseIcon aria-hidden="true" />
              {uiText('calendar_your_response', { response: responseName(self.responseStatus) })}
            </p>
          )}
        </Section>
        {(data.recurringEventId || data.recurrence?.length > 0) && (
          <Section
            icon={MdRepeat}
            title={uiText('calendar_repeats')}
            value={
              recurrence ||
              uiText(
                data.recurrenceUnavailable
                  ? 'calendar_repeat_unavailable'
                  : 'calendar_repeat_series',
              )
            }
          >
            {moved && (
              <p className="gwEventMuted">
                {uiText('calendar_original_time', { date: date(original) })}
              </p>
            )}
            {data.recurrence?.length > 0 && (
              <details className="gwEventRawRule">
                <summary>{uiText('calendar_repeat_rule')}</summary>
                <pre>{data.recurrence.join('\n')}</pre>
              </details>
            )}
          </Section>
        )}
        {(join || conferences.length > 0) && (
          <Section
            icon={MdVideocam}
            title={data.conferenceData?.conferenceSolution?.name || uiText('calendar_conference')}
          >
            {join && (
              <a className="gwEventTextLink" href={join} target="_blank" rel="noopener noreferrer">
                {uiText('calendar_join_call')}
                <MdOpenInNew aria-hidden="true" />
              </a>
            )}
            {(video?.meetingCode || video?.pin || video?.accessCode || video?.password) && (
              <p className="gwEventMuted">
                {uiText('calendar_access_code', {
                  code: video.meetingCode || video.pin || video.accessCode || video.password,
                })}
              </p>
            )}
            <dl className="gwEventFacts">
              {conferences
                .filter((entry) => entry.entryPointType !== 'video' || !join)
                .map((entry, index) => {
                  const href = conferenceHref(entry.uri);
                  return (
                    <Fact
                      key={index}
                      label={uiText(
                        entry.entryPointType === 'phone'
                          ? 'calendar_dial_in'
                          : 'calendar_connection',
                      )}
                    >
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          {entry.label || entry.uri}
                        </a>
                      ) : (
                        entry.label || entry.uri
                      )}
                      {(entry.pin || entry.accessCode || entry.meetingCode || entry.password) && (
                        <small>
                          {uiText('calendar_access_code', {
                            code:
                              entry.pin || entry.accessCode || entry.meetingCode || entry.password,
                          })}
                        </small>
                      )}
                    </Fact>
                  );
                })}
            </dl>
            {data.conferenceData?.notes && <EventDescription text={data.conferenceData.notes} />}
          </Section>
        )}
        {location && (
          <Section icon={MdLocationOn} title={uiText('location_d219c6')}>
            <p>
              {locationLink ? (
                <a href={locationLink} target="_blank" rel="noopener noreferrer">
                  {location}
                </a>
              ) : (
                location
              )}
            </p>
            {!locationLink || /openstreetmap\.org|google\.[^/]+\/maps/i.test(locationLink) ? (
              <EventMap key={`${account}:${location}`} location={location} scope={account} />
            ) : null}
          </Section>
        )}
        {data.description && (
          <Section icon={MdDescription} title={uiText('calendar_description')}>
            <EventDescription text={data.description} />
          </Section>
        )}
        {(data.attendees?.length > 0 || data.attendeesOmitted) && (
          <Section
            icon={MdGroup}
            title={uiText('calendar_guests', { count: data.attendees?.length || 0 })}
          >
            {data.attendeesOmitted && (
              <p className="gwEventMuted">{uiText('calendar_guests_omitted')}</p>
            )}
            <ul className="gwEventGuests">
              {data.attendees?.map((attendee, index) => {
                const status = attendee.responseStatus;
                const Glyph =
                  status === 'accepted' ? MdCheck : status === 'declined' ? MdClose : MdHelpOutline;
                return (
                  <li key={`${attendee.email || attendee.id || 'guest'}:${index}`}>
                    <span
                      className={`gwEventGuestStatus ${status || 'needsAction'}`}
                      role="img"
                      title={responseName(status)}
                      aria-label={responseName(status)}
                    >
                      <Glyph aria-hidden="true" />
                    </span>
                    <div>
                      <Person person={attendee} />
                      <span className="gwEventMuted">
                        {[
                          attendee.self && uiText('calendar_you'),
                          attendee.organizer && uiText('calendar_organizer'),
                          attendee.optional && uiText('calendar_optional_guest'),
                          attendee.resource && uiText('calendar_resource'),
                          attendee.additionalGuests > 0 &&
                            uiText('calendar_additional_guests', {
                              count: attendee.additionalGuests,
                            }),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                      {attendee.comment && (
                        <p className="gwEventGuestComment">{attendee.comment}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>
        )}
        {(organizer || data.creator) && (
          <Section icon={MdPersonOutline} title={uiText('calendar_people')}>
            <dl className="gwEventFacts">
              {organizer && (
                <Fact label={uiText('calendar_organizer')}>
                  <Person person={organizer} compact />
                </Fact>
              )}
              {data.creator && (
                <Fact label={uiText('calendar_creator')}>
                  <Person person={data.creator} />
                </Fact>
              )}
            </dl>
          </Section>
        )}
        <Section
          icon={MdNotificationsNone}
          title={uiText('calendar_reminders')}
          value={data.reminders?.useDefault && uiText('calendar_reminder_default')}
        >
          {reminders?.length ? (
            <ul className="gwEventReminders">
              {reminders.map((reminder, index) => (
                <li key={index}>{reminderText(reminder)}</li>
              ))}
            </ul>
          ) : (
            reminders && <p>{uiText('calendar_reminder_none')}</p>
          )}
        </Section>
        {attachments.length > 0 && (
          <Section icon={MdAttachFile} title={uiText('calendar_attachments')}>
            <ul className="gwEventAttachments">
              {attachments.map((attachment, index) => (
                <li key={`${attachment.fileId || ''}:${index}`}>
                  {eventUrl(attachment.fileUrl) ? (
                    <a
                      href={eventUrl(attachment.fileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {attachment.title || uiText('calendar_attachment')}
                      <MdOpenInNew aria-hidden="true" />
                    </a>
                  ) : (
                    attachment.title
                  )}
                  {attachment.mimeType && <small>{attachment.mimeType}</small>}
                </li>
              ))}
            </ul>
          </Section>
        )}
        <details className="gwEventAdvanced">
          <summary>
            <span className="gwEventAdvancedLabel">
              <MdChevronRight className="gwEventDisclosure" aria-hidden="true" />
              <MdTune aria-hidden="true" />
              {uiText('calendar_event_settings')}
            </span>
            <span className="gwEventPermission">
              <span
                title={
                  data.canEdit
                    ? uiText('calendar_event_editable')
                    : uiText('calendar_event_readonly')
                }
              >
                {data.canEdit
                  ? uiText('calendar_event_editable')
                  : uiText('calendar_event_readonly')}
              </span>
              {data.locked && (
                <MdInfoOutline
                  role="img"
                  aria-label={uiText('calendar_event_locked')}
                  title={uiText('calendar_event_locked')}
                />
              )}
            </span>
          </summary>
          <dl className="gwEventFacts">
            <Fact label={uiText('calendar_status')}>
              {uiText(
                `calendar_status_${['confirmed', 'tentative', 'cancelled'].includes(data.status) ? data.status : 'confirmed'}`,
              )}
            </Fact>
            <Fact label={uiText('calendar_availability')}>
              {uiText(data.transparency === 'transparent' ? 'calendar_free' : 'calendar_busy')}
            </Fact>
            <Fact label={uiText('calendar_visibility')}>
              {uiText(
                `calendar_visibility_${['public', 'private', 'confidential'].includes(data.visibility) ? data.visibility : 'default'}`,
              )}
            </Fact>
            <Fact label={uiText('calendar_event_type')}>
              {uiText(
                `calendar_type_${['birthday', 'focusTime', 'fromGmail', 'outOfOffice', 'workingLocation'].includes(data.eventType) ? data.eventType : 'default'}`,
              )}
            </Fact>
            <Fact label={uiText('calendar_guest_edit')}>{yesNo(data.guestsCanModify)}</Fact>
            <Fact label={uiText('calendar_guest_invite')}>{yesNo(data.guestsCanInviteOthers)}</Fact>
            <Fact label={uiText('calendar_guest_see')}>{yesNo(data.guestsCanSeeOtherGuests)}</Fact>
            <Fact label={uiText('calendar_editable')}>{yesNo(data.canEdit)}</Fact>
            {data.workingLocationProperties && (
              <Fact label={uiText('calendar_working_location')}>
                {data.workingLocationProperties.officeLocation?.label ||
                  data.workingLocationProperties.customLocation?.label ||
                  uiText('calendar_home_office')}
              </Fact>
            )}
            {(data.outOfOfficeProperties || data.focusTimeProperties) && (
              <Fact label={uiText('calendar_auto_decline')}>
                {uiText(
                  `calendar_decline_${['declineAllConflictingInvitations', 'declineOnlyNewConflictingInvitations'].includes(special?.autoDeclineMode) ? special.autoDeclineMode : 'declineNone'}`,
                )}
              </Fact>
            )}
            {(data.outOfOfficeProperties?.declineMessage ||
              data.focusTimeProperties?.declineMessage) && (
              <Fact label={uiText('calendar_decline_message')}>
                {data.outOfOfficeProperties?.declineMessage ||
                  data.focusTimeProperties?.declineMessage}
              </Fact>
            )}
            <Fact label={uiText('calendar_created')}>{date(data.created, false, '')}</Fact>
            <Fact label={uiText('calendar_updated')}>{date(data.updated, false, '')}</Fact>
            <Fact label={uiText('calendar_event_id')}>{data.id}</Fact>
            <Fact label="iCalendar UID">{data.iCalUID}</Fact>
            {data.source && (
              <Fact label={uiText('calendar_source')}>
                {eventUrl(data.source.url) ? (
                  <a href={eventUrl(data.source.url)} target="_blank" rel="noopener noreferrer">
                    {data.source.title || data.source.url}
                  </a>
                ) : (
                  data.source.title
                )}
              </Fact>
            )}
          </dl>
        </details>
      </div>
    </div>,
    document.body,
  );
}
