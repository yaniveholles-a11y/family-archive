'use client';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

const languages = [
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    window.location.href = segments.join('/');
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <select
        value={locale}
        onChange={(e) => switchLanguage(e.target.value)}
        style={{
          padding: '6px 12px',
          borderRadius: '8px',
          border: '1px solid #c9a227',
          background: '#1a0f05',
          color: '#f5d98b',
          cursor: 'pointer',
          fontSize: '14px',
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}