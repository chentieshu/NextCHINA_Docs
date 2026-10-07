import { mapNodeEligible } from '../../src/features/garden/graphContract.js';
import { test, expect, type Page } from '@playwright/test';
import { graph } from '../../src/features/garden/data';
import { buildKnowledgeIndex } from '../../src/features/workspace/knowledgeIndex';
const index = buildKnowledgeIndex(graph);
const displayNodes = graph.nodes.filter(n => !['root','group','path','document'].includes(n.kind));
const visibleByDefault = displayNodes.filter(node => mapNodeEligible(node, graph.edges.filter(edge => edge.source === node.id || edge.target === node.id)));
async function ready(page: Page) { await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout','ready'); }
async function choose(page: Page, text: string) { const search = page.getByRole('searchbox',{name:'搜索知识网络',exact:true}); await search.fill(text); await search.press('ArrowDown'); await page.keyboard.press('Enter'); }

test('all source semantic edges remain in the canonical bidirectional index', () => {
  expect(index.issues).toEqual([]);
  const ids = graph.edges.filter(e => e.type !== 'browse_child').map(e => e.id).sort();
  expect(index.relations.map(r => r.edge.id).sort()).toEqual(ids);
  expect([...index.internal,...index.bundles.flatMap(b => b.relations)].map(r => r.edge.id).sort()).toEqual(ids);
  for (const row of index.relations) for (const id of [row.edge.source,row.edge.target]) expect(index.adjacency.get(id)?.some(r=>r.edge.id===row.edge.id)).toBe(true);
  expect(index.relations.filter(r=>r.role==='before').length).toBe(graph.edges.filter(e=>e.type==='recommended_before').length);
});
for (const width of [320,390,768,1024,1440,1920]) for (const theme of ['dark','light']) {
  test(`network rather than cards, ${width}px ${theme}`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.addInitScript(value=>localStorage.setItem('nextchina-theme',value),theme);
    await page.goto('/');await ready(page);
    await expect(page.locator('.kg-node')).toHaveCount(displayNodes.length);
    await expect(page.locator('.atlas-area,.atlas-board,.ws-macro-heading,[role="tab"]')).toHaveCount(0);
    const bounds=await page.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,vw:innerWidth,vh:innerHeight}));
    expect(bounds.w).toBeLessThanOrEqual(bounds.vw+1);expect(bounds.h).toBeLessThanOrEqual(bounds.vh+1);
    if ([390,1440].includes(width)) await page.screenshot({path:`test-results/obsidian-${width}-${theme}.png`});
  });
}

test('hover, selection, note reading and return retain the same canonical graph',async({page})=>{
  await page.goto('/');await ready(page);
  const svg=await page.locator('.kg-svg').elementHandle();
  await choose(page,'Softmax');
  await expect(page.locator('.og-inspector h2')).toContainText('Softmax');
  await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id','concept:softmax');
  expect(await svg?.evaluate(el=>el.isConnected)).toBe(true);
  const count=await page.locator('.kg-node').count();
  await page.reload();await ready(page);await expect(page.locator('.og-inspector h2')).toContainText('Softmax');
  await page.locator('.og-read-button').click();await expect(page.locator('.markdown-body')).toBeVisible();
  await page.getByRole('button',{name:'返回知识地图',exact:true}).click();await ready(page);
  await expect(page.locator('.og-inspector h2')).toContainText('Softmax');await expect(page.locator('.kg-node')).toHaveCount(count);
});

test('native pan and zoom do not mutate nodes or relationships',async({page})=>{
  await page.goto('/');await ready(page);
  const count=await page.locator('.kg-node').count();
  const zoom=await page.locator('.og-network-host').getAttribute('data-zoom');
  await page.getByRole('button',{name:'放大图谱',exact:true}).click();
  await expect(page.locator('.og-network-host')).not.toHaveAttribute('data-zoom',zoom!);
  await page.getByRole('button',{name:'图谱设置',exact:true}).click();
  await page.getByLabel('只显示有资料的节点',{exact:true}).check();
  await expect(page.locator('.kg-node')).toHaveCount(count);
  expect(await page.locator('.kg-node:visible').count()).toBeLessThan(count);
  await page.getByRole('button',{name:'恢复默认显示',exact:true}).click();
  await expect(page.locator('.kg-node:visible')).toHaveCount(visibleByDefault.length);
});

test('mobile note is docked without a blackout or focus trap',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await ready(page);await choose(page,'Softmax');
  const note=page.getByRole('complementary',{name:'知识节点简报'});
  await expect(note).toBeVisible();
  await expect(page.locator('.og-stage [aria-modal="true"],.og-stage [inert]')).toHaveCount(0);
  const drawing=await page.locator('.og-network-host').boundingBox(),panel=await note.boundingBox();
  expect(drawing!.height).toBeGreaterThan(135);expect(panel!.y).toBeGreaterThanOrEqual(drawing!.y+drawing!.height-1);
  await page.getByRole('button',{name:'关闭知识节点简报',exact:true}).click();await expect(note).toHaveCount(0);
  await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();await expect(page.getByRole('dialog',{name:'文档侧栏'})).toBeVisible();
});
