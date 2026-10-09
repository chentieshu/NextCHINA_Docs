import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';
import { chromium } from '@playwright/test';

// This is a mandatory post-deploy contract for the NEW reader. The separate
// generic identity checker can still validate a pre-PR, already-live release.
const expected = process.env.EXPECTED_COMMIT;
assert.match(expected ?? '', /^[a-f0-9]{40}$/);
const base = new URL(process.env.DEPLOYMENT_URL ?? 'https://docs.nextchina.org');
assert.equal(base.protocol, 'https:');
const output = 'test-results-production/live-reader';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(theme => localStorage.setItem('nextchina-theme', theme), theme);
    await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(20000);
    const url = new URL('/', base);
    url.searchParams.set('view', 'article'); url.searchParams.set('article', 'llm-attention-calculation');
    url.searchParams.set('release', expected);
    let response, actual;
    for (let attempt = 0; attempt < 5; attempt++) {
      url.searchParams.set('reader_probe', `${Date.now()}-${attempt}`);
      response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      actual = await page.locator('meta[name="nextchina-commit"]').getAttribute('content', { timeout: 1000 }).catch(() => null);
      if (response?.ok() && actual === expected) break;
      await page.screenshot({ path: `${output}/identity-${width}-${theme}-${attempt}.png` });
      if (attempt < 4) await setTimeout(3000);
    }
    assert.ok(response?.ok(), 'Reader response is not successful');
    assert.equal(actual, expected, 'Reader is not the deployed revision');
    try {
      await page.locator('[data-document="llm-attention-calculation"] .markdown-prose').waitFor({ state: 'visible' });
      await page.evaluate(() => document.fonts.ready);
      const measurements = await page.evaluate(() => ({
        inline: [...document.querySelectorAll('.markdown-prose .katex')].filter(el => !el.closest('.katex-display')).map(el => ({
          display: getComputedStyle(el).display, overflow: getComputedStyle(el).overflowX, accessible: !!el.querySelector('.katex-mathml'),
        })),
        diagrams: [...document.querySelectorAll('.md-diagram')].map(el => ({ status: el.getAttribute('data-status'), renderer: el.getAttribute('data-renderer') })),
        tables: [...document.querySelectorAll('.md-table-scroll')].map(el => ({ width: el.clientWidth, table: el.querySelector('table').getBoundingClientRect().width })),
        viewportOverflow: document.documentElement.scrollWidth - innerWidth,
      }));
      assert.ok(measurements.inline.length > 5);
      assert.ok(measurements.inline.every(item => item.display === 'inline' && item.overflow === 'visible' && item.accessible), 'Inline math scrollport regression');
      assert.ok(measurements.diagrams.length > 0 && measurements.diagrams.every(item => item.status === 'ready' && item.renderer === 'static-mermaid'), 'Published Mermaid must be ready before scrolling');
      assert.ok(measurements.tables.every(item => item.table >= item.width - 1), 'Narrow table inside a wide frame');
      assert.ok(await page.locator('.md-codeblock .token.keyword').count() > 0, 'Python code is not highlighted');
      assert.equal(await page.locator('.katex-error').count(), 0);
      assert.ok(measurements.viewportOverflow <= 1, 'Viewport overflow');
      const toggle = page.getByRole('button', { name: '显示关联资料', exact: true });
      assert.equal(await toggle.evaluate(el => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
      assert.ok((await toggle.boundingBox()).y < 60, 'Related toggle is not top-right');
      assert.deepEqual(errors, []);
      await page.locator('.md-table-region').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/math-table-${width}-${theme}.png` });
      await page.locator('.md-codeblock').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/code-${width}-${theme}.png` });
      results.push({ width, theme, status: 'pass', measurements });
    } catch (error) {
      await page.screenshot({ path: `${output}/failure-${width}-${theme}.png` });
      writeFileSync(`${output}/failure-${width}-${theme}.html`, await page.content());
      throw error;
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
const report = { status: 'pass', commit: expected, contract: 'markdown-reader-2026-10-09', results };
writeFileSync(`${output}/reader-verification.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
