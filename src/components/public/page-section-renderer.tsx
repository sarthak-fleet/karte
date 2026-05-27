import { ContactFormSection } from '@/components/public/contact-form-section';
import { GlassCard } from '@/components/public/glass-card';

type Section = {
  id: string;
  type: string;
  title: string;
  content: string | null;
  buttonLabel: string | null;
  buttonUrl: string | null;
};

function parseBlogPosts(content: string | null) {
  return (content ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url, description, date] = line
        .split('|')
        .map((part) => part.trim());

      return { title, url, description, date };
    })
    .filter((post) => post.title);
}

export function PageSectionRenderer({
  slug,
  section,
  accentColor,
}: {
  slug: string;
  section: Section;
  accentColor: string;
}) {
  if (section.type === 'social') {
    const items = (section.content ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, url] = line.split('|').map((part) => part.trim());
        return { label, url };
      })
      .filter((item) => item.label && item.url);

    return (
      <GlassCard className="rounded-3xl p-6 sm:p-8">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.28em]"
          style={{ color: accentColor }}
        >
          Social
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-karte-text">
          {section.title}
        </h3>
        <div className="mt-6 flex flex-wrap gap-3">
          {items.map((item) => (
            <a
              key={`${item.label}-${item.url}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              data-track-type="social"
              data-track-id={item.url}
              data-track-label={item.label}
              className="rounded-full border border-karte-border-emphasis bg-white/5 px-4 py-2 text-sm font-medium text-karte-text transition hover:bg-white/10"
              style={{ borderColor: `${accentColor}33` }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </GlassCard>
    );
  }

  if (section.type === 'blog') {
    const posts = parseBlogPosts(section.content);

    return (
      <GlassCard className="overflow-hidden rounded-3xl p-0">
        <div className="border-b border-karte-border-strong bg-white/[0.04] p-6 sm:p-8">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.28em]"
            style={{ color: accentColor }}
          >
            Blog
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-karte-text">
            {section.title}
          </h3>
        </div>

        <div className="divide-y divide-white/10">
          {posts.map((post, index) => {
            const isLinked = post.url?.startsWith('http://') || post.url?.startsWith('https://');
            const className = 'group block p-6 transition hover:bg-white/[0.045] sm:p-8';
            const body = (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/35">
                      Post {String(index + 1).padStart(2, '0')}
                    </p>
                    <h4 className="mt-3 text-xl font-semibold leading-tight text-karte-text group-hover:text-white/90">
                      {post.title}
                    </h4>
                  </div>
                  {post.date && (
                    <p className="shrink-0 text-sm text-white/40">{post.date}</p>
                  )}
                </div>
                {post.description && (
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/62">
                    {post.description}
                  </p>
                )}
                {isLinked && (
                  <p className="mt-5 text-sm font-semibold" style={{ color: accentColor }}>
                    Read article -&gt;
                  </p>
                )}
              </>
            );

            return isLinked ? (
              <a
                key={`${post.title}-${post.url}`}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                data-track-type="blog"
                data-track-id={post.url}
                data-track-label={post.title}
                className={className}
              >
                {body}
              </a>
            ) : (
              <article key={`${post.title}-${index}`} className={className}>
                {body}
              </article>
            );
          })}
        </div>
      </GlassCard>
    );
  }

  if (section.type === 'contact') {
    return (
      <GlassCard className="rounded-3xl p-6 sm:p-8">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.28em]"
          style={{ color: accentColor }}
        >
          Contact
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-karte-text">
          {section.title}
        </h3>
        {section.content && (
          <p className="mt-3 text-sm leading-7 text-white/70">
            {section.content}
          </p>
        )}
        <div className="mt-6">
          <ContactFormSection
            slug={slug}
            accentColor={accentColor}
            sectionId={section.id}
          />
        </div>
      </GlassCard>
    );
  }

  if (section.type === 'testimonial') {
    return (
      <GlassCard className="rounded-3xl p-6 sm:p-8">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.28em]"
          style={{ color: accentColor }}
        >
          Testimonial
        </p>
        <p className="mt-4 text-lg leading-8 text-karte-text">
          &ldquo;{section.content}&rdquo;
        </p>
        <p className="mt-5 text-sm font-medium text-white/80">
          {section.title}
        </p>
      </GlassCard>
    );
  }

  if (section.type === 'cta') {
    return (
      <GlassCard className="rounded-3xl p-6 sm:p-8">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.28em]"
          style={{ color: accentColor }}
        >
          Spotlight
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-karte-text">
          {section.title}
        </h3>
        {section.content && (
          <p className="mt-3 text-sm leading-7 text-white/70">
            {section.content}
          </p>
        )}
        {section.buttonLabel && section.buttonUrl && (
          <a
            href={section.buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-track-type="section_cta"
            data-track-id={section.id}
            data-track-label={section.title}
            className="mt-6 inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-gray-950 transition hover:opacity-90"
            style={{ backgroundColor: accentColor }}
          >
            {section.buttonLabel}
          </a>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="rounded-3xl p-5 sm:p-6">
      <h3 className="text-xl font-semibold tracking-[-0.01em] text-karte-text sm:text-[22px]">
        {section.title}
      </h3>
      {section.content && (
        <p className="mt-2.5 text-[14px] leading-[1.65] text-karte-text-3">
          {section.content}
        </p>
      )}
    </GlassCard>
  );
}
