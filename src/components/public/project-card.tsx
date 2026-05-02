export function ProjectCard({
  id,
  title,
  url,
  imageUrl,
  description,
  accentColor,
}: {
  id?: string;
  title: string;
  url: string;
  imageUrl?: string | null;
  description: string;
  accentColor?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-track-type="project"
      data-track-id={id ?? url}
      data-track-label={title}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#141414]/86 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#f2c879]/35 hover:bg-[#191813] hover:shadow-2xl hover:shadow-black/45"
      style={accentColor ? { borderColor: `${accentColor}33` } : undefined}
    >
      {imageUrl && (
        <div
          className="mb-5 h-44 w-full rounded-2xl bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>

        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition group-hover:text-white"
          style={accentColor ? { borderColor: `${accentColor}33` } : undefined}
          aria-label="Visit project"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          >
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
          </svg>
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-white/70">{description}</p>
    </a>
  );
}
