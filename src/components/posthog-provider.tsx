'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useRef } from 'react';

import { trackReturned, trackSignup } from '@/lib/analytics-events';
import { authClient } from '@/lib/auth-client';
import { installBrowserMonitoring } from '@/lib/foundry-monitoring';

const DEFAULT_POSTHOG_KEY = 'phc_qgiAarw4Co4pw9fz3Fxj4UJaHmqzFetqs4JrXhGc35Nd';
const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const trackedSessionId = useRef<string | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? DEFAULT_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST;

    if (key) {
      posthog.init(key, {
        api_host: host,
        person_profiles: 'always',
        capture_pageview: false, // We'll handle pageviews manually or let PostHog handle it if we want
        autocapture: false, // Disable autocapture to ensure we only send what we want
      });
    }

    return installBrowserMonitoring();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      // Identify user by ID only, no PII (email, name) sent to PostHog
      posthog.identify(session.user.id);

      if (trackedSessionId.current !== session.session.id) {
        posthog.capture('user_login');
        trackedSessionId.current = session.session.id;

        // Owner-facing analytics — emit the fixed-taxonomy session event.
        // `signup` fires the first time a user is seen in this browser;
        // `returned` fires on every later session for a known user.
        try {
          const key = `karte:seen:${session.user.id}`;
          if (window.localStorage.getItem(key)) {
            trackReturned();
          } else {
            window.localStorage.setItem(key, String(Date.now()));
            trackSignup();
          }
        } catch {
          // localStorage may be unavailable — never break on analytics.
        }
      }
    } else {
      posthog.reset();
      trackedSessionId.current = null;
    }
  }, [session]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
