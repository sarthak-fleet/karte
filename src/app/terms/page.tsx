import Link from "next/link";

export const metadata = {
  title: "Terms — Karte",
  description: "Use of Karte is provided as-is. You own your profile content.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-stone-300">
      <Link href="/" className="text-xs text-stone-500 hover:underline">
        ← Karte
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Terms</h1>
      <p className="mt-4 text-xs text-stone-500">Last updated: 2026-05-15.</p>

      <h2 className="mt-8 text-base font-semibold text-white">Your content</h2>
      <p className="mt-2">
        You own the content you put in your Karte profile. By creating
        a public profile you grant the service the rights necessary to
        display that content to visitors and pass it to the AI provider
        configured for chat modes.
      </p>

      <h2 className="mt-8 text-base font-semibold text-white">Acceptable use</h2>
      <p className="mt-2">
        No illegal content. No targeted harassment of specific people.
        No impersonation. Profiles that violate this may be removed
        without notice.
      </p>

      <h2 className="mt-8 text-base font-semibold text-white">No warranty</h2>
      <p className="mt-2">
        Provided as-is. AI responses may be wrong; treat them as
        suggestions, not facts about you.
      </p>
    </main>
  );
}
