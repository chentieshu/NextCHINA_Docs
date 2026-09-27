# Markdown 阅读与响应式规范

本项目继续保持 GitHub MD/JSON + React/Vite 静态发布，不引入后台、MDX 或运行时内容 API。此次修改不调整 Cloudflare 凭据与部署工作流。

## 渲染链

`react-markdown → remark-gfm / remark-math → 标题 ID 插件 → rehype-katex → React 组件 → src/styles/markdown.css`

Markdown 原文由现有内容装配层提供。代码块和表格的结构从 react-markdown 传入的 HAST node 读取，不依赖 React children.type。后者可能是自定义函数组件，不能等同于字符串 code/thead/tr。

## 单一职责

- src/index.css：页面背景、滚动条、根容器及既有侧栏尺寸。
- src/styles/markdown.css：正文、列表、引用、表格、代码、数学、图示及脚注。
- src/utils/markdown.ts：读取 HAST、生成稳定标题 ID、计算表格列宽预算。
- MarkdownCodeBlock：复制状态、错误提示、换行切换。复制时保留原始代码及换行。
- MarkdownTable：保持原生 table 语义与 GFM 对齐，按实际 overflow 显示滚动提示。
- MermaidDiagram：按需加载、严格安全模式、串行配置/渲染、主题切换、失败回退及源码查看。

不再给 `.markdown-body svg` 添加通用的图片尺寸和间距。公式中的根号/伸缩符号、Mermaid 图形、Lucide 按钮图标有不同的几何规则。只对 `.md-image` 应用文章图片样式；Simple Icons 标识单独使用 `.md-provider-logo`，不能将任意表格图片缩成 Logo。

## 宽度和字号

阅读宽度 A = min(820px, W - S - 2P)，沿用 App 的工作区布局。小屏 S=0；桌面 S=clamp(288px, 22vw, 304px)。P 沿用 16/24/32/40px 的正文边距。

Markdown 自身为 inline-size query container。排版基于实际阅读宽度，不以设备类型猜测。当侧栏展开而正文变窄时，同样适用。

正文：clamp(0.9375rem, 0.875rem + 0.25cqi, 1rem)，行高 1.82。以根字号 16px 为例，正文为 15–16px。标题有独立上下限。代码与表格各有字体尺度，不强制缩至 12px。

| 屏宽 | 侧栏 | 正文宽度 | 正文字号 |
| ---: | ---: | ---: | ---: |
| 320 | 0 | 288 | 15 |
| 390 | 0 | 358 | 15 |
| 768 | 0 | 720 | 15.8 |
| 1024 | 288 | 688 | 15.72 |
| 1280 | 288 | 820 | 16 |
| 1440 | 304 | 820 | 16 |

以上是无传统滚动槽扣减时的布局值；浏览器实际可用宽度仍以 clientWidth 为准。

## 表格

1–2 列默认铺满阅读区；3 列及以上根据列内容估计最小可读宽度。纯数字通常为 4.5rem 起，短文本 6rem，中等文本 8rem，长文本 13rem。它们是可读性预算，不是声称精确测量了字符宽度。最终换行由浏览器完成。

colgroup 按预算分配比例，table-layout: fixed 防止极长段落或 URL 把某一列无限撑宽。表格宽度为 max(阅读区宽度, 各列预算之和)。超宽只在表格容器内部滚动，保持 GFM 左/中/右对齐。ResizeObserver 根据实际 overflow 显示提示与左右滚动按钮，而不是假定所有表格都需要滚动。

## 列表、公式、图示

有序列表保留 Markdown 的 start 与编号；嵌套列表不擅自变成字母编号。紧凑列表与含多段正文的宽松列表有不同间距。任务复选框支持直接位于 li 或首个 p 内，普通条目与任务混排也保留圆点。

公式仍用 $...$ / $$...$$；KaTeX 负责数学内部布局，外部只控制留白与局部横滑。Mermaid 使用 mermaid fenced code，包含甘特图和流程图。无效图示回退源码，不阻断其余正文。原始 HTML/JSX 不作为可执行内容。

## 验证

`npm run test:markdown` 现在编译并通过 ReactDOMServer 实际渲染测试文件、所有注册 MD，以及 docs.ts 从 JSON 生成的文档，不再仅检查源码是否含某个字符串。测试覆盖 2/3/4/7 列表格、GFM 对齐、三种代码块、Mermaid 分发、KaTeX、脚注、重复标题、危险 URL 与主题切换后的 ID。

TypeScript 7 使用 CLI 编译；测试不依赖旧版 TypeScript JavaScript compiler API。不新增生产依赖。

2026-09-27 本地 Chromium 语义 DOM/CSS 样例验证：12 个屏宽（320–1920px）× 2 个主题 × 2 个侧栏布局状态 × 2 个根字号（16/20px），共 96 组。测试时禁用页面级横向裁切，检查真实 scrollWidth，避免用 clip 掩盖溢出。该项是样例几何验证，不代替完整 Vite 应用、真实 iOS Safari 或 Mermaid 浏览器运行时的端到端验收。

## 参考

- react-markdown components/node：https://github.com/remarkjs/react-markdown
- CSS container queries：https://www.w3.org/TR/css-contain-3/
- KaTeX options：https://katex.org/docs/options.html
- Mermaid usage：https://mermaid.js.org/config/usage.html
