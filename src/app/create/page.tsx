import { redirect } from 'next/navigation';

import { ImportPasteCard } from '@/components/create/import-paste-card';
import { OnboardingChat } from '@/components/create/onboarding-chat';
import { PageSettings } from '@/components/dashboard/page-settings';
import { PublicTopBar } from '@/components/public/public-top-bar';
import { getSession } from '@/lib/auth-server';

// Sanitize a query-param slug to the same rules the input enforces:
// lowercase, alphanumeric + hyphens. Server-render safe so the
// /create?slug=<value> entry from the landing card V doesn't flash
// empty before client hydration.
function sanitizeSlug(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  return raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
}

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();

  if (session?.user?.id) {
    redirect('/dashboard/appearance');
  }

  const params = await searchParams;
  const initialSlug = sanitizeSlug(params.slug);

  return (
    <div
      data-onyx-brand
      className="relative min-h-screen overflow-hidden bg-karte-bg text-karte-text-2 antialiased"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,#000_25%,transparent_72%)]" />
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-karte-accent/10 blur-[160px]" />
      </div>

      <PublicTopBar current="create" variant="minimal" accentColor="#67e8f9" />

      <div className="relative mx-auto max-w-5xl px-6 py-12 sm:py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            <span className="text-karte-accent/80">·</span> Start before login
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.025em] text-karte-text sm:text-5xl lg:text-6xl">
            Draft your profile first.{' '}
            <span
              className="font-normal italic text-karte-accent-soft"
              style={{ fontFamily: 'var(--font-instrument-serif), serif' }}
            >
              Claim it
            </span>{' '}
            when you&apos;re ready.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3 sm:text-base">
            Pick a username, write your bio, choose your theme, and shape the
            page before you create an account. We only ask you to sign in when
            you save and claim it.
          </p>
        </div>

        <div className="mb-10 sm:mb-12">
          <ImportPasteCard />
        </div>

        <div className="relative mb-10 flex items-center gap-4 sm:mb-12">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            or chat your way through it
          </span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <div className="mb-10 sm:mb-12">
          <OnboardingChat />
        </div>

        <div className="relative mb-10 flex items-center gap-4 sm:mb-12">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
            or design from scratch
          </span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        <PageSettings
          page={null}
          initialSlug={initialSlug}
          requireAuthToCreate
          loginHref="/login?next=/dashboard/appearance"
        />
      </div>
    </div>
  );
}
