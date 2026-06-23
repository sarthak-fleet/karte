import { existsSync } from 'node:fs';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import Beasties from 'beasties';

const DEFAULT_PRERENDERED_ROOTS = [
  '.next/server/app',
  '.next/standalone/.next/server/app',
  '.next/standalone/apps/web/.next/server/app',
];

async function walkHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    const st = await stat(full);
    if (st.isDirectory()) {
      out.push(...(await walkHtml(full)));
    } else if (entry.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function deRenderBlockCss(html) {
  return html.replace(
    /<link rel="stylesheet" href="([^"]+\.css)"[^>]*\/?>(?!<\/noscript>)/g,
    (match, href) => {
      const preloadPattern = new RegExp(
        `<link rel="preload" href="${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*onload=`,
      );
      return preloadPattern.test(html) ? '' : match;
    },
  );
}

export async function runInlineCss(opts = {}) {
  const strict = opts.strict ?? false;
  const staticRoot = resolve('.next');
  const prerenderedRoots = DEFAULT_PRERENDERED_ROOTS.map((p) =>
    resolve(p),
  ).filter((p) => existsSync(p));

  const htmls = [];
  for (const root of prerenderedRoots) {
    htmls.push(...(await walkHtml(root)));
  }
  if (htmls.length === 0) {
    const msg =
      '[inline-critical-css] no .html files under .next/server/app — skipping';
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    return;
  }

  const beasties = new Beasties({
    path: staticRoot,
    publicPath: '/_next/',
    preload: 'swap',
    inlineFonts: false,
    pruneSource: false,
    logLevel: 'warn',
  });

  let _total = 0;
  let _saved = 0;
  for (const file of htmls) {
    const before = await readFile(file, 'utf8');
    let after;
    try {
      after = await beasties.process(before);
    } catch (err) {
      console.warn(`[inline-critical-css] skipping ${file}: ${err.message}`);
      continue;
    }
    after = deRenderBlockCss(after);
    if (after === before) continue;
    await writeFile(file, after);
    const delta = before.length - after.length;
    _total += 1;
    _saved += delta;
    const _rel = file.replace(`${process.cwd()}/`, '');
  }
}
