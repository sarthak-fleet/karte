#!/usr/bin/env node

// Decompresses a Claude Design "standalone HTML" export into its
// original source files. The export ships JSX/CSS/etc. as
// gzip+base64-encoded entries inside two script tags:
//   <script type="__bundler/manifest"> { uuid: { mime, compressed, data } }
//   <script type="__bundler/template"> the entry markup using {{uuid}} refs
//
// Usage:
//   node scripts/extract-claude-design.mjs <input.html> <out-dir>

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

const [, , inputPath, outDir] = process.argv;
if (!inputPath || !outDir) {
  console.error(
    'Usage: node scripts/extract-claude-design.mjs <input.html> <out-dir>',
  );
  process.exit(1);
}

const html = readFileSync(inputPath, 'utf8');
mkdirSync(outDir, { recursive: true });

function extractScript(type) {
  const re = new RegExp(`<script type="${type}">\\s*([\\s\\S]*?)\\s*</script>`);
  const m = html.match(re);
  if (!m) throw new Error(`No <script type="${type}"> tag found`);
  return m[1];
}

const manifestRaw = extractScript('__bundler/manifest');
const templateRaw = extractScript('__bundler/template');

const manifest = JSON.parse(manifestRaw);
const template = JSON.parse(templateRaw);

// MIME → extension table. Mirrors what the loader recognizes.
const extByMime = {
  'text/javascript': 'js',
  'application/javascript': 'js',
  'text/jsx': 'jsx',
  'text/tsx': 'tsx',
  'text/typescript': 'ts',
  'text/css': 'css',
  'text/html': 'html',
  'application/json': 'json',
  'image/svg+xml': 'svg',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'font/woff': 'woff',
  'font/woff2': 'woff2',
  'application/octet-stream': 'bin',
};

const summary = [];
for (const [uuid, entry] of Object.entries(manifest)) {
  const raw = Buffer.from(entry.data, 'base64');
  const bytes = entry.compressed ? gunzipSync(raw) : raw;
  const ext = extByMime[entry.mime] || 'bin';

  // Prefer original filename if the entry carries one; otherwise uuid+ext.
  const filename = entry.name
    ? entry.name.replace(/\//g, '_')
    : `${uuid}.${ext}`;
  writeFileSync(join(outDir, filename), bytes);
  summary.push({
    uuid,
    mime: entry.mime,
    size: bytes.length,
    file: filename,
    name: entry.name ?? null,
  });
}

writeFileSync(join(outDir, '_template.txt'), template, 'utf8');
writeFileSync(
  join(outDir, '_manifest-summary.json'),
  JSON.stringify(summary, null, 2),
);
for (const _item of summary) {
}
