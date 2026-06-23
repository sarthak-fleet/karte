export default function RoastLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#12020b] px-4 py-10 text-white">
      <div className="w-full max-w-3xl -rotate-1 border-4 border-[#f9ff00] bg-[#210815] p-5 shadow-[14px_14px_0_#00ffd5] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#00ffd5]">
              Karte Roast Lab
            </p>
            <h1 className="mt-3 text-2xl font-black uppercase leading-tight text-white sm:text-4xl">
              Loading the public vibe inspection
            </h1>
          </div>
          <div className="flex h-16 w-16 shrink-0 animate-pulse items-center justify-center border-4 border-white bg-black text-2xl font-black text-[#f9ff00]">
            ??
          </div>
        </div>

        <div className="mt-7 rotate-1 border-4 border-[#00ffd5] bg-black p-5 shadow-[8px_8px_0_#ff2aa3]">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#f9ff00]">
              Public Vibe Inspection
            </p>
            <div className="h-2 w-28 overflow-hidden bg-white/15">
              <div className="h-full w-2/3 animate-pulse bg-[#ff2aa3]" />
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[132px_1fr]">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-[#00ffd5]/80 text-4xl font-black text-[#f9ff00] shadow-[0_0_35px_rgba(0,255,213,0.25)]">
              82
            </div>
            <div className="space-y-4 pt-1">
              {[
                ['Scanning links', 'bg-white/25'],
                ['Measuring founder energy', 'bg-[#00ffd5]/40'],
                ['Finding the funniest specific detail', 'bg-[#f9ff00]/50'],
                ['Keeping it shareable', 'bg-[#ff2aa3]/45'],
              ].map(([label, color]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                    <span>{label}</span>
                    <span>...</span>
                  </div>
                  <div className={`h-3 animate-pulse ${color}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {['Red flags', 'Best link', 'Bio autopsy'].map((label) => (
            <div
              key={label}
              className="rotate-1 border-2 border-white bg-[#ff2aa3] p-3 text-black shadow-[5px_5px_0_#f9ff00]"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em]">
                {label}
              </p>
              <div className="mt-3 h-2 animate-pulse bg-black/35" />
              <div className="mt-2 h-2 w-2/3 animate-pulse bg-black/25" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
