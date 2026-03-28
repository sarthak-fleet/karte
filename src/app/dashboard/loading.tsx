export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="h-8 w-48 rounded bg-white/10 animate-pulse" />
      <div className="h-4 w-64 rounded bg-white/10 animate-pulse" />
      <div className="mt-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
