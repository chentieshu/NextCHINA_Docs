import research from './research';
import type { DocChapter } from '../types';

// JSON is the single source of truth for reading, navigation and search.
type Brief = { label: string; desc: string };
type Section = DocChapter & { brief: Brief[] };
const sourceMap = new Map(research.sources.map(source => [source.id, source]));
const kindNames: Record<string, string> = {
  saas: '应用 / SaaS', agent: 'Agent 产品', framework: '构建平台 / 框架',
  api: 'API / 基础设施', 'model-service': '模型能力入口'
};
const cell = (value: unknown): string => String(value ?? '待核验').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
function table(headers: string[], rows: unknown[][]): string {
  return [headers, headers.map(() => '---'), ...rows].map(row => `| ${row.map(cell).join(' | ')} |`).join('\n');
}
function sourceLinks(ids: string[]): string {
  return [...new Set(ids)].map(id => {
    const source = sourceMap.get(id);
    if (!source) throw new Error(`Unknown research source: ${id}`);
    return `[${source.title}](${source.url})`;
  }).join(' · ');
}
function section(id: string, title: string, subtitle: string, category: string,
  categoryName: string, content: string, brief: Brief[], tags: string[] = []): Section {
  return {
    id, slug: id, title, subtitle, category, categoryName,
    readTime: `${Math.max(1, Math.ceil(content.length / 800))} 分钟`,
    date: research.checkedAt, tags: [...new Set([categoryName, ...tags])],
    excerpt: subtitle, content: content.trim(), brief
  };
}
type Product = typeof research.products[number];
function priceText(product: Product): string {
  if (!product.plans.length) return '未录入数值价格';
  return product.plans.map(plan => `${plan.name}：${plan.currency} ${plan.amount}/${plan.billing === 'annual' ? '年付' : '月付'}`).join('；');
}
function productDetail(product: Product): string {
  const plans = product.plans.length ? table(['套餐', '金额与周期', '所含额度 / 限制'], product.plans.map(plan => [
    plan.name, `${plan.currency} ${plan.amount} / ${plan.billing === 'annual' ? '年付' : '月付'}`, plan.quota || '以官方计划为准'
  ])) : '**价格：未录入可确认的数值。**';
  return `### ${product.name}\n\n${product.aliases.length ? `别名：${product.aliases.join(' / ')}。\n\n` : ''}` +
    `**性质：** ${kindNames[product.kind]}。 **核验：** ${product.verification === 'partial' ? '信息不完整，待补核' : '已核对公开页面，未进行功能实测'}。\n\n` +
    `**功能：** ${product.features.join('；')}。\n\n**涉及模型：** ${product.models.join('、') || '当前具体版本未核验'}。\n\n` +
    `**选型建议（编辑判断）：** ${product.selection}。\n\n**注意：** ${product.caution}\n\n` +
    `${plans}\n\n${product.priceNote}\n\n来源：${sourceLinks(product.sourceIds)}\n`;
}
function catalogueContent(products: Product[]): string {
  return `> 这里是分场景清单，不是性能或热度总排名。分类可以重叠，同一产品在主数据中只保存一次。\n\n` +
    table(['产品', '性质', '所选套餐价格', '核验范围'], products.map(product => [product.name, kindNames[product.kind], priceText(product), product.verification === 'partial' ? '待补核' : '公开页面'])) +
    '\n\n## 产品详情与差异\n\n' + products.map(productDetail).join('\n');
}
const partialCount = research.products.filter(product => product.verification === 'partial').length;
const agentProducts = research.products.filter(product => product.categories.includes('agent'));
const scoreCount = research.benchmarks.reduce((total, benchmark) => total + benchmark.rows.length, 0);
const sections: Section[] = [section('overview', research.title, research.subtitle, 'guide', '阅读指南', `
## 模型、SaaS 与 Agent 是三件不同的事

模型提供生成和推理能力；SaaS 把能力组织为可以使用的产品；Agent 将目标、模型、工具和执行反馈组合成任务流程。购买应用会员不等于获得该厂商的 API 额度。

## 本次数据范围

${table(['内容', '收录量', '口径'], [
  ['产品与基础设施', research.products.length, `其中 ${partialCount} 项信息不完整，已标注待补核`],
  ['Agent 产品及构建平台', agentProducts.length, '与产品目录有重叠，不重复计算为新增产品'],
  ['基准成绩', scoreCount, '三个独立来源/版本，不能拼接为总排名'],
  ['模型 API 价格', research.modelApiPrices.length, '官方可读取价格条目，非全厂商完整价格表']
])}

> 本次核验日期：${research.checkedAt}（${research.timezone}）。核验日期不等于榜单数据日期，也不证明网站动态内容已经刷新至当天。

${research.coverage}

## 如何读榜单

${research.rankingPolicy}

Arena 展示人类偏好；Artificial Analysis 文章展示综合评测的部分成绩；Terminal-Bench 2.0 展示指定 Agent 与模型配置的历史终端任务成绩。产品清单没有虚构的“综合评分”。详见各榜单所附官方来源。

## 价格与国家字段

${research.pricingPolicy}

${research.countryPolicy}

## 建议的选择顺序

先明确交付物，再检查现有软件和权限能否接入，之后用同一组真实任务比较质量、人工返工、总成本和失败恢复。对于对外发布、删除、付款等动作，保留人工审核。
`, [
  { label: '产品目录', desc: `${research.products.length} 个唯一条目；${partialCount} 项待补核` },
  { label: '榜单口径', desc: '人类偏好、综合评测、终端任务分开阅读' },
  { label: '数据日期', desc: '核验日期不等于快照日期，不将历史榜单称为今日实时榜' }
], ['AI SaaS', '大模型', 'Agent', '价格', '选型'])];

for (const category of research.categories.filter(category => category.id !== 'agent')) {
  const products = research.products.filter(product => product.categories.includes(category.id));
  sections.push(section(`catalog-${category.id}`, category.title, '功能、涉及模型、所选套餐、差异与来源', 'saas', 'AI SaaS 与工具',
    catalogueContent(products), [
      { label: '收录范围', desc: `${products.length} 个相关条目，分类可以重叠` },
      { label: '代表条目', desc: products.slice(0, 4).map(product => product.name).join('、') },
      { label: '比较方法', desc: '先比较任务、工作流和交付格式，再核对所需套餐与额度' },
      { label: '证据范围', desc: '价格或功能未完整核实的条目均明确标注' }
    ], products.flatMap(product => [product.name, ...product.aliases, ...product.models])));
}

for (const benchmark of research.benchmarks) {
  // JSON rows intentionally differ by benchmark; keep metrics and source order intact.
  const rows = benchmark.rows;
  const isAgent = benchmark.scope === 'agent';
  const contents = isAgent
    ? table(['来源序位', 'Agent', '模型 / 配置', '准确率', '来源 ± 值', '提交日期'], rows.map(row => [row.rank, row.name, 'model' in row ? row.model : '', row.score, 'uncertainty' in row ? row.uncertainty : '', 'submittedAt' in row ? row.submittedAt : '']))
    : benchmark.rankType === 'unranked-excerpt'
      ? table(['模型与配置', '已披露成绩'], rows.map(row => [row.name, row.score]))
      : table(['来源序位', '模型', '供应方', '分数', '来源 ± 值', '票数', '初步结果'], rows.map(row => [row.rank, row.name, 'provider' in row ? row.provider : '', row.score, 'uncertainty' in row ? row.uncertainty : '', 'votes' in row ? row.votes : '', 'preliminary' in row && row.preliminary ? '是' : '否']));
  sections.push(section(benchmark.id, benchmark.title, benchmark.warning, isAgent ? 'agents' : 'models', isAgent ? 'Agent 榜单与选型' : '大模型榜单与价格', `
## 范围与日期

> ${benchmark.warning}

指标：${benchmark.metric}；单位：${benchmark.unit}。快照日期：${benchmark.snapshotDate ?? '源站未提供统一日期，请查看逐条提交日期'}。读取核验：${research.checkedAt}。

## 来源成绩

${contents}

## 解释边界

“±”保持来源展示数值，不自行更改为标准差或另一个置信水平。不同榜单的分数没有共同量纲，不能平均。排行榜中的模型变体与推理配置也不能当作同一型号合并。

${isAgent ? '历史提交中的模型、脚手架和运行预算会影响结果；不由此推断产品订阅价值、当前版本表现、市场份额或人气。' : '榜单中未出现某个模型不表示该模型不存在、已经下线或性能较差。此处仅展示所声明的可核验快照范围。'}

来源：${sourceLinks([benchmark.sourceId])}
`, [
  { label: '指标', desc: `${benchmark.metric}（${benchmark.unit}）` },
  { label: '范围', desc: `${rows.length} 条记录；${benchmark.rankType === 'unranked-excerpt' ? '部分成绩，不编造名次' : '保持来源顺序'}` },
  { label: '快照日期', desc: benchmark.snapshotDate ?? '逐条提交日期见正文' },
  { label: '限制', desc: benchmark.warning }
], ['榜单', benchmark.metric, ...rows.map(row => row.name)]));
}

sections.push(section('model-api-prices', '大模型 API 价格', '统一计价单位，区分上下文、缓存与应用订阅', 'models', '大模型榜单与价格', `
## 计价口径

单位：USD / 100 万 token。输入、输出与缓存读取分别定价。这里不是 ChatGPT、Claude 等应用的月费表，也不是所有供应商的完整价格表。

${table(['模型', '供应方', '输入', '输出', '缓存读取', '适用条件'], research.modelApiPrices.map(price => [price.name, price.provider, price.input, price.output, price.cacheRead, price.conditions]))}

## 如何估算成本

未缓存输入成本 = 未缓存输入 token 数 ÷ 1,000,000 × 输入价。输出和缓存读取按各自数量、单价分别计算；不要把缓存 token 同时算入未缓存输入。缓存写入、额外工具、长上下文、快速或批处理模式不包含在这个简化计算中。

## 每条价格的来源

${research.modelApiPrices.map(price => `### ${price.name}\n\n${price.conditions}\n\n核验：${price.checkedAt}。来源：${sourceLinks([price.sourceId])}`).join('\n\n')}

## 未覆盖范围

Qwen、Kimi、DeepSeek、GLM、MiniMax 等当前具体型号及地区定价未完成本轮逐项核验，因此不填 0、不沿用旧型号报价。采购时核对最终结算页。
`, [
  { label: '单位', desc: 'USD / 100 万 token，不是应用会员月费' },
  { label: '本次收录', desc: `${research.modelApiPrices.length} 条公开 API 报价` },
  { label: '成本结构', desc: '输入、输出、缓存、上下文与工具用量分别计算' }
], ['价格', 'API', 'OpenAI', 'Anthropic', ...research.modelApiPrices.map(price => price.name)]));

sections.push(section('agent-products', 'Agent 产品与构建平台选型', '编程、研究、创作与业务自动化分开比较', 'agents', 'Agent 榜单与选型', `
## 先分清产品和构建平台

成品 Agent 侧重完成任务；Dify、n8n 等构建平台侧重让团队配置模型、工具和工作流。两类不能用一个产品热度序号替代功能和部署比较。

## 选型清单（不是热度排名）

${catalogueContent(agentProducts)}

## 实际使用检查

用真实任务验证权限范围、引用可追溯性、代码测试、失败后的恢复方式和费用上限。需要操作外部系统时，先区分只读、草稿、写入和公开发布，不能因为有工具接入就默认授权所有操作。
`, [
  { label: '选型条目', desc: `${agentProducts.length} 个产品或构建平台，与总目录共用数据` },
  { label: '编程', desc: 'IDE 协作、云端委派和应用生成是不同工作方式' },
  { label: '自动化', desc: '构建平台要另外评估模型费、维护与权限管理' },
  { label: '不要混淆', desc: '基准成绩不是市场热度；框架也不是即用产品' }
], ['Agent', 'Claude Code', 'Codex', 'Cursor', 'Manus', 'Dify', 'n8n']));

sections.push(section('sources-and-gaps', '来源、待核验项与更新方法', '每条记录可回查，缺失不隐藏', 'guide', '阅读指南', `
## 核验说明

本次共保存 ${research.sources.length} 个来源入口；入口数量不是成功核验数量。read 表示读到相关公开文字，partial 表示内容不完整，snapshot 表示有版本或日期的快照，unavailable 表示本次未读到有效正文。所有条目均未作账号内功能实测。

${research.coverage}

${research.countryPolicy}

## 来源目录

${research.sources.map(source => `### ${source.id} · ${source.title}\n\n[打开官方来源](${source.url})\n\n状态：${source.access}；本次检查：${source.checkedAt}；源页日期：${source.sourceDate ?? '未明确公布'}。${source.note}`).join('\n\n')}

## 产品待补核

${table(['产品', '待核实内容'], research.products.filter(product => product.verification === 'partial').map(product => [product.name, `${product.caution} ${product.priceNote}`]))}

## 其他缺口

${table(['项目', '说明'], research.pendingItems.map(item => [item.name, item.reason]))}

## 如何更新

只编辑 src/data/ai-research.json。正文、导航和搜索从该文件派生，不分别维护多份数值。每次修改保留来源、日期、币种、计价周期与基准版本；来源无法核实就保留缺失标记。运行 npm run test:data 检查数据，再运行 npm run lint 与 npm run build 检查应用。
`, [
  { label: '来源', desc: `${research.sources.length} 个官方/基准机构入口，状态逐一记录` },
  { label: '缺口', desc: '未读到动态页面时不补猜测价格；国家字段未逐项核验' },
  { label: '维护', desc: '一个 JSON 数据源，正文、导航与搜索同步派生' }
], ['来源', '核验', '缺失', '更新', '价格']));

export const DOC_CHAPTERS: DocChapter[] = sections.map(({ brief: _brief, ...chapter }) => chapter);
