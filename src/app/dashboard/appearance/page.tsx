import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { PageSettings } from '@/components/dashboard/page-settings';
import { PageToggles } from '@/components/dashboard/page-toggles';
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
                petUrl: page.petUrl,
                petEnabled: page.petEnabled,
              }
            : null
        }
      />

      {page && (
        <div className="mx-auto mt-10 max-w-2xl border-t border-karte-border pt-10">
          <PageToggles
            pageId={page.id}
            slug={page.slug}
            initialEncyclopedia={page.encyclopediaEnabled ?? false}
            initialRoast={page.roastEnabled ?? false}
            initialNewspaper={page.newspaperEnabled ?? false}
            initialPageSettings={page.pageSettings ?? {}}
          />
        </div>
      )}
    </>
  );
}
