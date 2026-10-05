import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { graph } from '../../src/features/garden/data';

// Additive lesson coverage. Temporary whole-site totals/gaps belong in release evidence.
type Article = { id: string; file: string; title: string; category: string;
  knowledgeUnit: { kind: string; reviewStatus: string; exampleId: string; conceptIds: string[];
    placements: { hubId: string; path: string }[]; sourceUrls: string[]; relatedResourceIds: string[] };
  [key: string]: unknown };
export type ConstraintCalibrationLesson = {
  article: Article; name: string; parent: string; parentPath: string; siblings: string[];
  articleSha256: string; codeSha256: string; suffixSha256: string;
  headings: string[]; claims: string[]; displays: string[]; inlineMath: string[];
  localProse: { anchor: string; fragments: string[]; code?: string[] }[];
  tables: { header: string[]; rows: string[][] }[];
  onward: [string, string][]; backlinks: string[];
};
const registry: Article[] = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const compact = (text: string) => text.replace(/\s/g, '');

// This function is also extracted unchanged by the scratch preflight harness.
export function lessonGeometry(element: HTMLElement) {
  const frame = element.getBoundingClientRect();
  const round = (value: number) => Math.round(value * 100) / 100;
  const escape = (left: number, right: number, container: DOMRect) => ({
    left: round(Math.max(0, container.left - left)), right: round(Math.max(0, right - container.right)) });
  const math = [...element.querySelectorAll<HTMLElement>('.katex')].map(katex => {
    const html = katex.querySelector<HTMLElement>('.katex-html')!;
    const boxes = [...html.querySelectorAll(':scope > .base')].map(base => base.getBoundingClientRect());
    const left = Math.min(...boxes.map(box => box.left)), right = Math.max(...boxes.map(box => box.right));
    const cell = katex.closest('td, th'), display = katex.closest<HTMLElement>('.katex-display');
    // Allowed table scrolling can put a cell beyond the reader viewport. Its math
    // must fit its actual cell; the table scroll container separately fits the body.
    const container = cell ? cell.getBoundingClientRect() : frame;
    return { tex: katex.querySelector('annotation')!.textContent, context: cell ? 'table-cell' : display ? 'display' : 'prose',
      boxes: boxes.length, width: round(right - left), escape: escape(left, right, container),
      topSpread: round(Math.max(...boxes.map(box => box.top)) - Math.min(...boxes.map(box => box.top))),
      displayOverflow: display ? display.scrollWidth - display.clientWidth : 0 };
  });
  const textBounds = [...element.querySelectorAll<HTMLElement>('p, li, h2, h3, th, td, :not(pre) > code')].map(item => {
    const cell = item.closest('th, td'), container = cell ? cell.getBoundingClientRect() : frame;
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT);
    const rects: DOMRect[] = []; let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim() || node.parentElement?.closest('.katex, pre')) continue;
      const range = document.createRange(); range.selectNodeContents(node); rects.push(...range.getClientRects());
    }
    const plain = item.textContent?.trim() ?? '';
    const atomic = (item.tagName === 'CODE' && /^(?:[A-Za-z_][A-Za-z_0-9]*|[0-9]+(?:\/[0-9]+)?)$/.test(plain)) || (!!cell && !item.querySelector('.katex')
      && /^(?:[0-9]+(?:\/[0-9]+)?|[0-9]+%\/[0-9]+%|[LEH][0-9]+)$/.test(plain));
    return { tag: item.tagName, text: plain.slice(0, 80), context: cell ? 'table-cell' : 'prose',
      atomic, fragments: rects.length, topSpread: rects.length ? round(Math.max(...rects.map(rect => rect.top)) - Math.min(...rects.map(rect => rect.top))) : 0,
      ...escape(Math.min(...rects.map(rect => rect.left)), Math.max(...rects.map(rect => rect.right)), container) };
  });
  const inlineCodeFrames = [...element.querySelectorAll<HTMLElement>('code')].filter(code => !code.closest('pre')).map(code => {
    const cell = code.closest('th, td'), container = cell ? cell.getBoundingClientRect() : frame;
    return { text: code.textContent, context: cell ? 'table-cell' : 'prose',
      fragments: [...code.getClientRects()].map(rect => escape(rect.left, rect.right, container)) };
  });
  return { bodyOverflow: element.scrollWidth - element.clientWidth, math, textBounds, inlineCodeFrames,
    frames: [...element.querySelectorAll<HTMLElement>('p, li, h2, h3, .md-codeblock, .katex-display, .md-table-region')]
      .filter(item => !item.closest('th, td')).map(item => ({ tag: item.tagName,
        ...escape(item.getBoundingClientRect().left, item.getBoundingClientRect().right, frame) })),
    tables: [...element.querySelectorAll<HTMLElement>('.md-table-region')].map(region => {
      const scroll = region.querySelector<HTMLElement>('.md-table-scroll')!, table = region.querySelector('table')!;
      return { columns: Number(region.dataset.columns), viewport: scroll.clientWidth,
        width: table.getBoundingClientRect().width, overflow: scroll.scrollWidth - scroll.clientWidth,
        overflowMode: getComputedStyle(scroll).overflowX,
        frame: escape(scroll.getBoundingClientRect().left, scroll.getBoundingClientRect().right, frame) };
    }) };
}

export function registerConstraintCalibrationTests(unit: ConstraintCalibrationLesson) {
  const { article: metadata } = unit, id = metadata.id, knowledge = metadata.knowledgeUnit;
  const concept = knowledge.conceptIds[0], branch = `branch:llm:${knowledge.placements[0].path}`;
  const parentBranch = `branch:llm:${unit.parentPath}`;
  const markdown = readFileSync(metadata.file, 'utf8');
  const blocks = [...markdown.matchAll(/^```python\r?\n(# nextchina-example: ([a-z0-9-]+)\r?\n[\s\S]*?)^```\s*$/gm)];

  test(`${unit.name} owns one original concept and one scoped leaf with exact accepted source contracts`, () => {
    expect(registry.filter(article => article.id === id)).toEqual([metadata]);
    expect(knowledge.kind).toBe('independent-explanation');
    expect(knowledge.reviewStatus).toBe('needs-independent-review');
    expect(knowledge.exampleId).toBe(id);
    expect(knowledge.conceptIds).toEqual([concept]);
    expect(knowledge.relatedResourceIds).toEqual([]);
    expect(digest(markdown)).toBe(unit.articleSha256);
    expect(blocks).toHaveLength(1); expect(blocks[0][2]).toBe(id);
    expect(blocks[0][1].endsWith('\n')).toBe(true);
    expect(digest(blocks[0][1])).toBe(unit.codeSha256);
    expect(digest(readFileSync(`scripts/knowledge-fixtures/${id}.py`, 'utf8'))).toBe(unit.suffixSha256);
    expect([...markdown.matchAll(/^```python$/gm)]).toHaveLength(1);
    expect([...markdown.matchAll(/nextchina-example:/g)]).toHaveLength(1);
    const canonical = graph.nodes.filter(node => node.id === concept);
    expect(canonical).toHaveLength(1);
    expect(canonical[0]).toMatchObject({ kind: 'concept', parentId: unit.parent,
      articleBindings: [{ articleId: id, coverage: 'explanation' }], contentStatus: 'outline', evidenceStatus: 'not-reviewed' });
    expect(canonical[0].embeddedArticleId).toBeUndefined();
    expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === id)).map(node => node.id)).toEqual([concept]);
    const leaf = graph.nodes.filter(node => node.id === branch);
    expect(leaf).toHaveLength(1);
    expect(leaf[0]).toMatchObject({ parentId: parentBranch, embeddedArticleId: id, conceptRefs: [concept] });
    expect(leaf[0].resourceRefs).toContainEqual({ articleId: id, role: 'independent-explanation' });
    const edges = graph.edges.filter(edge => edge.source === branch || edge.target === branch);
    expect(edges.map(edge => edge.type).sort()).toEqual(['browse_child', 'references']);
    expect(edges.find(edge => edge.type === 'references')?.target).toBe(concept);
    const spaces = JSON.parse(readFileSync('content/spaces.json', 'utf8')).spaces;
    expect(spaces.filter((space: { chapterIds: string[] }) => space.chapterIds.includes(id)).map((space: { id: string }) => space.id)).toEqual(['models']);
    expect(spaces.find((space: { id: string }) => space.id === 'models').chapterIds.filter((value: string) => value === id)).toHaveLength(1);
  });

  async function reader(page: Page) {
    const article = page.locator(`[data-document="${id}"]`), body = article.locator('.markdown-body');
    await expect(article.locator('h1')).toHaveText(metadata.title); await expect(body).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => body.locator('.md-table-region[data-measured="false"]').count()).toBe(0);
    for (const heading of unit.headings) await expect(body.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    for (const claim of unit.claims) await expect(body).toContainText(claim);
    await expect(article.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
    await expect(body.locator('.katex-error, .md-mermaid-error')).toHaveCount(0);
    expect((await body.locator('.katex-display annotation').allTextContents()).map(compact)).toEqual(unit.displays.map(compact));
    const inline = await body.locator('.katex').evaluateAll(items => items.filter(item => !item.closest('.katex-display')).map(item => item.querySelector('annotation')!.textContent ?? ''));
    expect(inline.map(compact)).toEqual(unit.inlineMath.map(compact));
    for (const check of unit.localProse) {
      const paragraph = body.locator('p').filter({ hasText: check.anchor });
      await expect(paragraph).toHaveCount(1);
      for (const fragment of check.fragments) await expect(paragraph).toContainText(fragment);
      for (const code of check.code ?? []) await expect(paragraph.locator('code').filter({ hasText: code }).first()).toHaveText(code);
    }
    await expect(body.locator('.md-codeblock')).toHaveCount(1);
    await expect(body.locator('pre code')).toHaveCount(1);
    expect(await body.locator('pre code').textContent()).toBe(blocks[0][1]);
    const tables = body.locator('.md-table-region'); await expect(tables).toHaveCount(unit.tables.length);
    for (const [index, expected] of unit.tables.entries()) {
      const actual = await tables.nth(index).locator('tr').evaluateAll(rows => rows.map(row => [...row.querySelectorAll('th, td')].map(cell => {
        const clone = cell.cloneNode(true) as HTMLElement;
        for (const math of clone.querySelectorAll('.katex')) math.replaceWith(document.createTextNode(math.querySelector('annotation')!.textContent ?? ''));
        return (clone.textContent ?? '').replace(/\s/g, '');
      })));
      expect(actual, `${id} table ${index}: every header and numerical/label cell`).toEqual([expected.header, ...expected.rows].map(row => row.map(compact)));
    }
    for (const url of knowledge.sourceUrls) {
      const links = body.locator(`a[href="${url}"]`); expect(await links.count()).toBeGreaterThan(0);
      await expect(links.first()).toBeVisible(); expect((await links.first().textContent())?.trim().length).toBeGreaterThan(0);
    }
    const geometry = await body.evaluate(lessonGeometry);
    expect(geometry.bodyOverflow).toBeLessThanOrEqual(1);
    for (const item of geometry.frames) { expect(item.left).toBeLessThanOrEqual(1); expect(item.right).toBeLessThanOrEqual(1); }
    expect(geometry.math.length).toBeGreaterThan(unit.displays.length);
    for (const item of geometry.math) {
      expect(item.boxes, item.tex ?? '').toBeGreaterThan(0); expect(Number.isFinite(item.width)).toBe(true);
      expect(item.width, item.tex ?? '').toBeGreaterThan(0);
      expect(item.escape.left, `${item.context}: ${item.tex}`).toBeLessThanOrEqual(1);
      expect(item.escape.right, `${item.context}: ${item.tex}`).toBeLessThanOrEqual(1);
      expect(item.displayOverflow, item.tex ?? '').toBeLessThanOrEqual(1);
      if (item.context === 'table-cell') expect(item.topSpread, `atomic table formula: ${item.tex}`).toBeLessThanOrEqual(1);
    }
    for (const item of geometry.textBounds) {
      expect(item.left, item.text).toBeLessThanOrEqual(1); expect(item.right, item.text).toBeLessThanOrEqual(1);
      if (item.atomic) { expect(item.fragments, item.text).toBeGreaterThan(0); expect(item.topSpread, `atomic label: ${item.text}`).toBeLessThanOrEqual(1); }
    }
    for (const code of geometry.inlineCodeFrames) for (const fragment of code.fragments) {
      expect(fragment.left, code.text ?? '').toBeLessThanOrEqual(1); expect(fragment.right, code.text ?? '').toBeLessThanOrEqual(1);
    }
    for (const table of geometry.tables) {
      expect(table.frame.left).toBeLessThanOrEqual(1); expect(table.frame.right).toBeLessThanOrEqual(1);
      expect(table.width).toBeGreaterThanOrEqual(table.viewport - 1);
      if (table.overflow > 1) expect(['auto', 'scroll']).toContain(table.overflowMode);
      if (table.columns <= 2) expect(table.overflow).toBeLessThanOrEqual(1);
    }
    expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-document]')).toHaveCount(1); await expect(page.getByRole('tab')).toHaveCount(0);
    return { article, body, geometry };
  }
  async function setup(page: Page, width: number) {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.setViewportSize({ width, height: 900 }); return errors;
  }
  for (const width of [390, 1440]) {
    test(`${unit.name} canonical graph reader preserves refresh, history and return / ${width}px`, async ({ page }, info) => {
      const errors = await setup(page, width);
      await page.goto(`/?view=garden&scope=root:ai&node=${concept}&display=graph`);
      await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
      await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
      await expect(page.locator('.og-note-badges')).toContainText('有独立讲解资料');
      await page.locator('.og-read-button').click(); const { geometry } = await reader(page);
      await info.attach(`canonical-geometry-${width}`, { body: JSON.stringify(geometry), contentType: 'application/json' });
      await page.reload(); await reader(page); await page.goBack();
      await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
      await page.goForward(); await reader(page);
      await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
      await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
      await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
      await expect(page.locator('[data-document]')).toHaveCount(0); expect(errors).toEqual([]);
    });
    test(`${unit.name} direct reader preserves numerical content, copy, wrapping and search / ${width}px`, async ({ page, context }, info) => {
      const errors = await setup(page, width); await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto(`/?view=article&article=${id}`); const { article, body, geometry } = await reader(page);
      await info.attach(`direct-geometry-${width}`, { body: JSON.stringify(geometry), contentType: 'application/json' });
      await page.screenshot({ path: info.outputPath(`reader-top-${width}.png`) });
      for (const [index, table] of (await body.locator('.md-table-region').all()).entries()) {
        await table.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`table-${index}-${width}.png`) });
      }
      await article.getByRole('button', { name: '复制代码', exact: true }).click();
      await expect(article.getByRole('button', { name: '复制代码', exact: true })).toContainText('已复制');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(blocks[0][1]);
      const wrap = article.getByRole('button', { name: '换行', exact: true }); await wrap.click();
      await expect(body.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'true');
      expect(await body.locator('pre').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      await page.screenshot({ path: info.outputPath(`wrapped-code-${width}.png`) });
      await wrap.click(); await expect(body.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'false');
      await page.reload(); await reader(page);
      if (!(await page.locator('.ws-sidebar').isVisible())) await page.getByRole('button', { name: '打开文档侧栏', exact: true }).click();
      await page.getByRole('button', { name: '全库搜索', exact: true }).click();
      await page.getByRole('searchbox', { name: '搜索全部文档', exact: true }).fill(metadata.title);
      await page.locator('.ws-search-results button').filter({ hasText: metadata.title }).first().click();
      await reader(page); expect(errors).toEqual([]);
    });
    test(`${unit.name} leaf and parent directory preserve relative order, refresh and history / ${width}px`, async ({ page }) => {
      const errors = await setup(page, width); await page.goto(`/?view=garden&scope=${branch}`);
      await reader(page); await page.reload(); await reader(page);
      const params = new URL(page.url()).searchParams; expect(params.get('article')).toBe(id);
      expect(new URLSearchParams(params.get('return') ?? '').get('scope')).toBe(branch);
      await page.goto(`/?view=garden&scope=${parentBranch}`);
      const parent = page.locator(`[data-folder="${parentBranch}"]`); await expect(parent).toBeVisible();
      await expect(page.locator('[data-document]')).toHaveCount(0);
      const entries = await parent.locator('[data-folder-entry]').evaluateAll(items => items.map(item => item.getAttribute('data-folder-entry')));
      const expected = unit.siblings.map(leaf => `${parentBranch}/${leaf}`);
      expect(entries.filter(entry => expected.includes(entry!))).toEqual(expected);
      if (unit.parentPath === 'math') {
        const tensor = entries.indexOf(`${parentBranch}/tensor-shapes`);
        expect(entries.slice(tensor, tensor + 3)).toEqual(['tensor-shapes', 'floating-point', 'probability'].map(leaf => `${parentBranch}/${leaf}`));
      }
      await parent.locator(`[data-folder-entry="${branch}"]`).click(); await reader(page);
      await page.reload(); await reader(page); await page.goBack(); await expect(parent).toBeVisible();
      await page.goForward(); await reader(page); expect(errors).toEqual([]);
    });
    test(`${unit.name} canonical folder exposes its lesson without automatic opening / ${width}px`, async ({ page }) => {
      const errors = await setup(page, width); await page.goto(`/?view=garden&scope=${concept}`);
      const folder = page.locator(`[data-folder="${concept}"]`);
      const checkFolder = async () => {
        await expect(folder).toBeVisible(); await expect(page.locator('[data-document]')).toHaveCount(0);
        await expect(folder.getByRole('button', { name: metadata.title, exact: true })).toBeVisible();
        await expect(folder.locator('.ws-empty')).toHaveCount(0);
      };
      await checkFolder(); await page.reload(); await checkFolder();
      await folder.getByRole('button', { name: metadata.title, exact: true }).click(); await reader(page);
      await page.reload(); await reader(page); await page.goBack(); await checkFolder();
      await page.goForward(); await reader(page); expect(errors).toEqual([]);
    });
    for (const [scope, targetId] of unit.onward) test(`${unit.name} onward ${scope} preserves refresh and history / ${width}px`, async ({ page }) => {
      const errors = await setup(page, width); await page.goto(`/?view=article&article=${id}`);
      const { body } = await reader(page); await body.locator(`a[href="?view=garden&scope=${scope}"]`).first().click();
      const destination = async () => {
        const target = page.locator(`[data-document="${targetId}"]`);
        await expect(target.locator('h1')).toHaveText(registry.find(article => article.id === targetId)!.title);
        await expect(target.locator('.markdown-body')).toBeVisible();
        await expect(target.locator('.katex-error, .md-mermaid-error')).toHaveCount(0);
        await expect(page.locator('[data-document]')).toHaveCount(1);
        expect(new URL(page.url()).searchParams.get('article')).toBe(targetId);
      };
      await destination(); await page.reload(); await destination(); await page.goBack(); await reader(page);
      await page.goForward(); await destination(); await page.goBack(); await reader(page); expect(errors).toEqual([]);
    });
    for (const source of unit.backlinks) test(`${unit.name} backlink from ${source} preserves refresh and history / ${width}px`, async ({ page }) => {
      const errors = await setup(page, width); await page.goto(`/?view=article&article=${source}`);
      const sourceMetadata = registry.find(article => article.id === source)!;
      const sourceMarkdown = readFileSync(sourceMetadata.file, 'utf8');
      const sourceCode = [...sourceMarkdown.matchAll(/^```python\r?\n(# nextchina-example: [a-z0-9-]+\r?\n[\s\S]*?)^```\s*$/gm)];
      expect(sourceCode).toHaveLength(1);
      const sourceArticle = page.locator(`[data-document="${source}"]`), sourceBody = sourceArticle.locator('.markdown-body');
      const checkSource = async () => {
        await expect(sourceArticle.locator('h1')).toHaveText(sourceMetadata.title); await expect(sourceBody).toBeVisible();
        await expect(sourceBody.locator('pre code')).toHaveCount(1);
        expect(await sourceBody.locator('pre code').textContent()).toBe(sourceCode[0][1]);
      };
      await checkSource(); await sourceBody.locator(`a[href="?view=garden&scope=${branch}"]`).click(); await reader(page);
      await page.reload(); await reader(page); await page.goBack(); await checkSource();
      await page.goForward(); await reader(page); await page.goBack(); await checkSource(); expect(errors).toEqual([]);
    });
  }
}
