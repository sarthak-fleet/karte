import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { PageSettings } from '@/components/dashboard/page-settings';
import { PendingImportBanner } from '@/components/dashboard/pending-import-banner';
import { PendingOnboardingBanner } from '@/components/dashboard/pending-onboarding-banner';
import { getCurrentPage, getSession } from '@/lib/auth-server';

export default async function AppearancePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await getCurrentPage(session.user.id);

  return (
    <>
      <Suspense fallback={null}>
        <PendingOnboardingBanner />
      </Suspense>
      <Suspense fallback={null}>
        <PendingImportBanner />
      </Suspense>
      <PageSettings
        page={
          page
            ? {
                id: page.id,
                slug: page.slug,
                displayName: page.displayName,
                bio: page.bio,
                avatarUrl: page.avatarUrl,
                themeConfig: page.themeConfig,
                published: page.published,
                dmMode: page.dmMode,
                location: page.location,
                calendarUrl: page.calendarUrl,
                newsletterUrl: page.newsletterUrl,
                tipUrl: page.tipUrl,
                videoUrl: page.videoUrl,
              }
            : null
        }
      />
    </>
  );
}
