'use client';

export function LinkCard({ title, url, icon }: { title: string; url: string; icon?: string | null }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full rounded-xl border border-white/15 bg-white/10 px-6 py-4 text-center backdrop-blur-lg transition-all duration-300 hover:border-white/30 hover:bg-white/20 hover:shadow-lg hover:shadow-white/5 hover:scale-[1.02]"
    >
      <span className="text-sm font-medium text-white group-hover:text-white/90">
        {icon && <span className="mr-2">{icon}</span>}
        {title}
      </span>
    </a>
  );
}
