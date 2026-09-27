# AI 知识花园 · 第一阶段可用界面

## 本轮范围

承接 ai-garden-design.md 的阶段 B：全景入口、领域/专题展开、节点详情、一跳编辑关联、全库概念和文章搜索、URL/历史、列表替代、现有文章跳转与返回。是只读知识探索器，不是自由编辑白板。

blueprint.json 仍是知识内容框架。outline/not-reviewed 状态不会因画布上线而升级。14 个领域、77 个专题、380 个概念不代表 472 篇完成文章。8 条学习路径和 Attention 数值样例仍是下一阶段的数据，尚无交互课程界面。原有教程分类及文章内容不变。

## 入口与使用

首页保留“进入文档”，新增平行入口“探索知识花园”。普通文章上也可以打开花园。

全景 → 展开领域 → 展开专题 → 查看概念 → 阅读文章 → 返回知识花园。单击节点查看，明确的“展开/关联”按钮继续探索。列表和画布使用同一数据与动作；未知节点给出恢复入口，不跳转空白。

搜索覆盖全部知识节点和现有文章，不限某一个文档空间。英文概念 ID 也可检索。相关文章中明确标注直接绑定和从上级继承的总览资料，避免把一篇总览冒充所有概念的专著。

## 静态数据与职责

- scripts/prepare-garden.mjs 复用原结构校验器，开发/构建前派生 src/generated/garden.json。派生文件不提交。
- domain.ts/data.ts 维护类型、节点索引、目录、双向关联和反向阅读入口，与 React Flow 无关。
- projection.ts 只生成当前范围的子图；选择节点和换主题不触发布局。图中“导航/推荐先学/编辑关联”不是因果结论。
- GardenPage 在进入路由时 lazy-load；手机默认列表，列表模式不加载 React Flow 或布局代码。
- GardenCanvas 使用 @xyflow/react。全景稳定网格，专题和局部关系通过 ELK 布局。
- NodeInspector 复用既有文章，不复制正文。
- routing.ts 统一首页/文章/花园查询参数和 popstate，浏览器后退不再与组件内状态脱节。

## ELK Worker 的实际兼容修复

不要把 elk.bundled.js 直接 import 到自定义 Worker。该合并包在 Worker 环境中的导出分支会改变，可能导致初始化失败；这是构建成功不能替代浏览器运行测试的实际例子。

当前只在主线程加载轻量 elk-api.js。prepare-garden 从已安装的锁定 elkjs 包中复制官方 elk-worker.min.js，字节不改，文件名带 SHA256 内容摘要，置于 public/garden-generated/。浏览器以同源 classic Worker 运行它，由官方消息协议处理布局请求；算法不在 React 主线程执行。

Worker 及 URL 索引是构建产物，不上传 Git，不从第三方 CDN 运行。布局有取消、15 秒超时、结果检查和有限缓存；终止过期 Worker。发生错误可重试或直接改用列表。

## 定位与视口

示例：`?view=garden&scope=topic:transformer-mechanisms&node=concept:self-attention&display=list`。

scope 表示展开范围，node 表示选中详情，mode=explore 为一跳局部关系。文章携带只允许 garden 查询参数的 return 值，不允许外部重定向。后退/前进、显式返回和刷新可恢复知识位置。平移/缩放使用有上限的 sessionStorage/内存缓存，存储受限不阻断阅读。

全景可适应整张入口图。进入较高的专题树时，初始只聚焦可读邻域，缩放不低于 0.9；手机局部图先聚焦一个节点。避免为了装下所有后代把 14px 标题自动缩成 8px。拖动/方向键可平移，加减号缩放，0 或“居中图谱”按钮查看整个当前子图。该操作不删除视口外节点；列表入口始终可用。

## 响应式与外观

花园占 100dvh；工具栏和状态栏按内容占位，中央 minmax(0,1fr)。页面不承担画布横向滚动。

| 可用宽度 | 导航 | 详情 |
| --- | --- | --- |
| >=1280px | 常驻232px | 选中后320px，其余归画布 |
| 1024–1279px | 收到全景/面包屑入口 | 320px，避免三栏压缩 |
| 640–1023px | 画布/列表占满 | 覆盖面板 |
| <640px | 默认同源列表，可切局部图 | 底部面板 |

窄屏详情使用 inert 背景、Tab 焦点约束、Escape 关闭和关闭后的焦点恢复。保留 button/input 语义，无原生 select/details 外观，无阴影。明暗配色共用既有全局主题。当前未做真实 iOS Safari 设备验收。

## 安装与验证

React Flow 12.11.2、ELK 0.12.0；保留原有 React/Vite 版本。package-lock.json 由实际成功安装和测试的 npm 依赖树生成，不手写。生产使用 npm ci。

`npm run build` 包含花园数据校验、Markdown 实际渲染、类型与构建；`npm run test:browser` 覆盖既有图示和花园；`npm run test:production` 用 Vite preview 实际验证 dist 分包和同源 Worker。

结构校验脚本源自阶段 A，仅用于知识数据与数值样例，不以其历史 uiImplemented 字段判断界面状态；界面以源码和浏览器测试结果为准。GitHub Actions 中查看每个提交实际验收结果，不把旧运行的成功套到新提交。

## 下一阶段

关系筛选/两跳邻域 → 学习路径界面 → Attention 可交互实验 → 定义、数值案例与证据。框架浏览上线不等于已经完成整个 AI 百科。

## 实现依据

- React Flow API：https://reactflow.dev/api-reference/react-flow
- ELK 官方 API/Worker 文档：https://github.com/kieler/elkjs
- ELK 合并包在 Worker 中的导出问题：https://github.com/kieler/elkjs/issues/141
