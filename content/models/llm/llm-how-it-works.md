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

Softmax 把 logits \(z_i\) 转成概率：

\[
p_i = \frac{e^{z_i}}{\sum_j e^{z_j}}
\]

因为指数函数始终为正，再除以所有候选之和，最终每个 \(p_i\) 都在 0 到 1 之间，而且总和为 1。

所以：

~~~text
Hidden State
    ↓ Linear Projection
Logits
    ↓ Softmax
Probability Distribution
~~~

### Temperature 在数学上做了什么？

采样温度 \(T\) 通常作用在 softmax 之前：

\[
p_i(T)=\frac{e^{z_i/T}}{\sum_j e^{z_j/T}}
\]

- \(T<1\)：差距被放大，分布更尖锐；
- \(T>1\)：差距被压平，输出更随机；
- 接近 greedy decoding 时，系统倾向选择最大 logit 的 token。

Temperature **不会让模型学到新知识**，它只是改变已有分布的采样形状。

## 5. Attention 到底在算什么？

经典 attention 中，每个 token 的当前表示组成矩阵 \(X\)。模型通过三个可训练矩阵生成：

\[
Q=XW_Q,\quad K=XW_K,\quad V=XW_V
\]

如果序列有 \(n\) 个 token，隐藏维度为 \(d_{model}\)，可以粗略理解：

~~~text
X: [n × d_model]

W_Q → Q
W_K → K
W_V → V
~~~

Attention 的经典公式是：

\[
Attention(Q,K,V)=softmax\left(\frac{QK^T}{\sqrt{d_k}}+M\right)V
\]

这里每一步都有具体意义。

### 第一步：\(QK^T\)

Query 与所有 Key 做点积。

两个向量：

\[
q=(q_1,q_2,...,q_d),\quad k=(k_1,k_2,...,k_d)
\]

点积：

\[
q\cdot k=\sum_{i=1}^{d}q_i k_i
\]

它提供一种可学习的匹配分数。

### 第二步：为什么除以 \(\sqrt{d_k}\)？

如果 Q、K 各维度近似均值 0、方差 1，点积的方差会随维度 \(d_k\) 增长。维度越高，logit 绝对值越容易变大，softmax 越容易饱和，梯度变小。

Transformer 因此用：

\[
\frac{1}{\sqrt{d_k}}
\]

缩放点积。[1]

### 第三步：Causal Mask 为什么存在？

生成模型不能在训练时偷看未来 token。

如果序列是：

~~~text
我 / 喜欢 / 人工 / 智能
~~~

模型在预测“喜欢”时不能读取后面的“人工智能”。

因此 decoder-only LLM 使用 causal mask：

\[
M_{ij}=
\begin{cases}
0,&j\le i\\
-\infty,&j>i
\end{cases}
\]

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

\[
O=AV
\]

其中 \(A\) 是 attention 权重矩阵。

所以 attention 可以被理解成：

> **根据当前 token 的 Query，对上下文中的 Value 做一次内容相关的加权读取。**

### Multi-Head Attention

模型不会只进行一种读取。

第 \(h\) 个 head：

\[
head_h=Attention(XW_Q^{(h)},XW_K^{(h)},XW_V^{(h)})
\]

最后：

\[
MultiHead(X)=Concat(head_1,...,head_H)W_O
\]

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

\[
x_1,x_2,...,x_T
\]

自回归模型把整段文本的概率分解为：

\[
P(x_1,...,x_T)=\prod_{t=1}^{T}P(x_t\mid x_{<t})
\]

直接最大化大量小概率的乘积在数值上不方便，所以通常取对数，并最小化负对数似然：

\[
\mathcal{L}_{NLL}=-\sum_{t=1}^{T}\log P_\theta(x_t\mid x_{<t})
\]

对于 one-hot 目标，这就是常见的 token-level cross-entropy。

如果正确 token 的预测概率是 \(p\)，单个位置的 loss：

\[
L=-\log p
\]

例如：

- 正确 token 概率 0.9 → loss 很小；
- 正确 token 概率 0.01 → loss 很大。

所以训练本质上是在不断推动：

> **真实训练 token 的条件概率变高。**

### Gradient 到底是什么？

模型参数记作 \(\theta\)，loss 是 \(L(\theta)\)。

梯度：

\[
\nabla_\theta L
\]

表示 loss 对每个参数变化的局部敏感方向。

最基础的梯度下降可以写成：

\[
\theta_{t+1}=\theta_t-\eta\nabla_\theta L
\]

其中 \(\eta\) 是 learning rate。

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

\[
PPL=\exp\left(\frac{1}{T}\mathcal{L}_{NLL}\right)
\]

在相同 tokenizer、数据和评测设置下，perplexity 越低通常表示 next-token prediction 越好；但它不能直接等价为“推理能力”“事实正确率”或“用户更喜欢”。

## 9. 为什么预测下一个 token 能产生复杂能力？

因为要持续预测正确，模型必须压缩训练数据里的大量结构。预测科学文本需要知识关系；补全代码需要语法、API 和算法模式；续写长文需要人物、主题和远距离依赖。

但神经网络如何形成抽象概念、算法与推理机制，仍是活跃研究问题。

## 9.5 Dense 与 MoE：参数是不是每次都全部运行？

Dense Transformer 的一个典型特点是，每个 token 会经过同一组主要层参数。

Mixture-of-Experts（MoE）则把部分 FFN/MLP 替换成多个 experts，并由 router 为每个 token 选择少量 expert：

\[
g(x)=softmax(W_r x)
\]

若只选择 Top-k experts：

\[
y=\sum_{i\in TopK(g(x))}g_i(x)E_i(x)
\]

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

\[
2\times L\times n_{kv}\times d_{head}\times T
\]

成正比，其中：

- \(L\)：Transformer 层数；
- \(n_{kv}\)：KV heads 数；
- \(d_{head}\)：每个 head 维度；
- \(T\)：缓存 token 数；
- 乘 2 是因为同时缓存 K 与 V。

再乘数据类型每元素字节数，就得到近似内存占用。

### MHA、MQA、GQA 为什么影响推理？

传统 Multi-Head Attention 通常让多个 query head 各自拥有 K/V head。

Multi-Query Attention（MQA）让多个 query heads 共享一组 K/V，大幅减少 KV cache。

Grouped-Query Attention（GQA）位于两者之间：多个 query heads 分组共享 K/V heads。研究显示 GQA 可以在质量接近 MHA 的同时获得接近 MQA 的推理速度优势。[9]

所以今天看到模型规格中的 “GQA” 并不是小细节，它直接影响长上下文 serving 成本。

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
