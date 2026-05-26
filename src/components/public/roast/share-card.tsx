'use client';

import { forwardRef } from 'react';

interface ShareCardProps {
  displayName: string;
  slug: string;
  vibeScore: number;
  personalityType: string;
  roastSummary: string;
  accentColor: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function ShareCard({ displayName, slug, vibeScore, personalityType, roastSummary, accentColor }, ref) {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (vibeScore / 100) * circumference;

    // Take first 2 sentences of the roast
    const sentences = roastSummary.match(/[^.!?]+[.!?]+/g) || [roastSummary];
    const summary = sentences.slice(0, 2).join(' ').trim();

    return (
      <div
        ref={ref}
        className="w-full max-w-2xl aspect-[1200/630] bg-gray-950 rounded-2xl overflow-hidden relative flex flex-col justify-between p-8"
        style={{
          background: `linear-gradient(135deg, ${accentColor}15, #030712 40%, #030712 60%, ${accentColor}10)`,
        }}
      >
        {/* Decorative accent border */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            border: `1px solid ${accentColor}30`,
          }}
        />

        {/* Top section */}
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">
                The Roast of
              </p>
              <h2
                className="text-3xl font-bold tracking-tight"
                style={{ color: accentColor }}
              >
                {displayName}
              </h2>
            </div>

            {/* Mini vibe score */}
            <div className="flex flex-col items-center gap-1">
              <div className="relative w-[70px] h-[70px]">
                <svg
                  width="70"
                  height="70"
                  viewBox="0 0 70 70"
                  className="-rotate-90"
                >
                  <circle
                    cx="35"
                    cy="35"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="35"
                    cy="35"
                    r={radius}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-lg font-bold"
                    style={{ color: accentColor }}
                  >
                    {vibeScore}
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-gray-500">
                Vibe
              </span>
            </div>
          </div>

          {/* Personality badge */}
          <div
            className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              border: `1px solid ${accentColor}40`,
            }}
          >
            {personalityType}
          </div>
        </div>

        {/* Roast summary */}
        <div className="relative z-10 flex-1 flex items-center py-4">
          <p className="text-sm text-gray-400 leading-relaxed italic line-clamp-3">
            &ldquo;{summary}&rdquo;
          </p>
        </div>

        {/* Watermark */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            karte.cc/{slug}
          </span>
          <span className="text-xs text-gray-600">
            Karte Roast
          </span>
        </div>
      </div>
    );
  }
);
