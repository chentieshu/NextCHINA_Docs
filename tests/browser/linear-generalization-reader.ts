// Batch19 accepted manuscript readers; reviewed batch18 geometry measurements and scalar-success adapter are reused unchanged.
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { graph } from '../../src/features/garden/data';

// Deliberately closed to the two reviewed Python lessons. No old helper changes.
type PairId = 'linear-logistic-regression' | 'overfitting-underfitting-capacity';
export type LinearGeneralizationLesson = {
  article: { id: PairId; file: string; title: string; space: string; category: string; categoryName: string;
    subtitle: string; date: string; tags: string[]; excerpt: string;
    knowledgeUnit: { kind: string; reviewStatus: string; exampleId: string; conceptIds: string[];
      placements: { hubId: string; path: string }[]; sourceUrls: string[]; relatedResourceIds: string[] } };
  name: string; parent: string; articleSha256: string; codeSha256: string; suffixSha256: string;
  proseBlocks: { kind: string; parts: string[]; fields: string[]; start: number | null }[]; headings: { depth: number; text: string }[]; tables: string[][][];
  displayMath: string[]; inlineMath: string[]; inlineCode: string[];
  sections: { heading: string; fields: string[] }[];
  anchors: { text: string; href: string; section: string | null }[];
  onward: { scope: string; articleId: string; anchorIndex: number; mode: 'canonical-folder' | 'embedded-branch' }[];
};
const registry = JSON.parse(readFileSync('content/articles.json', 'utf8')).articles;
const overviewTitle = JSON.parse(readFileSync('content/data/research-meta.json', 'utf8')).title;
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const compact = (text: string) => text.replace(/\s/g, '');
const cells = (table: string[][]) => table.map(row => row.map(compact));
const pair = {
  'linear-logistic-regression': { concepts: ['concept:linear-models'], parent: 'topic:classical-ml', hub: 'hub:ai-overview', path: 'orientation/linear-models', category: 'classical-supervised-learning', file: 'content/models/classical/linear-logistic-regression.md' },
  'overfitting-underfitting-capacity': { concepts: ['concept:overfitting'], parent: 'topic:generalization', hub: 'hub:llm', path: 'training/budget/overfitting', category: 'foundations', file: 'content/models/foundations/overfitting-underfitting-capacity.md' },
};
const folderEntriesById = {
  'linear-logistic-regression': ['file:branch:ai-overview:orientation:overview', ...['ai-ml-dl', 'naive-bayes', 'linear-models', 'learning-signals', 'fairness-evaluation', 'robustness'].map(id => `branch:ai-overview:orientation/${id}`)],
  'overfitting-underfitting-capacity': ['branch:llm:training/budget/overfitting', 'branch:llm:training/budget/regularization'],
};

// Exact parsed graph-route contract for this reviewed pair; duplicate keys remain visible.
export function assertLinearGeneralizationGraphUrl(url: string, id: PairId, concept: string, view: 'garden' | 'article') {
  expect(Object.keys(pair), 'Only the reviewed graph/article pair may use this URL contract').toContain(id);
  expect(pair[id].concepts, 'Graph selection must be the article’s canonical concept').toEqual([concept]);
  const entries = (params: URLSearchParams) => [...params].sort(([a], [b]) => a.localeCompare(b));
  const graphParams = entries(new URLSearchParams({ view: 'garden', scope: 'root:ai', node: concept, display: 'graph' }));
  const parsed = new URL(url); expect(parsed.pathname).toBe('/'); expect(parsed.hash).toBe('');
  const params = parsed.searchParams;
  if (view === 'garden') {
    expect(entries(params), 'Complete selected graph query').toEqual(graphParams);
    return;
  }
  expect(view, 'Only garden or article graph lifecycle states').toBe('article');
  const returnTo = params.get('return');
  expect(returnTo?.startsWith('?') ?? false, 'Graph reader requires a query-only garden return').toBe(true);
  expect(entries(params), 'Complete graph reader query').toEqual(entries(new URLSearchParams({
    view: 'article', article: id, return: returnTo!,
  })));
  expect(entries(new URLSearchParams(returnTo!)), 'Complete nested graph return query').toEqual(graphParams);
}

export function linearGeneralizationSnapshot(element: HTMLElement) {
  const text = (node: Element) => {
    const clone = node.cloneNode(true) as Element;
    for (const controls of clone.querySelectorAll('.md-table-tools,.md-codebar')) controls.remove();
    for (const math of clone.querySelectorAll('.katex')) math.replaceWith(document.createTextNode(math.querySelector('annotation')!.textContent ?? ''));
    return clone.textContent ?? '';
  };
  const headings = [...element.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6')];
  return {
    proseBlocks: [...element.querySelector('.markdown-prose')!.children]
      .filter(node => ['P', 'BLOCKQUOTE', 'UL', 'OL'].includes(node.tagName) && !node.matches('.katex-display'))
      .map(node => ({ kind: node.tagName === 'P' ? 'paragraph' : node.tagName === 'BLOCKQUOTE' ? 'blockquote' : node.tagName === 'UL' ? 'unordered-list' : 'ordered-list',
        parts: node.tagName === 'P' ? [text(node)] : [...node.children].map(text), fields: [...node.querySelectorAll('strong')].map(text),
        start: node.tagName === 'OL' ? Number(node.getAttribute('start') ?? 1) : null })),
    headings: headings.map(h => ({ depth: Number(h.tagName.slice(1)), text: text(h) })),
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
      return { heading: text(heading), fields: nodes.flatMap(node => [...node.querySelectorAll('strong')].map(text)) };
    }),
    invisible: [...element.querySelectorAll<HTMLElement>('h1,h2,h3,h4,h5,h6,p,li,th,td,strong,a,code')].filter(node => {
      const rect = node.getBoundingClientRect(), css = getComputedStyle(node);
      return !rect.width || !rect.height || css.visibility === 'hidden' || css.display === 'none' || Number(css.opacity) === 0;
    }).map(node => ({ tag: node.tagName, text: node.textContent?.slice(0, 80) })),
  };
}

// Literal expectations are frozen from the accepted manuscript before browser work.
// Every prose block is stored once; tables, math, anchors and code have their own
// exact assertions. This includes every contextual question, answer and limit.
export function assertLinearGeneralizationSnapshot(snapshot: ReturnType<typeof linearGeneralizationSnapshot>, unit: LinearGeneralizationLesson) {
  const prose = (items: LinearGeneralizationLesson['proseBlocks']) => items.map(item => ({ ...item, parts: item.parts.map(compact) }));
  expect(prose(snapshot.proseBlocks), 'Every complete accepted premise, calculation, context, repair, exercise and answer').toEqual(prose(unit.proseBlocks));
  expect(snapshot.headings).toEqual(unit.headings);
  expect(snapshot.tables.map(cells)).toEqual(unit.tables.map(cells));
  expect(snapshot.displayMath.map(compact)).toEqual(unit.displayMath.map(compact));
  expect(snapshot.inlineMath.map(compact)).toEqual(unit.inlineMath.map(compact));
  expect(snapshot.inlineCode).toEqual(unit.inlineCode);
  expect(snapshot.anchors).toEqual(unit.anchors);
  expect(snapshot.sections).toEqual(unit.sections);
  expect(snapshot.invisible).toEqual([]);
}

export function linearGeneralizationGeometry(element: HTMLElement) {
  const frame = element.getBoundingClientRect(), round = (value: number) => Math.round(value * 100) / 100;
  const escape = (left: number, right: number, container: DOMRect) => ({
    left: round(Math.max(0, container.left - left)), right: round(Math.max(0, right - container.right)) });
  // Bounds are layout evidence, not painted-ink proof; keep the independent pixel gate.
  type Bounds = { left: number; right: number; top: number; bottom: number };
  const edges = (rect: Bounds): Bounds => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
  const visible = (node: Element) => {
    const css = getComputedStyle(node);
    if (css.visibility === 'hidden' || css.visibility === 'collapse') return false;
    for (let ancestor: Element | null = node; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      if (style.display === 'none' || Number(style.opacity) === 0) return false;
      if (ancestor === element) break;
    }
    return true; // aria-hidden on .katex-html is for accessibility, not visual hiding.
  };
  const viewport = (node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    return { left: rect.left + node.clientLeft, right: rect.left + node.clientLeft + node.clientWidth,
      top: rect.top + node.clientTop, bottom: rect.top + node.clientTop + node.clientHeight };
  };
  const clipping = (bounds: Bounds, owner: Element | null) => {
    let reachable = edges(bounds);
    const limits: { target: string; axis: string; mode: string; before: number; after: number }[] = [];
    // Only the leaf-to-reader chain matters; never compare offscreen article content to the browser viewport.
    for (let node = owner; node; node = node.parentElement) {
      const css = getComputedStyle(node);
      // CSS overflow does not clip non-replaced inline boxes or display:contents.
      if (css.display !== 'inline' && css.display !== 'contents' && node instanceof HTMLElement) {
        const view = viewport(node);
        for (const axis of ['x', 'y'] as const) {
          const mode = axis === 'x' ? css.overflowX : css.overflowY;
          if (!['hidden', 'clip', 'auto', 'scroll'].includes(mode)) continue;
          const start = axis === 'x' ? 'left' : 'top', end = axis === 'x' ? 'right' : 'bottom';
          const scrollable = mode === 'auto' || mode === 'scroll';
          let low = view[start], high = view[end];
          if (scrollable) {
            if (axis === 'x' && css.direction === 'rtl') {
              high -= node.scrollLeft; low = high - node.scrollWidth;
            } else {
              low -= axis === 'x' ? node.scrollLeft : node.scrollTop;
              high = low + (axis === 'x' ? node.scrollWidth : node.scrollHeight);
            }
          }
          limits.push({ target: node.className || node.tagName, axis, mode,
            before: round(Math.max(0, low - reachable[start])), after: round(Math.max(0, reachable[end] - high)) });
          // An outer clip sees the inner scroller's viewport, not its offscreen but reachable content.
          if (scrollable) reachable = { ...reachable,
            [start]: Math.max(view[start], Math.min(view[end], reachable[start])),
            [end]: Math.max(view[start], Math.min(view[end], reachable[end])) };
        }
      }
      if (node === element) break;
    }
    return limits;
  };
  const math = [...element.querySelectorAll<HTMLElement>('.katex')].map(katex => {
    const html = katex.querySelector<HTMLElement>('.katex-html')!;
    const boxes = [...html.querySelectorAll(':scope > .base')].map(base => base.getBoundingClientRect());
    const left = Math.min(...boxes.map(box => box.left)), right = Math.max(...boxes.map(box => box.right));
    const cell = katex.closest('td,th'), display = katex.closest<HTMLElement>('.katex-display');
    const rendered: { kind: string; bounds: Bounds; escape: { left: number; right: number };
      clips: ReturnType<typeof clipping> }[] = [];
    const add = (kind: string, rect: DOMRect, owner: Element | null) => {
      if (rect.width <= 0 || rect.height <= 0) return;
      rendered.push({ kind, bounds: edges(rect), escape: escape(rect.left, rect.right, cell ? cell.getBoundingClientRect() : frame),
        clips: clipping(rect, owner) });
    };
    const mathWalker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT); let mathNode: Node | null;
    while ((mathNode = mathWalker.nextNode())) {
      if (!mathNode.textContent?.trim() || !mathNode.parentElement || !visible(mathNode.parentElement)) continue;
      const range = document.createRange(); range.selectNodeContents(mathNode);
      for (const rect of range.getClientRects()) add('text', rect, mathNode.parentElement);
    }
    for (const node of html.querySelectorAll('*')) {
      if (!visible(node)) continue;
      // SVG viewport bounds cover the visible glyph, not intentionally oversized stretchy source paths.
      if (node.tagName.toLowerCase() === 'svg') add('svg', node.getBoundingClientRect(), node.parentElement);
      else if (!node.closest('svg')) {
        const css = getComputedStyle(node);
        if (['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(css.getPropertyValue(`border-${side.toLowerCase()}-width`)) > 0
          && !['none', 'hidden'].includes(css.getPropertyValue(`border-${side.toLowerCase()}-style`)))) {
          for (const rect of node.getClientRects()) add('rule', rect, node.parentElement);
        }
      }
    }
    return { tex: katex.querySelector('annotation')!.textContent, context: cell ? 'table-cell' : display ? 'display' : 'prose',
      boxes: boxes.length, width: round(right - left), escape: escape(left, right, cell ? cell.getBoundingClientRect() : frame),
      topSpread: round(Math.max(...boxes.map(box => box.top)) - Math.min(...boxes.map(box => box.top))),
      displayOverflow: display ? display.scrollWidth - display.clientWidth : 0,
      inlineOverflow: display ? 0 : katex.scrollWidth - katex.clientWidth,
      rendered, baseClips: boxes.flatMap(box => clipping(box, html)) };
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
  // identifier must remain readable as one token (for example score_group_audit).
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
  const atomicPattern = /(?<![A-Za-z0-9_-])(?:F-[AB]|C[1-4]|V[1-3]|P[34]|TPR|FPR|PPV|NPV|TN|FP|FN|TP|Fraction|None|ValueError|TypeError|notch-near|far|[ABDYZGHPS]|\d{4}-\d{2}-\d{2}|-?\d+(?:\.\d+)?(?:\/\d+)?%?)(?![A-Za-z0-9_-])/g;
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

// Per-glyph geometry can make tens of thousands of successful scalar checks.
// Fast-path only exact successful predicates; failures keep the original Playwright
// matcher, label and diagnostic. Measurements, tolerances and async checks are unchanged.
function geometryExpectation(value: unknown, label?: string) {
  return {
    toBeLessThanOrEqual(expected: number) {
      if (!(typeof value === 'number' && typeof expected === 'number' && value <= expected)) expect(value, label).toBeLessThanOrEqual(expected);
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (!(typeof value === 'number' && typeof expected === 'number' && value >= expected)) expect(value, label).toBeGreaterThanOrEqual(expected);
    },
    toBeGreaterThan(expected: number) {
      if (!(typeof value === 'number' && typeof expected === 'number' && value > expected)) expect(value, label).toBeGreaterThan(expected);
    },
    toBe(expected: unknown) {
      if (!Object.is(value, expected)) expect(value, label).toBe(expected);
    },
    toContain(expected: string) {
      if (!(Array.isArray(value) && value.indexOf(expected) !== -1)) expect(value, label).toContain(expected);
    },
  };
}

export function assertLinearGeneralizationGeometry(geometry: ReturnType<typeof linearGeneralizationGeometry>) {
  const expect = geometryExpectation;
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
    expect(item.rendered.length, `Visible math text/rule/SVG bounds: ${item.tex}`).toBeGreaterThan(0);
    for (const part of item.rendered) {
      expect(part.escape.left, `Math ${part.kind} reader/cell left: ${item.tex}`).toBeLessThanOrEqual(1);
      expect(part.escape.right, `Math ${part.kind} reader/cell right: ${item.tex}`).toBeLessThanOrEqual(1);
    }
    for (const limit of [...item.baseClips, ...item.rendered.flatMap(part => part.clips)]) {
      const label = `Math ${limit.target} ${limit.axis}/${limit.mode}: ${item.tex}`;
      expect(limit.before, `${label} start`).toBeLessThanOrEqual(1);
      expect(limit.after, `${label} end`).toBeLessThanOrEqual(1);
    }
    expect(item.inlineOverflow, `Inline math horizontal overflow: ${item.tex}`).toBeLessThanOrEqual(1);
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
export function linearGeneralizationCodeGeometry(pre: HTMLElement) {
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

export function registerLinearGeneralizationTests(unit: LinearGeneralizationLesson) {
  const { article: metadata } = unit, id = metadata.id, knowledge = metadata.knowledgeUnit;
  const expected = pair[id];
  expect(expected, 'Only the exact reviewed pair may use this helper').toBeTruthy();
  const branch = `branch:${expected.hub.slice(4)}:${expected.path}`, parentBranch = branch.slice(0, branch.lastIndexOf('/'));
  const folderEntries = folderEntriesById[id];
  const markdown = readFileSync(metadata.file, 'utf8');
  const blocks = [...markdown.matchAll(/^```python\r?\n(# nextchina-example: ([a-z0-9-]+)\r?\n[\s\S]*?)^```\s*$/gm)];

  test(`${unit.name} preserves exact reviewed metadata, source, Python and fixture identities`, () => {
    expect(registry.filter((article: { id: string }) => article.id === id)).toEqual([metadata]);
    expect(metadata.file).toBe(expected.file);
    expect(metadata.space).toBe('models'); expect(metadata.category).toBe(expected.category);
    expect(Object.keys(knowledge).sort()).toEqual(['kind', 'reviewStatus', 'exampleId', 'conceptIds', 'placements', 'sourceUrls', 'relatedResourceIds'].sort());
    expect(knowledge.kind).toBe('independent-explanation'); expect(knowledge.reviewStatus).toBe('needs-independent-review');
    expect(knowledge.exampleId).toBe(id); expect(knowledge.conceptIds).toEqual(expected.concepts);
    expect(knowledge.placements).toEqual([{ hubId: expected.hub, path: expected.path }]);
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
    const snapshot = await body.evaluate(linearGeneralizationSnapshot);
    assertLinearGeneralizationSnapshot(snapshot, unit);
    for (const url of knowledge.sourceUrls) {
      const links = body.locator(`a[href="${url}"]`); expect(await links.count()).toBeGreaterThan(0);
      for (const link of await links.all()) {
        await expect(link).toBeVisible(); expect((await link.textContent())?.trim()).toBeTruthy();
        await expect(link).toHaveAttribute('target', '_blank'); await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      }
    }
    const geometry = await body.evaluate(linearGeneralizationGeometry); assertLinearGeneralizationGeometry(geometry);
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

  const gardenQuery = (scope: string) => `?view=garden&scope=${encodeURIComponent(scope)}`;
  const listReturn = (scope: string) => `${gardenQuery(scope)}&display=list`;
  const articleQuery = (articleId: string, scope?: string | null) => `?view=article&article=${articleId}${scope ? `&return=${encodeURIComponent(listReturn(scope))}` : ''}`;
  async function exactQuery(page: Page, query: string) {
    await expect(() => { const url = new URL(page.url()); expect(url.pathname).toBe('/'); expect(url.hash).toBe(''); expect(url.search).toBe(query); }).toPass({ timeout: 20_000 });
  }

  async function folder(page: Page, scope: string, articleId?: string) {
    const target = page.locator(`[data-folder="${scope}"]`); await expect(target).toBeVisible();
    await expect(target.locator('h1')).toHaveText(graph.nodes.find(node => node.id === scope)!.label);
    await exactQuery(page, gardenQuery(scope)); await expect(page.locator('[data-document]')).toHaveCount(0);
    if (articleId) {
      await expect(target.getByRole('button', { name: registry.find((article: { id: string }) => article.id === articleId).title, exact: true })).toBeVisible();
      await expect(target.locator('.ws-empty')).toHaveCount(0);
    }
    return target;
  }

  async function destination(page: Page, articleId: string, returnScope?: string | null) {
    const target = page.locator(`[data-document="${articleId}"]`);
    await expect(target.locator('h1')).toHaveText((articleId === 'overview' ? overviewTitle : registry.find((article: { id: string }) => article.id === articleId).title));
    await expect(target.locator('.markdown-body')).toBeVisible(); await expect(target.locator('.katex-error,.md-mermaid-error')).toHaveCount(0);
    await expect(page.locator('[data-document]')).toHaveCount(1); await expect(page.getByRole('tab')).toHaveCount(0);
    const params = new URL(page.url()).searchParams; expect(params.get('view')).toBe('article'); expect(params.get('article')).toBe(articleId);
    if (returnScope === null) expect(params.has('return')).toBe(false);
    else if (returnScope) expect(new URLSearchParams(params.get('return') ?? '').get('scope')).toBe(returnScope);
    if (returnScope !== undefined) await exactQuery(page, articleQuery(articleId, returnScope));
  }

  async function pixels(page: Page, info: TestInfo, suffix: string) {
    const { body, geometry } = await reader(page);
    await info.attach(`geometry-${suffix}`, { body: JSON.stringify(geometry), contentType: 'application/json' });
    await page.screenshot({ path: info.outputPath(`reader-top-${suffix}.png`) });
    for (const [index, table] of (await body.locator('.md-table-region').all()).entries()) {
      await table.scrollIntoViewIfNeeded(); const scroll = table.locator('.md-table-scroll');
      await scroll.evaluate(element => { element.scrollLeft = 0; });
      const firstCell = await table.locator('tr').first().locator('th').first().boundingBox(), leftViewport = await scroll.boundingBox();
      expect(firstCell!.x).toBeGreaterThanOrEqual(leftViewport!.x - 1);
      expect(firstCell!.x + firstCell!.width).toBeLessThanOrEqual(leftViewport!.x + leftViewport!.width + 1);
      await page.screenshot({ path: info.outputPath(`table-${index}-left-${suffix}.png`) });
      if (await scroll.evaluate(element => element.scrollWidth - element.clientWidth > 1)) {
        await expect(table.getByRole('button', { name: '表格向右滚动', exact: true })).toBeEnabled();
        await table.getByRole('button', { name: '表格向右滚动', exact: true }).click();
        await expect.poll(() => scroll.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
        await scroll.evaluate(element => { element.scrollLeft = element.scrollWidth; });
        await expect.poll(() => scroll.evaluate(element => element.scrollWidth - element.clientWidth - element.scrollLeft)).toBeLessThanOrEqual(1);
        assertLinearGeneralizationGeometry(await body.evaluate(linearGeneralizationGeometry));
        const rightmost = await table.locator('tr').first().locator('th').last().boundingBox(), viewport = await scroll.boundingBox();
        expect(rightmost!.x + rightmost!.width).toBeLessThanOrEqual(viewport!.x + viewport!.width + 1);
        await page.screenshot({ path: info.outputPath(`table-${index}-right-${suffix}.png`) });
        await scroll.evaluate(element => { element.scrollLeft = 0; });
      }
    }
    // All display formulae, representative dense inline formulae and every inline-code occurrence get explicit pixels; complete tiling covers all prose.
    for (const [index, formula] of (await body.locator('.katex-display .katex, p > .katex, li > .katex').all()).filter((node, index) => index < 8).entries()) {
      await formula.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`math-${index}-${suffix}.png`) });
    }
    for (const [index, formula] of (await body.locator('.katex-display').all()).entries()) {
      await formula.scrollIntoViewIfNeeded(); await page.screenshot({ path: info.outputPath(`display-math-${index}-${suffix}.png`) });
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
    let geometry = await pre.evaluate(linearGeneralizationCodeGeometry);
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
    geometry = await pre.evaluate(linearGeneralizationCodeGeometry);
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
      geometry = await pre.evaluate(linearGeneralizationCodeGeometry);
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
      assertLinearGeneralizationGeometry(await body.evaluate(linearGeneralizationGeometry));
      expect(await body.locator('pre code').textContent()).toBe(blocks[0][1]);
      const wrapped = await body.locator('pre').evaluate(linearGeneralizationCodeGeometry);
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
      await page.goto('/?view=article&article=overview'); await destination(page, 'overview', null);
      await expect(page.locator(`[data-document="${id}"]`)).toHaveCount(0);
      if (!(await page.locator('.ws-sidebar').isVisible())) await page.getByRole('button', { name: '打开文档侧栏', exact: true }).click();
      await page.getByRole('button', { name: '全库搜索', exact: true }).click();
      await page.getByRole('searchbox', { name: '搜索全部文档', exact: true }).fill(metadata.title);
      const result = page.locator('.ws-search-results button').filter({ hasText: metadata.title });
      await expect(result).toHaveCount(1); await result.click();
      await reader(page); await destination(page, id, branch);
      await expect(page.locator(`[data-entry-id="file:${branch}:${id}"]`)).toHaveAttribute('aria-selected', 'true');
      expect(new URL(page.url()).searchParams.get('return')).toBe(`?view=garden&scope=${encodeURIComponent(branch)}&display=list`);
      await page.reload(); await reader(page); await destination(page, id, branch);
      await page.goBack(); await destination(page, 'overview', null); await page.goForward(); await reader(page); await destination(page, id, branch);
      expect(errors).toEqual([]);
    });

    for (const theme of ['light', 'dark']) for (const concept of expected.concepts) {
      test(`${unit.name} ${concept} graph reading preserves selected-node refresh, history and return / ${width}px / ${theme}`, async ({ page }) => {
        const errors = await setup(page, width, theme);
        await page.goto(`/?view=garden&scope=root%3Aai&node=${encodeURIComponent(concept)}&display=graph`);
        await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'garden')).toPass({ timeout: 20_000 });
        await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
        await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
        await expect(page.locator('.og-note-badges')).toContainText('有独立讲解资料'); await page.locator('.og-read-button').click();
        await reader(page);
        await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'article')).toPass({ timeout: 20_000 });
        await page.reload(); await reader(page);
        await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'article')).toPass({ timeout: 20_000 });
        await page.goBack();
        await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
        await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'garden')).toPass({ timeout: 20_000 });
        await page.goForward(); await reader(page);
        await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'article')).toPass({ timeout: 20_000 });
        await page.getByRole('button', { name: '返回知识地图', exact: true }).click();
        await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
        await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
        await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'garden')).toPass({ timeout: 20_000 });
        await expect(page.locator('[data-document]')).toHaveCount(0); expect(errors).toEqual([]);
      });
      test(`${unit.name} ${concept} folder requires explicit article opening and preserves history / ${width}px / ${theme}`, async ({ page }) => {
        const errors = await setup(page, width, theme); await page.goto(`/${gardenQuery(concept)}`);
        await folder(page, concept, id); await page.reload(); const target = await folder(page, concept, id);
        await target.getByRole('button', { name: metadata.title, exact: true }).click(); await reader(page); await destination(page, id, null);
        await page.reload(); await reader(page); await destination(page, id, null); await page.goBack(); await folder(page, concept, id);
        await page.goForward(); await reader(page); expect(errors).toEqual([]);
      });
    }

    for (const theme of ['light', 'dark']) test(`${unit.name} leaf and parent directory preserve ordering, refresh and history / ${width}px / ${theme}`, async ({ page }) => {
      const errors = await setup(page, width, theme); await page.goto(`/${gardenQuery(branch)}`);
      await reader(page); await destination(page, id, branch); await page.reload(); await reader(page); await destination(page, id, branch);
      await page.goto(`/${gardenQuery(parentBranch)}`); const parent = await folder(page, parentBranch);
      const entries = await parent.locator('[data-folder-entry]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-folder-entry')));
      expect(entries).toEqual(folderEntries);
      await expect(parent.locator('[data-folder-entry]')).toHaveCount(folderEntries.length);
      const sharedLabels = id === 'overfitting-underfitting-capacity' ? ['过拟合与欠拟合', '检查点与恢复'] : [];
      await expect(parent.locator('.ws-folder-rows button')).toHaveCount(folderEntries.length + sharedLabels.length);
      const shared = parent.locator('section').filter({ has: page.getByRole('heading', { name: '共享知识', exact: true }) });
      await expect(shared.locator('button')).toHaveText(sharedLabels);
      await parent.locator(`[data-folder-entry="${branch}"]`).click(); await reader(page); await page.reload(); await reader(page);
      await page.goBack(); await folder(page, parentBranch); await page.goForward(); await reader(page); expect(errors).toEqual([]);
    });

    for (const theme of ['light', 'dark']) test(`${unit.name} neutral graph search and sidebar discovery preserve exact occurrence and history / ${width}px / ${theme}`, async ({ page }) => {
      const errors = await setup(page, width, theme), concept = expected.concepts[0];
      await page.goto('/?view=garden&scope=root%3Aai&display=graph');
      await exactQuery(page, '?view=garden&scope=root%3Aai&display=graph');
      await expect(page.locator('.og-network-host')).toHaveAttribute('data-layout', 'ready');
      await expect(page.locator('.kg-node[data-active="true"]')).toHaveCount(0);
      const search = page.getByRole('searchbox', { name: '搜索知识网络', exact: true });
      await expect(search).toHaveValue('');
      const label = graph.nodes.find(node => node.id === concept)!.label;
      await search.fill(label);
      const result = page.getByRole('option').filter({ has: page.locator('span').filter({ hasText: label }) }).filter({ hasText: '概念' });
      await expect(result).toHaveCount(1); await result.click();
      await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'garden')).toPass({ timeout: 20_000 });
      await expect(page.locator('.kg-node[data-active="true"]')).toHaveAttribute('data-node-id', concept);
      await page.locator('.og-read-button').click(); await reader(page);
      await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'article')).toPass({ timeout: 20_000 });
      await page.reload(); await reader(page); await page.goBack();
      await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'garden')).toPass({ timeout: 20_000 });
      await page.goBack(); await exactQuery(page, '?view=garden&scope=root%3Aai&display=graph');
      await page.goForward(); await expect(() => assertLinearGeneralizationGraphUrl(page.url(), id, concept, 'garden')).toPass({ timeout: 20_000 });
      await page.goForward(); await reader(page);
      await page.goto('/?view=article&article=overview'); await destination(page, 'overview', null);
      if (!(await page.locator('.ws-sidebar').isVisible())) await page.getByRole('button', { name: '打开文档侧栏', exact: true }).click();
      await page.getByRole('button', { name: '文档目录', exact: true }).click();
      const chain: string[] = []; let node = graph.nodes.find(node => node.id === branch)!;
      while (node) { chain.unshift(node.id); node = graph.nodes.find(candidate => candidate.id === node.parentId)!; }
      for (const folderId of chain) {
        const entry = page.locator(`[data-entry-id="${folderId}"]`);
        if (await entry.count() && await entry.getAttribute('aria-expanded') === 'false') await entry.click();
      }
      const occurrence = `file:${branch}:${id}`;
      await page.locator(`[data-entry-id="${occurrence}"]`).click(); await reader(page); await destination(page, id, branch);
      await expect(page.locator(`[data-entry-id="${occurrence}"]`)).toHaveAttribute('aria-selected', 'true');
      await page.reload(); await reader(page); await destination(page, id, branch);
      await page.goBack(); await destination(page, 'overview', null); await page.goForward(); await reader(page); await destination(page, id, branch);
      expect(errors).toEqual([]);
    });

    for (const theme of ['light', 'dark']) for (const origin of ['direct', 'graph']) test(`${unit.name} every onward occurrence and ${origin} origin preserve exact destination and history / ${width}px / ${theme}`, async ({ page }) => {
      const errors = await setup(page, width, theme);
      const sourceQuery = origin === 'direct' ? articleQuery(id) : `${articleQuery(id)}&return=${encodeURIComponent(`?view=garden&scope=root%3Aai&node=${encodeURIComponent(expected.concepts[0])}&display=graph`)}`;
      for (const onward of unit.onward) {
        await page.goto(`/${sourceQuery}`); const { body } = await reader(page); await exactQuery(page, sourceQuery);
        const anchor = unit.anchors[onward.anchorIndex]; expect(anchor.href).toBe(`?view=garden&scope=${onward.scope}`);
        await expect(body.locator('a').nth(onward.anchorIndex)).toHaveText(anchor.text);
        await body.locator('a').nth(onward.anchorIndex).click();
        if (onward.mode === 'canonical-folder') {
          await folder(page, onward.scope, onward.articleId); await page.reload(); const target = await folder(page, onward.scope, onward.articleId);
          const title = registry.find((article: { id: string }) => article.id === onward.articleId).title;
          await target.getByRole('button', { name: title, exact: true }).click(); await destination(page, onward.articleId, null);
          await page.reload(); await destination(page, onward.articleId, null); await page.goBack(); await folder(page, onward.scope, onward.articleId);
          await page.goBack(); await reader(page); await exactQuery(page, sourceQuery); await page.goForward(); await folder(page, onward.scope, onward.articleId);
          await page.goForward(); await destination(page, onward.articleId, null);
        } else {
          expect(onward.mode).toBe('embedded-branch'); await destination(page, onward.articleId, onward.scope);
          await page.reload(); await destination(page, onward.articleId, onward.scope); await page.goBack(); await reader(page); await exactQuery(page, sourceQuery);
          await page.goForward(); await destination(page, onward.articleId, onward.scope);
        }
        await expect(page.getByRole('button', { name: '返回知识地图', exact: true })).toHaveCount(0);
      }
      expect(errors).toEqual([]);
    });
  }
}
