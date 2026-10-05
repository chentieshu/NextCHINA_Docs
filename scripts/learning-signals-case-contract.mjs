import assert from 'node:assert/strict';
import { exampleChecks, validateExampleChecks, section, visibleMarkdown, inlineLinks,
  hasProse, numberedSteps, adjacentSource, assertCaseMarkdown } from './knowledge-example-contract.mjs';

// A second, exact test-only case contract. This is a deletion/identity/link guard,
// not a taxonomy answer key, arithmetic oracle, or a general case framework.
const id = 'unsupervised-self-supervised-learning';
const concepts = ['concept:unsupervised-learning', 'concept:self-supervised-learning'];
const sources = [
  'https://artint.info/3e/html/ArtInt3e.Ch7.S2.html',
  'https://artint.info/3e/html/ArtInt3e.Ch10.S3.html',
  'https://arxiv.org/abs/1810.04805v2',
  'https://arxiv.org/html/1810.04805v2',
  'https://proceedings.mlr.press/v119/chen20j.html',
  'https://proceedings.mlr.press/v119/chen20j/chen20j.pdf',
  'https://developers.google.com/machine-learning/glossary#self-supervised-learning',
  'https://scikit-learn.org/1.9/common_pitfalls.html#data-leakage'
];
const onwardTargets = ['branch:ai-overview:orientation/naive-bayes', 'branch:llm:training/loop',
  'branch:llm:training/samples', 'concept:clustering', 'concept:contrastive-learning'];
const fieldNames = ['已给事实', '先问', '信号与状态', '有界判断', '缺失或改变证据'];
const fiction = '**A–F 全部是明确虚构的教学档案，组成一个观察案例族，不是真实模型测评，也不是六次已执行实验。**';
const familyHeading = `## 3. 观察案例：${id}`;
const exerciseHeading = '## 5. 新迁移题：审计证据到来以后，改写你的结论';
const answerHeading = '### 参考解析：保留成立的部分，修改证据改变的部分';

function includesAll(text, parts, label) {
  for (const part of parts) assert.ok(text.includes(part), `${label}: missing reviewed premise/record ${part}`);
}
function paragraph(text, prefix) {
  const matches = text.split(/\n\s*\n/).filter(part => part.startsWith(prefix));
  assert.equal(matches.length, 1, `Missing/duplicate paragraph: ${prefix}`);
  assert.ok(hasProse(matches[0].slice(prefix.length)), `Empty paragraph: ${prefix}`);
  return matches[0];
}
function table(text, headers, rowLabels) {
  const rows = text.split('\n').filter(line => /^\|.*\|$/.test(line)).map(line => line.slice(1, -1).split('|').map(cell => cell.trim()));
  assert.deepEqual(rows[0], headers, 'Missing/reordered table columns');
  assert.equal(rows.length, rowLabels.length + 2, 'Missing/duplicate table record');
  assert.ok(rows[1].length === headers.length && rows[1].every(cell => /^:?-+:?$/.test(cell)), 'Missing table delimiter');
  assert.deepEqual(rows.slice(2).map(row => row[0]), rowLabels, 'Missing/reassigned fixture or stage row');
  for (const row of rows.slice(2)) {
    assert.equal(row.length, headers.length, 'Wrong record field count');
    row.forEach(cell => assert.ok(hasProse(cell), 'Empty table field'));
  }
  return rows.slice(2);
}

export function checkLearningSignalsCase(article, rawMarkdown) {
  assertCaseMarkdown(rawMarkdown);
  assert.equal(article.id, id);
  const unit = article.knowledgeUnit;
  assert.equal(unit.exampleId, id);
  assert.equal(unit.kind, 'independent-explanation');
  assert.equal(unit.reviewStatus, 'needs-independent-review');
  assert.deepEqual(unit.conceptIds, concepts);
  assert.deepEqual(unit.placements, [{ hubId: 'hub:ai-overview', path: 'orientation/learning-signals' }]);
  assert.deepEqual(unit.sourceUrls, sources);
  assert.deepEqual(unit.relatedResourceIds, []);
  assert.doesNotMatch(rawMarkdown, /nextchina-example|^ {0,3}(?:`{3,}|~{3,})/mi, 'Case must not contain runnable markers or fenced code');
  // Retain inline code in fixtures, but never count it as a visible source link.
  const markdown = rawMarkdown.replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/\r\n/g, '\n');
  assert.match(markdown, /^> \*\*本页解决的问题\*\*：/);
  const definitions = section(markdown, '## 1. 先问“哪个阶段、哪种信号”');
  for (const url of [sources[0], sources[1], sources[3], sources[5], sources[6]]) adjacentSource(visibleMarkdown(definitions), url);
  paragraph(definitions, '这些名称不组成');
  paragraph(definitions, '因此，看到词语不一致');
  const ledger = section(markdown, '## 2. 一张按阶段填写的证据账本');
  table(ledger, ['数据被谁使用', '目标或关系从哪里来', '优化或选择什么', '学得/选定什么状态', '能支持什么结论', '还缺什么证据'], ['列明集合及字段']);
  numberedSteps(ledger, 6);
  const family = section(markdown, familyHeading);
  assert.equal([...markdown.matchAll(/^## .*观察案例[：:]/gm)].length, 1);
  assert.ok(family.includes(fiction), 'Missing fictional case-family scope');
  includesAll(family, ['B、C 是给定假设下的手工拟合', 'D 是人为规定的信息碰撞'], 'Family scope');
  const headings = [...family.matchAll(/^### ([A-Z])：[^\n]+$/gm)];
  assert.deepEqual(headings.map(match => match[1]), ['A', 'B', 'C', 'D', 'E', 'F']);
  assert.equal([...family.matchAll(/^### /gm)].length, 6);
  assert.equal([...markdown.matchAll(/^### [A-Z]：/gm)].length, 6);
  const cases = headings.map(heading => {
    const body = section(family, heading[0]);
    const labels = [...body.matchAll(/^\*\*([^*\n]+)：\*\*\s*/gm)];
    assert.deepEqual(labels.map(label => label[1]), fieldNames, `${heading[1]}: missing/duplicate field`);
    const fields = labels.map((label, i) => body.slice(label.index + label[0].length, labels[i + 1]?.index ?? body.length).trim());
    fields.forEach((field, i) => assert.ok(hasProse(field), `${heading[1]}: empty ${fieldNames[i]}`));
    return { body, fields };
  });
  const [a, b, c, d, e, f] = cases;
  includesAll(a.fields[0], ['(1,2,1)', '(2,9,0)', '(1,7,0)', '(3,1,1)', '固定截止时刻', '封存集合', '没有提供具体算法'], 'A input/scope');
  adjacentSource(visibleMarkdown(a.fields[3]), sources[0]);
  includesAll(b.fields[0], ['A=(0,0)', 'B=(0,2)', 'C=(2,0)', 'D=(2,2)', '两个非空簇', '原坐标单位', '所有无序二分划分', '中心取均值', '全部划分', '\\mu_S=', 'J=\\sum', '总 SSE，不再除以四'], 'B fixture/objective');
  table(b.fields[2], ['划分', '第一块中心', '第二块中心', '总 SSE'], [
    '`{A,B}` 与 `{C,D}`', '`{A,C}` 与 `{B,D}`', '`{A,D}` 与 `{B,C}`',
    '`{A}` 与 `{B,C,D}`', '`{B}` 与 `{A,C,D}`', '`{C}` 与 `{A,B,D}`', '`{D}` 与 `{A,B,C}`'
  ]);
  paragraph(b.fields[2], '以第一行为例');
  includesAll(b.fields[2], ['每个无序且不同的记录对只算一次', '\\subseteq S', '\\frac{1}{|S|}', '2^3-1=7'], 'B enumeration and cross-check scope');
  paragraph(b.fields[3], '这里完成的是七种划分的精确枚举');
  includesAll(b.fields[4], ['仅凭这两个候选的比较', '其余划分的计算或其他全局性论证'], 'B scale scope');
  adjacentSource(visibleMarkdown(b.fields[0]), sources[1]);
  adjacentSource(visibleMarkdown(b.fields[3]), sources[1]);
  includesAll(c.fields[0], ['包裹 已经 送达', '包裹 尚未 送达', '空格规定词元边界', '中间词替换', '只有一个参数', '候选词只有这两个', '样本等权', '0\\le p\\le1', '看不到 ID、原中间词、文件位置'], 'C hand-fit assumptions');
  const traces = table(c.fields[2], ['原始数据', '构造输入', '目标', '给目标的概率', '单行损失'], ['`包裹 已经 送达`', '`包裹 尚未 送达`']);
  assert.deepEqual(traces.map(row => row.slice(0, 3)), [
    ['`包裹 已经 送达`', '`包裹 [MASK] 送达`', '`已经`'],
    ['`包裹 尚未 送达`', '`包裹 [MASK] 送达`', '`尚未`']
  ], 'C construction record identity');
  includesAll(c.fields[2], ['自然对数', '平均交叉熵', 'L(p)=', 'p(1-p)=', '学得状态', '端点'], 'C worked-fit record');
  includesAll(c.fields[3], ['不是 BERT 的词元化、完整遮盖方案、架构或训练运行'], 'C model scope');
  adjacentSource(visibleMarkdown(c.fields[3]), sources[3]);
  includesAll(c.fields[4], ['没有定义其他上下文', '仍强制模型共用', '允许按 ID 输出不同分布', '可见信息与假设类'], 'C side-channel scope');
  includesAll(d.fields[0], ['A 红圆、B 蓝圆、C 红方形', 'A1→A, A2→A, B1→B, B2→B, C1→C, C2→C', '不作为编码器的识别捷径', '未给出具体损失数值或拟合产物'], 'D construction scope');
  const collision = paragraph(d.fields[3], '另设一个');
  includesAll(collision, ['完全人为规定', '逐元素完全相同', '只能读 $G$', '没有原图、ID', '等概率', '随机性不带来源信息', '不是实测准确率', '不能对任意颜色比例'], 'D collision assumptions');
  includesAll(d.fields[4], ['不证明真实 SimCLR 必然丢失颜色', '所用表示层'], 'D augmentation limits');
  adjacentSource(visibleMarkdown(d.fields[3]), sources[5]);
  includesAll(e.fields[0], ['U、Ltrain、Ldev、Ltest 互不重叠', 'Ltest 的文本和标签都不参与', '分别冻结'], 'E fitting boundary');
  table(e.fields[2], ['阶段与数据', '目标/规则', '学得或选定的状态', '可以怎样描述'], ['U 上预训练', 'Ltrain 上拟合', 'Ldev 上选择', 'Ltest 上计分']);
  includesAll(e.fields[2], ['外供主题标签', '分类头权重', '编码器冻结', '标签和分数', '不再调参或换版本'], 'E distinct state/selection roles');
  adjacentSource(visibleMarkdown(e.fields[3]), sources[5]);
  includesAll(e.fields[4], ['没有样本量', '不确定性', '测试分数后再换'], 'E uncertainty');
  includesAll(f.fields[0], ['F1', '归纳预测', '只准在训练实体上拟合', '全部特征一起拟合', '没有给出分数'], 'F1 protocol/log');
  adjacentSource(visibleMarkdown(f.fields[2]), sources[7]);
  includesAll(f.fields[3], ['偏差方向', '重新拟合'], 'F1 scope and repair');
  includesAll(f.fields[4], ['独立的 F2 报告', '不保留 F1 的日志', '拟合与选择日志及评价协议'], 'F2 missing evidence');
  const transduction = paragraph(f.fields[4], 'F3 若事先明确');
  includesAll(transduction, ['传导式任务', '只针对这批目标实体', '另一个问题', '标签是否封存', '事后改名'], 'F3 declared scope');
  const costs = section(markdown, '## 4. 有信号，不等于有你想要的信息');
  for (const prefix of ['- B 的结构拟合', '- C 的原词', '- D 的配对', '- E、F 表明']) assert.ok(costs.split('\n').some(line => line.startsWith(prefix) && hasProse(line.slice(prefix.length))));
  paragraph(costs, '这些是从档案推出的检查项');
  const exercise = section(markdown, exerciseHeading);
  const answer = section(exercise, answerHeading);
  assert.ok(hasProse(answer), 'Empty transfer explanation');
  const prompt = exercise.slice(0, exercise.indexOf(answerHeading));
  const newFacts = paragraph(prompt, '另一个虚构文档标签项目');
  includesAll(newFacts, ['归纳预测', '外供标签', '开发集分数', '初始材料没说测试文本是否进入过预训练'], 'Transfer initial evidence');
  numberedSteps(prompt, 4);
  includesAll(prompt, ['对应文本确实被读取拟合', '并非仅留在未使用索引里', '划掉或改写你第一轮'], 'Transfer second-round evidence');
  for (const prefix of ['第一轮即可确认', '第二轮的新证据', '一种修复是']) paragraph(answer, prefix);
  includesAll(answer, ['哪些参数在后续拟合中更新', '仍是未知', '至少日志证实', '偏差方向或大小', '符合边界的起点'], 'Transfer uncertainty and revision');
  const onward = section(markdown, '## 6. 接下来读什么');
  for (const target of onwardTargets) assert.ok(inlineLinks(visibleMarkdown(onward)).some(link => link[2] === `?view=garden&scope=${target}`), `Missing onward link: ${target}`);
  includesAll(onward, ['独立教学单元仍待建设'], 'Onward coverage boundary');
  const bibliography = section(markdown, '## 来源、版本与验证边界');
  for (const url of sources) adjacentSource(visibleMarkdown(bibliography), url);
  paragraph(bibliography, '本页采用');
  return { articleId: id, exampleId: id, checkKind: 'observable-case', passed: true,
    caseFamilyChecks: 1, executedExamples: 0, checkScope: 'structure-and-links-only', expertReview: false };
}

export function testLearningSignalsContract(units, pythonIds, markdown) {
  const article = units.find(article => article.id === id);
  assert.ok(article, 'Learning-signals case is not registered');
  let negativeCases = 0;
  const rejects = (label, fn) => { assert.throws(fn, undefined, label); negativeCases++; };
  for (const [label, mutate] of [
    ['unknown article', row => row[0] = 'unknown'], ['unknown example', row => row[1] = 'unknown'],
    ['pilot pair reassignment', row => row[1] = 'ai-ml-dl-boundaries'], ['case as Python', row => row[2] = 'python']
  ]) {
    const rows = structuredClone(exampleChecks); mutate(rows.find(row => row[0] === id));
    rejects(label, () => validateExampleChecks(units, pythonIds, rows));
  }
  for (const numericId of pythonIds) {
    const rows = structuredClone(exampleChecks); rows.find(row => row[1] === numericId)[2] = 'observable-case';
    rejects(`numeric downgrade ${numericId}`, () => validateExampleChecks(units, pythonIds, rows));
  }
  rejects('unused second registration', () => validateExampleChecks(units.filter(article => article.id !== id), pythonIds));
  for (const [label, mutate] of [
    ['article identity', row => row.id = 'ai-ml-dl-boundaries'],
    ['example identity', row => row.knowledgeUnit.exampleId = 'ai-ml-dl-boundaries'],
    ['kind', row => row.knowledgeUnit.kind = 'overview'],
    ['review status', row => row.knowledgeUnit.reviewStatus = 'expert-verified'],
    ['extra concept', row => row.knowledgeUnit.conceptIds.push('concept:clustering')],
    ['missing concept', row => row.knowledgeUnit.conceptIds.pop()],
    ['placement', row => row.knowledgeUnit.placements[0].path = 'orientation/ai-ml-dl'],
    ['source metadata', row => row.knowledgeUnit.sourceUrls.pop()]
  ]) { const copy = structuredClone(article); mutate(copy); rejects(label, () => checkLearningSignalsCase(copy, markdown)); }
  const edits = [
    ['family removed', text => text.replace(familyHeading, '## Removed')],
    ['duplicate family', text => text + `\n${familyHeading}\ncopy`],
    ['fiction scope', text => text.replace(fiction, '')],
    ['duplicate dossier', text => text.replace('### D：', '### C：')],
    ['extra dossier', text => text + '\n### A：Duplicate\ncopy'],
    ['hidden dossier', text => text.replace(/(### D：[\s\S]*?)(?=### E：)/, '<!--$1-->')],
    ['unclosed hidden family', text => text.replace(familyHeading, '<!--\n' + familyHeading)],
    ['source images', text => text.replace(/(?<!!)\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\)/g, '![$1]($2)')],
    ['source inline code', text => text.replace(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g, link => '`' + link + '`')],
    ['source hidden', text => text.replace(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g, link => '<!--' + link + '-->')],
    ['source escaped', text => text.replace(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g, link => '\\' + link)],
    ['source escaped closing', text => text.replaceAll('](https://', '\\](https://')],
    ['source in image alt', text => text.replace(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/g, link => `![${link}](https://example.com/image.png)`)],
    ['onward inline code', text => text.replace(/\[[^\]\n]+\]\(\?view=garden[^\s)]+\)/g, link => '`' + link + '`')],
    ['onward hidden', text => text.replace(/\[[^\]\n]+\]\(\?view=garden[^\s)]+\)/g, link => '<!--' + link + '-->')],
    ['onward image', text => text.replace(/(?<!!)\[([^\]\n]+)\]\((\?view=garden[^\s)]+)\)/g, '![$1]($2)')],
    ['runnable marker', text => text + '\n# nextchina-example: ' + id],
    ['fenced code', text => text + '\n```python\npass\n```'],
    ['tilde fence', text => text + '\n~~~Python\npass\n~~~'],
    ['empty ledger field', text => text.replace('外供结果、原词、同源关系等', '')],
    ['missing B row', text => text.replace(/^\| `\{A,B\}`[^\n]+\n/m, '')],
    ['B empty numeric field', text => text.replace('| $4$ |', '| |')],
    ['missing C row', text => text.replace(/^\| `包裹 已经 送达`[^\n]+\n/m, '')],
    ['C wrong target identity', text => text.replace('| `已经` | $p$', '| `[MASK]` | $p$')],
    ['missing E stage', text => text.replace(/^\| Ldev 上选择[^\n]+\n/m, '')],
    ['exercise deletion', text => text.replace(/## 5\. 新迁移题[\s\S]*?(?=## 6\.)/, '')],
    ['missing exercise question', text => text.replace(/^3\. 新增可信日志[^\n]+\n/m, '')],
    ['heading-only exercise answer', text => text.replace(/(### 参考解析：[^\n]+\n)[\s\S]*?(?=## 6\.)/, '$1\n#### Placeholder\n\n')],
    ['bibliography-only source', text => {
      const split = text.indexOf('## 来源、版本与验证边界');
      return text.slice(0, split).replaceAll(`](${sources[5]})`, `](${sources[5]}.missing)`) + text.slice(split);
    }]
  ];
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
  for (const letter of 'ABCDEF') {
    edits.push([`missing ${letter}`, text => text.replace(new RegExp(`### ${letter}：[\\s\\S]*?(?=### [A-Z]：|## 4\\.)`), '')]);
    for (const field of fieldNames) for (const replacement of ['', '\n#### Placeholder\n', '\nPlaceholder\n-----\n\n', '\n<div>Placeholder</div>\n\n']) {
      edits.push([`${letter} empty ${field} ${replacement ? 'heading-only' : ''}`, text => {
        const start = text.indexOf(`### ${letter}：`), end = text.indexOf('### ', start + 4);
        const finish = end === -1 ? text.indexOf('## 4.', start) : end;
        const body = text.slice(start, finish);
        const edited = body.replace(new RegExp(`(\\*\\*${field}：\\*\\*)[\\s\\S]*?(?=\\n\\*\\*[^*\\n]+：\\*\\*|$)`), '$1' + replacement + '\n');
        return text.slice(0, start) + edited + text.slice(finish);
      }]);
    }
  }
  for (const field of fieldNames) edits.push([`math-hidden ${field}`, text =>
    text.replace(new RegExp(`(\\*\\*${field}：\\*\\*)[^\\n]*`), match => `$$$\n${match}\n$$$`)]);
  for (const premise of ['原坐标单位', '总 SSE，不再除以四', '每个无序且不同的记录对只算一次', '样本等权', '看不到 ID、原中间词、文件位置', '没有定义其他上下文', '随机性不带来源信息', '不能对任意颜色比例', '所用表示层', 'U、Ltrain、Ldev、Ltest 互不重叠', '独立的 F2 报告', '传导式任务', '对应文本确实被读取拟合', '符合边界的起点']) {
    edits.push([`deleted premise ${premise}`, text => text.replaceAll(premise, '')]);
  }
  for (const url of sources) edits.push([`deleted source ${url}`, text => text.replaceAll(`](${url})`, `](${url}.missing)`)]);
  for (const target of onwardTargets) edits.push([`deleted onward ${target}`, text => text.replaceAll(`?view=garden&scope=${target}`, '?view=garden&scope=missing')]);
  for (const [label, mutate] of edits) {
    const changed = mutate(markdown); assert.notEqual(changed, markdown, `Mutation did not apply: ${label}`);
    rejects(label, () => checkLearningSignalsCase(article, changed));
  }
  // Intentionally wrong scientific prose still passes: structure is not truth.
  const falseConclusion = markdown.replace('按本页口径，这是监督拟合。', '按本页口径，这是完全没有学习发生的过程。');
  assert.notEqual(falseConclusion, markdown);
  checkLearningSignalsCase(article, falseConclusion);
  return { negativeCases, scientificTruthNotEstablished: true, wrongScientificProseStillPasses: true,
    arithmeticOracle: false, expertReview: false };
}
