#!/usr/bin/env node
// scripts/docs-check.mjs — validate the docs/ knowledge system.
//
// No dependencies. Checks:
//   1. Internal markdown links resolve to an existing file or directory.
//   2. docs/index.md exists (navigation hub).
//   3. No placeholder-only files (files whose body is only TODO/TBD stubs).
//   4. Warn on pages over 400 lines (soft limit; target is 150–300).
//
// External links (http/https/mailto), pure anchors (#...), and code spans
// are not checked. Run: `pnpm docs:check`. Used by .github/workflows/docs.yml.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');

const LINK_RE = /(?<!\\)\[(?:[^\]\\]|\\.)+?\]\(([^)]+)\)/g;
const CODE_FENCE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`\n]*`/g;

const errors = [];
const warnings = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(md|mdx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function stripCode(text) {
  return text.replace(CODE_FENCE_RE, '').replace(INLINE_CODE_RE, '');
}

function resolveLinkTarget(fromFile, target) {
  const clean = target.split('#')[0].split('?')[0].trim();
  if (!clean) return null;
  const base = dirname(fromFile);
  return resolve(base, clean);
}

function targetExists(abs) {
  if (!abs) return false;
  if (existsSync(abs)) return true;
  // Bare directory links like docs/architecture/decisions/ -> expect a README.md
  if (existsSync(join(abs, 'README.md'))) return true;
  // .md links where the author wrote a dir-style path without extension
  if (!extname(abs) && existsSync(`${abs}.md`)) return true;
  return false;
}

function checkLinks(file, text) {
  const stripped = stripCode(text);
  let m;
  LINK_RE.lastIndex = 0;
  const lines = stripped.split('\n');
  const seen = new Set();
  // Re-scan per line to report line numbers.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const re = /(?<!\\)\[(?:[^\]\\]|\\.)+?\]\(([^)]+)\)/g;
    while ((m = re.exec(line))) {
      const target = m[1].trim();
      if (/^(https?:|mailto:|tel:|ftp:)/i.test(target)) continue;
      if (target.startsWith('#')) continue;
      const key = `${i}:${target}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const abs = resolveLinkTarget(file, target);
      if (!targetExists(abs)) {
        const rel = relative(ROOT, file);
        const isArchive = rel.includes(`${sep}archive${sep}`);
        const msg = `${rel}:${i + 1}: broken link → ${target}`;
        // Archived docs are historical; their links are not maintained, so
        // treat breakage as a warning, not a failure.
        if (isArchive) warnings.push(msg);
        else errors.push(msg);
      }
    }
  }
}

function isPlaceholderOnly(text) {
  const body = text
    .replace(/---[\s\S]*?---/, '') // frontmatter
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[#>*`_\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!body) return true;
  // Only TODO/TBD/placeholder words.
  const words = body.split(' ').filter(Boolean);
  if (words.length === 0) return true;
  const placeholderWords = words.filter((w) =>
    /^(tbd|todo|placeholder|coming soon|wip)$/i.test(w),
  );
  return placeholderWords.length === words.length;
}

function main() {
  if (!existsSync(DOCS)) {
    errors.push('docs/ directory not found');
    return finish();
  }

  const indexMd = join(DOCS, 'index.md');
  if (!existsSync(indexMd)) {
    errors.push('docs/index.md (navigation hub) is missing');
  }

  const files = walk(DOCS);
  if (files.length === 0) {
    errors.push('no markdown files found under docs/');
    return finish();
  }

  for (const file of files) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch (err) {
      errors.push(`${relative(ROOT, file)}: could not read (${err.message})`);
      continue;
    }
    checkLinks(file, text);
    if (isPlaceholderOnly(text)) {
      warnings.push(`${relative(ROOT, file)}: placeholder-only file`);
    }
    const lineCount = text.split('\n').length;
    if (lineCount > 400) {
      warnings.push(
        `${relative(ROOT, file)}: ${lineCount} lines (target 150–300; consider splitting)`,
      );
    }
  }

  return finish();
}

function finish() {
  for (const w of warnings) console.warn(`warn: ${w}`);
  for (const e of errors) console.error(`error: ${e}`);
  console.log(
    `\nDocs check: ${errors.length} error(s), ${warnings.length} warning(s).`,
  );
  if (errors.length > 0) process.exit(1);
}

main();
