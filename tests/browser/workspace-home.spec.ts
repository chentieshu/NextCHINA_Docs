import { test, expect, type Page } from '@playwright/test';
import { globalKnowledgeProjection } from '../../src/features/workspace/model';
import { macroOverviewProjection } from '../../src/features/workspace/macroOverview';

async function ready(page: Page) {
  await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout', 'ready');
  await expect(page.locator('.ws-reading-header,.ws-tab-header,[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.workspace')).toHaveCount(1);
}

test('macro overview reuses canonical domains and hubs without promoting concept prerequisites', () => {
  const source = globalKnowledgeProjection();
  const macro = macroOverviewProjection(source);
  const ids = new Set(macro.nodes.map(node => node.id));
  expect(macro.nodes).toEqual(source.nodes.filter(node => ['domain','hub'].includes(node.kind)));
  expect(macro.nodes.length).toBeGreaterThan(0);
  expect(macro.nodes.length).toBeLessThan(source.nodes.length);
  expect(macro.index).toBe(source.index);
  expect(new Set(macro.edges.map(edge => edge.id)).size).toBe(macro.edges.length);
  for (const edge of macro.edges) {
    expect(ids.has(edge.source) && ids.has(edge.target)).toBe(true);
    expect(edge.source).not.toBe(edge.target);
    if (edge.type === 'recommended_before') expect(source.edges.some(original => original.type === edge.type && original.source === edge.source && original.target === edge.target)).toBe(true);
  }
});

for (const width of [320,390,768,1440,1920]) for (const theme of ['light','dark']) {
  test(`macro homepage fits ${width}px ${theme}`, async ({page}) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width, height: 900});
    await page.addInitScript(value => localStorage.setItem('nextchina-theme', value), theme);
    await page.goto('/');
    await ready(page);
    await expect(page.getByRole('heading', {name:'宏观关系图', exact:true})).toBeVisible();
    await expect(page.locator('.ws-macro-home')).toHaveAttribute('data-density','macro');
    await expect(page.locator('.ws-macro-home')).toHaveAttribute('data-inspector','false');
    const bounds = await page.evaluate(() => {
      const box = document.querySelector('.garden-canvas')!.getBoundingClientRect();
      return {width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, viewport: innerWidth, viewHeight: innerHeight, canvasWidth: box.width, canvasHeight: box.height};
    });
    expect(bounds.width).toBeLessThanOrEqual(bounds.viewport + 1);
    expect(bounds.height).toBeLessThanOrEqual(bounds.viewHeight + 1);
    expect(bounds.canvasWidth).toBeGreaterThan(200);
    expect(bounds.canvasHeight).toBeGreaterThan(250);
    const dock = await page.locator('.ws-ribbon').boundingBox();
    if (width < 960) {
      expect(dock!.y).toBeGreaterThan(800);
      await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();
      await expect(page.getByRole('dialog',{name:'文档侧栏'})).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button',{name:'打开文档侧栏',exact:true})).toBeFocused();
    } else expect(dock!.x).toBe(0);
    if ([390,1440].includes(width)) await page.screenshot({path:`test-results/macro-home-${width}-${theme}.png`});
    expect(errors).toEqual([]);
  });
}

test('graph search, relation index and reading share one shell', async ({page}) => {
  await page.goto('/');
  await ready(page);
  const shell = await page.locator('.workspace').elementHandle();
  const search = page.getByRole('searchbox',{name:'搜索知识网络'});
  await search.fill('Softmax');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:/Softmax/})).toBeVisible();
  await expect(page.locator('.ws-macro-home')).toHaveAttribute('data-density','knowledge');
  await ready(page);
  await page.getByRole('button',{name:'回到全貌',exact:true}).click();
  await expect(page.locator('.ws-macro-home')).toHaveAttribute('data-density','macro');
  await page.getByRole('button',{name:'显示全部知识关联'}).click();
  await expect(page.getByRole('complementary',{name:'全部知识关联'})).toBeVisible();
  await page.getByRole('button',{name:'关闭关系索引'}).click();
  await expect(page.locator('.ws-macro-home')).toHaveAttribute('data-inspector','false');
  await page.getByRole('button',{name:'阅读',exact:true}).click();
  await expect(page.locator('[data-document="overview"] .markdown-body')).toBeVisible();
  expect(await shell?.evaluate(node => node.isConnected)).toBe(true);
  await page.goBack();
  await ready(page);
  await page.reload();
  await ready(page);
});

test('a failed homepage worker can still open a real document', async ({page}) => {
  await page.route(/layout\.worker/, route => route.abort());
  await page.goto('/');
  await expect(page.getByRole('button',{name:'用列表继续阅读'})).toBeVisible();
  await page.getByRole('button',{name:'用列表继续阅读'}).click();
  await expect(page.locator('[data-document="overview"] .markdown-body')).toBeVisible();
  await expect(page.locator('.ws-reading-header,[role="tab"]')).toHaveCount(0);
});
