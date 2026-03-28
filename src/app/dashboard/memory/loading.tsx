export default function MemoryLoading() {
  return (
    <div className="space-y-10">
      <div>
        <div className="mb-1 h-8 w-44 rounded bg-white/10 animate-pulse" />
        <div className="mb-6 h-4 w-72 rounded bg-white/10 animate-pulse" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
      <hr className="border-white/10" />
      <div className="h-32 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
    </div>
  );
}
