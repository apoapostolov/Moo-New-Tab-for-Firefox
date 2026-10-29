/**
 * `en_US` becomes `en-US`, plus a `-u-nu-` extension for languages with
 * non-Latin digits.
 */
export function getLocaleCode(locale = localStorage.getItem('language') || 'en-GB') {
  const language = locale.replace(/_/g, '-');

  const numberingSystems = {
    ar: 'arab', // Arabic - Eastern Arabic numerals (٠-٩)
    fa: 'arabext', // Persian - Extended Arabic-Indic numerals (۰-۹)
    bn: 'beng', // Bengali - Bengali numerals (০-৯)
    hi: 'deva', // Hindi - Devanagari numerals (०-९)
    mr: 'deva', // Marathi - Devanagari numerals
    ne: 'deva', // Nepali - Devanagari numerals
    ta: 'tamldec', // Tamil - Tamil numerals (௦-௯)
  };

  const baseLang = language.split('-')[0];

  if (numberingSystems[baseLang]) {
    return `${language}-u-nu-${numberingSystems[baseLang]}`;
  }

  return language;
}

/**
 * Formats for the active locale when `localeFormatting` is on; plain string
 * otherwise.
 */
export function formatNumber(value, options = {}) {
  const localeFormatting = localStorage.getItem('localeFormatting');
  if (localeFormatting === 'false' || localeFormatting === null) {
    return String(value);
  }
  try {
    return new Intl.NumberFormat(getLocaleCode(), options).format(value);
  } catch {
    return String(value);
  }
}

/**
 * Formats a 0–1 fraction as a percentage, not a 0–100 number.
 */
export function formatPercentage(value, locale) {
  const localeFormatting = localStorage.getItem('localeFormatting');
  if (localeFormatting === 'false') {
    return Math.round(value * 100) + '%';
  }
  try {
    return new Intl.NumberFormat(getLocaleCode(locale), {
      style: 'percent',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return Math.round(value * 100) + '%';
  }
}

/**
 * Digits in the locale's own numerals, without grouping separators.
 */
export function formatDigits(value) {
  const localeFormatting = localStorage.getItem('localeFormatting');
  if (localeFormatting === 'false') {
    return String(value);
  }
  try {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numValue)) return String(value);
    return new Intl.NumberFormat(getLocaleCode(), {
      useGrouping: false,
    }).format(numValue);
  } catch {
    return String(value);
  }
}
