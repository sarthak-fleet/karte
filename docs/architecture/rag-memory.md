# RAG / profile memory

Profile `infoBlocks` are the owner-authored knowledge base behind each page's
chat. They are indexed and searched through the shared Cloudflare
`knowledgebase` Worker.

## Wiring

- Service binding: `RAG_SERVICE` → `knowledgebase` worker (see `wrangler.jsonc`
  `services`).
- Shared secret: `RAG_SERVICE_KEY` (required for profile-memory
  indexing/search).
- Optional public fallback URL: `RAG_SERVICE_URL` (used only when the service
  binding is unavailable).
- Client code: `src/lib/knowledgebase.ts`, `src/lib/profile-memory.ts`,
  `src/lib/profile-memory-index.ts`.

## What syncs

`infoBlocks` sync to the knowledgebase worker on create / ingest / delete. The
chat endpoint searches them to ground answers in the owner's profile memory.

## Chat-side timeout

RAG search is raced against a 500ms timeout (`searchWithTimeout` in
`src/app/api/chat/[slug]/route.ts`) so a slow search never blocks a chat
response. On timeout/failure it falls back to an empty context string.

## Legacy SaaS Maker RAG — removed

SaaS Maker RAG is **no longer a fallback** for profile-memory
create/ingest/delete/search. The shared Cloudflare `knowledgebase` Worker is
the only RAG path. The user fields `smProjectId` / `smApiKey` / `smIndexId` and
`smDocumentId` remain as **compatibility linkage columns** only — do not wire
new behavior to them.

## Direct recall shortcut

For simple factual queries about the recent conversation (e.g. color /
clothing questions), `answerFromRecentConversation` handles them with regex
against visitor messages **before** hitting the LLM. This is an intent-class
shortcut, not RAG. See `docs/knowledge/learnings/new-things.md`.
