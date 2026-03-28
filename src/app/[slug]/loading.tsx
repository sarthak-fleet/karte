export default function SlugLoading() {
  return (
    <div className="mt-8 w-full space-y-4">
      {/* Links section skeleton */}
      <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
      <div className="h-6 w-40 rounded bg-white/10 animate-pulse" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-14 rounded-xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>

      {/* Projects section skeleton */}
      <div className="mt-8 h-4 w-20 rounded bg-white/10 animate-pulse" />
      <div className="h-6 w-36 rounded bg-white/10 animate-pulse" />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-64 rounded-3xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
