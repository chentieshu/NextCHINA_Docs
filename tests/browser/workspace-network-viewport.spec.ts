import { test, expect, type Page } from '@playwright/test';
const ready = async (page: Page) => expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
async function outside(page: Page, selector = '.kg-node:visible .kg-dot') {
  return page.locator(selector).evaluateAll(nodes => {
    const frame = document.querySelector('.og-network-host')!.getBoundingClientRect();
    return nodes.filter(node => { const r = node.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
      return x < frame.left || x > frame.right || y < frame.top || y > frame.bottom;
    }).length;
  });
}
for (const width of [390, 1440]) test(`overview fits the actual canvas when opening tools ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/'); await ready(page);
  await expect.poll(() => outside(page)).toBe(0);
  for (const label of ['AI 学习导航', '图谱设置']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('.og-inspector')).toBeVisible();
    await expect.poll(() => outside(page)).toBe(0);
  }
  await page.setViewportSize({ width: width === 390 ? 1440 : 390, height: 844 });
  await expect.poll(() => outside(page)).toBe(0);
});

test('cached reader return and reload locate the real selected point in the measured viewport', async ({ page }) => {
  await page.goto('/'); await ready(page);
  const search = page.getByRole('searchbox', { name: '搜索知识网络', exact: true });
  await search.fill('Softmax'); await search.press('Enter');
  await expect(page.locator('.og-network-host')).toHaveAttribute('data-selected', 'concept:softmax');
  await page.locator('.og-read-button').click(); await expect(page.locator('.markdown-body')).toBeVisible();
  await page.getByRole('button', { name: '返回知识地图', exact: true }).click(); await ready(page);
  await expect.poll(() => outside(page, '.kg-node[data-active="true"] .kg-dot')).toBe(0);
  await page.reload(); await ready(page);
  await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', 'concept:softmax');
  await expect.poll(() => outside(page, '.kg-node[data-active="true"] .kg-dot')).toBe(0);
  const label = page.locator('.kg-node[data-node-id="concept:softmax"] .kg-label');
  await expect(label).toBeVisible(); await label.click();
  await expect(page.locator('.og-inspector h2')).toContainText('Softmax');
});
