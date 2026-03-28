export default function LinksLoading() {
  return (
    <div>
      <div className="mb-6 h-8 w-40 rounded bg-white/10 animate-pulse" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
