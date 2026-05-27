import Link from "next/link";

export const metadata = { title: "Not found — Karte" };

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center text-stone-300">
      <p className="font-mono text-xs uppercase tracking-wide text-stone-500">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
        Not found
      </h1>
      <p className="mt-3 text-sm text-stone-400">
        That profile doesn&apos;t exist or is set to private.
      </p>
      <div className="mt-6 flex justify-center gap-4 text-sm">
        <Link href="/" className="underline">
          Home
        </Link>
        <Link href="/about" className="underline">
          About
        </Link>
      </div>
    </main>
  );
}
