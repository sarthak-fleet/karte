import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { AiKeySettings } from '@/components/dashboard/ai-key-settings';
import { ChatSettings } from '@/components/dashboard/chat-settings';
import { InfoEditor } from '@/components/dashboard/info-editor';
import { db } from '@/db';
import { infoBlocks, links, projects, users } from '@/db/schema';
import { getDefaultAiConfig } from '@/lib/ai-client';
import { getCurrentPage, getSession } from '@/lib/auth-server';

function SectionEyebrow({ label, title, description }: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-karte-text-4">
        <span className="text-karte-accent/80">·</span> {label}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-[-0.01em] text-karte-text">
        {title}
      </h2>
      <p className="mt-1 text-[13px] leading-[1.55] text-karte-text-3">
        {description}
      </p>
    </div>
  );
}

export default async function MemoryPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await getCurrentPage(session.user.id);

  if (!page) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-karte-text">Memory</h1>
        <p className="text-sm text-karte-text-3">
          Create a page first from the Appearance tab.
        </p>
      </div>
    );
  }

  const [user] = await db.select({
    smApiKey: users.smApiKey,
    aiEndpointUrl: users.aiEndpointUrl,
    aiApiKey: users.aiApiKey,
    aiModel: users.aiModel,
  }).from(users).where(eq(users.id, session.user.id));

  const [blocks, pageLinks, pageProjects] = await Promise.all([
    db.query.infoBlocks.findMany({
      where: eq(infoBlocks.pageId, page.id),
      orderBy: [infoBlocks.sortOrder],
    }),
    db.select({ id: links.id }).from(links).where(eq(links.pageId, page.id)),
    db.select({ id: projects.id }).from(projects).where(eq(projects.pageId, page.id)),
  ]);

  const sourceCount = blocks.length + pageLinks.length + pageProjects.length + (page.bio ? 1 : 0);
  const defaultAiConfig = getDefaultAiConfig();
  const coverageStrong = blocks.length >= 2 && sourceCount >= 4;

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-karte-text">
          Memory
        </h1>
        <p className="mt-2 text-sm leading-[1.55] text-karte-text-3">
          Source-backed details that power chat, encyclopedia, newspaper, and
          roast modes. The more you add here, the smarter every generated
          surface gets.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white/[0.025] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-karte-text-4">
              Sources
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-karte-text">
              {sourceCount}
            </p>
            <p className="mt-1 text-[11px] text-karte-text-4">
              links + projects + memory + bio
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.025] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-karte-text-4">
              Memory blocks
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-karte-text">
              {blocks.length}
            </p>
            <p className="mt-1 text-[11px] text-karte-text-4">
              text · resume · FAQ
            </p>
          </div>
          <div
            className={`rounded-xl p-4 ${
              coverageStrong
                ? 'bg-karte-accent/[0.08]'
                : 'bg-white/[0.025]'
            }`}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-karte-text-4">
              Coverage
            </p>
            <p
              className={`mt-2 text-2xl font-semibold tracking-tight ${
                coverageStrong ? 'text-karte-accent-soft' : 'text-karte-text'
              }`}
            >
              {coverageStrong ? 'Strong' : 'Light'}
            </p>
            <p className="mt-1 text-[11px] text-karte-text-4">
              {coverageStrong
                ? 'AI surfaces have enough to work with.'
                : 'Add ≥2 blocks for better generations.'}
            </p>
          </div>
        </div>
      </header>

      <section>
        <SectionEyebrow
          label="Knowledge"
          title="Memory blocks"
          description="Short, source-backed facts. The chat reads these to answer questions and the encyclopedia / newspaper pages cite them."
        />
        <InfoEditor pageId={page.id} initialBlocks={blocks} />
      </section>

      <section className="mt-12 border-t border-karte-border pt-10">
        <SectionEyebrow
          label="Chat"
          title="Chat behavior"
          description="Whether visitors can chat with your profile, and how the assistant should sound."
        />
        <ChatSettings
          pageId={page.id}
          initialChatEnabled={page.chatEnabled ?? false}
          initialSystemPrompt={page.chatSystemPrompt ?? ''}
          initialChatPosition={page.themeConfig?.chatPosition ?? 'bottom-right'}
        />
      </section>

      <section className="mt-12 border-t border-karte-border pt-10">
        <SectionEyebrow
          label="AI provider"
          title="Bring your own model"
          description="By default we use the free Karte AI gateway. Plug in your own key + model if you want full control."
        />
        <AiKeySettings
          hasKey={!!user?.smApiKey}
          hasAiConfig={!!(user?.aiEndpointUrl && user?.aiApiKey && user?.aiModel) || !!defaultAiConfig}
          aiEndpointUrl={user?.aiEndpointUrl || defaultAiConfig?.endpointUrl || ''}
          aiModel={user?.aiModel || defaultAiConfig?.model || ''}
          isUsingDefaultAi={!(user?.aiEndpointUrl && user?.aiApiKey && user?.aiModel) && !!defaultAiConfig}
        />
      </section>
    </div>
  );
}
