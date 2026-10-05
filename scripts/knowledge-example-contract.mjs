import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

// Test-only dispatch, not graph metadata or a factual/scientific classification.
// The array is intentional: duplicate registrations must not silently overwrite.
export const exampleChecks = [
  ['floating-point-rounding', 'floating-point-rounding', 'python'],
  ['llm-tokenization', 'tokenization', 'python'],
  ['llm-softmax-temperature', 'softmax', 'python'],
  ['llm-attention-calculation', 'attention', 'python'],
  ['llm-training-loop', 'training', 'python'],
  ['llm-kv-cache', 'kv-cache', 'python'],
  ['llm-tensor-shapes', 'tensor-shapes', 'python'],
  ['llm-conditional-probability', 'conditional-probability', 'python'],
  ['llm-entropy-cross-entropy', 'entropy-cross-entropy', 'python'],
  ['llm-derivatives', 'derivatives', 'python'],
  ['statistical-inference-confidence-interval', 'statistical-inference-confidence-interval', 'python'],
  ['train-validation-test-data-leakage', 'train-validation-test-data-leakage', 'python'],
  ['classification-accuracy-precision-recall-f1', 'classification-accuracy-precision-recall-f1', 'python'],
  ['supervised-learning-naive-bayes', 'supervised-learning-naive-bayes', 'python'],
  ['ai-ml-dl-boundaries', 'ai-ml-dl-boundaries', 'observable-case'],
  ['unsupervised-self-supervised-learning', 'unsupervised-self-supervised-learning', 'observable-case'],
  ['algorithm-complexity-cost-model', 'algorithm-complexity-cost-model', 'python'],
  ['mutual-information', 'mutual-information', 'python'],
  ['regularization-penalty-generalization', 'regularization-penalty-generalization', 'python'],
  ['adamw-moments-decoupled-decay', 'adamw-moments-decoupled-decay', 'python']
];
const pilotId = 'ai-ml-dl-boundaries';
const sourceUrls = [
  'https://artint.info/3e/html/ArtInt3e.Ch1.S1.html',
  'https://www-formal.stanford.edu/jmc/whatisai/node1.html',
  'https://www-formal.stanford.edu/jmc/whatisai/node2.html',
  'https://artint.info/3e/html/ArtInt3e.Ch7.S1.html',
  'https://www.cs.toronto.edu/~hinton/absps/NatureDeepReview.pdf',
  'https://www.deeplearningbook.org/contents/intro.html'
];

export function validateExampleChecks(units, pythonIds, registrations = exampleChecks) {
  const byArticle = new Map(), byExample = new Map();
  const numeric = new Set(pythonIds);
  assert.equal(numeric.size, pythonIds.length, 'Duplicate Python check ID');
  for (const entry of registrations) {
    assert.ok(Array.isArray(entry) && entry.length === 3, 'Expected article/example/kind registration');
    const [articleId, exampleId, kind] = entry;
    assert.ok(kind === 'python' || kind === 'observable-case', `Unknown example kind: ${kind}`);
    assert.ok(!byArticle.has(articleId) && !byExample.has(exampleId), 'Duplicate/overlapping example registration');
    if (kind === 'python') assert.ok(numeric.has(exampleId), `Missing numeric checks: ${exampleId}`);
    else {
      assert.ok(!numeric.has(exampleId), `Cannot reassign numeric example: ${exampleId}`);
      const exactPairs = [[pilotId, pilotId], ['unsupervised-self-supervised-learning', 'unsupervised-self-supervised-learning']];
      assert.ok(exactPairs.some(([article, example]) => articleId === article && exampleId === example), 'Unknown observable-case article/example pair');
    }
    byArticle.set(articleId, entry); byExample.set(exampleId, entry);
  }
  for (const id of numeric) assert.equal(byExample.get(id)?.[2], 'python', `Unused/reassigned numeric check: ${id}`);
  const used = new Set();
  for (const article of units) {
    const entry = byArticle.get(article.id);
    assert.ok(entry, `Unregistered example article: ${article.id}`);
    assert.equal(entry[1], article.knowledgeUnit.exampleId, `Wrong article/example pair: ${article.id}`);
    assert.ok(!used.has(article.id), `Duplicate unit: ${article.id}`);
    used.add(article.id);
  }
  assert.equal(used.size, registrations.length, 'Unused example registration');
  return new Map(registrations.map(([articleId, , kind]) => [articleId, kind]));
}

export function section(text, heading) {
  const headings = [...text.matchAll(/^#{1,6} .+$/gm)];
  const hits = headings.filter(match => match[0] === heading);
  assert.equal(hits.length, 1, `Expected exactly one section: ${heading}`);
  const start = hits[0], level = heading.indexOf(' ');
  const end = headings.find(match => match.index > start.index && match[0].indexOf(' ') <= level)?.index ?? text.length;
  const body = text.slice(start.index + heading.length, end).trim();
  assert.ok(body, `Empty section: ${heading}`);
  return body;
}
export function visibleMarkdown(text) {
  return text.replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, '').replace(/\r\n/g, '\n');
}
// Use the existing CommonMark/GFM/math parser stack, not Markdown-looking text
// inside inert HTML, indented code, image alt text, or a math expression.
const linkParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
function proseLinks(text) {
  const links = [];
  const excluded = new Set(['code', 'inlineCode', 'html', 'image', 'imageReference', 'math', 'inlineMath']);
  const prose = node => excluded.has(node.type) || node.type === 'link' || node.type === 'linkReference' ? ''
    : node.type === 'text' ? node.value : (node.children ?? []).map(prose).join('');
  const label = node => node.type === 'text' ? node.value
    : excluded.has(node.type) ? '' : (node.children ?? []).map(label).join('');
  function visit(node, paragraph) {
    if (excluded.has(node.type)) return;
    const context = node.type === 'paragraph' ? node : paragraph;
    if (node.type === 'link') {
      const textLabel = label(node).trim();
      if (context && /\p{L}|\p{N}/u.test(textLabel)) links.push({ url: node.url, label: textLabel, claim: /\p{L}|\p{N}/u.test(prose(context)) });
      return;
    }
    for (const child of node.children ?? []) visit(child, context);
  }
  visit(linkParser.parse(text));
  return links;
}
export function inlineLinks(text) {
  // Keep the existing small tuple interface for the two exact case checkers.
  return proseLinks(text).map(link => [null, link.label, link.url]);
}
export function assertCaseMarkdown(text) {
  // Check full-page parsing before slices can discard a surrounding HTML, code,
  // or math context. These exact cases permit ordinary headings, bold fields,
  // GFM tables and real math, but no raw HTML or block code.
  const headingOffsets = [], fieldOffsets = [], tableRanges = [];
  function visit(node) {
    assert.ok(node.type !== 'html' && node.type !== 'code', 'Observable cases do not support HTML or code blocks');
    const start = node.position?.start.offset;
    if (node.type === 'heading' && /^#{1,6} /.test(text.slice(start))) headingOffsets.push(start);
    if (node.type === 'strong' && (start === 0 || text[start - 1] === '\n')) fieldOffsets.push(start);
    if (node.type === 'table') tableRanges.push([start, node.position.end.offset]);
    for (const child of node.children ?? []) visit(child);
  }
  visit(linkParser.parse(text));
  assert.deepEqual(headingOffsets, [...text.matchAll(/^#{1,6} .+$/gm)].map(match => match.index), 'Heading text must render as actual headings');
  assert.deepEqual(fieldOffsets, [...text.matchAll(/^\*\*[^*\n]+\*\*/gm)].map(match => match.index), 'Field labels must render as actual strong text');
  for (const row of text.matchAll(/^\|.*\|$/gm)) assert.ok(tableRanges.some(([start, end]) => row.index >= start && row.index + row[0].length <= end), 'Fixture row must render in a real table');
}
export function hasProse(text) {
  // ATX/setext headings, raw HTML, images, links and block code are not a filled
  // prose field. Inline code/math can legitimately hold a fixture cell value.
  const excluded = new Set(['heading', 'html', 'code', 'image', 'imageReference', 'link', 'linkReference']);
  function meaningful(node) {
    if (excluded.has(node.type)) return false;
    if (['text', 'inlineCode', 'math', 'inlineMath'].includes(node.type)) return /\p{L}|\p{N}/u.test(node.value);
    return (node.children ?? []).some(meaningful);
  }
  return meaningful(linkParser.parse(text));
}
export function numberedSteps(text, count) {
  const steps = [...text.matchAll(/^(\d+)\. (.+)$/gm)];
  assert.deepEqual(steps.map(step => Number(step[1])), Array.from({ length: count }, (_, i) => i + 1), 'Missing/duplicate numbered step or question');
  for (const step of steps) assert.ok(hasProse(step[2].replace(/^\*\*[^*]+\*\*/, '')), 'Empty step or question');
}
export function adjacentSource(text, url) {
  assert.ok(proseLinks(text).some(link => link.url === url && link.claim), `Missing claim-adjacent source link: ${url}`);
}

export function checkObservableCase(article, rawMarkdown) {
  assertCaseMarkdown(rawMarkdown);
  assert.equal(article.id, pilotId);
  const unit = article.knowledgeUnit;
  assert.equal(unit.exampleId, pilotId);
  assert.equal(unit.kind, 'independent-explanation');
  assert.equal(unit.reviewStatus, 'needs-independent-review');
  assert.deepEqual([...unit.conceptIds].sort(), ['concept:artificial-intelligence', 'concept:deep-learning', 'concept:machine-learning']);
  assert.deepEqual(unit.placements, [{ hubId: 'hub:ai-overview', path: 'orientation/ai-ml-dl' }]);
  assert.deepEqual([...unit.sourceUrls].sort(), [...sourceUrls].sort());
  assert.doesNotMatch(rawMarkdown, /nextchina-example|^ {0,3}(?:`{3,}|~{3,})/mi, 'Observable pilot must not contain runnable markers or fenced code');
  const markdown = visibleMarkdown(rawMarkdown);
  assert.match(markdown, /^> \*\*本页解决的问题\*\*：/);
  const definitions = section(markdown, '## 1. 三个词回答不同层次的问题');
  const ai = section(definitions, '### AI：一个研究与工程领域');
  const ml = section(definitions, '### ML：经验怎样影响后续行为');
  const dl = section(definitions, '### DL：连中间表示也通过多层组合来学习');
  for (const url of sourceUrls.slice(0, 3)) adjacentSource(ai, url);
  adjacentSource(ml, sourceUrls[3]);
  for (const url of sourceUrls.slice(4)) adjacentSource(dl, url);
  const evidence = section(markdown, '## 2. 实际检查时，先找这六项证据');
  const costs = section(markdown, '## 3. 分类不能替你做成本与效果决策');
  numberedSteps(evidence, 6);
  // Deletion guards for the reviewed scope/uncertainty notes; no answer-label oracle.
  for (const [text, prefix] of [[ai, '因此，后文可以把'], [dl, '也别把“深”'],
    [evidence, '一个合格的回答通常长这样：'], [costs, '这些是案例引出的工程检查问题']]) {
    assert.ok(text.split(/\n\s*\n/).some(paragraph => paragraph.startsWith(prefix) && hasProse(paragraph.slice(prefix.length))), `Missing scope/uncertainty note: ${prefix}`);
  }
  const family = section(markdown, '## 4. 观察案例：ai-ml-dl-boundaries');
  assert.equal([...markdown.matchAll(/^## .*观察案例[：:]/gm)].length, 1, 'Expected one observable case family');
  assert.ok(family.includes('**A–F 全部是明确虚构的教学档案，不是实测系统，也不是六次实验。**'), 'Missing hypothetical-status note');
  const dossiers = [...family.matchAll(/^### ([A-Z])：[^\n]+$/gm)];
  assert.deepEqual(dossiers.map(match => match[1]), ['A', 'B', 'C', 'D', 'E', 'F'], 'Expected unique A–F dossiers');
  assert.equal([...markdown.matchAll(/^### [A-Z]：/gm)].length, 6, 'Unexpected dossier outside the case family');
  assert.equal([...family.matchAll(/^### /gm)].length, 6, 'Unexpected dossier heading');
  const fields = ['已给事实', '先问', '有界判断', '理由', '缺失或改变证据'];
  const reasonSources = [[sourceUrls[2]], [sourceUrls[4]], [sourceUrls[4]], [sourceUrls[3]], [sourceUrls[3], sourceUrls[4]], [sourceUrls[5]]];
  for (const [index, dossier] of dossiers.entries()) {
    const body = section(family, dossier[0]);
    const labels = [...body.matchAll(/^\*\*([^*\n]+)：\*\*\s*/gm)];
    assert.deepEqual(labels.map(match => match[1]), fields, `${dossier[1]}: missing/duplicate dossier field`);
    const contents = labels.map((label, i) => body.slice(label.index + label[0].length, labels[i + 1]?.index ?? body.length).trim());
    contents.forEach((content, i) => assert.ok(hasProse(content), `${dossier[1]}: empty ${fields[i]}`));
    for (const url of reasonSources[index]) adjacentSource(contents[3], url);
  }
  const exercise = section(markdown, '## 5. 留给你的一份新档案');
  assert.ok(hasProse(section(exercise, '### 参考解析')), 'Missing exercise explanation');
  const prompt = exercise.slice(0, exercise.indexOf('### 参考解析'));
  numberedSteps(prompt, 3);
  assert.ok(prompt.split(/\n\s*\n/).some(paragraph => paragraph.startsWith('一个质检项目') && hasProse(paragraph.slice(6))), 'Missing exercise facts');
  const onward = section(markdown, '## 6. 接下来读什么');
  for (const target of ['branch:ai-overview:orientation/naive-bayes', 'branch:llm:training/loop']) {
    assert.ok(inlineLinks(onward).some(link => link[2] === `?view=garden&scope=${target}`), `Missing onward link: ${target}`);
  }
  const sources = section(markdown, '## 来源与版本');
  for (const url of sourceUrls) adjacentSource(sources, url);
  return { articleId: article.id, exampleId: unit.exampleId, checkKind: 'observable-case',
    passed: true, caseFamilyChecks: 1, executedExamples: 0, checkScope: 'structure-and-links-only', expertReview: false };
}

export function testExampleContract(units, pythonIds, markdown) {
  const pilot = units.find(article => article.id === pilotId);
  assert.ok(pilot, 'Observable pilot is not registered');
  let negativeCases = 0;
  const rejects = (label, test) => { assert.throws(test, undefined, label); negativeCases++; };
  for (const [label, mutate] of [
    ['unknown mode', rows => rows[0][2] = 'optional'],
    ['missing registration', rows => rows.pop()],
    ['duplicate registration', rows => rows.push([...rows[0]])],
    ['overlapping kinds', rows => rows.push([rows[0][0], rows[0][1], 'observable-case'])],
    ['duplicate article', rows => rows.push([rows[0][0], 'unknown', 'python'])],
    ['duplicate example', rows => rows.push(['unknown', rows[0][1], 'python'])],
    ['unknown case', rows => rows.find(row => row[0] === pilotId)[0] = 'unknown'],
    ['unknown case example', rows => rows.find(row => row[0] === pilotId)[1] = 'unknown'],
    ['numeric reassignment', rows => rows[0][2] = 'observable-case'],
    ['case as Python', rows => rows.find(row => row[0] === pilotId)[2] = 'python'],
    ['wrong numeric pair', rows => [rows[0][1], rows[1][1]] = [rows[1][1], rows[0][1]]]
  ]) {
    const rows = structuredClone(exampleChecks); mutate(rows);
    rejects(label, () => validateExampleChecks(units, pythonIds, rows));
  }
  rejects('unused registration', () => validateExampleChecks(units.filter(article => article.id !== pilotId), pythonIds));
  rejects('missing numeric check', () => validateExampleChecks(units, pythonIds.slice(1)));
  rejects('unused numeric check', () => validateExampleChecks(units, [...pythonIds, 'unknown']));
  rejects('duplicate numeric check', () => validateExampleChecks(units, [...pythonIds, pythonIds[0]]));
  const unknown = structuredClone(pilot); unknown.id = 'unknown';
  rejects('unregistered article', () => validateExampleChecks([...units, unknown], pythonIds));
  rejects('duplicate unit', () => validateExampleChecks([...units, units[0]], pythonIds));
  for (const [label, mutate] of [
    ['article identity', article => article.id = 'unknown'],
    ['example identity', article => article.knowledgeUnit.exampleId = 'unknown'],
    ['review status', article => article.knowledgeUnit.reviewStatus = 'expert-verified'],
    ['extra concept', article => article.knowledgeUnit.conceptIds.push('concept:representation-learning')],
    ['missing concept', article => article.knowledgeUnit.conceptIds.pop()],
    ['placement', article => article.knowledgeUnit.placements[0].path = 'orientation/unknown'],
    ['source metadata', article => article.knowledgeUnit.sourceUrls.pop()]
  ]) {
    const article = structuredClone(pilot); mutate(article);
    rejects(label, () => checkObservableCase(article, markdown));
  }
  const edits = [
    ['missing family', text => text.replace('## 4. 观察案例：ai-ml-dl-boundaries', '## 4. Removed')],
    ['duplicate family', text => text + '\n## 4. 观察案例：ai-ml-dl-boundaries\ncopy'],
    ['duplicate dossier', text => text.replace('### D：', '### C：')],
    ['dossier outside family', text => text + '\n### A：Duplicate\nUnexpected copy'],
    ['hidden dossier', text => text.replace(/(### D：[\s\S]*?)(?=### E：)/, '<!--$1-->')],
    ['unclosed hidden family', text => text.replace('## 4. 观察案例：', '<!--\n## 4. 观察案例：')],
    ['hypothetical status', text => text.replace('**A–F 全部是明确虚构的教学档案，不是实测系统，也不是六次实验。**', '')],
    ['scope note', text => text.replace(/因此，后文可以把[^\n]+/, '')],
    ['uncertainty note', text => text.replace(/一个合格的回答通常长这样：[^\n]+/, '')],
    ['exercise', text => text.replace(/## 5\. 留给你的一份新档案[\s\S]*?(?=## 6\.)/, '')],
    ['missing evidence steps', text => text.replace(/^\d\. \*\*[^\n]+\n/gm, '')],
    ['empty evidence step', text => text.replace(/(1\. \*\*划定对象。\*\*)[^\n]+/, '$1')],
    ['heading-only fact field', text => text.replace(/(\*\*已给事实：\*\*)[^\n]+/, '$1\n#### Placeholder')],
    ['missing exercise questions', text => text.replace(/^\d\. (?!\*\*)[^\n]+\n/gm, '')],
    ['missing exercise facts', text => text.replace(/^一个质检项目[^\n]+/m, '')],
    ['empty exercise explanation', text => text.replace(/(### 参考解析\n)[\s\S]*?(?=## 6\.)/, '$1\n')],
    ['heading-only exercise explanation', text => text.replace(/(### 参考解析\n)[\s\S]*?(?=## 6\.)/, '$1\n#### Placeholder\n\n')],
    ['source images', text => text.replace(/(?<!!)\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)/g, '![$1]($2)')],
    ['source inline code', text => text.replace(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g, link => '`' + link + '`')],
    ['source escaped opening', text => text.replace(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g, link => '\\' + link)],
    ['source escaped closing', text => text.replaceAll('](https://', '\\](https://')],
    ['onward inline code', text => text.replace(/\[[^\]\n]+\]\(\?view=garden[^\s)]+\)/g, link => '`' + link + '`')],
    ['onward images', text => text.replace(/(?<!!)\[([^\]\n]+)\]\((\?view=garden[^\s)]+)\)/g, '![$1]($2)')],
    ['source in image alt', text => text.replace(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g, link => `![${link}](https://example.com/image.png)`)],
    ['source in image after backslashes', text => text.replace(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g, link => '\\\\![' + link + '](https://example.com/image.png)')],
    ['onward in image alt', text => text.replace(/\[[^\]\n]+\]\(\?view=garden[^\s)]+\)/g, link => `![${link}](https://example.com/image.png)`)],
    ['onward link', text => text.replaceAll('?view=garden&scope=branch:llm:training/loop', '?view=garden&scope=branch:llm:missing')],
    ['runnable marker', text => text + '\n# nextchina-example: ai-ml-dl-boundaries'],
    ['Python fence', text => text + '\n```python\npass\n```'],
    ['tilde Python fence', text => text + '\n~~~Python\npass\n~~~']
  ];
  for (const prefix of ['因此，后文可以把', '也别把“深”', '一个合格的回答通常长这样：', '这些是案例引出的工程检查问题']) {
    edits.push([`empty scope note ${prefix}`, text => text.replace(new RegExp(`${prefix}[^\\n]+`), prefix)]);
  }
  for (const letter of ['D', 'F']) edits.push([`missing ${letter}`, text => text.replace(new RegExp(`### ${letter}：[\\s\\S]*?(?=### [A-Z]：|## 5\\.)`), '')]);
  for (const field of ['已给事实', '先问', '有界判断', '理由', '缺失或改变证据']) {
    edits.push([`missing ${field}`, text => text.replace(`**${field}：**`, '**Removed：**')]);
    edits.push([`empty ${field}`, text => text.replace(new RegExp(`(\\*\\*${field}：\\*\\*)[^\\n]+`), '$1')]);
  }
  for (const url of sourceUrls) edits.push([`missing adjacent source ${url}`, text => text.replaceAll(`](${url})`, `](${url}.missing)`) ]);
  edits.push(['bibliography-only source', text => {
    const split = text.indexOf('## 来源与版本');
    return text.slice(0, split).replaceAll(`](${sourceUrls[4]})`, `](${sourceUrls[4]}.missing)`) + text.slice(split);
  }]);
  for (const [label, mutate] of edits) {
    const changed = mutate(markdown); assert.notEqual(changed, markdown, `Mutation did not apply: ${label}`);
    rejects(label, () => checkObservableCase(pilot, changed));
  }
  return negativeCases;
}

// Supplemental renderer-visibility regressions for the original exact pilot;
// its pre-existing 77 contract outcomes remain separately reported.
export function testPilotMarkdownVisibility(article, markdown) {
  const edits = [];
  for (const [kind, pattern] of [
    ['source', /\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g],
    ['onward', /\[[^\]\n]+\]\(\?view=garden[^\s)]+\)/g]
  ]) for (const [syntax, wrap] of [
    ['indented code', link => `\n\n    citation ${link}\n\n`],
    ['HTML block', link => `\n\n<div>\ncitation ${link}\n</div>\n\n`],
    ['HTML attribute', link => `\n\n<div data-source="${link}">citation</div>\n\n`],
    ['math', link => `$${link}$`]
  ]) edits.push([`${kind} ${syntax}`, text => text.replace(pattern, wrap)]);
  for (const tag of ['script', 'pre', 'style', 'textarea']) edits.push([`whole-page ${tag}`, text => text.replace(/^## 1\./m, `<${tag}>\n## 1.`) + `\n</${tag}>\n`]);
  edits.push(['whole-page math', text => text.replace(/^## 1\./m, () => '$$$\n## 1.') + '\n$$$\n']);
  for (const placeholder of ['\nPlaceholder\n-----\n\n', '\n<div>Placeholder</div>\n\n', '\n\n    Placeholder\n\n']) {
    edits.push(['non-prose field', text => text.replace(/(\*\*先问：\*\*)[^\n]+/, '$1' + placeholder)]);
  }
  for (const [label, mutate] of edits) {
    const changed = mutate(markdown); assert.notEqual(changed, markdown, `Mutation did not apply: ${label}`);
    assert.throws(() => checkObservableCase(article, changed), undefined, label);
  }
  return edits.length;
}
