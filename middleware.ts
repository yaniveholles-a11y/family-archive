import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['he', 'en', 'nl', 'de'],
  defaultLocale: 'he',
  localeDetection: false,   // תמיד עברית כברירת מחדל
});

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|_not-found|.*\\..*).*)' 
  ]
};