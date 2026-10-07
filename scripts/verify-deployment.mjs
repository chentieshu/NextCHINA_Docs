import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const expected = process.env.EXPECTED_COMMIT;
assert.match(expected ?? '', /^[a-f0-9]{40}$/, 'EXPECTED_COMMIT must be the tested production commit');
const base = new URL(process.env.DEPLOYMENT_URL ?? 'https://docs.nextchina.org');
assert.equal(base.protocol, 'https:');
let failure, verifiedHealth;
for (let attempt = 0; attempt < 5; attempt++) {
  try {
    const read = async path => {
      const url = new URL(path, base); url.searchParams.set('release', expected);
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      assert.ok(response.ok, `Live endpoint ${path}: HTTP ${response.status}`);
      return response;
    };
    const version = await (await read('/version.json')).json();
    const health = await (await read('/knowledge-health.json')).json();
    const html = await (await read('/')).text();
    assert.equal(version.commit, expected, 'Live version does not match deployed commit');
    assert.equal(health.commit, expected, 'Live health report is stale');
    assert.equal(health.nodes, version.knowledgeNodes);
    assert.ok(health.sourceCheckedSemanticEdges > 0 && health.withIndependentExplanation > 0);
    assert.ok(html.includes(`name="nextchina-commit" content="${expected}"`), 'Homepage HTML is not this release');
    verifiedHealth = health;
    break;
  } catch (error) { failure = error; if (attempt < 4) await setTimeout(3000); }
}
if (!verifiedHealth) throw failure;

// Verify the real deployed browser app, not just HTTP 200 or static metadata.
const output = 'test-results-production/live';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const pages = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    // Third-party fonts/logos are optional; all executable application assets must be same-origin.
    await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(20000);
    for (const id of [null, 'transformer-block', 'llm-sampling', 'rag-evidence']) {
      const url = new URL('/', base);
      url.searchParams.set('release', expected);
      if (id) { url.searchParams.set('view', 'article'); url.searchParams.set('article', id); }
      const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Preserve browser navigation evidence even when a release assertion fails.
      const evidencePath = `${output}/${id ?? 'map'}-${width}`;
      writeFileSync(`${evidencePath}-navigation.json`, JSON.stringify({
        requestedUrl: url.href, finalUrl: page.url(), status: response?.status(),
        headers: response ? await response.allHeaders() : {}, title: await page.title(),
        commit: await page.locator('meta[name="nextchina-commit"]').getAttribute('content', { timeout: 1000 }).catch(() => null),
        errors: [...errors]
      }, null, 2) + '\n');
      if (response) writeFileSync(`${evidencePath}-response.html`, await response.text());
      writeFileSync(`${evidencePath}-dom.html`, await page.content());
      await page.screenshot({ path: `${evidencePath}-navigation.png` });
      assert.ok(response?.ok(), `Browser HTTP failure: ${url.href}`);
      assert.equal(await page.locator('meta[name="nextchina-commit"]').getAttribute('content'), expected);
      if (id) {
        await page.locator(`[data-document="${id}"] .markdown-body`).waitFor({ state: 'visible' });
        assert.ok((await page.locator(`[data-document="${id}"] h1`).innerText()).trim());
        assert.equal(await page.locator('.katex-error').count(), 0, `Math rendering error: ${id}`);
      } else {
        await page.waitForFunction(() => document.querySelector('.og-network-host')?.getAttribute('data-layout') === 'ready');
        assert.equal(await page.locator('.kg-node:visible').count(), verifiedHealth.defaultVisibleNodes);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `Live viewport overflow ${width}px / ${id ?? 'map'}: ${overflow}`);
      assert.deepEqual(errors, [], 'Live application raised a browser error');
      await page.screenshot({ path: `${output}/${id ?? 'map'}-${width}.png` });
      pages.push({ width, id: id ?? 'map', status: 'pass' });
    }
    await context.close();
  }
} finally { await browser.close(); }
const report = { status: 'pass', commit: expected, homepage: base.origin,
  nodes: verifiedHealth.nodes, sourceCheckedSemanticEdges: verifiedHealth.sourceCheckedSemanticEdges, pages };
writeFileSync(`${output}/release-verification.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
