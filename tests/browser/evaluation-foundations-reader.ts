import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { graph } from '../../src/features/garden/data';

// This helper is deliberately limited to the two reviewed observable lessons.
// Numeric readers keep their unconditional Python, copy and calculation contracts.
export type EvaluationLesson = {
  article: { id: 'evaluation-dataset-target-coverage' | 'benchmark-protocol-comparable-runs'; file: string; title: string; space: string; category: string; categoryName: string; subtitle: string; date: string; tags: string[]; excerpt: string;
    knowledgeUnit: { kind: string; reviewStatus: string; exampleId: string; conceptIds: string[];
      placements: { hubId: string; path: string }[]; sourceUrls: string[]; relatedResourceIds: string[] } };
  name: string; sha256: string; text: string; headings: { depth: number; text: string }[];
  tables: string[][][]; displayMath: string[]; inlineMath: string[]; inlineCode: string[];
  sections: { heading: string; text: string; fields: string[] }[];
  anchors: { text: string; href: string; section: string | null }[]; atomicTokens: string[];
  onward: { scope: string; article?: string; folder: boolean; section: string }[];
};
const registry = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
const compact = (value: string) => value.replace(/\s/g, '');
const cellText = (value: string) => value.replace(/\s+/g, ' ').trim();
const siblings = ['capabilities', 'datasets', 'protocol', 'metrics', 'calibration', 'methodology',
  'text-preference', 'composite', 'specialized', 'efficiency', 'system-results'];

// Exported only so the scratch pixel preflight exercises these exact reader measurements.
export function evaluationSnapshot(element: HTMLElement) {
  const text = (node: Element) => {
    const clone = node.cloneNode(true) as Element;
    for (const controls of clone.querySelectorAll('.md-table-tools')) controls.remove();
    for (const math of clone.querySelectorAll('.katex')) math.replaceWith(document.createTextNode(math.querySelector('annotation')!.textContent ?? ''));
    return clone.textContent ?? '';
  };
  const headings = [...element.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')];
  return {
    text: text(element), headings: headings.map(h => ({ depth: Number(h.tagName.slice(1)), text: text(h) })),
    tables: [...element.querySelectorAll('table')].map(table => [...table.querySelectorAll('tr')].map(row => [...row.querySelectorAll('th,td')].map(text))),
    displayMath: [...element.querySelectorAll('.katex-display annotation')].map(node => node.textContent ?? ''),
    inlineMath: [...element.querySelectorAll('.katex')].filter(node => !node.closest('.katex-display')).map(node => node.querySelector('annotation')!.textContent ?? ''),
    inlineCode: [...element.querySelectorAll('code')].filter(node => !node.closest('pre')).map(node => node.textContent ?? ''),
    anchors: [...element.querySelectorAll('a')].map(anchor => {
      let block: Element = anchor;
      while (block.parentElement && !block.parentElement.classList.contains('markdown-prose')) block = block.parentElement;
      let previous = block.previousElementSibling;
      while (previous && !/^H[1-6]$/.test(previous.tagName)) previous = previous.previousElementSibling;
      return { text: text(anchor), href: anchor.getAttribute('href')!, section: previous ? text(previous) : null };
    }),
    sections: headings.map(heading => {
      const nodes: Element[] = []; let next = heading.nextElementSibling;
      while (next && !(/^H[1-6]$/.test(next.tagName) && Number(next.tagName.slice(1)) <= Number(heading.tagName.slice(1)))) {
        nodes.push(next); next = next.nextElementSibling;
      }
      return { heading: text(heading), text: nodes.map(text).join(''), fields: nodes.flatMap(node => [...node.querySelectorAll('strong')].map(text)) };
    }),
    invisible: [...element.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6,p,li,th,td,strong,a,code')].filter(node => {
      const rect = node.getBoundingClientRect(), css = getComputedStyle(node);
      return !rect.width || !rect.height || css.visibility === 'hidden' || css.display === 'none' || Number(css.opacity) === 0;
    }).map(node => ({ tag: node.tagName, text: node.textContent?.slice(0, 80) })),
  };
}

export function evaluationGeometry(element: HTMLElement) {
  const frame = element.getBoundingClientRect(), round = (value: number) => Math.round(value * 100) / 100;
  const escape = (left: number, right: number, container: DOMRect) => ({
    left: round(Math.max(0, container.left - left)), right: round(Math.max(0, right - container.right)) });
  const math = [...element.querySelectorAll<HTMLElement>('.katex')].map(katex => {
    const html = katex.querySelector<HTMLElement>('.katex-html')!;
    const boxes = [...html.querySelectorAll(':scope > .base')].map(base => base.getBoundingClientRect());
    const left = Math.min(...boxes.map(box => box.left)), right = Math.max(...boxes.map(box => box.right));
    const cell = katex.closest('td,th'), display = katex.closest<HTMLElement>('.katex-display');
    return { tex: katex.querySelector('annotation')!.textContent, context: cell ? 'table-cell' : display ? 'display' : 'prose',
      boxes: boxes.length, width: round(right - left), escape: escape(left, right, cell ? cell.getBoundingClientRect() : frame),
      topSpread: round(Math.max(...boxes.map(box => box.top)) - Math.min(...boxes.map(box => box.top))),
      displayOverflow: display ? display.scrollWidth - display.clientWidth : 0 };
  });
  const textBounds = [...element.querySelectorAll<HTMLElement>('p,li,h2,h3,th,td,:not(pre) > code')].map(item => {
    const cell = item.closest('th,td'), container = cell ? cell.getBoundingClientRect() : frame;
    const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT), rects: DOMRect[] = []; let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim() || node.parentElement?.closest('.katex,pre')) continue;
      const range = document.createRange(); range.selectNodeContents(node); rects.push(...range.getClientRects());
    }
    const plain = item.textContent?.trim() ?? '';
    const atomic = (item.tagName === 'CODE' && plain.length > 0 && !/\s/.test(plain)) || (!!cell && !item.querySelector('.katex')
      && /^(?:[0-9]+(?:\/[0-9]+)?|[bcop][0-9]+|GO|HOLD|ABSTAIN)$/.test(plain));
    return { tag: item.tagName, text: plain.slice(0, 100), context: cell ? 'table-cell' : 'prose', atomic,
      fragments: rects.length, topSpread: rects.length ? round(Math.max(...rects.map(rect => rect.top)) - Math.min(...rects.map(rect => rect.top))) : 0,
      ...(rects.length ? escape(Math.min(...rects.map(rect => rect.left)), Math.max(...rects.map(rect => rect.right)), container) : { left: 0, right: 0 }) };
  });
  const inlineCodeFrames = [...element.querySelectorAll<HTMLElement>('code')].filter(code => !code.closest('pre')).map(code => {
    const cell = code.closest('th,td'), container = cell ? cell.getBoundingClientRect() : frame;
    return { text: code.textContent, context: cell ? 'table-cell' : 'prose',
      fragments: [...code.getClientRects()].map(rect => escape(rect.left, rect.right, container)) };
  });
  const atomicTokens: { token: string; context: string; fragments: number; topSpread: number; left: number; right: number }[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); let tokenNode: Node | null;
  const atomicPattern = /(?<![A-Za-z0-9_-])(?:␠HOLD␠|run-(?:A1|B1|B2|BT|C2)|C-[AB]1|photo-v1(?:\/r1)?|day-[co]|resize-v1|route-v[12]|img-p[1-8]@1|HOLD|GO|ABSTAIN|FAQ|[cpob]\d{1,2}|[DPTUSABCRHLFK]\d|PB1|r[12]|\d{4}-\d{2}-\d{2}|\d+(?:\.\d+)?(?:\/\d+)?%?)(?![A-Za-z0-9_-])/g;
  while ((tokenNode = walker.nextNode())) {
    if (tokenNode.parentElement?.closest('.katex,pre,.md-table-tools')) continue;
    for (const match of (tokenNode.textContent ?? '').matchAll(atomicPattern)) {
      const range = document.createRange(); range.setStart(tokenNode, match.index!); range.setEnd(tokenNode, match.index! + match[0].length);
      const boxes = [...range.getClientRects()], cell = tokenNode.parentElement?.closest('td,th');
      atomicTokens.push({ token: match[0], context: cell ? 'table-cell' : 'prose', fragments: boxes.length,
        topSpread: boxes.length ? round(Math.max(...boxes.map(rect => rect.top)) - Math.min(...boxes.map(rect => rect.top))) : 0,
        ...(boxes.length ? escape(Math.min(...boxes.map(rect => rect.left)), Math.max(...boxes.map(rect => rect.right)), cell ? cell.getBoundingClientRect() : frame) : { left: 0, right: 0 }) });
    }
  }
  return { bodyOverflow: element.scrollWidth - element.clientWidth, math, textBounds, inlineCodeFrames, atomicTokens,
    frames: [...element.querySelectorAll<HTMLElement>('p,li,h2,h3,.katex-display,.md-table-region')].filter(item => !item.closest('th,td'))
      .map(item => ({ tag: item.tagName, ...escape(item.getBoundingClientRect().left, item.getBoundingClientRect().right, frame) })),
    tables: [...element.querySelectorAll<HTMLElement>('.md-table-region')].map(region => {
      const scroll = region.querySelector<HTMLElement>('.md-table-scroll')!, table = region.querySelector('table')!;
      return { columns: Number(region.dataset.columns), viewport: scroll.clientWidth, width: table.getBoundingClientRect().width,
        overflow: scroll.scrollWidth - scroll.clientWidth, scrollLeft: scroll.scrollLeft, overflowMode: getComputedStyle(scroll).overflowX,
        frame: escape(scroll.getBoundingClientRect().left, scroll.getBoundingClientRect().right, frame) };
    }) };
}

export function assertEvaluationGeometry(geometry: ReturnType<typeof evaluationGeometry>) {
  expect(geometry.bodyOverflow).toBeLessThanOrEqual(1);
  for (const frame of geometry.frames) { expect(frame.left).toBeLessThanOrEqual(1); expect(frame.right).toBeLessThanOrEqual(1); }
  // An empty list is legitimate. Every actual formula still has strict geometry.
  for (const item of geometry.math) {
    expect(item.boxes, item.tex ?? '').toBeGreaterThan(0); expect(Number.isFinite(item.width)).toBe(true);
    expect(item.width, item.tex ?? '').toBeGreaterThan(0);
    expect(item.escape.left, item.tex ?? '').toBeLessThanOrEqual(1); expect(item.escape.right, item.tex ?? '').toBeLessThanOrEqual(1);
    expect(item.displayOverflow, item.tex ?? '').toBeLessThanOrEqual(1);
    if (item.context === 'table-cell') expect(item.topSpread, item.tex ?? '').toBeLessThanOrEqual(1);
  }
  for (const item of geometry.textBounds) {
    expect(item.left, item.text).toBeLessThanOrEqual(1); expect(item.right, item.text).toBeLessThanOrEqual(1);
    if (item.atomic) { expect(item.fragments, item.text).toBeGreaterThan(0); expect(item.topSpread, item.text).toBeLessThanOrEqual(1); }
  }
  for (const token of geometry.atomicTokens) {
    expect(token.fragments, token.token).toBeGreaterThan(0); expect(token.topSpread, token.token).toBeLessThanOrEqual(1);
    expect(token.left, token.token).toBeLessThanOrEqual(1); expect(token.right, token.token).toBeLessThanOrEqual(1);
  }
  for (const code of geometry.inlineCodeFrames) {
    expect(code.fragments.length, code.text ?? '').toBeGreaterThan(0);
    for (const fragment of code.fragments) { expect(fragment.left, code.text ?? '').toBeLessThanOrEqual(1); expect(fragment.right, code.text ?? '').toBeLessThanOrEqual(1); }
  }
  for (const table of geometry.tables) {
    expect(table.frame.left).toBeLessThanOrEqual(1); expect(table.frame.right).toBeLessThanOrEqual(1);
    expect(table.width).toBeGreaterThanOrEqual(table.viewport - 1);
    if (table.overflow > 1) expect(['auto', 'scroll']).toContain(table.overflowMode);
    if (table.columns <= 2) expect(table.overflow).toBeLessThanOrEqual(1);
  }
}

export async function checkEvaluationReader(page: Page, unit: EvaluationLesson) {
  const article = page.locator(`[data-document="${unit.article.id}"]`), body = article.locator('.markdown-body');
  await expect(article.locator('h1')).toHaveText(unit.article.title); await expect(body).toBeVisible();
  await expect(body.locator('blockquote').first().locator('strong').first()).toHaveText('本页解决的问题');
  await page.evaluate(() => document.fonts.ready);
  await expect.poll(() => body.locator('.md-table-region[data-measured="false"]').count()).toBe(0);
  await expect(article.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
  await expect(body.locator('.katex-error,.md-mermaid-error,.md-codeblock,pre,.md-mermaid,.md-diagram')).toHaveCount(0);
  await expect(article.getByRole('button', { name: '复制代码', exact: true })).toHaveCount(0);
  await expect(article.getByRole('button', { name: '换行', exact: true })).toHaveCount(0);
  const snapshot = await body.evaluate(evaluationSnapshot);
  expect(compact(snapshot.text), 'complete visible accepted prose, premises, records, questions, answers, limits and source labels').toBe(compact(unit.text));
  expect(snapshot.headings).toEqual(unit.headings);
  expect(snapshot.tables.map(table => table.map(row => row.map(cellText)))).toEqual(unit.tables.map(table => table.map(row => row.map(cellText))));
  expect(snapshot.displayMath.map(compact)).toEqual(unit.displayMath.map(compact));
  expect(snapshot.inlineMath.map(compact)).toEqual(unit.inlineMath.map(compact));
  expect(snapshot.inlineCode).toEqual(unit.inlineCode);
  expect(snapshot.anchors).toEqual(unit.anchors);
  for (const section of unit.sections) {
    const actual = snapshot.sections.filter(item => item.heading === section.heading); expect(actual).toHaveLength(1);
    expect(compact(actual[0].text), section.heading).toBe(compact(section.text));
    expect(actual[0].fields).toEqual(section.fields);
  }
  expect(snapshot.invisible).toEqual([]);
  for (const url of unit.article.knowledgeUnit.sourceUrls) {
    const links = body.locator(`a[href="${url}"]`); expect(await links.count()).toBeGreaterThan(0);
    for (const link of await links.all()) { await expect(link).toBeVisible(); expect((await link.textContent())?.trim()).toBeTruthy(); }
  }
  const geometry = await body.evaluate(evaluationGeometry); assertEvaluationGeometry(geometry);
  expect(geometry.atomicTokens.map(item => item.token)).toEqual(unit.atomicTokens);
  expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-document]')).toHaveCount(1); await expect(page.getByRole('tab')).toHaveCount(0);
  return { article, body, geometry, snapshot };
}

export async function setupEvaluationPage(page: Page, width: number, theme = 'dark') {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.setViewportSize({ width, height: 900 });
  await page.addInitScript(value => localStorage.setItem('nextchina-theme', value), theme);
  return errors;
}

export async function captureEvaluationPixels(page: Page, unit: EvaluationLesson, info: Pick<TestInfo, 'outputPath' | 'attach'>, suffix: string) {
  const { body, geometry } = await checkEvaluationReader(page, unit);
  await info.attach(`geometry-${suffix}`, { body: JSON.stringify(geometry), contentType: 'application/json' });
  await page.screenshot({ path: info.outputPath(`reader-top-${suffix}.png`) });
  for (const [index, table] of (await body.locator('.md-table-region').all()).entries()) {
    await table.scrollIntoViewIfNeeded(); const scroll = table.locator('.md-table-scroll');
    await scroll.evaluate(element => { element.scrollLeft = 0; });
    await page.screenshot({ path: info.outputPath(`table-${index}-left-${suffix}.png`) });
    if (await scroll.evaluate(element => element.scrollWidth - element.clientWidth > 1)) {
      await expect(table.getByRole('button', { name: '表格向右滚动', exact: true })).toBeEnabled();
      await table.getByRole('button', { name: '表格向右滚动', exact: true }).click();
      await expect.poll(() => scroll.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
      await scroll.evaluate(element => { element.scrollLeft = element.scrollWidth; });
      await expect.poll(() => scroll.evaluate(element => element.scrollWidth - element.clientWidth - element.scrollLeft)).toBeLessThanOrEqual(1);
      assertEvaluationGeometry(await body.evaluate(evaluationGeometry));
      const rightmost = await table.locator('tr').first().locator('th').last().boundingBox(), viewport = await scroll.boundingBox();
      expect(rightmost!.x + rightmost!.width).toBeLessThanOrEqual(viewport!.x + viewport!.width + 1);
      await page.screenshot({ path: info.outputPath(`table-${index}-right-${suffix}.png`) });
      await scroll.evaluate(element => { element.scrollLeft = 0; });
    }
  }
  for (const [index, formula] of (await body.locator('.katex').all()).entries()) {
    await formula.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`math-${index}-${suffix}.png`) });
  }
  for (const [index, code] of (await body.locator('code').all()).entries()) {
    await code.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`inline-code-${index}-${suffix}.png`) });
  }
  // Overlapping viewport tiles cover entire long answers/repairs, including D4/FAQ and T1/T2.
  // Heading-only screenshots would leave the lower paragraphs uninspected.
  const scroller = page.locator('.ws-scroll');
  const size = await scroller.evaluate(element => ({ height: element.clientHeight, max: element.scrollHeight - element.clientHeight }));
  const positions: number[] = [];
  for (let offset = 0; ; offset += Math.max(1, Math.floor(size.height * .75))) {
    const requested = Math.min(offset, size.max);
    const actual = await scroller.evaluate((element, value) => { element.scrollTop = value; return element.scrollTop; }, requested);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    positions.push(actual); await page.screenshot({ path: info.outputPath(`complete-reader-tile-${positions.length - 1}-${suffix}.png`) });
    if (requested === size.max) break;
  }
  expect(positions[0]).toBe(0); expect(Math.abs(positions[positions.length - 1] - size.max)).toBeLessThanOrEqual(1);
  for (let index = 1; index < positions.length; index++) expect(positions[index] - positions[index - 1]).toBeLessThanOrEqual(size.height);
  await info.attach(`complete-reader-tile-coverage-${suffix}`, { body: JSON.stringify({ ...size, positions }), contentType: 'application/json' });
}

export function registerEvaluationTests(unit: EvaluationLesson) {
  const { article: metadata } = unit, id = metadata.id, knowledge = metadata.knowledgeUnit;
  const concept = knowledge.conceptIds[0], branch = `branch:llm:${knowledge.placements[0].path}`;
  const markdown = readFileSync(metadata.file, 'utf8');
  test(`${unit.name} owns its exact accepted observable identity and one original concept`, () => {
    expect(registry.filter((article: { id: string }) => article.id === id)).toEqual([metadata]);
    expect(createHash('sha256').update(markdown).digest('hex')).toBe(unit.sha256);
    expect(Object.keys(knowledge).sort()).toEqual(['kind','reviewStatus','exampleId','conceptIds','placements','sourceUrls','relatedResourceIds'].sort());
    expect(knowledge.kind).toBe('independent-explanation'); expect(knowledge.reviewStatus).toBe('needs-independent-review');
    expect(knowledge.exampleId).toBe(id); expect(knowledge.conceptIds).toEqual([concept]); expect(knowledge.relatedResourceIds).toEqual([]);
    expect([...markdown.matchAll(/nextchina-example:/g)].length).toBe(0);
    expect([...markdown.matchAll(/^(?:```|~~~)/gm)].length).toBe(0);
    const canonical = graph.nodes.filter(node => node.id === concept); expect(canonical).toHaveLength(1);
    expect(canonical[0]).toMatchObject({ kind: 'concept', parentId: 'topic:evaluation-protocols',
      articleBindings: [{ articleId: id, coverage: 'explanation' }], contentStatus: 'outline', evidenceStatus: 'not-reviewed' });
    expect(canonical[0].embeddedArticleId).toBeUndefined();
    expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === id)).map(node => node.id)).toEqual([concept]);
    const leaf = graph.nodes.find(node => node.id === branch)!;
    expect(leaf).toMatchObject({ parentId: 'branch:llm:rankings', embeddedArticleId: id, conceptRefs: [concept] });
    expect(leaf.resourceRefs).toContainEqual({ articleId: id, role: 'independent-explanation' });
    const edges = graph.edges.filter(edge => edge.source === branch || edge.target === branch);
    expect(edges.map(edge => edge.type).sort()).toEqual(['browse_child','references']);
    expect(edges.find(edge => edge.type === 'references')?.target).toBe(concept);
    const spaces = JSON.parse(readFileSync('content/spaces.json','utf8')).spaces;
    expect(spaces.filter((space: {chapterIds: string[]}) => space.chapterIds.includes(id)).map((space: {id: string}) => space.id)).toEqual(['models']);
    expect(spaces.find((space: {id: string}) => space.id === 'models').chapterIds.filter((value: string) => value === id)).toHaveLength(1);
  });
  async function reader(page: Page) { return checkEvaluationReader(page, unit); }
  async function folder(page: Page, scope: string, articleId?: string) {
    const target = page.locator(`[data-folder="${scope}"]`); await expect(target).toBeVisible();
    await expect(target.locator('h1')).toHaveText(graph.nodes.find(node => node.id === scope)!.label);
    expect(new URL(page.url()).searchParams.get('scope')).toBe(scope); await expect(page.locator('[data-document]')).toHaveCount(0);
    if (articleId) {
      await expect(target.getByRole('button', {name: registry.find((article: {id: string}) => article.id === articleId).title, exact: true})).toBeVisible();
      await expect(target.locator('.ws-empty')).toHaveCount(0);
    }
    return target;
  }
  async function destinationReader(page: Page, articleId: string, returnScope?: string | null) {
    const destination = page.locator(`[data-document="${articleId}"]`);
    await expect(destination.locator('h1')).toHaveText(registry.find((article: {id: string}) => article.id === articleId).title);
    await expect(destination.locator('.markdown-body')).toBeVisible();
    await expect(destination.locator('.katex-error,.md-mermaid-error')).toHaveCount(0);
    await expect(page.locator('[data-document]')).toHaveCount(1);
    expect(new URL(page.url()).searchParams.get('article')).toBe(articleId);
    await expect(page.getByRole('tab')).toHaveCount(0);
    if (returnScope === null) expect(new URL(page.url()).searchParams.has('return')).toBe(false);
    else if (returnScope) expect(new URLSearchParams(new URL(page.url()).searchParams.get('return') ?? '').get('scope')).toBe(returnScope);
  }
  for (const width of [390,1440]) {
    for (const theme of ['light','dark']) test(`${unit.name} complete observable reader, actual ${theme} geometry and search / ${width}px`, async ({page}, info) => {
      const errors = await setupEvaluationPage(page,width,theme); await page.goto(`/?view=article&article=${id}`);
      await expect(page.locator('.workspace')).toHaveAttribute('data-theme',theme);
      await expect(page.locator(`.markdown-${theme}`)).toBeVisible();
      await captureEvaluationPixels(page,unit,info,`${width}-${theme}`);
      await page.reload(); await reader(page);
      if (!(await page.locator('.ws-sidebar').isVisible())) await page.getByRole('button',{name:'打开文档侧栏',exact:true}).click();
      await page.getByRole('button',{name:'全库搜索',exact:true}).click();
      await page.getByRole('searchbox',{name:'搜索全部文档',exact:true}).fill(metadata.title);
      await page.locator('.ws-search-results button').filter({hasText:metadata.title}).first().click(); await reader(page); expect(errors).toEqual([]);
    });
    test(`${unit.name} canonical graph reader preserves refresh, history and return / ${width}px`, async ({page}) => {
      const errors=await setupEvaluationPage(page,width);await page.goto(`/?view=garden&scope=root:ai&node=${concept}&display=graph`);
      await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout','ready');
      await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id',concept);
      await expect(page.locator('.og-note-badges')).toContainText('有独立讲解资料');await page.locator('.og-read-button').click();await reader(page);
      await page.reload();await reader(page);await page.goBack();await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id',concept);
      await page.goForward();await reader(page);await page.getByRole('button',{name:'返回知识地图',exact:true}).click();
      await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id',concept);await expect(page.locator('[data-document]')).toHaveCount(0);expect(errors).toEqual([]);
    });
    test(`${unit.name} leaf and rankings directory preserve old order and history / ${width}px`, async ({page}) => {
      const errors=await setupEvaluationPage(page,width);await page.goto(`/?view=garden&scope=${branch}`);await reader(page);await page.reload();await reader(page);
      expect(new URLSearchParams(new URL(page.url()).searchParams.get('return')??'').get('scope')).toBe(branch);
      await page.goto('/?view=garden&scope=branch:llm:rankings');const parent=await folder(page,'branch:llm:rankings');
      const entries=await parent.locator('[data-folder-entry]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-folder-entry')));
      const expected=siblings.map(leaf=>`branch:llm:rankings/${leaf}`);expect(entries.filter(entry=>expected.includes(entry!))).toEqual(expected);
      await parent.locator(`[data-folder-entry="${branch}"]`).click();await reader(page);await page.reload();await reader(page);
      await page.goBack();await folder(page,'branch:llm:rankings');await page.goForward();await reader(page);expect(errors).toEqual([]);
    });
    test(`${unit.name} canonical folder exposes its lesson without automatic opening / ${width}px`, async ({page}) => {
      const errors=await setupEvaluationPage(page,width);await page.goto(`/?view=garden&scope=${concept}`);await folder(page,concept,id);
      await page.reload();const target=await folder(page,concept,id);await target.getByRole('button',{name:metadata.title,exact:true}).click();await reader(page);
      await destinationReader(page,id,null);await page.reload();await reader(page);await destinationReader(page,id,null);await page.goBack();await folder(page,concept,id);await page.goForward();await reader(page);expect(errors).toEqual([]);
    });
    for (const link of unit.onward) test(`${unit.name} onward ${link.scope} preserves explicit destination and history / ${width}px`,async({page})=>{
      const errors=await setupEvaluationPage(page,width);await page.goto(`/?view=article&article=${id}`);const {body}=await reader(page);
      const expectedAnchor=unit.anchors.find(item=>item.href===`?view=garden&scope=${link.scope}`&&item.section===link.section)!;
      expect(expectedAnchor).toBeTruthy();const anchor=body.locator('a').nth(unit.anchors.indexOf(expectedAnchor));
      await expect(anchor).toHaveText(expectedAnchor.text);await expect(anchor).toHaveAttribute('href',expectedAnchor.href);await expect(anchor).toBeVisible();await anchor.click();
      const destination=async()=>link.folder?folder(page,link.scope,link.article):destinationReader(page,link.article!,link.scope);
      await destination();await page.reload();await destination();
      if(link.folder&&link.article){
        const target=await folder(page,link.scope,link.article);await target.getByRole('button',{name:registry.find((a:{id:string})=>a.id===link.article).title,exact:true}).click();
        await destinationReader(page,link.article,null);await page.reload();await destinationReader(page,link.article,null);await page.goBack();await destination();
        await page.goBack();await reader(page);await page.goForward();await destination();await page.goForward();await destinationReader(page,link.article,null);
      }else{await page.goBack();await reader(page);await page.goForward();await destination();}
      expect(errors).toEqual([]);
    });
    test(`${unit.name} existing statistics canonical backlink preserves populated folder and history / ${width}px`,async({page})=>{
      const errors=await setupEvaluationPage(page,width),source='statistical-inference-confidence-interval';
      const sourceMetadata=registry.find((a:{id:string})=>a.id===source),raw=readFileSync(sourceMetadata.file,'utf8');
      const code=[...raw.matchAll(/^```python\r?\n(# nextchina-example: [a-z0-9-]+\r?\n[\s\S]*?)^```\s*$/gm)];expect(code).toHaveLength(1);
      const sourceReader=async()=>{await destinationReader(page,source);expect(await page.locator(`[data-document="${source}"] pre code`).textContent()).toBe(code[0][1]);};
      await page.goto(`/?view=article&article=${source}`);await sourceReader();await page.locator(`[data-document="${source}"] a[href="?view=garden&scope=${concept}"]`).click();
      await folder(page,concept,id);await page.reload();const target=await folder(page,concept,id);await target.getByRole('button',{name:metadata.title,exact:true}).click();await reader(page);
      await destinationReader(page,id,null);await page.reload();await reader(page);await destinationReader(page,id,null);await page.goBack();await folder(page,concept,id);await page.goBack();await sourceReader();
      await page.goForward();await folder(page,concept,id);await page.goForward();await reader(page);expect(errors).toEqual([]);
    });
  }
}
