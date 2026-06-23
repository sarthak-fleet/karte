import { redirect } from 'next/navigation';

import { WidgetGallery } from '@/components/dashboard/widget-gallery';
import { WidgetPickerDemo } from '@/components/dashboard/widget-picker-demo';
import { getCurrentPage, getSession } from '@/lib/auth-server';

// Internal-facing catalog of every renderable widget on a public profile
// page — links, projects, sections. Each row exposes the variant id, the
// data it needs, and the "best for" hint the AI Revamp prompt will see.
// The picker demo below runs the same heuristic the AI will use, against
// your actual page content.
export default async function WidgetsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await getCurrentPage(session.user.id);

  return (
    <div className="space-y-14">
      <header>
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
          <span className="text-karte-accent/80">·</span> Design system
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.015em] text-karte-text sm:text-3xl">
          Profile widgets
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-[1.55] text-karte-text-3">
          Every content widget that can appear on your public profile. The AI
          Revamp assistant picks one variant per item — size determines how much
          focus that piece gets in the layout.
        </p>
      </header>

      {page && <WidgetPickerDemo pageId={page.id} />}

      <WidgetGallery />
    </div>
  );
}
