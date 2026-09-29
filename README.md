# NextCHINA · AI 知识工作区

面向普通读者、开发者与研究者的中文 AI 知识库。首页是一张宏观知识地图，左侧目录选择文档，主区域单篇阅读。地图、知识点和文档是同一工作区的不同入口，不是互相分离的网站。目标是连接 AI 原理、数据、模型、系统、实践、评测、产业与社会影响；知识提纲不等于全部内容已经写完。

项目保持纯静态：GitHub 保存 MD/JSON，React/Vite 装配和渲染，GitHub Actions 验证与构建，Wrangler 发布至 Cloudflare Workers Static Assets。不使用 MDX，不引入数据库、CMS 服务端或运行时内容 API。

## 工作区使用

打开网站直接进入唯一的宏观知识地图。地图复用知识数据中的六个区域：建立全景、数学/数据与学习、模型/算法与模态、系统/Agent 与工程、评测/产品与实践、应用/治理与前沿。

点击领域或专题，只选择知识对象，不重建另一张密集图。详情展示下级知识、建议先学、相关知识、专题引用及被复用、阅读资料与学习路径。搜索可直接到达概念节点；跨区连线与区域“查看关联”入口可追溯原始关系两端和说明。

地图按可用宽度呈现三列、两列或单列。手机使用正常滚动阅读，不要求拖拽画布或缩放文字。桌面详情区保持固定占位；窄屏详情采用可关闭的焦点约束面板。

所有现有文档仍可从侧栏文件树或全文搜索打开。没有 titlebar，也没有多文档标签页；LLM 等专题仍可逐层展开。侧栏可以折叠所有目录、定位当前文档、显示待完善大纲。Ctrl/Cmd+K 搜索，Ctrl/Cmd+反斜杠切换侧栏。

从知识点打开资料后，阅读器提供“返回知识地图”入口并保留原节点。继续阅读、浏览器后退/前进和刷新不把节点信息变成临时局部状态。文档模式可另开“关联资料”查看收录位置与正文链接；地图模式使用自己的知识详情，不再叠加另一份资料侧栏。

节点和文章数量由事实源及构建产物统计，不在本说明重复维护。现行契约见 [宏观知识地图设计](docs/macro-knowledge-map-redesign.md) 和 [统一工作区 UX](docs/unified-workspace-ux.md)；内容路线见 [知识库规划](docs/ai-knowledge-roadmap.md)。早期文档中的多标签和局部图交互不再作为现行需求。

## 内容事实源

- `content/articles.json`：Markdown 元数据及独立知识单元的概念、分支、来源绑定。
- `content/spaces.json`：公开页面集合和原始顺序，旧链接保持兼容。
- `content/models/**/*.md`：模型原理和独立知识正文。
- `content/tutorials/video/apple-style-premium-product-video.md`：视频制作教程，同一文章可以从视频专题引用。
- `content/data/products/*.json`：产品事实；`benchmarks.json`、`model-api-prices.json`、`sources.json`：评测、报价与来源。
- `content/garden/blueprint.json`：知识覆盖框架；`plans/topic-hubs-v2.json` 与 `hub-integration.json`：递归分支和资源放置。
- `src/data/essays.ts` 装配 MD；`generated-docs.ts` 从 JSON 派生正文；`docs.ts` 转义美元价格。

`src/generated/` 和 `public/garden-generated/` 是开发/构建前生成的产物，不提交、不手改。首页通过 `buildKnowledgeIndex` 使用生成的同一份知识数据，不需要 React Flow 或布局 Worker。旧画布模块及 ELK 同源 Worker 生成脚本尚保留，不能将首页迁移误写为它们已经全部删除。

## 关系与证据规则

目录归属、知识关联、建议先学、专题引用、学习路径分别表达。路径顺序不自动生成先修边；汇总连线不升级为领域因果。每条原始语义边必须在内部关系或跨区关系包中恰好出现一次，两端均可探索。

阅读资料分为直接绑定、通过专题引用、下级资料。只有本节点直接绑定的独立讲解才计为本节点独立讲解资料。没有用同一篇总览填充所有空分支。

目录和 UI 调整不会刷新事实核验日期。Arena、Artificial Analysis、Terminal-Bench 各自保留版本、任务与口径，不拼成混合总榜。Agent 成绩不当作裸模型能力；模型名称相似不证明版本相同。

报价保留币种、周期、地区与适用条件。API 输入/输出/缓存计费与应用订阅分开。未知值不猜测，空 plans 不等于免费，页面能构建不等于内容已在线核验。独立讲解样例程序通过不等于专家复核或商业模型实测。

## 安装、验证与部署

本地使用 Node 24、Python 3 和仓库锁文件：

```sh
npm ci --no-audit --no-fund
npm run build
npx playwright install --with-deps chromium
npm run test:browser
npm run test:production
```

`npm run dev` 自动准备知识数据；构建包含数据、花园、专题、知识样例、Markdown 渲染、TypeScript 与 Vite 校验。浏览器回归覆盖实际工作区、所有文档以及地图的关系完整性、响应式、选中状态、阅读返回与键盘交互。生产测试访问实际 dist 产物。Chromium 自动验收不等价于真实 iOS Safari 验收。

正文采用 CommonMark + GFM + KaTeX 数学 + Mermaid；HTML/JSX 不作为可执行正文。无阴影外观保留必要 HTML 语义。见 [Markdown规范](docs/markdown-rendering.md) 与 [图示规范](docs/diagram-rendering.md)。

生产链：push main → npm ci → 数据/代码构建 → 浏览器回归 → 生产产物验证 → Wrangler 直传。

GitHub Actions secrets 为 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`，不写入仓库。关闭旧 Cloudflare Git 自动构建，避免双重部署。`wrangler.jsonc` 指向 `./dist`。本地已完成认证可执行 `npm run deploy`，正式发布前应完成浏览器验收。
