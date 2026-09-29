import { test, expect } from '@playwright/test';

for (const theme of ['dark', 'light']) for (const width of [390, 1440]) {
  test(`settings visibly paint checked states and slider controls ${width} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(t => localStorage.setItem('nextchina-theme', t), theme);
    await page.goto('/'); await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await page.getByRole('button', { name: '图谱设置', exact: true }).click();
    const checkbox = page.getByLabel('只显示有资料的节点', { exact: true });
    const before = await checkbox.evaluate(e => getComputedStyle(e).backgroundColor);
    await expect(checkbox).not.toBeChecked();
    await checkbox.check(); await expect(checkbox).toBeChecked();
    const checked = await checkbox.evaluate(e => ({ color: getComputedStyle(e).backgroundColor, image: getComputedStyle(e).backgroundImage, padding: getComputedStyle(e).padding }));
    expect(checked.color).not.toBe(before); expect(checked.image).toContain('data:image/svg+xml'); expect(checked.padding).toBe('0px');
    await checkbox.uncheck(); expect(await checkbox.evaluate(e => getComputedStyle(e).backgroundImage)).toBe('none');
    await expect(page.locator('.og-group-filter input:checked')).toHaveCount(6);
    await page.screenshot({ path: `test-results/settings-checked-${width}-${theme}.png` });
    const slider = page.getByRole('slider', { name: '节点大小', exact: true });
    await slider.scrollIntoViewIfNeeded(); await slider.focus(); await page.keyboard.press('End');
    await expect(slider).toHaveValue('1.8'); await expect(slider.locator('..').locator('output')).toHaveText('180%');
    const style = await slider.evaluate(e => ({ padding: getComputedStyle(e).padding, border: getComputedStyle(e).borderWidth, height: e.getBoundingClientRect().height }));
    expect(style.padding).toBe('0px'); expect(style.border).toBe('0px'); expect(style.height).toBeGreaterThanOrEqual(28);
    await page.screenshot({ path: `test-results/settings-sliders-${width}-${theme}.png` });
    await page.getByRole('button', { name: 'AI 学习导航', exact: true }).click();
    await page.getByRole('button', { name: '概念联系', exact: true }).click();
    await page.screenshot({ path: `test-results/learning-connections-${width}-${theme}.png` });
  });
}

test('forced colors preserve native checked-state feedback for graph controls', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' }); await page.goto('/');
  await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
  await page.getByRole('button', { name: '图谱设置', exact: true }).click();
  const checkbox = page.getByLabel('只显示有资料的节点', { exact: true }); await checkbox.check();
  await expect(checkbox).toBeChecked(); expect(await checkbox.evaluate(e => getComputedStyle(e).appearance)).toBe('auto');
});
