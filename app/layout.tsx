import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ארכיון המשפחות',
  description: 'שומרים על הזיכרון לדורות הבאים',
  manifest: '/manifest.json',
  themeColor: '#c9a227',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ארכיון המשפחה' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Heebo:wght@300;400;500;600;700&family=Caveat:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}` }} />
      </body>
    </html>
  )
}
