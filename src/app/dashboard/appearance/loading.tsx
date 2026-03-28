export default function AppearanceLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 rounded bg-white/10 animate-pulse" />
      <div className="h-4 w-56 rounded bg-white/10 animate-pulse" />
      <div className="space-y-4">
        <div className="h-32 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
        <div className="h-48 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
