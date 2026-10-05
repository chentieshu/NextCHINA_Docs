# AI 知识花园：事实源与内容清单

本目录已接入生产 React 工作区。现行首页使用完整的单一知识网络和只读 SVG 点线引擎；原 602 节点范围完整保留，并发主线新增 27 个概念后，模型共 630 个节点（407 个概念），`normalizeNetwork` 得到 629 个候选。2026-10-05 第五批工作树默认地图准入为 189，另 440 个候选仍保留在模型和清单中；显式选择与用户筛选可改变实际显示。`root:ai` 不进入地图候选，不能把候选数称为默认可见数。React Flow/ELK 的历史模块仍在仓库，不代表当前首页依赖它们。现行交互见 [数字花园设计](../../docs/obsidian-digital-garden.md)，早期设计不作为上线状态证明。

## 事实源

- `blueprint.json`：14 个领域、77 个主题、407 个规范概念、编辑关联、建议先学、学习路径及已有资源绑定
- `master-outline.json`：学习阶段、规范知识复用与知识单元完成契约
- `plans/topic-hubs-v2.json` 与 `hub-integration.json`：18 个专题和 113 个实际分支的结构、引用及资料放置；目录不等于独立正文
- `microscopes/attention-3x2.json`：可验证的人工教学计算输入与约束，不是商业模型实测或已经完成的交互模拟器
- `../articles.json` 的 `knowledgeUnit`：独立知识单元的规范概念、已有分支、来源 URL、例子及审查状态；正文仍在原 MD
- [分批 CSV 清单](../../docs/content-inventory/README.md)：18 个已跟踪小文件，记录全部 630 个节点的身份、类型、批次、直接文章、独立覆盖和默认准入，不手改
- `content-inventory.json`：忽略的可复现完整审计产物，保留来源定位、全部类型化边与覆盖细节；安装/构建自动重建。审计定义见 [内容整理计划](../../docs/content-organization-plan.md)

所有概念只定义一次。文章在不同专题出现时复用同一 articleId；产品价格、榜单与其他易变事实仍由 `content/data/**` 管理，不复制进节点。正文日期、来源访问日期和榜单快照日期分别保留。

## 生成与验证

```sh
# 原始知识结构、教学例子、专题和独立单元验证
node scripts/validate-garden.mjs
node scripts/test-garden.mjs
npm run test:hubs
npm run test:knowledge

# 全部 630 个模型节点（629 个地图候选；当前 189 个默认准入）的可复现审计
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

这些检查分别验证结构、确定性、教学计算与构建。它们不等于线上来源事实复核、独立专家评审或逐页浏览器验收；浏览器回归另用 `npm run test:browser` 和 `npm run test:production`。

schema v2 清单同时保留原 603 个模型 ID、并发新增范围和全部原始边元数据。目录、references、represents、related、类型化语义边以及全局/routeId 局部建议顺序分别统计；15 条语义边中 9 条补充带适用范围的原始来源，6 条因主张/谓词/对象边界仍待澄清，保持未补证据；详见 [逐条证据审阅](../../docs/semantic-edge-evidence.md)。来源字段不把 editorial 升级为专家认可。清单把直接、显式引用、下级和祖先背景资源分开。一个总览链接不表示所有子概念已有独立解释，独立单元绑定也不会自动把 `needs-independent-review` 改为完成。节点不保存坐标或选中状态，布局不增加科学关系。
