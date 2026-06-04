# Project Status

Last updated: 2026-06-04

## Current Scope

LinkChat is a link-in-bio platform with AI-enhanced public profile modes. The active product is a Cloudflare-hosted profile builder where users create a shareable page and visitors can browse links or interact through profile modes such as chat, encyclopedia, roast, and newspaper.

## Done

- Core routes exist for landing, login, profile creation, dashboard, public profile pages, auth, chat, contact, and tracking.
- Cloudflare Workers deployment is in place through OpenNext.
- Turso, D1-backed auth/session storage, R2, PostHog, Google auth, and free-ai gateway integration are documented.
- Generated profile content has a lifecycle and SSRF-safe scraping path.
- React Compiler is enabled, and the app uses the current Next.js/React stack documented in the README.
- Critical and high security audit findings have been fixed; remaining audit items are low-risk operational concerns.

## Planned Next

1. Make profile creation and editing resilient across guest, authenticated, and returning-user flows.
2. Add clearer creator-facing analytics around link clicks, chat interactions, and profile-mode usage.
3. Harden rate limiting beyond the current in-memory approach when traffic or abuse evidence justifies it.
4. Keep AI-generated content reviewable and traceable so profile owners understand what visitors see.

## Deferred / Parked

- Broad social-network features are deferred; LinkChat should stay centered on public profile conversion and interaction.
- Enterprise team management and advanced CRM-style workflows are parked.
- Stricter production rate limits should not be added without endpoint-specific evidence and explicit approval.
