# AI 知识花园：事实源与内容清单

本目录已接入生产 React 工作区。现行首页使用完整的单一知识网络和只读 SVG 点线引擎；原 602 节点范围完整保留，并发主线新增 27 个概念，内容组织先后补 metrics、naive-bayes、ai-ml-dl、learning-signals、floating-point、mutual-information 与 complexity 七个导航叶；模型共 637 个节点（407 个概念、120 个分支），`normalizeNetwork` 得到 636 个候选。2026-10-05 第十二批工作树默认地图准入为 209，另 427 个候选仍保留在模型和清单中；显式选择与用户筛选可改变实际显示。`root:ai` 不进入地图候选，不能把候选数称为默认可见数。React Flow/ELK 的历史模块仍在仓库，不代表当前首页依赖它们。现行交互见 [数字花园设计](../../docs/obsidian-digital-garden.md)，早期设计不作为上线状态证明。

第十二批新增 `algorithm-complexity-cost-model` 与 `mutual-information` 两篇独立基础课，只绑定既有复杂度与互信息概念，并在原 LLM math 下各加一个最小叶。当前 41 个页面（26 篇 MD、15 个生成页面），18 篇独立单元覆盖 49/407 个概念，缺口 358；137 个节点有直接资料，其中 82 个概念。只新增两个目录边、两条 references 及一条有范围和理由的 KL → 互信息阅读建议，不更改规范归属或语义边，不为两篇课创造相互依赖。893 条边分为 636 目录、37 全局建议、57 路径局部建议、85 references，其他类型不变。

机械检查分别计 16 个实际 Python 执行与 2 个观察案例家族结构／链接检查，不是 18 次执行，也不是把两组虚构 A–F 当作十二次实验。14 个旧例及内联后缀、两个案例检查器和可见性保护均保留；新后缀由显式文件登记载入，缺失／重复／内联 ID 冲突等 29 个负例单列。原 77 个示例契约负例、16 个首组可见性负例和 5 个元数据负例保留；学习信号契约负例由 227 增至 229，其中新增两个数值登记降级拒绝检查。复杂度用独立秩／树深核对精确次数；互信息用独立高精度熵恒等式核对有界质量表，精确独立判据与近零浮点结果分开。独立来源与教学逻辑审阅不等于专家认证或教学效果实测；全部单元保留 `needs-independent-review`，专家复核完成仍为 0。导航入口、资料和实质绑定分别计数。

历史快照保留：第七批 `63a1634` 为 13 篇／39 概念／194 准入；第八批 `5946972` 为 36 页面（21 MD + 15 生成）、13 篇／41 概念／366 缺口、124 个直接资料节点（74 概念）、632 模型／631 候选／196 准入、407 概念／115 分支。第八批 878 条边为 631 目录、35 全局建议、57 路径局部建议、77 references，其他边类型不变；第九批 `f8acc884` 为 37 页面（22 MD + 15 生成）、14 篇／44 概念／363 缺口、128 个直接资料节点（77 概念）、633 模型／632 候选／200 准入、407 概念／116 分支；882 条边为 632 目录、35 全局建议、57 路径局部建议、80 references。第九批知识检查为 13 个 Python 执行和 1 个案例家族结构／链接检查。第十批 `30b86e28` 为 38 页面（23 MD + 15 生成）、15 篇／46 概念／361 缺口、131 个直接资料节点（79 概念）、634 模型／633 候选／203 准入、407 概念／117 分支；885 条边为 633 目录、35 全局建议、57 路径局部建议、82 references，知识检查为 13 个 Python 执行和 2 个案例家族检查。第十一批 `a44faff9` 为 39 页面（24 MD + 15 生成）、16 篇／47 概念／360 缺口、133 个直接资料节点（80 概念）、635 模型／634 候选／205 准入、407 概念／118 分支；888 条边为 634 目录、36 全局建议、57 路径局部建议、83 references，知识检查为 14 个 Python 执行和 2 个案例家族检查。这些历史计数不随后续批次改写，详见内容整理计划。

## 事实源

- `blueprint.json`：14 个领域、77 个主题、407 个规范概念、编辑关联、建议先学、学习路径及已有资源绑定
- `master-outline.json`：学习阶段、规范知识复用与知识单元完成契约
- `plans/topic-hubs-v2.json` 与 `hub-integration.json`：18 个专题和 120 个实际分支的结构、引用及资料放置；目录不等于独立正文
- `microscopes/attention-3x2.json`：可验证的人工教学计算输入与约束，不是商业模型实测或已经完成的交互模拟器
- `../articles.json` 的 `knowledgeUnit`：独立知识单元的规范概念、已有分支、来源 URL、例子及审查状态；正文仍在原 MD
- [分批 CSV 清单](../../docs/content-inventory/README.md)：18 个已跟踪小文件，记录全部 637 个节点的身份、类型、批次、直接文章、独立覆盖和默认准入，不手改
- `content-inventory.json`：忽略的可复现完整审计产物，保留来源定位、全部类型化边与覆盖细节；安装/构建自动重建。审计定义见 [内容整理计划](../../docs/content-organization-plan.md)

所有概念只定义一次。文章在不同专题出现时复用同一 articleId；产品价格、榜单与其他易变事实仍由 `content/data/**` 管理，不复制进节点。正文日期、来源访问日期和榜单快照日期分别保留。

## 生成与验证

```sh
# 原始知识结构、教学例子、专题和独立单元验证
node scripts/validate-garden.mjs
node scripts/test-garden.mjs
npm run test:hubs
npm run test:knowledge

# 全部 637 个模型节点（636 个地图候选；当前 209 个默认准入）的可复现审计
node scripts/audit-node-content.mjs --write
# 仅重建忽略的 JSON，检查已跟踪 CSV 和索引
node scripts/audit-node-content.mjs --prepare
node scripts/audit-node-content.mjs --check
node scripts/audit-node-content.mjs --self-test
# npm 别名：生成清单 / 确定性与过期检查
npm run audit:content
npm run test:content

# 完整生产图与全仓验证/构建
node scripts/prepare-garden.mjs
npm run validate
npm run build
```

`--write --as-of YYYY-MM-DD` 显式改变审计基准日并刷新 JSON、CSV 与索引。`--check` 默认只读，任何清单缺失或过期时失败。prepare/prebuild 会自动重建忽略的完整 JSON，并核对已跟踪 CSV/索引，不会默默重写它们；干净检出后 npm ci 会通过 prepare 生成测试所需 JSON。`prepare-garden` 生成 `src/generated/garden.json`，生产页面直接使用完整图数据，不使用原型子集。需要不含专题覆盖层的基础 renderer-independent 数据，可运行 `node scripts/validate-garden.mjs --emit /tmp/nextchina-garden.json`。

这些检查分别验证结构、确定性、教学计算、观察案例结构／链接与构建。它们不等于线上来源事实复核、独立专家评审或逐页浏览器验收；浏览器回归另用 `npm run test:browser` 和 `npm run test:production`。

schema v2 清单同时保留原 603 个模型 ID、并发新增范围和全部原始边元数据。目录、references、represents、related、类型化语义边以及全局/routeId 局部建议顺序分别统计；15 条语义边中 9 条补充带适用范围的原始来源，6 条因主张/谓词/对象边界仍待澄清，保持未补证据；详见 [逐条证据审阅](../../docs/semantic-edge-evidence.md)。来源字段不把 editorial 升级为专家认可。清单把直接、显式引用、下级和祖先背景资源分开。一个总览链接不表示所有子概念已有独立解释，独立单元绑定也不会自动把 `needs-independent-review` 改为完成。节点不保存坐标或选中状态，布局不增加科学关系。

部署工作流 20 分钟作业时限的容量风险继续保留，详见 [实测与限制](../../docs/content-organization-plan.md#待评审部署工作流的运行时限余量)。本批未修改 CI／部署配置、未执行部署，工作树统计不表示上线。
