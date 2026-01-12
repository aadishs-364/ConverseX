export const LANGUAGE_LOCALE_MAP = {
  'English (US)': 'en-US',
  'English (UK)': 'en-GB',
  Deutsch: 'de-DE',
};

export const TIMEZONE_MAP = {
  'GMT+05:30': 'Asia/Kolkata',
  'GMT+01:00': 'Europe/Berlin',
  'GMT-05:00': 'America/New_York',
};

export const getLanguageLocale = (label = 'English (US)') => {
  return LANGUAGE_LOCALE_MAP[label] || 'en-US';
};

export const getTimezoneIdentifier = (label = 'GMT+05:30') => {
  return TIMEZONE_MAP[label] || 'UTC';
};
