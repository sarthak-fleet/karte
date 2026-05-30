import "./globals.css";

import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
} from "next/font/google";

import { AnalyticsProvider } from "@/components/posthog-provider";
import { PageAnalyticsTracker } from "@/components/public/page-analytics-tracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

// ── Landing-page faces ──────────────────────────────────────────────
// Playfair Display is the gold-foil serif used across the Onyx deck.
// Inter and JetBrains Mono pair with it: Inter for body/UI, JetBrains
// for the agent-spec labels. These names match the CSS variables in
// src/app/landing.css (--font-playfair, --font-inter, --font-jetbrains).
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const SITE_URL = "https://karte.cc";
const SITE_DESCRIPTION =
  "Your digital card on the open web — links, projects, bio, and an AI version of you. One page, one link: karte.cc/yourhandle.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Karte — Your digital card",
    template: "%s — Karte",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Karte",
  keywords: [
    "link in bio",
    "personal website",
    "digital card",
    "Linktree alternative",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Karte",
    title: "Karte — Your digital card",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Karte — Your digital card",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${playfairDisplay.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AnalyticsProvider>
          <PageAnalyticsTracker />
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
