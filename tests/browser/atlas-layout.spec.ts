// Retain the filename referenced by existing CI, replace the obsolete six-card assertions.
import { test, expect } from '@playwright/test';
for (const theme of ['dark','light']) test(`full-bleed point-line graph, ${theme}`,async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.addInitScript(value=>localStorage.setItem('nextchina-theme',value),theme);
  await page.goto('/');await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout','ready');
  await expect(page.locator('.atlas-area,.atlas-board,.og-inspector')).toHaveCount(0);
  const box=await page.locator('.og-network-host').boundingBox();expect(box!.width).toBeGreaterThan(1000);expect(box!.height).toBeGreaterThan(700);
  const labelSizes=await page.locator('.kg-label').evaluateAll(nodes=>nodes.map(node=>parseFloat(getComputedStyle(node).fontSize)));
  expect(labelSizes.every(size=>size>=12)).toBe(true);
  await page.screenshot({path:`test-results/obsidian-overview-${theme}.png`});
});
