import './globals.css';

import type { Metadata } from 'next';
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
} from 'next/font/google';

import { AnalyticsProvider } from '@/components/posthog-provider';
import { PageAnalyticsTracker } from '@/components/public/page-analytics-tracker';
import { VitalsReporter } from '@/components/VitalsReporter';

// preload: false on the dashboard/app fonts — they aren't used on the
// LCP path (which is the Onyx landing deck). Browsers still fetch them
// when the dashboard styles reference them; this removes 4 redundant
// <link rel="preload"> elements from the landing HTML head and frees
// critical bandwidth for the Playfair + Inter weights that actually
// paint the hero. psi-swarm flagged 7 font preloads as part of the 1.6s
// render delay on karte.cc /.
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  preload: false,
});

// ── Landing-page faces ──────────────────────────────────────────────
// Playfair Display is the gold-foil serif on the LCP h1 (.onyx-hero-h1
// is `font-family: var(--font-playfair)`). Inter pairs with it for
// body/UI. JetBrains is used only for the agent-spec labels deep in
// the deck — preload skipped to save a request on the LCP path.
const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  preload: false,
});

const SITE_URL = 'https://karte.cc';
const SITE_DESCRIPTION =
  'Your digital card on the open web — links, projects, bio, and an AI version of you. One page, one link: karte.cc/yourhandle.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Karte — Your digital card',
    template: '%s — Karte',
  },
  description: SITE_DESCRIPTION,
  applicationName: 'Karte',
  keywords: [
    'link in bio',
    'personal website',
    'digital card',
    'Linktree alternative',
  ],
  alternates: {
    canonical: 'https://karte.cc',
  },
  authors: [{ name: 'Karte' }],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Karte',
    title: 'Karte — Your digital card',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Karte — Your digital card',
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Karte',
              url: 'https://karte.cc',
              description:
                'A single page for every link you carry. Karte is your digital calling card — and an AI that knows what you would say.',
              inLanguage: 'en',
              publisher: {
                '@type': 'Organization',
                name: 'Karte',
                url: 'https://karte.cc',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${playfairDisplay.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AnalyticsProvider>
          <PageAnalyticsTracker />
          <VitalsReporter />
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
