import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  if (!locale || !['he', 'en', 'nl', 'de'].includes(locale)) {
    locale = 'he';
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});