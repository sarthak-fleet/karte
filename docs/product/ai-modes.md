# AI profile modes — encyclopedia, roast, newspaper

Each public profile can expose up to three AI-generated "modes" alongside the
base profile. They share one generation pipeline and one caching table.

## Lifecycle

Generated content follows a state machine:

```
pending → generating → ready | error
```

- Rows live in the `generatedPages` table (`src/db/schema.ts`), keyed by
  `pageId` + `type`.
- A request kicks the row to `generating`, calls the AI provider, stores the
  rendered output, and flips to `ready` (or `error`).
- Subsequent reads serve the cached `ready` row until the owner regenerates.

## Modes

| Mode | Route | Prompt family |
| --- | --- | --- |
| Encyclopedia | `/[slug]/encyclopedia` | Wikipedia-styled structured profile. |
| Roast | `/[slug]/roast` | Comic roast of the profile. |
| Newspaper | `/[slug]/newspaper` | Front-page newspaper treatment of the profile. |

Prompts live in `src/lib/ai-prompts.ts`. Generation routes live under
`src/app/api/pages/[pageId]/generate/{encyclopedia,roast,newspaper}/route.ts`.

## AI provider

- Default gateway: `LINKCHAT_DEFAULT_AI_ENDPOINT_URL` (free-ai gateway,
  OpenAI-compatible) via `@ai-sdk/openai-compatible`.
- Default model: `LINKCHAT_DEFAULT_AI_MODEL` (set in `wrangler.jsonc` `vars`).
- Per-page override: owners can set their own AI key via
  `/api/settings/ai-key` (`LINKCHAT_DEFAULT_AI_API_KEY` is the fallback).

## Streaming + component delimiter

Chat streaming uses a marker-delimited protocol so prose and structured
components can share one stream: the prompt emits a `<<<COMPONENTS>>>` marker
after the prose, and the client splits on that literal to recover JSON
components. See `src/lib/ai-prompts.ts` and `docs/knowledge/learnings/new-things.md`.

## Security note

AI generate endpoints are owner-authenticated and rate-limited. The original
2026-03-28 audit (`docs/knowledge/audits/security-audit-2026-03-28.md`) flagged
them as unauthenticated with too-permissive limits; that has been fixed
(owner auth + tighter caps).

## Research / design history

The original design research for each mode is archived under
`docs/archive/research/`:

- `research-personal-encyclopedia-2026-03-28.md`
- `research-roast-feature-2026-03-28.md`
- `research-newspaper-fame-generator-2026-03-28.md`
- `multi-page-ui-design-2026-03-28.md`
