'use client';

import { useSearchParams } from 'next/navigation';

import { OpenChatButton } from '@/components/public/open-chat-button';
import { ProfileAvatar } from '@/components/public/profile-avatar';
import { SocialIconRow } from '@/components/public/social-icon-row';
import { getProfileVariant } from '@/lib/profile-variants';

interface QuickAction {
  label: string;
  url: string;
  icon: string;
}

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
  if (h.includes('cal.com')) return 'Book a call';
  if (h.includes('savvycal')) return 'Book on SavvyCal';
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

/**
 * The big, sticky-on-desktop hero column. Avatar with accent glow,
 * manifesto-scale name with serif italic accent on the last name,
 * embedded chat dock, primary CTA, and the quick-action stack.
 *
 * On lg+ this stays in view while content scrolls past on the right.
 * On smaller breakpoints it stacks normally.
 */
export function ProfileHero({
  displayName,
  bio,
  avatarUrl,
  location,
  accentColor,
  serifFontVar,
  chatEnabled,
  hasMessenger,
  primaryChatCta,
  calendarUrl,
  newsletterUrl,
  tipUrl,
  socialLinks,
}: {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  accentColor: string;
  serifFontVar: string;
  chatEnabled: boolean;
  hasMessenger: boolean;
  primaryChatCta: string;
  calendarUrl: string | null;
  newsletterUrl: string | null;
  tipUrl: string | null;
  socialLinks: ReadonlyArray<{
    id: string;
    title: string;
    url: string;
    icon: string | null;
  }>;
}) {
  const searchParams = useSearchParams();
  const selectedVariant = getProfileVariant(searchParams.get('variant'));
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const restOfName = displayName.slice(firstName.length).trim();
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || firstName[0]?.toUpperCase() || 'K';

  const quickActions: QuickAction[] = [];
  if (calendarUrl) quickActions.push({ label: calendarLabel(calendarUrl), url: calendarUrl, icon: '📅' });
  if (newsletterUrl) quickActions.push({ label: 'Subscribe to newsletter', url: newsletterUrl, icon: '✉︎' });
  if (tipUrl) quickActions.push({ label: tipLabel(tipUrl), url: tipUrl, icon: '☕' });

  return (
    <aside
      className="relative lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-center lg:py-12 lg:pr-8"
      style={
        {
          // One-shot fade-in on load. Pure CSS, no JS.
          animation: 'karte-hero-in 800ms cubic-bezier(0.16, 1, 0.3, 1) both',
        } as React.CSSProperties
      }
    >
      <style>{`
        @keyframes karte-hero-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes karte-avatar-glow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.04); }
        }
      `}</style>

      {/* Avatar with accent glow */}
      <div className="relative flex items-start gap-4">
        <div className="relative shrink-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-3 rounded-full blur-2xl"
            style={{
              backgroundColor: `${accentColor}55`,
              animation: 'karte-avatar-glow 4s ease-in-out infinite',
            }}
          />
          <ProfileAvatar
            src={avatarUrl}
            alt={displayName}
            initials={initials}
            accentColor={accentColor}
          />
        </div>

        {location && (
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-karte-text-3">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            {location}
          </div>
        )}
      </div>

      {/* Name — manifesto scale */}
      <h1 className="mt-7 text-[44px] font-semibold leading-[0.95] tracking-[-0.035em] text-karte-text sm:text-[56px] lg:text-[64px]">
        {firstName}
        {restOfName && (
          <>
            <br />
            <span
              className="font-normal italic"
              style={{ fontFamily: serifFontVar, color: accentColor }}
            >
              {restOfName}
            </span>
          </>
        )}
      </h1>

      {/* Bio */}
      {bio && (
        <p className="mt-5 max-w-md text-[15px] leading-[1.65] tracking-[-0.005em] text-karte-text-3 sm:text-[16px]">
          {bio}
        </p>
      )}

      {/* Social icon row — compact, identity-level not content-level */}
      <SocialIconRow links={socialLinks} accentColor={accentColor} />

      {/* Primary CTAs — stacked, not pills */}
      <div className="mt-7 flex flex-col gap-2">
        {hasMessenger && (
          <OpenChatButton
            mode={chatEnabled ? 'chat' : 'contact'}
            className="group inline-flex items-center justify-between rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-zinc-950 transition-all duration-200 ease-[var(--karte-ease)] hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true">💬</span>
              {selectedVariant.id === 'baseline'
                ? primaryChatCta
                : selectedVariant.primaryCta}
            </span>
            <span
              aria-hidden="true"
              className="transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5"
            >
              →
            </span>
          </OpenChatButton>
        )}

        {quickActions.map((action) => (
          <a
            key={action.url}
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            data-track-type="quick-action"
            data-track-id={action.url}
            data-track-label={action.label}
            className="group inline-flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] px-5 py-3 text-[14px] font-medium text-karte-text transition-all duration-200 ease-[var(--karte-ease)] hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.05]"
            style={{ borderColor: `${accentColor}1f` }}
          >
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-[15px]">
                {action.icon}
              </span>
              {action.label}
            </span>
            <span
              aria-hidden="true"
              className="text-karte-text-4 transition-transform duration-200 ease-[var(--karte-ease)] group-hover:translate-x-0.5"
            >
              ↗
            </span>
          </a>
        ))}
      </div>
    </aside>
  );
}
