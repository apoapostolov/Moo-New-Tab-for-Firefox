/**
 * Splits a typed sentence into a title plus date, time, length, repeat and place. Passes run
 * repeats, lengths, times, dates, place, since "at 11:00" and "at the office" share a prefix;
 * unclaimed text is the title.
 */

const WEEKDAYS = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

const MONTHS = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

const WORDS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fortyfive: 45,
  half: 0.5,
};

const MONTH_PATTERN = Object.keys(MONTHS).join('|');
const WEEKDAY_PATTERN = Object.keys(WEEKDAYS).join('|');
const NUM_PATTERN = `\\d+(?:\\.\\d+)?|${Object.keys(WORDS).join('|')}`;

const toNumber = (raw) => {
  const text = String(raw).trim().toLowerCase();

  if (Object.prototype.hasOwnProperty.call(WORDS, text)) return WORDS[text];

  const value = Number(text);

  return Number.isFinite(value) ? value : null;
};

const atMidnight = (date) => {
  const copy = new Date(date);

  copy.setHours(0, 0, 0, 0);

  return copy;
};

const addDays = (date, days) => {
  const copy = atMidnight(date);

  copy.setDate(copy.getDate() + days);

  return copy;
};

/**
 * Rolls month and day forward to the next occurrence, so "24th oct" typed in November lands next
 * year.
 */

const forwardDate = (now, month, day) => {
  const candidate = atMidnight(now);

  candidate.setMonth(month, day);

  if (candidate.getMonth() !== month) {
    // 31st of a 30-day month: clamp to the last day instead of rolling over.
    candidate.setDate(0);
  }

  if (candidate < atMidnight(now)) candidate.setFullYear(candidate.getFullYear() + 1);

  return candidate;
};

/** A bare day number means this month if it is still ahead, else the next one. */
const nextDayOfMonth = (now, day) => {
  const candidate = atMidnight(now);

  candidate.setDate(day);

  if (candidate.getDate() !== day) candidate.setDate(0);
  if (candidate >= atMidnight(now)) return candidate;

  const next = atMidnight(now);

  next.setMonth(next.getMonth() + 1, day);

  if (next.getDate() !== day) next.setDate(0);

  return next;
};

const nextWeekday = (now, weekday) => {
  const today = atMidnight(now);
  const ahead = (weekday - today.getDay() + 7) % 7;

  return addDays(today, ahead);
};

const mask = (text, index, length) =>
  text.slice(0, index) + ' '.repeat(length) + text.slice(index + length);

/**
 * Claims the first phrase matching `pattern` when `read` returns something, so a later pass cannot
 * re-claim it.
 */

const claim = (state, pattern, read) => {
  const match = pattern.exec(state.work);

  if (!match) return null;

  const value = read(match);

  if (value === null || value === undefined || value === false) return null;

  state.work = mask(state.work, match.index, match[0].length);

  return value;
};

const firstOf = (state, readers) => {
  for (const [pattern, read] of readers) {
    const value = claim(state, pattern, read);

    if (value) return value;
  }

  return null;
};

const setTime = (hours, minutes) => {
  const h = Number(hours);
  const m = Number(minutes || 0);

  if (!Number.isFinite(h) || !Number.isFinite(m) || m > 59) return null;
  if (h > 23) return null;

  return { hours: h % 24, minutes: m };
};

const meridiem = (value, marker) => {
  if (!value || !marker) return value;

  const lower = String(marker).toLowerCase();

  if (lower.startsWith('p') && value.hours < 12) return { ...value, hours: value.hours + 12 };
  if (lower.startsWith('a') && value.hours === 12) return { ...value, hours: 0 };

  return value;
};

const shiftDate = (now, amount, unit) => {
  const date = atMidnight(now);

  if (unit === 'day') date.setDate(date.getDate() + amount);
  if (unit === 'week') date.setDate(date.getDate() + amount * 7);
  if (unit === 'month') date.setMonth(date.getMonth() + amount);

  return date;
};

export const parseNatural = (text, { now = new Date(), kind = 'event' } = {}) => {
  const state = { work: ` ${String(text || '').replace(/\s+/g, ' ')} ` };

  const result = {
    title: '',
    date: null,
    endDate: null,
    time: null,
    endTime: null,
    durationMinutes: null,
    allDay: false,
    repeat: null,
    location: null,
    understood: false,
  };

  // Repetition comes first. Google tasks have no repeat field, so these words stay in the title
  // instead of being dropped.
  if (kind === 'event') {
    result.repeat = firstOf(state, [
      [
        new RegExp(`\\b(?:every|each|all)\\s+(?:single\\s+)?(${WEEKDAY_PATTERN})\\b`, 'i'),
        (match) => ({ freq: 'WEEKLY', interval: 1, byDay: [WEEKDAYS[match[1].toLowerCase()]] }),
      ],
      [
        /\b(?:every|each)\s+(?:(\d+|couple of|few)\s+)?(day|week|month|weekday)s?\b/i,
        (match) => {
          const interval = match[1] ? Math.max(1, Math.round(toNumber(match[1]) || 1)) : 1;
          const unit = match[2].toLowerCase();

          if (unit === 'weekday') return { freq: 'WEEKLY', interval, byDay: [1, 2, 3, 4, 5] };
          if (unit === 'day') return { freq: 'DAILY', interval };
          if (unit === 'week') return { freq: 'WEEKLY', interval };

          return { freq: 'MONTHLY', interval };
        },
      ],
      [
        /\b(daily|weekly|monthly|weekdays?)\b/i,
        (match) => {
          const word = match[1].toLowerCase();

          if (word === 'daily') return { freq: 'DAILY', interval: 1 };
          if (word === 'weekly') return { freq: 'WEEKLY', interval: 1 };
          if (word === 'monthly') return { freq: 'MONTHLY', interval: 1 };

          return { freq: 'WEEKLY', interval: 1, byDay: [1, 2, 3, 4, 5] };
        },
      ],
    ]);

    // "for 2 days each day" counts repeats; alone, "for 2 days" is a length.
    if (result.repeat) {
      const count = claim(state, /\bfor\s+(\d+)\s+(?:times|days?|weeks?|months?)\b/i, (match) =>
        Math.max(1, Number(match[1])),
      );

      if (count) result.repeat.count = count;
    }
  }

  // A written-out date is claimed before any clock, or the digits in "2026-12-24"
  // look like the range 12:00 to 24:00.
  const isoDate = claim(state, /\b(\d{4})-(\d{2})-(\d{2})\b/, (match) => {
    const date = atMidnight(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));

    return Number.isNaN(date.getTime()) ? null : date;
  });

  // A length: "for 2 hours", "for 30 min", "lasting 3 days".
  const length = firstOf(state, [
    [
      new RegExp(`\\b(?:for|lasting)\\s+(${NUM_PATTERN})\\s*(hours?|hrs?|h|minutes?|mins?|m|days?)\\b`, 'i'),
      (match) => {
        const amount = toNumber(match[1]);

        if (!amount) return null;

        const unit = match[2].toLowerCase();

        if (unit.startsWith('h')) return Math.round(amount * 60);
        if (unit.startsWith('d')) return Math.round(amount * 60 * 24);

        return Math.round(amount);
      },
    ],
    [/\b(?:for|lasting)\s+half\s+an?\s+hour\b/i, () => 30],
    [/\b(?:for|lasting)\s+an?\s+hour\b/i, () => 60],
  ]);

  if (length) result.durationMinutes = length;

  // Times: a range first, then a single clock, then the named hours.
  const range = claim(
    state,
    /(?:from\s+)?\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to|until|till)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
    (match) => {
      // "3-5 dec" and "20-22 nov" are day ranges; a trailing month settles it and the
      // date pass below claims the phrase.
      const after = state.work.slice(match.index + match[0].length);

      if (new RegExp(`^\\s*(?:of\\s+)?(${MONTH_PATTERN})\\b`, 'i').test(after)) return null;

      const start = meridiem(setTime(match[1], match[2]), match[3] || match[6]);
      const end = meridiem(setTime(match[4], match[5]), match[6] || match[3]);

      if (!start) return null;

      return { start, end };
    },
  );

  if (range) {
    result.time = range.start;
    result.endTime = range.end;
  }

  if (!result.time) {
    const single = firstOf(state, [
      [
        /\b(?:at|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?\b/i,
        (match) => meridiem(setTime(match[1], match[2]), match[3]),
      ],
      [
        /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i,
        (match) => meridiem(setTime(match[1], match[2]), match[3]),
      ],
      [/\b(\d{1,2})\s*(am|pm)\b/i, (match) => meridiem(setTime(match[1], 0), match[2])],
      [/\b(\d{1,2})\s*o'?clock\b/i, (match) => setTime(match[1], 0)],
      [/\b(?:at\s+)?(noon|midday)\b/i, () => ({ hours: 12, minutes: 0 })],
      [/\b(?:at\s+)?midnight\b/i, () => ({ hours: 0, minutes: 0 })],
    ]);

    if (single) result.time = single;
  }

  // A date: the most specific shape wins.
  const spread = isoDate
    ? null
    : firstOf(state, [
        [
          new RegExp(
            `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})\\s*(?:-|–|to|until|till|through)\\s*(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+(?:of\\s+)?(${MONTH_PATTERN}))?\\b`,
            'i',
          ),
          (match) => {
            const startMonth = MONTHS[match[2].toLowerCase()];
            const endMonth = match[4] ? MONTHS[match[4].toLowerCase()] : startMonth;
            const start = forwardDate(now, startMonth, Number(match[1]));
            let end = forwardDate(now, endMonth, Number(match[3]));

            // "24 dec to 3 jan" crosses the new year.
            if (end < start) end.setFullYear(end.getFullYear() + 1);

            return { start, end };
          },
        ],
        [
          new RegExp(
            `\\b(\\d{1,2})\\s*(?:-|–|to|until|till|through)\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})\\b`,
            'i',
          ),
          (match) => {
            const month = MONTHS[match[3].toLowerCase()];
            const first = Number(match[1]);
            const last = Number(match[2]);
            const start = forwardDate(now, month, first);
            const end = new Date(start);

            end.setDate(last);

            // "28-3 nov" runs into the following month.
            if (last < first) {
              end.setMonth(end.getMonth() + 1, last);
            }

            return { start, end };
          },
        ],
        [
          new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+of\\s+(next|this)\\s+month\\b`, 'i'),
          (match) => {
            const date = atMidnight(now);

            if (match[2].toLowerCase() === 'next') date.setMonth(date.getMonth() + 1, Number(match[1]));
            else date.setDate(Number(match[1]));

            return { start: date, end: null };
          },
        ],
      ]);

  if (spread) {
    result.date = spread.start;
    result.endDate = spread.end;
  }

  result.date =
    isoDate ||
    result.date ||
    firstOf(state, [
    [
      /\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/,
      (match) => {
        const day = Number(match[1]);
        const month = Number(match[2]);

        if (day < 1 || day > 31 || month < 1 || month > 12) return null;

        if (!match[3]) return forwardDate(now, month - 1, day);

        const year = Number(match[3]) < 100 ? 2000 + Number(match[3]) : Number(match[3]);

        return atMidnight(new Date(year, month - 1, day));
      },
    ],
    [
      new RegExp(
        `\\b(?:on\\s+)?(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})\\b`,
        'i',
      ),
      (match) => forwardDate(now, MONTHS[match[2].toLowerCase()], Number(match[1])),
    ],
    [
      new RegExp(`\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'),
      (match) => forwardDate(now, MONTHS[match[1].toLowerCase()], Number(match[2])),
    ],
    [
      /\b(?:on\s+)?(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)\b/i,
      (match) =>
        Number(match[1]) >= 1 && Number(match[1]) <= 31
          ? nextDayOfMonth(now, Number(match[1]))
          : null,
    ],
    [
      /\bon\s+(\d{1,2})\b/i,
      (match) =>
        Number(match[1]) >= 1 && Number(match[1]) <= 31
          ? nextDayOfMonth(now, Number(match[1]))
          : null,
    ],
    [
      new RegExp(`\\bin\\s+(${NUM_PATTERN})\\s*(day|week|month)s?\\b`, 'i'),
      (match) => shiftDate(now, toNumber(match[1]) || 0, match[2].toLowerCase()),
    ],
    [
      new RegExp(`\\b(${NUM_PATTERN})\\s+(day|week|month)s?\\s+from\\s+(?:now|today)\\b`, 'i'),
      (match) => shiftDate(now, toNumber(match[1]) || 0, match[2].toLowerCase()),
    ],
    [/\b(?:today|tonight)\b/i, () => atMidnight(now)],
    [/\b(?:tomorrow|tmrw|tmw)\b/i, () => addDays(now, 1)],
    [/\b(?:the\s+)?day\s+after\s+tomorrow\b/i, () => addDays(now, 2)],
    [/\bnext\s+week\b/i, () => addDays(now, 7)],
    [
      /\bnext\s+month\b/i,
      () => {
        const date = atMidnight(now);

        date.setMonth(date.getMonth() + 1);

        return date;
      },
    ],
    [
      new RegExp(`\\b(next|this|coming|on)\\s+(${WEEKDAY_PATTERN})\\b`, 'i'),
      (match) => {
        const day = nextWeekday(now, WEEKDAYS[match[2].toLowerCase()]);

        // "next sunday" typed on a sunday means the one after, not today.
        return match[1].toLowerCase() === 'next' && day.getTime() === atMidnight(now).getTime()
          ? addDays(day, 7)
          : day;
      },
    ],
    [
      new RegExp(`\\b(${WEEKDAY_PATTERN})\\b`, 'i'),
      (match) => nextWeekday(now, WEEKDAYS[match[1].toLowerCase()]),
    ],
    ]);

  // "in 2 hours" is a clock time today, not a date of its own.
  if (!result.time) {
    const offset = claim(
      state,
      new RegExp(`\\bin\\s+(${NUM_PATTERN})\\s*(hour|hr|minute|min)s?\\b`, 'i'),
      (match) => {
        const amount = toNumber(match[1]);

        if (!amount) return null;

        const minutes = /^h/i.test(match[2]) ? amount * 60 : amount;
        const when = new Date(now.getTime() + minutes * 60000);

        when.setMinutes(Math.round(when.getMinutes() / 5) * 5);

        return when;
      },
    );

    if (offset) {
      result.time = { hours: offset.getHours(), minutes: offset.getMinutes() };
      result.date = atMidnight(offset);
    }
  }

  // A repeat on a weekday with no date of its own begins on that weekday.
  if (result.repeat?.byDay?.length && !result.date) {
    result.date = nextWeekday(now, result.repeat.byDay[0]);
  }

  // A clock with no day at all means today.
  if (result.time && !result.date) result.date = atMidnight(now);

  // Place: "@office", "at the office". Times are already gone, so "at" cannot be a clock.
  if (kind === 'event') {
    result.location = firstOf(state, [
      [/\b@([\w'’ .&-]{2,40})/, (match) => match[1].trim().replace(/[.,;:]+$/, '')],
      [
        /\bat\s+((?!\btoday\b|\btomorrow\b|\bthe\s+\d)[\w'’ .&-]{2,40})/i,
        (match) => {
          const value = match[1].replace(/\s+/g, ' ').trim().replace(/[.,;:]+$/, '');

          return value.length > 1 ? value : null;
        },
      ],
    ]);
  }

  // Whatever no pass claimed is the title. Edges are tidied in a loop: one phrase can
  // leave two connectives behind, as "on the 1st of december" does.
  const tidy = (text) =>
    text
      .replace(/\s+/g, ' ')
      .replace(/^[\s,;:.–—-]+|[\s,;:.–—-]+$/g, '')
      .replace(/^(?:on|at|for|in|the|from|by|of)\s+/i, '')
      .replace(/\s+(?:on|at|for|in|the|from|by|of)$/i, '')
      .replace(/^[\s,;:.–—-]+|[\s,;:.–—-]+$/g, '');

  let title = tidy(state.work);

  for (let pass = 0; pass < 4; pass += 1) {
    const next = tidy(title);

    if (next === title) break;

    title = next;
  }

  result.title = title.trim();

  result.understood = Boolean(
    result.date || result.time || result.repeat || result.durationMinutes || result.location,
  );

  return result;
};

const WEEKDAY_NAMES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export const toRrule = (repeat) => {
  if (!repeat?.freq) return null;

  const parts = [`FREQ=${repeat.freq}`];

  if (repeat.interval > 1) parts.push(`INTERVAL=${repeat.interval}`);
  if (repeat.byDay?.length) {
    parts.push(`BYDAY=${repeat.byDay.map((day) => WEEKDAY_NAMES[day]).join(',')}`);
  }
  if (repeat.count > 1) parts.push(`COUNT=${repeat.count}`);

  return `RRULE:${parts.join(';')}`;
};

/** The understood sentence, shown under the field so the reader sees it before saving. */
export const describe = (parsed, kind = 'event') => {
  if (!parsed?.understood) return '';

  const bits = [];
  const clock = (value) =>
    `${String(value.hours).padStart(2, '0')}:${String(value.minutes).padStart(2, '0')}`;

  if (parsed.date) {
    const day = (value) =>
      value.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

    bits.push(parsed.endDate ? `${day(parsed.date)} → ${day(parsed.endDate)}` : day(parsed.date));
  }

  if (parsed.time && kind === 'task') {
    bits.push('time dropped, tasks are day only');
  } else if (parsed.time && parsed.endTime) {
    bits.push(`${clock(parsed.time)}–${clock(parsed.endTime)}`);
  } else if (parsed.time) {
    const long = parsed.durationMinutes
      ? parsed.durationMinutes >= 60
        ? `, ${Math.round((parsed.durationMinutes / 60) * 10) / 10} h`
        : `, ${parsed.durationMinutes} min`
      : '';

    bits.push(`from ${clock(parsed.time)}${long}`);
  } else if (parsed.date && kind === 'event') {
    bits.push('all day');
  }

  if (parsed.repeat) {
    const unit = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month' }[parsed.repeat.freq] || 'day';
    const every =
      parsed.repeat.interval > 1 ? `every ${parsed.repeat.interval} ${unit}s` : `every ${unit}`;

    bits.push(parsed.repeat.count > 1 ? `${every}, ${parsed.repeat.count} times` : every);
  }

  if (parsed.location) bits.push(`at ${parsed.location}`);

  return bits.join(' · ');
};
