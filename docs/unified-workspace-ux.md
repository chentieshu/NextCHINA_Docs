# NextCHINA · 统一学习工作区 UX

现行契约是 [Obsidian 风格数字花园](obsidian-digital-garden.md)。本轮替换六区卡片式主页，不恢复多文档标签，也不创建页面专属图谱。

统一外壳保留左侧文档树、单篇阅读器、浏览器路由和安全返回。文件夹只展开/收起，文档打开阅读；首页点线网络与知识笔记复用同一套规范知识和资料索引。

桌面使用窄工具侧栏与文件树；移动端使用底部工具栏和文档抽屉。地图笔记按需打开，窄屏采用可关闭对话框，保留焦点约束。目录、正文、笔记各自有明确滚动归属，body 不承担整页滚动。

Workspace.tsx 管理唯一外壳与阅读返回；Explorer.tsx 管理文件树；Content.tsx 复用现有 Markdown 阅读器；knowledgeIndex.ts 管理原始关系与资料来源；WorkspaceGraph.tsx、ObsidianCanvas.tsx 和 networkEngine.js 管理唯一的全局点线图。

旧版契约保留在 Git 历史提交 6e8119e1a1277ca87a947a2cd384c1af4fe714e5 中，其中三列区域、默认右侧占位和自然滚动卡片布局已被新契约替代。原有规范 ID、文章、价格和证据规则未改变。
