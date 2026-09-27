import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const renderer = readFileSync(new URL('../src/components/MarkdownRenderer.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const spaces = JSON.parse(readFileSync(new URL('../content/spaces.json', import.meta.url), 'utf8'));
const registry = JSON.parse(readFileSync(new URL('../content/articles.json', import.meta.url), 'utf8'));

assert.ok(Array.isArray(registry.articles) && registry.articles.length, 'Article registry is empty');
assert.ok(Array.isArray(spaces.spaces) && spaces.spaces.length, 'Missing documentation space registry');
const assigned = new Set(spaces.spaces.flatMap(space => space.chapterIds));
for (const article of registry.articles) assert.ok(assigned.has(article.id), `${article.id}: article is not assigned to a space`);

const ids = new Set();
for (const article of registry.articles) {
  assert.ok(article.id && !ids.has(article.id), `Invalid or duplicate article id: ${article.id}`);
  ids.add(article.id);
  assert.ok(article.file.endsWith('.md'), `${article.id}: article file must be Markdown`);
  const url = new URL('../' + article.file, import.meta.url);
  assert.ok(existsSync(url), `${article.id}: missing Markdown file ${article.file}`);
  const markdown = readFileSync(url, 'utf8');
  assert.ok(markdown.trim().length > 0, `${article.id}: empty Markdown`);
  const fences = markdown.match(/^\s{0,3}(`{3,}|~{3,})/gm) ?? [];
  assert.equal(fences.length % 2, 0, `${article.id}: unclosed fenced code block`);
  assert.ok(!markdown.toLowerCase().includes('<script'), `${article.id}: raw script HTML is not allowed`);
  assert.ok(!/\\\\\[|\\\\\]|\\\\\(|\\\\\)/.test(markdown), `${article.id}: use $...$ / $...$ for math delimiters`);
}

for (const capability of ['remarkGfm', 'remarkMath', 'rehypeKatex', 'MermaidDiagram', 'components={{', 'table:', 'pre:', 'code:', 'img:', 'input:']) {
  assert.ok(renderer.includes(capability), `Markdown renderer missing ${capability}`);
}
for (const selector of ['.markdown-body h1', '.markdown-body blockquote', '.markdown-body ul', '.md-codeblock', '.md-table-region', '.md-table-scroll', '.katex-display', '.md-mermaid', '.markdown-light', '.markdown-dark']) {
  assert.ok(css.includes(selector), `Markdown CSS missing ${selector}`);
}

console.log(JSON.stringify({ status: 'pass', markdownDialect: 'CommonMark + GFM + Math + Mermaid', articles: registry.articles.length }, null, 2));
