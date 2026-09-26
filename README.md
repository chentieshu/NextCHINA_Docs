# NextCHINA · AI 到哪了？

AI SaaS、大模型榜单、Agent 产品和构建平台的中文调研文档。现有 React 阅读、搜索与目录界面由统一 JSON 数据驱动；正文统一使用标准 Markdown + GitHub Flavored Markdown (GFM) 渲染，不使用 MDX。

## 数据入口

- `content/data/research-meta.json`：研究库日期、口径、政策说明与待核验项。
- `content/data/products/*.json`：按主领域拆分的 AI SaaS、Agent、API 与基础设施事实；每个产品只存在于一个文件，多分类通过 `categories` 字段表达。
- `content/data/benchmarks.json`：模型与 Agent 基准快照。
- `content/data/model-api-prices.json`：模型 API 价格。
- `content/data/sources.json`：来源目录与核验状态。
- `content/data/categories.json`：结构化产品分类。
- `src/data/docs.ts`：由数据生成章节、表格、搜索内容和演示摘要。
- `scripts/validate-research.mjs`：不依赖第三方包的数据结构与引用校验。

## 核验与排名规则

`checkedAt` 是核验日期，不是每个数据源的更新日期。`snapshotDate`、`sourceDate` 与逐行 `submittedAt` 分别保留。产品分类可重叠，按产品 ID 去重。应用、模型能力、API 和构建框架通过 `kind` 区分。

Arena 人类偏好、Artificial Analysis 指数和 Terminal-Bench 终端任务分开呈现。部分文章披露的成绩不生成虚假 Top N 名次；Agent 成绩必须保留模型与提交日期。OpenRouter 使用量和 SWE-bench 未取得可核实完整记录时不补猜测数值。

本轮按此前调研范围重建并核实公开资料，未能恢复此前完整大模型/Agent 对话结果，不声称逐字迁移或覆盖全球所有平台。`partial` 和 `unavailable` 来源不表示产品不存在，也不表示没有收费。国家字段本轮未逐一核实，保留 `null`，不推断数据驻留地。

## 价格规则

`plans.amount` 保留原币种及 `billing`：`monthly` 是月付，`annual` 是整年支付金额。不要将年付折算月价或促销价当作常规月费。空 `plans` 是本轮未录入可确认的数值价格，不代表免费。模型 API 使用 USD / 百万 token，输入、输出、缓存分开；应用订阅与 API 费用不可混用。

## 维护与验证

修改 MD/JSON 后先执行：

```sh
npm run test:data
npm run lint
npm run build
```

数据校验可不安装依赖直接运行 `node scripts/validate-research.mjs`；类型检查和 Vite 构建需要安装项目依赖。数据测试不能代替完整应用构建或浏览器验收。

内容层统一使用 CommonMark + GFM，禁止 React/JSX、MDX 和私有 Widget 标记。渲染由 react-markdown / remark-gfm 负责，标题 ID 统一使用 github-slugger；交互能力应在应用 UI 层实现，不嵌入 Markdown 正文。恢复历史内容应通过 Git 历史回滚。


## 信息架构

阅读路径固定为：

```text
Docs Home → Article；进入文档后通过 Sidebar 顶部 Space 切换器选择大分类，再通过 Category → Article 浏览
```

顶层 Space 由 `content/spaces.json` 注册，`src/data/spaces.ts` 只负责读取与查询。切换 Space 类似切换 Obsidian Vault，但入口直接位于 Sidebar 顶部：选择大分类后，下方文档树立即切换为该 Space 的小分类和文章，不再经过独立 Space Home。搜索、上一篇和下一篇也限制在当前 Space 内。

当前仍保持纯静态架构。GitHub 是内容源和版本历史，Cloudflare 只负责构建和静态发布；不引入数据库、CMS 服务端或动态 API。文章正文存放于 `content/<space>/<category>/*.md`，文章元数据位于 `content/articles.json`；榜单和结构化资料位于 `content/data/*.json`。React/Vite 只负责构建时读取和渲染。
