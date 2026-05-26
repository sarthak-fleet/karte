import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

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
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
      >
        <AnalyticsProvider>
          <PageAnalyticsTracker />
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
