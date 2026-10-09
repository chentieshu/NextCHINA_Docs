import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../', import.meta.url));

/** Test the actual React renderer, not the presence of a class-name string. */
export async function testMarkdownRendering(articles = []) {
  const temp = mkdtempSync(path.join(root, '.markdown-render-test-'));
  try {
    const files = ['utils/markdown.ts', 'components/MarkdownRenderer.tsx',
      'components/MarkdownCodeBlock.tsx', 'components/MarkdownTable.tsx', 'components/MermaidDiagram.tsx',
      'data/docs.ts', 'data/research.ts', 'utils/prismSetup.js', 'utils/codeHighlight.js', 'utils/renderAssetKey.js', 'lib/diagramTheme.js'];
    // TypeScript 7 is a native compiler: use its supported CLI, not the old JS API.
    const outputRoot = path.join(temp, 'output');
    const config = path.join(temp, 'tsconfig.json');
    writeFileSync(config, JSON.stringify({ compilerOptions: {
      target: 'ES2022', module: 'ESNext', moduleResolution: 'bundler', jsx: 'react-jsx',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'], types: ['vite/client'], skipLibCheck: true,
      strict: true, allowJs: true, checkJs: false, noEmit: false, resolveJsonModule: true, rootDir: root, outDir: outputRoot
    }, files: files.map(file => path.join(root, 'src', file)) }));
    const executable = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
    const check = spawnSync(executable, ['-p', config], { cwd: root, encoding: 'utf8' });
    assert.equal(check.status, 0, `Markdown component compilation failed:\n${check.stdout ?? ''}${check.stderr ?? ''}${check.error ?? ''}`);
    const prepare = directory => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) prepare(file);
        else if (file.endsWith('.js')) {
          const compiled = readFileSync(file, 'utf8')
            .replace(/^import\s+['"][^'"]+\.css['"];?\s*$/gm, '')
            .replace(/(from\s+['"])(\.\.?\/[^'"]+)(['"])/g, (_, left, specifier, right) =>
              specifier.endsWith('.json') ? `${left}${specifier}${right} with { type: 'json' }`
                : `${left}${specifier.endsWith('.js') ? specifier : specifier + '.js'}${right}`);
          writeFileSync(file, compiled);
        }
      }
    };
    prepare(outputRoot);
    const { MarkdownRenderer } = await import(pathToFileURL(path.join(outputRoot, 'src/components/MarkdownRenderer.js')).href);
    const render = (content, isLight = true) => renderToStaticMarkup(React.createElement(MarkdownRenderer, { content, isLight }));
    const fixture = readFileSync(path.join(root, 'tests/markdown/renderer.md'), 'utf8');
    const html = render(fixture);
    assert.match(html, /markdown-prose/);
    for (const columns of [2, 3, 4, 7]) assert.ok(html.includes(`data-columns="${columns}"`), `Missing ${columns}-column table`);
    assert.match(html, /text-align:right/);
    assert.match(html, /text-align:center/);
    assert.match(html, /scope="col"/);
    assert.match(html, /<strong>/);
    assert.match(html, /<em>/);
    assert.match(html, /<del>/);
    assert.match(html, /task-list-item/);
    assert.match(html, /disabled=""/);
    assert.match(html, /<ol start="100">/);
    assert.equal((html.match(/class="md-codeblock"/g) ?? []).length, 3, 'Fenced, unlabelled and indented code must use the code component');
    assert.equal((html.match(/class="md-diagram"/g) ?? []).length, 2, 'Flowchart and Gantt fences must reach Mermaid');
    assert.match(html, /katex-display/);
    assert.match(html, /katex-mathml/);
    assert.match(html, /title="资料标题"/);
    assert.match(html, /id="重复标题"/);
    assert.match(html, /id="重复标题-1"/);
    assert.match(html, /id="footnote-label"/);
    assert.match(html, /data-footnote-backref/);
    assert.ok(!/<pre[^>]*>\s*<(div|figure)/.test(html), 'No block wrapper inside pre');
    assert.ok(!html.includes('node="[object Object]"'), 'Do not leak HAST node props into DOM');
    assert.ok(!render('<script>alert(1)</script>').includes('<script>'), 'Raw script HTML must stay inert');
    assert.ok(!render('[bad](javascript:alert(1))').includes('href="javascript:'), 'Unsafe URL must not survive');
    assert.match(render('$$\n\\notARealCommand\n$$'), /markdown-body/, 'A bad formula cannot crash the article');
    assert.match(render(fixture, false), /markdown-dark/);
    const headings = input => [...input.matchAll(/<h[1-6][^>]*\bid="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(headings(html), headings(render(fixture, false)), 'Heading IDs must survive theme changes');
    const { DOC_CHAPTERS, escapeResearchCurrency } = await import(pathToFileURL(path.join(outputRoot, 'src/data/docs.js')).href);
    const prices = '$0.05/秒；另一个套餐 $20/月。';
    const escapedPrices = escapeResearchCurrency(prices);
    assert.equal(escapeResearchCurrency(escapedPrices), escapedPrices, 'Currency escaping must be idempotent');
    const priceHtml = render(escapedPrices);
    assert.ok(priceHtml.includes(prices), 'Prices must remain visible as written');
    assert.ok(!priceHtml.includes('class="katex'), 'Dollar prices must not become TeX');
    const generatedIds = new Set(DOC_CHAPTERS.map(chapter => chapter.id));
    const documents = [...articles, ...DOC_CHAPTERS];
    for (const { id, content } of documents) {
      const result = render(content);
      assert.ok(result.includes('markdown-body'), `${id}: render failed`);
      assert.ok(!result.includes('node="[object Object]"'), `${id}: leaked AST props`);
      if (generatedIds.has(id)) assert.ok(!result.includes('class="katex'), `${id}: plain research text unexpectedly parsed as math`);
    }
    if (process.env.MARKDOWN_PREVIEW_PATH) writeFileSync(process.env.MARKDOWN_PREVIEW_PATH, html);
    console.log(JSON.stringify({ status: 'pass', test: 'actual-react-markdown-render',
      fixtureColumns: [2, 3, 4, 7], codeBlocks: 3, mermaidBlocks: 2, currencyEscaping: true,
      articlesRendered: articles.length, generatedDocumentsRendered: DOC_CHAPTERS.length }));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
