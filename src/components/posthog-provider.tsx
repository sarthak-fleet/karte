'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect, useRef } from 'react';

import { authClient } from '@/lib/auth-client';
import { installBrowserMonitoring } from '@/lib/foundry-monitoring';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const trackedSessionId = useRef<string | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (key && host) {
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
      }
    } else {
      posthog.reset();
      trackedSessionId.current = null;
    }
  }, [session]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
