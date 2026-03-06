import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { pages, infoBlocks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { InfoEditor } from '@/components/dashboard/info-editor';
import { ChatSettings } from '@/components/dashboard/chat-settings';

export default async function MemoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const page = await db.query.pages.findFirst({
    where: eq(pages.userId, session.user.id),
  });

  if (!page) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-white">Chatbot Memory</h1>
        <p className="text-sm text-gray-400">
          Create a page first from the Appearance tab.
        </p>
      </div>
    );
  }

  const blocks = await db.query.infoBlocks.findMany({
    where: eq(infoBlocks.pageId, page.id),
    orderBy: [infoBlocks.sortOrder],
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-1 text-2xl font-bold text-white">Chatbot Memory</h1>
        <p className="mb-6 text-sm text-gray-400">
          Add information the AI uses to answer visitor questions.
        </p>
        <InfoEditor pageId={page.id} initialBlocks={blocks} />
      </div>

      <hr className="border-white/10" />

      <ChatSettings
        pageId={page.id}
        initialChatEnabled={page.chatEnabled ?? false}
        initialSystemPrompt={page.chatSystemPrompt ?? ''}
      />
    </div>
  );
}
