# Failed approach — Cloudflare for SaaS custom hostnames on a bare Worker

Custom hostnames (e.g. `karte.sarthakagrawal.dev`) **verify** via Cloudflare
for SaaS but **do not serve traffic to the Worker** — they return HTTP 522
from the CF edge. This records why, so we don't re-attempt the standard
pattern.

## What we tried

The standard CF-for-SaaS pattern: enable Custom Hostnames on the `karte.cc`
zone, set the fallback origin to a proxied record on the zone, and let the
Worker route catch traffic for verified custom hostnames.

## Why it fails

When proxying a verified custom hostname through the fallback origin, CF for
SaaS makes an **actual TCP connection** to the resolved IP of the fallback
hostname — bypassing Worker route matching entirely. Worker routes only match
when CF receives a request *directly* for the worker's bound hostnames
(`karte.cc/*` etc.), not when CF internally forwards a SaaS request.

So with a bare Cloudflare Worker, the standard pattern can't serve tenant
hostnames.

## What works instead (architectures that would unblock this)

1. **Workers for Platforms** (paid, enterprise tier) — dispatch namespaces
   attach workers directly to custom hostnames; no fallback-origin TCP hop.
   The right long-term path for multi-tenant SaaS on CF.
2. **Non-CF origin** (Fly.io / Render / a VPS) — CF for SaaS proxies to that
   origin; the Worker only handles `karte.cc` traffic.
3. **Approximated.app** or similar third-party SaaS-domain proxies — they
   handle SSL + hostname routing and forward to your origin (e.g. the
   workers.dev URL).

## What we configured anyway

So the dashboard UI works end-to-end for add/verify (even though serving
doesn't yet):

- CF for SaaS enabled on `karte.cc` with Custom Hostnames on.
- `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` secrets set.
- Fallback origin `karte.cc` with a proxied A record on the apex pointing to
  `192.0.2.1` (RFC 5737 test IP — required as "a proxied DNS record exists",
  unreachable in practice).
- Worker route `karte.cc/*` catches direct traffic.
- `origin.karte.cc` registered as a Worker Custom Domain (separate from the
  fallback path).

Tenant-added hostnames: ✅ register, ✅ verify, ❌ serve (522) until migration.

## UI consequence

Until the architecture migration, the domain editor surfaces a clear
"Coming soon — verified hostnames don't yet serve traffic" banner and does
**not** claim the feature is fully working. The feature is gated behind
`CUSTOM_DOMAINS_LIVE = false` with a "Notify me" CTA emitting a
`custom_domain_interest` PostHog event.

## Source

Full detail in `docs/product/custom-domains.md` → "Known platform limitation".
