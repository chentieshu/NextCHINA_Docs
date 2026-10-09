import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { diagramTheme, DIAGRAM_THEME_VERSION } from '../src/lib/diagramTheme.js';
import { highlightCode } from '../src/utils/codeHighlight.js';
import { renderAssetKey } from '../src/utils/renderAssetKey.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const registry = JSON.parse(readFileSync(path.join(root, 'content/articles.json'), 'utf8')).articles;
const files = registry.map(article => article.file);
for (const dir of ['tests/browser', 'tests/markdown']) {
  for (const file of readdirSync(path.join(root, dir))) if (file.endsWith('.md')) files.push(`${dir}/${file}`);
}
const sources = files.map(file => ({ file, text: readFileSync(path.join(root, file), 'utf8') }));
const fingerprint = createHash('sha256').update(JSON.stringify({ sources,
  theme: [diagramTheme(true), diagramTheme(false)], version: DIAGRAM_THEME_VERSION,
  mermaid: JSON.parse(readFileSync(path.join(root, 'node_modules/mermaid/package.json'), 'utf8')).version,
  highlight: readFileSync(path.join(root, 'src/utils/codeHighlight.js'), 'utf8'),
})).digest('hex');
const destination = path.join(root, 'src/generated/markdown-assets.json');
if (existsSync(destination) && JSON.parse(readFileSync(destination, 'utf8')).fingerprint === fingerprint) {
  console.log(JSON.stringify({ status: 'pass', renderer: 'static-mermaid-prism', cache: 'unchanged' }));
  process.exit(0);
}
const diagrams = new Map(), code = {};
for (const { file, text } of sources) {
  const tree = unified().use(remarkParse).parse(text);
  const walk = node => {
    if (node.type === 'code') {
      const language = (node.lang ?? '').toLowerCase();
      if (language === 'mermaid') diagrams.set(node.value.trim(), file);
      else {
        const source = node.value + '\n';
        const html = highlightCode(source, language);
        if (html) code[renderAssetKey(`${language}\0${source}`)] = { source, language, html };
      }
    }
    node.children?.forEach(walk);
  };
  walk(tree);
}
const output = { schemaVersion: 1, fingerprint, diagrams: {}, code };
// Use the same pinned Mermaid implementation in a measured browser at build
// time. Public pages never wait for an IntersectionObserver or Mermaid import.
const server = await createServer({ configFile: false, root, server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/scripts/diagram-render.html`);
  await page.waitForFunction(() => typeof window.renderBuildDiagram === 'function', undefined, { timeout: 30000 });
  for (const [source, file] of diagrams) {
    const key = renderAssetKey(source);
    const entry = { source };
    for (const theme of ['light', 'dark']) {
      try {
        entry[theme] = await page.evaluate(async ({ source, light, id }) => window.renderBuildDiagram(source, light, id),
          { source, light: theme === 'light', id: `static-${key}-${theme}` });
        assert.ok(!/<script\b|\son\w+=/i.test(entry[theme].svg), `Unsafe diagram output: ${file}`);
      } catch (error) { throw new Error(`Static Mermaid build failed in ${file}: ${source.slice(0, 80)}\n${error}`); }
    }
    output.diagrams[key] = entry;
  }
} finally { await browser?.close(); await server.close(); }
mkdirSync(path.dirname(destination), { recursive: true });
writeFileSync(destination, JSON.stringify(output) + '\n');
console.log(JSON.stringify({ status: 'pass', renderer: 'static-mermaid-prism', diagrams: diagrams.size,
  themedSVGs: diagrams.size * 2, highlightedBlocks: Object.keys(code).length, fingerprint }));
