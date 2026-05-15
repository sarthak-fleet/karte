import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy — Linkchat",
  description: "What Linkchat stores and what it never sends to third parties.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-sm leading-7 text-stone-300">
      <Link href="/" className="text-xs text-stone-500 hover:underline">
        ← Linkchat
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Privacy</h1>
      <p className="mt-4 text-xs text-stone-500">Last updated: 2026-05-15.</p>

      <h2 className="mt-8 text-base font-semibold text-white">What we store</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-stone-600">
        <li>Your Google OAuth identity for sign-in.</li>
        <li>Profile content you enter — links, bio, avatar, and any infoBlocks for AI modes.</li>
        <li>Avatar images you upload — stored in Cloudflare R2.</li>
      </ul>

      <h2 className="mt-8 text-base font-semibold text-white">What we don&apos;t do</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-stone-600">
        <li>No third-party analytics by default.</li>
        <li>No selling of profile data.</li>
        <li>Chat queries from visitors are validated server-side and not retained beyond the response.</li>
      </ul>

      <h2 className="mt-8 text-base font-semibold text-white">Public vs private</h2>
      <p className="mt-2">
        Profiles are public by default but can be set private via the
        dashboard visibility toggle. Toggling private prevents the
        profile from being served or indexed.
      </p>

      <h2 className="mt-8 text-base font-semibold text-white">Deletion</h2>
      <p className="mt-2">
        Delete your profile from the dashboard to remove all stored
        content, including R2-hosted avatars and any infoBlocks.
      </p>
    </main>
  );
}
