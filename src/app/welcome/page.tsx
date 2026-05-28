import { redirect } from 'next/navigation';

import { PublicTopBar } from '@/components/public/public-top-bar';
import { WelcomeFlow } from '@/components/welcome/welcome-flow';
import { getSession } from '@/lib/auth-server';

export default async function WelcomePage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect('/login?next=/welcome');
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-karte-bg text-karte-text antialiased">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_top,#000_25%,transparent_72%)]" />
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-karte-accent/10 blur-[160px]" />
      </div>

      <PublicTopBar current="create" variant="minimal" accentColor="#67e8f9" />

      <div className="relative mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <WelcomeFlow />
      </div>
    </main>
  );
}
