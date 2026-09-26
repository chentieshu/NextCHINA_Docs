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


const vlmEssenceMarkdown = String.raw`
> **一句话理解：**VLM（Vision-Language Model，视觉语言模型）的关键不是“给 LLM 接一张图片”，而是把视觉信号转换成可学习的表示，并让视觉表示与语言表示对齐、交互，使模型联合处理“看见什么”和“如何用语言理解、推理与回答”。

## 1. 为什么需要 VLM？

传统视觉模型往往解决分类、检测、OCR、分割等特定任务；LLM 擅长语言生成、问答、解释和指令执行。VLM 把两者连接起来。

~~~text
Image / Video
     ↓
Visual Representation
     ↓
Multimodal Alignment / Fusion
     ↕
Language Representation
     ↓
Understanding / Reasoning / Generation
~~~

因此它可以完成图片描述、视觉问答、文档理解、图表分析、OCR 后推理和视频理解等任务。

## 2. 图片进入模型后还是“图片”吗？

不是。一张 RGB 图片本质上是大量像素数值，模型必须把高维像素转换成更适合计算的视觉表示。

Vision Transformer（ViT）给出了影响深远的方案：把图片切成 patch，把 patch 变成序列表示，再交给 Transformer。[1]

~~~text
Image → Patches → Patch Embeddings → Vision Transformer → Visual Features
~~~

所以“看图”的第一步，本质上仍然是**表示学习**。

## 3. Visual Token 是什么？

为了让视觉信息进入多模态 Transformer，图像通常会被编码成一组视觉特征或 visual tokens。

但 visual token 不是统一行业单位。不同模型可以使用不同分辨率、patch 大小、动态切图、压缩器、resampler 或 token reduction。

~~~text
大量像素
   ↓ 压缩与编码
视觉表示 / Visual Tokens
   ↓
跨模态计算
~~~

压缩越强，计算通常越省，但细粒度视觉信息也可能损失。这是 VLM 的核心工程 trade-off 之一。

## 4. CLIP：视觉和语言为什么能对齐？

CLIP 是理解现代 VLM 的关键节点。

它用大规模图像-文本配对数据，让图像编码器和文本编码器学习匹配关系：正确图文组合在表示空间中更接近，不匹配组合更远。[2]

~~~text
Image → Image Encoder ─┐
                       ├→ Alignment
Text  → Text Encoder ──┘
~~~

CLIP 使用 4 亿图文对训练，并展示了自然语言作为视觉监督信号的可扩展性。[2]

语言因此不只是输出，也可以成为理解视觉世界的监督接口。

## 5. VLM 并没有唯一架构

VLM 是一类模型，不是一种固定电路。

### 双编码器对齐

CLIP 类模型分别编码图像和文本，重点学习两种表示之间的匹配。它适合检索、zero-shot 分类等任务，但并不天然等于生成式聊天助手。

### Vision Encoder + Connector + LLM

~~~text
Image → Vision Encoder → Projector / Q-Former → LLM → Text
~~~

BLIP-2 使用冻结视觉编码器和冻结 LLM，并用轻量 Q-Former 跨越模态差距。[4]

LLaVA 则展示了把视觉编码器连接到 LLM，再做 visual instruction tuning 的路线。[5]

### 交错视觉-文本模型

Flamingo 连接预训练视觉和语言模型，通过跨模态机制处理任意交错的图片、视频与文本，并展示多模态 few-shot learning。[3]

### 更统一的原生多模态模型

现代系统越来越强调 text、image、audio、video 的联合训练。公开的 2026 Gemini 模型卡将 Gemini 系列描述为 natively multimodal reasoning models；Gemini 3.6 Flash 支持文本、图像、音频和视频输入。[7]

但“原生多模态”不意味着所有厂商内部架构相同。商业模型往往不会公开完整实现。

## 6. Connector 为什么关键？

视觉编码器输出的空间，与 LLM 已经学到的语言表示并不天然兼容。

因此很多架构需要一座桥：

~~~text
Vision Feature Space → Connector → Language-compatible Space
~~~

Connector 可能是 linear projector、MLP、Q-Former、resampler、cross-attention 或更统一的 joint transformer。

BLIP-2 的 Q-Former 就是在冻结视觉编码器和冻结 LLM 之间建立信息桥梁。[4]

所以视觉能力不只取决于 vision encoder，还取决于视觉信息能否有效进入语言推理网络。

## 7. VLM 怎样回答“图里有什么”？

以常见架构为例：

~~~text
Image
 ↓
Resize / Tile / Normalize
 ↓
Vision Encoder
 ↓
Visual Features
 ↓
Projector / Connector
 ↓
Visual Tokens
 ↓
与文本 Prompt 组成多模态上下文
 ↓
Transformer
 ↓
Text Answer
~~~

这并不意味着所有系统都是“先完整识图，再把识别结果写成一句话交给 LLM”。现代端到端 VLM 可以直接在隐藏表示层进行视觉-语言交互。

## 8. Visual Instruction Tuning 为什么重要？

一个会图文匹配的模型，不一定会按照人的自然语言指令进行视觉对话。

LLaVA 的 Visual Instruction Tuning 把视觉编码器与 LLM 连接，并使用多模态指令数据训练模型按照自然语言要求理解图片。[5]

~~~text
会表示图像 ≠ 会按照人的要求讨论图像
~~~

因此 VLM 能力至少包含：

1. 看见：视觉表征；
2. 对齐：视觉和语言建立关系；
3. 听懂要求：多模态 instruction/post-training。

## 9. OCR、图表和文档为什么特别难？

自然图片中的“猫”与 PDF 里的 8px 小字不是同一种视觉任务。

文档理解需要同时处理小字体、高分辨率、二维布局、表格、阅读顺序、图表、多栏结构和跨页关系。

如果输入被缩得太小，文字可能在视觉编码阶段已经丢失。因此现代 VLM 会使用高分辨率输入、动态 tiling、多尺度编码或专门文档数据。

> **上下文窗口很大，不代表视觉细节一定被保留下来。**

## 10. 为什么 VLM 会数错东西？

“图中有几个苹果”要求模型分离对象、保持对象身份、避免重复计数，再把实例映射到数字概念。

如果视觉表示没有稳定保存实例级信息，或语言先验过强，模型就可能生成“看起来合理”的错误数字。

所以 caption 能力强，不代表 counting、grounding 和空间能力同样强。

## 11. 空间推理为什么仍然困难？

模型可能知道“桌上有杯子”，却不一定稳定回答精确距离、前后遮挡或 3D 关系。

普通互联网图文数据通常更强调“是什么”，而不是精确几何。SpatialVLM 等研究显示，加入高质量空间推理数据能够显著改善相关能力，说明空间能力并非只靠模型变大就自动完整出现。[6]

## 12. 视频为什么比单张图片更难？

视频增加了时间轴。

~~~text
Frame t1
Frame t2
Frame t3
...
   ↓
Spatial + Temporal Representation
   ↓
Multimodal Reasoning
~~~

模型不仅要识别画面，还要理解事件先后、对象持续存在、动作、因果变化和长视频关键片段。

如果每一帧都高分辨率 token 化，计算量会迅速增加，所以视频理解必须在采样、压缩、时序表示和上下文预算之间取舍。

2026 年 Gemini 3.6 Flash 的公开模型卡已把 image、audio、video 与 text 共同列为输入，并支持最高 1M token context。[7] 这代表产品级多模态理解已经远超早期“图片问答”的范围。

## 13. VLM 和图像生成模型是一回事吗？

不是。

~~~text
VLM: Image → Understanding → Language

Image Generator:
Text / Image Condition → Generative Model → Pixels
~~~

一个产品可以同时集成理解模型和生成模型，但概念上仍应区分 Vision Understanding、Vision-Language Reasoning 和 Image Generation。

“能看图”不自动等于“能生成高质量图片”。

## 14. VLM 与 LLM 到底是什么关系？

很多 VLM 可以理解成：

> **LLM 的语言/推理能力 + 视觉表示能力 + 跨模态连接与训练。**

但这不是所有 VLM 的唯一结构定义。

~~~text
LLM
Text → Tokens → Transformer → Text

VLM
Image → Visual Representation ─┐
                               ├→ Multimodal Model → Text / Action
Text  → Language Tokens ───────┘
~~~

VLM 新增的核心问题是：**如何让不同模态变成能够互相交流的表示。**

## 15. 为什么语言先验会让模型“看错”？

如果图片很模糊，但问题是“这个人在网球场拿着什么”，语言世界里的“网球场 + 人”高度关联“球拍”。

视觉证据弱而语言先验强时，模型可能回答“球拍”，即使真实图片不是。

~~~text
视觉证据弱 + 语言先验强 → 合理但视觉上错误的回答
~~~

因此评估 VLM 必须检查答案是否真正 grounded in image，而不只是语言上合理。

## 16. 分辨率、Visual Tokens 与成本

更高分辨率通常可以保留更多细节，但也会增加视觉编码和多模态计算成本。

~~~text
Higher Resolution
      ↓
More / richer visual representation
      ↓
More Compute / Memory
~~~

真实系统会通过 patch、tiling、resampling、token compression 等方式控制成本。

所以“图片输入价格”背后实际上涉及图像尺寸、视觉表示数量、编码器成本、多模态上下文和输出 token。

## 17. VLM 应该怎样评测？

| 能力 | 应该测试什么 |
| --- | --- |
| General VQA | 是否理解一般图片 |
| OCR | 小字和复杂文字 |
| Document | PDF、表格和布局 |
| Chart | 图表读数与推理 |
| Grounding | 是否对应正确对象/区域 |
| Counting | 实例数量 |
| Spatial | 2D/3D 空间关系 |
| Video | 时间和事件理解 |
| Multilingual Vision | 非英语图文 |
| Hallucination | 是否脱离视觉证据 |
| Long Multimodal Context | 多图/长视频信息保持 |
| Latency / Cost | 实际部署效率 |

因此“VLM 第一名”同样必须先问：在哪个视觉任务上？

## 18. 从 CLIP 到现代多模态模型发生了什么？

~~~text
视觉分类
   ↓
图文对齐：CLIP
   ↓
视觉编码器 + LLM：BLIP-2 / LLaVA
   ↓
交错图文上下文：Flamingo 等
   ↓
更统一的多模态训练
Text + Image + Audio + Video
   ↓
Multimodal Reasoning + Agent
~~~

这不是严格的单线历史，也不是所有模型都沿同一技术路线，而是一张理解技术方向的地图。

## 19. VLM 的边界在哪里？

今天的 VLM 已经很强，但仍不能简单等同于人类视觉。它可能看漏细小对象、OCR 出错、计数错误、空间关系错误、图表读错坐标、在模糊视觉证据下依赖语言猜测，或在长视频中遗忘关键片段。

专业应用应把“模型回答”和“视觉证据”分开保存，必要时结合 OCR、检测器、搜索、代码和领域工具验证。

## 20. 把 VLM 压缩成一张图

~~~text
真实视觉世界
     ↓
Image / Video Pixels
     ↓
Vision Encoder / Visual Tokenizer
     ↓
Visual Representations
     ↓
Connector / Cross-modal Alignment
     ↓
Multimodal Transformer
+ Language Knowledge
+ Reasoning
     ↓
Language / Action / Tool Call
~~~

VLM 的本质可以压缩成四件事：

> **视觉表示、跨模态对齐、联合计算、语言/行动输出。**

它与 LLM 最深层的连接是：两者都在把复杂世界压缩成可计算的表示，再通过大规模训练学习这些表示之间的关系。

## 参考资料

1. Dosovitskiy et al., Vision Transformer, 2020 — https://arxiv.org/abs/2010.11929
2. Radford et al., CLIP, 2021 — https://arxiv.org/abs/2103.00020
3. Alayrac et al., Flamingo, 2022 — https://arxiv.org/abs/2204.14198
4. Li et al., BLIP-2, 2023 — https://arxiv.org/abs/2301.12597
5. Liu et al., Visual Instruction Tuning / LLaVA, 2023 — https://arxiv.org/abs/2304.08485
6. Chen et al., SpatialVLM, 2024 — https://arxiv.org/abs/2401.12168
7. Google DeepMind, Gemini 3.6 Flash Model Card, 2026 — https://deepmind.google/models/model-cards/gemini-3-6-flash/
`;

const vlmEssenceChapter: DocChapter = {
  id: 'vlm-how-it-works',
  slug: 'vlm-how-it-works',
  title: 'VLM 的本质：AI 究竟是如何“看懂”图片和视频的？',
  subtitle: '从 Pixels、Patch、Vision Encoder 到 Visual Token、跨模态对齐与多模态推理',
  category: 'foundations',
  categoryName: 'AI 基础原理',
  readTime: String(Math.max(1, Math.ceil(vlmEssenceMarkdown.length / 800))) + ' 分钟',
  date: '2026-09-27',
  tags: ['VLM', 'Multimodal', 'Vision Transformer', 'CLIP', 'Visual Token', 'LLaVA', '视频理解'],
  excerpt: '从像素到语言，一篇讲清视觉语言模型如何把视觉世界变成可以推理的表示。',
  content: vlmEssenceMarkdown.trim()
};

export const ESSAY_CHAPTERS: DocChapter[] = [premiumVideoChapter, llmEssenceChapter, vlmEssenceChapter];

