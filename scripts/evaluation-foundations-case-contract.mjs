import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { exampleChecks, validateExampleChecks, section, visibleMarkdown, inlineLinks,
  hasProse, numberedSteps, adjacentSource as sharedAdjacentSource, assertCaseMarkdown } from './knowledge-example-contract.mjs';

// Two exact teaching cases only. Literal reviewed records and deletion guards do
// not authenticate logs, derive numerical truth, or establish scientific validity.
const datasetId = 'evaluation-dataset-target-coverage';
const protocolId = 'benchmark-protocol-comparable-runs';
const unitKeys = ['kind', 'reviewStatus', 'exampleId', 'conceptIds', 'placements', 'sourceUrls', 'relatedResourceIds'].sort();
const datasetUnit = {"kind":"independent-explanation","reviewStatus":"needs-independent-review","exampleId":"evaluation-dataset-target-coverage","conceptIds":["concept:evaluation-dataset"],"placements":[{"hubId":"hub:llm","path":"rankings/datasets"}],"sourceUrls":["https://arxiv.org/pdf/1803.09010v8","https://datasets-benchmarks-proceedings.neurips.cc/paper_files/paper/2021/file/084b6fbb10729ed4da8c3d3f5a3ae7c9-Paper-round2.pdf","https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf"],"relatedResourceIds":[]};
const datasetSections = ["## 1. 先写清楚“想知道的量”","## 2. 一行、一个抽样单位、一次使用可能不同","## 3. 参考答案、权限与成本也属于证据","## 4. 观察案例：evaluation-dataset-target-coverage","## 5. 换一份档案：双语 FAQ 助手","## 6. 读完后，可以怎样报告","## 7. 接下来读什么","## 来源与核验范围"];
const datasetHeadings = ["### D1：先说明这份试卷测什么","### D2：同一批行，汇总回答了不同问题","### D3：漏掉夜间，填权重能补回来吗","### D4：来源和参考修订后，具体改哪句话","### D5：高分能证明盒子里面没有坏吗","### 参考解析"];
const datasetTables = [
  [["档案项","初始事实"],["使用单位","每次请求的一张照片"],["初始对象关系","每行来自一个不同包裹；不是独立随机抽样声明"],["抽取范围","两个白天批次，各刻意取十张；批次内选取概率未知"],["时间窗","虚构当地时间 2026-09-01，09:00–11:00"],["清晰图来源批次","`day-c`"],["局部遮挡图来源批次","`day-o`"],["变换说明","假设只缩放显示并移除联系地址文字；无实际文件供核查"],["预定工作量","只含这两类，每次一图；看成绩前规定清晰占 9/10"],["未知项","实际采集成本、原始资料访问路径、许可与再分发权限"]],
  [["行 ID","对象","参考","A","B"],["c01","b01","1","1","1"],["c02","b02","0","0","0"],["c03","b03","1","1","1"],["c04","b04","0","0","0"],["c05","b05","1","1","1"],["c06","b06","0","0","0"],["c07","b07","1","1","1"],["c08","b08","0","0","1"],["c09","b09","1","1","0"],["c10","b10","0","1","0"]],
  [["行 ID","对象","参考","A","B"],["o01","b11","1","1","1"],["o02","b12","0","0","0"],["o03","b13","1","0","1"],["o04","b14","0","1","0"],["o05","b15","1","0","1"],["o06","b16","0","1","0"],["o07","b17","1","0","0"],["o08","b18","0","1","1"],["o09","b19","1","0","0"],["o10","b20","0","1","1"]],
  [["条件","都对","仅 A 对","仅 B 对","都错"],["清晰","7","2","1","0"],["遮挡","2","0","4","4"]]
];
const protocolUnit = {"kind":"independent-explanation","reviewStatus":"needs-independent-review","exampleId":"benchmark-protocol-comparable-runs","conceptIds":["concept:benchmark-protocol"],"placements":[{"hubId":"hub:llm","path":"rankings/protocol"}],"sourceUrls":["https://arxiv.org/pdf/2211.09110v2","https://arxiv.org/pdf/1911.02549v2","https://www.cs.mcgill.ca/~jpineau/ReproducibilityChecklist.pdf","https://jmlr.org/papers/volume22/20-303/20-303.pdf"],"relatedResourceIds":[]};
const protocolSections = ["## 1. 先写问题，再决定哪些条件相同","## 2. 一份可追踪的协议需要什么","## 3. 观察案例：benchmark-protocol-comparable-runs","## 4. 新证据会改变哪一条结论？","## 5. 把原则迁移到语言模型与真实报告","## 6. 与相邻问题一起读","## 来源与核验范围"];
const protocolHeadings = ["### 共用任务与一次尝试清单","### P1：同一有限任务集上的一次尝试","### P2：删除超时后，分数究竟换成了什么","### P3：固定两次尝试与知道答案的离线判分","### P4：看过测试答案以后选出的配置","### P5：增加工具以后，比较对象随之改变","### T1：清单相同，实际输入却少了一项","### T2：同一批输出，用修正后的判分器重新计分"];
const protocolTables = [
  [["需要界定的事","约定与执行证据"],["目的与对象","要回答的问题；基础模型、流程或系统；允许改变什么"],["任务与参考","输入输出定义；题目集合、切片和标签版本；排除规则"],["运行配置","模型、预处理、提示、工具及配置版本；适用的环境、随机设置"],["资源与停止","每题尝试数、时限、工具调用预算；错误后是否重试；如何选答案"],["评价与报告","判分器版本；超时、弃答、无输出的处理；分母与聚合方式"],["开发与选择","搜过哪些配置、何时看过哪些答案；停止开发和选定结果的规则"],["实际记录","每题实际输入、输出、状态和必要时序；哪些偏离尚未解释"]],
  [["清单字段","预先声明的内容"],["A 运行","`run-A1`"],["A 对象与配置","A1，配置 `C-A1`"],["B 运行","`run-B1`"],["B 对象与配置","B1，配置 `C-B1`"],["允许变化","冻结系统及其内部配置不同；并非只改变某一个基础模型组件的干预"],["任务切片","数据 D1，保留 p1–p8 全部八项，参考 L1"],["输入预处理","均用 `resize-v1`"],["输入提示","均用 `route-v1`"],["示例数","0"],["调用资源","每题一次生成，截止 3000 ms；无工具、无检索，无任何重试"],["判分器","S1：原始输出必须严格等于 `GO` 或 `HOLD`，并与 L1 一致；不忽略大小写或空格"],["失败与弃答","错路线、格式错误、`ABSTAIN`、超时及应有却缺失的输出均不成功；本次无弃答"],["分母","所有预定八项均保留，包括失败项；不能只保留完成项"],["环境记录","虚构运行时 R1、机器类 H1，逐题串行，记录种子设置 11；不承诺确定性"],["开发边界","基线 A1、B1 的版本在查看本组结果前冻结；不挑反复测量中的最高分"],["执行证据","基线两系统各八条实际生成记录；原始输出、状态、耗时和 S1 判定都保留"]],
  [["题号","L1","A 输出与 S1 判定","B 输出与 S1 判定"],["p1","GO","GO；正确","GO；正确"],["p2","HOLD","HOLD；正确","HOLD；正确"],["p3","GO","GO；正确","GO；正确"],["p4","HOLD","HOLD；正确","HOLD；正确"],["p5","GO","GO；正确","GO；正确"],["p6","HOLD","HOLD；正确","␠HOLD␠；错误"],["p7","HOLD","GO；错误","无输出；超时"],["p8","GO","HOLD；错误","无输出；超时"]],
  [["题号","A 耗时 ms","B 耗时 ms"],["p1","710","900"],["p2","730","980"],["p3","820","1010"],["p4","790","1240"],["p5","900","1460"],["p6","1050","1510"],["p7","1260","3000"],["p8","1430","3000"]],
  [["题号","第一次","第二次"],["p1","GO；正确","HOLD；错误"],["p2","HOLD；正确","HOLD；正确"],["p3","GO；正确","HOLD；错误"],["p4","HOLD；正确","HOLD；正确"],["p5","GO；正确","HOLD；错误"],["p6","␠HOLD␠；错误","HOLD；正确"],["p7","无输出；超时","HOLD；正确"],["p8","无输出；超时","无输出；超时"]],
  [["题号","第一次耗时 ms","第二次耗时 ms"],["p1","900","1000"],["p2","980","1100"],["p3","1010","1120"],["p4","1240","1200"],["p5","1460","1420"],["p6","1510","1450"],["p7","3000","2200"],["p8","3000","3000"]],
  [["题号","C2 输出与 S1 判定","耗时 ms"],["p1","GO；正确","920"],["p2","HOLD；正确","980"],["p3","GO；正确","1080"],["p4","HOLD；正确","1280"],["p5","GO；正确","1470"],["p6","HOLD；正确","1510"],["p7","GO；错误","1700"],["p8","无输出；超时","3000"]],
  [["题号","B 加工具输出与 S1 判定","生成耗时 ms","工具耗时 ms"],["p1","GO；正确","940","220"],["p2","HOLD；正确","990","210"],["p3","GO；正确","1020","230"],["p4","HOLD；正确","1230","250"],["p5","GO；正确","1400","200"],["p6","HOLD；正确","1530","240"],["p7","HOLD；正确","2410","290"],["p8","HOLD；错误","2800","260"]],
  [["结果版本","A 全任务成功","B 全任务成功"],["S1 原结果","6/8","5/8"],["S2 重计结果","6/8","6/8"]]
];

const datasetFields = ['已给事实', '先问', '有界判断', '理由', '缺失或改变证据'];
const protocolFields = ['已给事实', '先问', '有界判断', '理由', '缺失证据', '修复或下一步'];
const transferFields = ['新增事实', '先问', '解析', '修复与未知'];
const datasetRoutes = ['concept:benchmark-protocol', 'concept:train-validation-test', 'concept:accuracy-f1', 'concept:confidence-interval', 'concept:calibration', 'branch:llm:rankings'];
const protocolRoutes = ['concept:evaluation-dataset', 'branch:llm:rankings/metrics', 'concept:train-validation-test', 'branch:llm:rankings/methodology', 'concept:calibration', 'branch:llm:rankings'];

// Only these authored math expressions may supply literal premise evidence.
// This is a visibility allowlist, not an arithmetic/scientific oracle.
const datasetMath = new Set(["S_A=\\frac9{10}\\frac9{10}+\\frac1{10}\\frac2{10}=\\frac{83}{100}.", "S_B=\\frac9{10}\\frac8{10}+\\frac1{10}\\frac6{10}=\\frac{78}{100}.", "q", "S_A(q)=\\frac15+\\frac7{10}q,", "S_B(q)=\\frac35+\\frac15q.", "S_A(q)-S_B(q)=\\frac12q-\\frac25.", "q>4/5", "q=4/5", "q<4/5"]);
const protocolMath = new Set(["6/8=75\\%", "5/8=62.5\\%", "1/8", "5/6\\approx83.3\\%", "16\\times3000=48000"]);
// Mask invisible metadata and unreviewed math while preserving source offsets.
const evidenceParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);
function evidenceMarkdown(raw, reviewedMath) {
  const ranges = [];
  function visit(node) {
    if (['image', 'imageReference', 'html', 'code', 'definition'].includes(node.type)
      || (['math', 'inlineMath'].includes(node.type) && !reviewedMath.has(node.value))) {
      ranges.push([node.position.start.offset, node.position.end.offset]); return;
    }
    if (['link', 'linkReference'].includes(node.type) && node.position && node.children?.length && node.children.every(child => child.position)) {
      ranges.push([node.position.start.offset, node.children[0].position.start.offset]);
      ranges.push([node.children.at(-1).position.end.offset, node.position.end.offset]);
    }
    for (const child of node.children ?? []) visit(child);
  }
  visit(evidenceParser.parse(raw));
  let visible = raw;
  for (const [start, end] of ranges.sort((a, b) => b[0] - a[0])) visible = visible.slice(0, start) + visible.slice(start, end).replace(/[^\n]/g, ' ') + visible.slice(end);
  return visible.replace(/\r\n/g, '\n');
}
// GFM turns a bare URL inside an escaped Markdown link into an autolink.
// Require a real inline-link AST node with actual bracket syntax in the same
// paragraph checked by the unchanged adjacency helper; do not change old cases.
function adjacentSource(text, url) {
  let found = false;
  function visit(node, paragraphNode) {
    if (['code', 'inlineCode', 'html', 'image', 'imageReference', 'math', 'inlineMath'].includes(node.type)) return;
    const para = node.type === 'paragraph' ? node : paragraphNode;
    if (node.type === 'link') {
      if (!node.position) return; // Synthetic GFM autolinks are never authored inline citations.
      const syntax = text.slice(node.position.start.offset, node.position.end.offset);
      if (para && node.url === url && syntax.startsWith('[') && syntax.endsWith(`](${url})`)) {
        const block = text.slice(para.position.start.offset, para.position.end.offset);
        try { sharedAdjacentSource(block, url); found = true; } catch (error) {
          if (error.code !== 'ERR_ASSERTION') throw error;
        }
      }
      return;
    }
    for (const child of node.children ?? []) visit(child, para);
  }
  visit(evidenceParser.parse(text));
  assert.ok(found, `Missing claim-adjacent source link: ${url}`);
}
function requireParts(text, parts, scope) {
  for (const part of parts) assert.ok(text.includes(part), `Missing reviewed premise: ${scope}: ${part}`);
}
function paragraph(text, prefix) {
  const hits = text.split(/\n\s*\n/).filter(part => part.startsWith(prefix));
  assert.equal(hits.length, 1, `Missing/duplicate paragraph: ${prefix}`);
  assert.ok(hasProse(hits[0].slice(prefix.length)), `Empty paragraph: ${prefix}`);
  return hits[0];
}
function exactTables(text, expected, scope) {
  const blocks = [...text.matchAll(/(?:^\|.*\|(?:\n|$))+/gm)].map(match => match[0].trim());
  assert.equal(blocks.length, expected.length, `Table count: ${scope}`);
  blocks.forEach((block, i) => {
    const rows = block.split('\n').map(line => line.slice(1, -1).split('|').map(cell => cell.trim()));
    assert.deepEqual(rows[0], expected[i][0], `Table columns: ${scope}/${i}`);
    assert.equal(rows.length, expected[i].length + 1, `Table record count: ${scope}/${i}`);
    assert.ok(rows[1].length === rows[0].length && rows[1].every(cell => /^:?-+:?$/.test(cell)), `Table delimiter: ${scope}/${i}`);
    for (const row of rows.slice(2)) {
      assert.equal(row.length, rows[0].length, `Table field count: ${scope}/${i}`);
      row.forEach(cell => assert.ok(hasProse(cell), `Empty table cell: ${scope}/${i}`));
    }
    assert.deepEqual([rows[0], ...rows.slice(2)], expected[i], `Table record identity/order/value: ${scope}/${i}`);
  });
}
function fields(text, names, scope) {
  const labels = [...text.matchAll(/^\*\*([^*\n]+)：\*\*\s*/gm)];
  assert.deepEqual(labels.map(label => label[1]), names, `Case field identity/order: ${scope}`);
  return Object.fromEntries(labels.map((label, i) => {
    const body = text.slice(label.index + label[0].length, labels[i + 1]?.index ?? text.length).trim();
    // Tables are records, not a replacement for a field's explanatory prose.
    assert.ok(hasProse(body.replace(/^\|.*\|$/gm, '')), `Empty case field: ${scope}/${label[1]}`);
    return [label[1], body];
  }));
}
function metadata(article, expected, id) {
  assert.equal(article.id, id, 'Article identity');
  assert.deepEqual(Object.keys(article.knowledgeUnit).sort(), unitKeys, 'Knowledge unit keys');
  for (const key of unitKeys) assert.deepEqual(article.knowledgeUnit[key], expected[key], `Metadata ${key}: ${id}`);
}
function structure(markdown, sections, headings) {
  assert.deepEqual([...markdown.matchAll(/^## .+$/gm)].map(m => m[0]), sections, 'Page section identity/order');
  assert.deepEqual([...markdown.matchAll(/^### .+$/gm)].map(m => m[0]), headings, 'Case/transfer heading identity/order');
  assert.equal([...markdown.matchAll(/^## .*观察案例[：:]/gm)].length, 1, 'Exactly one case family');
}
function routes(text, expected) {
  for (const target of expected) assert.ok(inlineLinks(visibleMarkdown(text)).some(link => link[2] === `?view=garden&scope=${target}`), `Missing onward link: ${target}`);
}
function report(id) {
  return { articleId: id, exampleId: id, checkKind: 'observable-case', passed: true,
    caseFamilyChecks: 1, executedExamples: 0, checkScope: 'structure-and-links-only', arithmeticOracle: false, expertReview: false };
}
function datasetContexts(markdown) {
  const c = Object.fromEntries(datasetSections.map((heading, i) => [`S${i + 1}`, section(markdown, heading)]));
  datasetHeadings.slice(0, 5).forEach((heading, i) => {
    c[`D${i + 1}`] = section(c.S4, heading);
    for (const [key, value] of Object.entries(fields(c[`D${i + 1}`], datasetFields, `D${i + 1}`))) c[`D${i + 1}/${key}`] = value;
  });
  c.answer = section(c.S5, '### 参考解析');
  c.prompt = c.S5.slice(0, c.S5.indexOf('### 参考解析')).trim();
  return c;
}
function protocolContexts(markdown) {
  const c = Object.fromEntries(protocolSections.map((heading, i) => [`S${i + 1}`, section(markdown, heading)]));
  c.shared = section(c.S3, protocolHeadings[0]);
  protocolHeadings.slice(1, 6).forEach((heading, i) => {
    c[`P${i + 1}`] = section(c.S3, heading);
    for (const [key, value] of Object.entries(fields(c[`P${i + 1}`], protocolFields, `P${i + 1}`))) c[`P${i + 1}/${key}`] = value;
  });
  protocolHeadings.slice(6).forEach((heading, i) => {
    c[`T${i + 1}`] = section(c.S4, heading);
    for (const [key, value] of Object.entries(fields(c[`T${i + 1}`], transferFields, `T${i + 1}`))) c[`T${i + 1}/${key}`] = value;
  });
  return c;
}
// Every phrase is scoped to the reviewed section/field where it matters. These
// are omission guards, not a language-understanding or inference oracle.
const datasetPremises = [
  ['S1', ['目标量', '这份有限集合的得分', '按指定构成汇总的样本描述值', '实际目标工作量的成功率', '前两项不会自动成为这一项']],
  ['S2', ['存储行', '抽样单位', '使用单位', '三者可能相同，也可能不同', '抽样框', '并没有测出工作量里两类各占一半']],
  ['S3', ['重要的是保存指引、分歧处理、模糊项与最终裁定依据', '缺少工时、报酬、访问费和保存期限时', '权限状态就仍是未知']],
  ['S4', ['D1–D5 全部是明确虚构的教学档案，没有真实私人数据、照片文件或模型运行。', 'D3、D4、D5 是分别从初始档案出发的证据变化，不能默默叠加']],
  ['D1/已给事实', ['`photo-v1`', '`r1`', '一张包裹照片，输出为 0 或 1', '贯穿外层纸板表面的撕裂，或包装接缝张开', '0 不表示被遮住的表面完好，更不表示内部物品完好', '两名标注者各自按同一指引读图', '有分歧时交第三人裁定并保存理由', '初始分歧数、原始标注和标注者的准确率没有提供', '清晰组十行均来自 `day-c`', '局部遮挡组十行均来自 `day-o`', '共用上述时间窗及 `photo-v1/r1`', '共用同一个时间窗及 `photo-v1/r1`']],
  ['D1/理由', ['标签测的是照片上可见的特定现象', '抽取范围又受两个白天批次限制']],
  ['D1/有界判断', ['描述这二十张构造照片上的正确性', '没有给出随机性或独立性的证据']],
  ['D1/缺失或改变证据', ['目标工作量、抽样过程、其他条件覆盖和参考质控证据', '不会把外包装标签自动变成内部损坏标签']],
  ['D2/已给事实', ['所有行、输出和参考都不变', '预先声明的清晰 9/10、遮挡 1/10', '不是从平衡取样的二十行估计出来的', '清晰组 A 为 9/10、B 为 8/10；遮挡组 A 为 2/10、B 为 6/10', '11/20、B 的 14/20', '\\frac{83}{100}', '\\frac{78}{100}', '100 是结果的分数写法，不是新观察的一百次试验', '复制行来画权重图也不增加独立证据']],
  ['D2/有界判断', ['后者不是已知的总体真值，不证明显著差异，也没有证明部署赢家', '令目标清晰比例为 $q$，且目标暂时仍只含这两类', 'S_A(q)=\\frac15+\\frac7{10}q', 'S_B(q)=\\frac35+\\frac15q', 'S_A(q)-S_B(q)=\\frac12q-\\frac25', '$q>4/5$', '$q=4/5$', '$q<4/5$', '刻意平衡的二十行不能识别一个未知的实际 $q$']],
  ['D2/理由', ['更换的是汇总所回答的目标构成，没有更换单行证据', '不是清单提供的实证结果']],
  ['D2/缺失或改变证据', ['目标比例的可信记录、各层抽样与代表性', '不能把本页的加权分子直接当二项答对数']],
  ['D3/已给事实', ['初始两个批次都排除了夜间', '清晰白天占 4/5、遮挡白天占 1/10、夜间占 1/10', '夜间没有采集记录、参考标签或 A、B 输出', '单独的目标扩展']],
  ['D3/有界判断', ['初始清晰组和遮挡组的样本描述仍成立', '夜间成功率没有观测', '不能称为已测得']],
  ['D3/理由', ['权重只说明那部分占多大，不能提供它的表现']],
  ['D3/缺失或改变证据', ['只讨论已采集的两类白天条件', '采集有记录的夜间样本，用合适参考同时评价 A、B', '不能预设一定更差或一定对某个系统有利']],
  ['D4/已给事实', ['互不依赖的证据更新，都以初始表为起点', 'c08、c09 其实是 c01 所示 b01 的另外两个视角', '原 b08、b09 是录入错误', '图像行、输出、参考不变，其余对象关系也不变', '新指引 r2 规定 o03', '不可判定 U；其他参考不变', '保留 r1', '没有证据说原 r1 记录被歪曲']],
  ['D4/有界判断', ['仍有二十张图，但只有十八个不同对象', '按图的旧描述得分不因对象 ID 更正而算错', '需先规定视角怎样进入一次决策、怎样给对象赋权', '不能随便保留最容易的一张', '版本更新本身不证明不当行为', '同时按 r2 重新评价两列保留输出', '公开不可判定项的处理、数量和适用范围', '不能只重算受益的系统', '11/19、B 的 13/19', '19/20', '必须另行声明可判定资格与分母', '本例在该规则明确前不报告一个替代加权值']],
  ['D4/理由', ['U1 改变的是对象关系与适用单位', 'U2 改变的是参考定义及可判定集合']],
  ['D4/缺失或改变证据', ['真实使用单位', '同版本重评分与不确定项规则', '重评分利用已保存输出，不等于重新运行模型']],
  ['D5/已给事实', ['识别包裹内部物品是否损坏', '没有开箱检验、内部物品状态或它们与照片的逐项对应记录']],
  ['D5/有界判断', ['尚未测量内部损坏', '可复算的满分', '不能补上输入、参考与目标之间缺失的联系']],
  ['D5/理由', ['外包装有痕迹而内部完好、外包装未见迹象而内部损坏', '测量与主张的关系']],
  ['D5/缺失或改变证据', ['缩小结论到照片可见的外包装迹象', '取得与照片配对、适合目标工作量的检验参考', '仍须按新任务验证，不能继承旧包装分数']],
  ['prompt', ['八段客服会话、每段三轮，共二十四行回答', '每段会话最后一答是否解决问题', '每行是否忠实复制了引用的 FAQ 句子', '八段会话全是中文', '英文比例暂时未知', '每段会话最后一轮的准确行号', '中文 3/4、英文 1/4', '没有补来英文会话，也没有补来“是否解决问题”的参考']],
  ['answer', ['第一问，', '第二问，', '第三问，', '连这个窄分数也不能凭空报出', '最后一轮行号允许选出八个最终回答', '混合权重不再未知', '没有提供英文表现', '没有修复“复制忠实”与“解决问题”的参考错位', '为已有中文最终答补充对应任务参考', '补采英文会话及最终答参考', '经过检验的有限代理用途']],
  ['S6', ['不代表一百次试验', '不给出总体显著性或部署赢家', '切片的目标代表性未建立']],
  ['S8', ['2021-12-01', '§3.1–§3.7', '§2.3', '§4.1', '2020-04-07', '第 1 页', '来源访问日期：2026-10-05', '未下载或运行其相关数据集、模型或代码', '不是来源中的实证发现', '没有读者模型实验', 'needs-independent-review', '未取得独立专家认证']]
];
const protocolPremises = [
  ['S1', ['基础模型', '适配后的预测流程', '带工具的系统', '部署配置', '可比性总是相对于一个问题', '不是所有字段都必须机械地相等', '不把该论文 2020 年的具体目标或规则说成 2026 年现行规定']],
  ['S2', ['把“约定”和“发生过的事”分开保留', '及时返回的错路线或无效格式仍是已完成的失败，不能记成超时', '“弃答”是系统明确选择不作决定', '不能顶替承诺的全任务指标', '不能证明系统真的用了它', '不保证随机服务或不同硬件得到完全相同输出']],
  ['S3', ['P1–P5 全部是明确虚构的教学档案，组成一个观察案例族，不是真实模型测评，也不是五次已执行实验。', '互相独立的新增证据分支，不把不同分支拼成一次运行']],
  ['shared', ['参考规则 L1 只判断可见外包装', '这不评价包裹内部物品是否损坏', '固定八项任务上', '凡有输出的格子都表示在时限内完成；“超时”表示到 3000 ms 仍无输出', '两个 `␠` 各代表一个真实的首尾 ASCII 空格，符号本身不属于原始输出']],
  ['P1/已给事实', ['A 有六项正确、两项错误；B 有五项正确、一项格式错误、两项超时']],
  ['P1/有界判断', ['$6/8=75\\%$', '$5/8=62.5\\%$', '这八项、这两个冻结系统和这套一次尝试协议下', '12.5 个百分点']],
  ['P1/理由', ['计分单位是预定任务', '失败项仍占分母']],
  ['P1/缺失证据', ['没有目标总体的抽样依据，不能推断总体差异或显著性', '没有相关随机过程的重复设计，不能保证下次仍如此', '并非只改变一个组件，不能作基础模型改进的因果归因']],
  ['P1/修复或下一步', ['定义目标工作量和取得证据的方式', '对应的受控比较', '冻结重复与报告规则']],
  ['P2/已给事实', ['删除 p7、p8 两条超时', '运行本身没有改变']],
  ['P2/有界判断', ['已完成尝试中的正确比例', '不是预先声明的全任务成功比例', 'A 6/8、B 5/8', 'B 完成了 6/8', '正确 5/6']],
  ['P2/理由', ['若一开始确实要研究完成后的答案质量', '明确条件并同时交代未完成情况']],
  ['P2/缺失证据', ['不知道 B 超时项在更长时限下会答什么']],
  ['P2/修复或下一步', ['恢复两条超时记录与八项主分母', '原错误报告及更正说明']],
  ['P3/已给事实', ['`run-B2`', 'B1 配置 C-B1 与 D1、L1、S1，无工具', '每题固定两次', '种子设置分别为 11、12', '没有复用 `run-B1`', '16 次生成', '16\\times3000=48000', '不含编排与离线评分开销', '第一答正确、错误或超时，都照样启动第二次', '生成器看不到 L1，停止决策不能查正确答案', '离线判分器则读取 L1', '没有另行提供部署选择器']],
  ['P3/有界判断', ['p1–p7 各至少有一次正确，只有 p8 没有', '两次尝试、参考答案辅助的离线诊断', '没有证明一个可部署选择器达到 7/8']],
  ['P3/理由', ['不等于实现“选中正确答案”', '第二次未必独立于第一次', '不把失败概率相乘推算成功率']],
  ['P3/缺失证据', ['不读参考答案的最终答案选择政策', '固定两次都执行的停止政策已经给出', '不同于仅因技术错误而重试']],
  ['P3/修复或下一步', ['触发条件、选择器、总时间、调用和费用预算', '评价最终返回的一个决定']],
  ['P4/已给事实', ['看过八项 L1 和 B 的结果后，选出配置 C2', '`route-v2`', '`run-C2`', '全八项分母']],
  ['P4/有界判断', ['6/8 是有效的描述', '不能作为该开发过程在未触碰测试上的最终估计']],
  ['P4/理由', ['不会消除此前看过答案的事实', '没有提供全部搜索历史']],
  ['P4/缺失证据', ['披露尝试过哪些配置、如何选择 C2、何时查看结果', '未用于这次选择的评价证据']],
  ['P4/修复或下一步', ['冻结选定系统及下一次评价政策', '适当未触碰的数据上评价']],
  ['P5/已给事实', ['B1 配置 C-B1 加查询工具', '外部包装指引 K1', '每题恰一次工具调用，上限 1000 ms，随后一次生成，上限 3000 ms；不重试', '最多 4000 ms', '不含另列的固定编排开销', '八次工具调用均完成']],
  ['P5/有界判断', ['B 加工具成功 7/8', '目标决策允许使用该工具', '没有隔离 B 基础模型的贡献', '不能冒称无工具结果']],
  ['P5/理由', ['工具带来外部信息，也改变了运行资源和失败路径', '基础模型是否改善']],
  ['P5/缺失证据', ['工具可用性、访问权限、信息版本', '最终端到端时间、调用费用', '没有真实价格']],
  ['P5/修复或下一步', ['B1 加工具及 K1', '保留各项资源预算与执行状态']],
  ['S4', ['两题各自从基线出发；T1 不适用于 T2']],
  ['T1/新增事实', ['A 的另一份导出档案', 'p7 因解码拒绝被丢弃', '生成输入只有 p1–p6、p8', 'p7 没有生成输出', '来自默认失败标记', '不能把原表里的 `GO` 当作这个分支真实生成过的答案', 'B 的八条原记录完整', '缺失必需输出也计失败']],
  ['T1/解析', ['不能保留“同样八项都进入生成”的说法', '预处理失败、无生成', '撤回虚构响应并保留修订链', '全部八项必需任务的端到端口径下', 'A 仍为 6/8，B 仍为 5/8', '不能再解释为在相同八项模型输入下的比较']],
  ['T1/修复与未知', ['原始输入标识、预处理输入输出、丢弃原因和生成请求', '重新运行受影响的比较并留新运行 ID', '另一侧条件和保留记录仍适用', '仅给 p7 补一条猜测结果不能修复', 'p7 真正送进 A 时会答什么仍未知']],
  ['T2/新增事实', ['完整的基线输出，与 T1 无关', '运行前已有的格式说明 F1', '解析缺陷 PB1', 'S2 只移除首尾 ASCII 空格', '不改标签、输出、时限、题目或生成过程', '修复依据是已有 F1', '不是为了偏袒一方而挑规则', '双方所有保留输出都用 S2 重计']],
  ['T2/解析', ['唯一改变的是 B 的 p6', 'A 仍为 6/8；B 从 S1 的 5/8 变为 S2 的 6/8', 'B 的 p7、p8 仍超时', '同一输出的重新计分', '不是一次新的模型生成运行']],
  ['T2/修复与未知', ['`run-A1`、`run-B1`', '未改变的输出文件身份、L1、S1 旧结果、S2 新结果、PB1 修复说明和重计时间', '2026-09-20 10:00 UTC', '10:10 用 S1 计分，次日 09:00 用 S2 重计', '评价规则的适应性选择', '适当独立证据另作确认']],
  ['S5', ['有限任务上的描述', '不是遇到一个变化就宣布所有比较都毫无意义', '把记录齐全当作结论已经成立', '记录充分、计算正确和科学结论充分分开检查']],
  ['S7', ['2026-10-05', '2023-10-01', '§2.1–2.3', 'J.1–J.4', '2020-05-09', '§III.B–C', '§VII.E', '2020-04-07', '此 URL 未锁定版本', 'v1.2 检查表', '不把它与另引的 v2.0 混成同一版本', '没有真实模型执行、总体显著性结论或独立专家认证', 'needs-independent-review']]
];

export function checkEvaluationDatasetCase(article, rawMarkdown) {
  assertCaseMarkdown(rawMarkdown); // Always whole raw page, before any slicing.
  metadata(article, datasetUnit, datasetId);
  assert.doesNotMatch(rawMarkdown, /nextchina-example/i, 'Observable case has runnable marker');
  const markdown = rawMarkdown.replace(/\r\n/g, '\n');
  assert.match(markdown, /^> \*\*本页解决的问题\*\*：[^\n]+/, 'Dataset opening question');
  const visibleMarkdownPage = evidenceMarkdown(markdown, datasetMath);
  structure(markdown, datasetSections, datasetHeadings);
  const c = datasetContexts(markdown);
  const visible = datasetContexts(visibleMarkdownPage);
  for (const [scope, parts] of datasetPremises) requireParts(visible[scope], parts, scope);
  exactTables(markdown, datasetTables, 'dataset whole page');
  exactTables(c['D1/已给事实'], datasetTables.slice(0, 3), 'D1 facts');
  exactTables(c['D2/已给事实'], datasetTables.slice(3), 'D2 facts');
  numberedSteps(c.S2, 6);
  numberedSteps(c.prompt, 3);
  for (const prefix of ['第一问，', '第二问，', '第三问，']) paragraph(c.answer, prefix);
  const [datasheets, raji, checklist] = datasetUnit.sourceUrls;
  adjacentSource(visibleMarkdown(c.S1), raji);
  adjacentSource(visibleMarkdown(c.S2), datasheets);
  adjacentSource(visibleMarkdown(c.S2), checklist);
  for (const prefix of ['若规则改变', '能看到一张图片']) adjacentSource(visibleMarkdown(paragraph(c.S3, prefix)), datasheets);
  [datasheets, checklist, datasheets, datasheets, raji].forEach((url, i) => adjacentSource(visibleMarkdown(c[`D${i + 1}/理由`]), url));
  for (const url of datasetUnit.sourceUrls) adjacentSource(visibleMarkdown(c.S8), url);
  routes(markdown.slice(0, markdown.indexOf(datasetSections[0])), ['concept:train-validation-test', 'concept:accuracy-f1']);
  routes(c.S7, datasetRoutes);
  return report(datasetId);
}
function protocolIntroduction(rawMarkdown) {
  const tree = evidenceParser.parse(rawMarkdown);
  assert.equal(tree.children[0]?.type, 'blockquote', 'Protocol opening blockquote');
  const first = tree.children[0]?.children[0]?.children[0];
  assert.equal(first?.type, 'strong', 'Protocol opening label');
  assert.equal(first.children.map(node => node.value ?? '').join(''), '本页解决的问题', 'Protocol opening label');
  assert.equal(rawMarkdown.split('\n')[0], '> **本页解决的问题**：看到 A 得 6/8、B 得 5/6，先别排先后。分母里是谁，超时怎么算，允许几次尝试，比较的是模型还是带工具的系统，都会改变这两个数回答的问题。', 'Protocol opening text');
  function visit(node) {
    assert.ok(node.type !== 'heading' || node.depth !== 1, 'Protocol body H1 duplicates registry title');
    for (const child of node.children ?? []) visit(child);
  }
  visit(tree);
}
export function checkBenchmarkProtocolCase(article, rawMarkdown) {
  assertCaseMarkdown(rawMarkdown); // Always whole raw page, before any slicing.
  metadata(article, protocolUnit, protocolId);
  assert.doesNotMatch(rawMarkdown, /nextchina-example/i, 'Observable case has runnable marker');
  const markdown = rawMarkdown.replace(/\r\n/g, '\n');
  protocolIntroduction(markdown);
  assert.equal(article.category, 'evaluation-statistics', 'Protocol outer category');
  assert.equal(article.categoryName, '评测与统计基础', 'Protocol outer category name');
  const visibleMarkdownPage = evidenceMarkdown(markdown, protocolMath);
  structure(markdown, protocolSections, protocolHeadings);
  const c = protocolContexts(markdown);
  const visible = protocolContexts(visibleMarkdownPage);
  for (const [scope, parts] of protocolPremises) requireParts(visible[scope], parts, scope);
  exactTables(markdown, protocolTables, 'protocol whole page');
  exactTables(c.S2, protocolTables.slice(0, 1), 'protocol evidence map');
  exactTables(c.shared, protocolTables.slice(1, 4), 'protocol shared facts');
  exactTables(c['P3/已给事实'], protocolTables.slice(4, 6), 'P3 facts');
  exactTables(c['P4/已给事实'], protocolTables.slice(6, 7), 'P4 facts');
  exactTables(c['P5/已给事实'], protocolTables.slice(7, 8), 'P5 facts');
  exactTables(c['T2/解析'], protocolTables.slice(8), 'T2 answer');
  numberedSteps(c['T1/先问'], 2); numberedSteps(c['T2/先问'], 2); numberedSteps(c.S5, 5);
  const [helm, mlperf, checklist, jmlr] = protocolUnit.sourceUrls;
  adjacentSource(visibleMarkdown(c.S1), helm); adjacentSource(visibleMarkdown(c.S1), mlperf);
  adjacentSource(visibleMarkdown(c.S2), checklist); adjacentSource(visibleMarkdown(c.T1), mlperf);
  adjacentSource(visibleMarkdown(c.S5), jmlr);
  for (const url of protocolUnit.sourceUrls) adjacentSource(visibleMarkdown(c.S7), url);
  routes(c.S6, protocolRoutes);
  return report(protocolId);
}

// Private mutation mechanics for these two pages only; not a new public schema.
function changeScope(markdown, context, replacement) {
  const at = markdown.indexOf(context);
  assert.ok(at >= 0, 'Mutation scope must exist');
  return markdown.slice(0, at) + replacement + markdown.slice(at + context.length);
}
function checkMutation(label, original, changed, check, diagnostic, outcomes) {
  assert.notDeepEqual(changed, original, `Mutation did not apply: ${label}`);
  assert.throws(() => check(changed), diagnostic, label);
  outcomes.push({ label, expectedDiagnostic: diagnostic.source, rejected: true });
}
function contentMutations(article, markdown, checker, contexts, premises, caseNames, fieldNames, sections, headings, tables, onwardRoutes, sources) {
  checker(article, markdown);
  const outcomes = [], c = contexts(markdown);
  const reject = (label, changed, diagnostic) => checkMutation(label, markdown, changed, text => checker(article, text), diagnostic, outcomes);
  const inScope = (label, key, fn, diagnostic) => reject(label, changeScope(markdown, c[key], fn(c[key])), diagnostic);
  const structural = /Observable cases|Heading text|Field labels|Fixture row|Page section|Case\/transfer heading|Table|Missing reviewed premise/;
  for (const [label, mutate, diagnostic] of [
    ['article ID', x => x.id = 'unknown-article', /Article identity/],
    ['swapped new article', x => x.id = article.id === datasetId ? protocolId : datasetId, /Article identity/],
    ['swapped new example', x => x.knowledgeUnit.exampleId = article.id === datasetId ? protocolId : datasetId, /Metadata exampleId/],
    ['old example reassignment', x => x.knowledgeUnit.exampleId = 'ai-ml-dl-boundaries', /Metadata exampleId/],
    ['kind', x => x.knowledgeUnit.kind = 'overview', /Metadata kind/],
    ['review status', x => x.knowledgeUnit.reviewStatus = 'expert-verified', /Metadata reviewStatus/],
    ['missing concept', x => x.knowledgeUnit.conceptIds.pop(), /Metadata conceptIds/],
    ['extra concept', x => x.knowledgeUnit.conceptIds.push('concept:calibration'), /Metadata conceptIds/],
    ['wrong placement', x => x.knowledgeUnit.placements[0].path = 'rankings/metrics', /Metadata placements/],
    ['extra placement', x => x.knowledgeUnit.placements.push({hubId: 'hub:llm', path: 'rankings/methodology'}), /Metadata placements/],
    ['missing source', x => x.knowledgeUnit.sourceUrls.pop(), /Metadata sourceUrls/],
    ['unused source', x => x.knowledgeUnit.sourceUrls.push('https://example.com/unused'), /Metadata sourceUrls/],
    ['extra related resource', x => x.knowledgeUnit.relatedResourceIds.push('unknown'), /Metadata relatedResourceIds/],
    ['missing metadata key', x => delete x.knowledgeUnit.relatedResourceIds, /Knowledge unit keys/],
    ['extra metadata key', x => x.knowledgeUnit.exampleKind = 'observable-case', /Knowledge unit keys/]
  ]) {
    const changed = structuredClone(article); mutate(changed);
    checkMutation(label, article, changed, value => checker(value, markdown), diagnostic, outcomes);
  }
  reject('runnable marker', markdown + '\n# nextchina-example: ' + article.id, /runnable marker/);
  reject('missing family', markdown.replace(sections.find(h => h.includes('观察案例')), '## Removed'), /Page section/);
  reject('duplicate family', markdown + '\n' + sections.find(h => h.includes('观察案例')) + '\ncopy', /Page section/);
  reject('case outside family', markdown + '\n' + headings.find(h => /^### [DP]1：/.test(h)) + '\ncopy', /Case\/transfer heading/);
  reject('unknown case ID', markdown.replace(/^### [DP]1：/m, '### X9：'), /Case\/transfer heading/);
  reject('duplicate case ID', markdown.replace(/^### ([DP])2：/m, '### $11：'), /Case\/transfer heading/);
  reject('escaped case heading', markdown.replace(/^### ([DP])1：/m, '\\### $11：'), /Case\/transfer heading/);
  reject('reordered case headings', markdown.replace(headings.find(h => /^### [DP]1：/.test(h)), '### temporary').replace(headings.find(h => /^### [DP]2：/.test(h)), headings.find(h => /^### [DP]1：/.test(h))).replace('### temporary', headings.find(h => /^### [DP]2：/.test(h))), /Case\/transfer heading/);
  const familyKey = article.id === datasetId ? 'S4' : 'S3';
  for (const [kind, wrap] of [
    ['comment', x => '<!--\n' + x + '\n-->'], ['unclosed comment', x => '<!--\n' + x],
    ['HTML', x => '<div>\n' + x + '\n</div>'], ['script', x => '<script>\n' + x + '\n</script>'],
    ['backtick code', x => '```text\n' + x + '\n```'], ['tilde code', x => '~~~text\n' + x + '\n~~~'],
    ['indented code', x => x.split('\n').map(line => '    ' + line).join('\n')],
    ['math', x => '$$\n' + x + '\n$$']
  ]) inScope('hidden family ' + kind, familyKey, wrap, structural);
  for (const name of caseNames) {
    const heading = headings.find(h => h.startsWith(`### ${name}：`));
    reject('missing case ' + name, markdown.replace(heading + '\n\n' + c[name], ''), /Case\/transfer heading/);
    for (const field of fieldNames) {
      const key = `${name}/${field}`;
      for (const [kind, filler] of [['blank', ''], ['heading-only', '#### Placeholder'], ['link-only', '[Placeholder](https://example.com/)']]) {
        inScope(`${key} ${kind}`, key, () => filler, /Empty case field/);
      }
      const body = c[name];
      reject(`${key} missing label`, changeScope(markdown, body, body.replace(`**${field}：**`, '')), /Case field identity\/order/);
    }
  }
  for (const [scope, parts] of premises) for (const phrase of parts) {
    inScope(`premise ${scope}: ${phrase}`, scope, text => text.replace(phrase, ''), /Missing reviewed premise/);
  }
  const [visibleScope, visibleParts] = (premises.find(([key]) => key.endsWith('/缺失证据')) ?? premises.find(([key]) => key.endsWith('/有界判断')));
  const visiblePhrase = visibleParts[0];
  for (const [kind, wrap] of [
    ['image alt', x => `![${x}](https://example.com/image.png)`],
    ['link title', x => `[说明](https://example.com/ "${x}")`],
    ['link destination', x => `[说明](<https://example.com/${x}>)`],
    ['reference definition', x => `[说明][evidence-hidden]\n\n[evidence-hidden]: https://example.com/ "${x}"\n\n`],
    ['math', x => `$${x}$`]
  ]) inScope(`essential premise hidden in ${kind}`, visibleScope, text => text.replace(visiblePhrase, () => wrap(visiblePhrase)), /Missing reviewed premise|Empty case field/);
  for (const [key] of premises.filter(([key]) => /\/(理由|缺失证据|缺失或改变证据|修复或下一步|修复与未知|解析)$/.test(key))) {
    inScope(`generic filler ${key}`, key, () => '解释。', /Missing reviewed premise/);
  }
  // Each table mutation changes one table and leaves all other tables intact.
  const tableBlocks = [...markdown.matchAll(/(?:^\|.*\|(?:\n|$))+/gm)].map(m => m[0].trim());
  tableBlocks.forEach((block, index) => {
    const rows = block.split('\n');
    for (const [kind, mutate, diagnostic] of [
      ['missing record', lines => lines.splice(2, 1), /Table record count/],
      ['duplicate record', lines => lines.push(lines[2]), /Table record count/],
      ['reassigned record', lines => lines[2] = lines[2].replace(/^(\|)[^|]+/, '$1 unknown '), /Table record identity/],
      ['empty cell', lines => lines[2] = lines[2].replace(/\|[^|]+\|$/, '| |'), /Empty table cell/],
      ['changed cell', lines => lines[2] = lines[2].replace(/\|[^|]+\|$/, '| MUTATED |'), /Table record identity/],
      ['column order', lines => { const cells = lines[0].split('|'); [cells[1], cells[2]] = [cells[2], cells[1]]; lines[0] = cells.join('|'); }, /Table columns/],
      ['fake table', lines => lines.splice(1, 1), /Fixture row/]
    ]) {
      const changed = [...rows]; mutate(changed);
      reject(`table ${index} ${kind}`, changeScope(markdown, block, changed.join('\n')), diagnostic);
    }
  });
  // One source paragraph at a time, including repeated citations of one URL.
  const sourceParagraphs = markdown.split(/\n\s*\n/).filter(p => /\]\(https:\/\//.test(p));
  for (const [i, para] of sourceParagraphs.entries()) {
    const links = [...para.matchAll(/\]\((https:\/\/[^)]+)\)/g)];
    for (const [j, link] of links.entries()) {
      const changed = para.slice(0, link.index) + `](${link[1]}.missing)` + para.slice(link.index + link[0].length);
      reject(`source paragraph ${i} citation ${j}`, changeScope(markdown, para, changed), /Missing claim-adjacent source link/);
    }
  }
  const firstLink = markdown.match(/\[[^\]\n]+\]\(https:\/\/[^\s)]+\)/)[0];
  for (const [kind, wrap, diagnostic] of [
    ['image', x => '!' + x, /Missing claim-adjacent source/],
    ['inline code', x => '`' + x + '`', /Missing claim-adjacent source/],
    ['escaped open', x => '\\' + x, /Missing claim-adjacent source/],
    ['escaped close', x => x.replace('](', '\\]('), /Missing claim-adjacent source/],
    ['image alt', x => '![' + x + '](https://example.com/image.png)', /Missing claim-adjacent source/],
    ['math', x => '$' + x + '$', /Missing claim-adjacent source/],
    ['comment', x => '<!--' + x + '-->', /Observable cases/],
    ['indented code', x => '\n\n    ' + x + '\n\n', /Observable cases/],
    ['HTML attribute', x => '<span data-source="' + x + '">source</span>', /Observable cases/],
    ['reference only', x => '[source][hidden-reference]\n\n[hidden-reference]: ' + x.match(/\((.*)\)$/)[1], /Missing claim-adjacent source/]
  ]) reject('source in ' + kind, markdown.replace(firstLink, wrap(firstLink)), diagnostic);
  const firstPara = sourceParagraphs[0];
  reject('link-only source paragraph', changeScope(markdown, firstPara, firstLink), /Missing claim-adjacent source/);
  for (const target of onwardRoutes) {
    const onwardKey = article.id === datasetId ? 'S7' : 'S6';
    inScope('missing onward ' + target, onwardKey, text => text.replace(`?view=garden&scope=${target}`, '?view=garden&scope=missing'), /Missing onward link/);
  }
  const onwardKey = article.id === datasetId ? 'S7' : 'S6';
  const firstOnward = c[onwardKey].match(/\[[^\]\n]+\]\(\?view=garden[^\s)]+\)/)[0];
  for (const [kind, wrap] of [['inline code', x => '`' + x + '`'], ['image', x => '!' + x], ['escaped', x => '\\' + x], ['math', x => '$' + x + '$']]) {
    inScope('onward in ' + kind, onwardKey, text => text.replace(firstOnward, wrap(firstOnward)), /Missing onward link/);
  }
  return { outcomes, reject, inScope, c };
}
export function testEvaluationDatasetContract(units, pythonIds, markdown) {
  const article = units.find(a => a.id === datasetId);
  assert.ok(article, 'Dataset case is not registered');
  const { outcomes, reject, inScope, c } = contentMutations(article, markdown, checkEvaluationDatasetCase, datasetContexts, datasetPremises,
    ['D1', 'D2', 'D3', 'D4', 'D5'], datasetFields, datasetSections, datasetHeadings, datasetTables, datasetRoutes, datasetUnit.sourceUrls);
  inScope('transfer missing question', 'prompt', text => text.replace(/^2\. .+\n?/m, ''), /Missing\/duplicate numbered/);
  inScope('transfer duplicate question', 'prompt', text => text + '\n1. duplicate', /Missing\/duplicate numbered/);
  inScope('transfer empty answer', 'answer', () => '#### Placeholder', /Missing reviewed premise|Empty paragraph/);
  reject('transfer answer moved outside section', changeScope(markdown, c.answer, '#### Placeholder') + '\n' + c.answer, /Missing reviewed premise|Empty paragraph/);
  reject('case conclusion moved outside case', changeScope(markdown, c['D3/有界判断'], '') + '\n' + c['D3/有界判断'], /Empty case field/);
  reject('math-hidden field label', markdown.replace('**先问：**', '$**先问：**$'), /Case field identity\/order|Field labels/);
  const wrong = changeScope(markdown, c['D2/有界判断'], c['D2/有界判断'] + '\n\nA 的真实部署正确率已经被证明为83%，并且显著优于B。');
  assert.notEqual(wrong, markdown); checkEvaluationDatasetCase(article, wrong);
  return { negativeCases: outcomes.length, outcomes, wrongScientificProseStillPasses: true, scientificTruthNotEstablished: true, arithmeticOracle: false, expertReview: false };
}
export function testBenchmarkProtocolContract(units, pythonIds, markdown) {
  const article = units.find(a => a.id === protocolId);
  assert.ok(article, 'Protocol case is not registered');
  const { outcomes, reject, inScope, c } = contentMutations(article, markdown, checkBenchmarkProtocolCase, protocolContexts, protocolPremises,
    ['P1', 'P2', 'P3', 'P4', 'P5'], protocolFields, protocolSections, protocolHeadings, protocolTables, protocolRoutes, protocolUnit.sourceUrls);
  reject('missing introductory blockquote', markdown.replace(/^> /, ''), /Protocol opening/);
  reject('wrong introductory label', markdown.replace('**本页解决的问题**', '**说明**'), /Protocol opening/);
  reject('duplicate registry title as body H1', '# 评测协议：两个分数在什么条件下可以比较？\n\n' + markdown, /Protocol opening|Protocol body H1/);
  reject('setext body H1', markdown + '\n\nDuplicate title\n===============\n', /Protocol body H1/);
  for (const [key, value] of [['category', 'evaluation'], ['categoryName', '评价与统计']]) {
    const changed = structuredClone(article); changed[key] = value;
    checkMutation(`old protocol ${key}`, article, changed, row => checkBenchmarkProtocolCase(row, markdown), /Protocol outer category/, outcomes);
  }
  for (const name of ['T1', 'T2']) {
    for (const field of transferFields) inScope(`${name}/${field} empty`, `${name}/${field}`, () => '[Placeholder](https://example.com/)', /Empty case field/);
    inScope(`${name} missing question`, `${name}/先问`, text => text.replace(/^2\. .+\n?/m, ''), /Missing\/duplicate numbered/);
    inScope(`${name} duplicate question`, `${name}/先问`, text => text + '\n1. duplicate', /Missing\/duplicate numbered/);
    reject(`${name} answer moved outside transfer`, changeScope(markdown, c[`${name}/解析`], '') + '\n' + c[`${name}/解析`], /Empty case field/);
  }
  inScope('hidden run ID in phantom math', 'P3/已给事实', text => text.replace('`run-B2`', () => '$\\phantom{`run-B2`}$'), /Missing reviewed premise/);
  reject('case conclusion moved outside case', changeScope(markdown, c['P2/有界判断'], '') + '\n' + c['P2/有界判断'], /Empty case field/);
  reject('math-hidden field label', markdown.replace('**先问：**', '$**先问：**$'), /Case field identity\/order|Field labels/);
  const wrong = changeScope(markdown, c['P1/有界判断'], c['P1/有界判断'] + '\n\n因此已经证明 A 在所有未来任务上更可靠。');
  assert.notEqual(wrong, markdown); checkBenchmarkProtocolCase(article, wrong);
  return { negativeCases: outcomes.length, outcomes, wrongScientificProseStillPasses: true, scientificTruthNotEstablished: true, arithmeticOracle: false, expertReview: false };
}
export function testEvaluationFoundationsRegistrations(units, pythonIds) {
  validateExampleChecks(units, pythonIds);
  const outcomes = [];
  const rejectRows = (label, changed, diagnostic) => checkMutation(label, exampleChecks, changed, rows => validateExampleChecks(units, pythonIds, rows), diagnostic, outcomes);
  for (const id of [datasetId, protocolId]) {
    rejectRows(`${id} missing registration`, exampleChecks.filter(row => row[0] !== id), /Unregistered example article/);
    rejectRows(`${id} duplicate row`, [...exampleChecks, [...exampleChecks.find(row => row[0] === id)]], /Duplicate\/overlapping/);
    for (const [label, mutate, diagnostic] of [
      ['unknown article', row => row[0] = 'unknown', /Unknown observable-case/],
      ['unknown example', row => row[1] = 'unknown', /Unknown observable-case/],
      ['unknown kind', row => row[2] = 'noncomputational', /Unknown example kind/],
      ['case as Python', row => row[2] = 'python', /Missing numeric checks/],
      ['reassigned old case', row => row[1] = 'ai-ml-dl-boundaries', /Duplicate\/overlapping|Unknown observable-case/],
      ['reassigned numeric', row => row[1] = pythonIds[0], /Duplicate\/overlapping|Cannot reassign numeric/]
    ]) {
      const rows = structuredClone(exampleChecks); mutate(rows.find(row => row[0] === id)); rejectRows(`${id} ${label}`, rows, diagnostic);
    }
    const fewer = units.filter(a => a.id !== id);
    checkMutation(`${id} unused registration`, units, fewer, value => validateExampleChecks(value, pythonIds), /Unused example registration/, outcomes);
    const reassigned = structuredClone(units); reassigned.find(a => a.id === id).knowledgeUnit.exampleId = 'unknown';
    checkMutation(`${id} wrong unit example`, units, reassigned, value => validateExampleChecks(value, pythonIds), /Wrong article\/example pair/, outcomes);
  }
  const swapped = structuredClone(exampleChecks);
  swapped.find(row => row[0] === datasetId)[1] = protocolId;
  swapped.find(row => row[0] === protocolId)[1] = datasetId;
  rejectRows('swap new case identities', swapped, /Unknown observable-case/);
  for (const numericId of pythonIds) {
    const rows = structuredClone(exampleChecks); rows.find(row => row[1] === numericId)[2] = 'observable-case';
    rejectRows(`numeric downgrade ${numericId}`, rows, /Cannot reassign numeric/);
  }
  const duplicate = [...units, structuredClone(units.find(a => a.id === datasetId))];
  checkMutation('duplicate unit', units, duplicate, value => validateExampleChecks(value, pythonIds), /Duplicate unit/, outcomes);
  return { negativeCases: outcomes.length, outcomes, numericExamplesProtected: pythonIds.length, expertReview: false };
}
