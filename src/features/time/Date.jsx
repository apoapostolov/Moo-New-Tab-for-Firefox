import { useTranslationVersion } from 'contexts/TranslationContext';
import variables from 'config/variables';
import { useState, useEffect } from 'react';

import { nth, convertTimezone } from 'utils/date';
import EventBus from 'utils/eventbus';

import './date.scss';

/** ISO week number: week 1 is the one holding the year's first Thursday. */
const getWeekNumber = (date) => {
  const dateToday = new Date(date.valueOf());
  const dayNumber = (dateToday.getDay() + 6) % 7;

  dateToday.setDate(dateToday.getDate() - dayNumber + 3);
  const firstThursday = dateToday.valueOf();
  dateToday.setMonth(0, 1);

  if (dateToday.getDay() !== 4) {
    dateToday.setMonth(0, 1 + ((4 - dateToday.getDay() + 7) % 7));
  }

  return `${variables.getMessage('widgets.date.week')} ${
    1 + Math.ceil((firstThursday - dateToday) / 604800000)
  }`;
};

export const readDateDisplay = () => {
  let weekNumber = null;
  let formatted;
  let date = new Date();
  const timezone = localStorage.getItem('timezone');
  if (timezone && timezone !== 'auto') {
    date = convertTimezone(date, timezone);
  }

  if (localStorage.getItem('weeknumber') === 'true') {
    weekNumber = getWeekNumber(date);
  } else {
    weekNumber = null;
  }

  if (localStorage.getItem('dateType') === 'short') {
    const dateDay = date.getDate();
    const dateMonth = date.getMonth() + 1;
    const dateYear = date.getFullYear();

    const zero = localStorage.getItem('datezero') === 'true';

    let day = zero ? ('00' + dateDay).slice(-2) : dateDay;
    let month = zero ? ('00' + dateMonth).slice(-2) : dateMonth;
    let year = dateYear;

    switch (localStorage.getItem('dateFormat')) {
      case 'MDY':
        [day, month] = [month, day];
        break;
      case 'YMD':
        [day, year] = [year, day];
        break;
      // Anything else is DMY.
      default:
        break;
    }

    let format;
    switch (localStorage.getItem('shortFormat')) {
      case 'dots':
        format = `${day}.${month}.${year}`;
        break;
      case 'dash':
        format = `${day}-${month}-${year}`;
        break;
      case 'gaps':
        format = `${day} - ${month} - ${year}`;
        break;
      case 'slashes':
      default:
        format = `${day}/${month}/${year}`;
        break;
    }

    formatted = format;
  } else {
    const lang = variables.languagecode.split('_')[0];
    const datenth =
      localStorage.getItem('datenth') === 'true' ? nth(date.getDate()) : date.getDate();
    const dateDay =
      localStorage.getItem('dayofweek') === 'true'
        ? date.toLocaleDateString(lang, { weekday: 'long' })
        : '';
    const dateMonth = date.toLocaleDateString(lang, { month: 'long' });
    const dateYear = date.getFullYear();

    let formattedDate;

    switch (localStorage.getItem('longFormat')) {
      case 'MDY':
        formattedDate = `${dateMonth} ${datenth}, ${dateYear}${dateDay ? `, ${dateDay}` : ''}`;
        break;
      case 'YMD':
        formattedDate = `${dateYear} ${dateMonth} ${datenth}${dateDay ? `, ${dateDay}` : ''}`;
        break;
      // Anything else is DMY.
      default:
        formattedDate = `${datenth} ${dateMonth} ${dateYear}${dateDay ? `, ${dateDay}` : ''}`;
        break;
    }

    formatted = formattedDate;
  }
  return { date: formatted, weekNumber };
};

const DateWidget = () => {
  useTranslationVersion();
  const [, redraw] = useState(0);
  const { date, weekNumber } = readDateDisplay();
  const display = 'block';
  const fontSize = `${Number(localStorage.getItem('zoomDate') || 100) / 100}em`;
  useEffect(() => {
    const refresh = (category) => {
      if (category === 'date' || category === 'timezone') redraw((value) => value + 1);
    };
    const timer = setInterval(() => redraw((value) => value + 1), 60000);
    EventBus.on('refresh', refresh);
    return () => {
      clearInterval(timer);
      EventBus.off('refresh', refresh);
    };
  }, []);
  return (
    <span className="date" style={{ display, fontSize }}>
      {date}
      <br />
      {weekNumber}
    </span>
  );
};
export { DateWidget as default, DateWidget };
