import { test, expect, type Page } from '@playwright/test';
const articleURL = '/?view=article&article=llm-attention-calculation';
const ready = async (page: Page) => expect(page.locator('[data-document="llm-attention-calculation"] .markdown-prose')).toBeVisible();

for (const width of [320,390,768,1440]) for (const theme of ['light','dark']) {
  test(`reader kit keeps inline math and full-width tables honest / ${width} / ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height:900 });
    await page.addInitScript(t => localStorage.setItem('nextchina-theme', t), theme);
    const requests: string[] = []; page.on('request', r => requests.push(r.url()));
    await page.goto(articleURL); await ready(page);
    const math = page.locator('.markdown-prose .katex');
    expect(await math.count()).toBeGreaterThan(5);
    const result = await page.evaluate(() => ({
      inline: [...document.querySelectorAll('.markdown-prose .katex')].filter(el => !el.closest('.katex-display')).map(el => ({
        display:getComputedStyle(el).display, x:getComputedStyle(el).overflowX, y:getComputedStyle(el).overflowY,
        mathml:!!el.querySelector('.katex-mathml'),
      })),
      width:document.documentElement.scrollWidth - innerWidth,
      tables:[...document.querySelectorAll('.md-table-scroll')].map(el => ({
        frame:el.clientWidth, table:el.querySelector('table')!.getBoundingClientRect().width,
      })),
    }));
    expect(result.inline.length).toBeGreaterThan(5);
    expect(result.inline.every(v=>v.display==='inline' && v.x==='visible' && v.y==='visible' && v.mathml)).toBe(true);
    expect(result.width).toBeLessThanOrEqual(1);
    expect(result.tables.every(v=>v.table >= v.frame - 1)).toBe(true);
    await expect(page.locator('.katex-error')).toHaveCount(0);
    // Even offscreen published diagrams are already SVG, no scroll-to-render loop.
    expect(await page.locator('.md-diagram').count()).toBeGreaterThan(0);
    await expect(page.locator('.md-diagram:not([data-renderer="static-mermaid"])')).toHaveCount(0);
    await expect(page.locator('.md-diagram:not([data-status="ready"])')).toHaveCount(0);
    expect(requests.some(url=>/\/mermaid(?:\.core|-)[^/]*\.js/.test(url))).toBe(false);
    const code=page.locator('.md-codeblock').first();
    await expect(code).toHaveAttribute('data-highlighted','true');
    expect(await code.locator('.token.keyword').count()).toBeGreaterThan(0);
    const figure=page.locator('.md-diagram').first();
    await figure.scrollIntoViewIfNeeded();
    await expect(figure).toHaveAttribute('data-fit','true');
    const geometry=await figure.evaluate(el=>({svg:el.querySelector('svg')!.getBoundingClientRect().width,frame:el.getBoundingClientRect().width}));
    expect(geometry.svg).toBeLessThanOrEqual(geometry.frame);
    if ([390,1440].includes(width)) {
      await page.locator('.md-table-region').first().scrollIntoViewIfNeeded();
      await page.screenshot({path:`test-results/reader-math-table-${width}-${theme}.png`});
      await code.scrollIntoViewIfNeeded();
      await page.screenshot({path:`test-results/reader-code-${width}-${theme}.png`});
    }
  });
}

test('syntax copy is lossless and theme/panel changes do not reparse the document', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.setViewportSize({width:1440,height:900});
  await page.goto(articleURL); await ready(page);
  const code=page.locator('.md-codeblock').first(); await code.scrollIntoViewIfNeeded();
  const text=await code.locator('pre code').textContent();
  await code.getByRole('button',{name:'复制代码',exact:true}).click();
  expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(text);
  const handle=await page.locator('.markdown-prose').elementHandle();
  const codeHandle=await code.locator('pre code').elementHandle();
  const color=await code.locator('.token.keyword').first().evaluate(el=>getComputedStyle(el).color);
  await page.locator('.ws-ribbon-bottom button').click();
  expect(await handle!.evaluate(el=>el.isConnected)).toBe(true);
  expect(await codeHandle!.evaluate(el=>el.isConnected)).toBe(true);
  expect(await code.locator('.token.keyword').first().evaluate(el=>getComputedStyle(el).color)).not.toBe(color);
  await page.getByRole('button',{name:'显示关联资料',exact:true}).click();
  expect(await handle!.evaluate(el=>el.isConnected)).toBe(true);
  await code.getByRole('button',{name:'换行',exact:true}).click();
  expect(await code.locator('pre code').evaluate(el=>getComputedStyle(el).whiteSpace)).toBe('pre-wrap');
  expect(await code.locator('pre code').textContent()).toBe(text);
});

test('editor-style explorer and transparent top-right related toggle', async ({ page }) => {
  await page.setViewportSize({width:1440,height:900}); await page.goto(articleURL); await ready(page);
  const button=page.getByRole('button',{name:'显示关联资料',exact:true});
  const b=await button.boundingBox(), main=await page.locator('.ws-main').boundingBox();
  expect(b!.y).toBeLessThan(50); expect(main!.x+main!.width-b!.x-b!.width).toBeLessThan(20);
  expect(await button.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await button.hover(); expect(await button.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  const selected=page.locator('.ws-tree-row[aria-selected="true"]');
  await expect(selected).toHaveAttribute('data-entry-type','document');
  expect(await selected.locator('.ws-tree-guides i').count()).toBeGreaterThan(0);
  expect(await selected.evaluate(el=>getComputedStyle(el).borderRadius)).toBe('0px');
  await page.getByRole('button',{name:'收起文档侧栏',exact:true}).click();
  await expect(page.locator('.ws-sidebar')).toBeHidden();
  expect(await page.locator('.ws-sidebar').evaluate(el=>el.hasAttribute('inert'))).toBe(true);
  await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();
  await expect(selected).toBeVisible();
  await button.click(); await expect(page.locator('.ws-related')).toBeVisible();
  await page.getByRole('button',{name:'关闭关联资料',exact:true}).click();
  await expect(page.locator('.ws-related')).toBeHidden();
  expect(await page.locator('.ws-related').evaluate(el=>el.hasAttribute('inert'))).toBe(true);
  await page.screenshot({path:'test-results/editor-explorer-1440.png'});
});

test('sidebar transitions are smooth and respect reduced motion', async ({ page }) => {
  await page.emulateMedia({reducedMotion:'no-preference'}); await page.setViewportSize({width:1440,height:900});
  await page.goto(articleURL); await ready(page);
  expect(await page.locator('.workspace').evaluate(el=>getComputedStyle(el).transitionProperty)).toContain('grid-template-columns');
  expect(await page.locator('.workspace').evaluate(el=>getComputedStyle(el).transitionDuration)).not.toBe('0s');
  await page.getByRole('button',{name:'收起文档侧栏',exact:true}).click();
  await expect(page.locator('.ws-sidebar')).toBeHidden();
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await page.locator('.workspace').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s');
});
