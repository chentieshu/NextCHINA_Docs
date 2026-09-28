# 宏观关系图 UI（按实际项目）

> 实现基线：`graphProjection`、`WorkspaceGraph`、`GardenCanvas`、`blueprint.json`、`hub-integration.json`。
> 不换 React Flow / ELK，不改文章 ID、榜单和报价。边仍是编辑关系，不是因果。

## 实际数据，不是学科系假图

库里已有且可画的东西：

- 4 个阅读目的（理解 / 构建 / 使用与评价 / AI 与世界）
- 14 个领域
- 18 个已启用专题中心
- 28 篇规范文档
- `learningPaths` 规划路线
- 三种边：`browse_child` / `related` / `recommended_before`

不把 77 个 topic、380 个 concept 一次倒进全库图。验证器目前也不接受新的科学边类型；骨干边仍是设计草案，不写进生产图。

## 四种投影

| 投影 | 何时 | 节点 | 边 |
| --- | --- | --- | --- |
| Atlas | 全库默认；可按阅读目的过滤 | 4 目的 + 14 领域 + 18 专题 | 目的→领域→专题 |
| Paths | 全库或局部的「路径」 | blueprint 学习路径 + 步骤概念/专题 | recommended_before |
| Explore | 领域 / hub / branch | 当前节点、孩子、绑定文档、一跳知识边 | 目录 + related + 先学 |
| Documents | 「文档」开关 | 28 篇规范文档及收录专题 | 收录 + 正文链接 |

`group:*` 与 `path:*` 只存在于投影，不写入知识图，也不进侧栏目录。点阅读目的只过滤 Atlas，不跳到空 scope。

5351选中；「查看 {标题}」才进入阅读；「展开」换真实 node scope。悬停高亮邻域。图例可关边类型。
