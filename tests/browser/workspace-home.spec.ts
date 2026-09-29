import { test, expect, type Page } from '@playwright/test';
import { graph } from '../../src/features/garden/data';
import { buildKnowledgeIndex } from '../../src/features/workspace/knowledgeIndex';
const index = buildKnowledgeIndex(graph);
async function ready(page: Page) {
  await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout', 'ready');
  await expect(page.locator('.ws-reading-header,.ws-tab-header,[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.workspace')).toHaveCount(1);
}
async function choose(page: Page, query: string) {
  const search = page.getByRole('searchbox', { name: '搜索知识网络' });
  await search.fill(query); await search.press('ArrowDown'); await page.keyboard.press('Enter');
}

test('every canonical node and every semantic edge is reachable without invented prerequisite edges', () => {
  expect(index.issues).toEqual([]);
  const source = graph.edges.filter(edge => edge.type !== 'browse_child');
  expect(index.relations.map(row => row.edge.id).sort()).toEqual(source.map(edge => edge.id).sort());
  const represented = [...index.internal, ...index.bundles.flatMap(bundle => bundle.relations)];
  expect(represented.map(row => row.edge.id).sort()).toEqual(source.map(edge => edge.id).sort());
  expect(new Set(represented.map(row => row.edge.id)).size).toBe(source.length);
  expect(index.groups.flatMap(group => group.domains).length).toBe(graph.nodes.filter(node => node.kind === 'domain').length);
  for (const node of graph.nodes.filter(node => ['domain','topic','concept','hub','branch'].includes(node.kind))) {
    expect(index.groupOf(node.id), node.id).toBeTruthy();
    expect(index.search(node.id).some(result => result.id === node.id)).toBe(true);
    for (const { edge } of index.adjacency.get(node.id) ?? []) expect([edge.source, edge.target]).toContain(node.id);
  }
  expect(index.relations.filter(row => row.role === 'before').map(row => row.edge.id).sort()).toEqual(graph.edges.filter(edge => edge.type === 'recommended_before').map(edge => edge.id).sort());
  for (const { edge, role } of index.relations) {
    expect(index.adjacency.get(edge.source)?.some(row => row.edge.id === edge.id)).toBe(true);
    expect(index.adjacency.get(edge.target)?.some(row => row.edge.id === edge.id)).toBe(true);
    if (role === 'reference') {
      const owner = index.byId.get(edge.source)!;
      expect([...(owner.conceptRefs ?? []), ...(owner.hubRefs ?? [])]).toContain(edge.target);
    }
  }
});

test('resource coverage never upgrades descendant/reference content into a direct explanation', () => {
  for (const node of graph.nodes) {
    const own = new Set(index.ownResources(node.id).map(ref => ref.articleId));
    const resources = index.resourcesFor(node.id);
    expect(new Set(resources.map(ref => ref.articleId)).size).toBe(resources.length);
    for (const ref of resources) {
      if (ref.scope === 'own') { expect(ref.fromId).toBe(node.id); expect(own.has(ref.articleId)).toBe(true); }
      if (ref.scope === 'descendant') expect(index.descendants(node.id).some(child => child.id === ref.fromId)).toBe(true);
    }
  }
});

for (const width of [320,390,768,1024,1280,1440,1920]) for (const theme of ['light','dark']) {
  test(`readable macro atlas ${width}px ${theme}`, async ({page}) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width, height: 900});
    await page.addInitScript(value => localStorage.setItem('nextchina-theme', value), theme);
    await page.goto('/'); await ready(page);
    await expect(page.getByRole('heading', {name: '宏观关系图', exact: true})).toBeVisible();
    await expect(page.locator('.atlas-area')).toHaveCount(graph.groups.length);
    await expect(page.locator('.ws-macro-home')).toHaveAttribute('data-density', 'macro');
    const bounds = await page.evaluate(() => ({width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, viewport: innerWidth, viewHeight: innerHeight, map: document.querySelector('.atlas-map')!.getBoundingClientRect().height}));
    expect(bounds.width).toBeLessThanOrEqual(bounds.viewport + 1);
    expect(bounds.height).toBeLessThanOrEqual(bounds.viewHeight + 1);
    expect(bounds.map).toBeGreaterThan(250);
    const font = await page.locator('.atlas-domain-button strong').first().evaluate(node => parseFloat(getComputedStyle(node).fontSize));
    expect(font).toBeGreaterThanOrEqual(14);
    if (width < 960) {
      await page.getByRole('button', {name:'打开文档侧栏', exact:true}).click();
      await expect(page.getByRole('dialog', {name:'文档侧栏'})).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', {name:'打开文档侧栏', exact:true})).toBeFocused();
    }
    if ([390,1440].includes(width)) await page.screenshot({path: `test-results/atlas-${width}-${theme}.png`});
    expect(errors).toEqual([]);
  });
}

test('selection preserves the map DOM and resolves exact links across reload and history', async ({page}) => {
  await page.goto('/'); await ready(page);
  const board = await page.locator('.atlas-board').elementHandle();
  const before = await page.locator('.atlas-area').evaluateAll(nodes => nodes.map(node => [node.getAttribute('data-area'), (node as HTMLElement).offsetLeft, (node as HTMLElement).offsetTop]));
  await choose(page, 'Softmax');
  await expect(page.locator('.atlas-inspector h2')).toContainText('Softmax');
  await expect.poll(() => new URL(page.url()).searchParams.get('node')).toBe('concept:softmax');
  expect(await board?.evaluate(node => node.isConnected)).toBe(true);
  expect(await page.locator('.atlas-area').evaluateAll(nodes => nodes.map(node => [node.getAttribute('data-area'), (node as HTMLElement).offsetLeft, (node as HTMLElement).offsetTop]))).toEqual(before);
  await expect(page.locator('.ws-macro-home')).toHaveAttribute('data-density', 'macro');
  await page.reload(); await expect(page.locator('.atlas-inspector h2')).toContainText('Softmax');
  const resource = page.locator('[data-resource-id]').first();
  await expect(resource).toBeVisible(); await resource.click();
  await expect(page.locator('.markdown-body')).toBeVisible();
  await page.getByRole('button', {name:'返回知识地图', exact:true}).click();
  await expect(page.locator('.atlas-inspector h2')).toContainText('Softmax');
  await page.goBack(); await expect(page.locator('.markdown-body')).toBeVisible();
  await page.goBack(); await expect(page.locator('.atlas-inspector h2')).toContainText('Softmax');
  await page.screenshot({path:'test-results/atlas-return-loop.png'});
});

test('mobile inspector traps focus and restores usable navigation on close', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await page.goto('/'); await ready(page);
  await choose(page, 'Softmax');
  await expect(page.getByRole('dialog', {name:'知识节点简报'})).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.locator('.atlas-inspector').evaluate(node => node.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', {name:'知识节点简报'})).toHaveCount(0);
  await expect(page.locator('.ws-ribbon')).not.toHaveAttribute('inert','');
  await page.getByRole('button', {name:'打开文档侧栏', exact:true}).click();
  await expect(page.getByRole('dialog', {name:'文档侧栏'})).toBeVisible();
});

test('macro aggregation exposes original evidence and works without layout workers', async ({page}) => {
  const workers: string[] = []; page.on('request', request => { if (/layout\.worker/.test(request.url())) workers.push(request.url()); });
  await page.route(/layout\.worker/, route => route.abort());
  await page.goto('/'); await ready(page);
  await page.getByRole('button', {name:'知识关联', exact:true}).click();
  await expect(page.getByRole('searchbox', {name:'筛选知识关联'})).toBeVisible();
  await page.getByRole('searchbox', {name:'筛选知识关联'}).fill('Softmax');
  await expect(page.locator('.atlas-relation').first()).toBeVisible();
  await expect(page.locator('.atlas-relation').first()).toContainText('Softmax');
  expect(workers).toEqual([]);
  await page.getByRole('button', {name:'用列表继续阅读'}).click();
  await expect(page.locator('[data-document="overview"] .markdown-body')).toBeVisible();
});
