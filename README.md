# NextCHINA · AI 数字花园

面向普通读者、开发者与研究者的中文 AI 知识工作区。首页是 Obsidian 风格的全局点线知识网络，左侧文件树选择文档，主区域单篇阅读。无卡片式分区、无应用 titlebar、无多文档标签。知识提纲不等于所有内容已经完成。

现行交互契约见 [数字花园设计](docs/obsidian-digital-garden.md)。早期六区卡片、多标签和局部图设计不再作为现行需求。

## 使用

文件夹点击只展开、收起；点击文档才切换到阅读器。Ctrl/Cmd+K 打开侧栏全文搜索，Ctrl/Cmd+反斜杠切换侧栏。侧栏保留折叠所有目录、定位当前文档和显示待完善大纲。

点线图支持鼠标拖动、滚轮/双指缩放、搜索定位、方向键平移、加减号缩放和 0 显示全图。点击节点打开按需知识笔记，显示原始关系及阅读入口；默认不占用右侧说明栏。原有主题偏好被保留，未设置时默认暗色。

节点位置不会因选择、缩放或筛选重新计算。知识笔记与资料仍复用规范节点 ID 和文章 ID。文章打开后可返回原节点；URL 保留选择，支持刷新和浏览器历史。

## 架构与内容事实源

保持纯静态架构：GitHub MD/JSON → 生成与校验 → React/Vite → Cloudflare Workers Static Assets。不引入数据库、CMS 服务端、运行时内容 API 或 MDX。

- content/articles.json：文章注册及独立知识单元绑定；content/spaces.json：公开阅读页面。
- content/models/**/*.md 与 content/tutorials/**/*.md：正文。
- content/data/products/*.json、benchmarks.json、model-api-prices.json、sources.json：产品、评测、报价及来源。
- content/garden/blueprint.json：规范知识框架；master-outline.json：学习大纲；plans/topic-hubs-v2.json 与 hub-integration.json：专题和资料放置。
- src/generated/garden.json：构建产物，不手改。点线引擎直接读取完整数据，不使用原型子集。

每个概念只定义一次，文章可以在多个专题出现引用入口，但正文不复制。目录归属、知识关联、建议先学、专题引用和学习路径分别表达；布局不添加语义边。直接资料、引用资料、下级资料分开，不以总览填满独立讲解缺口。

## 内容整理与持续完善

“602 个节点”对应 2026-10-05 初始基线：603 个模型节点排除根节点，其中有 380 个规范概念。此后上游扩展了概念并启用图谱准入规则，完整模型、图谱候选与默认显示需要分别计数；节点数也不等于独立讲解篇数。最新统计、逐节点绑定、地图准入和待办批次见 [逐批内容清单](docs/content-inventory/README.md)，范围、质量门槛与后续顺序见 [内容整理计划](docs/content-organization-plan.md)。

2026-10-05 第六批工作树快照：12 篇独立单元显式绑定 37/407 个概念，370 个仍缺独立绑定；631 个模型节点、630 个地图候选、192 个默认准入。本批新增分类指标单元，讲准确率、精确率、召回率、F1、阈值、基础比例及宏微平均；为独立放置新增一个 metrics 导航叶，407 个规范概念不变，导航新增不计解释覆盖。15 条类型化语义关系仍为 9 条有限定来源、6 条待澄清，详见 [语义关系证据](docs/semantic-edge-evidence.md)。前五批提交 `8522fd99`、`b59d3836`、`239102b7`、`b8cf039e`、`6e821a80` 保留为历史锚点；当前进展不代表部署或独立专家复核。

修改正文、注册表或知识结构后，运行 `npm run audit:content` 更新可审阅的逐批 CSV，再运行 `npm run build`。完整来源、关系和覆盖明细会在准备构建时生成到 `content/garden/content-inventory.json`，不作为重复的大文件提交。构建中的 `test:content` 会检查全量 ID、批次覆盖、可复现性和清单是否过期；这些机械检查不替代概念审阅或实时来源核验。

旧画布模块和 ELK 同源 Worker 生成脚本仍保留，新首页不再依赖它们。正文仍采用 CommonMark + GFM + KaTeX + Mermaid，HTML/JSX 不作为可执行正文。见 [Markdown 规范](docs/markdown-rendering.md) 和 [图示规范](docs/diagram-rendering.md)。

## 验证与部署

使用 Node 24、Python 3 和仓库锁文件：

```sh
npm ci --no-audit --no-fund
npm run build
npx playwright install --with-deps chromium
npm run test:browser
npm run test:production
```

构建包含既有数据、花园、专题、知识样例、Markdown、TypeScript 和 Vite 检查。浏览器回归验证实际阅读器和完整图谱，不用原型测试代替集成测试。生产测试访问 dist 产物；Chromium 回归不等于 iOS Safari 真机验收。

生产链保留：push main → 安装 → 构建 → 浏览器回归 → 生产产物验证 → Wrangler。分支提交或 PR 更新不等于线上发布。wrangler.jsonc 指向 dist；CLOUDFLARE_ACCOUNT_ID 与 CLOUDFLARE_API_TOKEN 仍保存在 Actions secrets，不写入代码。

界面重构不重新核验或改写榜单、价格、模型事实与证据日期。未知数据不猜测，Agent 系统成绩不当作裸模型能力排名；样例程序或构建通过不等于专家复核。
