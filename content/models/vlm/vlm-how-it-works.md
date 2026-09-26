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

## 2.5 从像素到矩阵：视觉模型真正收到什么？

一张 RGB 图片可以写成张量：

\[
I\in\mathbb{R}^{H\times W\times 3}
\]

例如 1024×1024 图片包含：

\[
1024\times1024\times3=3,145,728
\]

个通道数值。模型不会把“三百万个像素值”直接当语言 token 使用，因此首先要压缩和结构化。

如果 ViT 的 patch 大小是 \(P\times P\)，不考虑额外切图时 patch 数约为：

\[
N=\frac{H}{P}\times\frac{W}{P}
\]

例如 224×224 图片、16×16 patch：

\[
N=14\times14=196
\]

每个 patch 展平后：

\[
x_p\in\mathbb{R}^{P^2C}
\]

再通过线性投影：

\[
z_p=x_pE+b
\]

进入 Transformer hidden dimension。

所以 Vision Transformer 的关键不是“把图片切块”这么简单，而是：

> **把二维连续视觉信号转换成有限长度的向量序列。**

这一步已经决定了模型后面能看到多少细节。

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

## 3.5 分辨率为什么直接影响 token 数和成本？

如果 patch size 固定，图像宽高同时放大 2 倍，patch 数近似变成 4 倍。

标准 self-attention 又需要比较 token 两两关系，因此视觉序列越长，计算和显存压力会快速上升。

这就是为什么高分辨率 VLM 经常使用：

- dynamic tiling；
- multi-scale encoding；
- resampler；
- token pruning / merging；
- region selection。

模型不是“看到原图全部像素之后再决定忽略什么”，很多信息可能在视觉编码阶段就已经被压缩。

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

### CLIP 的数学核心：对比学习

设一批训练数据有 \(N\) 对图像和文本。

图像编码器得到：

\[
v_i=f_{image}(I_i)
\]

文本编码器得到：

\[
t_i=f_{text}(T_i)
\]

常见相似度使用归一化后的 cosine similarity：

\[
s_{ij}=\frac{v_i^Tt_j}{\|v_i\|\|t_j\|}
\]

正确配对 \((i,i)\) 应该比错误配对 \((i,j)\) 更相似。

经过 temperature \(\tau\) 后，图像到文本方向的损失可以写成：

\[
L_{I\rightarrow T}
=
-\frac{1}{N}\sum_i
\log
\frac{\exp(s_{ii}/\tau)}
{\sum_j\exp(s_{ij}/\tau)}
\]

再对文本到图像方向做同样计算。

直觉：

~~~text
正确图文 → 拉近
错误图文 → 推远
~~~

这就是“视觉和语言进入可比较语义空间”的数学基础之一。[2]

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

## 5.5 Cross-Attention：视觉和文字怎样真正发生计算交互？

如果文本 hidden states 作为 Query，视觉 features 作为 Key/Value：

\[
Q=X_{text}W_Q
\]

\[
K=X_{vision}W_K,\quad V=X_{vision}W_V
\]

则跨模态 attention：

\[
Attention(Q,K,V)
=
softmax\left(\frac{QK^T}{\sqrt{d_k}}\right)V
\]

含义是：

> 当前语言位置根据自己的 Query，从视觉表示中选择性读取信息。

不同架构可以反过来、双向交互，或者把视觉 token 与文字 token 直接拼到统一 Transformer 中。因此“VLM 如何融合视觉”必须看具体模型，不能统一画成一种 connector。

## 6. Connector 为什么关键？

视觉编码器输出的空间，与 LLM 已经学到的语言表示并不天然兼容。

因此很多架构需要一座桥：

~~~text
Vision Feature Space → Connector → Language-compatible Space
~~~

Connector 可能是 linear projector、MLP、Q-Former、resampler、cross-attention 或更统一的 joint transformer。

最简单的线性 projector 可以写成：

\[
Z_{lang}=Z_{vision}W_p+b
\]

它不是把图片“翻译成一句文字”，而是把视觉特征投影到后续语言模型更容易消费的 hidden dimension / representation space。

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

## 11.5 视觉 Grounding 与“会说”为什么是两种能力？

Caption 只要求模型生成总体描述；grounding 还要求语言概念对应到具体像素区域、box、point 或 object。

例如：

~~~text
“红色杯子”
   ↓
语言概念
   ↓
必须对应 image 中某个区域
~~~

这需要模型保留更细的空间结构。

如果视觉 encoder 过早把大量局部信息压成少数 global tokens，模型可能知道“有杯子”，却不知道杯子精确在哪里。

因此：

> semantic understanding ≠ spatial grounding

同样，OCR 不是只识别“这是一张文档”，而是要求小尺度视觉 pattern 被保留到足以恢复字符。

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

假设每帧产生 \(N_v\) 个 visual tokens，采样 \(F\) 帧，未经额外压缩时序列长度近似：

\[
N_{video}\approx F\times N_v
\]

如果每帧 576 visual tokens、采样 100 帧，就是约 57,600 个视觉位置，再加文本 token。

这解释了为什么长视频模型必须认真处理：

- frame sampling；
- temporal pooling；
- token compression；
- key-frame selection；
- memory hierarchy。

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

## 19.5 VLM 训练实际上有多个目标层

现代 VLM 训练不能简化成一个 loss。

常见阶段可能包括：

~~~text
视觉自监督 / 分类预训练
        ↓
Image-Text Contrastive Alignment
        ↓
Caption / Next-token Training
        ↓
Multimodal Instruction Tuning
        ↓
Preference / RL / Reasoning Training
~~~

不同模型可能跳过、合并或联合训练这些阶段。

因此 VLM 的能力可以拆成：

| 层 | 学什么 |
| --- | --- |
| Vision Representation | 像素中有哪些模式 |
| Alignment | 图像和语言如何对应 |
| Fusion | 两种表示怎样交互 |
| Generation | 怎样把联合状态生成语言 |
| Instruction | 怎样遵循多模态要求 |
| Reasoning | 怎样组合视觉证据解决复杂任务 |
| Grounding | 语言概念怎样绑定到空间证据 |

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

VLM 的本质可以压缩成六件事：

> **像素压缩、视觉表示、跨模态对齐、联合计算、推理、语言/行动输出。**

它与 LLM 最深层的连接是：两者都在把复杂世界压缩成可计算的表示，再通过大规模训练学习这些表示之间的关系。

## 参考资料

1. Dosovitskiy et al., Vision Transformer, 2020 — https://arxiv.org/abs/2010.11929
2. Radford et al., CLIP, 2021 — https://arxiv.org/abs/2103.00020
3. Alayrac et al., Flamingo, 2022 — https://arxiv.org/abs/2204.14198
4. Li et al., BLIP-2, 2023 — https://arxiv.org/abs/2301.12597
5. Liu et al., Visual Instruction Tuning / LLaVA, 2023 — https://arxiv.org/abs/2304.08485
6. Chen et al., SpatialVLM, 2024 — https://arxiv.org/abs/2401.12168
7. Google DeepMind, Gemini 3.6 Flash Model Card, 2026 — https://deepmind.google/models/model-cards/gemini-3-6-flash/
