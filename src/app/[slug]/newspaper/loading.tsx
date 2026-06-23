export default function NewspaperLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[#11100d] px-4 py-10">
      <style>{`
        @keyframes route-news-flip {
          0% { transform: perspective(760px) rotateY(0deg); opacity: 0.35; }
          20% { opacity: 1; }
          58% { transform: perspective(760px) rotateY(-176deg); opacity: 0.9; }
          100% { transform: perspective(760px) rotateY(-176deg); opacity: 0; }
        }
        @keyframes route-ink-pass {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(120%); }
        }
        .route-news-sheet {
          animation: route-news-flip 1.8s ease-in-out infinite;
          backface-visibility: hidden;
          transform-origin: left center;
        }
        .route-news-sheet:nth-child(2) { animation-delay: 0.34s; }
        .route-news-sheet:nth-child(3) { animation-delay: 0.68s; }
        .route-ink::after { animation: route-ink-pass 1.35s ease-in-out infinite; }
      `}</style>

      <div className="w-full max-w-3xl border border-[#1c1a14]/30 bg-[#f7f0df] p-5 text-[#17130d] shadow-[0_28px_90px_-55px_rgba(0,0,0,0.75)] sm:p-8">
        <div className="border-b-2 border-[#17130d] pb-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em]">
            Special Edition
          </p>
          <h1 className="mt-2 font-serif text-4xl font-black leading-none sm:text-5xl">
            The Profile Times
          </h1>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.22em] text-[#17130d]/55">
            Preparing the front page
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_250px]">
          <div>
            <div className="relative h-40 overflow-hidden border-y-2 border-[#17130d] bg-[#efe2c4] p-4">
              <div className="absolute inset-x-4 top-4 border-b border-[#17130d]/35 pb-2 text-center font-serif text-2xl font-black">
                The Profile Times
              </div>
              <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="space-y-1.5">
                    <div className="h-2 bg-[#17130d]/75" />
                    <div className="h-1.5 bg-[#17130d]/25" />
                    <div className="h-1.5 w-3/4 bg-[#17130d]/25" />
                  </div>
                ))}
              </div>
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="route-news-sheet absolute inset-y-0 left-0 w-[54%] border-r border-[#17130d]/25 bg-[#f7f0df] shadow-[12px_0_28px_rgba(23,19,13,0.18)]"
                >
                  <div className="h-full p-4">
                    <div className="h-3 w-24 bg-[#17130d]/75" />
                    <div className="mt-4 space-y-2">
                      <div className="h-2 bg-[#17130d]/28" />
                      <div className="h-2 w-10/12 bg-[#17130d]/22" />
                      <div className="h-2 w-8/12 bg-[#17130d]/22" />
                    </div>
                    <div className="mt-5 h-12 border border-[#17130d]/15 bg-[#17130d]/8" />
                  </div>
                </div>
              ))}
            </div>
            <div className="route-ink relative mt-5 h-10 w-11/12 overflow-hidden bg-[#17130d]/80 after:absolute after:inset-y-0 after:w-1/3 after:bg-[#f7f0df]/28" />
            <div className="route-ink relative mt-3 h-10 w-8/12 overflow-hidden bg-[#17130d]/70 after:absolute after:inset-y-0 after:w-1/3 after:bg-[#f7f0df]/25" />
          </div>

          <div className="border-l border-[#17130d]/20 pl-4">
            <div className="h-32 animate-pulse border border-[#17130d]/20 bg-[#17130d]/10" />
            <div className="mt-5 space-y-2">
              <div className="h-2 bg-[#17130d]/25" />
              <div className="h-2 w-10/12 bg-[#17130d]/25" />
              <div className="h-2 w-7/12 bg-[#17130d]/25" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
