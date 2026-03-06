import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ChatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Chats</h1>
      <p className="mb-6 text-sm text-gray-400">
        View conversations visitors have had with your AI chatbot.
      </p>
      <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
        <p className="text-gray-400">Chat history coming soon.</p>
      </div>
    </div>
  );
}
