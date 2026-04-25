import { getSession } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { pages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ChatList } from '@/components/dashboard/chat-list';

export default async function ChatsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const userPages = await db
    .select()
    .from(pages)
    .where(eq(pages.userId, session.user.id));

  const page = userPages[0];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Chats</h1>
      <p className="mb-6 text-sm text-gray-400">
        View conversations visitors have had with your AI chatbot.
      </p>
      {page ? (
        <ChatList pageId={page.id} />
      ) : (
        <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-gray-400">Create a page first to start receiving chats.</p>
        </div>
      )}
    </div>
  );
}
