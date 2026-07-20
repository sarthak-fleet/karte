// Hardcoded set of demo profile slugs. These are seeded sample
// profiles built from public information about well-known
// builders/thinkers and clearly marked as samples on the page.
//
// Owned by the system demo@karte.cc user. Do not add real-user
// slugs here.
const DEMO_SLUGS: ReadonlySet<string> = new Set([
  'naval',
  'levelsio',
  'pg',
  'karpathy',
]);

const DEMO_SLUG_ALIASES: Readonly<Record<string, string>> = {
  demo: 'naval',
};

export function isDemoSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return DEMO_SLUGS.has(slug);
}

export function resolvePublicProfileSlug(slug: string): string {
  return DEMO_SLUG_ALIASES[slug] ?? slug;
}
