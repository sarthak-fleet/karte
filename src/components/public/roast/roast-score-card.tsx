'use client';

interface RoastScoreCardProps {
  vibeScore: number;
  accentColor: string;
}

function getVerdict(score: number): string {
  if (score <= 20) return 'Yikes';
  if (score <= 40) return 'Needs work';
  if (score <= 60) return 'Mid';
  if (score <= 80) return 'Solid';
  return 'Elite';
}

export function RoastScoreCard({
  vibeScore,
  accentColor,
}: RoastScoreCardProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (vibeScore / 100) * circumference;

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-sm -rotate-1 flex-col items-center gap-3 border-4 border-[#f9ff00] bg-[#1b0612] p-6 shadow-[10px_10px_0_#00ffd5]">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#f9ff00]">
          Public Vibe Inspection
        </p>
        <div className="relative h-[132px] w-[132px]">
          <svg
            width="132"
            height="132"
            viewBox="0 0 120 120"
            className="-rotate-90"
          >
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="rgba(249,255,0,0.18)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={accentColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-4xl font-black"
              style={{
                color: '#f9ff00',
                textShadow: `3px 3px 0 ${accentColor}`,
              }}
            >
              {vibeScore}
            </span>
          </div>
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-karte-text">
          Vibe Score
        </p>
        <p className="border-2 border-white bg-white px-3 py-1 text-lg font-black uppercase text-black">
          {getVerdict(vibeScore)}
        </p>
      </div>
    </div>
  );
}
