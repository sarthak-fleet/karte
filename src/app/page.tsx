import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950">
      {/* Gradient blobs */}
      <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-purple-600/15 blur-[128px]" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-blue-600/15 blur-[128px]" />

      <div className="relative mx-auto max-w-2xl px-4 py-32 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white">
          Your links.<br />Your story.<br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Your AI.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-400">
          Create a beautiful personal page with all your links — and let visitors chat with an AI that knows everything about you.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
