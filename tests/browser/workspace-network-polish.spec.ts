import { test, expect, type Page } from '@playwright/test';
import { graph } from '../../src/features/garden/data';
import { buildKnowledgeIndex } from '../../src/features/workspace/knowledgeIndex';
import { DEFAULT_NETWORK_SETTINGS, SETTINGS_KEY, normalizeNetworkSettings } from '../../src/features/workspace/networkPreferences.js';
const index = buildKnowledgeIndex(graph), groups = graph.groups.map(g => g.id);
const ready = async (page: Page) => expect(page.locator('.og-network-host')).toHaveAttribute('data-layout','ready');
async function choose(page: Page) { const input=page.getByRole('searchbox',{name:'搜索知识网络',exact:true});await input.fill('Softmax');await input.press('Enter');await expect(page.locator('.og-inspector h2')).toContainText('Softmax'); }
async function clean(page: Page) { await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort()); }

test('display preferences validate unknown, obsolete and out-of-range data',()=>{
  expect(normalizeNetworkSettings(null,groups)).toEqual(DEFAULT_NETWORK_SETTINGS);
  expect(normalizeNetworkSettings({nodeSize:NaN,lineWidth:100,labels:-4,groups:['obsolete'],detail:'broken',structure:'yes'},groups)).toMatchObject({nodeSize:1,lineWidth:2,labels:0,groups:null,detail:'all',structure:true});
  expect(normalizeNetworkSettings({groups:[]},groups).groups).toEqual([]);
  expect(normalizeNetworkSettings({groups:[groups[0],groups[0]]},groups).groups).toEqual([groups[0]]);
});

for(const theme of ['dark','light'])test(`click selects in place without a viewport focus rectangle / ${theme}`,async({page})=>{
  await clean(page);await page.setViewportSize({width:1440,height:900});await page.addInitScript(t=>localStorage.setItem('nextchina-theme',t),theme);
  await page.goto('/');await ready(page);await choose(page);await page.getByRole('button',{name:'关闭知识节点简报',exact:true}).click();
  const host=page.locator('.og-network-host'), before=await host.evaluate(el=>({...((el as HTMLElement).dataset)}));
  const svg=await page.locator('.kg-svg').elementHandle();
  await page.locator('.kg-node[data-node-id="concept:softmax"] .kg-dot').click();
  await expect(host).toHaveAttribute('data-selected','concept:softmax');
  await expect(host).toHaveAttribute('data-zoom',before.zoom!);await expect(host).toHaveAttribute('data-camera-x',before.cameraX!);await expect(host).toHaveAttribute('data-camera-y',before.cameraY!);
  expect(await svg!.evaluate(el=>el.isConnected)).toBe(true);
  await expect(page.locator('.kg-svg title,.og-stage [aria-modal="true"]')).toHaveCount(0);
  expect(await host.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('none');
  expect(await page.locator('.kg-svg').evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('none');
  await page.screenshot({path:`test-results/graph-polish-selection-${theme}.png`});
  await host.focus();await page.keyboard.press('ArrowRight');await expect(host).not.toHaveAttribute('data-camera-x',before.cameraX!);
  await page.keyboard.press('Escape');await expect(page.locator('.og-inspector')).toHaveCount(0);
});

test('settings persist and reset while the exact source nodes and edges remain mounted',async({page})=>{
  await clean(page);await page.goto('/');await ready(page);
  const count=await page.locator('.kg-node').count(),edges=await page.locator('.kg-edge').count();
  await page.getByRole('button',{name:'图谱设置',exact:true}).click();
  await page.getByLabel('只显示有资料的节点',{exact:true}).check();
  await expect.poll(()=>page.locator('.kg-node:visible').count()).toBeLessThan(count);
  await page.getByLabel('按知识分区着色',{exact:true}).check();
  await page.getByRole('slider',{name:'节点大小',exact:true}).focus();await page.keyboard.press('End');
  await page.reload();await ready(page);await page.getByRole('button',{name:'图谱设置',exact:true}).click();
  await expect(page.getByLabel('只显示有资料的节点',{exact:true})).toBeChecked();await expect(page.getByRole('slider',{name:'节点大小',exact:true})).toHaveValue('1.8');
  await page.getByRole('button',{name:'恢复默认显示',exact:true}).click();
  await expect(page.locator('.kg-node:visible')).toHaveCount(count);await expect(page.locator('.kg-edge')).toHaveCount(edges);
  await page.getByLabel('显示建议先学',{exact:true}).uncheck();await expect(page.locator('.kg-edge[data-role="before"]:visible')).toHaveCount(0);
  await expect(page.locator('.kg-edge[data-role="before"]')).toHaveCount(index.relations.filter(r=>r.role==='before').length);
  await page.getByLabel('显示专题引用',{exact:true}).uncheck();await expect(page.locator('.kg-edge[data-role="reference"]:visible')).toHaveCount(0);
  await page.getByRole('button',{name:'清空',exact:true}).click();await expect(page.locator('.og-empty')).toBeVisible();
  await page.getByRole('button',{name:'清除筛选',exact:true}).click();await expect(page.locator('.kg-node:visible')).toHaveCount(count);
});

test('learning navigation uses source paths and clearly typed concept connections',async({page})=>{
  await clean(page);await page.goto('/');await ready(page);await page.getByRole('button',{name:'AI 学习导航',exact:true}).click();
  await expect(page.getByRole('button',{name:'知识关联',exact:true})).toHaveCount(0);
  await expect(page.locator('.og-path-toggle')).toHaveCount(graph.learningPaths.length);
  await expect(page.locator('.og-path-steps li')).toHaveCount(graph.learningPaths[0].steps.length);
  await page.getByRole('button',{name:'概念联系',exact:true}).click();
  await page.getByRole('button',{name:'建议先学',exact:true}).click();
  const expected=index.relations.filter(row=>row.role==='before');
  await expect(page.locator('.og-connection')).toHaveCount(Math.min(12,expected.length));
  for(const id of await page.locator('.og-connection').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-relation-id'))))expect(expected.some(r=>r.edge.id===id)).toBe(true);
  await page.getByRole('searchbox',{name:'筛选概念联系'}).fill('不存在的知识 xyz');await expect(page.locator('.og-navigation-empty')).toBeVisible();
  await page.getByRole('button',{name:'清除条件',exact:true}).click();await expect(page.locator('.og-connection').first()).toBeVisible();
  await page.getByRole('button',{name:'学习路线',exact:true}).click();await page.locator('.og-path-steps li button').first().click();
  await expect(page.locator('.og-network-host')).toHaveAttribute('data-selected',graph.learningPaths[0].steps[0]);
});

for(const [width,height] of [[320,740],[390,844],[768,1024],[1024,768],[1440,900],[1920,1080],[844,390]])for(const theme of ['light','dark'])test(`docked tools do not cover or overflow the graph ${width} ${height} ${theme}`,async({page})=>{
  await clean(page);await page.setViewportSize({width,height});await page.addInitScript(t=>localStorage.setItem('nextchina-theme',t),theme);await page.goto('/');await ready(page);
  for(const name of ['AI 学习导航','图谱设置']){
    await page.getByRole('button',{name,exact:true}).click();await expect(page.locator('.og-inspector')).toBeVisible();
    const result=await page.evaluate(()=>{const g=document.querySelector('.og-graph-layer')!.getBoundingClientRect(),p=document.querySelector('.og-inspector')!.getBoundingClientRect();return{g:{x:g.x,y:g.y,w:g.width,h:g.height},p:{x:p.x,y:p.y,w:p.width,h:p.height},overflow:document.documentElement.scrollWidth-innerWidth,panelOverflow:document.querySelector('.og-inspector')!.scrollWidth-document.querySelector('.og-inspector')!.clientWidth};});
    expect(result.g.w).toBeGreaterThan(130);expect(result.g.h).toBeGreaterThan(130);
    expect(result.p.x>=result.g.x+result.g.w-1||result.p.y>=result.g.y+result.g.h-1).toBe(true);
    expect(result.overflow).toBeLessThanOrEqual(1);expect(result.panelOverflow).toBeLessThanOrEqual(1);
    await expect(page.locator('.og-stage [inert],.og-stage [aria-modal="true"]')).toHaveCount(0);
    if([390,1440].includes(width))await page.screenshot({path:`test-results/graph-polish-${name==='图谱设置'?'settings':'navigation'}-${width}-${theme}.png`});
  }
});

test('invalid or blocked optional preference storage cannot blank the graph',async({page})=>{
  await clean(page);await page.addInitScript(key=>localStorage.setItem(key,'{invalid json'),SETTINGS_KEY);await page.goto('/');await ready(page);
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('blocked')};Storage.prototype.setItem=()=>{throw new Error('blocked')};});
  await page.reload();await ready(page);await page.getByRole('button',{name:'图谱设置',exact:true}).click();await page.getByLabel('显示目录归属',{exact:true}).uncheck();
  await expect(page.locator('.kg-edge[data-role="structure"]:visible')).toHaveCount(0);
});

test.describe('coarse pointer gestures',()=>{
  test.use({hasTouch:true,viewport:{width:390,height:844}});
  test('pinch and cancellation never become a node click',async({page})=>{
    await clean(page);await page.goto('/');await ready(page);const host=page.locator('.og-network-host'),box=(await host.boundingBox())!,before=Number(await host.getAttribute('data-zoom'));
    const session=await page.context().newCDPSession(page),x=box.x+box.width/2,y=box.y+box.height/2;
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-30,y,id:1},{x:x+30,y,id:2}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-60,y,id:1},{x:x+60,y,id:2}]});
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect.poll(async()=>Number(await host.getAttribute('data-zoom'))).toBeGreaterThan(before);
    await expect(host).toHaveAttribute('data-selected','');await expect(page.locator('.og-inspector')).toHaveCount(0);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
    await expect(host).toHaveAttribute('data-selected','');
  });
});
