import type { DocChapter } from '../types';

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
}

const premiumVideoMarkdown = `---
title: 苹果风格高端产品视频制作框架
slug: apple-style-premium-product-video
---

> 本文整理自 leo（@leomeethewoo）2026 年 9 月 25 日发布的产品视频方法论。作者团队当季为 Trust Wallet、fomo、PrizePicks 等公司制作了 50 余支产品视频。下文是结构化中文汇总，不是原文逐字翻译。

苹果产品视频让人觉得“贵”，通常不是因为特效堆得更多，而是因为每个选择都像事先被规定好了。强品牌卖的不是功能清单，而是一种身份：用过这个产品的人，会觉得自己被归入更讲究的一类。

视频的目标因此也不同。对已经认识品牌的人，重点不是再介绍一次品牌名，而是强化“用它会显得更特别”的感觉。

## 1. 品牌：用规则制造高级感

意图先于技法。字体、背景、配乐、色板，每一样都要能回答“为什么是这个，而不是别的”。

很多视频显得廉价，不是因为能力不够，而是因为规则太松：特效实验过多、无意义音效、rap 或过嗨的配乐突然插入，都会把品牌从“克制”拉回“热闹”。

可执行的约束通常比灵感更重要：

- 同一类视频只保留 3 个主色
- 背景体系保持稳定，不每支片子换一套世界
- 同类项目使用相近的音乐气质
- 不做任何会降低高级感的装饰

观众感受到的不是“这次碰巧好看”，而是“他们决定就该这样”。后面的设计、动画、声音，都应服从这套规则。

## 2. 设计：先画清楚，再谈动效

很多人以为高端产品视频等于请一位很强的 Motion Designer。苹果式做法相反：先把设计系统做稳，再进入动画。

他们长期维护字体、留白、背景和构图规范，并让产品设计师深度理解这套风格。作者团队的做法类似：由全职产品设计师先在 Figma 里逐帧故事板，确认每一帧本身站得住，再交给动画。

常用构图原则：

| 原则 | 含义 |
| --- | --- |
| 一镜一意 | 每个镜头只承担一个信息，不把卖点和装饰塞进同一帧 |
| 给画面呼吸 | 主体周围留白，避免元素互相抢注意力 |
| 关键物居中 | 产品、界面或手势放在视觉中心 |
| 背景服从主体 | 背景符合品牌规范，不能压过主对象 |

没有好设计，后期再补运动也很难“贵”起来。顺序应是：品牌规则 → 静态设计 / 故事板 → 动画。

## 3. 动画：让运动看起来更贵

动画负责把已经成立的设计变成时间。作者强调三类手法。

### 平滑，而不是匀速

线性运动容易显得机械、廉价。给关键帧加缓动，并让不同属性的运动略微错开（overlap），过渡会更接近物理世界里的惯性。

### 动态转场，而不是硬切

场景与场景之间尽量用连续过渡，让后一镜像从前一镜长出来。除非叙事必须停顿，否则避免直切。

### 自适应节奏

整支片子不必保持同一速度。铺垫可以慢，揭示可以加快，收尾可以再落下。节奏变化要服务信息密度，而不是为了炫技。

## 4. 配乐：用 BPM 控制气质

音乐直接决定视频能量。作者给出一组可当起点的 BPM 区间：

| BPM | 气质 |
| --- | --- |
| 60–80 | 庄重、电影感、有传承感 |
| 90–110 | 平滑、冷静、不费力 |
| 115–123 | 精英、有动能、精致 |
| 更高 | 驱动和炒热，只适合特定项目，用错会破坏高级感 |

选定速度后再选类型。同一 BPM 下，室内乐、合成器和后摇会指向完全不同的人群。配乐要服从品牌规则，而不是编辑个人口味。

## 5. 音效：少，而且必须有用

音效是最后一层，也最容易把视频做“花”。原则与品牌部分相同：不重要的声音不要出现。

完成混音后，回听并逐条提问：

- 这个声音是否太大、太跳，或风格不匹配？
- 它是否帮助理解产品，或只是在制造忙碌感？
- 拿掉之后，信息是否仍然清楚？

只要答案偏向“装饰”，就删。高级感往往来自减法。

## 可复用工作流

1. 先写品牌规则：三色、背景、字体、音乐气质、禁止项。
2. 在 Figma 完成逐帧故事板，确认静态构图成立。
3. 用缓动、重叠和连续转场做动画，按段落调整速度。
4. 按目标气质选 BPM 和曲风，避免过嗨配乐破坏调性。
5. 只保留解释产品或稳住节奏的音效，其余全部拿掉。

这套方法的重点不是模仿苹果的某个转场，而是模仿它的决策方式：少做偶然的事，让观众相信每个选择都是故意的。

## 来源

- 原文：[leo / @leomeethewoo，2026-09-25](https://x.com/leomeethewoo/status/2103529310208606701)
- 作者此前一篇更偏表层的苹果视频笔记：[相关帖](https://x.com/leomeethewoo/status/2098032450731720823)
- 整理日期：2026-09-27
- 说明：本文为中文结构化汇总，供 NextCHINA 文档库阅读，不替代原文。
`;

const premiumVideoContent = stripFrontmatter(premiumVideoMarkdown);

const premiumVideoChapter: DocChapter = {
  id: 'apple-style-premium-product-video',
  slug: 'apple-style-premium-product-video',
  title: '苹果风格高端产品视频制作框架',
  subtitle: '从品牌意图、设计、动画、配乐到音效的可复用制作方法',
  category: 'craft',
  categoryName: '创作与影像',
  readTime: `${Math.max(1, Math.ceil(premiumVideoContent.length / 800))} 分钟`,
  date: '2026-09-27',
  tags: ['创作与影像', '产品视频', 'Apple', 'Motion Design', '品牌'],
  excerpt: '从品牌意图、设计、动画、配乐到音效的可复用制作方法',
  content: premiumVideoContent
};


const llmEssenceMarkdown = String.raw`
> **一句话理解：**LLM（Large Language Model，大语言模型）的核心，是学习 token 序列的条件概率分布。它把语言变成数字表示，通过 Transformer 反复计算上下文关系，再预测接下来最可能出现的 token。聊天、编码、RAG、工具调用和 Agent，是建立在这个基础模型之上的不同系统层。

## 1. LLM 到底是什么？

最常见的误解，是把 LLM 想成一个极其庞大的知识数据库。数据库更接近“找到记录并返回”；自回归语言模型则是在已有 token 条件下计算下一个 token 的概率。

~~~text
已有 token → 神经网络 → 下一个 token 的概率 → 选择 token → 放回上下文 → 继续预测
~~~

GPT-3 的研究明确采用自回归语言模型，并展示了 zero-shot、one-shot 与 few-shot 的 in-context learning：不更新模型参数，只给任务说明和少量示例，模型也可能适应新任务。[2]

所以更准确的定义是：**LLM 是一个在高维表示空间中学习语言、代码与知识统计结构，并通过条件概率连续生成 token 的神经网络。**

## 2. Token：模型真正读取的不是文字

Tokenizer 把文本编码成 token，再映射为整数 ID。token 可能是词、词的一部分、汉字、标点或字节组合，取决于具体 tokenizer。

~~~text
自然语言 → Tokenizer → Token IDs → 神经网络
~~~

Token 同时影响上下文长度、API 计费、不同语言的编码效率以及推理序列长度。因此“10 万字”和“多少 token”不是同一概念。

## 3. Embedding：把离散符号变成连续空间

Token ID 只是编号。Embedding 矩阵把 token 映射成高维向量。进入 Transformer 后，这些表示会随上下文逐层改变。

“苹果电脑”和“吃一个苹果”里的“苹果”虽然输入符号可能相同，但上下文化后的隐藏状态不同。意义并不是简单储存在一个静态词向量里，而是在多层网络的关系中形成。

## 4. Transformer：现代 LLM 的核心骨架

2017 年《Attention Is All You Need》提出 Transformer，以 attention 为核心进行序列建模，并显著提高训练并行性。[1]

~~~text
Tokens
  ↓
Embedding + Position
  ↓
Transformer Block × N
  ├─ Self-Attention
  ├─ MLP / FFN
  ├─ Residual
  └─ Normalization
  ↓
Hidden States → LM Head → Logits → Decoding → Next Token
~~~

现代模型在 attention、MLP、MoE、normalization、位置机制等方面存在大量差异，因此这是一张原理图，不是所有模型完全相同的实现图。

## 5. Attention 到底在算什么？

经典 attention 中，每个位置的表示产生 Query、Key、Value。

| 名称 | 直觉 |
| --- | --- |
| Query | 当前需要寻找什么 |
| Key | 每个位置可以用什么特征被匹配 |
| Value | 匹配后真正聚合什么信息 |

Query 与 Key 的关系经过归一化后成为权重，再加权聚合 Value。[1] Multi-Head Attention 让多组 attention 在不同表示子空间并行工作。但 attention 权重不能简单等同于“模型为什么这样思考”的完整解释。

## 6. Position：模型为什么知道先后顺序？

只有 token 内容还不够。“人咬狗”和“狗咬人”的顺序不同，意义也不同。

原始 Transformer 使用位置编码；后来出现 RoPE 等方案。RoPE 用旋转方式把位置信息加入 attention 表示，并包含相对位置关系。[5]

长上下文能力因此不只是“窗口数字”，还受到位置机制、训练分布、attention 实现和长上下文训练质量影响。

## 7. MLP：Transformer 不等于 Attention

Transformer block 通常还包含占据大量参数和计算的前馈网络。

- Attention：让序列中的信息交互与路由；
- MLP：进一步非线性变换每个位置的表示；
- Residual：保留并累积信息；
- Normalization：帮助深层网络稳定训练。

能力来自大量层反复进行这些变换，而不是一个 attention 公式单独产生。

## 8. 参数与训练：模型究竟学了什么？

~~~text
训练文本 → 预测 next token → Loss → Backpropagation → Gradient + Optimizer → 更新参数
~~~

参数不是“参数 10001 = 法国、参数 10002 = 巴黎”这样的知识表。知识、语言规律和计算模式以分布式方式存在于大量权重和运行时激活中。

## 9. 为什么预测下一个 token 能产生复杂能力？

因为要持续预测正确，模型必须压缩训练数据里的大量结构。预测科学文本需要知识关系；补全代码需要语法、API 和算法模式；续写长文需要人物、主题和远距离依赖。

但神经网络如何形成抽象概念、算法与推理机制，仍是活跃研究问题。

## 10. Scaling：参数越大一定越好吗？

不是。Scaling-law 工作发现 loss 会随模型规模、数据和计算呈现规律性趋势。[3] Chinchilla 进一步说明，在固定计算预算下，模型规模和训练 token 数需要协调扩展，只增加参数并非计算最优。[4]

~~~text
能力 ≈ Architecture × Parameters × Data × Data Quality × Compute × Optimization × Post-training × Inference-time Compute
~~~

这也是为什么 NextCHINA 不应该用“参数量最大”替代模型能力评价。

## 11. Base Model 为什么还不是好助手？

Pretraining 首先教模型预测文本；用户真正需要的是遵循意图。

InstructGPT 展示了 supervised fine-tuning 加人类反馈训练的一条经典路径，并说明模型更大本身不保证更符合人的意图。[6]

~~~text
Pretraining → Base Model → Instruction / Preference Training → Assistant Model
~~~

现代厂商采用的后训练方法更加多样，不能把所有模型都描述为完全相同的 RLHF 流程。

## 12. Prompt、RAG、Fine-tuning、LoRA 有什么不同？

| 方法 | 改模型参数？ | 作用 |
| --- | --- | --- |
| Prompt | 否 | 给当前请求条件 |
| In-context learning | 否 | 用上下文示例定义任务 |
| RAG | 通常否 | 注入外部资料 |
| Full fine-tuning | 是 | 长期改变模型 |
| LoRA | 训练增量参数 | 低成本长期适配 |

LoRA 冻结原模型权重，在部分层加入低秩可训练矩阵，从而大幅减少需要训练的参数量。[7]

## 13. 推理时一句话怎样生成？

~~~text
Prompt → Tokenizer → Token IDs → Embedding → Transformer × N → Logits → Decoding → 新 token → 循环
~~~

Logits 是词表候选的未归一化分数。Temperature、top-p 等 decoding 设置会影响最终选择，所以相同 prompt 不必产生完全相同回答。

## 14. KV Cache：为什么历史计算可以复用？

Attention 中历史 token 的 Key 和 Value 可以缓存，生成新 token 时复用，这就是 KV cache 的基本思想。

~~~text
历史 token → K / V → Cache
                       ↑
新 token → Query ──────┘
~~~

它显著加速生成，但上下文越长，缓存通常也越大，所以 context window 同时是算法和系统工程问题。

## 15. FlashAttention：模型速度不只由模型决定

标准 self-attention 在长序列上计算和内存成本高。FlashAttention 用 IO-aware tiling 减少 GPU 高带宽内存与片上 SRAM 之间的数据搬运，在保持 exact attention 的情况下提高速度并降低内存开销。[8]

真实 AI 服务性能同时取决于 GPU、kernel、memory bandwidth、quantization、batching、cache 和 decoding。

## 16. Reasoning 是不是模型像人在脑中说话？

不能简单这样理解。模型内部是高维张量计算，不是我们可以直接读取的自然语言独白。

当 reasoning 系统允许更多推理 token、候选、验证、搜索、代码执行或其他 inference-time compute 时，模型获得更多解决问题的计算过程。

更稳妥的定义是：**reasoning model 通过训练与推理机制，在复杂问题上投入更多有效计算，提高多步问题求解表现。**

## 17. RAG、工具和 Agent 都不是 LLM 本体

~~~text
RAG:   Question → Search → Evidence → LLM → Answer
Tool:  LLM → Tool/API → Result → LLM
Agent: Goal → Model → Action → Environment → Observation → Model
~~~

RAG 增加外部信息；Tool 增加外部行动能力；Agent 增加循环执行和状态管理。**LLM 是模型层；RAG、Tool、Agent 是系统层。**

## 18. 为什么 LLM 会幻觉？

因为它不是“没有记录就返回 NULL”的数据库。即使知识不足、上下文错误或推理失败，它仍然要对下一个 token 给出概率分布。

RAG、引用、搜索、验证器和工具可以降低错误，但不能自动把概率生成模型变成绝对可靠的事实机器。

## 19. 应该怎样比较 LLM？

| 维度 | 真正的问题 |
| --- | --- |
| Knowledge | 参数知识覆盖到哪里 |
| Reasoning | 多约束问题能否组合正确 |
| Coding | 能否理解、修改和验证代码 |
| Long Context | 长输入是否真的利用正确 |
| Instruction Following | 是否遵循复杂要求 |
| Tool Use | 工具选择与参数是否可靠 |
| Multilingual | 多语言能力是否均衡 |
| Latency | 首 token 与持续生成速度 |
| Cost | 输入、输出、缓存和工具总成本 |
| Reliability | 多次运行是否稳定 |
| Factuality | 事实是否有证据支持 |

“总榜第一”只能回答其中很少的问题。

## 20. 把 LLM 压缩成一张图

~~~text
文本 / 代码
    ↓
Tokenizer → Tokens → Embedding + Position
    ↓
Transformer × N
Attention + MLP + Residual + Norm
    ↓
Hidden Representation → LM Head → Logits
    ↓
Decoding → Next Token → 循环
~~~

LLM 的“魔法”最终可以拆回四件事：**表示、计算、训练、生成。**

## 参考资料

1. Vaswani et al., Attention Is All You Need, 2017 — https://arxiv.org/abs/1706.03762
2. Brown et al., Language Models are Few-Shot Learners, 2020 — https://arxiv.org/abs/2005.14165
3. Kaplan et al., Scaling Laws for Neural Language Models, 2020 — https://arxiv.org/abs/2001.08361
4. Hoffmann et al., Training Compute-Optimal Large Language Models, 2022 — https://arxiv.org/abs/2203.15556
5. Su et al., RoFormer / Rotary Position Embedding, 2021 — https://arxiv.org/abs/2104.09864
6. Ouyang et al., Training language models to follow instructions with human feedback, 2022 — https://arxiv.org/abs/2203.02155
7. Hu et al., LoRA, 2021 — https://arxiv.org/abs/2106.09685
8. Dao et al., FlashAttention, 2022 — https://arxiv.org/abs/2205.14135
`;

const llmEssenceChapter: DocChapter = {
  id: 'llm-how-it-works',
  slug: 'llm-how-it-works',
  title: 'LLM 的本质：大语言模型究竟是如何运转的？',
  subtitle: '从 Token、Embedding、Attention 到训练、推理、KV Cache、RAG 与 Agent',
  category: 'foundations',
  categoryName: 'AI 基础原理',
  readTime: String(Math.max(1, Math.ceil(llmEssenceMarkdown.length / 800))) + ' 分钟',
  date: '2026-09-27',
  tags: ['LLM', 'Transformer', 'Attention', 'Token', 'Embedding', '推理', 'KV Cache'],
  excerpt: '从微观计算到宏观系统，一篇讲清大语言模型真正如何工作。',
  content: llmEssenceMarkdown.trim()
};

export const ESSAY_CHAPTERS: DocChapter[] = [premiumVideoChapter, llmEssenceChapter];

