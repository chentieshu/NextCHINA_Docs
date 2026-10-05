> **本页解决的问题**：给定前文的概率是什么意思？为什么一句话的概率能逐项相乘，却不能当作事实可信度？
>
> 前置知识：分数、乘法、求和与自然对数；先知道 [Token 是什么](?view=garden&scope=branch:llm:math/tokenization)。本页只讨论有限离散变量，所有数字均为教学构造，Python 3 标准库即可复现。

## 1. 随机变量不是随机数生成器

随机变量把一次可能的结果映射为一个取值。令 $X_1$ 表示第一个 Token，$X_2$ 表示第二个 Token；大写表示变量，小写 $x_1$ 表示已经指定的取值。$P(X_1=x_1)$ 是该事件的概率，不是 Token ID 的大小。ID 只作类别标签，不能把两个 ID 的数值平均当作“平均含义”。

离散分布的每项非负，全部候选的概率和为 1。联合分布 $P(X_1,X_2)$ 则为每一种二元组合分配概率。从联合分布求一个变量的概率，需要把另一个变量的所有取值加起来，称为边缘化。[1]

设教学词表的位置一只有“红、蓝”，位置二只有“茶、水”，联合分布如下。它是一份完整的人造概率表，不是从四条文本估算出的真实语言规律。

| $X_1$ 与 $X_2$ | 茶 | 水 | 行和 |
| --- | ---: | ---: | ---: |
| 红 | 0.60 | 0.20 | 0.80 |
| 蓝 | 0.10 | 0.10 | 0.20 |
| 列和 | 0.70 | 0.30 | 1.00 |

例如，“第二个是水”包括“红、水”和“蓝、水”两种互斥情形，所以概率为 $0.20+0.10=0.30$。不能只挑最可能的一条路径代替求和。

## 2. 条件概率是在已知范围内重新归一化

对事件 $A,B$，当 $P(B)>0$ 时：

$$
P(A\mid B)=\frac{P(A\cap B)}{P(B)}
$$

竖线右侧是已经给定的条件。[1] 表中已知第一个 Token 是蓝，就只在“蓝”这一行内分配概率：

$$
P(X_2=\text{水}\mid X_1=\text{蓝})=\frac{0.10}{0.20}=0.50
$$

但交换左右两边，分母变为“水”的列和：

$$
P(X_1=\text{蓝}\mid X_2=\text{水})=\frac{0.10}{0.30}=\frac13
$$

所以 $P(A\mid B)$ 通常不等于 $P(B\mid A)$。两者共用联合概率，却在不同范围内归一化；若要反向计算，需使用相应的边缘概率。条件关系也没有自动证明因果关系。

**零条件边界**：若 $P(B)=0$，这里的比值是未定义，而非概率 0、1 或均匀分布。经验表里一次都没出现的前缀，也不足以断言现实中不可能出现；平滑或神经网络可以为它提供预测，但那是额外建模选择，不能说从这张表直接除出来了。

## 3. 链式法则不要求 Token 相互独立

把条件概率的定义移项，并逐次展开：

$$
P_\theta(x_1,\ldots,x_T)=P_\theta(x_1)\prod_{t=2}^{T}P_\theta(x_t\mid x_1,\ldots,x_{t-1})
$$

$\theta$ 表示模型参数。链式分解是概率规则；自回归语言模型选择从左到右建模这些条件分布，GPT-2 原论文明确采用这种序列分解。[2] 如果有提示 $c$，每一项都应保留它：$P_\theta(x_t\mid c,x_{<t})$。不应算到后面就丢掉最初的问题。

只保留最近一个 Token 的 $P(x_t\mid x_{t-1})$ 是更强的建模假设，并非“自回归”的定义。首项没有先前生成的 Token，不代表“条件概率分母为零”：空前缀与零概率事件不同；实现还可能约定 BOS 等起始符号。

沿“红、茶”路径，$P(\text{红})=0.8$、$P(\text{茶}\mid\text{红})=0.6/0.8=0.75$。再假设模型给结束符的条件概率为 $P(\mathrm{EOS}\mid\text{红,茶})=0.5$，则这条终止路径概率为：

$$
0.8\times0.75\times0.5=0.30
$$

没有最后一项时，$0.60$ 表示出现这个前缀的概率；加上 EOS 才表达“到这里结束”的这条路径。真实系统还需规定终止、截断与特殊符号，不能把前缀概率和完整回答概率混写。

## 4. 从概率到似然：固定什么，改变什么？

固定参数 $\theta$，问不同文本有多可能，是把 $P_\theta(x)$ 看成关于文本的概率。拿到一条已经观察到的文本 $x$，比较不同参数对它的支持程度，则把同一个表达式看成似然 $L(\theta;x)$。它不要求对所有参数求和等于 1，也不是“参数正确的概率”。

训练中最大似然的方向是提高已观察样本的联合概率；对数把每条路径上的连乘变成各位置条件对数概率之和。对本页终止路径，$\log0.8+\log0.75+\log0.5=\log0.3$。这一步只改变表达方式，没有把三个位置假设成独立事件。多个训练样本如何加权、哪些位置计分，仍需另行规定。

还要区别“该模型可给任意前缀打分”和“已经证实它对任意前缀准确”：一个归一化的预测器可以把概率分配得很差。概率形式正确，仅保证输出遵守这套数学表示，不能代替数据质量、泛化能力与事实核验。

## 5. Teacher forcing 与生成：条件来自哪里？

训练时，teacher forcing 把数据中的真实前缀作为条件。例如目标序列是“红、茶、EOS”，预测第三个符号时使用“红、茶”，即使模型在第二个位置更偏向“水”。生成时，如果实际选中了“水”，下一步便条件于“红、水”；不能继续借用正确答案里的“茶”。训练与生成的这个输入差异是 Scheduled Sampling 论文讨论的出发点。[3]

因果 Transformer 可在一次前向中并行计算训练序列各位置。按常见的标签移位约定，位置 $t$ 的输入是 $x_t$，要预测的是 $x_{t+1}$：因果掩码允许读取当前位置的输入 $x_t$，但不能读取目标 $x_{t+1}$ 及更后面的符号。可见性中的对角线与“偷看答案”不是一回事；并行计算没有改变条件分布的定义。生成则要等待选出的前一个符号才能确定下一个前缀；缓存减少重复计算，不会消除这一依赖。

## 6. 可运行实验：正向、反向与路径概率

```python
# nextchina-example: conditional-probability
import math

def conditional(joint, given):
    if not all(math.isfinite(v) for v in (joint, given)):
        raise ValueError("概率必须有限")
    if not (0 <= joint <= given <= 1) or given == 0:
        raise ValueError("需要 0 <= 联合概率 <= 条件事件概率 <= 1，且分母非零")
    return joint / given

def sequence_score(factors):
    if not factors or any(not math.isfinite(p) or not 0 <= p <= 1
                          for p in factors):
        raise ValueError("本函数需要非空、有限且位于 [0,1] 的路径因子")
    logp = -math.inf if 0 in factors else math.fsum(math.log(p) for p in factors)
    return math.prod(factors), logp

joint = ((0.60, 0.20), (0.10, 0.10))
assert math.isclose(math.fsum(v for row in joint for v in row), 1.0)
blue = math.fsum(joint[1])
water = math.fsum(row[1] for row in joint)
forward = conditional(joint[1][1], blue)
reverse = conditional(joint[1][1], water)
assert math.isclose(forward, 0.5)
assert math.isclose(reverse, 1 / 3)
assert not math.isclose(forward, reverse)

prob, logp = sequence_score([0.8, 0.75, 0.5])
assert math.isclose(prob, 0.3)
assert math.isclose(logp, math.log(0.3))
assert sequence_score([0.8, 0.0]) == (0.0, -math.inf)
assert conditional(0.0, 0.2) == 0.0
for bad in [(0, 0), (0.4, 0.2), (-0.1, 0.2), (0.1, float("nan"))]:
    try:
        conditional(*bad)
    except ValueError:
        pass
    else:
        raise AssertionError("非法条件概率输入未被拒绝")
for bad in [[], [-0.1], [1.1], [float("inf")]]:
    try:
        sequence_score(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("非法路径因子未被拒绝")
print(round(forward, 6), round(reverse, 6), round(prob, 6), round(logp, 6))
```

预期输出为 `0.5 0.333333 0.3 -1.203973`。零概率目标是合法边界：路径概率为零，对数为负无穷。长路径直接相乘可能下溢，累加对数通常更适合计分。本函数检查数值范围，不会证明你传入的因子真的来自同一个模型和正确前缀。

## 7. 三种容易误读的“高概率”

- 高 Token 概率只表示模型在该前缀下更偏好这个符号；事件“生成这段文本”和事件“文本所述事实成立”并不相同
- 路径概率随着附加因子不会增大，长度与分词会改变结果；直接用不同长度答案的乘积排序，并非公平的质量比较
- greedy 每一步取最大值，不保证找到全局概率最高的序列；前一步的选择会改变后续分布。抽样、温度与截断又会改变实际生成过程

## 8. 自测与答案

**练习**：只知道第二个 Token 是水，第一个是红的概率是多少？若已经生成“红、水”，能否用 $P(\mathrm{EOS}\mid\text{红,茶})=0.5$ 评价下一步？

**答案**：前者为 $0.20/0.30=2/3$；后者不能，条件前缀不同，必须另取 $P(\mathrm{EOS}\mid\text{红,水})$。表里没有这个值，就应承认信息不足。

继续阅读 [Softmax 与温度](?view=garden&scope=branch:llm:math/softmax)，了解单步分布从何而来；[熵、交叉熵与困惑度](?view=garden&scope=branch:llm:math/objectives) 把路径概率接到训练目标；[一次训练更新](?view=garden&scope=branch:llm:training/loop) 说明参数如何改变。

## 来源、核验日期与范围

[1] Goodfellow、Bengio、Courville，[Deep Learning 第 3 章，3.2–3.6 节](https://www.deeplearningbook.org/contents/prob.html)：随机变量、边缘化、条件概率及链式法则的作者教材。

[2] Radford 等，[Language Models are Unsupervised Multitask Learners，第 2 节](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)：自回归语言建模的原始技术报告。

[3] Bengio 等，[Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks](https://arxiv.org/abs/1506.03099)：用于训练时真实前缀与推理时生成前缀的区别，不据此宣称某种训练方案普遍更优。

核验日期：2026-10-05。核对范围为上述来源的机制描述及本页教学计算；未调用商业模型、未测量模型事实准确率，也未完成独立专家复核。
