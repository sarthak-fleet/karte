# Custom Domains

Karte lets each user attach their own hostname (e.g. `links.example.com` or
`mike.com`) to their profile. This doc explains the full flow end-to-end, the
infrastructure it relies on, and how to debug it.

---

## TL;DR

A user adds a hostname in the dashboard → Karte calls the Cloudflare for SaaS
API to register it on the `karte.cc` zone → the user adds DNS records at their
own DNS provider → Cloudflare validates ownership + issues an SSL cert →
requests to the hostname hit our Worker, the middleware reads `Host`, looks up
`pageDomains`, and rewrites to the matching `/<slug>` route.

```
[user types mike.com]
    ↓
[mike.com DNS → CNAME karte.cc → Cloudflare anycast IP]
    ↓
[Cloudflare: mike.com is a verified Custom Hostname on karte.cc zone]
[Cloudflare: SSL cert is active → terminate TLS, forward to fallback origin]
    ↓
[Cloudflare Worker receives request with Host: mike.com]
    ↓
[middleware.ts: isAppHost(mike.com)? no → resolveSlugForHost(mike.com)]
[pageDomains row: hostname='mike.com', status='verified' → slug='mike']
    ↓
[NextResponse.rewrite("/mike") → renders Mike's profile]
```

---

## Architecture

### Code

| Layer | File | Role |
|---|---|---|
| Middleware | `src/middleware.ts` | Reads `Host` header on every request. If it's a known custom hostname, rewrites to `/<slug>`. |
| Hostname helpers | `src/lib/hostname.ts` | `isAppHost()` (allowlist of Karte's own domains), `normalizeHostname()`, DNS-instruction builder. |
| Lookup | `src/lib/page-domains.ts` | `resolveSlugForHost()` queries the `pageDomains` table (60s in-memory cache). |
| CF integration | `src/lib/cloudflare-domains.ts` | Wraps the Cloudflare Custom Hostnames API: add / list / verify / remove. |
| Schema | `src/db/schema.ts` | `pageDomains` table (hostname, status, verification[], primary flag, lastCheckedAt). |
| API routes | `src/app/api/pages/[pageId]/domains/*` | POST add, GET list, POST `/verify`, POST `/primary`, DELETE. |
| Dashboard UI | `src/components/dashboard/domain-editor.tsx` | Add-domain form, status badges, DNS records with copy-to-clipboard, retry verification. |

### Infrastructure

| Layer | Where it lives | What it does |
|---|---|---|
| DNS zone | Cloudflare, `karte.cc` | Brand domain. Worker is routed via `karte.cc/*` + `*.karte.cc/*` patterns in `wrangler.jsonc`. |
| Cloudflare for SaaS | Enabled on `karte.cc` zone (SSL/TLS → Custom Hostnames) | Lets the zone accept arbitrary external hostnames CNAMEd at it, provisions per-hostname SSL certs. |
| Fallback origin | `karte.cc` (or whichever worker-served hostname you set) | Where CF internally routes traffic for verified custom hostnames. |
| Worker secrets | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID` | Token must have `Zone:SSL and Certificates:Edit` + `Zone:Zone:Read` on `karte.cc`. |

### Required `wrangler.jsonc` config

```jsonc
{
  "name": "linkchat",
  "workers_dev": true,
  "routes": [
    { "pattern": "karte.cc/*", "zone_name": "karte.cc" },
    { "pattern": "*.karte.cc/*", "zone_name": "karte.cc" }
  ],
  "vars": {
    "BETTER_AUTH_URL": "https://karte.cc",
    "NEXT_PUBLIC_APP_URL": "https://karte.cc"
  }
}
```

Secrets (set via `pnpm exec wrangler secret put …`, not committed):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`

---

## User flow

1. **Add hostname** — User enters `links.example.com` in `/dashboard/domains` →
   `POST /api/pages/<pageId>/domains` → server calls `addDomain()` → CF API
   creates a Custom Hostname registration → row stored in `pageDomains` with
   `status='verifying'`.

2. **DNS setup** — UI shows two required steps:
   - **Step 1: Point the hostname.** A `CNAME` from `links.example.com` → `karte.cc`.
   - **Step 2: Prove ownership for SSL.** The user picks ONE of three options
     (see below).

3. **Retry verify** — User clicks "Retry verify" → `POST .../<id>/verify` →
   server re-queries the CF API → `pageDomains.status` updates → UI flashes a
   toast (verified ✓ / still pending / error).

4. **Cert issuance** — Once any one validation record is in DNS and CF can poll
   it, CF issues a Let's Encrypt cert (~30s). `status` flips to `verified`.

5. **Serving** — Requests to `links.example.com` now hit the Worker. Middleware
   resolves it to a slug and rewrites internally.

---

## The three SSL validation options

Any **one** of these is sufficient. The UI shows all three so users can pick
the right one for their setup.

### A. CNAME delegation (recommended)

```text
type   CNAME
name   _acme-challenge.<hostname>
value  <hostname>.<random>.dcv.cloudflare.com
```

Set once. Cloudflare auto-renews the SSL cert from now on — the user never
touches DNS for SSL again. Best long-term option.

Returned by CF API as `ssl.dcv_delegation_records[]`.

### B. Pre-validation TXT (instant if user's DNS is on Cloudflare)

```text
type   TXT
name   _cf-custom-hostname.<hostname>
value  <custom-hostname-resource-uuid>
```

Validates immediately (no waiting for ACME polling) **only** when the user's
hostname is on a Cloudflare-hosted zone in the same account. Otherwise this
record exists but does nothing — fall back to A or C.

Derived client-side from `hostname.id` in the CF API response.

### C. ACME TXT (universal fallback)

```text
type   TXT
name   _acme-challenge.<hostname>
value  <random-43-char-base64>
```

Works with any DNS provider. Slowest path: DNS propagation + CF polling +
Let's Encrypt issuance. The user has to re-add a fresh value whenever the cert
renews (~60 days) unless they switch to option A.

Returned by CF API as `ssl.validation_records[].txt_*`.

---

## Debugging

### "verifying" status that won't flip

The TXT/CNAME isn't visible to Cloudflare. Check in this order:

```bash
# 1. Is the record actually in DNS?
dig +short TXT _acme-challenge.<hostname>
dig +short CNAME _acme-challenge.<hostname>

# 2. Does the hostname resolve to a Cloudflare IP?
dig +short <hostname>

# 3. What does Cloudflare itself see?
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/custom_hostnames?hostname=<hostname>" \
  | jq .
```

Look in the CF response for:
- `ssl.status` — should be `active` when issued, `pending_validation` while waiting.
- `ssl.validation_records[].status` — `pending` until CF observes the record in DNS.
- `verification_errors[]` and `ssl.validation_errors[]` — error messages if validation has failed.

### Duplicate registrations

If the user (or someone with CF access) added the hostname via the Cloudflare
dashboard separately from our app, there can be two registrations with
different resource UUIDs. Each has its own validation flow. Validating one
won't help the other.

**Fix:** delete the duplicate via CF dashboard → SSL/TLS → Custom Hostnames →
find the row whose ID doesn't match ours → Delete. Or delete ours via
`DELETE /api/pages/<pageId>/domains/<domainId>` and let the user re-add.

To find the IDs:

```bash
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/custom_hostnames?hostname=<hostname>" \
  | jq '.result[] | { id, hostname, status, ssl_status: .ssl.status }'
```

### Quoting in TXT values

DNS dashboards typically display TXT values wrapped in quotes (`"abc123"`).
When entering them, don't paste the quotes — the provider auto-adds them. The
underlying value should be the raw string.

### Proxied vs DNS-only

For the **hostname CNAME** (Step 1): proxy status doesn't matter for routing
since traffic is already going through Cloudflare's edge.

For the **validation records**:
- **TXT records: DNS-only.** Proxied TXT is meaningless (CF can't proxy TXT).
- **CNAME delegation: Proxied is fine** (CF handles it internally).

Most DNS dashboards default these correctly.

---

## Cost

Cloudflare for SaaS includes **100 custom hostnames free** across Free/Pro/
Business plans. Above 100, $0.10 per hostname per month. Enterprise is custom.

That covers the per-hostname cost. The brand zone (`karte.cc`) plan tier
doesn't matter for the SaaS feature — Free works fine.

Source: <https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/plans/>

---

## ⚠ Known platform limitation: tenant hostnames won't actually serve

Custom hostnames (e.g. `karte.sarthakagrawal.dev`) currently **verify** via
Cloudflare for SaaS but **do not serve traffic to the Worker**. They return
HTTP 522 from the CF edge.

### Why

Cloudflare for SaaS, when proxying a verified custom hostname through the
fallback origin, makes an **actual TCP connection** to the resolved IP of the
fallback hostname — bypassing Worker route matching entirely. Worker routes
only match when CF receives a request *directly* for the worker's bound
hostnames (`karte.cc/*` etc.), not when CF internally forwards a SaaS request.

This means the standard CF-for-SaaS pattern — "set the fallback origin to a
proxied record on your zone, let your worker route catch it" — doesn't work
with bare Cloudflare Workers.

### Supported architectures

1. **Workers for Platforms** (paid, enterprise tier). Different product from
   regular Workers. Uses dispatch namespaces to attach workers directly to
   custom hostnames — no fallback-origin TCP hop. The right long-term path
   for a multi-tenant SaaS on the CF platform.
2. **Non-CF origin** (a real HTTP server elsewhere, e.g. Fly.io / Render / a
   VPS). CF for SaaS proxies to that origin. Worker would only handle
   `karte.cc` traffic, not custom hostnames.
3. **Approximated.app** or similar third-party SaaS-domain proxies. They
   handle SSL + hostname routing as a managed service and forward to your
   origin (which can be the workers.dev URL).

### What we've configured anyway

So that the dashboard UI works end-to-end for adding/verifying (even though
the final serving doesn't yet):

- CF for SaaS enabled on `karte.cc` zone with Custom Hostnames feature on
- `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ZONE_ID` secrets set
- Fallback origin: `karte.cc`, with a proxied A record on the apex pointing
  to `192.0.2.1` (RFC 5737 test IP) — required by CF as "a proxied DNS
  record exists", but unreachable in practice
- Worker route `karte.cc/*` catches direct traffic — landing, dashboard,
  `/<slug>` profiles all work
- `origin.karte.cc` registered as a Worker Custom Domain (separate from the
  fallback path)

Tenant-added hostnames:
- ✅ Register on CF (TXT validation works)
- ✅ Show as `verified` once SSL is issued
- ❌ Return 522 when visited (until we migrate to one of the architectures
  above)

### What to do in the UI

Until the architecture migration: surface a clear "Coming soon — verified
hostnames don't yet serve traffic" banner in the domain editor. Don't claim
the feature is fully working.

## Future improvements

- **Migrate to Workers for Platforms** (or pick architecture option 2 / 3
  above). This is the unblocker for actually serving tenant custom hostnames.
- **Auto-poll while verifying.** The dashboard currently requires a manual
  "Retry verify" click. Polling every 30s would flip the status without user
  action.
- **Pre-flight DNS check.** A "Check DNS now" button that runs `dig`
  server-side and shows what's actually propagating vs not, before the user
  touches CF.
- **Bulk-import.** API endpoint that accepts a CSV of hostname→slug pairs for
  large-customer migrations.
- **Duplicate-registration detection.** Surface a warning in the UI when CF
  returns multiple Custom Hostnames matching the same hostname (e.g. when
  someone also added it via the CF dashboard).
