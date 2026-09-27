import { test, expect, type Page } from '@playwright/test';
import { readRoute, routeUrl, gardenHome, safeGardenReturn } from '../../src/routing';
import { byId, ancestors, searchNodes, graph, readingEntries } from '../../src/features/garden/data';
import { project } from '../../src/features/garden/projection';

async function flatViewport(page: Page) {
  const metrics = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth, available: document.documentElement.clientWidth,
    pageHeight: document.documentElement.scrollHeight, viewportHeight: window.innerHeight,
    shadows: [...document.querySelectorAll('.garden-root *')].filter(node => {
      const css = getComputedStyle(node); return css.boxShadow !== 'none' || css.textShadow !== 'none' || css.filter.includes('drop-shadow');
    }).length,
  }));
  expect(metrics.document).toBeLessThanOrEqual(metrics.available + 1);
  expect(metrics.pageHeight).toBeLessThanOrEqual(metrics.viewportHeight + 1);
  expect(metrics.shadows).toBe(0);
  await expect(page.locator('.garden-root select, .garden-root details, .garden-root summary')).toHaveCount(0);
}

test('garden model / projection / URL contracts', () => {
  expect(graph.nodes.length).toBe(graph.stats.nodes);
  expect(project('root:ai', 'atlas').nodes.length).toBe(graph.stats.domains);
  expect(ancestors('concept:self-attention').map(node => node.id)).toContain('domain:algorithms');
  expect(searchNodes('self-attention').some(node => node.id === 'concept:self-attention')).toBe(true);
  expect(readingEntries('concept:self-attention').some(item => item.articleId === 'llm-how-it-works')).toBe(true);
  expect(project('missing:node', 'atlas').nodes).toEqual([]);
  const clipped = project('root:ai', 'atlas', 3);
  expect(clipped.omitted).toBe(graph.stats.domains - 3);
  expect(clipped.edges.every(edge => clipped.nodes.some(node => node.id === edge.source) && clipped.nodes.some(node => node.id === edge.target))).toBe(true);
  for (const node of graph.nodes) {
    const p = project(node.id, 'explore');
    expect(p.nodes.every(item => byId.has(item.id))).toBe(true);
    expect(p.nodes.length).toBeLessThanOrEqual(150);
  }
  const state = { ...gardenHome(), scopeId: 'topic:transformer-mechanisms', nodeId: 'concept:self-attention', display: 'list' as const };
  expect(readRoute(routeUrl(state))).toEqual(state);
  expect(safeGardenReturn('https://evil.example')).toBeUndefined();
  expect(safeGardenReturn('?view=article&article=x')).toBeUndefined();
  expect(readRoute('?view=article&article=llm-how-it-works&return=javascript:alert(1)')).toEqual({ kind: 'article', chapterId: 'llm-how-it-works', returnTo: undefined });
});

for (const width of [320, 390, 768, 1024, 1280, 1440, 1920]) {
  for (const theme of ['light', 'dark']) {
    test(`garden responsive ${width}px ${theme}`, async ({ page }) => {
      const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem('nextchina-theme', value), theme);
      await page.goto('/?view=garden');
      await expect(page.getByRole('heading', { name: 'AI 知识花园', exact: true })).toBeVisible();
      if (width < 640) await expect(page.getByRole('list', { name: '知识节点列表' }).locator(':scope > li')).toHaveCount(graph.stats.domains);
      else { await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout', 'ready'); await expect(page.locator('.react-flow__node')).toHaveCount(graph.stats.domains); }
      await flatViewport(page);
      await page.getByRole('button', { name: '使用列表视图' }).click();
      await page.getByRole('button', { name: '展开 模型与算法', exact: true }).click();
      await page.getByRole('button', { name: '展开 Transformer 内部机制', exact: true }).click();
      await page.getByRole('button', { name: '查看 自注意力', exact: true }).click();
      await expect(page.getByRole('heading', { name: '自注意力', exact: true })).toBeVisible();
      await expect(page.getByText('框架待完善', { exact: true })).toBeVisible();
      await flatViewport(page);
      if (width < 1024) {
        await expect(page.getByRole('dialog', { name: '知识详情：自注意力' })).toBeVisible();
        await expect(page.getByRole('button', { name: '关闭知识详情' })).toBeFocused();
      }
      await page.getByRole('button', { name: '关闭知识详情' }).click();
      await page.getByRole('button', { name: '使用图谱视图' }).click();
      await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout', 'ready');
      await flatViewport(page);
      expect(errors).toEqual([]);
      if ([390, 1440].includes(width)) await page.screenshot({ path: `test-results/garden-${width}-${theme}.png` });
    });
  }
}

for (const width of [390, 1440]) {
  test(`search → read → return → history ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const scripts: string[] = [];
    page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
    await page.goto('/');
    await expect(page.getByRole('button', { name: '进入文档', exact: true })).toBeVisible();
    expect(scripts.some(url => /GardenCanvas|elk\.bundled|@xyflow/.test(url))).toBe(false);
    await page.getByRole('button', { name: '探索知识花园', exact: true }).click();
    await page.getByRole('searchbox', { name: '搜索整个知识花园' }).fill('self-attention');
    await page.getByRole('button', { name: '查看 自注意力', exact: true }).click();
    const gardenURL = page.url();
    await page.getByRole('button', { name: /LLM 的本质.*阅读文章/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: /LLM 的本质/ })).toBeVisible();
    await expect(page).toHaveURL(/view=article/);
    await page.getByRole('button', { name: '返回知识花园', exact: true }).click();
    await expect(page).toHaveURL(gardenURL);
    await expect(page.getByRole('heading', { name: '自注意力', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: '自注意力', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '关闭知识详情' }).click();
    await page.goBack();
    await expect(page.getByRole('heading', { name: '自注意力', exact: true })).toBeVisible();
    await page.goForward();
    await expect(page.getByRole('button', { name: '关闭知识详情' })).toHaveCount(0);
  });
}

test('unknown node and unknown article do not black-screen', async ({ page }) => {
  await page.goto('/?view=garden&node=concept:does-not-exist');
  await expect(page.getByRole('heading', { name: '未找到这个知识节点' })).toBeVisible();
  await page.getByRole('button', { name: '返回全景', exact: true }).click();
  await expect(page.getByRole('heading', { name: '从一个问题开始探索' })).toBeVisible();
  await page.goto('/?view=article&article=missing');
  await expect(page.getByRole('heading', { name: '未找到这篇文章' })).toBeVisible();
});

test('ELK failure retains all nodes in list fallback', async ({ page }) => {
  await page.route(/layout\.worker/, route => route.abort());
  await page.goto('/?view=garden&scope=topic:transformer-mechanisms&display=graph');
  await expect(page.getByRole('button', { name: '用列表继续阅读' })).toBeVisible();
  await page.getByRole('button', { name: '用列表继续阅读' }).click();
  await expect(page.getByRole('button', { name: '查看 自注意力', exact: true })).toBeVisible();
});

test('storage restrictions, increased text, viewport memory and short landscape', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('blocked', 'SecurityError'); };
    Storage.prototype.getItem = () => { throw new DOMException('blocked', 'SecurityError'); };
  });
  await page.goto('/?view=garden&scope=topic:transformer-mechanisms&display=graph');
  await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout', 'ready');
  await page.getByRole('button', { name: '放大图谱' }).click();
  const before = await page.locator('.react-flow__viewport').getAttribute('style');
  await page.getByRole('button', { name: '切换为暗黑模式' }).click();
  await expect(page.locator('.garden-root')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.react-flow__viewport')).toHaveAttribute('style', before!);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole('button', { name: '使用列表视图' }).click();
  await page.addStyleTag({ content: 'html { font-size: 20px; }' });
  await flatViewport(page);
});
