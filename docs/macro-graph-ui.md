# 宏观关系图 UI 重设计（对齐当前工作区）

> 实现基线：`src/features/workspace/model.ts` 的 `graphProjection`、`WorkspaceGraph.tsx`、`GardenCanvas.tsx`。
> 不换 React Flow / ELK，不改文章 ID、榜单和报价。边仍是编辑关系，不是因果。

## 问题

当前关系视图把所有尺度画成同一张 240×124 卡片流程图。全库图是「文档挂在专题上」，局部图几乎只有目录孩子。点击卡片会立刻离开图。

## 三种投影

| 投影 | 何时 | 节点 | 边 |
| --- | --- | --- | --- |
| Atlas | `scope=root:ai` | 4 个阅读目的 + 14 领域 + 已启用专题中心 | 目的→领域→专题 |
| Explore | 领域 / hub / branch | 当前节点、孩子、绑定文档、概念引用、知识图一跳 | 目录归属 + related + recommended_before |
| Documents | Atlas 上的「文档」开关 | 28 篇规范文档及其收录专题 | 收录 + 正文链接 |

单击选中；「查看 {标题}」才进入阅读；「展开」换 scope。悬停高亮邻域。图例可关边类型。
