import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { AiKeySettings } from '@/components/dashboard/ai-key-settings';
import { ChatSettings } from '@/components/dashboard/chat-settings';
import { InfoEditor } from '@/components/dashboard/info-editor';
import { db } from '@/db';
import { infoBlocks, links, pages, projects,users } from '@/db/schema';
import { getDefaultAiConfig } from '@/lib/ai-client';
import { getSession } from '@/lib/auth-server';

export default async function MemoryPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Profile Memory</h1>
        <p className="text-sm text-gray-400">
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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-white">Profile Memory</h1>
        <p className="mb-6 text-sm text-gray-400">
          Add source-backed details that power chat, encyclopedia, newspaper, and roast modes.
        </p>
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Sources</p>
            <p className="mt-2 text-2xl font-semibold text-white">{sourceCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Memory Blocks</p>
            <p className="mt-2 text-2xl font-semibold text-white">{blocks.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Coverage</p>
            <p className="mt-2 text-sm font-medium text-white">
              {blocks.length >= 2 && sourceCount >= 4 ? 'Strong' : 'Add more context'}
            </p>
          </div>
        </div>
        <InfoEditor pageId={page.id} initialBlocks={blocks} />
      </div>

      <hr className="border-white/10" />

      <AiKeySettings
        hasKey={!!user?.smApiKey}
        hasAiConfig={!!(user?.aiEndpointUrl && user?.aiApiKey && user?.aiModel) || !!defaultAiConfig}
        aiEndpointUrl={user?.aiEndpointUrl || defaultAiConfig?.endpointUrl || ''}
        aiModel={user?.aiModel || defaultAiConfig?.model || ''}
        isUsingDefaultAi={!(user?.aiEndpointUrl && user?.aiApiKey && user?.aiModel) && !!defaultAiConfig}
      />

      <hr className="border-white/10" />

      <ChatSettings
        pageId={page.id}
        initialChatEnabled={page.chatEnabled ?? false}
        initialSystemPrompt={page.chatSystemPrompt ?? ''}
        initialChatPosition={page.themeConfig?.chatPosition ?? 'bottom-right'}
      />
    </div>
  );
}
