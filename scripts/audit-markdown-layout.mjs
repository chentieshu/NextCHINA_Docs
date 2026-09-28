import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const browser = await chromium.launch(process.env.AUDIT_BROWSER ? { executablePath: process.env.AUDIT_BROWSER } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
const ids = JSON.parse(readFileSync('content/spaces.json', 'utf8')).spaces.flatMap(s => s.chapterIds);
const report = [];
mkdirSync('test-results/layout-audit', { recursive: true });
try {
  for (const id of ids) {
    await page.goto(`http://127.0.0.1:3000/?view=article&article=${id}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.markdown-prose').waitFor();
    const tables = await page.locator('.md-table-region').evaluateAll(elements => elements.map(element => {
      const table = element.querySelector('table'), scroll = element.querySelector('.md-table-scroll');
      return { columns: +element.dataset.columns, container: element.clientWidth, table: table.getBoundingClientRect().width,
        scroll: scroll.scrollWidth, rows: table.querySelectorAll('tbody tr').length,
        headings: [...table.querySelectorAll('thead th')].map(cell => ({ text: cell.textContent, width: cell.getBoundingClientRect().width })),
        firstRowHeight: table.querySelector('tbody tr')?.getBoundingClientRect().height };
    }));
    const counts = await page.locator('.markdown-prose').evaluate(element => ({
      tables: element.querySelectorAll('table').length, code: element.querySelectorAll('.md-codeblock').length,
      diagrams: element.querySelectorAll('.md-diagram').length, displayMath: element.querySelectorAll('.katex-display').length,
      taskItems: element.querySelectorAll('.task-list-item').length, lists: element.querySelectorAll('ul,ol').length,
      quotes: element.querySelectorAll('blockquote').length, footnoteSections: element.querySelectorAll('[data-footnotes]').length
    }));
    report.push({ id, counts, tables });
    if (['aa-intelligence','catalog-video','llm-kv-cache','model-api-prices'].includes(id)) {
      await page.locator('.md-table-region').first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `test-results/layout-audit/baseline-${id}.png` });
    }
  }
  writeFileSync('test-results/layout-audit/inventory.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ documents: report.length, counts: report.reduce((totals, row) => {
    for (const [key, value] of Object.entries(row.counts)) totals[key] = (totals[key] ?? 0) + value;
    return totals;
  }, {}) }, null, 2));
} finally { await browser.close(); }
