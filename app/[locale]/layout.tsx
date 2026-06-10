import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GSAPProvider from '@/components/GSAPProvider'

const locales = ['he', 'en', 'nl', 'de']

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!locales.includes(locale)) notFound()

  let messages
  try { messages = await getMessages() } catch { messages = {} }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <GSAPProvider>
        <Navbar />
        {children}
      </GSAPProvider>
    </NextIntlClientProvider>
  )
}
