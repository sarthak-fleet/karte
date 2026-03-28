export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 h-8 w-20 rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-56 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
