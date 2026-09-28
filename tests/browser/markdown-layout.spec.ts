import { test, expect } from '@playwright/test';
for(const width of [320,768,1440]) for(const theme of ['light','dark']) {
  test(`GFM fixture with loaded/failed images and local theme / ${width} / ${theme}`,async({page})=>{
    await page.setViewportSize({width,height:960});
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.hostname==='127.0.0.1')return route.continue();
      if(url.hostname==='assets.example.test')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#999"/></svg>'});
      return route.abort();
    });
    await page.goto(`/tests/browser/fixture.html?sample=tables&theme=${theme}`);
    await expect(page.locator('.md-table-region')).toHaveCount(6);
    for(const region of await page.locator('.md-table-region').all()){
      await region.scrollIntoViewIfNeeded();
      await expect(region).toHaveAttribute('data-measured','true');
      const table=region.locator('table');
      expect(await table.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(100);
      if(Number(await region.getAttribute('data-columns'))<=2)await expect(region).toHaveAttribute('data-overflow','false');
    }
    await page.locator('.md-provider-logo').scrollIntoViewIfNeeded();
    await expect(page.locator('.md-provider-logo')).toHaveAttribute('data-failed','true');
    expect((await page.locator('.md-provider-logo').boundingBox())!.height).toBeLessThan(24);
    await expect(page.locator('.katex-error')).toHaveCount(0);
    expect(await page.locator('table th').filter({hasText:'成绩'}).first().evaluate(e=>getComputedStyle(e).textAlign)).toBe('right');
    const normal=page.locator('.md-image').first();await normal.scrollIntoViewIfNeeded();
    expect((await normal.boundingBox())!.width).toBeGreaterThan(40);
    await expect(page.locator('[data-footnotes]')).toBeVisible();
    const checkbox=page.locator('input[type="checkbox"]').first();await expect(checkbox).toBeChecked();
    expect(await checkbox.evaluate(e=>getComputedStyle(e).appearance)).toBe('none');
    const background=await page.locator('th').first().evaluate(e=>getComputedStyle(e).backgroundColor);
    await page.evaluate(t=>{document.documentElement.dataset.theme=t==='light'?'dark':'light';},theme);
    expect(await page.locator('th').first().evaluate(e=>getComputedStyle(e).backgroundColor)).toBe(background);
    expect(await page.locator('.md-table-scroll').first().evaluate(e=>getComputedStyle(e).scrollbarColor)).not.toBe('auto');
    await page.addStyleTag({content:'html,body,#root {overflow-x:visible!important}'});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
test('loaded Logo has a fixed inline frame and does not inflate a row',async({page})=>{
  await page.setViewportSize({width:1440,height:960});
  await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><path fill="#888" d="M0 0H400V400H0Z"/></svg>'}));
  await page.goto('/tests/browser/fixture.html?sample=tables');
  const logo=page.locator('.md-provider-logo');await logo.scrollIntoViewIfNeeded();
  await expect(logo.locator('img')).toBeVisible();
  expect((await logo.boundingBox())!.height).toBeLessThan(24);
  expect(await logo.evaluate(e=>e.closest('tr')!.getBoundingClientRect().height)).toBeLessThan(80);
});
