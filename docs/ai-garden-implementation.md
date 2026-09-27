# AI 知识花园 · 第一阶段可用界面

## 范围

承接 ai-garden-design.md 的阶段 B：全景入口、领域/专题展开、节点详情、编辑关联、全库概念和文章搜索、URL/历史、列表替代、现有文章跳转与返回。不是自由编辑白板；读者不能新增连线或修改公共知识。

blueprint.json 仍是知识内容框架快照。outline/not-reviewed 状态不因画布上线而升级。14 个领域、77 个专题、380 个概念并不代表 472 篇完成文章。8 条学习路径和 Attention 数值样例仍保留为下一阶段的数据，不显示成已经实现的交互课程。

## 职责

- scripts/prepare-garden.mjs 复用原校验器，在构建/开发前派生 src/generated/garden.json；派生文件不提交。
- domain.ts/data.ts 保存与画布无关的类型与查找、反向阅读入口。
- projection.ts 只生成当前范围的子图，选中和切换主题不触发布局。
- GardenPage 在路由进入时 lazy-load；列表模式不加载 React Flow/ELK。
- GardenCanvas 使用 @xyflow/react；全景为固定网格，专题与局部关系通过 ELK Worker 排列。
- layout.worker.ts 是真实 Worker，请求有 ID、取消、超时和结果检查；缓存有上限，失败提供列表回退。
- NodeInspector 绑定现有文章，不复制正文；上级总览明确标注“上级资料”。
- routing.ts 统一首页/文章/花园 URL 和 popstate，避免浏览器后退与组件内状态脱节。

## 导航与状态

示例：`?view=garden&scope=topic:transformer-mechanisms&node=concept:self-attention&display=list`。

scope 是当前展开范围，node 是选中详情；mode=explore 是一跳局部关联。图中“导航”“推荐先学”“编辑关联”与正式因果结论分开。无效节点显示找不到状态，不能直接空白。

文章携带只允许 garden 查询参数的 return 值。浏览器后退、显式返回花园、刷新都能恢复知识位置；视口平移/缩放使用有容量上限的会话缓存和内存回退，存储被禁用不阻止阅读。该视口缓存不是跨设备同步，也不把临时坐标写入知识 JSON。

## 响应式

工作区占 100dvh；工具栏和状态栏按内容占位，中央使用 minmax(0,1fr)。页面本身不承担画布滚动。

- >=1280px：领域导航232px；详情打开时320px，其余归画布。
- 1024–1279px：隐藏常驻导航，面包屑/全景仍可导航；详情320px。
- 640–1023px：画布/列表占满；详情是遮罩面板。
- <640px：默认同源列表，用户可切换局部图；详情用底部面板。

详情在窄屏使用 inert 背景和焦点约束，Escape 关闭、关闭后恢复焦点。输入、按钮保留语义；无原生 select/details，无阴影。浏览器外部UI不属于应用可控制区域。

## 依赖与验证

React Flow / ELK 版本分别核对官方 package manifest，不改变现有React/Vite版本。实际能否构建与绘制由 CI 安装、TypeScript、Vite 和生产产物浏览器测试判定，而不是仅凭文档推断。

`npm run build` 包含花园数据校验；`npm run test:browser` 同时覆盖已有 Markdown/Mermaid 与花园；`npm run test:production` 用 Vite preview 检查 dist 中的分包和 Worker。测试涉及全景/展开/检索/阅读返回、错误URL、存储限制、无阴影、可用高度、多个视口和主题。

工作分支验证流程只在 work/ai-garden 上运行，不读取Cloudflare凭据；成功后把 npm 自动生成的 package-lock.json 记录回同一分支。最终生产使用锁文件安装，不手写依赖树。

## 后续

下一步依次建设关系筛选/两跳邻域、学习路径界面、Attention可交互实验、条目定义与证据。不得把本轮上线的框架探索界面描述为全部AI知识已经完成。

## 官方实现参考

- React Flow API：https://reactflow.dev/api-reference/react-flow
- 自动布局边界：https://reactflow.dev/learn/layouting/layouting
- ELK JavaScript：https://github.com/kieler/elkjs
