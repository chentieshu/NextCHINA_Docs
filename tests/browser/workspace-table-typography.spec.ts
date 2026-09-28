import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { allocateTableColumns, tableLayoutFromText } from '../../src/utils/table-layout';

const article = (id: string) => `/?view=article&article=${id}`;
const offline = (page: Page) => page.route('**/*', request => new URL(request.request().url()).hostname === '127.0.0.1' ? request.continue() : request.abort());
async function stable(page: Page) {
  await expect(page.locator('.markdown-body').first()).toBeVisible();
  await expect.poll(() => page.locator('.md-table-region[data-measured="false"]').count()).toBe(0);
  await page.evaluate(async () => { await document.fonts.ready; await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))); });
}
async function measure(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector('.ws-scroll')!;
    const heading = document.querySelector('.ws-document-heading')!;
    const body = document.querySelector('.markdown-body')!;
    return {
      viewport: innerWidth,
      headingLeft: heading.getBoundingClientRect().left,
      bodyLeft: body.getBoundingClientRect().left,
      hostOverflow: host.scrollWidth - host.clientWidth,
      rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      tables: [...body.querySelectorAll('.md-table-region')].map(frame => {
        const table = frame.querySelector('table')!;
        const style = getComputedStyle(frame);
        const rootEm = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const font = parseFloat(style.fontSize);
        const available = frame.parentElement!.clientWidth;
        const ideal = parseFloat(style.getPropertyValue('--md-table-ideal')) * font;
        return {
          columns: Number((frame as HTMLElement).dataset.columns),
          left: frame.getBoundingClientRect().left,
          width: frame.getBoundingClientRect().width,
          budget: Math.min(available, Math.max(51.25 * rootEm, ideal)),
          available,
          overflow: frame.querySelector('.md-table-scroll')!.scrollWidth - frame.querySelector('.md-table-scroll')!.clientWidth,
          cells: [...table.querySelectorAll('thead th')].map(cell => ({ text: cell.textContent, width: cell.getBoundingClientRect().width, align: getComputedStyle(cell).textAlign })),
          rowHeight: table.querySelector('tbody tr')?.getBoundingClientRect().height ?? 0,
          background: getComputedStyle(table.querySelector('thead th')!).backgroundColor,
          scrollColor: getComputedStyle(frame.querySelector('.md-table-scroll')!).scrollbarColor,
        };
      }),
    };
  });
}

test('extra width grows long explanations rather than every short text label', () => {
  const layout = tableLayoutFromText(['名称', '性质', '解释'], [['A', 'SaaS', '用于验证布局而不是事实的长说明'.repeat(6)]]);
  const preferred = layout.tracks.reduce((sum, track) => sum + track.preferred, 0);
  const columns = allocateTableColumns(layout, preferred + 20);
  expect(columns[0]).toBeCloseTo(layout.tracks[0].preferred);
  expect(columns[1]).toBeCloseTo(layout.tracks[1].preferred);
  expect(columns[2]).toBeCloseTo(layout.tracks[2].preferred + 20);
});

for (const width of [1280, 1440, 1920, 2560, 3840]) for (const theme of ['light', 'dark']) {
  test(`desktop reading alignment and content budgets ${width} ${theme}`, async ({ page }, info) => {
    await offline(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem('nextchina-theme', value), theme);
    const records = [];
    for (const id of ['aa-intelligence', 'arena-text', 'model-api-prices', 'catalog-video']) {
      await page.goto(article(id)); await stable(page);
      const result = await measure(page); records.push({ id, ...result });
      expect(result.hostOverflow).toBeLessThanOrEqual(1);
      expect(result.rootOverflow).toBeLessThanOrEqual(1);
      expect(Math.abs(result.headingLeft - result.bodyLeft)).toBeLessThanOrEqual(1);
      for (const table of result.tables) {
        expect(Math.abs(table.left - result.headingLeft), 'heading, prose and table must share a left edge').toBeLessThanOrEqual(1);
        expect(table.width, 'a short table must not stretch to fill a wide monitor').toBeLessThanOrEqual(table.budget + 1);
        expect(table.scrollColor).not.toBe('auto');
        if (width >= 1920) expect(table.overflow).toBeLessThanOrEqual(1);
      }
      if (id === 'aa-intelligence') {
        expect(result.tables[0].cells.at(-1)?.align).toBe('right');
        if (width >= 1920) expect(result.tables[0].width).toBeLessThan(1000);
      }
      if (id === 'model-api-prices') for (const index of [2, 3, 4]) expect(result.tables[0].cells[index].align).toBe('right');
      if (width === 1920 && ['aa-intelligence', 'model-api-prices'].includes(id)) {
        await page.locator('.md-table-region').first().scrollIntoViewIfNeeded();
        await page.screenshot({path: `test-results/tables-refined-${id}-${width}-${theme}.png`});
      }
    }
    const target = info.outputPath(`desktop-${width}-${theme}.json`);
    mkdirSync(path.dirname(target), {recursive: true}); writeFileSync(target, JSON.stringify(records, null, 2));
  });
}

test('resizing both panels and root text keeps one alignment and restores scroll controls', async ({page}) => {
  await offline(page); await page.setViewportSize({width:1920,height:1000});
  await page.goto(article('model-api-prices')); await stable(page);
  await page.getByRole('button',{name:'显示关联资料',exact:true}).click(); await stable(page);
  await page.getByRole('button',{name:'收起文档侧栏',exact:true}).click(); await stable(page);
  await page.addStyleTag({content:'html {font-size:20px}'}); await stable(page);
  let result = await measure(page);
  expect(result.hostOverflow).toBeLessThanOrEqual(1);
  expect(Math.abs(result.headingLeft - result.tables[0].left)).toBeLessThanOrEqual(1);
  await page.setViewportSize({width:390,height:844}); await stable(page);
  // Narrow-screen related panel may be an overlay; close it before exercising the table.
  const close = page.getByRole('button',{name:'关闭关联资料',exact:true});
  if (await close.isVisible()) await close.click();
  await page.locator('.md-table-region').first().scrollIntoViewIfNeeded();
  const scroller = page.locator('.md-table-scroll').first();
  await page.getByRole('button',{name:'表格向右滚动',exact:true}).first().click();
  await expect.poll(()=>scroller.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);
  await page.screenshot({path:'test-results/tables-refined-mobile.png'});
  await page.setViewportSize({width:2560,height:1000}); await stable(page);
  await expect(page.locator('.md-table-tools')).toHaveCount(0);
  result = await measure(page); expect(result.hostOverflow).toBeLessThanOrEqual(1);
});

// Count rendered occurrences, not unique products or claims about evidence.
test('inventory every public document with the actual renderer', async ({page}, info) => {
  await offline(page); await page.setViewportSize({width:1440,height:1000});
  const ids: string[] = JSON.parse(readFileSync('content/spaces.json','utf8')).spaces.flatMap((space: {chapterIds: string[]}) => space.chapterIds);
  const markdownFiles = JSON.parse(readFileSync('content/articles.json','utf8')).articles.length;
  const documents = [];
  for (const id of ids) {
    await page.goto(article(id)); await stable(page);
    const counts = await page.evaluate(() => {
      const body = document.querySelector('.markdown-body')!;
      const count = (selector: string) => body.querySelectorAll(selector).length;
      return {tables: count('.md-table-region'), bodyRows: count('table tbody tr'), codeBlocks: count('.md-codeblock'), diagrams: count('.md-diagram'), displayMath: count('.katex-display'), lists: count('ul,ol'), blockquotes: count('blockquote'), columns:[...body.querySelectorAll('.md-table-region')].map(table=>Number((table as HTMLElement).dataset.columns))};
    });
    documents.push({id,...counts});
  }
  const inventory = {publicDocuments: ids.length, markdownFiles, jsonDerivedPages: ids.length-markdownFiles, documentsWithTables: documents.filter(doc=>doc.tables>0).length,
    totals: Object.fromEntries(['tables','bodyRows','codeBlocks','diagrams','displayMath','lists','blockquotes'].map(key=>[key,documents.reduce((sum,doc)=>sum+Number(doc[key as keyof typeof doc]),0)])), documents};
  expect(inventory.publicDocuments).toBe(new Set(ids).size);
  const target = info.outputPath('rendered-content-inventory.json');
  mkdirSync(path.dirname(target),{recursive:true}); writeFileSync(target,JSON.stringify(inventory,null,2));
});

test('forced colors preserve cell boundaries and readable table headings', async ({page}) => {
  await offline(page); await page.emulateMedia({forcedColors:'active'});
  await page.goto(article('aa-intelligence')); await stable(page);
  const heading = page.locator('.md-table-region thead th').first();
  expect(await heading.evaluate(element=>getComputedStyle(element).color)).not.toBe(await heading.evaluate(element=>getComputedStyle(element).backgroundColor));
  expect(await heading.evaluate(element=>getComputedStyle(element).borderBottomStyle)).toBe('solid');
});
