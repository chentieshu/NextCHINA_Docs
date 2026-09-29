import { test, expect } from '@playwright/test';

for (const theme of ['light', 'dark']) {
  test(`the complete six-area overview fits a normal desktop without shrinking text: ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(value => localStorage.setItem('nextchina-theme', value), theme);
    await page.goto('/');
    await expect(page.locator('.atlas-map')).toHaveAttribute('data-layout', 'ready');
    await page.evaluate(() => document.fonts.ready);
    const viewport = await page.locator('.atlas-map').boundingBox();
    expect(viewport).not.toBeNull();
    const areas = await page.locator('.atlas-area').evaluateAll(nodes => nodes.map(node => {
      const rect = node.getBoundingClientRect();
      return { id: node.getAttribute('data-area'), top: rect.top, bottom: rect.bottom };
    }));
    expect(areas).toHaveLength(6);
    for (const area of areas) {
      expect(area.top, `${area.id} starts inside the map`).toBeGreaterThanOrEqual(viewport!.y);
      expect(area.bottom, `${area.id} is not pushed below the first overview`).toBeLessThanOrEqual(viewport!.y + viewport!.height + 1);
    }
    const sizes = await page.locator('.atlas-domain-button strong').evaluateAll(nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize)));
    expect(sizes.every(size => size >= 14)).toBe(true);
    await page.screenshot({ path: `test-results/atlas-overview-${theme}.png` });
  });
}
