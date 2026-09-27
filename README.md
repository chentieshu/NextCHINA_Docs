# NextCHINA · AI 到哪了？

面向普通读者、开发者与研究者的中文综合 AI 知识库。目标是连接 AI 原理、数据、模型、系统、实践、评测、产业与社会影响；目前并非全部维度都已完成。库存与内容路线见 [知识库规划](docs/ai-knowledge-roadmap.md)。

项目保持纯静态：GitHub 保存 MD/JSON，React/Vite 装配和渲染，GitHub Actions 验证与构建，Wrangler 发布至 Cloudflare Workers Static Assets。不使用 MDX，不引入数据库、CMS 服务端或运行时内容 API。

## 两条阅读入口

首页保留 **进入文档**，并提供平行的 **探索知识花园**。

文档：Sidebar 切换空间，再按小分类阅读；上下篇和文档搜索仍限定当前空间。现有空间为 Models、AI Products、Agents、Research、教程。

花园：全景 → 领域 → 专题 → 概念详情 → 相关文章 → 返回原图谱位置。支持 React Flow 图谱和同源列表、一跳关联、全库概念/文章搜索、URL 分享和浏览器历史。手机默认列表，可切到局部图谱。原文章不会被强制改成画布卡片。

花园当前包含14个领域、77个专题、380个概念与23个阅读页面映射。472个框架节点不是472篇完成文章；待完善和未核验状态明确保留。学习路径与Attention数值样例已有数据，但交互课程尚属下一阶段。设计与实现见 [花园设计](docs/ai-garden-design.md) 和 [当前实现](docs/ai-garden-implementation.md)。

## 内容入口

- `content/articles.json`：Markdown 元数据；`content/spaces.json`：文档空间和顺序。
- `content/models/**/*.md`：模型原理文章。
- `content/tutorials/video/apple-style-premium-product-video.md`：教程 → 视频制作；保留原文章ID和方法论正文。
- `content/data/products/*.json`：产品事实，只保存一份，多分类由 categories 表达。
- `content/data/benchmarks.json`、`model-api-prices.json`、`sources.json`：评测快照、价格与来源。
- `content/data/research-meta.json`、`categories.json`：数据口径、日期摘要和分类。
- `content/garden/blueprint.json`：知识框架、编辑关系、路径和文章绑定。
- `content/garden/microscopes/*.json`：明确标注假设的教学数值。
- `src/data/essays.ts` 装配MD；`generated-docs.ts` 从JSON派生正文；`docs.ts` 转义美元价格，避免误识别为公式。

`src/generated/` 和 `public/garden-generated/` 是开发/构建前生成的产物，不提交、不手改。ELK 官方 standalone worker 从已安装的锁定依赖复制为带内容摘要的同源资源，图谱计算不阻塞 React 主线程。

## 证据、榜单和价格规则

checkedAt 是核验日期，不等于源站更新日期；snapshotDate、sourceDate 和逐条 submittedAt 分别保留。目录调整或成功构建不会刷新事实的核验日期。

Arena、Artificial Analysis、Terminal-Bench 各自按版本与口径展示，不拼成无共同量纲的总榜。摘录不包装成完整实时Top N；Agent成绩保留模型、配置与日期。来源不可读取时不补猜测。

partial/unavailable 不表示产品不存在或没有收费。未核实的国家保留null，不能由此推断数据驻留地。价格保留币种、周期和适用条件；年付、折算月价、促销价分别记录。空plans不是免费；模型API输入/输出/缓存计费不能与应用订阅混用。

知识图上的导航、编辑关联与推荐先学不是因果主张。正式事实关系需要独立证据。文章只保存一份，图谱绑定articleId，不复制模型成绩和报价。

## 安装、验证与部署

使用Node 24及仓库锁文件：

```sh
npm ci --no-audit --no-fund
npm run build
npx playwright install --with-deps chromium
npm run test:browser
npm run test:production
```

`npm run dev` 自动准备知识图数据；`npm run build` 包含数据、花园结构/数值、真实Markdown渲染、TypeScript和Vite构建。浏览器测试验证图示和控件；生产测试实际访问dist、动态分包和同源Worker。测试夹具不属于对外知识文章。当前浏览器自动验收使用Chromium，不能等价为真实iOS Safari验收。

正文采用CommonMark + GFM + KaTeX数学 + Mermaid；原始HTML/JSX不作为可执行内容。无阴影外观保留必要HTML语义。细节见 [Markdown规范](docs/markdown-rendering.md) 与 [图示规范](docs/diagram-rendering.md)。

生产链路：push main → npm ci → 数据与构建验证 → 开发页面浏览器测试 → 生产产物浏览器测试 → Wrangler直传。

GitHub Actions secrets配置 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`；凭据不写入仓库。关闭旧的Cloudflare Git自动构建，避免双重部署。`wrangler.jsonc` 指向 `./dist`。本地已完成Wrangler认证时可执行 `npm run deploy`；正式发布以前以上述浏览器验收为准。
