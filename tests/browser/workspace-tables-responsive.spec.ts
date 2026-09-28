import {test,expect,type Page} from '@playwright/test';

const blockExternal = (page:Page) => page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
async function ready(page:Page) {
  await expect(page.locator('.md-table-region').first()).toHaveAttribute('data-measured','true');
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));});
}
async function assertValues(page:Page) {
  const results=await page.locator('tbody td[data-column-kind="numeric"], tbody td[data-column-kind="date"]').evaluateAll(cells=>cells.map(cell=>{
    const range=document.createRange();range.selectNodeContents(cell);
    return {value:cell.textContent, lines:new Set([...range.getClientRects()].filter(r=>r.width>0).map(r=>Math.round(r.y))).size,
      contentOverflow:cell.scrollWidth-cell.clientWidth};
  }));
  expect(results.length).toBeGreaterThan(0);
  for (const value of results) { expect(value.lines, value.value??'value').toBe(1);expect(value.contentOverflow).toBeLessThanOrEqual(1); }
}
for(const width of [320,390,768,1024,1440,1920,2560]) for(const theme of ['light','dark']) {
  test(`native table widths ${width} ${theme}`,async({page})=>{
    await blockExternal(page);await page.setViewportSize({width,height:960});
    await page.addInitScript(t=>localStorage.setItem('nextchina-theme',t),theme);
    for(const id of ['aa-intelligence','model-api-prices']) {
      await page.goto(`/?view=article&article=${id}`);await ready(page);
      await assertValues(page);
      const metrics=await page.evaluate(()=>{
        const body=document.querySelector('.markdown-body')!.getBoundingClientRect();
        const heading=document.querySelector('.ws-document-heading')!.getBoundingClientRect();
        const frame=document.querySelector('.md-table-region')!.getBoundingClientRect();
        return {delta:Math.abs(heading.width-frame.width),left:Math.abs(body.left-frame.left),
          width:frame.width,host:document.querySelector('.ws-scroll')!.scrollWidth-document.querySelector('.ws-scroll')!.clientWidth,
          page:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          fixed:document.querySelector('table')!.getAttribute('style')??'',cols:document.querySelectorAll('colgroup').length};
      });
      expect(metrics.delta).toBeLessThanOrEqual(1);expect(metrics.left).toBeLessThanOrEqual(1);
      expect(metrics.width).toBeLessThanOrEqual(1120);expect(metrics.host).toBeLessThanOrEqual(1);expect(metrics.page).toBeLessThanOrEqual(1);
      expect(metrics.fixed).not.toContain('width');expect(metrics.cols).toBe(0);
      if ([390,1920].includes(width)) {
        await page.locator('.md-table-region').first().scrollIntoViewIfNeeded();
        await page.screenshot({path:`test-results/native-table-${id}-${width}-${theme}.png`});
      }
    }
  });
}
for(const fontSize of [16,20,24]) test(`long values and RTL survive intrinsic sizing ${fontSize}`,async({page},info)=>{
  test.skip(info.project.name.includes('production'),'Fixture is development-only; real document cases run in production.');
  await blockExternal(page);await page.setViewportSize({width:390,height:844});
  await page.goto('/tests/browser/fixture.html?sample=responsive-tables');
  await page.addStyleTag({content:`html {font-size:${fontSize}px} html,body,#root {overflow-x:visible!important}`});
  await ready(page);await assertValues(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  const frame=page.locator('.md-table-region').first(),scroll=frame.locator('.md-table-scroll');
  await frame.scrollIntoViewIfNeeded();await expect(frame).toHaveAttribute('data-overflow','true');
  await frame.getByRole('button',{name:'表格向右滚动'}).click();
  await expect.poll(()=>scroll.evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);
  await page.addStyleTag({content:'.md-table-scroll {direction:rtl}'});
  await scroll.evaluate(e=>{e.scrollLeft=0;e.dispatchEvent(new Event('scroll'));});
  await expect(frame.getByRole('button',{name:'表格向左滚动'})).toBeEnabled();
  await frame.getByRole('button',{name:'表格向左滚动'}).click();
  await expect.poll(()=>scroll.evaluate(e=>e.scrollLeft)).toBeLessThan(0);
});
