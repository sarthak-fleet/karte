# Runbooks

Quick-reference operational procedures. Each links to the deeper doc for
context. Keep steps copy-pasteable.

## Deploy

1. Confirm `main` is green (CI).
2. Run the **Deploy to Cloudflare Workers** workflow (Actions UI,
   `workflow_dispatch`) — or `pnpm deploy:cf` locally with `CLOUDFLARE_API_TOKEN`.
3. Verify `https://karte.cc/` → 200.
4. For feature-specific checks see `docs/operations/deploy.md` "After deploy".

## Rollback

Cloudflare Workers keeps recent versions. In the dashboard → Workers & Pages
→ `linkchat` → Deployments, roll back to the previous version. Or redeploy an
older commit with `pnpm deploy:cf` from that ref.

## Debug a custom domain stuck "verifying" or returning 522

See `docs/product/custom-domains.md` → "Debugging" and "Known platform
limitation". Short version:

```bash
dig +short TXT _acme-challenge.<hostname>
dig +short CNAME _acme-challenge.<hostname>
dig +short <hostname>
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/custom_hostnames?hostname=<hostname>" | jq .
```

If it verifies but returns 522, that's the known CF-for-SaaS limitation —
verified hostnames don't serve traffic to a bare Worker. Migration options
are in the doc.

## Debug inbound email not arriving

See `docs/product/email-inbox.md` → "Verifying it works". Check in order:
Email Routing catch-all logs → `karte-email` worker logs → main app
`/api/email/inbound` logs → confirm `EMAIL_INBOUND_SECRET` matches on both
workers.

## Triage slow TTFB

See `docs/knowledge/audits/perf-audit.md`. Public profile ~1.3s TTFB is a
known remaining bottleneck (Turso RTT + heavy SSR). Quick wins documented
there: lazy-load chat-widget, add `<Suspense>` to analytics + profile.

## Run the docs validator

```bash
pnpm docs:check
```

Checks internal markdown links resolve, required frontmatter is present, and
no placeholder-only files. Runs in CI via `docs.yml`.
