# NextCHINA · AI 知识工作区

面向普通读者、开发者与研究者的中文综合 AI 知识库。左侧目录选择文档，主区域阅读或查看关系图；文档与数字花园是同一工作区，不再是两套独立页面。目标是连接 AI 原理、数据、模型、系统、实践、评测、产业与社会影响，目前并非全部维度都已完成。

项目保持纯静态：GitHub 保存 MD/JSON，React/Vite 装配和渲染，GitHub Actions 验证与构建，Wrangler 发布至 Cloudflare Workers Static Assets。不使用 MDX，不引入数据库、CMS 服务端或运行时内容 API。

## 工作区使用

打开网站直接进入阅读指南。所有现有文档从左侧文件树选择。LLM 等专题是文件夹，继续展开到数学、内部计算、训练、推理、榜单、价格、产品与教程。分支引用的同一文档不会复制正文。

顶部标签支持多篇文档切换、关闭、会话内恢复；全库搜索就在侧栏。Ctrl/Cmd+K 搜索，Ctrl/Cmd+反斜杠切换侧栏。侧栏可折叠所有目录或定位当前文档。未写分支默认隐藏，可以显示完整待完善大纲。

关系图是主区域中的另一种视图。点击文档节点仍在同一个工作区阅读。右侧可选“关联资料”显示收录位置与已识别的文档链接，不是本文标题目录。移动端使用覆盖式侧栏，选择文档后关闭，不推移页面。

当前 28 篇阅读页面包含 13 篇 Markdown 与 15 篇 JSON 派生文档。14 领域、77 专题、380 概念为覆盖框架，18 个专题中心承接已有资料；框架节点不等于完成文章。内容路线见 [知识库规划](docs/ai-knowledge-roadmap.md)，当前 UX 见 [统一工作区](docs/unified-workspace-ux.md)。此前花园/专题实施文档保留作历史说明，以新 UX 契约为准。

## 内容事实源

- `content/articles.json`：Markdown 元数据及独立知识单元的概念、分支、来源绑定。
- `content/spaces.json`：公开页面集合和原始顺序，旧链接保持兼容。
- `content/models/**/*.md`：模型原理和独立知识正文。
- `content/tutorials/video/apple-style-premium-product-video.md`：教程中的视频制作方法，同一文章可以从视频专题引用。
- `content/data/products/*.json`：产品事实；`benchmarks.json`、`model-api-prices.json`、`sources.json`：评测、报价与来源。
- `content/garden/blueprint.json`：知识覆盖框架；`plans/topic-hubs-v2.json` 与 `hub-integration.json`：递归分支和资源放置。
- `src/data/essays.ts` 装配 MD；`generated-docs.ts` 从 JSON 派生正文；`docs.ts` 转义美元价格。

`src/generated/` 和 `public/garden-generated/` 是开发/构建前生成的产物，不提交、不手改。ELK 官方 Worker 从锁定依赖复制为带内容摘要的同源资源。文档阅读不需要加载 React Flow。

## 证据规则

目录和 UI 调整不会刷新事实核验日期。Arena、Artificial Analysis、Terminal-Bench 各自保留版本、任务与口径，不拼成混合总榜。Agent 成绩不当作裸模型能力；模型名称相似不证明版本相同。

报价保留币种、周期、地区与适用条件。API 输入/输出/缓存计费与应用订阅分开。未知值不猜测，空 plans 不等于免费，页面能构建不等于内容已在线核验。

图上的收录关系、编辑关联与正文链接不是因果主张。五篇独立 LLM 讲解的 Python 样例可在构建中验证，但程序通过不等于专家复核或商业模型实测。

## 安装、验证与部署

本地使用 Node 24、Python 3 和仓库锁文件：

```sh
npm ci --no-audit --no-fund
npm run build
npx playwright install --with-deps chromium
npm run test:browser
npm run test:production
```

`npm run dev` 自动准备知识数据；构建包含数据、花园、专题、知识样例、真实 Markdown 渲染、TypeScript 与 Vite。浏览器测试包含实际工作区、所有文档、图示和控件；生产测试访问 dist 与同源布局 Worker。测试夹具不属于公开文章。Chromium 自动验收不等价于真实 iOS Safari 验收。

正文采用 CommonMark + GFM + KaTeX 数学 + Mermaid；HTML/JSX 不作为可执行正文。无阴影外观保留必要的 HTML 语义。见 [Markdown规范](docs/markdown-rendering.md) 与 [图示规范](docs/diagram-rendering.md)。

生产链：push main → npm ci → 数据/代码构建 → 浏览器回归 → 生产产物验证 → Wrangler 直传。

GitHub Actions secrets 为 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`，不写入仓库。关闭旧 Cloudflare Git 自动构建，避免双重部署。`wrangler.jsonc` 指向 `./dist`。本地已完成认证可执行 `npm run deploy`，正式发布前应完成浏览器验收。
