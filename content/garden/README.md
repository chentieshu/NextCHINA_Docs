# AI 知识花园数据骨架

设计见 [ai-garden-design.md](../../docs/ai-garden-design.md)。本目录尚未被生产 React 页面导入；React Flow 和 ELK 目前是技术选型，而非已经安装或上线的功能。

- blueprint.json：编辑导航、规范概念 ID、跨领域阅读关系、学习路径与现有文章绑定。默认 outline，不把大纲等同完整知识。
- microscopes/attention-3x2.json：人为构造的教学计算输入、期望约束与未来交互规格，不是已上线模拟器。
- 文章正文继续由现有 content/articles.json、content/spaces.json、MD 和研究 JSON 管理。不得复制产品价格、榜单行和长文到节点内。

运行 `node scripts/validate-garden.mjs` 和 `node scripts/test-garden.mjs`。独立的 Validate AI garden framework 工作流自动运行这两个检查；当前生产部署工作流保持不变。这些检查不等于画布浏览器测试，也不构成研究事实核验。

需要 renderer-independent 图数据时执行：

```sh
node scripts/validate-garden.mjs --emit /tmp/nextchina-garden.json
```

知识节点不保存坐标、选中状态或 React Flow 类型。布局与读者状态属于视图层。只有显式的文章绑定表示有阅读入口；编辑关联不是因果关系。教程入口中的 Apple 视频仍指向原 articleId 和教程分类。
