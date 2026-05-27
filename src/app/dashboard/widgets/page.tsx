import { redirect } from 'next/navigation';

import { WidgetGallery } from '@/components/dashboard/widget-gallery';
import { getSession } from '@/lib/auth-server';

// Internal-facing catalog of every input, button, and widget variant Karte
// renders — the source the AI Revamp assistant picks from when generating
// a layout, plus every form primitive the dashboard uses. Surfacing them
// in one place makes "what shape will the AI pick?" answerable at a
// glance and keeps the design system honest.
export default async function WidgetsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="space-y-12">
      <header>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          <span className="text-karte-accent/80">·</span> Design system
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-karte-text sm:text-3xl">
          Widget directory
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-[1.55] text-karte-text-3">
          Every input, button, and content widget the platform ships. The
          AI Revamp assistant picks layouts from the widgets section below
          — that&apos;s the set of shapes your profile can take.
        </p>
      </header>

      <WidgetGallery />
    </div>
  );
}
