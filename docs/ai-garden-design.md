# NextCHINA AI 知识花园：产品、知识模型与工程设计 v1

> 本轮阶段：设计与数据骨架。基线为 `623361377cc12c84c083ba38caa97763b06ac97a`。已选定 React Flow + ELK，未安装新运行时依赖、未上线图谱页面、未替换当前阅读界面。本文的交互和性能数值是实现规格/验收目标，不是已完成 UI 的测试结论。内容地图不是已写完的百科，也不是事实重新核验。

## 1. 产品定义与选择

产品名称暂定「NextCHINA AI 知识花园」。不是把现有侧栏放大，不是自由绘图白板，也不是用上千个光点营造信息丰富的错觉。核心体验是：从 AI 全景逐步聚焦到一个机制，沿前置知识和跨学科关系探索，阅读现有文章，再进入有真实数值的计算实例。

采用 **React Flow (`@xyflow/react`) + ELK (`elkjs`)**。知识本身保存为普通 JSON 和 MD，与画布实现无关。React Flow 负责交互和自定义 React 节点；ELK 只负责计算布局，不负责事实关系、不自动理解文档。选择具体依赖版本时再核验 React/TypeScript/Vite peer 范围并生成锁文件，当前不为设计文件调整已有部署依赖。

| 候选 | 特点 | 本项目取舍 |
| --- | --- | --- |
| React Flow | 可把摘要、状态、公式入口等渲染为自定义 React 节点；有视口和无障碍支持 | 主方案，适合局部知识探索和机制卡片；不是一次展示无限节点的承诺 |
| Cytoscape.js | 专注网络图分析、复合节点和多种布局 | 当重点变成网络算法分析时是合理替代；本阶段更重视 React 内容卡片和教学交互 |
| Sigma.js + Graphology | WebGL 网络图渲染，面向大量节点；数据和渲染分离 | 留作未来全库星图的可选独立视图；现在不同时装两套引擎 |
| Mermaid | 文章内声明式图示，已经集成 | 继续负责 MD 内图；不把它用作可检索、可过滤、带阅读面板的整站花园 |

React Flow 的自动布局需要外部方案。ELK layered 用于专题树/机制流程；局部关系图第一版仍使用稳定的分层排列，不默认启动不停抖动的力导向模拟。数据适配层保留换引擎能力，避免未来重写全部知识文件。

参考：[React Flow 自定义节点](https://reactflow.dev/learn/customization/custom-nodes)、[布局](https://reactflow.dev/learn/layouting/layouting)、[性能](https://reactflow.dev/learn/advanced-use/performance)、[无障碍](https://reactflow.dev/learn/advanced-use/accessibility)、[ELK](https://github.com/kieler/elkjs)、[Cytoscape.js](https://js.cytoscape.org/)、[Sigma.js](https://www.sigmajs.org/docs/)。Obsidian 的全局/局部关系探索值得借鉴，但笔记超链接不等于科学关系：[Graph view](https://obsidian.md/help/plugins/graph)。

## 2. 同一份知识，四种视图

### 全景 Atlas

初始显示 14 个知识入口，按「理解、构建、使用与评价、连接世界」四个阅读目的组织。展开一个入口才展示该专题。其余入口变成紧凑的导航线索，而不是始终把全部后代铺满屏幕。手机优先用同源可访问的领域列表进入局部画布，不把整张图缩成不可读的小字。

### 专题与局部关系 Explore

选中节点后显示概念摘要、相关文章、前置知识、关联主题、内容成熟度。默认一跳关系，显式请求后扩至两跳。关系类型可筛选；方向、线型和标签共同编码，不只靠颜色。显示「已展示 12 / 38 个关联」和继续探索入口，不偷偷丢弃超出预算的关系。

### 学习路径 Learn

从同一批节点组成目标导向路线：普通读者、LLM 微观计算、RAG、可靠 Agent、创作、部署、具身智能、研究证据。路径只是编辑推荐，不是概念分类，不代表全部步骤已拥有教程。遇到待完善节点显示状态及已有总览入口，不生成空的已发布文章。

### 微观计算 Microscope

把一个机制拆成操作实例、输入张量、输出张量、公式与局部数值。实例节点引用全局概念 ID；两个步骤都使用 Softmax 时可以有两个步骤实例，但全局只有一个 Softmax 概念。第一份数据样例为 `attention-3x2`。后续增加训练梯度、扩散采样、检索排序、KV 缓存、RL 回报等实例。

阅读长文章沿用现有 MarkdownRenderer；节点只展示短摘要，不把整篇 MD 塞进几十个节点。已有首页仍直接进入文档，新增「探索知识花园」为平行入口，不能强迫每次阅读先穿过图谱。

## 3. 覆盖地图

`content/garden/blueprint.json` 是第一版框架的唯一数据源。所有叶节点先是大纲；文章绑定保留当前真实存在的入口。完整细分以 JSON 为准，下面说明宏观范围和典型微观落点。

| 入口 | 专题范围 | 可下钻到的微观对象 |
| --- | --- | --- |
| AI 全景与入门 | 概念、任务、历史、边界、人机交互 | 任务假设、输入输出、能力与可靠性的差别 |
| 数学与计算基础 | 线性代数、概率、微积分、信息论、优化 | 一个点积、一行 Softmax、一次梯度与舍入误差 |
| 数据与学习 | 数据生命周期、泛化、学习范式、训练、后训练、RL、迁移 | 一个样本、标签、损失、批次、奖励与更新步骤 |
| 模型与算法 | 经典 ML、逻辑、搜索、概率因果、神经结构、专门任务 | 树分裂、搜索状态、图消息、注意力头与残差 |
| 多模态与内容生成 | 语言、视觉、图文、图像、音频、视频、3D、统一模态 | Token、Patch、频谱窗、潜变量、噪声、时空块 |
| 检索、Agent 与系统 | 检索重排、RAG、Agent、接口、可靠执行 | 一个 chunk、一轮工具调用、一次重试与权限检查 |
| 具身智能与世界模型 | 状态控制、感知、动作学习、动力学、仿真迁移 | 观测、位姿、动作、转移、轨迹和反馈误差 |
| 算力与工程部署 | 硬件、并行、推理、优化、运维、端侧成本 | 显存字节、带宽、KV head、batch、Token 延迟 |
| 评测、榜单与选型 | 任务质量、可信指标、协议、效率、榜单 | 单个测试样本、置信区间、版本化 evaluation run |
| 产品、工具与生态 | 助手、编程、创作、平台、版本许可 | 产品功能、模型版本、套餐限制与 API 计价单位 |
| 教程与实验 | 入门、开发、手算、创作、交付 | 可复制输入、操作步骤、预期结果与失败排查 |
| 行业应用与案例 | 科学健康、知识行业、工业环境、商业交通、文化 | 一项实际任务、非 AI 基线、人工介入、验收与收益 |
| 安全、伦理与社会 | 失效攻击、权利、治理、社会、政策 | 一次注入、一个授权边界、审计记录与适用法域 |
| 研究、产业与未来 | 方法、机制解释、前沿、产业、证据更新 | 论文实验、消融变量、主张、版本、证据与争议 |

这不是互斥的学科分类。产品、教程、行业和研究包含编辑入口；难度、模态、应用场景和文档类型是独立维度。比如 Transformer 的主浏览位置在算法，LLM 和 DiT 通过关系引用它；不能在每个模态下面复制一个新的 Transformer。

学科广度参考 [AIMA 作者目录](https://aima.cs.berkeley.edu/contents.html)，评价维度参考 [HELM](https://crfm.stanford.edu/2022/11/17/helm.html)，风险生命周期参考 [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)。这些来源不为本项目的每个目录归属背书。具体技术节点在写正文和正式语义边时单独补证据；前沿/法律主题的大纲不是当前研究结论或法律建议。

## 4. 宏观到微观不是无限套娃

建议粒度：L0 全景；L1 领域；L2 专题；L3 概念/机制；L4 操作实例；L5 数值、样本和具体实验结果。粒度不等于难度，专题也不必强行凑足六层。

示例阅读链：AI → 模型与算法 → 神经结构 → Transformer → 自注意力 → QK 转置与缩放 → 掩码 → Softmax → 加权 V。浏览到这里，可以横向去「数值稳定性」「长上下文资源」「VLM 融合」「评测」，而不是只能返回父目录。

知识图上的层级边表示导航归属。计算图上的箭头表示张量/控制流。学习路径上的箭头表示推荐顺序。三者必须用不同的 graph kind 和图例，不能混成一种看似有因果意义的连线。

### 第一份数值样例

文件：`content/garden/microscopes/attention-3x2.json`。Q、K、V 是人为构造的 3×2 矩阵，不声称来自真实模型。计算 `A = rowSoftmax(QK^T / sqrt(2) + causalMask)`，再计算 `O = AV`。验证脚本检查乘法结果、形状、行和、未来权重与首个输出。

未来 UI 每一步显示：这一步解决什么、公式变量、输入形状、输出形状、当前数值、可修改参数和常见误解。所有表格及图示取自同一次计算。禁止 eval 任意表达式；教学矩阵限制到 8×8，不启动训练服务器，不调用收费 API。

## 5. 数据契约与知识去重

### 当前已落地的数据骨架

`blueprint.json` 的 domain/topic/concepts 是编辑友好的树形存储。编译器为其生成稳定 ID：`root:ai`、`domain:<id>`、`topic:<id>`、`concept:<id>`。浏览边自动派生，不重复手写。概念的规范名称、未来别名与重定向由稳定 ID 连接，改显示名不更改实体身份。

`relations` 当前仅包含明确标注的编辑关联和推荐先修关系，不把自动提及升格为事实。`articleBindings` 以现有 articleId 关联文章，不复制正文、模型分数或报价。关联覆盖类型区分 overview、catalogue、snapshot、methodology、orientation。

### 后续正式实体契约

- KnowledgeNode：id、kind、label、aliases、summary、primaryTopicId、topicIds、difficulty、contentStatus、reviewStatus、reviewedAt、sourceIds。
- KnowledgeEdge：id、source、target、type、direction、scope、assertionStatus、evidenceRefs、validFrom、validTo。
- ArticleBinding：articleId、nodeId、coverage、可选稳定 headingId。锚点必须用生产 slugger 校验；未完成锚点验证前只链接整篇文章。
- EvaluationRun：明确 modelVersion、benchmarkVersion、运行配置、工具、推理预算、硬件、测量指标、来源和日期。它不是 model 节点上的一个永久 score。
- ModelVersion、ProductVersion、Provider、DatasetVersion、Hardware：从独立的规范化注册表适配，不能把同一产品目录在花园 JSON 中再保存一份。
- MechanismInstance：引用规范概念的步骤实例，有 input/output shape、约束、数值来源和数据流边。一次实例的局部回路不代表概念导航存在环。

主浏览位置是一个用于找路的树；真实知识是有类型的图。相关边允许环，先修建议必须无环。正式 is_a / part_of / uses / trained_with / evaluated_by / mitigates 等边要求适用范围与证据，不能把“可能降低风险”画成“保证消除风险”。论文引用、文章提及、编辑推荐和因果主张分别保存。

## 6. 数字花园的状态不是装饰

内容状态与事实状态分开：outline（只有框架）、seed（定义与来源）、growing（解释与案例）、maintained（达到模板并持续维护）。reviewStatus 独立记录未复核/有来源/已人工复核/有可复现实验；过期状态按时效规则推导。连接了一篇总览并不自动让该概念变成 maintained，也不更新全篇核验日期。

地图允许显示待完善节点，但要用文字徽标和线型区分；普通文章列表不展示空文档。学习完成状态只属于读者本地，不能改变公共知识的事实状态。节点大小默认按类型固定，绝不暗示连接越多、真理程度或模型能力越高。

覆盖看「主题 × 是什么/原理/使用/评测/工程/风险」矩阵，明示适用项和分母。不能用 23 篇文章关联了多少个节点来声称百分之几的全 AI 知识已经完成。

## 7. 布局和响应式规格

所有尺寸按容器 clientWidth 和实际工具栏高度计算，不用窗口宽度假设忽略滚动条、安全区和打开的面板。使用 CSS Grid/Flex 的单一尺寸来源，React Flow 父容器必须有确定的宽高；min-width/min-height 为 0。网页本身不承担图谱横向滚动。

| 可用宽度 | 导航 | 画布 | 详情 |
| --- | --- | --- | --- |
| ≥1280px | 可折叠，240px | W - S - D，默认至少 720px | 选中后 320px |
| 1024–1279px | 收为按钮，不占栏 | W - D，1024 时约 704px | 320px，可关闭 |
| 640–1023px | 覆盖式面板 | 占满工作区 | 覆盖式详情，不挤压画布 |
| <640px | 默认领域/关联列表，可进入局部图 | 一次聚焦一个主题 | 底部面板，不同时展开导航 |

例：1440 = 240 + 880 + 320；1280 = 240 + 720 + 320；1024 = 0 + 704 + 320；390px 手机采用列表/局部图而非三栏压缩。以上不含外部浏览器边框，实际以工作区可用宽度为准。

节点详细卡片建议宽 224–280px、摘要不超过两行。缩放较低时只画标签与状态，不能同时缩小文字并展示完整段落。缩放阈值是测试后可调的 LOD 策略，不以缩放自动触发随机重排或更改用户选中状态。

风格沿用现有无阴影系统，浅/暗底色、实线边框、自绘控件及 outline 焦点。保留 button/input 等 HTML 语义和可访问标签，不重新引入原生 select/details 外观。阅读页面不新增长驻本文大纲。

## 8. 交互、定位与无障碍

单击节点选中；明确的展开按钮展开；阅读按钮进入现有文章；不能让双击承担唯一关键动作。提供面包屑、后退、返回当前专题、重置视图。选中详情中的关联节点时只聚焦局部，不让全图重新排列。浏览器 Back/Forward 恢复焦点与视图，节点 ID 是 URL 主键，显示名不是。

建议持久 URL：`?view=garden&node=concept%3Aself-attention&mode=explore&depth=1`。现有 App 目前主要由本地 view 状态切换，URL 同步是下一阶段明确工作，不宣称已有路由库。未知或退役节点给出搜索/重定向，不返回黑屏。

鼠标/触控拖动仅改变画布视口；读者默认不能新增边、删除节点、改公共知识。复制链接与键盘搜索均可用。画布提供方向键、加减缩放、居中和无图列表替代。中文 aria 提示、focus-visible、减弱动画设置必须保留。

图谱内部双指缩放与网页整体缩放是两个坐标系。touch-action 只在画布交互层约束；不能把整个 body 变成不可滚动的画布。移动端打开覆盖面板时使用同一个锁滚动管理器，关闭恢复滚动与焦点；不能让 sidebar/search/details 各自互相覆盖 body.style。

## 9. 工程边界和静态发布

当前基线依然是 GitHub MD/JSON + React/Vite + Cloudflare 静态资源。此轮只增加设计、数据骨架与独立校验脚本，没有改生产 App、现有构建工作流、API 凭据和内容事实。

下一阶段文件建议：

```text
content/garden/blueprint.json       # 概念框架、编辑关系、路径、文章绑定
content/garden/microscopes/*.json   # 数值示例与操作实例
src/features/garden/domain.ts      # 与画布库无关的类型
src/features/garden/adapter.ts     # 规范节点 → React Flow 节点
src/features/garden/projection.ts  # 全景/局部/路径子图与预算
src/features/garden/layout.worker.ts
src/features/garden/GardenPage.tsx
src/features/garden/NodeInspector.tsx
src/features/garden/GardenList.tsx
src/styles/garden.css
```

数据层不保存 React Flow position、selected、measured、dragging 等视图字段。布局结果按子图 ID、数据版本、方向、节点尺寸和布局版本缓存，书签/阅读进度单独保存在本地且捕获存储异常。新标签和术语需提供别名，JSON 字段优先类型化而非从标题猜测。

静态编译阶段产生节点索引、双向邻接表、文章反向链接和主题分片。进入花园再 lazy-load React Flow 与相应数据，原文章首屏不承担图谱代码。ELK 放 Web Worker；布局请求有序号和过期结果丢弃。不能假设 Promise 异步就等于脱离主线程。ELK 是布局方案，不保证自动保持所有节点旧坐标；固定骨架、缓存和保留邻域位置属于应用自己的策略。

默认全景只展示领域入口，局部图按可读预算展开。150 个桌面可见节点、50 个移动节点是一版设计预算，不是库的上限，也不是性能实测。关键机制边不能因预算被静默删除；超出时折叠为可展开的计数入口。未来确有全库密集网络需求，再评估 Sigma 专属视图，底层知识模型不变。

## 10. 已有内容的迁移

23 个现有阅读页面通过 articleBindings 映射，不复制文件。Apple 视频继续保留「教程 → 视频制作」和原 articleId。原理总览可绑定多个机制，但标记 overview；产品清单仅绑定工具入口，不当作底层原理证据；榜单只绑定 snapshot 入口，具体分数与时效沿用原数据，不重新复制。

当前 Models/Products 等文章空间与新的知识导航相互独立。一篇 MD 可解释多个概念，一个概念也可连接原理、教程、评测和论文，但只有一份正文。未来“全文提及自动连边”只产生待审核 mention，不能悄悄污染本轮人工定义的关系。

## 11. 验收与下一步

本轮可运行：`node scripts/validate-garden.mjs` 和 `node scripts/test-garden.mjs`，无需安装第三方包。校验 ID、引用、层级、关联去重、推荐先修无环、文章映射、路径和教学注意力数值。`node scripts/validate-garden.mjs --emit /tmp/garden-graph.json` 可导出渲染器无关的 nodes/edges。此脚本目前独立于生产 build，接入 UI 时再纳入 CI。

阶段 A（本轮）：库选型、14 维知识骨架、现有文章映射、学习路径、一个微观算例和验证规则。阶段 B：实现只读全景、专题展开、节点详情、全站搜索、URL 状态、列表替代和 Markdown 跳转。阶段 C：局部关系筛选、学习路径、反向链接和 Attention 可交互实验。阶段 D：逐主题补定义、数值案例、可复现实验、评测和证据；最后再考虑版本化产品实体、贡献审核与协作编辑。

UI 阶段必须用真正浏览器验证：320/390/768/1024/1280/1440/1920px、两种主题、开关侧栏、打开详情、触控/键盘、字体放大与减弱动画；检查 body 横向溢出、真实点击、返回焦点、URL 恢复、布局过期竞态和无阴影。还要检查普通文章首次访问不会加载花园大包。不能把数据校验通过称为 React Flow 或移动端已验收。

内容完成标准：一个节点应回答是什么、为何需要、怎样工作、怎样使用、如何评价和有哪些边界；适用时有数学定义、形状、输入输出和实验。继续保留来源类型、事实状态和修改历史。先让路径可读，再逐步生长内容，不以节点数量冒充知识完成度。
