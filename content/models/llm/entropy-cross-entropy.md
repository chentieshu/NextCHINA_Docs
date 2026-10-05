> **本页解决的问题**：熵、交叉熵和 KL 散度分别在比较什么？为什么预测正确 Token 的负对数概率是损失，困惑度又该怎样平均？
>
> 前置知识：[条件概率与自回归](?view=garden&scope=branch:llm:math/probability)、求和、自然对数与 [Softmax](?view=garden&scope=branch:llm:math/softmax)。只讨论同一有限词表上的离散分布；所有实验是人造数字，使用 Python 3 标准库。

## 1. 先分清哪个分布负责什么

令 $p_i$ 是数据或指定目标分布，$q_i$ 是模型预测分布。二者必须对应相同类别及顺序，非负且各自和为 1。不能把一个 tokenizer 的第 10 号 Token 与另一个 tokenizer 的第 10 号当成相同事件。

这里的类别是一次选择中互斥的候选，例如下一个 Token 只能取某个 ID。若一个任务允许多个标签同时为真，它可能需要多个二元分布，不能直接套用这一个分类分布的归一化。输入概率的和不为 1 时，下面程序会拒绝；静默重新归一化会掩盖上游的类别遗漏或数据错误。

单个事件的惊讶度是 $-\log p_i$：越不常见，观察到它时数值越大。**熵**是按该分布自身加权后的平均惊讶度：

$$
H(p)=-\sum_i p_i\log p_i
$$

Shannon 的原论文给出这种对不确定性的定量刻画。[1] 本页默认自然对数，单位是 nat；若用 $\log_2$，单位是 bit。确定性分布的熵为 0，同一 $V$ 类词表上的均匀分布熵为 $\log V$。因此熵反映分布的分散程度，不直接衡量答案是否有事实依据。

## 2. 交叉熵与 KL：目标不变，换谁来预测？

**交叉熵**仍按 $p$ 加权，但惊讶度改用 $q$：

$$
H(p,q)=-\sum_i p_i\log q_i
$$

**KL 散度**比较两者的对数概率比：

$$
D_{\mathrm{KL}}(p\Vert q)=\sum_{i:p_i>0}p_i(\log p_i-\log q_i)
=H(p,q)-H(p)
$$

于是 $H(p,q)=H(p)+D_{\mathrm{KL}}(p\Vert q)$。固定 $p$ 时，改变 $q$ 不影响 $H(p)$，最小化交叉熵与最小化这个方向的 KL 等价。KL 非负，离散情况下等于零当且仅当两分布相同；它一般不对称，不能随意交换左右两边。[2]

这不是说训练交叉熵一定能降到零。若目标 $p$ 本来有多种可能性，即使 $q=p$，交叉熵仍为 $H(p)$。真实语言中的未知数据分布与单个样本的标签分布，也不能混为一谈。

边界要先于计算约定：$p_i=0$ 的项贡献 0，包括 $p_i=q_i=0$；若 $p_i>0$ 而 $q_i=0$，交叉熵和 KL 为正无穷。给零偷偷加一个小常数会改变计算目标；若为了工程稳定性进行裁剪，应记录规则。

## 3. 三类别手算，检查恒等式

取 $p=(0.5,0.25,0.25)$、$q=(0.25,0.5,0.25)$，类别分别为 A、B、C。

| 量 | 逐项计算 | 结果，nat |
| --- | --- | ---: |
| 熵 $H(p)$ | $0.5\log2+0.25\log4+0.25\log4$ | 1.039721 |
| 交叉熵 $H(p,q)$ | $0.5\log4+0.25\log2+0.25\log4$ | 1.213008 |
| KL | $0.5\log2+0.25\log(1/2)+0.25\log1$ | 0.173287 |

交叉熵减熵正好是 $0.25\log2$。KL 的某一项可以为负，例如 B 这一项；非负性质针对完整求和。这里恰好交换了两个概率，因此正反方向 KL 碰巧相等，不能用这个特例推出一般对称性。

## 4. 从分类似然到 one-hot 交叉熵

对一次类别观测 $y$，模型给它的分类似然就是 $q_y$。最大化似然等价于最小化负对数似然：

$$
L=-\log q_y=-\sum_i\mathbf{1}[i=y]\log q_i
$$

右侧是 one-hot 目标的交叉熵，目标分布自身的熵为零。上例若本次目标是 B，损失为 $-\log0.5\approx0.693147$，不是按整体 $p$ 加权的 1.213008。若许多同条件观测的频率恰为 $p$，它们的平均 one-hot 损失才等于表中的交叉熵。

在语言模型中，不同位置通常有不同前缀和预测分布 $q_t$，不能先平均所有位置的概率再取对数。标签平滑或软目标会改变目标分布；样本权重、忽略位置和 reduction 也会改变日志中的损失含义。需要比较实验时，应先统一这些约定。

### 为什么只看分类正确率不够？

设二分类的真实目标为 A，两个模型分别给 A 概率 0.51 和 0.99。它们都把 A 排在第一，准确率相同，单项损失却分别约为 0.673345 与 0.010050。若真实目标其实是 B，损失则约为 0.713350 与 4.605170：高度自信的错误会受到更大惩罚。这些数字来自直接代入负对数，不是实际模型测试。

也不能把模型输出熵 $H(q)$ 用作替代损失：无论模型把接近 1 的概率放在正确类还是错误类，输出熵都可能很低。监督信号要评价的是目标落在模型分布的什么位置，所以必须看目标和预测之间的关系。一个 one-hot 标签表示这次观察到什么，并不证明该上下文在真实世界只有一种合理续写。

## 5. 困惑度是平均 NLL 的指数

对 $N$ 个实际计分的目标 Token，自回归模型的困惑度定义为：[3]

$$
\mathrm{PPL}=\exp\left(-\frac1N\sum_{t=1}^{N}\log q_t(x_t\mid x_{<t})\right)
=\left(\prod_{t=1}^{N}\frac1{q_t(x_t\mid x_{<t})}\right)^{1/N}
$$

若三个目标概率为 $0.5,0.25,0.125$，总 NLL 为 $\log2+\log4+\log8=\log64$；平均为 $\log4$，所以 PPL 为 4。逐个取倒数再做算术平均得到 $(2+4+8)/3$，不是这个定义。若全程使用以 2 为底的损失，应取 $2^{\text{平均损失}}$，不能混用底数。

合并批次时，先累加有效 Token 的 NLL 与数量，再相除、取指数。不同长度句子的 PPL 直接算术平均，不是语料级 PPL。被忽略的 padding 不能混进分母；上下文只作条件、不计分时也必须排除。

例如第一批只有 1 个有效 Token、PPL 为 2，第二批有 3 个、PPL 为 8。语料级平均 NLL 是 $(\log2+3\log8)/4$，PPL 为 $2^{2.5}\approx5.656854$，既不是简单平均的 5，也不是按数量加权 PPL 的 6.5。必须先回到对数空间，才能按原始计分单位合并。批次划分本身不应改变这个聚合结果。

## 6. 可运行实验：恒等式、似然与零边界

```python
# nextchina-example: entropy-cross-entropy
import math

def distribution(values):
    if not values or any(not math.isfinite(v) or not 0 <= v <= 1 for v in values):
        raise ValueError("分布必须非空，且每项有限并位于 [0,1]")
    if not math.isclose(math.fsum(values), 1.0, rel_tol=0, abs_tol=1e-12):
        raise ValueError("分布的和必须为 1")
    return values

def entropy(p):
    return -math.fsum(v * math.log(v) for v in distribution(p) if v > 0)

def cross_entropy(p, q):
    distribution(p)
    distribution(q)
    if len(p) != len(q):
        raise ValueError("两个分布必须对应相同类别")
    if any(a > 0 and b == 0 for a, b in zip(p, q)):
        return math.inf
    return -math.fsum(a * math.log(b) for a, b in zip(p, q) if a > 0)

def kl(p, q):
    return cross_entropy(p, q) - entropy(p)

def categorical_nll(q, target):
    distribution(q)
    if type(target) is not int or not 0 <= target < len(q):
        raise ValueError("目标必须是合法类别索引")
    return math.inf if q[target] == 0 else -math.log(q[target])

def perplexity(target_probs):
    if not target_probs or any(not math.isfinite(p) or not 0 <= p <= 1
                               for p in target_probs):
        raise ValueError("需要至少一个合法的目标概率")
    if 0 in target_probs:
        return math.inf
    mean_nll = -math.fsum(math.log(p) for p in target_probs) / len(target_probs)
    try:
        return math.exp(mean_nll)
    except OverflowError:
        return math.inf  # 有限精度无法表示；不等同于目标概率为零

p, q = [0.5, 0.25, 0.25], [0.25, 0.5, 0.25]
h, ce, divergence = entropy(p), cross_entropy(p, q), kl(p, q)
assert math.isclose(h, 1.5 * math.log(2))
assert math.isclose(ce, 1.75 * math.log(2))
assert math.isclose(divergence, 0.25 * math.log(2))
assert math.isclose(categorical_nll(q, 1), cross_entropy([0, 1, 0], q))
assert math.isclose(perplexity([0.5, 0.25, 0.125]), 4.0)
assert entropy([1, 0]) == 0
assert cross_entropy([1, 0], [1, 0]) == 0
assert math.isinf(cross_entropy([1, 0], [0, 1]))
assert math.isinf(perplexity([0.5, 0]))
assert not math.isclose(kl([0.75, 0.25], [0.5, 0.5]),
                        kl([0.5, 0.5], [0.75, 0.25]))
for bad in [[], [-0.1, 1.1], [0.2, 0.2], [float("nan"), 1]]:
    try:
        entropy(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("非法分布未被拒绝")
for operation in [lambda: cross_entropy([1], [0.5, 0.5]),
                  lambda: categorical_nll(q, -1),
                  lambda: perplexity([]), lambda: perplexity([1.1])]:
    try:
        operation()
    except ValueError:
        pass
    else:
        raise AssertionError("非法计算输入未被拒绝")
print(*(round(v, 6) for v in (h, ce, divergence, perplexity([0.5, 0.25, 0.125]))))
```

预期输出为 `1.039721 1.213008 0.173287 4.0`。KL 用差值计算便于核验恒等式；接近零时浮点误差可能产生极小负数，不能将其解读为违反数学定理。本例没有训练模型。

## 7. 可比条件与常见误区

PPL 比较至少要固定 tokenizer、测试文本、特殊符号与计分范围，并记录上下文窗口、切块和滑动步长。相同文本换成更多或更少 Token，平均单位就变了；同一模型用不重叠短块测试，也可能因为丢失前文而改变结果。官方文档专门讨论了固定上下文模型的评估方式。[3]

低预测熵可能只是非常自信；低测试交叉熵说明特定语料上的目标预测更好。二者都不保证真实性、安全性或任务成功率。普通自回归 PPL 的定义也不能直接照搬到读取双向上下文的 masked language model。

**练习**：模型对一个三类任务始终输出 $q=(1/3,1/3,1/3)$。任一 one-hot 目标的损失和 PPL 是多少？若实际目标分布也是均匀的，KL 呢？

**答案**：损失是 $\log3$ nat，PPL 是 3，KL 是 0。分布已匹配，交叉熵仍不为零，因为目标本身有不确定性。

继续阅读 [训练循环](?view=garden&scope=branch:llm:training/loop) 连接梯度与参数更新；回看 [Token 与分词](?view=garden&scope=branch:llm:math/tokenization) 确认平均单位；在 [能力与评测](?view=garden&scope=branch:llm:rankings) 区分语言建模指标与任务指标。

## 来源、核验日期与范围

[1] Shannon，[A Mathematical Theory of Communication，原论文第 6 节](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf)：熵与信息单位；链接为哈佛大学托管的原文重印本。

[2] Goodfellow、Bengio、Courville，[Deep Learning 第 3.13 节](https://www.deeplearningbook.org/contents/prob.html)：作者对交叉熵、KL 关系与零概率约定的推导。

[3] [Hugging Face：Perplexity of fixed-length models](https://huggingface.co/docs/transformers/en/perplexity)：PPL 定义、tokenizer 与上下文评估口径。

核验日期：2026-10-05。范围为来源中的定义、机制与本页可运行教学计算；未执行真实模型评测，未刷新任何排行榜，也未完成独立专家复核。
