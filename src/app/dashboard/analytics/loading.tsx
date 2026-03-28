export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="h-8 w-32 rounded bg-white/10 animate-pulse" />
      <div className="h-4 w-64 rounded bg-white/10 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
