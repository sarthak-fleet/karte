import { redirect } from 'next/navigation';

import { PageSettings } from '@/components/dashboard/page-settings';
import { PublicTopBar } from '@/components/public/public-top-bar';
import { getSession } from '@/lib/auth-server';

export default async function CreatePage() {
  const session = await getSession();

  if (session?.user?.id) {
    redirect('/dashboard/appearance');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950">
      <div className="absolute -left-1/4 -top-1/4 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[128px]" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[520px] w-[520px] rounded-full bg-blue-600/10 blur-[128px]" />

      <PublicTopBar current="create" accentColor="#67e8f9" />

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-cyan-300/80">
            Start Before Login
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Draft your profile first.
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Claim it when you&apos;re ready.
            </span>
          </h1>
          <p className="mt-5 text-base leading-7 text-gray-400 sm:text-lg">
            Pick a username, write your bio, choose your theme, and shape the
            page before you create an account. We only ask you to sign in when
            you save and claim it.
          </p>
        </div>

        <PageSettings
          page={null}
          requireAuthToCreate
          loginHref="/login?next=/dashboard/appearance"
        />
      </div>
    </div>
  );
}
