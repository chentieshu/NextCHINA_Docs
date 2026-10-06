// ISOLATED CANDIDATE: unintegrated and unexecuted; requires independent review and parent adoption.
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { graph } from '../../src/features/garden/data';

// Deliberately closed to the two reviewed Python lessons. No old helper changes.
type PairId = 'ranking-mrr-ndcg-judgments' | 'serving-timing-throughput-tails';
export type RankingEfficiencyLesson = {
  article: { id: PairId; file: string; title: string; space: string; category: string; categoryName: string;
    subtitle: string; date: string; tags: string[]; excerpt: string;
    knowledgeUnit: { kind: string; reviewStatus: string; exampleId: string; conceptIds: string[];
      placements: { hubId: string; path: string }[]; sourceUrls: string[]; relatedResourceIds: string[] } };
  name: string; parent: string; articleSha256: string; codeSha256: string; suffixSha256: string;
  text: string; headings: { depth: number; text: string }[]; tables: string[][][];
  displayMath: string[]; inlineMath: string[]; inlineCode: string[];
  sections: { heading: string; text: string; fields: string[] }[];
  anchors: { text: string; href: string; section: string | null }[];
  onward: { scope: string; articleId: string; anchorIndex: number }[];
};
const registry = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const compact = (text: string) => text.replace(/\s/g, '');
const cells = (table: string[][]) => table.map(row => row.map(compact));
const pair = {
  'ranking-mrr-ndcg-judgments': { concepts: ['concept:ranking-metrics'], parent: 'topic:task-metrics', path: 'rankings/ranking-metrics' },
  'serving-timing-throughput-tails': { concepts: ['concept:ttft', 'concept:tps', 'concept:throughput', 'concept:tail-latency'], parent: 'topic:efficiency-metrics', path: 'rankings/efficiency' },
};
const siblings = ['capabilities', 'datasets', 'protocol', 'metrics', 'ranking-metrics', 'calibration',
  'methodology', 'text-preference', 'composite', 'specialized', 'efficiency', 'system-results'];

export function rankingEfficiencySnapshot(element: HTMLElement) {
  const text = (node: Element) => {
    const clone = node.cloneNode(true) as Element;
    for (const controls of clone.querySelectorAll('.md-table-tools,.md-codebar')) controls.remove();
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

export function rankingEfficiencyGeometry(element: HTMLElement) {
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
    const atomic = (item.tagName === 'CODE' && /^[A-Za-z_][A-Za-z_0-9]*$/.test(plain)) || (!!cell && !item.querySelector('.katex')
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
  // Compound inline calls may wrap at punctuation/spaces, but each constituent
  // identifier must remain readable as one token (for example score_ranking).
  const inlineCodeIdentifiers: { token: string; fragments: number; topSpread: number; left: number; right: number }[] = [];
  for (const code of [...element.querySelectorAll<HTMLElement>('code')].filter(code => !code.closest('pre'))) {
    const cell = code.closest('th,td'), container = cell ? cell.getBoundingClientRect() : frame;
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT); let node: Node | null;
    while ((node = walker.nextNode())) for (const match of (node.textContent ?? '').matchAll(/[A-Za-z_][A-Za-z_0-9]*/g)) {
      const range = document.createRange(); range.setStart(node, match.index!); range.setEnd(node, match.index! + match[0].length);
      const boxes = [...range.getClientRects()];
      inlineCodeIdentifiers.push({ token: match[0], fragments: boxes.length,
        topSpread: boxes.length ? round(Math.max(...boxes.map(rect => rect.top)) - Math.min(...boxes.map(rect => rect.top))) : 0,
        ...(boxes.length ? escape(Math.min(...boxes.map(rect => rect.left)), Math.max(...boxes.map(rect => rect.right)), container) : { left: 0, right: 0 }) });
    }
  }
  const atomicTokens: { token: string; context: string; fragments: number; topSpread: number; left: number; right: number }[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT); let tokenNode: Node | null;
  const atomicPattern = /(?<![A-Za-z0-9_-])(?:Q[1-3]|T[1-7]|TTFT|NDCG|MRR|IDCG|DCG|RR|TPS|p95|p99|[ABCDESTULXY]|\d{4}-\d{2}-\d{2}|\d+(?:\.\d+)?(?:\/\d+)?%?)(?![A-Za-z0-9_-])/g;
  while ((tokenNode = walker.nextNode())) {
    if (tokenNode.parentElement?.closest('.katex,pre,.md-table-tools,.md-codebar')) continue;
    for (const match of (tokenNode.textContent ?? '').matchAll(atomicPattern)) {
      const range = document.createRange(); range.setStart(tokenNode, match.index!); range.setEnd(tokenNode, match.index! + match[0].length);
      const boxes = [...range.getClientRects()], cell = tokenNode.parentElement?.closest('td,th');
      atomicTokens.push({ token: match[0], context: cell ? 'table-cell' : 'prose', fragments: boxes.length,
        topSpread: boxes.length ? round(Math.max(...boxes.map(rect => rect.top)) - Math.min(...boxes.map(rect => rect.top))) : 0,
        ...(boxes.length ? escape(Math.min(...boxes.map(rect => rect.left)), Math.max(...boxes.map(rect => rect.right)), cell ? cell.getBoundingClientRect() : frame) : { left: 0, right: 0 }) });
    }
  }
  return { bodyOverflow: element.scrollWidth - element.clientWidth, math, textBounds, inlineCodeFrames, inlineCodeIdentifiers, atomicTokens,
    frames: [...element.querySelectorAll<HTMLElement>('p,li,h2,h3,.md-codeblock,.katex-display,.md-table-region')].filter(item => !item.closest('th,td'))
      .map(item => ({ tag: item.tagName, ...escape(item.getBoundingClientRect().left, item.getBoundingClientRect().right, frame) })),
    tables: [...element.querySelectorAll<HTMLElement>('.md-table-region')].map(region => {
      const scroll = region.querySelector<HTMLElement>('.md-table-scroll')!, table = region.querySelector('table')!;
      return { columns: Number(region.dataset.columns), viewport: scroll.clientWidth, width: table.getBoundingClientRect().width,
        overflow: scroll.scrollWidth - scroll.clientWidth, scrollLeft: scroll.scrollLeft, overflowMode: getComputedStyle(scroll).overflowX,
        frame: escape(scroll.getBoundingClientRect().left, scroll.getBoundingClientRect().right, frame) };
    }) };
}

export function assertRankingEfficiencyGeometry(geometry: ReturnType<typeof rankingEfficiencyGeometry>) {
  expect(geometry.bodyOverflow).toBeLessThanOrEqual(1);
  for (const frame of geometry.frames) { expect(frame.left).toBeLessThanOrEqual(1); expect(frame.right).toBeLessThanOrEqual(1); }
  // Both accepted numeric lessons have real formulae; no empty-math exemption.
  expect(geometry.math.length).toBeGreaterThan(0);
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
  for (const token of geometry.inlineCodeIdentifiers) {
    expect(token.fragments, token.token).toBeGreaterThan(0); expect(token.topSpread, token.token).toBeLessThanOrEqual(1);
    expect(token.left, token.token).toBeLessThanOrEqual(1); expect(token.right, token.token).toBeLessThanOrEqual(1);
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

// Source-line Range bounds cover horizontal text reachability without assuming
// that scrollWidth alone proves the final characters are painted in the viewport.
export function rankingEfficiencyCodeGeometry(pre: HTMLElement) {
  const code = pre.querySelector('code')!, content = code.textContent ?? '';
  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
  const leaves: { node: Node; start: number; end: number }[] = [];
  let node: Node | null, cursor = 0;
  while ((node = walker.nextNode())) {
    const end = cursor + (node.textContent?.length ?? 0);
    leaves.push({ node, start: cursor, end }); cursor = end;
  }
  const rects = (start: number, end: number) => {
    const a = leaves.find(leaf => leaf.start <= start && start < leaf.end);
    const b = leaves.find(leaf => leaf.start < end && end <= leaf.end);
    if (!a || !b || end <= start) return [];
    const range = document.createRange(); range.setStart(a.node, start - a.start); range.setEnd(b.node, end - b.start);
    return [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width }));
  };
  cursor = 0;
  const lines = content.split('\n').map((text, index) => {
    const start = cursor, end = start + text.length; cursor = end + 1;
    const boxes = rects(start, end);
    return { index, text, boxes, first: rects(start, Math.min(start + 1, end)), last: rects(Math.max(start, end - 1), end),
      width: boxes.length ? Math.max(...boxes.map(box => box.right)) - Math.min(...boxes.map(box => box.left)) : 0,
      top: boxes.length ? Math.min(...boxes.map(box => box.top)) : null,
      bottom: boxes.length ? Math.max(...boxes.map(box => box.bottom)) : null };
  });
  const frame = pre.getBoundingClientRect();
  return { text: content, lines, widestLine: lines.reduce((at, line, index) => line.width > lines[at].width ? index : at, 0),
    left: frame.left, right: frame.left + pre.clientWidth, top: frame.top, bottom: frame.top + pre.clientHeight,
    clientWidth: pre.clientWidth, scrollWidth: pre.scrollWidth, scrollLeft: pre.scrollLeft,
    overflow: pre.scrollWidth - pre.clientWidth, overflowMode: getComputedStyle(pre).overflowX,
    whiteSpace: getComputedStyle(code).whiteSpace };
}

export function registerRankingEfficiencyTests(unit: RankingEfficiencyLesson) {
  const { article: metadata } = unit, id = metadata.id, knowledge = metadata.knowledgeUnit;
  const expected = pair[id];
  expect(expected, 'Only the exact reviewed pair may use this helper').toBeTruthy();
  const branch = `branch:llm:${expected.path}`, parentBranch = 'branch:llm:rankings';
  const markdown = readFileSync(metadata.file, 'utf8');
  const blocks = [...markdown.matchAll(/^```python\r?\n(# nextchina-example: ([a-z0-9-]+)\r?\n[\s\S]*?)^```\s*$/gm)];

  test(`${unit.name} preserves exact reviewed metadata, source, Python and fixture identities`, () => {
    expect(registry.filter((article: { id: string }) => article.id === id)).toEqual([metadata]);
    expect(metadata.file).toBe(`content/models/evaluation/${id}.md`);
    expect(metadata.space).toBe('models'); expect(metadata.category).toBe('evaluation-statistics');
    expect(Object.keys(knowledge).sort()).toEqual(['kind', 'reviewStatus', 'exampleId', 'conceptIds', 'placements', 'sourceUrls', 'relatedResourceIds'].sort());
    expect(knowledge.kind).toBe('independent-explanation'); expect(knowledge.reviewStatus).toBe('needs-independent-review');
    expect(knowledge.exampleId).toBe(id); expect(knowledge.conceptIds).toEqual(expected.concepts);
    expect(knowledge.placements).toEqual([{ hubId: 'hub:llm', path: expected.path }]);
    expect(knowledge.relatedResourceIds).toEqual([]); expect(unit.parent).toBe(expected.parent);
    expect(digest(markdown)).toBe(unit.articleSha256);
    expect(blocks).toHaveLength(1); expect(blocks[0][2]).toBe(id);
    expect(blocks[0][1].endsWith('\n')).toBe(true); expect(digest(blocks[0][1])).toBe(unit.codeSha256);
    expect(digest(readFileSync(`scripts/knowledge-fixtures/${id}.py`, 'utf8'))).toBe(unit.suffixSha256);
    expect([...markdown.matchAll(/^```python$/gm)]).toHaveLength(1);
    expect([...markdown.matchAll(/nextchina-example:/g)]).toHaveLength(1);
    for (const concept of expected.concepts) {
      const nodes = graph.nodes.filter(node => node.id === concept); expect(nodes).toHaveLength(1);
      expect(nodes[0]).toMatchObject({ kind: 'concept', parentId: expected.parent,
        articleBindings: [{ articleId: id, coverage: 'explanation' }], contentStatus: 'outline', evidenceStatus: 'not-reviewed' });
      expect(nodes[0].embeddedArticleId).toBeUndefined();
    }
    expect(graph.nodes.filter(node => node.kind === 'concept' && node.articleBindings.some(ref => ref.articleId === id))
      .map(node => node.id).sort()).toEqual([...expected.concepts].sort());
    const leaves = graph.nodes.filter(node => node.id === branch); expect(leaves).toHaveLength(1);
    expect(leaves[0]).toMatchObject({ parentId: parentBranch, embeddedArticleId: id, conceptRefs: expected.concepts,
      articleBindings: [{ articleId: id, coverage: 'explanation' }], resourceRefs: [{ articleId: id, role: 'independent-explanation' }] });
    const edges = graph.edges.filter(edge => edge.source === branch || edge.target === branch);
    expect(edges.map(edge => edge.type).sort()).toEqual(['browse_child', ...expected.concepts.map(() => 'references')].sort());
    expect(edges.filter(edge => edge.type === 'references').map(edge => edge.target).sort()).toEqual([...expected.concepts].sort());
    const spaces = JSON.parse(readFileSync('content/spaces.json', 'utf8')).spaces;
    expect(spaces.filter((space: { chapterIds: string[] }) => space.chapterIds.includes(id)).map((space: { id: string }) => space.id)).toEqual(['models']);
    expect(spaces.find((space: { id: string }) => space.id === 'models').chapterIds.filter((value: string) => value === id)).toHaveLength(1);
  });

  async function reader(page: Page) {
    const article = page.locator(`[data-document="${id}"]`), body = article.locator('.markdown-body');
    await expect(article.locator('h1')).toHaveText(metadata.title); await expect(body).toBeVisible();
    await expect(body.locator('h1')).toHaveCount(0);
    await expect(body.locator('blockquote').first().locator('strong').first()).toHaveText('本页解决的问题');
    await page.evaluate(() => document.fonts.ready);
    await expect.poll(() => body.locator('.md-table-region[data-measured="false"]').count()).toBe(0);
    await expect(article.locator('.ws-evidence')).toContainText('程序验证不等于专家复核');
    await expect(body.locator('.katex-error,.md-mermaid-error')).toHaveCount(0);
    await expect(body.locator('.md-codeblock')).toHaveCount(1); await expect(body.locator('pre code')).toHaveCount(1);
    expect(await body.locator('pre code').textContent()).toBe(blocks[0][1]);
    await expect(article.getByRole('button', { name: '复制代码', exact: true })).toHaveCount(1);
    await expect(article.getByRole('button', { name: '换行', exact: true })).toHaveCount(1);
    const snapshot = await body.evaluate(rankingEfficiencySnapshot);
    expect(compact(snapshot.text), 'Complete accepted premises, calculations, examples, answers, limits and code').toBe(compact(unit.text));
    expect(snapshot.headings).toEqual(unit.headings);
    expect(snapshot.tables.map(cells)).toEqual(unit.tables.map(cells));
    expect(snapshot.displayMath.map(compact)).toEqual(unit.displayMath.map(compact));
    expect(snapshot.inlineMath.map(compact)).toEqual(unit.inlineMath.map(compact));
    expect(snapshot.inlineCode).toEqual(unit.inlineCode);
    expect(snapshot.anchors).toEqual(unit.anchors);
    expect(snapshot.sections.map(section => ({ ...section, text: compact(section.text) })))
      .toEqual(unit.sections.map(section => ({ ...section, text: compact(section.text) })));
    expect(snapshot.invisible).toEqual([]);
    for (const url of knowledge.sourceUrls) {
      const links = body.locator(`a[href="${url}"]`); expect(await links.count()).toBeGreaterThan(0);
      for (const link of await links.all()) {
        await expect(link).toBeVisible(); expect((await link.textContent())?.trim()).toBeTruthy();
        await expect(link).toHaveAttribute('target', '_blank'); await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
    const geometry = await body.evaluate(rankingEfficiencyGeometry); assertRankingEfficiencyGeometry(geometry);
    expect(geometry.math).toHaveLength(unit.displayMath.length + unit.inlineMath.length);
    expect(geometry.inlineCodeFrames.map(code => code.text)).toEqual(unit.inlineCode);
    expect(geometry.inlineCodeIdentifiers.map(token => token.token))
      .toEqual(unit.inlineCode.flatMap(text => [...text.matchAll(/[A-Za-z_][A-Za-z_0-9]*/g)].map(match => match[0])));
    expect(geometry.atomicTokens.length).toBeGreaterThan(0);
    expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await expect(page.locator('[data-document]')).toHaveCount(1); await expect(page.getByRole('tab')).toHaveCount(0);
    return { article, body, snapshot, geometry };
  }

  async function setup(page: Page, width: number, theme = 'dark') {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && !/net::ERR_/.test(message.text())) errors.push(message.text()); });
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(value => localStorage.setItem('nextchina-theme', value), theme);
    return errors;
  }

  async function folder(page: Page, scope: string, articleId?: string) {
    const target = page.locator(`[data-folder="${scope}"]`); await expect(target).toBeVisible();
    await expect(target.locator('h1')).toHaveText(graph.nodes.find(node => node.id === scope)!.label);
    expect(new URL(page.url()).searchParams.get('scope')).toBe(scope); await expect(page.locator('[data-document]')).toHaveCount(0);
    if (articleId) {
      await expect(target.getByRole('button', { name: registry.find((article: { id: string }) => article.id === articleId).title, exact: true })).toBeVisible();
      await expect(target.locator('.ws-empty')).toHaveCount(0);
    }
    return target;
  }

  async function destination(page: Page, articleId: string, returnScope?: string | null) {
    const target = page.locator(`[data-document="${articleId}"]`);
    await expect(target.locator('h1')).toHaveText(registry.find((article: { id: string }) => article.id === articleId).title);
    await expect(target.locator('.markdown-body')).toBeVisible(); await expect(target.locator('.katex-error,.md-mermaid-error')).toHaveCount(0);
    await expect(page.locator('[data-document]')).toHaveCount(1); await expect(page.getByRole('tab')).toHaveCount(0);
    const params = new URL(page.url()).searchParams; expect(params.get('view')).toBe('article'); expect(params.get('article')).toBe(articleId);
    if (returnScope === null) expect(params.has('return')).toBe(false);
    else if (returnScope) expect(new URLSearchParams(params.get('return') ?? '').get('scope')).toBe(returnScope);
  }

  async function pixels(page: Page, info: TestInfo, suffix: string) {
    const { body, geometry } = await reader(page);
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
        assertRankingEfficiencyGeometry(await body.evaluate(rankingEfficiencyGeometry));
        const rightmost = await table.locator('tr').first().locator('th').last().boundingBox(), viewport = await scroll.boundingBox();
        expect(rightmost!.x + rightmost!.width).toBeLessThanOrEqual(viewport!.x + viewport!.width + 1);
        await page.screenshot({ path: info.outputPath(`table-${index}-right-${suffix}.png`) });
        await scroll.evaluate(element => { element.scrollLeft = 0; });
      }
    }
    // Every actual formula and inline-code occurrence gets pixels; geometry alone is not an ink proof.
    for (const [index, formula] of (await body.locator('.katex').all()).entries()) {
      await formula.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`math-${index}-${suffix}.png`) });
    }
    for (const [index, code] of (await body.locator('code:not(pre code)').all()).entries()) {
      await code.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`inline-code-${index}-${suffix}.png`) });
    }
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
    expect(positions[0]).toBe(0); expect(Math.abs(positions.at(-1)! - size.max)).toBeLessThanOrEqual(1);
    for (let index = 1; index < positions.length; index++) expect(positions[index] - positions[index - 1]).toBeLessThanOrEqual(size.height);
    await info.attach(`complete-reader-tile-coverage-${suffix}`, { body: JSON.stringify({ ...size, positions }), contentType: 'application/json' });
  }

  async function codeScrollEvidence(page: Page, info: TestInfo, suffix: string) {
    const body = page.locator(`[data-document="${id}"] .markdown-body`), pre = body.locator('pre');
    await expect(body.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'false');
    await pre.evaluate(element => { element.scrollLeft = 0; });
    let geometry = await pre.evaluate(rankingEfficiencyCodeGeometry);
    expect(geometry.text).toBe(blocks[0][1]); expect(geometry.whiteSpace).toBe('pre');
    expect(['auto', 'scroll']).toContain(geometry.overflowMode);
    const widest = geometry.widestLine;
    expect(geometry.lines[widest].boxes.length).toBeGreaterThan(0);
    // Code blocks are full-height in the current renderer. Move the workspace
    // viewport to the actual widest source line, not merely the block's heading.
    await page.locator('.ws-scroll').evaluate((element, top) => {
      const frame = element.getBoundingClientRect(); element.scrollTop += top - frame.top - element.clientHeight / 2;
    }, geometry.lines[widest].top!);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
    geometry = await pre.evaluate(rankingEfficiencyCodeGeometry);
    const viewport = await page.locator('.ws-scroll').boundingBox();
    const line = geometry.lines[widest];
    expect(line.top!).toBeGreaterThanOrEqual(viewport!.y - 1);
    expect(line.bottom!).toBeLessThanOrEqual(viewport!.y + viewport!.height + 1);
    expect(line.first).toHaveLength(1); expect(line.first[0].left).toBeGreaterThanOrEqual(geometry.left - 1);
    expect(line.first[0].right).toBeLessThanOrEqual(geometry.right + 1);
    await page.screenshot({ path: info.outputPath(`unwrapped-code-widest-${widest}-left-${suffix}.png`) });
    const left = geometry;
    if (geometry.overflow > 1) {
      await pre.evaluate(element => { element.scrollLeft = element.scrollWidth; });
      await expect.poll(() => pre.evaluate(element => element.scrollWidth - element.clientWidth - element.scrollLeft)).toBeLessThanOrEqual(1);
      geometry = await pre.evaluate(rankingEfficiencyCodeGeometry);
      expect(geometry.scrollLeft).toBeGreaterThan(0);
      const last = geometry.lines[widest].last;
      expect(last).toHaveLength(1); expect(last[0].left).toBeGreaterThanOrEqual(geometry.left - 1);
      expect(last[0].right).toBeLessThanOrEqual(geometry.right + 1);
      expect(geometry.text).toBe(blocks[0][1]);
      await page.screenshot({ path: info.outputPath(`unwrapped-code-widest-${widest}-right-${suffix}.png`) });
    } else {
      expect(line.last).toHaveLength(1); expect(line.last[0].right).toBeLessThanOrEqual(geometry.right + 1);
    }
    await info.attach(`unwrapped-code-reachability-${suffix}`, { body: JSON.stringify({ widest, left, right: geometry }), contentType: 'application/json' });
    await pre.evaluate(element => { element.scrollLeft = 0; });
    await expect.poll(() => pre.evaluate(element => element.scrollLeft)).toBe(0);
    expect(await pre.locator('code').textContent()).toBe(blocks[0][1]);
    return widest;
  }

  for (const width of [390, 1440]) {
    for (const theme of ['light', 'dark']) test(`${unit.name} complete actual ${theme} reader, values, pixels, code controls and search / ${width}px`, async ({ page, context }, info) => {
      const errors = await setup(page, width, theme); await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto(`/?view=article&article=${id}`);
      await expect(page.locator('.workspace')).toHaveAttribute('data-theme', theme);
      await expect(page.locator(`.markdown-${theme}`)).toBeVisible();
      await pixels(page, info, `${width}-${theme}`);
      const widestCodeLine = await codeScrollEvidence(page, info, `${width}-${theme}`);
      const { article, body } = await reader(page);
      await article.getByRole('button', { name: '复制代码', exact: true }).click();
      await expect(article.getByRole('button', { name: '复制代码', exact: true })).toContainText('已复制');
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(blocks[0][1]);
      const wrap = article.getByRole('button', { name: '换行', exact: true }); await wrap.click();
      await expect(wrap).toHaveAttribute('aria-pressed', 'true'); await expect(body.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'true');
      expect(await body.locator('pre').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      assertRankingEfficiencyGeometry(await body.evaluate(rankingEfficiencyGeometry));
      expect(await body.locator('pre code').textContent()).toBe(blocks[0][1]);
      const wrapped = await body.locator('pre').evaluate(rankingEfficiencyCodeGeometry);
      expect(wrapped.whiteSpace).toBe('pre-wrap'); expect(wrapped.overflow).toBeLessThanOrEqual(1);
      await page.locator('.ws-scroll').evaluate((element, top) => {
        const frame = element.getBoundingClientRect(); element.scrollTop += top - frame.top - element.clientHeight / 2;
      }, wrapped.lines[widestCodeLine].top!);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())));
      await page.screenshot({ path: info.outputPath(`wrapped-code-widest-${widestCodeLine}-${width}-${theme}.png`) });
      expect(await page.locator('.ws-scroll').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
      await wrap.click(); await expect(wrap).toHaveAttribute('aria-pressed', 'false');
      await expect(body.locator('.md-codeblock')).toHaveAttribute('data-wrap', 'false');
      await page.reload(); await reader(page);
      // Searching from a populated folder proves navigation; reselecting the
      // already-open article could pass even if search activation were broken.
      await page.goto(`/?view=garden&scope=${parentBranch}`); await folder(page, parentBranch);
      if (!(await page.locator('.ws-sidebar').isVisible())) await page.getByRole('button', { name: '打开文档侧栏', exact: true }).click();
      await page.getByRole('button', { name: '全库搜索', exact: true }).click();
      await page.getByRole('searchbox', { name: '搜索全部文档', exact: true }).fill(metadata.title);
      await page.locator('.ws-search-results button').filter({ hasText: metadata.title }).first().click();
      await reader(page); await destination(page, id, branch);
      expect(new URL(page.url()).searchParams.get('return')).toBe(`?view=garden&scope=${encodeURIComponent(branch)}&display=list`);
      await page.reload(); await reader(page); await destination(page, id, branch);
      await page.goBack(); await folder(page, parentBranch); await page.goForward(); await reader(page); await destination(page, id, branch);
      expect(errors).toEqual([]);
    });

    for (const concept of expected.concepts) {
      test(`${unit.name} ${concept} graph reading preserves selected-node refresh, history and return / ${width}px`, async ({ page }) => {
        const errors = await setup(page, width);
        await page.goto(`/?view=garden&scope=root:ai&node=${concept}&display=graph`);
        await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
        await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
        await expect(page.locator('.og-note-badges')).toContainText('有独立讲解资料'); await page.locator('.og-read-button').click();
        await reader(page); await page.reload(); await reader(page); await page.goBack();
        await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
        await page.goForward(); await reader(page);
        await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
        await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
        await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
        await expect(page.locator('[data-document]')).toHaveCount(0); expect(errors).toEqual([]);
      });
      test(`${unit.name} ${concept} folder requires explicit article opening and preserves history / ${width}px`, async ({ page }) => {
        const errors = await setup(page, width); await page.goto(`/?view=garden&scope=${concept}`);
        await folder(page, concept, id); await page.reload(); const target = await folder(page, concept, id);
        await target.getByRole('button', { name: metadata.title, exact: true }).click(); await reader(page); await destination(page, id, null);
        await page.reload(); await reader(page); await destination(page, id, null); await page.goBack(); await folder(page, concept, id);
        await page.goForward(); await reader(page); expect(errors).toEqual([]);
      });
    }

    test(`${unit.name} leaf and rankings directory preserve ordering, refresh and history / ${width}px`, async ({ page }) => {
      const errors = await setup(page, width); await page.goto(`/?view=garden&scope=${branch}`);
      await reader(page); await destination(page, id, branch); await page.reload(); await reader(page); await destination(page, id, branch);
      await page.goto(`/?view=garden&scope=${parentBranch}`); const parent = await folder(page, parentBranch);
      const entries = await parent.locator('[data-folder-entry]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-folder-entry')));
      expect(entries).toEqual([
        ...['arena-text', 'aa-intelligence', 'terminal-bench'].map(articleId => `file:${parentBranch}:${articleId}`),
        ...siblings.map(leaf => `${parentBranch}/${leaf}`),
      ]);
      await parent.locator(`[data-folder-entry="${branch}"]`).click(); await reader(page); await page.reload(); await reader(page);
      await page.goBack(); await folder(page, parentBranch); await page.goForward(); await reader(page); expect(errors).toEqual([]);
    });

    for (const onward of unit.onward) test(`${unit.name} onward ${onward.scope} preserves canonical folder, exact lesson and history / ${width}px`, async ({ page }) => {
      const errors = await setup(page, width); await page.goto(`/?view=article&article=${id}`); const { body } = await reader(page);
      const anchor = unit.anchors[onward.anchorIndex]; expect(anchor.href).toBe(`?view=garden&scope=${onward.scope}`);
      await expect(body.locator('a').nth(onward.anchorIndex)).toHaveText(anchor.text);
      await body.locator('a').nth(onward.anchorIndex).click(); await folder(page, onward.scope, onward.articleId);
      await page.reload(); const target = await folder(page, onward.scope, onward.articleId);
      const title = registry.find((article: { id: string }) => article.id === onward.articleId).title;
      await target.getByRole('button', { name: title, exact: true }).click(); await destination(page, onward.articleId, null);
      await page.reload(); await destination(page, onward.articleId, null); await page.goBack(); await folder(page, onward.scope, onward.articleId);
      await page.goBack(); await reader(page); await page.goForward(); await folder(page, onward.scope, onward.articleId);
      await page.goForward(); await destination(page, onward.articleId, null); expect(errors).toEqual([]);
    });
  }
}
