#!/usr/bin/env node
// Enriches the /sarthak page with content scraped from sarthakagrawal.dev
// + github.com/sarthakagrawal927. One-shot: prints idempotent SQL to
// stdout. Pipe into `wrangler d1 execute linkchat-auth --remote --file=-`.

const PAGE_ID = 'test-page-1'; // from `SELECT id FROM pages WHERE slug='sarthak'`
const _NOW = Date.now();

function q(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? '1' : '0';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function logo(domain) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
}

// ── Page-level updates ──────────────────────────────────────────────
const pageUpdates = [
  // Tighter bio that leads with the line he uses on GitHub.
  `UPDATE pages SET bio = ${q(
    'I build the rails AI runs on — and the products that ride them. Backend + AI infra at VaultWealth (Peak XV). Previously Front.Page (YC S21). Building Karte, CodeVetter, SaaS Maker, free-ai, high-signal, tinygpt on the side.',
  )} WHERE id = ${q(PAGE_ID)};`,
  // Real Google Calendar meeting link.
  `UPDATE pages SET calendarUrl = ${q('https://calendar.app.google/ZMDHRKzLDNpZsv6x6')} WHERE id = ${q(PAGE_ID)};`,
];

// ── New projects to add (skipping ones already there) ───────────────
const existingProjectTitles = new Set([
  'Karte',
  'CodeVetter',
  'SaaS Maker / Fleet',
  'High Signal',
  'Starboard',
  'SignificantHobbies',
  'RolePatch',
  'Profile Memory System',
  'AI Product Experiments',
]);

const newProjects = [
  {
    title: 'TinyGPT',
    url: 'https://github.com/sarthak-fleet/tinygpt',
    imageUrl: logo('github.com'),
    description:
      'A 0.8M-parameter transformer that trains and runs in the browser via PyTorch → WebAssembly / WebGPU. The smallest possible thing that is still a working GPT.',
  },
  {
    title: 'free-ai',
    url: 'https://github.com/sarthak-fleet/free-ai',
    imageUrl: logo('github.com'),
    description:
      "OpenAI-compatible LLM gateway running on Cloudflare Workers. Routes to Cloudflare Workers AI, OpenRouter, or any chat-completions endpoint. Powers Karte's free tier.",
  },
  {
    title: 'Front.Page',
    url: 'https://www.frontpage.so',
    imageUrl: logo('frontpage.so'),
    description:
      'YC S21 fintech social platform where I led backend + data infrastructure for three years. Real-time market pipeline 15k → 200k DAU, 600ms → 60ms latency, RAG support agents cutting human load ~90%.',
  },
];

// ── New info blocks (the chat / encyclopedia / newspaper memory) ────
const newInfoBlocks = [
  {
    type: 'text',
    title: 'Where Sarthak works',
    content:
      'Software engineer at VaultWealth (Peak XV-backed) since February 2025. Building backend services, reliability infrastructure, and durable workflows for financial planning. Previously: Front.Page (YC S21) from January 2022 to January 2025 — backend + data infra for a fintech social platform.',
  },
  {
    type: 'text',
    title: 'Engineering philosophy',
    content:
      "It's the stuff around the happy path that matters. Most engineers can write the happy-path code; what separates good systems from great ones is how they handle timeouts, queue backups, retries, idempotency, and downstream failures. Most production incidents live in those edges.",
  },
  {
    type: 'text',
    title: 'Tech stack',
    content:
      'Backend: Go, Node.js / TypeScript, Python. Systems: Kafka, Temporal, Docker, Kubernetes, Socket.io. AI/LLM: RAG pipelines, OpenAI APIs, BERT embeddings, Milvus vector search. Data: MySQL, PostgreSQL, Redis, ClickHouse, Elasticsearch, BigQuery. Frontend when needed: React, Next.js.',
  },
  {
    type: 'text',
    title: 'Open source rhythm',
    content:
      '120+ public repos on GitHub (@sarthakagrawal927). The ones worth your time: tinygpt, free-ai, high-signal, saas-maker, codevetter. Ships in TypeScript and Python mostly. Pair Extraordinaire ×4, Pull Shark ×3, Arctic Code Vault contributor.',
  },
  {
    type: 'faq',
    title: 'What are you open to?',
    content:
      'Open to AI infrastructure and AI product roles — full-time or fractional. Strong preference for teams shipping consumer-facing AI or developer-facing AI infra. Less interested in pure research roles. Best way in: drop a note via the calendar link above with what you are building.',
  },
  {
    type: 'faq',
    title: 'What is TinyGPT?',
    content:
      'A 0.8M-param transformer I built that trains and runs entirely in the browser via PyTorch compiled to WebAssembly + WebGPU. The point: prove that the GPT architecture is small enough to fit in a webpage, and use it as a teaching artifact. Repo: github.com/sarthak-fleet/tinygpt.',
  },
  {
    type: 'faq',
    title: 'What is free-ai?',
    content:
      "An OpenAI-compatible LLM gateway running on Cloudflare Workers. You point any OpenAI SDK at it and it routes to Cloudflare Workers AI, OpenRouter, or whatever chat-completions endpoint you configure. Powers Karte's free tier — that is how visitors get to chat with a profile without anyone paying for tokens.",
  },
  {
    type: 'faq',
    title: 'What do you do at VaultWealth?',
    content:
      'Backend + AI infrastructure. Building durable workflows for financial planning (cutting unexpected failure rates ~90%), reliability primitives, and AI-assisted product surfaces. VaultWealth is Peak XV-backed, mostly serving the UAE market.',
  },
  {
    type: 'faq',
    title: 'What did you ship at Front.Page?',
    content:
      'Front.Page was a fintech social platform (YC S21). I was there 3 years on backend + data infra. Notable: scaled the real-time market data pipeline from 15k to 200k DAU while cutting tail latency 600ms → 60ms; shipped a personalized feed using BERT embeddings + Milvus vector search that lifted engagement +40%; built RAG-powered support agents that cut human support load ~90%.',
  },
  {
    type: 'faq',
    title: 'How do I book a call?',
    content:
      'Use the calendar link in the quick actions row above — it goes to my Google Calendar booking page. 20-30 min slots, async OK if you prefer email. Best questions: AI infra, building solo, fintech reliability, the Karte product itself.',
  },
  {
    type: 'text',
    title: 'On building Karte',
    content:
      'Karte is the main bet — a calling-card-style link-in-bio where every page is also an AI you can talk to (chat, encyclopedia, newspaper, roast). The angle: link-in-bio products are dead ends for people who get inbound; the page should answer in your voice before the question hits your inbox. Gold-foil aesthetic on warm-black; built on Cloudflare Workers + D1 + free-ai.',
  },
];

const out = [];
out.push(
  '-- Enrichment for /sarthak. Idempotent for projects (skip-existing) and',
);
out.push('-- adds new info blocks at the tail of sortOrder.');
out.push('');
out.push('-- 1. page-level updates');
for (const stmt of pageUpdates) out.push(stmt);
out.push('');
out.push('-- 2. new projects (deduplicated by title)');
let projOrder = 100;
for (const p of newProjects) {
  if (existingProjectTitles.has(p.title)) continue;
  out.push(
    'INSERT INTO projects (id, pageId, title, url, imageUrl, description, sortOrder, enabled) VALUES (' +
      [
        q(`proj-sarthak-${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
        q(PAGE_ID),
        q(p.title),
        q(p.url),
        q(p.imageUrl),
        q(p.description),
        projOrder++,
        1,
      ].join(', ') +
      ');',
  );
}
out.push('');
out.push('-- 3. new info blocks (chat memory)');
let infoOrder = 100;
for (const b of newInfoBlocks) {
  out.push(
    'INSERT INTO infoBlocks (id, pageId, type, title, content, sortOrder) VALUES (' +
      [
        q(
          'info-sarthak-' +
            String(b.title)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .slice(0, 40),
        ),
        q(PAGE_ID),
        q(b.type),
        q(b.title),
        q(b.content),
        infoOrder++,
      ].join(', ') +
      ');',
  );
}

process.stdout.write(`${out.join('\n')}\n`);
