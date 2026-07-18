# Multi-Page Profile UI Design Recommendation

**Date:** 2026-03-28
**Context:** Expanding LinkChat from single-page profiles to 4-page profiles
**Pages:** Profile (main), Encyclopedia, Roast, Newspaper

---

## 1. Navigation Pattern: Floating Pill Bar

### Why Pill Nav (Not Tabs, Not Sidebar, Not Bottom Bar)

After analyzing the competitive landscape and your existing design system, the recommended pattern is a **floating horizontal pill navigation bar** positioned directly below the profile card header. Here is the reasoning:

**Against bottom tab bar:** Bottom tabs (iOS-style) feel like a native app convention. Your pages are public-facing, shareable URLs visited primarily from social media. Visitors are in a browser, not an app. Bottom bars also conflict with mobile browser chrome (Safari's address bar, gesture indicators). Furthermore, your ChatWidget already occupies the bottom-right corner.

**Against sidebar:** Sidebars consume horizontal space that your single-column glassmorphism layout cannot spare, especially on mobile. They also break the centered, card-based visual flow that defines LinkChat's aesthetic.

**Against traditional tabs:** Standard underlined tabs look dated and flat. They clash with the glassmorphism aesthetic that relies on depth, blur, and translucency.

**For floating pill bar:** Pill navigation integrates naturally into your existing visual language. Your `PublicTopBar` already uses `rounded-full` pill buttons (`Start Profile`, `Log In`, `Dashboard`). A glassmorphic pill bar is a direct extension of this pattern. It works identically on mobile and desktop. It photographs well for social media. It creates a clear "you are here" indicator while preserving the dark glass aesthetic.

### Competitive Analysis Supporting This Choice

- **Bento.me** (before shutdown) used card-based layouts with inline section navigation -- no separate nav was needed because content was grid-based. LinkChat has separate pages, so inline nav is insufficient.
- **read.cv** uses a minimal horizontal text nav at the top of profiles, but it is plain and lacks personality. The glassmorphic pill approach adds the visual richness LinkChat needs.
- **Linktree** remains single-page and uses no sub-navigation. Your expansion beyond Linktree's model is a differentiator, and the navigation itself becomes a feature.
- **Contra.com** uses horizontal tabs within profile sections. Their approach is functional but utilitarian.

### The Specific Pattern

A **horizontally scrollable pill bar** that:
- Lives immediately below the profile card (avatar + name + bio)
- Has a glassmorphic container matching the existing `GlassCard` treatment
- Uses pills with icons + short labels
- Has a glowing active indicator using the user's accent color
- Scrolls horizontally on mobile if needed (though 4 items should fit)
- Sticks to the top of the viewport on scroll (sticky behavior)

---

## 2. Detailed Navigation Design

### Desktop Layout (768px+)

```
+----------------------------------------------------------+
|  [PublicTopBar - existing header]                         |
+----------------------------------------------------------+
|                                                          |
|  +----------------------------------------------------+  |
|  |  [Avatar]                                          |  |
|  |  Display Name                                      |  |
|  |  Bio text here...                                  |  |
|  |                                                    |  |
|  |  +----------------------------------------------+  |  |
|  |  | [*Profile*] [Encyclopedia] [Roast] [News]    |  |  |
|  |  +----------------------------------------------+  |  |
|  +----------------------------------------------------+  |
|                                                          |
|  [Page content below...]                                 |
+----------------------------------------------------------+
```

The pill bar is INSIDE the profile card, at the bottom. This creates a single cohesive header unit. On scroll, just the pill bar portion becomes sticky.

### Mobile Layout (<768px)

Same layout, but pills use compact labels or icons only if space is constrained. At 4 items, full labels should fit on most phones (each pill needs roughly 80-90px, total ~360px, well within 375px+ screen widths with compact labels).

### Pill Specifications

Each pill:
- Height: 36px (mobile) / 40px (desktop)
- Padding: `px-4 py-2` (mobile) / `px-5 py-2.5` (desktop)
- Border radius: `rounded-full`
- Font: 13px semibold (mobile) / 14px semibold (desktop)
- Icon: 16px inline before label (optional emoji or SVG)

**Default state:**
- Background: transparent
- Text: `text-white/50`
- No border

**Hover state:**
- Background: `bg-white/8`
- Text: `text-white/70`
- Transition: 200ms ease

**Active state (current page):**
- Background: `bg-white/12`
- Border: `1px solid {accentColor}40`
- Text: `text-white`
- Box shadow: `0 0 20px {accentColor}20` (subtle glow)
- An animated pill-shaped indicator slides behind the active item

### Page Labels and Icons

| Route | Label | Short Label | Icon |
|-------|-------|-------------|------|
| `/{slug}` | Profile | Profile | User circle or link icon |
| `/{slug}/encyclopedia` | Encyclopedia | Wiki | Book/scroll icon |
| `/{slug}/roast` | Roast | Roast | Fire icon |
| `/{slug}/newspaper` | Newspaper | News | Newspaper icon |

Emoji alternatives that work without an icon library:
- Profile: no icon needed (or a subtle dot)
- Encyclopedia: book emoji or scroll
- Roast: fire emoji
- Newspaper: newspaper emoji

### Sticky Scroll Behavior

When the user scrolls past the profile card:
1. The pill bar detaches from the card and becomes `sticky top-0`
2. It gets its own glassmorphic background (`bg-black/40 backdrop-blur-2xl border-b border-white/10`)
3. The transition is smooth (no jarring snap)
4. The user's avatar (small, 28px) and name appear next to the pills in the sticky state

This mirrors patterns used by many modern profile sites where the header condenses on scroll.

---

## 3. Dark Glassmorphism Integration

### Existing Design Tokens (from your codebase)

Your `GlassCard` component defines the base treatment:
```
rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-xl
```

Your `PublicTopBar` uses a slightly different variation:
```
rounded-[28px] border bg-black/20 backdrop-blur-2xl shadow-[0_24px_80px_-48px_rgba(15,23,42,0.95)]
```

The pill bar should use a treatment between these two -- lighter than the top bar but more grounded than content cards.

### Pill Bar Glass Treatment

```css
/* Container */
.pill-bar-container {
  /* Tailwind equivalent: */
  /* rounded-full border border-white/10 bg-white/5 backdrop-blur-xl p-1 */
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding: 4px;
}

/* Active pill indicator */
.pill-active {
  /* Tailwind equivalent: */
  /* rounded-full bg-white/12 border border-{accent}/40 shadow-[0_0_20px_{accent}20] */
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid; /* accent color at 40% opacity */
  box-shadow: 0 0 20px; /* accent color at 20% opacity */
}
```

### Color Adaptation Per Theme

The pill bar must respect the user's chosen theme. Using your existing `resolveThemeConfig`, the accent color drives:
- Active pill border color
- Active pill glow color
- Hover state tint (very subtle accent wash)

Example with each preset:

**Aurora Glass** (`accentColor: #67e8f9`):
- Active pill: cyan-tinted glow, border `#67e8f940`
- Subtle gradient shimmer behind active pill

**Sunset Signal** (`accentColor: #fdba74`):
- Active pill: warm amber glow, border `#fdba7440`

**Electric Violet** (`accentColor: #c4b5fd`):
- Active pill: purple glow, border `#c4b5fd40`

**Forest Studio** (`accentColor: #bef264`):
- Active pill: lime glow, border `#bef26440`

### Background Gradient Blobs

The animated gradient blobs (already in your profile page) should persist across all 4 pages to maintain visual continuity. They live in a shared layout, not per-page. This is critical -- the background should NOT reset or flash when navigating between pages.

---

## 4. Enable/Disable Page Visibility

### Recommendation: Show Disabled, Do Not Hide

Based on UX research (Smashing Magazine's hidden vs. disabled analysis), the recommendation is:

**For the page owner (dashboard settings):**
- Each of the 4 pages has a toggle in dashboard settings
- Profile page is always enabled (cannot be disabled)
- Encyclopedia, Roast, and Newspaper can each be toggled independently
- When toggled off, the page is not generated and returns 404

**For public visitors viewing a profile:**

Option A (Recommended) -- **Only show enabled pages in the pill bar:**
The pill bar only renders pills for pages that the user has enabled. If only Profile and Roast are enabled, visitors see exactly 2 pills. No "Coming Soon" or disabled states.

Reasoning: Public visitors do not need to know what pages could exist. This keeps the interface clean and avoids confusion. The "discovery" of new pages happens when the user enables them and shares the link.

Option B (Alternative for launch/hype) -- **Show all 4 with "locked" treatment:**
All 4 pills always appear. Disabled pages show a subtle lock icon and muted styling. Clicking them shows a brief tooltip: "Coming soon" or a playful message. This creates curiosity and anticipation.

Recommendation: Start with Option A for simplicity. Consider Option B as a temporary launch feature to build curiosity, then revert to Option A.

### Dashboard Toggle UI

In the dashboard Appearance or a new "Pages" section:

```
+------------------------------------------+
| Page Visibility                          |
|                                          |
| Profile          [Always on]             |
| Encyclopedia     [Toggle: ON/OFF]        |
| Roast            [Toggle: ON/OFF]        |
| Newspaper        [Toggle: ON/OFF]        |
|                                          |
| Some pages require content before they   |
| can be enabled.                          |
+------------------------------------------+
```

### Data Model Addition

Add to the `pages` table (or a new `profilePages` table):

```typescript
// Option 1: Columns on pages table
encyclopediaEnabled: integer('encyclopediaEnabled', { mode: 'boolean' }).default(false),
roastEnabled: integer('roastEnabled', { mode: 'boolean' }).default(false),
newspaperEnabled: integer('newspaperEnabled', { mode: 'boolean' }).default(false),
```

This is simpler than a separate table for 3 boolean flags.

---

## 5. Shareable Pages with OG Images

### Route Structure

```
src/app/[slug]/
  layout.tsx              -- Shared layout (bg blobs, profile card, pill nav)
  page.tsx                -- Profile page (existing, refactored)
  encyclopedia/
    page.tsx              -- Encyclopedia page
    opengraph-image.tsx   -- Dynamic OG image
  roast/
    page.tsx              -- Roast page
    opengraph-image.tsx   -- Dynamic OG image
  newspaper/
    page.tsx              -- Newspaper page
    opengraph-image.tsx   -- Dynamic OG image
  opengraph-image.tsx     -- Profile OG image (existing, improved)
```

### Per-Page Metadata

Each page exports its own `generateMetadata`:

**Profile (`/username`):**
```typescript
title: "Sarthak Agrawal"
description: "Links, projects, and more"
og:image: avatar-based card with name and bio
```

**Encyclopedia (`/username/encyclopedia`):**
```typescript
title: "Sarthak Agrawal's Encyclopedia"
description: "Everything you need to know about Sarthak"
og:image: Wikipedia-styled card with user's name as article title
```

**Roast (`/username/roast`):**
```typescript
title: "Sarthak Agrawal Got Roasted"
description: "AI-generated roast -- handle with care"
og:image: Fire/flame themed card with user's name
```

**Newspaper (`/username/newspaper`):**
```typescript
title: "The Daily [Username] -- Breaking News"
description: "Today's top stories about Sarthak Agrawal"
og:image: Newspaper front page layout with user's name as headline
```

### OG Image Design (1200x630px)

Use Next.js `ImageResponse` (from `next/og`) to generate dynamic images at build/request time.

**Common layout for all OG images:**
- Dark background matching the user's gradient theme
- User's avatar in a circle (top-left or centered)
- Page-specific content/styling
- LinkChat branding (small, bottom-right)
- 1200x630px (standard OG size)

**Newspaper OG image concept:**
- Render as a newspaper front page with old-timey serif fonts
- User's name as the headline
- Dark background with cream/sepia card
- "BREAKING NEWS" banner

**Roast OG image concept:**
- Dark background with fire/ember gradient
- Bold text: "[Name] Got Roasted"
- Fire emoji or flame illustrations
- Warning tape / caution styling

**Encyclopedia OG image concept:**
- Styled like a Wikipedia article header
- Clean serif typography
- "[Name] -- From LinkChat, the free encyclopedia"
- Table of contents hint in the corner

### Social Sharing Best Practices

1. Each page URL must be independently shareable (already the case with your route structure)
2. Twitter/X card type should be `summary_large_image` for maximum visual impact
3. Include `og:url` pointing to the canonical page URL
4. Add `twitter:creator` if the user has linked their Twitter
5. Cache OG images aggressively -- use `export const revalidate = 3600` (1 hour)
6. Test with the Twitter Card Validator and Facebook Sharing Debugger before launch

---

## 6. Transition Animations

### Approach: CSS-First, No Heavy Libraries

Given the project does not currently use Framer Motion and adding a dependency should be justified, the recommendation is a **CSS-only transition system** that can be upgraded to Framer Motion later if needed.

### Why Not Framer Motion (Yet)

1. Adding `motion` (formerly `framer-motion`) adds ~30KB to the client bundle
2. Next.js App Router + AnimatePresence requires a `FrozenRouter` pattern that is fragile and has known issues with exit animations
3. For 4 pages with simple transitions, CSS is sufficient and zero-cost
4. You can always add it later for specific micro-interactions

### CSS Transition Implementation

Use Next.js App Router's `template.tsx` (not `layout.tsx`) to wrap page content with a fade + subtle slide animation.

**The key insight:** `layout.tsx` persists across navigations (does not remount), while `template.tsx` remounts on every navigation. By putting the shared layout (background, profile card, pill nav) in `layout.tsx` and the page content animation wrapper in `template.tsx`, you get smooth transitions where:
- Background blobs, profile card, and pill nav stay static
- Only the page content below the nav fades/slides

```typescript
// src/app/[slug]/template.tsx
export default function ProfileTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both">
      {children}
    </div>
  );
}
```

### Custom CSS Animation (Tailwind v4)

Add to `globals.css`:

```css
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-page-enter {
  animation: page-enter 300ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

The `cubic-bezier(0.16, 1, 0.3, 1)` is an "ease-out-expo" curve that feels snappy and modern -- quick start, gentle settle.

### Pill Bar Active Indicator Animation

The active pill indicator should animate smoothly when switching pages. This requires a client-side component that calculates the position and width of the active pill and animates a background `<div>` behind it.

```css
/* Sliding pill indicator */
.pill-indicator {
  position: absolute;
  height: 100%;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.12);
  transition: left 300ms cubic-bezier(0.16, 1, 0.3, 1),
              width 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

This creates the satisfying "sliding pill" effect seen in iOS segment controls and modern web apps.

### View Transitions API (Progressive Enhancement)

For browsers that support it (Chrome, Edge -- ~75% of traffic), you can layer the View Transitions API on top for free:

```typescript
// In your navigation component
function navigateTo(href: string) {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      router.push(href);
    });
  } else {
    router.push(href);
  }
}
```

Combined with CSS:

```css
::view-transition-old(page-content) {
  animation: fade-out 200ms ease-in;
}

::view-transition-new(page-content) {
  animation: fade-in 300ms ease-out;
}
```

This is a progressive enhancement -- works where supported, gracefully degrades elsewhere.

---

## 7. Component Architecture

### Shared Layout Component

```
src/app/[slug]/layout.tsx
```

This layout handles:
- Fetching the page data (once, shared across all 4 sub-pages)
- Rendering the background gradient blobs
- Rendering the PublicTopBar
- Rendering the profile card (avatar, name, bio)
- Rendering the pill navigation bar
- Providing a content slot for the active page

### New Components Needed

```
src/components/public/
  profile-nav.tsx          -- The pill navigation bar (client component)
  profile-header.tsx       -- Avatar + name + bio card (server component)
  page-transition.tsx      -- Animation wrapper (client component, optional)
```

### Profile Nav Component (Client)

```typescript
// Key props
type ProfileNavProps = {
  slug: string;
  accentColor: string;
  enabledPages: {
    profile: true; // always
    encyclopedia: boolean;
    roast: boolean;
    newspaper: boolean;
  };
};
```

This is a `'use client'` component because it needs:
- `usePathname()` to determine the active page
- `useRef` for pill position measurement (sliding indicator)
- Click handlers for navigation

### Pill Bar Tailwind Implementation

```tsx
// Container
<nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
  {/* Sliding indicator (absolute positioned) */}
  <div
    className="absolute rounded-full bg-white/12 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
    style={{
      left: indicatorLeft,
      width: indicatorWidth,
      height: '100%',
      border: `1px solid ${accentColor}40`,
      boxShadow: `0 0 20px ${accentColor}20`,
    }}
  />

  {/* Pills */}
  {enabledPages.map((page) => (
    <Link
      key={page.href}
      href={page.href}
      className={cn(
        "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200",
        isActive ? "text-white" : "text-white/50 hover:text-white/70"
      )}
    >
      {page.label}
    </Link>
  ))}
</nav>
```

---

## 8. Responsive Behavior Summary

### Mobile (< 640px)
- Pill bar uses compact labels (Profile, Wiki, Roast, News)
- Pill bar is full-width with `justify-between` or `justify-center`
- Profile card padding reduces to `p-6`
- Content takes full width with 16px horizontal padding
- Sticky nav has smaller height (44px vs 52px)

### Tablet (640px - 1024px)
- Pill bar uses full labels
- Content max-width: 640px, centered
- Profile card uses standard padding

### Desktop (1024px+)
- Pill bar uses full labels with optional icons
- Content max-width: 896px (your existing `max-w-4xl`)
- More generous spacing throughout

---

## 9. Implementation Priority

### Phase 1 (Day 1-2): Foundation
1. Refactor `[slug]/page.tsx` into `[slug]/layout.tsx` + `[slug]/page.tsx`
2. Extract profile header into shared component
3. Build `ProfileNav` client component with pill bar
4. Add page visibility columns to schema
5. Add CSS page-enter animation

### Phase 2 (Day 3-4): Content Pages
6. Build Encyclopedia page (`[slug]/encyclopedia/page.tsx`)
7. Build Roast page (`[slug]/roast/page.tsx`)
8. Build Newspaper page (`[slug]/newspaper/page.tsx`)
9. Add dashboard toggles for page visibility

### Phase 3 (Day 5-6): Polish
10. Dynamic OG images for each page
11. Sliding pill indicator animation
12. Sticky scroll behavior for nav
13. View Transitions API (progressive enhancement)
14. Social sharing tests

---

## 10. Key Design Decisions Summary

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Nav type | Floating pill bar | Matches existing glassmorphism aesthetic |
| Nav position | Inside profile card, sticky on scroll | Keeps hierarchy clear, always accessible |
| Disabled pages | Hidden from pill bar | Clean UX, no confusion for visitors |
| Transitions | CSS-only (no Framer Motion) | Zero bundle cost, sufficient for 4-page nav |
| OG images | `opengraph-image.tsx` per route | Next.js native, automatic meta tag injection |
| Active indicator | Sliding pill with accent glow | Satisfying, on-brand, performant |
| Layout strategy | Shared `layout.tsx` for bg + header + nav | Prevents flashing on page change |

---

## 11. Accessibility Checklist

- [ ] Pill bar uses `<nav>` with `aria-label="Profile sections"`
- [ ] Active pill has `aria-current="page"`
- [ ] Disabled/hidden pages are truly removed from DOM (not just visually hidden)
- [ ] Focus ring visible on keyboard navigation (use `focus-visible:ring-2 focus-visible:ring-{accent}`)
- [ ] Color contrast meets WCAG AA for all pill states against glass background
- [ ] Pill bar is keyboard navigable (arrow keys within nav group)
- [ ] Skip navigation link available
- [ ] Reduced motion: disable sliding indicator animation, use instant state change

```css
@media (prefers-reduced-motion: reduce) {
  .pill-indicator {
    transition: none;
  }
  .animate-page-enter {
    animation: none;
  }
}
```
