# NextCHINA · AI 到哪了？

面向普通读者、开发者与研究者的中文综合 AI 知识库。长期目标是连接 AI 原理、数据、模型、系统、实践、评测、产业与社会影响；当前内容以模型原理、AI 产品目录、基准快照和创作方法为主，尚不代表全部维度已经建成。现有库存、缺口与建设路线见 [综合 AI 知识库规划](docs/ai-knowledge-roadmap.md)。

项目保持纯静态：GitHub 保存 MD/JSON，React/Vite 装配和渲染，GitHub Actions 验证与构建，Wrangler 将静态产物发布到 Cloudflare Workers Static Assets。不使用 MDX，不引入数据库、CMS 服务端或运行时内容 API。

## 内容与数据入口

- `content/articles.json`：Markdown 文章索引与元数据。
- `content/spaces.json`：知识空间及章节归属。
- `content/models/**/*.md`：模型原理文章。
- `content/tutorials/video/apple-style-premium-product-video.md`：教程 → 视频制作；保留原文章 ID，正文为通用创作方法论。
- `content/data/research-meta.json`：研究库日期摘要、口径与待核验项。
- `content/data/products/*.json`：按主领域拆分的产品事实；每个产品只保存一次，多分类由 `categories` 表达。
- `content/data/benchmarks.json`：模型与 Agent 基准快照。
- `content/data/model-api-prices.json`：模型 API 价格。
- `content/data/sources.json`：来源与核验状态。
- `content/data/categories.json`：结构化产品分类。
- `src/data/essays.ts`：读取 Markdown 并装配文章。
- `src/data/generated-docs.ts`：由 JSON 派生正文与比较表；`src/data/docs.ts` 在输出边界转义美元价格，避免误识别为数学公式。

## 信息架构

首页直接进入文章。进入文档后，通过 Sidebar 顶部切换空间，再通过小分类浏览文章，不经过独立 Space Home。搜索及上一篇/下一篇目前仍限定当前空间。

当前空间为 Models、AI Products、Agents、Research、教程。未来综合知识空间在内容成熟后逐步注册，规划条目不提前显示成已完成文章。每篇内容只保存一份，通过元数据与链接建立跨专题关系。

## 核验与排名规则

`checkedAt` 是核验日期，不等于源站更新日期；`snapshotDate`、`sourceDate` 与逐行 `submittedAt` 分别保留。产品分类可以重叠，按产品 ID 去重。应用、模型服务、API 和框架通过 `kind` 区分。

Arena 人类偏好、Artificial Analysis 指数和 Terminal-Bench 终端任务分开呈现。部分摘录不能包装成完整实时 Top N；Agent 成绩保留模型、配置与提交日期。来源不可读取时不补猜测数值。

`partial` 和 `unavailable` 不表示产品不存在或没有收费。未核实国家字段保留 `null`，不能推断数据驻留地。结构校验、成功渲染和构建成功均不能代替事实核验；盘点或目录调整不会刷新条目的核验日期。

## 价格规则

`plans.amount` 保留原币种和 `billing`：`monthly` 为月付，`annual` 为整年支付金额。年付折算月价、促销价、常规月付分开记录。空 `plans` 不代表免费。API 使用 USD / 百万 token，输入、输出与缓存分开；应用订阅与 API 费用不可混用。

## Markdown 与验证

正文使用 CommonMark + GFM + KaTeX 数学 + Mermaid。禁止可执行 React/JSX、MDX 和任意原始脚本。交互由应用组件实现。图示、列表、表格和主题的规范见 [Markdown 阅读规范](docs/markdown-rendering.md) 与 [图示和无阴影控件](docs/diagram-rendering.md)。

修改后执行：

```sh
npm install --no-audit --no-fund
npm run build
npx playwright install --with-deps chromium
npm run test:browser
```

`npm run build` 包含数据校验、真实 Markdown 渲染测试、TypeScript 检查和 Vite 构建。浏览器测试检查 Mermaid 实际 SVG、控件、主题与溢出；测试夹具不是对外知识文章。仅数据结构校验可直接运行 `node scripts/validate-research.mjs`。

## 部署

```text
push main
  ↓
GitHub Actions / Node 24
  ↓
npm install --no-audit --no-fund
  ↓
npm run build
  ↓
Chromium 浏览器验收
  ↓
wrangler deploy
  ↓
Cloudflare Workers Static Assets
```

GitHub Repository → Settings → Secrets and variables → Actions 配置 `CLOUDFLARE_ACCOUNT_ID` 与 `CLOUDFLARE_API_TOKEN`。凭据不写入仓库。关闭旧的 Cloudflare Git 自动构建入口，避免双重生产部署。

本地完成 Wrangler 认证后可运行 `npm run deploy`。`wrangler.jsonc` 是部署配置入口，静态资产目录为 `./dist`。依赖安装命令以当前工作流为准；引入并提交可靠 lockfile 后，再统一迁移到 `npm ci`。
