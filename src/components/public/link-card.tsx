'use client';

export function LinkCard({
  id,
  title,
  url,
  icon,
  accentColor,
}: {
  id?: string;
  title: string;
  url: string;
  icon?: string | null;
  accentColor?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-track-type="link"
      data-track-id={id ?? url}
      data-track-label={title}
      className="group flex min-h-16 w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.055] px-6 py-4 text-center backdrop-blur-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-[#f2c879]/35 hover:bg-[#f2c879]/[0.10] hover:shadow-lg hover:shadow-[#f2c879]/10"
      style={accentColor ? { borderColor: `${accentColor}33` } : undefined}
    >
      <span className="text-base font-semibold text-white group-hover:text-white/90">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </span>
    </a>
  );
}
