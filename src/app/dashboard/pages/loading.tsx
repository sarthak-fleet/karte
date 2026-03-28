export default function PagesLoading() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 h-8 w-24 rounded bg-white/10 animate-pulse" />
      <div className="space-y-4">
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
