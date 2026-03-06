import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-white">Analytics</h1>
      <p className="mb-6 text-sm text-gray-400">
        Page views, link clicks, and visitor insights.
      </p>
      <div className="rounded-2xl border border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
        <p className="text-gray-400">Analytics coming soon via SaaS Maker integration.</p>
      </div>
    </div>
  );
}
