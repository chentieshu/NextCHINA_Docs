import { test, expect, type Page } from '@playwright/test';
import { byId, childrenById, readingEntries, graph } from '../../src/features/garden/data';
import { resourcesUnder, resourceTarget } from '../../src/features/garden/hub-data';
import { project } from '../../src/features/garden/projection';
import { gardenHome, readRoute, routeUrl, type GardenRoute } from '../../src/routing';

// Use the application's canonical URL encoding; an explicit default is not state.
const at = (scope:string, display:GardenRoute['display']='auto') => `/${routeUrl({...gardenHome(),scopeId:scope,display})}`;
async function bounds(page:Page) {
  const box=await page.evaluate(()=>{
    const host=document.querySelector('.hub-content') as HTMLElement|null;
    return {width:document.documentElement.scrollWidth,available:document.documentElement.clientWidth,
      height:document.documentElement.scrollHeight,viewport:innerHeight,host:host?host.scrollWidth-host.clientWidth:0,
      shadows:[...document.querySelectorAll('.garden-root *')].filter(e=>{const s=getComputedStyle(e);return s.boxShadow!=='none'||s.textShadow!=='none'||s.filter.includes('drop-shadow');}).length};
  });
  expect(box.width).toBeLessThanOrEqual(box.available+1);
  expect(box.height).toBeLessThanOrEqual(box.viewport+1);
  expect(box.host).toBeLessThanOrEqual(1);
  expect(box.shadows).toBe(0);
  await expect(page.locator('.garden-root select,.garden-root details,.garden-root summary')).toHaveCount(0);
}
test('LLM is a recursive hub; shared concepts and resources are not cloned',()=>{
  expect(childrenById.get('hub:llm')).toHaveLength(12);
  expect(byId.get('branch:llm:mechanisms/attention/qkv')?.conceptRefs).toEqual(['concept:qkv']);
  expect(readingEntries('branch:llm:mechanisms/attention/qkv')).toEqual([]);
  expect(graph.nodes.filter(n=>n.id==='concept:softmax')).toHaveLength(1);
  expect(resourceTarget('branch:llm:rankings','arena-text')).toBe('branch:llm:rankings/text-preference');
  expect(resourcesUnder('hub:llm').some(r=>r.articleId==='model-api-prices')).toBe(true);
  expect(project('branch:llm:mechanisms/attention','atlas').nodes).toHaveLength(8);
  expect(project('branch:llm:mechanisms/attention/qkv','atlas').nodes.some(n=>n.id==='concept:qkv')).toBe(true);
  const state=readRoute('?view=garden&scope=branch%3Allm%3Apricing%2Foffers&display=auto');
  expect(readRoute(routeUrl(state))).toEqual(state);
  expect(routeUrl(state)).not.toContain('display=auto');
});
for(const width of [320,390,768,1024,1280,1440]) for(const theme of ['light','dark']) {
  test(`topic hub ${width}px ${theme}`,async({page})=>{
    const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width,height:900});
    await page.addInitScript(value=>localStorage.setItem('nextchina-theme',value),theme);
    await page.goto(at('hub:llm'));
    await expect(page.locator('.hub-branch-card')).toHaveCount(12);
    await expect(page.locator('.hub-resource-reader')).toHaveCount(0);
    await bounds(page);
    if([390,1440].includes(width)) await page.screenshot({path:`test-results/hub-llm-${width}-${theme}.png`});
    await page.locator('[data-branch-id="branch:llm:mechanisms"]').click();
    await page.locator('[data-branch-id="branch:llm:mechanisms/attention"]').click();
    await expect(page.locator('.hub-branch-card')).toHaveCount(7);
    await page.locator('[data-branch-id="branch:llm:mechanisms/attention/qkv"]').click();
    await expect(page.locator('.hub-empty')).toContainText('独立正文尚待完善');
    await page.locator('.hub-reference-links').getByRole('button',{name:/Query、Key、Value/}).click();
    await expect(page.getByRole('heading',{name:'Query、Key、Value',exact:true})).toBeVisible();
    await page.getByRole('button',{name:'关闭知识详情'}).click();
    await bounds(page);
    await page.reload();
    await expect(page.locator('.hub-content')).toHaveAttribute('data-branch','mechanisms/attention/qkv');
    expect(errors).toEqual([]);
  });
}
for(const id of ['arena-text','aa-intelligence','terminal-bench','model-api-prices']) {
  test(`canonical resource ${id} renders in topic and returns from article`,async({page})=>{
    await page.setViewportSize({width:390,height:844});
    const branch=id==='model-api-prices'?'pricing/offers':id==='arena-text'?'rankings/text-preference':id==='aa-intelligence'?'rankings/composite':'rankings/system-results';
    await page.goto(at(`branch:llm:${branch}`));
    const reader=page.locator(`[data-resource-id="${id}"]`);
    await expect(reader).toBeVisible();
    expect(await reader.locator('table').count()).toBeGreaterThan(0);
    await expect(reader).toContainText('未重新核验');
    if(id==='terminal-bench') await expect(reader).toContainText('不是裸模型能力排名');
    await bounds(page);
    const original=page.url();
    await page.getByRole('button',{name:'在文档阅读器中打开',exact:true}).click();
    await expect(page).toHaveURL(/view=article/);
    await page.getByRole('button',{name:'返回知识花园',exact:true}).click();
    await expect(page).toHaveURL(original);
    await expect(page.locator(`[data-resource-id="${id}"]`)).toBeVisible();
  });
}
test('graph and topic branches share IDs, nodes and article resources',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(at('hub:llm','graph'));
  await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout','ready');
  await page.getByRole('button',{name:'使用列表视图'}).click();
  await expect(page.locator('.hub-branch-card')).toHaveCount(12);
  await page.locator('[data-branch-id="branch:llm:mechanisms"]').click();
  await page.locator('[data-branch-id="branch:llm:mechanisms/attention"]').click();
  await page.getByRole('button',{name:'使用图谱视图'}).click();
  await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout','ready');
  await page.getByRole('button',{name:'查看 输入 X 与投影 Q/K/V',exact:true}).click();
  await expect(page.locator('.hub-content')).toHaveAttribute('data-branch','mechanisms/attention/qkv');
});
test('products, source records and the Apple tutorial have distinct topic placements',async({page})=>{
  await page.setViewportSize({width:390,height:900});
  await page.goto(at('branch:llm:applications/assistants'));
  await expect(page.locator('[data-resource-id="catalog-text"]')).toBeVisible();
  await page.goto(at('branch:llm:models'));
  await expect(page.getByRole('region',{name:'模型来源记录表'})).toBeVisible();
  await expect(page.locator('.hub-model-index')).toContainText('不是已核验的统一模型注册库');
  await bounds(page);
  await page.goto(at('branch:video:tutorials'));
  await expect(page.locator('[data-resource-link="apple-style-premium-product-video"]')).toBeVisible();
  await page.goto(at('branch:llm:tutorials'));
  await expect(page.locator('[data-resource-link="apple-style-premium-product-video"]')).toHaveCount(0);
});
test('old LLM concept entry leads to the hub without replacing the original article',async({page})=>{
  await page.goto('/?view=garden&scope=topic:language-modeling&node=concept:llm&display=list');
  await page.getByRole('button',{name:'进入 LLM · 大语言模型 专题',exact:true}).click();
  await expect(page.locator('.hub-branch-card')).toHaveCount(12);
  await page.locator('[data-branch-id="branch:llm:orientation"]').click();
  await expect(page.locator('[data-resource-link="llm-how-it-works"]')).toBeVisible();
  await page.locator('[data-resource-link="llm-how-it-works"]').click();
  await expect(page.getByRole('heading',{level:1,name:/LLM 的本质/})).toBeVisible();
});
test('unknown branch, large text and short landscape remain recoverable',async({page})=>{
  await page.goto(at('branch:llm:unknown'));
  await expect(page.getByRole('heading',{name:'未找到这个知识节点'})).toBeVisible();
  await page.getByRole('button',{name:'返回全景',exact:true}).click();
  await page.getByRole('button',{name:'LLM 专题',exact:true}).click();
  await page.setViewportSize({width:844,height:390});
  await page.addStyleTag({content:'html {font-size:20px}'});
  await bounds(page);
  await expect(page.locator('.hub-content')).toBeVisible();
});
test('desktop outline can collapse an active ancestor',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto(at('branch:llm:mechanisms/attention/qkv'));
  const toggle=page.getByRole('button',{name:'切换目录 Attention 的逐步计算',exact:true});
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
});
