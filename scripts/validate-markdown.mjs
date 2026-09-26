import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const essays = readFileSync(new URL('../src/data/essays.ts', import.meta.url), 'utf8');
const docs = readFileSync(new URL('../src/data/docs.ts', import.meta.url), 'utf8');
const renderer = readFileSync(new URL('../src/components/MarkdownRenderer.tsx', import.meta.url), 'utf8');
const slug = readFileSync(new URL('../src/utils/slugify.ts', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');

for (const forbidden of ['MDXRenderer', '[WIDGET:', 'interactiveWidgetId']) {
  assert.ok(!essays.includes(forbidden), `essays contains legacy ${forbidden}`);
  assert.ok(!docs.includes(forbidden), `docs contains legacy ${forbidden}`);
}

for (const capability of ['remarkGfm', 'components={{', 'table:', 'pre:', 'code:', 'img:', 'input:']) {
  assert.ok(renderer.includes(capability), `Markdown renderer missing ${capability}`);
}

for (const capability of ['extractMarkdownHeadings', 'setext', 'fenceMarker', 'slugifyHeading']) {
  assert.ok(slug.includes(capability), `Heading contract missing ${capability}`);
}

for (const selector of [
  '.markdown-body h1', '.markdown-body blockquote', '.markdown-body ul',
  '.md-codeblock', '.md-table-scroll', '.markdown-body input[type="checkbox"]',
  '.markdown-light', '.markdown-dark'
]) {
  assert.ok(css.includes(selector), `Markdown CSS missing ${selector}`);
}

const rawBlocks = [...essays.matchAll(/(?:Markdown = String\.raw|Markdown = )`([\s\S]*?)`;/g)].map(match => match[1]);
assert.ok(rawBlocks.length >= 3, 'Expected essay Markdown sources');

for (const [index, markdown] of rawBlocks.entries()) {
  const fences = markdown.match(/^\s{0,3}(`{3,}|~{3,})/gm) ?? [];
  assert.equal(fences.length % 2, 0, `Essay ${index + 1} has an unclosed fenced code block`);

  const tableSeparators = markdown.match(/^\|(?:[^\n]*\|)+\s*$/gm) ?? [];
  assert.ok(!markdown.includes('<script'), `Essay ${index + 1} contains raw script HTML`);
  if (markdown.includes('| --- |')) assert.ok(tableSeparators.length >= 2, `Essay ${index + 1} table syntax looks incomplete`);
}

console.log(JSON.stringify({
  status: 'pass',
  markdownDialect: 'CommonMark + GFM',
  essaySources: rawBlocks.length,
  checks: ['no MDX widgets', 'GFM renderer', 'heading contract', 'theme styles', 'fenced blocks']
}, null, 2));
