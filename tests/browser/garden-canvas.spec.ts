import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`read-only canvas buttons, edges and article return at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?view=garden&scope=topic:transformer-mechanisms&display=graph');
    await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout', 'ready');
    const card = page.locator('.react-flow__node[data-id="concept:self-attention"]');
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: '查看 自注意力', exact: true }).click();
    await expect(page.getByRole('heading', { name: '自注意力', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '关闭知识详情' }).click();
    await expect(page.locator('.react-flow__edge')).not.toHaveCount(0);
    await card.getByRole('button', { name: '探索关联 自注意力', exact: true }).click();
    await expect(page).toHaveURL(/mode=explore/);
    await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout', 'ready');
    await page.locator('.react-flow__node[data-id="concept:self-attention"]').getByRole('button', { name: '查看 自注意力', exact: true }).click();
    const origin = page.url();
    await page.getByRole('button', { name: /LLM 的本质.*阅读文章/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: /LLM 的本质/ })).toBeVisible();
    await page.getByRole('button', { name: '返回知识花园', exact: true }).click();
    await expect(page).toHaveURL(origin);
    await expect(page.getByRole('heading', { name: '自注意力', exact: true })).toBeVisible();
  });
}

test('invalid scope with a valid selected node does not disable mobile recovery', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?view=garden&scope=topic:missing&node=concept:self-attention');
  await expect(page.getByRole('heading', { name: '未找到这个知识节点' })).toBeVisible();
  await page.getByRole('button', { name: '返回全景', exact: true }).click();
  await expect(page.getByRole('heading', { name: '从一个问题开始探索' })).toBeVisible();
});
