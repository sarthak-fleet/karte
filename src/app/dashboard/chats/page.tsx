import { redirect } from 'next/navigation';

import { ChatList } from '@/components/dashboard/chat-list';
import { getCurrentPage, getSession } from '@/lib/auth-server';

export default async function ChatsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const page = await getCurrentPage(session.user.id);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-karte-text">Chats</h1>
      <p className="mb-6 text-sm text-karte-text-3">
        View conversations visitors have had with your AI chatbot.
      </p>
      {page ? (
        <ChatList pageId={page.id} />
      ) : (
        <div className="rounded-2xl bg-white/[0.02] p-8 text-center">
          <p className="text-karte-text-3">Create a page first to start receiving chats.</p>
        </div>
      )}
    </div>
  );
}
