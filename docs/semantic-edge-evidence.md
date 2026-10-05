# 语义关系证据与待澄清项

核验日：2026-10-05。检查对象是并发主线 `300a6468` 引入的 15 条类型化语义关系，不含目录边、专题身份、分支引用、延伸阅读或建议先学关系。

本批保留全部关系的 source、target、type 和 reason；为有明确支持的 9 条补充 scope、来源版本/定位、支持说明及日期。6 条保留原始编辑状态并列出待解决问题。来源支持的是限定主张，不是系统实现审计、领域专家认可，也不把编辑判断变成科学事实。生成后的 assertionStatus 仍为 editorial，证据状态为 source-checked-needs-independent-review。

## 1. 有限定证据的 9 条

| 关系 | 证据与定位 | 适用范围与限制 |
| --- | --- | --- |
| decoding uses temperature | [Holtzman 等，v2 §3.3 式4](https://arxiv.org/html/1904.09751v2)；[Transformers v4.56.0 TemperatureLogitsWarper](https://huggingface.co/docs/transformers/v4.56.0/en/internal/generation_utils) | 启用温度缩放的采样，T>0，T=1 不改变分布；该接口需 do_sample=True。不是事实正确性保证 |
| decoding uses top-k-sampling | [同一论文 §3.2](https://arxiv.org/html/1904.09751v2)；[版本化 TopKLogitsWarper](https://huggingface.co/docs/transformers/v4.56.0/en/internal/generation_utils) 与[阈值实现](https://raw.githubusercontent.com/huggingface/transformers/v4.56.0/src/transformers/generation/logits_process.py) | 可选候选截断再采样；阈值实现遇到并列分数时可能保留超过 k 项，不承诺恰好 k 项 |
| decoding uses top-p-sampling | [同一论文 §3.1 式2–3](https://arxiv.org/html/1904.09751v2)；[v4.56.0 实现](https://raw.githubusercontent.com/huggingface/transformers/v4.56.0/src/transformers/generation/logits_process.py) | 本条讨论 0<p<1 的核采样；不是完整合法参数区间。该版本也接受 p=0 并保留 min_tokens_to_keep，边界与组合顺序依实现而定 |
| rag uses embedding-model | [Lewis 等，v4 §2.2、§2.4](https://arxiv.org/html/2005.11401v4) | 稠密向量检索型 RAG；论文实例为 DPR 的 BERT 查询/文档双编码器，不推广到全部检索系统 |
| rag uses reranker | [Anthropic Contextual Retrieval，Reranking 步骤1–4](https://www.anthropic.com/engineering/contextual-retrieval) | 可选检索后重排；作者报告特定联合配置的结果，不保证任意数据、检索器或重排器都提升质量 |
| agent uses tool-calling | [Anthropic Building effective agents，Agents、Appendix 2](https://www.anthropic.com/engineering/building-effective-agents) | 通过工具/API 与环境交互的 LLM Agent；模型提出工具请求与执行器实际运行是不同步骤，不覆盖所有 agent 定义 |
| q-learning uses bellman-equation | [Watkins 与 Dayan，§2 pp.280–281 式1–2](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf)；[DQN 原文 Methods: Algorithm，PDF pp.6–7](https://storage.googleapis.com/deepmind-media/dqn/DQNNaturePaper.pdf) | 经典一步更新采用即时奖励与下一状态最大动作价值构成的 Bellman 最优性目标；采样更新不等于每步精确求解方程 |
| dqn uses q-learning | [Mnih 等，Methods: Training algorithm for deep Q-networks，Algorithm 1，PDF p.7](https://storage.googleapis.com/deepmind-media/dqn/DQNNaturePaper.pdf) | 经典 DQN 用神经网络、经验回放和目标网络实现 Q-learning 更新；不继承表格型算法的收敛保证 |
| differential-privacy mitigates membership-inference | [Dwork 与 Roth，定义2.4、命题2.1及组合](https://www.cis.upenn.edu/~aaroth/Papers/privacybook.pdf)；[Abadi 等 v2，定义1、§3.1 Algorithm 1](https://arxiv.org/pdf/1607.00133v2) | 在明确的记录级相邻关系和整体 ε、δ 预算下限定成员检验的可区分性；不是消除推断。记录级不自动等于用户级；DP-SGD 还需裁剪、噪声、采样和覆盖全部发布的会计 |

差分隐私边中的成员检验界是显式推论：固定相邻数据集 D（含目标记录）与 D′（不含），对同一检验 A，定义 TPR=P[A(M(D))=1]、FPR=P[A(M(D′))=1]。将输出事件代入 DP 定义，再使用后处理性质，得到 TPR≤exp(ε)·FPR+δ。这里的 TPR/FPR 是对这对固定相邻数据集和机制 M 及检验 A（若随机）的随机性的概率，不直接冒充任意实测攻击集上的平均指标。

## 2. 暂不补证据的 6 条

| 原关系与原理由要点 | 已核实的材料 | 尚未解决的问题 |
| --- | --- | --- |
| llm uses transformer；“主流……通常” | [GPT-3 v4 §2.1](https://arxiv.org/html/2005.14165v4) 支持一个命名模型的架构 | 单个模型不能证明总体的“主流/通常”频率。需明确实例主张还是有定义的总体调查 |
| decoding uses softmax；“通常”从归一化分布选输出 | [Transformers v4.56.0 _sample](https://raw.githubusercontent.com/huggingface/transformers/v4.56.0/src/transformers/generation/utils.py) 的随机采样分支用 Softmax，贪心分支直接 argmax | 实现反例排除“每次必须”，也不提供“通常”的使用频率证据。需先确定所要表达的范围 |
| q-learning uses mdp；“在 MDP 框架下” | [Q-learning 原文 §2](https://www.gatsby.ucl.ac.uk/~dayan/papers/cjch.pdf) 支持 MDP 任务框架 | 当前 uses 策略描述实际采用的机制/算法/能力，框架关系是否属于它尚未定义；模型自由不要求已知转移模型。不能借补来源悄悄扩大谓词 |
| ppo uses policy-gradient；“属于……方法族” | [PPO v2 §1–3](https://arxiv.org/pdf/1707.06347v2) 同时提供家族与优化机制材料 | 现理由表达分类，而边是 uses。须先选择要保留的分类主张还是具体机制主张 |
| gan is_a generative-ai；“生成模型家族” | [GAN v1 摘要、§1末及§3](https://arxiv.org/pdf/1406.2661v1) 支持生成模型框架 | 目标 generative-ai 的本地边界比“生成模型家族”更宽，先明确对象层级再决定关系 |
| normalizing-flow is_a generative-ai；“显式密度生成模型家族” | [Normalizing Flows v6](https://arxiv.org/pdf/1505.05770v6) 同时讨论变分后验；[Real NVP v2](https://arxiv.org/pdf/1605.08803v2) 提供生成建模实例 | 一般可逆密度变换方法与生成模型实例不可混同；实例不能自动证明整个方法属于该宽泛本地类别 |

这些边仍存在于现有图中，未因本次核验被删除、重命名、换向或修改谓词。它们应进入后续概念边界审阅；本表也不代替对广义“生成式 AI”“解码”“使用”的独立定义。

## 3. 维护方式

- 可复现清单的 edges 保留完整原始元数据，缺证据、缺 scope、缺显式 provenance 分别计数
- validate-garden 对存在的证据检查日期、来源字段、HTTPS、重复 URL、范围与状态；没有证据的旧编辑边仍合法，测试不验证论文的真伪或支持力度
- 不因 URL 可达就宣称主张成立；后续更新须检查正文定位、版本和限定条件
- 本批 5 条 recommended_before 是学习建议，另有逐条教学理由，不算入这 15 条语义关系或其证据数量

全站范围与下一批顺序见[内容整理计划](content-organization-plan.md)，逐节点责任见[完整清单](content-inventory/README.md)。
