export default function EncyclopediaLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#f1f1f1] px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-300 bg-white text-gray-950 shadow-[0_24px_80px_-50px_rgba(0,0,0,0.7)]">
        <div className="grid border-b border-gray-200 bg-[#f8f9fa] sm:grid-cols-[1fr_240px]">
          <div className="px-5 py-5 sm:px-7">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-500">
              Karte Encyclopedia
            </p>
            <h1 className="mt-2 font-serif text-3xl text-gray-950 sm:text-4xl">
              Loading the article
            </h1>
          </div>
          <div className="border-t border-gray-200 px-5 py-5 sm:border-l sm:border-t-0">
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gray-900" />
            </div>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
              Indexing sections
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[190px_1fr_220px] sm:p-7">
          <aside className="hidden border-r border-gray-200 pr-5 sm:block">
            <div className="h-3 w-24 animate-pulse rounded bg-gray-400" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-2 animate-pulse rounded bg-gray-300"
                />
              ))}
            </div>
          </aside>

          <div>
            <div className="h-8 w-8/12 animate-pulse rounded bg-gray-300" />
            <div className="mt-5 space-y-3">
              <div className="h-3 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-9/12 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {['Summary', 'Background', 'Projects', 'References'].map(
                (label) => (
                  <div
                    key={label}
                    className="rounded-lg border border-gray-200 bg-[#f8f9fa] p-3"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                      {label}
                    </p>
                    <div className="mt-3 h-2 animate-pulse rounded bg-gray-300" />
                    <div className="mt-2 h-2 w-2/3 animate-pulse rounded bg-gray-200" />
                  </div>
                ),
              )}
            </div>
          </div>

          <aside className="rounded-xl border border-gray-200 bg-[#f8f9fa] p-4">
            <div className="h-28 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-4 space-y-2">
              <div className="h-2 rounded-full bg-gray-300" />
              <div className="h-2 w-10/12 rounded-full bg-gray-300" />
              <div className="h-2 w-7/12 rounded-full bg-gray-300" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
