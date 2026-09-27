import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { testMarkdownRendering } from './test-markdown-render.mjs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const spaces = JSON.parse(read('content/spaces.json'));
const registry = JSON.parse(read('content/articles.json'));
assert.ok(Array.isArray(registry.articles) && registry.articles.length, 'Article registry is empty');
assert.ok(Array.isArray(spaces.spaces) && spaces.spaces.length, 'Space registry is empty');
const assigned = new Set(spaces.spaces.flatMap(space => space.chapterIds));
const ids = new Set();
const articles = [];
for (const article of registry.articles) {
  assert.ok(article.id && !ids.has(article.id), `Invalid or duplicate article id: ${article.id}`);
  ids.add(article.id);
  assert.ok(assigned.has(article.id), `${article.id}: not assigned to a space`);
  assert.ok(article.file.startsWith('content/') && article.file.endsWith('.md') && !article.file.split('/').includes('..'), `${article.id}: invalid Markdown path`);
  assert.ok(existsSync(new URL('../' + article.file, import.meta.url)), `${article.id}: missing ${article.file}`);
  const content = read(article.file);
  assert.ok(content.trim(), `${article.id}: empty Markdown`);
  assert.ok(!/<script\b/i.test(content), `${article.id}: script HTML is not allowed`);
  articles.push({ id: article.id, content });
}
const css = read('src/styles/markdown.css');
assert.ok(read('src/index.css').includes('./styles/markdown.css'), 'Markdown stylesheet is not loaded');
for (const selector of ['.markdown-body', '.markdown-prose', '.md-codeblock', '.md-table-region', '.md-table-scroll', '.katex-display', '.md-mermaid', '.markdown-light', '.markdown-dark']) {
  assert.ok(css.includes(selector), `Markdown stylesheet missing ${selector}`);
}
// CommonMark allows a fence to end at EOF; counting delimiters modulo 2 is not a parser.
// Render real documents with the same plugins/components used in production instead.
await testMarkdownRendering(articles);
console.log(JSON.stringify({ status: 'pass', markdownDialect: 'CommonMark + GFM + Math + Mermaid', articles: articles.length }));
