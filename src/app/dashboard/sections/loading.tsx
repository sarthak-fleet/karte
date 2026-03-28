export default function SectionsLoading() {
  return (
    <div>
      <div className="mb-1 h-8 w-28 rounded bg-white/10 animate-pulse" />
      <div className="mb-6 h-4 w-72 rounded bg-white/10 animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
