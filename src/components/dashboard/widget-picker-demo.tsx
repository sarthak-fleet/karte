import { eq } from 'drizzle-orm';

import {
  allVariantsById,
  type LinkCardData,
  type ProjectCardData,
} from '@/components/public/widgets';
import { db } from '@/db';
import { links, projects } from '@/db/schema';
import { pickLinkVariants, pickProjectVariants } from '@/lib/widget-picker';

// Server component — pulls the signed-in user's actual links + projects,
// runs the picker, and shows which variant would be chosen for each.
// The renderer reads from the same registry the (eventual) AI flow does,
// so what shows here is exactly what the profile would look like once
// the LayoutRenderer ships.
export async function WidgetPickerDemo({ pageId }: { pageId: string }) {
  const [linkRows, projectRows] = await Promise.all([
    db
      .select()
      .from(links)
      .where(eq(links.pageId, pageId))
      .orderBy(links.sortOrder),
    db
      .select()
      .from(projects)
      .where(eq(projects.pageId, pageId))
      .orderBy(projects.sortOrder),
  ]);

  const linkData: LinkCardData[] = linkRows.map((l) => ({
    id: l.id,
    title: l.title,
    url: l.url,
    icon: l.icon ?? null,
    imageUrl: null,
    body: null,
  }));

  const projectData: ProjectCardData[] = projectRows.map((p) => ({
    id: p.id,
    title: p.title,
    url: p.url,
    description: p.description,
    imageUrl: p.imageUrl ?? null,
  }));

  const linkPicks = pickLinkVariants(linkData);
  const projectPicks = pickProjectVariants(projectData);

  const ctx = { accentColor: '#67e8f9', slug: 'demo' };
  const totalItems = linkPicks.length + projectPicks.length;

  if (totalItems === 0) {
    return (
      <section>
        <div className="rounded-2xl bg-white/[0.02] p-6">
          <p className="text-[13px] leading-[1.55] text-karte-text-3">
            You don&apos;t have any links or projects on this page yet. Add some
            from the Links / Projects tab and come back — this demo will then
            show which variant the picker would choose for each.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-accent-soft">
          <span className="text-karte-accent/80">·</span> Live picker
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-karte-text">
          What would the picker choose for{' '}
          <span className="text-karte-text-3">your</span> content?
        </h2>
        <p className="mt-2 max-w-2xl text-[13px] leading-[1.55] text-karte-text-3">
          We run the same heuristic the AI Revamp endpoint will use. For each
          link / project, the picker looks at the data available (image? body?
          description?) and picks the variant that gives it the right amount of
          focus. Heroes are capped at one per content type so the page stays
          balanced.
        </p>
      </div>

      {linkPicks.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
            {linkPicks.length} link{linkPicks.length === 1 ? '' : 's'}
          </p>
          <div className="space-y-3">
            {linkPicks.map((pick) => {
              const variant = allVariantsById[pick.variantId];
              if (!variant) return null;
              return (
                <div
                  key={pick.data.id}
                  className="grid gap-4 rounded-2xl bg-white/[0.02] p-4 sm:grid-cols-[200px_1fr] sm:gap-6 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-karte-text-4">
                      picked
                    </p>
                    <p className="mt-1.5 text-[13px] font-semibold capitalize text-karte-accent-soft">
                      {variant.id}
                    </p>
                    <p className="mt-2 text-[12px] leading-[1.5] text-karte-text-3">
                      {pick.reason}
                    </p>
                  </div>
                  <div className="min-w-0">
                    {variant.render(pick.data, ctx)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {projectPicks.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
            {projectPicks.length} project{projectPicks.length === 1 ? '' : 's'}
          </p>
          <div className="space-y-3">
            {projectPicks.map((pick) => {
              const variant = allVariantsById[pick.variantId];
              if (!variant) return null;
              return (
                <div
                  key={pick.data.id}
                  className="grid gap-4 rounded-2xl bg-white/[0.02] p-4 sm:grid-cols-[200px_1fr] sm:gap-6 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-karte-text-4">
                      picked
                    </p>
                    <p className="mt-1.5 text-[13px] font-semibold capitalize text-karte-accent-soft">
                      {variant.id}
                    </p>
                    <p className="mt-2 text-[12px] leading-[1.5] text-karte-text-3">
                      {pick.reason}
                    </p>
                  </div>
                  <div className="min-w-0">
                    {variant.render(pick.data, ctx)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
