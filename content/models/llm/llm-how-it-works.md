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

## 4.5 从 Logits 到概率：LLM 最基本的数学

假设词表只有 4 个 token：

| Token | Logit |
| --- | ---: |
| 猫 | 2.0 |
| 狗 | 1.0 |
| 飞机 | 0.0 |
| 苹果 | -1.0 |

神经网络最后一层先输出的不是概率，而是一组 **logits**：可以理解为尚未归一化的偏好分数。

Softmax 把 logits $z_i$ 转成概率：

$$
p_i = \frac{e^{z_i}}{\sum_j e^{z_j}}
$$

因为指数函数始终为正，再除以所有候选之和，最终每个 $p_i$ 都在 0 到 1 之间，而且总和为 1。

所以：

~~~text
Hidden State
    ↓ Linear Projection
Logits
    ↓ Softmax
Probability Distribution
~~~

### Temperature 在数学上做了什么？

采样温度 $T$ 通常作用在 softmax 之前：

$$
p_i(T)=\frac{e^{z_i/T}}{\sum_j e^{z_j/T}}
$$

- $T<1$：差距被放大，分布更尖锐；
- $T>1$：差距被压平，输出更随机；
- 接近 greedy decoding 时，系统倾向选择最大 logit 的 token。

Temperature **不会让模型学到新知识**，它只是改变已有分布的采样形状。

## 5. Attention 到底在算什么？

经典 attention 中，每个 token 的当前表示组成矩阵 $X$。模型通过三个可训练矩阵生成：

$$
Q=XW_Q,\quad K=XW_K,\quad V=XW_V
$$

如果序列有 $n$ 个 token，隐藏维度为 $d_{model}$，可以粗略理解：

~~~text
X: [n × d_model]

W_Q → Q
W_K → K
W_V → V
~~~

Attention 的经典公式是：

$$
Attention(Q,K,V)=softmax\left(\frac{QK^T}{\sqrt{d_k}}+M\right)V
$$

这里每一步都有具体意义。

### 第一步：$QK^T$

Query 与所有 Key 做点积。

两个向量：

$$
q=(q_1,q_2,...,q_d),\quad k=(k_1,k_2,...,k_d)
$$

点积：

$$
q\cdot k=\sum_{i=1}^{d}q_i k_i
$$

它提供一种可学习的匹配分数。

### 第二步：为什么除以 $\sqrt{d_k}$？

如果 Q、K 各维度近似均值 0、方差 1，点积的方差会随维度 $d_k$ 增长。维度越高，logit 绝对值越容易变大，softmax 越容易饱和，梯度变小。

Transformer 因此用：

$$
\frac{1}{\sqrt{d_k}}
$$

缩放点积。[1]

### 第三步：Causal Mask 为什么存在？

生成模型不能在训练时偷看未来 token。

如果序列是：

~~~text
我 / 喜欢 / 人工 / 智能
~~~

模型在预测“喜欢”时不能读取后面的“人工智能”。

因此 decoder-only LLM 使用 causal mask：

$$
M_{ij}=
\begin{cases}
0,&j\le i\\
-\infty,&j>i
\end{cases}
$$

softmax 后，未来位置的概率变成 0。

矩阵直觉：

~~~text
      1  2  3  4
1     ✓  ×  ×  ×
2     ✓  ✓  ×  ×
3     ✓  ✓  ✓  ×
4     ✓  ✓  ✓  ✓
~~~

这就是“自回归”的数学约束之一。

### 第四步：乘以 V

softmax 得到的权重再乘 Value：

$$
O=AV
$$

其中 $A$ 是 attention 权重矩阵。

所以 attention 可以被理解成：

> **根据当前 token 的 Query，对上下文中的 Value 做一次内容相关的加权读取。**

### Multi-Head Attention

模型不会只进行一种读取。

第 $h$ 个 head：

$$
head_h=Attention(XW_Q^{(h)},XW_K^{(h)},XW_V^{(h)})
$$

最后：

$$
MultiHead(X)=Concat(head_1,...,head_H)W_O
$$

不同 head 可以形成不同的信息路由模式，但不能把某个 head 简单解释为一个固定的人类概念。

| 名称 | 数学角色 | 直觉 |
| --- | --- | --- |
| Query | 当前位置发出的匹配向量 | 我要找什么 |
| Key | 每个位置用于被匹配的向量 | 我有什么可被找到 |
| Value | 真正被加权读取的信息 | 找到后读取什么 |
| Mask | 禁止访问的位置 | 不能偷看未来 |

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

训练目标可以从最大似然开始理解。给定 token 序列：

$$
x_1,x_2,...,x_T
$$

自回归模型把整段文本的概率分解为：

$$
P(x_1,...,x_T)=\prod_{t=1}^{T}P(x_t\mid x_{<t})
$$

直接最大化大量小概率的乘积在数值上不方便，所以通常取对数，并最小化负对数似然：

$$
\mathcal{L}_{NLL}=-\sum_{t=1}^{T}\log P_\theta(x_t\mid x_{<t})
$$

对于 one-hot 目标，这就是常见的 token-level cross-entropy。

如果正确 token 的预测概率是 $p$，单个位置的 loss：

$$
L=-\log p
$$

例如：

- 正确 token 概率 0.9 → loss 很小；
- 正确 token 概率 0.01 → loss 很大。

所以训练本质上是在不断推动：

> **真实训练 token 的条件概率变高。**

### Gradient 到底是什么？

模型参数记作 $\theta$，loss 是 $L(\theta)$。

梯度：

$$
\nabla_\theta L
$$

表示 loss 对每个参数变化的局部敏感方向。

最基础的梯度下降可以写成：

$$
\theta_{t+1}=\theta_t-\eta\nabla_\theta L
$$

其中 $\eta$ 是 learning rate。

真实训练通常使用 Adam/AdamW 等优化器、学习率调度、混合精度、梯度裁剪和分布式训练，但底层逻辑仍然是：

~~~text
Forward
 ↓
Prediction
 ↓
Loss
 ↓
Backpropagation
 ↓
Gradients
 ↓
Optimizer
 ↓
New Parameters
~~~

参数不是“参数 10001 = 法国、参数 10002 = 巴黎”这样的知识表。知识、语言规律和计算模式以分布式方式存在于大量权重和运行时激活中。

### Perplexity 是什么？

语言模型常用 perplexity 描述平均预测不确定性：

$$
PPL=\exp\left(\frac{1}{T}\mathcal{L}_{NLL}\right)
$$

在相同 tokenizer、数据和评测设置下，perplexity 越低通常表示 next-token prediction 越好；但它不能直接等价为“推理能力”“事实正确率”或“用户更喜欢”。

## 9. 为什么预测下一个 token 能产生复杂能力？

因为要持续预测正确，模型必须压缩训练数据里的大量结构。预测科学文本需要知识关系；补全代码需要语法、API 和算法模式；续写长文需要人物、主题和远距离依赖。

但神经网络如何形成抽象概念、算法与推理机制，仍是活跃研究问题。

## 9.5 Dense 与 MoE：参数是不是每次都全部运行？

Dense Transformer 的一个典型特点是，每个 token 会经过同一组主要层参数。

Mixture-of-Experts（MoE）则把部分 FFN/MLP 替换成多个 experts，并由 router 为每个 token 选择少量 expert：

$$
g(x)=softmax(W_r x)
$$

若只选择 Top-k experts：

$$
y=\sum_{i\in TopK(g(x))}g_i(x)E_i(x)
$$

于是模型可以拥有很大的**总参数量**，但每个 token 只激活其中一部分。

因此必须区分：

| 概念 | 含义 |
| --- | --- |
| Total Parameters | 模型总参数 |
| Active Parameters | 一个 token 实际经过的参数 |
| Experts | 可被 router 选择的子网络 |
| Top-k Routing | 每个 token 激活多少 experts |

MoE 的价值是扩大容量与计算效率之间的设计空间，但也增加路由、负载均衡、通信和 serving 的复杂度。**“总参数更大”不等于“每 token 计算量同比增加”。**

## 10. Scaling：参数越大一定越好吗？

不是。Scaling-law 工作发现 loss 会随模型规模、数据和计算呈现规律性趋势。[3] Chinchilla 进一步说明，在固定计算预算下，模型规模和训练 token 数需要协调扩展，只增加参数并非计算最优。[4]

~~~text
能力 ≈ Architecture × Parameters × Data × Data Quality × Compute × Optimization × Post-training × Inference-time Compute
~~~

这也是为什么 NextCHINA 不应该用“参数量最大”替代模型能力评价。

## 10.5 计算量从哪里来？为什么长上下文贵？

对长度为 $n$ 的序列，标准 self-attention 需要形成一个近似 $n\times n$ 的关系矩阵。

因此 attention 的序列长度相关计算/内存压力具有二次项：

$$
O(n^2)
$$

而 MLP 等部分通常更接近随 token 数线性增长。

这不意味着“整个 Transformer 的所有成本永远都是严格 $O(n^2)$”；真实系统还受到模型维度、KV cache、kernel、batching 和硬件影响。但它解释了为什么上下文从 4K 扩到 128K 并不是简单的 32 倍工程问题。

FlashAttention 的关键贡献之一，是不改变 exact attention 数学结果，而通过 IO-aware tiling 减少 HBM 与片上 SRAM 之间的数据搬运。[8]

## 11. Base Model 为什么还不是好助手？

Pretraining 首先教模型预测文本；用户真正需要的是遵循意图。

InstructGPT 展示了 supervised fine-tuning 加人类反馈训练的一条经典路径，并说明模型更大本身不保证更符合人的意图。[6]

~~~text
Pretraining → Base Model → Instruction / Preference Training → Assistant Model
~~~

现代厂商采用的后训练方法更加多样，不能把所有模型都描述为完全相同的 RLHF 流程。

### Preference Optimization 在优化什么？

一种经典 RLHF 表达是学习 reward model $r_\phi(x,y)$，再让 policy $\pi_\theta$ 获得更高奖励，同时用 KL 项限制它不要离参考模型太远：

$$
\max_\theta\;\mathbb{E}[r_\phi(x,y)]-\beta D_{KL}(\pi_\theta\|\pi_{ref})
$$

直觉：

~~~text
更符合偏好
   ↑
但不要为了刷奖励
偏离原模型太远
~~~

DPO 则证明在特定建模假设下，可以绕过显式 reward model + PPO 训练流程，直接从 chosen / rejected 偏好对优化 policy。[10]

因此“对齐”不是给模型加几条 system prompt，而是可以真正改变参数和输出概率分布。

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

## 13.5 Prefill 与 Decode：一次请求其实有两个阶段

LLM serving 常被拆成：

### Prefill

把整段 prompt 一次送入模型，计算所有输入 token 的 hidden states 和 K/V。

它更像大矩阵并行计算，通常更偏 **compute-bound**。

### Decode

之后每次生成一个新 token，并读取历史 KV cache。

~~~text
Prompt tokens
   ↓
PREFILL
   ↓
KV Cache
   ↓
token 1
   ↓
DECODE → token 2 → DECODE → token 3 ...
~~~

Decode 每一步处理的新 token 很少，却需要反复读取大量模型权重与 KV cache，因此经常更受 memory bandwidth 影响。

这也是为什么：

- TTFT（Time To First Token）；
- TPS（Tokens Per Second）；

是两个不同的性能指标。

## 14. KV Cache：为什么历史计算可以复用？

Attention 中历史 token 的 Key 和 Value 可以缓存，生成新 token 时复用，这就是 KV cache 的基本思想。

~~~text
历史 token → K / V → Cache
                       ↑
新 token → Query ──────┘
~~~

它显著加速生成，但上下文越长，缓存通常也越大，所以 context window 同时是算法和系统工程问题。

### KV Cache 为什么这么占内存？

粗略忽略实现差异，KV cache 的元素数量与：

$$
2\times L\times n_{kv}\times d_{head}\times T
$$

成正比，其中：

- $L$：Transformer 层数；
- $n_{kv}$：KV heads 数；
- $d_{head}$：每个 head 维度；
- $T$：缓存 token 数；
- 乘 2 是因为同时缓存 K 与 V。

再乘数据类型每元素字节数，就得到近似内存占用。

### MHA、MQA、GQA 为什么影响推理？

传统 Multi-Head Attention 通常让多个 query head 各自拥有 K/V head。

Multi-Query Attention（MQA）让多个 query heads 共享一组 K/V，大幅减少 KV cache。

Grouped-Query Attention（GQA）位于两者之间：多个 query heads 分组共享 K/V heads。研究显示 GQA 可以在质量接近 MHA 的同时获得接近 MQA 的推理速度优势。[9]

所以今天看到模型规格中的 “GQA” 并不是小细节，它直接影响长上下文 serving 成本。

## 14.5 数值精度与量化：FP16、BF16、INT8、INT4 在改变什么？

神经网络最终是数值计算。

如果一个权重用 FP16/BF16 保存，通常需要约 2 bytes；如果能安全压到 8-bit 或 4-bit，模型权重内存可以显著下降。

最简单的量化直觉：

$$
q=round(x/s)
$$

其中 $s$ 是 scale，推理时再近似恢复：

$$
\hat{x}=s\cdot q
$$

量化真正困难的是：不同权重/激活的分布并不一样，存在 outliers，过度压缩会损失精度。

所以“70B 模型能否在某张 GPU 上运行”不仅取决于参数量，还取决于：

- weight precision；
- activation precision；
- KV cache precision；
- quantization scheme；
- tensor parallel / pipeline parallel；
- batch 与 context。

**参数数量描述容量，bit-width 决定每个数值要占多少存储；两者不是同一个维度。**

## 15. FlashAttention：模型速度不只由模型决定

标准 self-attention 在长序列上计算和内存成本高。FlashAttention 用 IO-aware tiling 减少 GPU 高带宽内存与片上 SRAM 之间的数据搬运，在保持 exact attention 的情况下提高速度并降低内存开销。[8]

真实 AI 服务性能同时取决于 GPU、kernel、memory bandwidth、quantization、batching、cache 和 decoding。

## 15.5 Speculative Decoding：为什么可以“先猜几个 token”再验证？

自回归模型一次通常只能确认下一个 token。

Speculative decoding 的核心是让更便宜的 draft model 先提出多个候选 token，再由 target model 并行验证；如果设计正确，可以保持目标模型分布不变，同时减少昂贵模型逐 token 串行等待。

~~~text
Draft Model
  ↓ 猜 K 个 tokens
Target Model
  ↓ 一次验证
Accept / Reject
  ↓
继续生成
~~~

这说明“模型数学能力”和“用户看到的生成速度”是两层问题：同一组权重可以通过不同 serving 算法得到不同延迟。

## 16. Reasoning 是不是模型像人在脑中说话？

不能简单这样理解。模型内部是高维张量计算，不是我们可以直接读取的自然语言独白。

当 reasoning 系统允许更多推理 token、候选、验证、搜索、代码执行或其他 inference-time compute 时，模型获得更多解决问题的计算过程。

更稳妥的定义是：**reasoning model 通过训练与推理机制，在复杂问题上投入更多有效计算，提高多步问题求解表现。**

DeepSeek-R1 的公开研究提供了一个重要例子：大规模 reinforcement learning 可以显著增强模型的 reasoning 行为；R1-Zero 在没有先做 SFT 的实验路线中也出现了推理行为，但存在可读性和语言混合问题，最终 R1 使用 cold-start 数据与多阶段训练改善整体表现。[11]

这提醒我们：

> **Reasoning 能力不是简单等于“预训练模型更大”，后训练目标和 inference-time computation 同样重要。**

### Test-time compute 是什么？

传统 scaling 主要在训练阶段花更多计算。

reasoning 模型又增加了另一个轴：

~~~text
Training Compute
      +
Inference / Test-time Compute
~~~

模型可以在单个问题上生成更多中间状态、尝试多个候选、调用验证器或工具。

因此今天比较模型不能只问“多少参数”，还要问：

- 每个请求用了多少 reasoning tokens？
- 是否使用工具？
- 是否并行采样？
- 是否有 verifier？
- latency / cost 是多少？

否则 benchmark 分数可能比较的是完全不同的计算预算。

## 17. RAG、工具和 Agent 都不是 LLM 本体

~~~text
RAG:   Question → Search → Evidence → LLM → Answer
Tool:  LLM → Tool/API → Result → LLM
Agent: Goal → Model → Action → Environment → Observation → Model
~~~

RAG 增加外部信息；Tool 增加外部行动能力；Agent 增加循环执行和状态管理。**LLM 是模型层；RAG、Tool、Agent 是系统层。**

## 17.5 In-context Learning 为什么“不改参数也像学会了”？

Prompt 中的 token 会改变后续 hidden states 和 attention 路由，所以同一组固定参数可以在不同上下文中表现出不同任务行为。

可以把参数看成长期学习到的计算规则，而 context 是本次运行时状态：

~~~text
Weights = 长期参数记忆 / 计算结构
Context = 当前工作记忆 / 条件
Activations = 当前一次 forward 的动态状态
~~~

In-context learning 不等于 gradient descent，因为模型权重没有更新；它更接近“固定程序在不同输入状态下执行不同计算”。

研究已经发现一些可解释的局部机制，例如 induction heads 与特定 circuits，但大型模型完整能力如何由分布式特征与电路组成，仍未被完全解释。

## 18. 为什么 LLM 会幻觉？

因为它不是“没有记录就返回 NULL”的数据库。即使知识不足、上下文错误或推理失败，它仍然要对下一个 token 给出概率分布。

RAG、引用、搜索、验证器和工具可以降低错误，但不能自动把概率生成模型变成绝对可靠的事实机器。

从概率角度看，模型优化的是：

$$
P_\theta(text)
$$

或条件形式：

$$
P_\theta(answer\mid context)
$$

而不是一个直接的“事实真值函数”：

$$
Truth(answer)\in\{0,1\}
$$

训练语料中的事实、语言模式和错误都共同影响概率分布。一个句子可以**语言概率很高但事实为假**。

这就是为什么：

> fluency ≠ truth

> confidence-like wording ≠ calibrated probability

> next-token likelihood ≠ external-world verification

## 18.5 LLM 到底有没有“理解”？

这个问题必须先定义“理解”。

如果“理解”指：

- 能压缩语言规律；
- 能在新上下文组合概念；
- 能把描述映射到行动；
- 能解决未逐字见过的问题；

现代 LLM 显然表现出大量功能性能力。

如果“理解”指：

- 拥有人类式主观体验；
- 内部概念与人类心理表征完全相同；
- 我们已经知道每个神经元/特征为什么产生所有行为；

目前没有这样的结论。

更科学的说法是：

> **我们非常清楚 forward pass 的数学运算，却仍没有完整的高层理论解释“这些数十亿参数为什么组合出所有观察到的能力”。**

Mechanistic interpretability 已经能够发现部分 circuits、heads 与 features，但研究也显示，把大型模型完整还原成简单可读程序仍非常困难。

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
| Calibration | 概率/置信是否与真实正确率匹配 |
| Memory / KV | 长对话的缓存与显存代价 |
| Active Parameters | MoE 每 token 实际用了多少参数 |
| Precision | FP/BF16/INT8/INT4 的质量与成本 |
| Test-time Compute | 为一个答案实际花了多少推理计算 |
| Throughput | 系统每秒可服务多少 token / 请求 |
| Energy / Hardware | 运行需要什么硬件与能源 |

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

LLM 的“魔法”最终可以拆回六层：

~~~text
1. Representation
   Token / Embedding / Position

2. Computation
   Attention / MLP / MoE / Residual

3. Learning
   Cross-Entropy / Backprop / Optimizer / Scaling

4. Alignment
   SFT / Preference Optimization / RL

5. Inference
   Prefill / KV Cache / Decode / Sampling / Quantization

6. System
   RAG / Tool / Agent / Serving / Verification
~~~

所以 LLM 既不是“一个概率鹦鹉”这么简单，也不是无法解释的魔法黑箱。

底层每一步都是明确的线性代数、概率、优化和系统工程；真正尚未完全解决的是：

> **为什么这些局部可描述的数学运算，在巨大规模、数据与训练压力下，会形成如此丰富的抽象表示、泛化、推理和工具使用能力。**

## 参考资料

1. Vaswani et al., Attention Is All You Need, 2017 — https://arxiv.org/abs/1706.03762
2. Brown et al., Language Models are Few-Shot Learners, 2020 — https://arxiv.org/abs/2005.14165
3. Kaplan et al., Scaling Laws for Neural Language Models, 2020 — https://arxiv.org/abs/2001.08361
4. Hoffmann et al., Training Compute-Optimal Large Language Models, 2022 — https://arxiv.org/abs/2203.15556
5. Su et al., RoFormer / Rotary Position Embedding, 2021 — https://arxiv.org/abs/2104.09864
6. Ouyang et al., Training language models to follow instructions with human feedback, 2022 — https://arxiv.org/abs/2203.02155
7. Hu et al., LoRA, 2021 — https://arxiv.org/abs/2106.09685
8. Dao et al., FlashAttention, 2022 — https://arxiv.org/abs/2205.14135
9. Ainslie et al., GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints, 2023 — https://arxiv.org/abs/2305.13245
10. Rafailov et al., Direct Preference Optimization, 2023 — https://arxiv.org/abs/2305.18290
11. DeepSeek-AI, DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning, 2025 — https://arxiv.org/abs/2501.12948
12. Sardana et al., Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws, 2024 — https://arxiv.org/abs/2401.00448
