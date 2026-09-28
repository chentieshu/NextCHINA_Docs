import { test, expect, type Page } from '@playwright/test';

const article = '/?view=article&article=llm-attention-calculation';
const widths = [320,360,390,640,768,959,960,1024,1279,1280,1440,1920];
async function geometry(page: Page) {
  return page.evaluate(() => {
    const read = document.querySelector<HTMLElement>('.ws-scroll');
    const root = document.querySelector<HTMLElement>('.workspace')!;
    const main = document.querySelector<HTMLElement>('.ws-main')!;
    const bounds = root.getBoundingClientRect();
    return {
      pageX: document.documentElement.scrollWidth-document.documentElement.clientWidth,
      pageY: document.documentElement.scrollHeight-innerHeight,
      readerX: read ? read.scrollWidth-read.clientWidth : 0,
      mainX: main.scrollWidth-main.clientWidth,
      height: bounds.height, bottom: bounds.bottom, mainWidth: main.clientWidth,
      colors: ['html','body','#root','.workspace'].map(s=>getComputedStyle(document.querySelector(s)!).backgroundColor),
      shadows: [...root.querySelectorAll('*')].filter(el=>{const s=getComputedStyle(el);return s.boxShadow!=='none'||s.textShadow!=='none'||s.filter.includes('drop-shadow');}).length,
    };
  });
}
async function fit(page: Page) {
  const g = await geometry(page);
  expect(g.pageX).toBeLessThanOrEqual(1);
  expect(g.pageY).toBeLessThanOrEqual(1);
  expect(g.readerX).toBeLessThanOrEqual(1);
  expect(g.mainX).toBeLessThanOrEqual(1);
  expect(g.mainWidth).toBeGreaterThan(150);
  expect(g.shadows).toBe(0);
  expect(new Set(g.colors).size).toBe(1);
  expect(g.bottom).toBeLessThanOrEqual((await page.evaluate(()=>innerHeight))+1);
  await expect(page.locator('select,details,summary')).toHaveCount(0);
}
for (const width of widths) for (const theme of ['light','dark'] as const) {
  test(`presentation ${width}px ${theme}: reading, explorer, related, text scaling`, async({page}) => {
    const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.setViewportSize({width,height:900});
    await page.addInitScript(t=>localStorage.setItem('nextchina-theme',t),theme);
    await page.goto(article);
    await expect(page.locator('.markdown-prose')).toBeVisible();
    await fit(page);
    await page.getByRole('button',{name:'显示关联资料',exact:true}).click();
    await fit(page);
    await page.getByRole('button',{name:'关闭关联资料',exact:true}).click();
    // This emulates a larger root font, separately from viewport-width reflow.
    await page.addStyleTag({content:'html { font-size:20px; }'});
    await fit(page);
    if(width < 960) {
      await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();
      await expect(page.getByRole('dialog',{name:'文档侧栏'})).toBeVisible();
      const d=await page.locator('.ws-sidebar').boundingBox();
      expect(d!.x).toBeGreaterThanOrEqual(0);
      expect(d!.x+d!.width).toBeLessThanOrEqual(width);
      await page.keyboard.press('Escape');
    }
    await fit(page);
    expect(errors).toEqual([]);
    if([390,1440].includes(width)) await page.screenshot({path:`test-results/presentation-${width}-${theme}.png`});
  });
}

test('system theme, manual preference, reload and cross-tab storage use one palette',async({page,context})=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.goto(article);
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.emulateMedia({colorScheme:'light'});
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.getByRole('button',{name:'切换为暗黑模式',exact:true}).and(page.locator(':visible')).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.reload();
  await expect(page.locator('.markdown-body')).toHaveClass(/markdown-dark/);
  const second=await context.newPage();
  await second.goto('/');
  await second.evaluate(()=>localStorage.setItem('nextchina-theme','light'));
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  const color=await page.evaluate(()=>({
    meta:document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
    css:getComputedStyle(document.documentElement).getPropertyValue('--page-bg').trim(),
    schemes:['html','.markdown-body'].map(s=>getComputedStyle(document.querySelector(s)!).colorScheme),
  }));
  expect(color.meta).toBe(color.css);
  expect(color.schemes).toEqual(['light','light']);
  await second.close();
});

test('blocked storage still applies the requested OS theme without crashing',async({page})=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked')};Storage.prototype.setItem=()=>{throw Error('blocked')};});
  await page.goto(article);
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('.markdown-prose')).toBeVisible();
  await fit(page);
});

test('minimum coarse touch targets and short landscape do not lose search controls',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  const page=await context.newPage();
  await page.goto(article);
  await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();
  const sizes=await page.locator('.ws-sidebar button').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
  expect(sizes.length).toBeGreaterThan(3);
  expect(sizes.every(s=>s.w>=43.5&&s.h>=43.5)).toBe(true);
  await page.getByRole('button',{name:'全库搜索',exact:true}).click();
  await page.getByRole('searchbox',{name:'搜索全部文档',exact:true}).fill('Token');
  await page.setViewportSize({width:844,height:320});
  await expect(page.getByRole('searchbox',{name:'搜索全部文档',exact:true})).toBeVisible();
  await expect(page.locator('.ws-search-results button').first()).toBeVisible();
  await fit(page); await context.close();
});

test('visual viewport resize, safe-area geometry and zoom are separate responsibilities',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    const viewport=Object.assign(new EventTarget(),{height:844,width:390,offsetTop:0,offsetLeft:0,scale:1});
    Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
  });
  await page.goto(article); await expect(page.locator('.markdown-prose')).toBeVisible();
  await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();
  await page.getByRole('button',{name:'全库搜索',exact:true}).click();
  await page.evaluate(()=>{
    Object.assign(window.visualViewport!,{height:420});
    window.visualViewport!.dispatchEvent(new Event('resize'));
  });
  await expect.poll(()=>page.locator('.workspace').evaluate(e=>e.getBoundingClientRect().height)).toBe(420);
  await expect.poll(()=>page.locator('.ws-sidebar').evaluate(e=>e.getBoundingClientRect().bottom)).toBe(420);
  await expect(page.getByRole('searchbox',{name:'搜索全部文档',exact:true})).toBeVisible();
  await page.evaluate(()=>{
    Object.assign(window.visualViewport!,{scale:2});
    window.visualViewport!.dispatchEvent(new Event('resize'));
  });
  await expect.poll(()=>page.evaluate(()=>document.documentElement.style.getPropertyValue('--ws-visible-height'))).toBe('');
  // This is a synthetic VisualViewport contract test, not an iOS device test.
});

test('Markdown controls keep their own theme and full-width source toggle inside workspace',async({page})=>{
  await page.setViewportSize({width:390,height:900});
  await page.goto(article);
  const diagram=page.locator('.md-diagram').first();
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram).toHaveAttribute('data-status','ready');
  const toggle=diagram.locator('.md-source-toggle');
  expect(await toggle.evaluate(e=>getComputedStyle(e).justifyContent)).toBe('flex-start');
  await toggle.click();
  await expect(diagram.locator('.md-diagram-source pre')).toBeVisible();
  await page.getByRole('button',{name:'切换为暗黑模式',exact:true}).and(page.locator(':visible')).click();
  await expect(diagram).toHaveAttribute('data-status','ready');
  await expect(page.locator('.markdown-body')).toHaveClass(/markdown-dark/);
  await fit(page);
});

test('essential text pairs meet 4.5:1 in both palettes; decorative borders are not text',async({page})=>{
  await page.goto(article);
  for (const theme of ['light','dark']) {
    if(await page.locator('html').getAttribute('data-theme')!==theme)
      await page.getByRole('button',{name:theme==='dark'?'切换为暗黑模式':'切换为明亮模式',exact:true}).and(page.locator(':visible')).click();
    const pairs=await page.evaluate(()=>{
      const root=getComputedStyle(document.documentElement);
      const value=(name:string)=>root.getPropertyValue(name).trim();
      const luminance=(hex:string)=>{
        const rgb=hex.replace('#','').match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
        return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
      };
      return [['--color-text','--color-canvas'],['--color-muted','--color-sidebar'],['--color-focus','--color-soft'],['--color-body','--color-canvas'],['--color-link','--color-panel']].map(([f,b])=>{
        const a=luminance(value(f)),c=luminance(value(b));
        return {f,b,ratio:(Math.max(a,c)+.05)/(Math.min(a,c)+.05)};
      });
    });
    for(const pair of pairs) expect(pair.ratio,JSON.stringify(pair)).toBeGreaterThanOrEqual(4.5);
  }
});

test('forced colors keeps selected boundaries, custom checkboxes and visible focus',async({page})=>{
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await page.goto(article);
  await expect(page.locator('.markdown-prose')).toBeVisible();
  await fit(page);
  const selected=page.locator('.ws-tree-row[aria-selected="true"]');
  await expect(selected).toBeVisible();
  expect(await selected.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
  await page.getByRole('button',{name:'查看当前关系图'}).focus();
  expect(await page.getByRole('button',{name:'查看当前关系图'}).evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
});

for(const [width,height] of [[320,568],[844,320],[1440,900]]) test(`graph controls and legend do not overlap ${width}x${height}`,async({page})=>{
  await page.setViewportSize({width,height});
  await page.goto(article);
  await page.getByRole('button',{name:'查看当前关系图'}).click();
  await expect(page.locator('.garden-canvas')).toHaveAttribute('data-layout','ready');
  const tools=await page.locator('.garden-canvas-tools').boundingBox();
  const legend=page.locator('.garden-canvas-legend');
  if(await legend.isVisible()) {
    const l=(await legend.boundingBox())!;
    expect(tools!.y+tools!.height).toBeLessThanOrEqual(l.y+1);
  }
  expect(tools!.x).toBeGreaterThanOrEqual(0);
  expect(tools!.x+tools!.width).toBeLessThanOrEqual(width+1);
  await fit(page);
});
