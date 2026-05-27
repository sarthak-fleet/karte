// Compact row of high-intent CTAs surfaced when the owner has set the
// matching `pages.*Url` field. Each renders as a pill with a label that
// auto-derives from the URL host so visitors recognize the destination
// (Cal.com / Calendly / Ko-fi / etc.) without us hard-coding integrations.

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function calendarLabel(url: string) {
  const h = hostnameOf(url);
  if (h.includes('calendly')) return 'Book on Calendly';
  if (h.includes('cal.com')) return 'Book on Cal.com';
  if (h.includes('savvycal')) return 'Book on SavvyCal';
  if (h.includes('google')) return 'Book a slot';
  return 'Book time';
}

function tipLabel(url: string) {
  const h = hostnameOf(url);
  if (h.includes('ko-fi')) return 'Tip on Ko-fi';
  if (h.includes('buymeacoffee')) return 'Buy me a coffee';
  if (h.includes('stripe')) return 'Send a tip';
  if (h.includes('patreon')) return 'Support on Patreon';
  return 'Send a tip';
}

interface QuickActionsProps {
  calendarUrl?: string | null;
  newsletterUrl?: string | null;
  tipUrl?: string | null;
  accentColor: string;
}

export function QuickActions({
  calendarUrl,
  newsletterUrl,
  tipUrl,
  accentColor,
}: QuickActionsProps) {
  const items: Array<{ label: string; url: string; icon: string }> = [];

  if (calendarUrl) {
    items.push({ label: calendarLabel(calendarUrl), url: calendarUrl, icon: '📅' });
  }
  if (newsletterUrl) {
    items.push({ label: 'Subscribe', url: newsletterUrl, icon: '✉︎' });
  }
  if (tipUrl) {
    items.push({ label: tipLabel(tipUrl), url: tipUrl, icon: '☕' });
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-6 flex flex-wrap gap-2 sm:mt-8">
      {items.map((item) => (
        <a
          key={item.url}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          data-track-type="quick-action"
          data-track-id={item.url}
          data-track-label={item.label}
          className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-2 text-[13px] font-medium text-karte-text transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
          style={{ borderColor: `${accentColor}28` }}
        >
          <span aria-hidden="true" className="text-[14px]">
            {item.icon}
          </span>
          {item.label}
          <span
            aria-hidden="true"
            className="text-karte-text-4 transition-transform duration-200 group-hover:translate-x-0.5"
          >
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}
