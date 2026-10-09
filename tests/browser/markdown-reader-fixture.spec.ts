import { test, expect } from '@playwright/test';
for (const width of [320,390,1440]) for (const theme of ['light','dark']) {
  test(`nested lists, unknown fences and themed Gantt / ${width} / ${theme}`, async ({ page }) => {
    await page.setViewportSize({width,height:900});
    await page.goto(`/tests/browser/fixture.html?sample=reader-kit&theme=${theme}`);
    await expect(page.locator('ol[start="100"]')).toBeVisible();
    await expect(page.locator('.task-list-item')).toHaveCount(2);
    const checks=page.locator('.task-list-item input');
    await expect(checks.first()).toBeChecked(); await expect(checks.last()).not.toBeChecked();
    expect(await page.locator('.markdown-prose li').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).display==='list-item'))).toBe(true);
    await expect(page.locator('.md-diagram')).toHaveCount(2);
    await expect(page.locator('.md-diagram:not([data-status="ready"])')).toHaveCount(0);
    await expect(page.locator('.md-diagram:not([data-renderer="static-mermaid"])')).toHaveCount(0);
    await expect(page.locator('.md-codeblock[data-highlighted="false"] code')).toHaveText('<script>window.shouldNotRun = true</script>\n');
    expect(await page.evaluate(()=>('shouldNotRun' in window))).toBe(false);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({path:`test-results/reader-lists-${width}-${theme}.png`});
    await page.locator('.md-diagram').last().scrollIntoViewIfNeeded();
    await page.screenshot({path:`test-results/reader-gantt-${width}-${theme}.png`});
  });
}
