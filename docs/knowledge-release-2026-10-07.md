# 2026-10-07 知识资料与发布闭环

基线：main@300a646。保持 407 个 canonical 概念，不用新增概念数量冒充内容完成。

## 本轮内容

新增三篇独立讲解：Transformer 模块、温度与 Top-k/Top-p/Beam Search、RAG 检索与证据验证。每篇有输入输出、可运行 Python 算例、负例、适用条件、失败边界和原始来源。修复既有 Softmax 文章与 temperature 概念的漏绑定。Transformer 与 RAG 使用明确的小型专题大纲接入已有共享内容，不自动生成全套空模板。

## 可复算的变化

| 指标 | 基线 | 本轮 |
| --- | ---: | ---: |
| Canonical 概念 | 407 | 407 |
| 全图节点（含导航入口） | 630 | 638 |
| 公开文档 | 28 | 31 |
| 独立讲解文章 / Python 算例 | 5 | 8 |
| 直接绑定独立讲解的概念 | 15 | 27 |
| 类型化科学/工程边 | 15 | 40 |
| 有明确来源和适用范围的 source-checked 边 | 0 | 34 |
| part_of / trained_with / evaluated_by | 0 / 0 / 0 | 5 / 5 / 3 |

`source-checked` 仅表示本轮作者核对来源，全部保留 `needs-independent-review`；不是独立审核或专家认证。讲解绑定也不是对整个学科知识点完成度的认证。剩余 380 个概念没有直接绑定独立讲解，372 个没有 source-checked 语义边。未修改榜单和报价的核验日期。

## 逻辑与显示

生成器、索引、渲染器和测试共享 graphContract.js。专题引用、映射、阅读建议和规划路径不能把空大纲提升成已建知识。领域只作导航锚点，选中待写节点可临时定位。图上显示名增加上下文但 canonical ID 和侧栏短名不变。取消旧投影临时制造路径边；路径仍由构建器统一物化。

## 维护与发布

`npm run audit:knowledge` 输出完整缺口；构建生成 knowledge-health.json 与 version.json，带本次 GITHUB_SHA。每轮修改依 AGENTS.md 执行：验证、提交、PR 全部检查通过、合并、生产测试、Wrangler、线上首页与统计版本核验。代码构建成功不能代替部署成功，最终结果以对应 Actions 记录及线上版本为准。

本地完成结构、来源引用契约、12 个语义负例、8 个文章算例的运行验证；依赖安装、TypeScript、Markdown 渲染和完整 Playwright 由 GitHub Actions 对最终提交运行。不能删除或跳过失败检查来发布。
