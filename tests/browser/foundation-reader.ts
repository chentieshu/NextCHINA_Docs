import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { graph } from '../../src/features/garden/data';

// Additive helper for these two foundations only; existing browser tests stay intact.
type Foundation = {
  id: string; name: string; title: string; concept: string; parent: string; leaf: string;
  sources: string[]; headings: string[]; claims: string[]; formulas: string[];
  tableRows: number[]; onward: [string, string][]; backlinks: string[]; unfilled?: string[];
};
const inventory = JSON.parse(readFileSync('content/garden/content-inventory.json', 'utf8'));
const articles = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;

export function registerFoundationTests(unit: Foundation) {
  const branch = `branch:llm:math/${unit.leaf}`;
  const markdown = readFileSync(`content/models/foundations/${unit.id}.md`, 'utf8');
  const blocks = [...markdown.matchAll(/^```python\r?\n(# nextchina-example: ([a-z0-9-]+)\r?\n[\s\S]*?)^```\s*$/gm)];

  test(`${unit.name} owns exactly one original concept and one math leaf without review promotion`, () => {
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
    expect(knowledge.placements).toEqual([{ hubId: 'hub:llm', path: `math/${unit.leaf}` }]);
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
    expect(leaves[0].parentId).toBe('branch:llm:math');
    expect(leaves[0].embeddedArticleId).toBe(unit.id);
    expect(leaves[0].conceptRefs).toEqual([unit.concept]);
    expect(leaves[0].resourceRefs).toContainEqual({ articleId: unit.id, role: 'independent-explanation' });
    const leafEdges = graph.edges.filter(edge => edge.source === branch || edge.target === branch);
    expect(leafEdges.map(edge => edge.type).sort()).toEqual(['browse_child', 'references']);
    expect(leafEdges.find(edge => edge.type === 'references')?.target).toBe(unit.concept);
    const teaching = graph.edges.filter(edge => edge.type === 'recommended_before' && (edge.source === unit.concept || edge.target === unit.concept));
    if (unit.concept === 'concept:mutual-information') {
      expect(teaching).toHaveLength(1);
      expect(teaching[0].source).toBe('concept:kl-divergence');
      expect(teaching[0].target).toBe(unit.concept);
      expect(teaching[0].routeId).toBeUndefined();
      expect(teaching[0].assertionStatus).toBe('editorial');
      expect(teaching[0].reason).toContain('同一结果空间');
      expect(teaching[0].reason).toContain('不是定义上的必要条件');
      expect(teaching[0].reason).not.toContain('同一支持集');
      expect(teaching[0].scope).toContain('教学阅读次序');
      expect(teaching[0].provenance).toContain('mutual-information');
    } else expect(teaching).toEqual([]);
    expect(graph.edges.filter(edge => ['uses', 'is_a', 'mitigates', 'part_of', 'trained_with', 'evaluated_by'].includes(edge.type) && (edge.source === unit.concept || edge.target === unit.concept))).toEqual([]);
    expect(inventory.originalScope.originalModelNodeIds).toContain(unit.concept);
    expect(inventory.originalScope.originalModelNodeIds).toHaveLength(603);
    expect(inventory.originalScope.addedNodeIds).toContain(branch);
    expect(inventory.originalScope.missingOriginalNodeIds).toEqual([]);
    expect(inventory.summary.independentlyReviewedNodes).toBe(0);
    expect(graph.nodes.find(node => node.id === 'branch:llm:math')!.embeddedArticleId).toBeUndefined();
    for (const [leaf, id] of [['floating-point', 'floating-point-rounding'], ['probability', 'llm-conditional-probability'], ['objectives', 'llm-entropy-cross-entropy'], ['derivatives', 'llm-derivatives']]) {
      expect(graph.nodes.find(node => node.id === `branch:llm:math/${leaf}`)!.embeddedArticleId).toBe(id);
    }
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

  for (const width of [390, 1440]) test(`${unit.name} direct and leaf readers preserve code, sources and scoped links / ${width}px`, async ({ page, context }, info) => {
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
    for (const [scope, target] of unit.onward) {
      await article.locator(`.markdown-body a[href="?view=garden&scope=${scope}"]`).first().click();
      await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
      await page.reload();
      await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
      await page.goBack(); await reader(page);
      await page.goForward();
      await expect(page.locator(`[data-document="${target}"] .markdown-body`)).toBeVisible();
      await page.goBack(); await reader(page);
    }
    for (const concept of unit.unfilled ?? []) {
      await article.locator(`.markdown-body a[href="?view=garden&scope=${concept}"]`).click();
      await expect(page.locator(`[data-folder="${concept}"]`)).toBeVisible();
      await expect(page.locator('[data-document]')).toHaveCount(0);
      await page.goBack(); await reader(page);
    }
    for (const source of unit.backlinks) {
      await page.goto(`/?view=article&article=${source}`);
      await page.locator(`[data-document="${source}"] .markdown-body a[href="?view=garden&scope=${branch}"]`).click();
      await reader(page);
      await page.goBack();
      await expect(page.locator(`[data-document="${source}"] .markdown-body`)).toBeVisible();
      await page.goForward(); await reader(page);
    }
    await page.goto(`/?view=garden&scope=${branch}`);
    await reader(page); await page.reload(); await reader(page);
    const params = new URL(page.url()).searchParams;
    expect(params.get('article')).toBe(unit.id);
    expect(new URLSearchParams(params.get('return') ?? '').get('scope')).toBe(branch);
    await page.goto('/?view=garden&scope=branch:llm:math');
    const parent = page.locator('[data-folder="branch:llm:math"]');
    await expect(parent).toBeVisible();
    const entries = await parent.locator('[data-folder-entry]').evaluateAll(elements => elements.map(element => element.getAttribute('data-folder-entry')));
    const tensor = entries.indexOf('branch:llm:math/tensor-shapes');
    expect(entries.slice(tensor, tensor + 3)).toEqual(['branch:llm:math/tensor-shapes', 'branch:llm:math/floating-point', 'branch:llm:math/probability']);
    for (const leaf of ['tokenization', 'representations', 'tensor-shapes', 'floating-point', 'probability', 'softmax', 'objectives', 'mutual-information', 'derivatives', 'complexity']) expect(entries).toContain(`branch:llm:math/${leaf}`);
    await parent.locator(`[data-folder-entry="${branch}"]`).click(); await reader(page);
    await page.reload(); await reader(page);
    await page.goBack(); await expect(parent).toBeVisible();
    await page.goForward(); await reader(page);
    expect(errors).toEqual([]);
  });
}
