import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import Navbar from '@/components/Navbar'
import RouteWrapper from '@/components/RouteWrapper'
import GlobalSearch from '@/components/GlobalSearch'
import BackToTop from '@/components/BackToTop'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: any
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Navbar />
      <RouteWrapper>{children}</RouteWrapper>
      <GlobalSearch />
      <BackToTop />
      <KeyboardShortcuts />
    </NextIntlClientProvider>
  )
}
