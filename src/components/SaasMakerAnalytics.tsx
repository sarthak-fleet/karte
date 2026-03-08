'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { SaaSMakerClient } from '@saas-maker/sdk';

const apiKey = process.env.NEXT_PUBLIC_SAASMAKER_API_KEY;

const client = apiKey
  ? new SaaSMakerClient({
      apiKey,
      baseUrl: process.env.NEXT_PUBLIC_SAASMAKER_API_URL || 'https://api.sassmaker.com',
    })
  : null;

export function SaasMakerAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    client?.analytics.track({ name: 'page_view', url: pathname }).catch(() => {});
  }, [pathname]);

  return null;
}
