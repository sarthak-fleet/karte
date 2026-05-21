/**
 * Owner-facing analytics — the fixed 4-event taxonomy.
 *
 * Every project in the fleet emits exactly these four events — `signup`,
 * `activated`, `core_action`, `returned` — so a single PostHog project can
 * build one cross-fleet funnel (signup -> activated -> core_action) and a
 * D1/D7 retention insight, with no custom dashboard.
 *
 * Every event carries `project: "linkchat"`.
 *
 * NOTE: this is the OWNER-facing taxonomy. It is deliberately separate from
 * `src/lib/analytics.ts`, which is the visitor-facing event pipeline for
 * public profile pages (page views, outbound clicks, etc.). Do not merge
 * the two — they answer different questions for different audiences.
 *
 * linkchat runs on Cloudflare Workers with no `posthog-node`, so this module
 * is browser-only and routes through `posthog-js` (initialized by the
 * AnalyticsProvider in `posthog-provider.tsx`).
 */
import posthog from "posthog-js";

const PROJECT = "linkchat" as const;

/**
 * The product-specific action behind a `core_action` event.
 * linkchat's core verbs: publishing a profile, and generating one of the
 * shareable AI profile modes (encyclopedia / newspaper / roast).
 */
export type CoreAction = "page_published" | "mode_generated";

interface AnalyticsEventMap {
  /** First session after an account is created. */
  signup: { project: typeof PROJECT };
  /** The user reaches first real value — their first published profile. */
  activated: { project: typeof PROJECT };
  /** The thing the product exists to do. */
  core_action: { project: typeof PROJECT; action: CoreAction };
  /** A return session by a user with prior activity. */
  returned: { project: typeof PROJECT };
}

function emit<K extends keyof AnalyticsEventMap>(
  event: K,
  props: Omit<AnalyticsEventMap[K], "project">,
): void {
  try {
    if (typeof window === "undefined") return;
    posthog.capture(event, { project: PROJECT, ...props });
  } catch {
    // Analytics must never break a user flow. Swallow and move on.
  }
}

/** Fire once, on the first session after an account is created. */
export function trackSignup(): void {
  emit("signup", {});
}

/** Fire once, when the user first reaches real value (first publish). */
export function trackActivated(): void {
  emit("activated", {});
}

/** Fire on each completion of the core product action. */
export function trackCoreAction(action: CoreAction): void {
  emit("core_action", { action });
}

/** Fire on session start for a user who has prior activity. */
export function trackReturned(): void {
  emit("returned", {});
}
