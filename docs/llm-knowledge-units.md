# LLM 独立知识单元：第一批内容与验证

## 本阶段与旧架构的关系

承接 `ai-topic-hubs-implementation.md`。此前阶段只有专题分支与旧资源聚合；本阶段新增五篇独立讲解，保留原总览和全部旧 URL，不把总览机械切成碎片，也不取消更细的待建设问题。

| 独立文章 | 实际专题位置 | 可运行例子 |
| --- | --- | --- |
| llm-tokenization | LLM / 表示与数学 / Token | 固定合并表与教学词表 |
| llm-softmax-temperature | LLM / 表示与数学 / Softmax | 稳定归一化、温度与有限差分 |
| llm-attention-calculation | LLM / 架构 / Attention | 3位置、2维单头的完整计算 |
| llm-training-loop | LLM / 训练 / 前向损失反向更新 | 两参数模型的一次 SGD |
| llm-kv-cache | LLM / 推理 / KV Cache | 形状到字节、变长批次与 GQA 假设 |

Attention 页解释一次完整计算，不表示 QKV、缩放、多头等所有更细专著已经完成。共享概念仍然只有一个 ID；有独立资料也不自动将所有关联概念标成专家复核完成。

## 内容事实源

`content/articles.json` 的 `knowledgeUnit` 字段保存明确的概念绑定、分支位置、来源 URL、例子 ID 与关联资源。正文仍为 MD。构建时分别派生基础知识图的文章绑定、专题资源位置和 UI 元数据；无需修改历史 blueprint 与 proposed plan。

`scripts/knowledge-units.mjs` 校验这一元数据。`loadGarden` 将显式概念绑定纳入原有校验；`attachTopicHubs` 将独立文章接入对应分支。分支正文与概念资料均引用相同文章 ID。计价、榜单等旧 JSON 未被复制或更新。

冻结的大纲计划验证针对其原始文章集合；新增单元的覆盖由 `test:knowledge`、`test:hubs` 和 Markdown 验证共同保证，避免新增文章导致旧计划错误地要求重写历史。

## 内容边界

五篇文章均说明前置知识、输入输出、公式与形状、教学数值、错误边界、来源和后续阅读。引用原论文与官方文档；不存在真实商业模型权重、商业 API 调用、GPU 实测或专家认证。撰写日期与旧榜单核验日期分开。

独立讲解显示自己的证据说明，旧榜单和报价继续显示原有时间与未重新核验提示。不能使用统一的旧资源提示让新文章看起来只是目录调整，也不能用新文章日期让旧榜单看起来刚被核验。

## 验证方法

- `npm run test:knowledge` 从实际 MD 中提取带 `nextchina-example` 标记的 Python 代码，使用 `python3 -I` 在临时目录执行，并验证错误输入、内部断言和 Attention 与原数值样例的一致性。需要本机安装 Python 3；页面运行、部署后的静态站点不需要 Python 服务。
- `npm run build` 包含这项检查及所有原有数据、专题、Markdown 和类型验证。没有新增 npm 运行时依赖。
- `garden-knowledge.spec.ts` 在开发与生产测试中检查专题内阅读、公式、真实 Mermaid SVG、局部宽度、无阴影、文章往返与价格关联。原有 `diagrams.spec.ts` 自动包含注册的新文章。
- 来源 URL 存在于正文的检查不等于在线事实复核；教学例子运行成功不等于真实模型质量已被证明。

## 后续

独立细化 QKV、Mask、多头、位置编码、Loss、微调等单元；可操作的 Attention 画布实验和 VLM/RAG/Agent 专属内容仍待继续建设。当前交付的是可阅读与可复制运行的知识文章，不是假装已经完成整套互动课程。
