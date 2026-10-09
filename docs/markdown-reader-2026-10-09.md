# Markdown 阅读套件：公式、语法高亮、静态图表与目录

基线 `49d4a37`。本轮只调整渲染、布局、交互及对应测试，不修改知识关系和商业数据的核验日期。

## 渲染职责

- CommonMark/GFM/数学仍由 react-markdown、remark-gfm、remark-math、rehype-katex 解析。关闭原始 HTML 和不安全 URL，保留 MathML、标题锚点、表格语义、任务列表和有序列表 start。
- Prism 1.30.0 为 Python、JS/TS/JSX/TSX、JSON、Bash、YAML、HTML/CSS、SQL、Go、Java、Rust 和 Diff 高亮。已知文章的代码在构建时高亮，动态内容同步回退；未知语言或超过 50,000 字符的代码显示转义纯文本。复制始终使用原文，包括末尾换行。
- 行内 KaTeX 使用正常 inline/visible 排版，不再给每个公式加 overflow:auto。只有独立公式块、代码块和超宽表格拥有局部滚动区；不隐藏或裁掉公式内容。
- Markdown 正文树按 content memo，主题通过 context 只更新图表颜色，侧边栏开关不重复解析正文。阅读器不再在选中文章后额外懒加载并显示“正在排版”层。

## Mermaid 静态资源

`npm run render:assets` 使用同一版本 Mermaid + 共享 diagramTheme，在构建时生成明暗两套 SVG 和 Prism 代码标记，保存到 `src/generated/markdown-assets.json`。通过 Markdown AST 遍历代码块，不以不可靠的围栏计数代替解析。来源、主题、版本改变会使缓存失效；全部源文本再次比对，哈希冲突不会显示别的图表。

发布正文里的图表首次挂载即有 SVG，不等待进入视口，也不向 CDN 请求绘图库。非登记动态内容保留 strict Mermaid 回退、有限内存缓存、错误恢复和源码查看。每个实例重写 fragment/ARIA ID，避免复用 SVG 发生标记冲突。图表默认适应容器，提供原始尺寸、缩放和源码操作。甘特、流程、时序等共享清晰的蓝灰/青绿配色、圆角、轻线条和无阴影主题。

首次本地构建前运行 `npm ci` 与 `npx playwright install chromium`。CI 已将 Chromium 安装移到构建前。受控离线工作区可显式设置 `CHROMIUM_PATH`，不会改变发布环境的浏览器版本。`npm run dev` 和 build 会检查静态资源指纹，内容不变不重复绘图。

## 阅读布局与目录

表格保持单一语义 table，填满其阅读框，超宽时仅在表格内部横向滚动，不转成破坏列关系的卡片。列表保留原始编号、嵌套、任务状态与阅读顺序，窄屏减少缩进并保持标记对齐。

文档目录使用编辑器式结构树：连续单行、缩进引导线、文件/文件夹图标和全行选中。保持现有 canonical ID、键盘上下左右、Home/End、折叠与定位行为。右侧资料开关位于阅读页面右上角，为透明无底色图标；桌面侧栏平滑改变网格列宽，移动侧栏平滑滑入滑出。收起即 inert，不留下可聚焦隐藏按钮；reduced-motion 禁用动画。

## 验收

在原回归集合之外新增实际文章的行内公式无滚动容器、表格宽度、静态 Mermaid 首屏、语法 token、原文复制、主题切换不重建正文、目录和透明按钮、动画降级验证。增加 320/390/1440 明暗嵌套列表及甘特图夹具。部署后核验宏观图和四篇文章的 390/1440 实际页面、版本、代码高亮、公式和静态图表。最终结果以对应 PR、Actions 与线上核验记录为准。

实现参考：
- https://prismjs.com/#basic-usage
- https://katex.org/docs/options
- https://mermaid.ai/open-source/config/theming.html
- https://code.visualstudio.com/docs/editing/getting-started/userinterface
