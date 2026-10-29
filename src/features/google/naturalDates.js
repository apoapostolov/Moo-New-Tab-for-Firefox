export const WEEKDAYS = {
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
export const MONTHS = {
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
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  half: 0.5,
  quarter: 0.25,
};
export const NUMBER = `(?:\\d+(?:\\.\\d+)?|(?:(?:a\\s+)?couple(?:\\s+of)?|(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[ -](?:one|two|three|four|five|six|seven|eight|nine)|${Object.keys(WORDS).join('|')})(?![a-z]))`;
export const DAY = Object.keys(WEEKDAYS)
  .sort((a, b) => b.length - a.length)
  .join('|');
const MONTH = Object.keys(MONTHS)
  .sort((a, b) => b.length - a.length)
  .join('|');
export const readNumber = (value) => {
  const text = String(value).toLowerCase().trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  if (/^(?:a )?couple(?: of)?$/.test(text)) return 2;
  const parts = text.split(/[ -]/);
  return parts.every((part) => Object.hasOwn(WORDS, part))
    ? parts.reduce((sum, part) => sum + WORDS[part], 0)
    : null;
};
export const midnight = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};
export const addDays = (value, amount) => {
  const date = midnight(value);
  date.setDate(date.getDate() + amount);
  return date;
};
export const nextWeekday = (now, day, strictlyNext = false) => {
  const delta = (day - now.getDay() + 7) % 7;
  return addDays(now, delta || (strictlyNext ? 7 : 0));
};
export const validDate = (year, month, day) => {
  if (year < 1900 || year > 9999 || month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null;
};
const forwardDate = (now, month, day, year) => {
  if (year) return validDate(Number(year), month, day);
  for (let offset = 0; offset < 9; offset++) {
    const date = validDate(now.getFullYear() + offset, month, day);
    if (date && date >= midnight(now)) return date;
  }
  return null;
};
const shift = (now, amount, unit) => {
  if (!Number.isInteger(amount) || amount < 0 || amount > 10000) return null;
  if (/business|weekday/.test(unit)) {
    if (amount > 3660) return null;
    let date = midnight(now);
    for (let left = amount; left > 0; ) {
      date = addDays(date, 1);
      if (![0, 6].includes(date.getDay())) left--;
    }
    return date;
  }
  if (/^day/.test(unit)) return addDays(now, amount);
  if (/^week/.test(unit)) return addDays(now, amount * 7);
  const date = midnight(now),
    day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + amount * (/^year/.test(unit) ? 12 : 1));
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  return date;
};
const PREFIX = '(?:\\b(?:on|by|due(?:\\s+on)?|starting(?:\\s+on)?|beginning(?:\\s+on)?|from)\\s+)?';

/** Date matches retain their spans so invalid explicit dates cannot become a partial date. */
export function readNaturalDate(text, now = new Date(), ranges = true) {
  const candidates = [],
    invalid = [];
  const collect = (pattern, read) => {
    for (const match of text.matchAll(new RegExp(pattern, 'gi'))) {
      const value = read(match);
      const span = { index: match.index, length: match[0].length };
      if (value)
        candidates.push({ ...span, ...(value.date ? value : { date: value, endDate: null }) });
      else invalid.push(span);
    }
  };
  if (ranges)
    collect(
      `${PREFIX}\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*[-–—]\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH})(?:\\s+(\\d{4}))?\\b`,
      (m) => {
        const month = MONTHS[m[3].toLowerCase()],
          date = forwardDate(now, month, +m[1], m[4]);
        if (!date) return null;
        const endDate = validDate(date.getFullYear(), month, +m[2]);
        return endDate && endDate >= date ? { date, endDate } : null;
      },
    );
  collect(`${PREFIX}\\b(\\d{4})-(\\d{2})-(\\d{2})\\b`, (m) => validDate(+m[1], +m[2] - 1, +m[3]));
  collect(
    `${PREFIX}\\b(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH})(?:,?\\s+(\\d{4}))?\\b`,
    (m) => forwardDate(now, MONTHS[m[2].toLowerCase()], +m[1], m[3]),
  );
  collect(`${PREFIX}\\b(${MONTH})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, (m) =>
    forwardDate(now, MONTHS[m[1].toLowerCase()], +m[2], m[3]),
  );
  collect(`${PREFIX}\\b(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?\\b`, (m) =>
    forwardDate(now, +m[2] - 1, +m[1], m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : null),
  );
  collect(`\\b(?:on|by|due(?:\\s+on)?)\\s+(\\d{1,2})\\.(\\d{1,2})(?:\\.(\\d{2,4}))?\\b`, (m) =>
    forwardDate(now, +m[2] - 1, +m[1], m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : null),
  );
  collect(
    `${PREFIX}\\b(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+of\\s+(next|this)\\s+month\\b`,
    (m) => {
      const month = new Date(
        now.getFullYear(),
        now.getMonth() + (m[2].toLowerCase() === 'next' ? 1 : 0),
        1,
      );
      return validDate(month.getFullYear(), month.getMonth(), +m[1]);
    },
  );
  collect(`${PREFIX}\\b(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)\\b`, (m) => {
    for (let offset = 0; offset < 12; offset++) {
      const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const date = validDate(month.getFullYear(), month.getMonth(), +m[1]);
      if (date && date >= midnight(now)) return date;
    }
    return null;
  });
  collect(`\\b(?:on|by|due(?:\\s+on)?)\\s+(?:the\\s+)?(\\d{1,2})\\b(?![\\d/.:–—-])`, (m) => {
    for (let offset = 0; offset < 12; offset++) {
      const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const d = validDate(month.getFullYear(), month.getMonth(), +m[1]);
      if (d && d >= midnight(now)) return d;
    }
    return null;
  });
  collect(
    `\\b(?:in\\s+(${NUMBER})\\s+(business days?|weekdays?|days?|weeks?|months?|years?)|(${NUMBER})\\s+(business days?|weekdays?|days?|weeks?|months?|years?)\\s+from\\s+(?:now|today))\\b`,
    (m) => shift(now, readNumber(m[1] || m[3]), (m[2] || m[4]).toLowerCase()),
  );
  collect(`${PREFIX}\\b(?:the\\s+)?day\\s+after\\s+tomorrow\\b`, () => addDays(now, 2));
  collect(`${PREFIX}\\b(tomorrow|tmrw|tmw|today|tonight|yesterday)\\b`, (m) =>
    addDays(now, /tomorrow|tmrw|tmw/i.test(m[1]) ? 1 : /yesterday/i.test(m[1]) ? -1 : 0),
  );
  collect(`${PREFIX}\\bnext\\s+(?:business day|weekday)\\b`, () => shift(now, 1, 'business day'));
  collect(`${PREFIX}\\b(next|this)\\s+week\\s+(?:on\\s+)?(${DAY})\\b`, (m) => {
    const monday = addDays(
      now,
      -((now.getDay() + 6) % 7) + (m[1].toLowerCase() === 'next' ? 7 : 0),
    );
    return addDays(monday, (WEEKDAYS[m[2].toLowerCase()] + 6) % 7);
  });
  collect(`${PREFIX}\\b(next|this|coming)\\s+(${DAY})\\b`, (m) =>
    nextWeekday(now, WEEKDAYS[m[2].toLowerCase()], m[1].toLowerCase() === 'next'),
  );
  collect(`${PREFIX}\\bnext\\s+(week|month|year)\\b`, (m) => shift(now, 1, m[1].toLowerCase()));
  collect(`${PREFIX}\\b(?:the\\s+)?end\\s+of\\s+(?:the\\s+|this\\s+)?(week|month|year)\\b`, (m) =>
    m[1].toLowerCase() === 'week'
      ? nextWeekday(now, 5)
      : m[1].toLowerCase() === 'month'
        ? new Date(now.getFullYear(), now.getMonth() + 1, 0)
        : new Date(now.getFullYear(), 11, 31),
  );
  collect(`${PREFIX}\\b(${DAY})\\b`, (m) => nextWeekday(now, WEEKDAYS[m[1].toLowerCase()]));
  const overlaps = (a, b) => a.index < b.index + b.length && b.index < a.index + a.length;
  const valid = candidates
    .filter((c) => !invalid.some((i) => overlaps(c, i)))
    .sort((a, b) => a.index - b.index || b.length - a.length);
  const first = valid[0];
  if (!first) return null;
  if (ranges && !first.endDate) {
    const second = valid.find((c) => c.index >= first.index + first.length);
    if (
      second &&
      /^\s*(?:to|through|until|till|[-–—])\s*$/i.test(
        text.slice(first.index + first.length, second.index),
      )
    ) {
      let endDate = second.date;
      // An omitted year may cross December into the following year.
      if (
        endDate < first.date &&
        !/\b\d{4}\b/.test(text.slice(second.index, second.index + second.length))
      )
        endDate = new Date(endDate.getFullYear() + 1, endDate.getMonth(), endDate.getDate());
      if (endDate >= first.date)
        return { ...first, endDate, length: second.index + second.length - first.index };
    }
  }
  return first;
}
