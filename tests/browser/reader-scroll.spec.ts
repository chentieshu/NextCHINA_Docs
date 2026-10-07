import { test, expect } from '@playwright/test';

test('reader scroll remains exact across late content growth and history navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/?view=article&article=llm-tokenization');
  const reader = page.locator('.ws-scroll');
  await expect(page.locator('[data-document="llm-tokenization"] .markdown-body')).toBeVisible();
  expect(await reader.evaluate(el => getComputedStyle(el).overflowAnchor)).toBe('none');
  const saved = await reader.evaluate(el => { el.scrollTop = 480; return el.scrollTop; });
  expect(saved).toBe(480);
  // Deterministically reproduce late layout growth above the current viewport.
  await reader.evaluate(el => {
    const late = document.createElement('div');
    late.dataset.scrollFixture = 'true'; late.style.height = '40px';
    el.prepend(late);
  });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await reader.evaluate(el => el.scrollTop)).toBe(saved);
  await reader.locator('[data-scroll-fixture]').evaluate(el => el.remove());
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(await reader.evaluate(el => el.scrollTop)).toBe(saved);
  await page.getByRole('button', { name: '全库搜索', exact: true }).click();
  await page.getByRole('searchbox', { name: '搜索全部文档', exact: true }).fill('Softmax 与温度');
  await page.locator('.ws-search-results button').filter({ hasText: 'Softmax 与温度' }).first().click();
  await expect(page.locator('[data-document="llm-softmax-temperature"] .markdown-body')).toBeVisible();
  await page.goBack();
  await expect(page.locator('[data-document="llm-tokenization"] .markdown-body')).toBeVisible();
  await expect.poll(() => reader.evaluate(el => el.scrollTop)).toBe(saved);
});
