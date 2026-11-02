import './global.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Navbar } from './components/nav'
import Footer from './components/footer'
import { baseUrl, site } from './site'
import { PanelLighting } from './components/panel-lighting'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: baseUrl,
    siteName: site.name,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: site.name,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      // Jump to the top on page changes; keep smooth scrolling for in-page links.
      data-scroll-behavior="smooth"
      className={cx(
        'dark',
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <body className="antialiased">
        <a className="skip-link" href="#content">Skip to content</a>
        <div className="site-shell">
          <PanelLighting />
          <Navbar />
          <main id="content" tabIndex={-1}>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
