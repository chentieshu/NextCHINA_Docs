import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { graph } from '../../src/features/garden/data';

// Additive helper for the two optimization lessons; all prior specs/helpers stay intact.
type OptimizationLesson = {
  id: string; name: string; title: string; concept: string; parent: string; leaf: string; path: string; parentPath: string;
  sources: string[]; headings: string[]; claims: string[]; formulas: string[];
  tableRows: number[]; tableValues: { index: number; rows: string[][] }[]; onward: [string, string][]; backlinks: string[]; directoryLinks?: string[];
};
const inventory = JSON.parse(readFileSync('content/garden/content-inventory.json', 'utf8'));
const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;

export function registerOptimizationTests(unit: OptimizationLesson) {
  const branch = `branch:llm:${unit.path}`;
  const parentBranch = `branch:llm:${unit.parentPath}`;
  const markdown = readFileSync(`content/models/foundations/${unit.id}.md`, 'utf8');
  const blocks = [...markdown.matchAll(/^```python\r?\n(# nextchina-example: ([a-z0-9-]+)\r?\n[\s\S]*?)^```\s*$/gm)];

  test(`${unit.name} owns exactly one original concept and one training leaf without review promotion`, () => {
    const matches = articles.filter((article: { id: string }) => article.id === unit.id);
    expect(matches).toHaveLength(1);
    expect(matches[0].title).toBe(unit.title);
    expect(matches[0].category).toBe('foundations');
    const knowledge = matches[0].knowledgeUnit;
    expect(Object.keys(knowledge).sort()).toEqual(['kind', 'reviewStatus', 'exampleId', 'conceptIds', 'placements', 'sourceUrls', 'relatedResourceIds'].sort());
    expect(knowledge.kind).toBe('independent-explanation');
    expect(knowledge.reviewStatus).toBe('needs-independent-review');
    expect(knowledge.exampleId).toBe(unit.id);
    expect(knowledge.conceptIds).toEqual([unit.concept]);
    expect(knowledge.placements).toEqual([{ hubId: 'hub:llm', path: unit.path }]);
    expect(knowledge.sourceUrls).toEqual(unit.sources);
    expect(knowledge.relatedResourceIds).toEqual([]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0][2]).toBe(unit.id);
    expect([...markdown.matchAll(/^```python$/gm)]).toHaveLength(1);
    expect([...markdown.matchAll(/nextchina-example:/g)]).toHaveLength(1);
    const canonical = graph.nodes.filter(node => node.id === unit.concept);
    expect(canonical).toHaveLength(1);
    expect(canonical[0].kind).toBe('concept');
    expect(canonical[0].parentId).toBe(unit.parent);
    expect(canonical[0].articleBindings).toEqual([{ articleId: unit.id, coverage: 'explanation' }]);
    expect(canonical[0].embeddedArticleId).toBeUndefined();
    expect(canonical[0].contentStatus).toBe('outline');
    expect(canonical[0].evidenceStatus).toBe('not-reviewed');
    expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === unit.id)).map(node => node.id)).toEqual([unit.concept]);
    const leaves = graph.nodes.filter(node => node.id === branch);
    expect(leaves).toHaveLength(1);
    expect(leaves[0].parentId).toBe(parentBranch);
    expect(leaves[0].embeddedArticleId).toBe(unit.id);
    expect(leaves[0].conceptRefs).toEqual([unit.concept]);
    expect(leaves[0].resourceRefs).toContainEqual({ articleId: unit.id, role: 'independent-explanation' });
    const leafEdges = graph.edges.filter(edge => edge.source === branch || edge.target === branch);
    expect(leafEdges.map(edge => edge.type).sort()).toEqual(['browse_child', 'references']);
    expect(leafEdges.find(edge => edge.type === 'references')?.target).toBe(unit.concept);
    const teaching = graph.edges.filter(edge => edge.type === 'recommended_before' && (edge.source === unit.concept || edge.target === unit.concept));
    expect(teaching).toEqual([]);
    expect(graph.edges.filter(edge => ['uses', 'is_a', 'mitigates', 'part_of', 'trained_with', 'evaluated_by'].includes(edge.type) && (edge.source === unit.concept || edge.target === unit.concept))).toEqual([]);
    expect(inventory.originalScope.originalModelNodeIds).toContain(unit.concept);
    expect(inventory.originalScope.originalModelNodeIds).toHaveLength(603);
    expect(inventory.originalScope.addedNodeIds).toContain(branch);
    expect(inventory.originalScope.missingOriginalNodeIds).toEqual([]);
    expect(inventory.summary.independentlyReviewedNodes).toBe(0);
    const spaces = JSON.parse(readFileSync('content/spaces.json', 'utf8')).spaces;
    expect(spaces.filter((space: { chapterIds: string[] }) => space.chapterIds.includes(unit.id)).map((space: { id: string }) => space.id)).toEqual(['models']);
    expect(spaces.find((space: { id: string }) => space.id === 'models').chapterIds.filter((id: string) => id === unit.id)).toHaveLength(1);
    const budget = graph.nodes.find(node => node.id === 'branch:llm:training/budget')!;
    expect(budget.label).toBe('预算、规模、泛化、精度与恢复');
    expect(budget.conceptRefs).toEqual(['concept:overfitting', 'concept:checkpoint']);
    expect(budget.embeddedArticleId).toBeUndefined();
    expect(budget.articleBindings).toEqual([]);
    expect(budget.resourceRefs).toEqual([]);
    expect(graph.nodes.filter(node => node.parentId === budget.id).map(node => node.id)).toEqual(['branch:llm:training/budget/overfitting', 'branch:llm:training/budget/regularization']);
    const siblings = graph.nodes.filter(node => node.parentId === 'branch:llm:training').map(node => node.id);
    expect(siblings).toEqual(['data', 'samples', 'loop', 'adamw', 'budget', 'alignment', 'adaptation', 'not-training'].map(path => `branch:llm:training/${path}`));
    for (const [path, id] of [['loop', 'llm-training-loop'], ['samples', 'train-validation-test-data-leakage']]) {
      expect(graph.nodes.find(node => node.id === `branch:llm:training/${path}`)!.embeddedArticleId).toBe(id);
    }
    for (const id of ['concept:checkpoint']) {
      expect(graph.nodes.find(node => node.id === id)!.articleBindings).toEqual([]);
    }
    // This concept now owns its reviewed lesson; all other prior assertions remain.
    for (const [concept, article] of [['concept:linear-models', 'linear-logistic-regression'], ['concept:overfitting', 'overfitting-underfitting-capacity']])
    expect(graph.nodes.find(node => node.id === concept)!.articleBindings).toEqual([{ articleId: article, coverage: 'explanation' }]);
  expect(graph.nodes.find(node => node.id === 'concept:constrained-optimization')!.articleBindings)
      .toEqual([{ articleId: 'constrained-optimization-projection-kkt', coverage: 'explanation' }]);
  });

  async function reader(page: Page) {
    const article = page.locator(`[data-document="${unit.id}"]`), body = article.locator('.markdown-body');
    await expect(article.locator('h1')).toHaveText(unit.title);
    await expect(body).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => body.locator('.md-table-region[data-measured="false"]').count()).toBe(0);
    for (const name of unit.headings) await expect(body.getByRole('heading', { name, exact: true })).toBeVisible();
    for (const text of unit.claims) await expect(body).toContainText(text);
    await expect(article.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
    await expect(body.locator('.katex-error, .md-mermaid-error')).toHaveCount(0);
    const formulas = await body.locator('.katex annotation').allTextContents();
    for (const fragment of unit.formulas) expect(formulas.some(tex => tex.includes(fragment)), fragment).toBe(true);
    await expect(body.locator('.md-codeblock')).toHaveCount(1);
    await expect(body.locator('pre code')).toHaveCount(1);
    expect((await body.locator('pre code').textContent())?.trimEnd()).toBe(blocks[0][1].trimEnd());
    const tables = body.locator('.md-table-region');
    await expect(tables).toHaveCount(unit.tableRows.length);
    for (const [index, rows] of unit.tableRows.entries()) await expect(tables.nth(index).locator('tbody tr')).toHaveCount(rows);
    for (const { index, rows } of unit.tableValues) {
      for (const [rowIndex, expected] of rows.entries()) {
        const actual = await tables.nth(index).locator('tbody tr').nth(rowIndex).locator('td').evaluateAll(cells => cells.map(cell =>
          (cell.querySelector('.katex annotation')?.textContent ?? cell.textContent ?? '').replace(/\s/g, '')));
        expect(actual, `${unit.id}: rendered table ${index} row ${rowIndex}`).toEqual(expected.map(value => value.replace(/\s/g, '')));
      }
    }
    for (const url of unit.sources) {
      const links = body.locator(`a[href="${url}"]`);
      expect(await links.count()).toBeGreaterThan(0);
      await expect(links.first()).toBeVisible();
      expect((await links.first().textContent())?.trim().length).toBeGreaterThan(0);
    }
    const geometry = await body.evaluate(element => {
      const frame = element.getBoundingClientRect(), round = (n: number) => Math.round(n * 100) / 100;
      return {
        body: { width: round(frame.width), overflow: element.scrollWidth - element.clientWidth },
        formulas: [...element.querySelectorAll<HTMLElement>('.katex-display')].map(display => {
          const html = display.querySelector('.katex-html')!, htmlFrame = html.getBoundingClientRect();
          // These are layout content boxes, not the painted glyph/ink bounds.
          const boxes = [...html.querySelectorAll(':scope > .base')].map(base => base.getBoundingClientRect());
          const contentLeft = Math.min(...boxes.map(box => box.left)), contentRight = Math.max(...boxes.map(box => box.right));
          return { tex: display.querySelector('annotation')!.textContent, contentBoxes: boxes.length,
            contentWidth: round(contentRight - contentLeft), overflow: display.scrollWidth - display.clientWidth,
            leftEscape: round(Math.max(0, frame.left - htmlFrame.left)), rightEscape: round(Math.max(0, htmlFrame.right - frame.right)),
            contentLeftEscape: round(Math.max(0, frame.left - contentLeft)), contentRightEscape: round(Math.max(0, contentRight - frame.right)) };
        }),
        tables: [...element.querySelectorAll<HTMLElement>('.md-table-region')].map(region => {
          const scroll = region.querySelector<HTMLElement>('.md-table-scroll')!, table = region.querySelector('table')!;
          return { columns: Number(region.dataset.columns), viewport: scroll.clientWidth, width: table.getBoundingClientRect().width,
            overflow: scroll.scrollWidth - scroll.clientWidth, overflowMode: getComputedStyle(scroll).overflowX };
        }),
        escapedFrames: [...element.querySelectorAll('p, li, h2, h3, .md-codeblock, .katex-display, .md-table-region')].filter(item => {
          const rect = item.getBoundingClientRect(); return rect.left < frame.left - 1 || rect.right > frame.right + 1;
        }).map(item => ({ tag: item.tagName, text: item.textContent?.slice(0, 80) })),
      };
    });
    expect(geometry.body.overflow).toBeLessThanOrEqual(1);
    expect(geometry.escapedFrames).toEqual([]);
    for (const formula of geometry.formulas) {
      expect(formula.overflow, formula.tex ?? '').toBeLessThanOrEqual(1);
      expect(formula.leftEscape, formula.tex ?? '').toBeLessThanOrEqual(1);
      expect(formula.rightEscape, formula.tex ?? '').toBeLessThanOrEqual(1);
      expect(formula.contentBoxes, formula.tex ?? '').toBeGreaterThan(0);
      expect(formula.contentLeftEscape, formula.tex ?? '').toBeLessThanOrEqual(1);
      expect(formula.contentRightEscape, formula.tex ?? '').toBeLessThanOrEqual(1);
    }
    for (const table of geometry.tables) {
      expect(table.width).toBeGreaterThanOrEqual(table.viewport - 1);
      if (table.overflow > 1) expect(['auto', 'scroll']).toContain(table.overflowMode);
      if (table.columns <= 2) expect(table.overflow).toBeLessThanOrEqual(1);
    }
    expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-document]')).toHaveCount(1);
    await expect(page.getByRole('tab')).toHaveCount(0);
    return { article, body, geometry };
  }

  async function setup(page: Page, width: number) {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.setViewportSize({ width, height: 900 });
    return errors;
  }

  for (const width of [390, 1440]) test(`${unit.name} canonical reader preserves refresh, history and return / ${width}px`, async ({ page }, info) => {
    const errors = await setup(page, width);
    await page.goto(`/?view=garden&scope=root:ai&node=${unit.concept}&display=graph`);
    await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', unit.concept);
    await expect(page.locator('.og-note-badges')).toContainText('有独立讲解资料');
    await page.locator('.og-read-button').click();
    const { geometry } = await reader(page);
    await info.attach(`${unit.leaf}-canonical-geometry-${width}`, { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' });
    await page.reload(); await reader(page);
    await page.goBack();
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', unit.concept);
    await page.goForward(); await reader(page);
    await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
    await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
    await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', unit.concept);
    await expect(page.locator('[data-document]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  for (const width of [390, 1440]) test(`${unit.name} direct and leaf readers preserve code, sources and parent directories / ${width}px`, async ({ page, context }, info) => {
    const errors = await setup(page, width);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`/?view=article&article=${unit.id}`);
    const { article, body, geometry } = await reader(page);
    await info.attach(`${unit.leaf}-direct-geometry-${width}`, { body: JSON.stringify(geometry, null, 2), contentType: 'application/json' });
    await page.screenshot({ path: info.outputPath(`${unit.leaf}-top-${width}.png`) });
    for (const [index, table] of (await body.locator('.md-table-region').all()).entries()) {
      await table.scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath(`${unit.leaf}-table-${index}-${width}.png`) });
    }
    const widest = geometry.formulas.reduce((best, row, index, all) => row.contentWidth > all[best].contentWidth ? index : best, 0);
    await body.locator('.katex-display').nth(widest).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`${unit.leaf}-widest-formula-content-${width}.png`) });
    await article.getByRole('button', { name: '复制代码', exact: true }).click();
    await expect(article.getByRole('button', { name: '复制代码', exact: true })).toContainText('已复制');
    expect((await page.evaluate(() => navigator.clipboard.readText())).trimEnd()).toBe(blocks[0][1].trimEnd());
    const wrap = article.getByRole('button', { name: '换行', exact: true });
    await wrap.click();
    await expect(body.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'true');
    expect(await body.locator('pre').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: info.outputPath(`${unit.leaf}-wrapped-code-${width}.png`) });
    await wrap.click();
    await expect(body.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'false');
    await page.reload(); await reader(page);
    await page.goto(`/?view=garden&scope=${branch}`);
    await reader(page); await page.reload(); await reader(page);
    const params = new URL(page.url()).searchParams;
    expect(params.get('article')).toBe(unit.id);
    expect(new URLSearchParams(params.get('return') ?? '').get('scope')).toBe(branch);
    await page.goto(`/?view=garden&scope=${parentBranch}`);
    const parent = page.locator(`[data-folder="${parentBranch}"]`);
    await expect(parent).toBeVisible();
    await expect(page.locator('[data-document]')).toHaveCount(0);
    if (unit.parentPath === 'training/budget') {
      await expect(parent.locator('h1')).toHaveText('预算、规模、泛化、精度与恢复');
      await expect(parent.getByRole('button', { name: '过拟合与欠拟合', exact: true })).toBeVisible();
      await expect(parent.getByRole('button', { name: '检查点与恢复', exact: true })).toBeVisible();
    } else {
      const entries = await parent.locator('[data-folder-entry]').evaluateAll(elements => elements.map(element => element.getAttribute('data-folder-entry')));
      expect(entries).toEqual(['data', 'samples', 'loop', 'adamw', 'budget', 'alignment', 'adaptation', 'not-training'].map(path => `branch:llm:training/${path}`));
    }
    await parent.locator(`[data-folder-entry="${branch}"]`).click(); await reader(page);
    await page.reload(); await reader(page);
    await page.goBack(); await expect(parent).toBeVisible();
    await page.goForward(); await reader(page);
    // Public reading search uses the same registered article and reader.
    if (!(await page.locator('.ws-sidebar').isVisible())) await page.getByRole('button', { name: '打开文档侧栏', exact: true }).click();
    await page.getByRole('button', { name: '全库搜索', exact: true }).click();
    await page.getByRole('searchbox', { name: '搜索全部文档', exact: true }).fill(unit.title);
    await page.locator('.ws-search-results button').filter({ hasText: unit.title }).first().click();
    await reader(page);
    expect(errors).toEqual([]);
  });
  for (const width of [390, 1440]) for (const [scope, target] of unit.onward) test(`${unit.name} onward ${scope} preserves refresh and history / ${width}px`, async ({ page }) => {
    const errors = await setup(page, width);
    await page.goto(`/?view=article&article=${unit.id}`);
    const { article } = await reader(page);
    await article.locator(`.markdown-body a[href="?view=garden&scope=${scope}"]`).first().click();
    const isConcept = scope.startsWith('concept:');
    const folder = page.locator(`[data-folder="${scope}"]`);
    if (isConcept) {
      await expect(folder).toBeVisible();
      await expect(page.locator('[data-document]')).toHaveCount(0);
      const targetTitle = articles.find((entry: { id: string }) => entry.id === target).title;
      await folder.getByRole('button', { name: targetTitle, exact: true }).click();
    }
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.reload();
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    if (isConcept) { await expect(folder).toBeVisible(); await page.goBack(); }
    await reader(page);
    await page.goForward();
    if (isConcept) { await expect(folder).toBeVisible(); await page.goForward(); }
    await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
    await page.goBack();
    if (isConcept) { await expect(folder).toBeVisible(); await page.goBack(); }
    await reader(page);
    expect(errors).toEqual([]);
  });

  for (const width of [390, 1440]) for (const scope of unit.directoryLinks ?? []) test(`${unit.name} directory link ${scope} preserves refresh and return / ${width}px`, async ({ page }) => {
    const errors = await setup(page, width);
    await page.goto(`/?view=article&article=${unit.id}`);
    const { article } = await reader(page);
    await article.locator(`.markdown-body a[href="?view=garden&scope=${scope}"]`).first().click();
    await expect(page.locator(`[data-folder="${scope}"]`)).toBeVisible();
    await expect(page.locator('[data-document]')).toHaveCount(0);
    await page.reload();
    await expect(page.locator(`[data-folder="${scope}"]`)).toBeVisible();
    await page.goBack(); await reader(page);
    expect(errors).toEqual([]);
  });

  for (const width of [390, 1440]) for (const source of unit.backlinks) test(`${unit.name} backlink from ${source} preserves refresh and history / ${width}px`, async ({ page }) => {
    const errors = await setup(page, width);
    await page.goto(`/?view=article&article=${unit.id}`);
    const { article } = await reader(page);
    await page.goto(`/?view=article&article=${source}`);
    await page.locator(`[data-document="${source}"] .markdown-body a[href="?view=garden&scope=${branch}"]`).click();
    await reader(page);
    await page.reload(); await reader(page);
    await page.goBack();
    await expect(page.locator(`[data-document="${source}"] .markdown-body`)).toBeVisible();
    await page.goForward(); await reader(page);
    expect(errors).toEqual([]);
  });
}
