# Analytics Migration Plan: Durable Aggregates

## Overview
To provide stable historical analytics without keeping infinite raw event data, LinkChat now uses daily aggregate tables. These tables are updated in real-time as events occur and support high-performance dashboard reporting.

## Schema Changes
The following tables have been added:
- `dailyStats`: Daily counts for `page_view`, `hook_open`, and `dm_conversion`.
- `dailyResourceStats`: Daily counts for resource-specific events like `outbound_click`, `section_view`, and `chat_cta_click`.
- `dailyVisitorEvents`: A helper table to track unique visitors per day per event type to ensure duplicate-tolerant aggregation.

## Real-time Tracking
The `/api/track` and `/api/contact` routes now call `recordAggregate` after persisting the raw event.
- Aggregates are updated using an **Upsert** pattern (`ON CONFLICT DO UPDATE`).
- Unique visitor counts are incremented only if the `visitorId` has not been seen for that specific `(pageId, date, eventType, resourceId)` tuple.

### Counting Limitations
- **Precision**: Visitor counts are unique per day. A visitor returning on a different day counts as a "new" visitor for that day.
- **Visitor ID**: Rely on the client-side `visitorId` stored in `localStorage`. If a visitor clears their storage or uses a different browser, they will be treated as a new visitor.
- **Latency**: Aggregates are updated asynchronously (non-blocking) in the tracking path. There may be a sub-second delay before they reflect in the dashboard.

## Backfill Process
A script has been provided to populate aggregates from existing historical raw events:
```bash
pnpm backfill:aggregates
```
This script iterates through all `pageEvents`, applies the aggregate mapping logic, and populates the `dailyStats` and `dailyResourceStats` tables.

## Turso vs. Cloudflare D1
**Current Decision**: Aggregates currently live in **Turso** alongside the primary application data.

**Future Move**:
If the decision is made to move data to Cloudflare D1:
1. The schema in `src/db/schema.ts` is already compatible with D1 (standard SQLite).
2. `src/db/index.ts` should be updated to use the D1 driver (`drizzle-orm/d1`) when running in the Cloudflare environment.
3. Raw events can be offloaded to a separate D1 instance or a time-series database (like Honeycomb or Axiom) while keeping the aggregates in the main app database for fast dashboard access.

## Verification
1. Run `pnpm backfill:aggregates` to process historical data.
2. Visit the Dashboard Analytics page to verify historical totals and 7-day trends are rendering correctly from the aggregate tables.
3. Trigger new events (page views, clicks) and verify they appear in the dashboard.
