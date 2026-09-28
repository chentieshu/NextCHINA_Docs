import { test, expect } from '@playwright/test';

// Text width must reserve the cell's actual padding and border, not only glyphs.
for (const width of [1440, 1920]) for (const theme of ['light', 'dark']) {
  test(`short numeric headers stay readable ${width}px ${theme}`, async ({page}) => {
    await page.setViewportSize({width, height:1000});
    await page.addInitScript(value => localStorage.setItem('nextchina-theme',value),theme);
    await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
    await page.goto('/?view=article&article=model-api-prices');
    const frame = page.locator('.md-table-region').first();
    await expect(frame).toHaveAttribute('data-measured','true');
    await page.evaluate(async () => { await document.fonts.ready; await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); });
    await frame.scrollIntoViewIfNeeded();
    const labels = frame.locator('thead th').filter({hasText:/^(输入|输出|缓存读取)$/});
    await expect(labels).toHaveCount(3);
    for (const label of await labels.all()) {
      const lines = await label.evaluate(element => {
        const range = document.createRange(); range.selectNodeContents(element);
        return new Set([...range.getClientRects()].filter(rect => rect.width > 0).map(rect => Math.round(rect.y))).size;
      });
      expect(lines, await label.textContent() ?? 'header').toBe(1);
    }
    await page.screenshot({path:`test-results/tables-final-prices-${width}-${theme}.png`});
  });
}
