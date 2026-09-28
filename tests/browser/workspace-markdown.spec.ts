import { test, expect, type Page } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tableLayoutFromText, allocateTableColumns, measureTable } from '../../src/utils/table-layout';
const published: string[] = JSON.parse(readFileSync('content/spaces.json','utf8')).spaces.flatMap((s: {chapterIds:string[]})=>s.chapterIds);
const at = (id: string) => `/?view=article&article=${id}`;
const offline = (page: Page) => page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
async function stable(page: Page) {
  await expect(page.locator('.markdown-body').first()).toBeVisible();
  await expect.poll(() => page.locator('.md-table-region[data-measured="false"]').count()).toBe(0);
}
async function geometry(page: Page) {
  return page.evaluate(() => ({
    page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    body: document.documentElement.scrollHeight - innerHeight,
    host: (()=>{const e=document.querySelector('.ws-scroll');return e?e.scrollWidth-e.clientWidth:0;})(),
    tables: [...document.querySelectorAll('.md-table-region')].map(region=>{
      const scroll=region.querySelector('.md-table-scroll')!,table=region.querySelector('table')!;
      return { columns: Number((region as HTMLElement).dataset.columns), viewport:scroll.clientWidth,
        width:table.getBoundingClientRect().width, overflow:scroll.scrollWidth-scroll.clientWidth,
        widthSum: [...table.querySelectorAll('thead tr:first-child th')].reduce((sum,cell)=>sum+cell.getBoundingClientRect().width,0),
        rowHeight:table.querySelector('tbody tr')?.getBoundingClientRect().height??0 };
    }),
    shadows:[...document.querySelectorAll('.workspace *')].filter(e=>{const s=getComputedStyle(e);return s.boxShadow!=='none'||s.textShadow!=='none'||s.filter.includes('drop-shadow');}).length
  }));
}
test('table allocation reserves text room without duplicating KaTeX or parsing Markdown twice',()=>{
  const layout=tableLayoutFromText(['序位','模型说明','日期','成绩'],[['1','x'.repeat(60),'2026-09-28','95.2']]);
  for (const width of [18,28,50,80,120]) {
    const actual=allocateTableColumns(layout,width),minimum=layout.tracks.reduce((n,t)=>n+t.minimum,0);
    expect(actual.reduce((a,b)=>a+b,0)).toBeCloseTo(Math.max(width,minimum),8);
    actual.forEach((n,i)=>expect(n).toBeGreaterThanOrEqual(layout.tracks[i].minimum-1e-8));
    expect(actual[1]).toBeGreaterThan(actual[0]);
  }
  const pair=tableLayoutFromText(['a','b'],[['x'.repeat(80),'y'.repeat(80)]]);
  expect(allocateTableColumns(pair,18).reduce((a,b)=>a+b,0)).toBeCloseTo(18);
  expect(allocateTableColumns(pair,NaN).every(Number.isFinite)).toBe(true);
  const text=(value:string)=>({type:'text',value});
  const math={type:'element',tagName:'span',properties:{className:['katex']},children:[{type:'element',tagName:'annotation',children:[text('x+y')]},{type:'element',tagName:'span',children:[text('duplicated'.repeat(80))]}]};
  const tree={type:'element',tagName:'table',children:[{type:'element',tagName:'tr',children:[{type:'element',tagName:'th',children:[text('公式')]}]},{type:'element',tagName:'tr',children:[{type:'element',tagName:'td',children:[math]}]}]};
  expect(measureTable(tree)).toEqual(tableLayoutFromText(['公式'],[['x+y']]));
});

for (const width of [390,1440,1920]) for (const theme of ['light','dark']) {
  test(`all ${published.length} documents / ${width}px / ${theme}`,async({page},info)=>{
    await offline(page); await page.setViewportSize({width,height:960});
    await page.addInitScript(t=>localStorage.setItem('nextchina-theme',t),theme);
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const report=[];
    for(const id of published){
      await page.goto(at(id),{waitUntil:'domcontentloaded'}); await stable(page);
      const result=await geometry(page);report.push({id,...result});
      expect(result.page,`${id}: page width`).toBeLessThanOrEqual(1);
      expect(result.body,`${id}: viewport height`).toBeLessThanOrEqual(1);
      expect(result.host,`${id}: reading host width`).toBeLessThanOrEqual(1);expect(result.shadows).toBe(0);
      for(const table of result.tables){
        expect(Math.abs(table.width-table.widthSum)).toBeLessThan(2);
        expect(table.width).toBeGreaterThanOrEqual(table.viewport-1);
        if(table.columns<=2)expect(table.overflow).toBeLessThanOrEqual(1);
      }
      if(id==='aa-intelligence'){
        await page.locator('.md-table-region').first().scrollIntoViewIfNeeded();
        await expect(page.locator('.md-provider-logo[data-failed="true"]').first()).toBeVisible();
        if(width>=1440)expect((await geometry(page)).tables[0].rowHeight).toBeLessThan(80);
      }
    }
    expect(errors).toEqual([]);
    const file=info.outputPath(`layout-${width}-${theme}.json`);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,JSON.stringify(report,null,2));
  });
}
for(const width of [320,768,1024,1440,2560]) test(`table responds to live panels and zoom / ${width}px`,async({page})=>{
  await offline(page);await page.setViewportSize({width,height:900});await page.goto(at('model-api-prices'));await stable(page);
  const reader=page.locator('.ws-reading-column');
  if(width>=1440)expect((await reader.boundingBox())!.width).toBeGreaterThan(820);
  for(const expanded of [false,true]){
    if(width>=960){
      const current=await page.locator('.workspace').getAttribute('data-sidebar');
      if(current!==String(expanded))await page.getByRole('button',{name:expanded?'打开文档侧栏':'收起文档侧栏',exact:true}).click();
    }
    await stable(page);
    const result=await geometry(page);expect(result.host).toBeLessThanOrEqual(1);
    await page.addStyleTag({content:'html {font-size:20px}'});await stable(page);expect((await geometry(page)).host).toBeLessThanOrEqual(1);
    await page.addStyleTag({content:'html {font-size:16px}'});
  }
  if(width>=1280){await page.getByRole('button',{name:'显示关联资料',exact:true}).click();await stable(page);expect((await geometry(page)).host).toBeLessThanOrEqual(1);}
  await page.setViewportSize({width:390,height:844});await stable(page);
  const scroll=page.locator('.md-table-scroll').first();await scroll.scrollIntoViewIfNeeded();
  await expect(page.locator('.md-table-tools').first()).toBeVisible();
  await page.getByRole('button',{name:'表格向右滚动',exact:true}).first().click();
  await expect.poll(()=>scroll.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
  await page.setViewportSize({width:1920,height:960});
  await expect.poll(()=>page.locator('.md-table-region').first().getAttribute('data-overflow')).toBe('false');
  await expect(page.locator('.md-table-tools')).toHaveCount(0);
});

test('local themes, controls, broken logos and model records share the renderer contract',async({page})=>{
  await offline(page);await page.setViewportSize({width:1440,height:960});
  await page.goto(at('aa-intelligence'));await stable(page);
  await page.locator('.md-table-region').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.md-provider-logo[data-failed="true"]').first()).toBeVisible();
  await page.screenshot({path:'test-results/markdown-table-desktop-light.png'});
  const before=await page.locator('table thead').first().evaluate(e=>getComputedStyle(e.firstElementChild!.firstElementChild!).backgroundColor);
  await page.getByRole('button',{name:'切换为暗黑模式',exact:true}).click();
  await expect(page.locator('.markdown-dark')).toBeVisible();
  const after=await page.locator('table thead').first().evaluate(e=>getComputedStyle(e.firstElementChild!.firstElementChild!).backgroundColor);
  expect(after).not.toBe(before);await page.screenshot({path:'test-results/markdown-table-desktop-dark.png'});
  await page.goto(at('llm-attention-calculation'));await stable(page);
  const source=page.locator('.md-code-actions');await source.scrollIntoViewIfNeeded();
  expect(await source.locator('button').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeLessThan(14);
  await page.goto('/?view=garden&scope=branch%3Allm%3Amodels');
  await expect(page.getByRole('region',{name:'模型来源记录表'})).toBeVisible();
  expect(await page.locator('.hub-model-index .md-table-region').count()).toBe(1);
  expect((await geometry(page)).host).toBeLessThanOrEqual(1);
});
