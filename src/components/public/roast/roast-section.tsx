'use client';

interface RoastSectionProps {
  emoji: string;
  title: string;
  content: string | string[];
  accentColor: string;
}

export function RoastSection({
  emoji,
  title,
  content,
  accentColor,
}: RoastSectionProps) {
  return (
    <div className="border-2 border-white bg-[#210815] p-5 shadow-[6px_6px_0_rgba(249,255,0,0.9)] even:rotate-1 odd:-rotate-1">
      <div className="mb-3 flex items-center gap-2 border-b border-white/30 pb-3">
        <span className="flex h-8 w-8 items-center justify-center bg-white text-lg">
          {emoji}
        </span>
        <h3
          className="text-base font-black uppercase tracking-[0.08em]"
          style={{ color: '#f9ff00', textShadow: `2px 2px 0 ${accentColor}` }}
        >
          {title}
        </h3>
      </div>
      {Array.isArray(content) ? (
        <ul className="space-y-1.5">
          {content.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm leading-relaxed text-white/85"
            >
              <span
                className="mt-1.5 h-2 w-2 shrink-0"
                style={{ backgroundColor: '#00ffd5' }}
              />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed text-white/85">{content}</p>
      )}
    </div>
  );
}
