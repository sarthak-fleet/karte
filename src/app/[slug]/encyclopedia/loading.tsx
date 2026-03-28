export default function EncyclopediaLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/10 animate-pulse" />
        <div className="mx-auto mb-2 h-6 w-48 rounded bg-white/10 animate-pulse" />
        <div className="mx-auto h-4 w-32 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}
