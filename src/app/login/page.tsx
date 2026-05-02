import { redirect } from 'next/navigation';

import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { PublicTopBar } from '@/components/public/public-top-bar';
import { getSession } from '@/lib/auth-server';

const modeLabels = ['Profile', 'Ask', 'Inbox', 'Newspaper'];

export default async function LoginPage() {
  const session = await getSession().catch(() => null);
  if (session?.user) redirect('/dashboard');

  return (
    <main className="min-h-screen overflow-hidden bg-[#10100f] text-white">
      <PublicTopBar current="login" variant="minimal" />

      <section className="relative min-h-[calc(100vh-4.5rem)] border-t border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-4.5rem)] max-w-6xl items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1fr_420px]">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.32em] text-cyan-200">
              Welcome back
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Manage the profile people can explore, ask, and message.
            </h1>
            <p className="mt-5 text-base leading-7 text-gray-400 sm:text-lg">
              Sign in to update your links, train your AI chat, review Inbox
              messages, and publish generated profile modes.
            </p>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
              {modeLabels.map((label) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-medium text-white"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/15 bg-white/[0.04] p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="rounded-2xl border border-white/10 bg-[#151514] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-bold text-gray-950">
                  LC
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">LinkChat</p>
                  <p className="text-xs text-gray-400">Creator dashboard</p>
                </div>
              </div>

              <h2 className="text-2xl font-semibold text-white">
                Sign in to continue
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                Your Google account verifies ownership and powers email-verified
                messaging.
              </p>

              <div className="mt-7">
                <GoogleSignInButton />
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-200">
                  After sign in
                </p>
                <div className="mt-3 space-y-2 text-sm text-gray-300">
                  <p>Set your visitor intent.</p>
                  <p>Enable anonymous or email-verified DMs.</p>
                  <p>Generate profile modes that make your page memorable.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
