> **本页解决的问题**：新证据怎样改变概率？怎样用期望与方差概括数值结果？这些规则如何接到语言模型的序列概率？
>
> 前置知识：分数、乘法、平方、求和与自然对数；语言模型部分另需知道 [Token 是什么](?view=garden&scope=branch:llm:math/tokenization)。本页只讨论有限离散变量，所有数字均为教学构造，Python 3 标准库即可复现。

## 1. 随机变量、联合分布与边缘化

随机变量把一次可能的结果映射为一个取值，不是随机数生成器。令 $X_1$ 表示第一个 Token，$X_2$ 表示第二个 Token；大写表示变量，小写 $x_1$ 表示指定的取值。$P(X_1=x_1)$ 是事件的概率，不是 Token ID 的大小。ID 只作类别标签，平均两个 ID 不能得到“平均含义”。数值随机变量则需有可解释的量，例如一次任务的耗时。

离散分布覆盖全部候选，每项非负且总和为 1。联合分布给每一种组合分配概率；消去不关心的变量，要把它的全部取值加起来，这叫边缘化。[1] 设教学词表位置一只有“红、蓝”，位置二只有“茶、水”：

| $X_1$ 与 $X_2$ | 茶 | 水 | 行和 |
| --- | ---: | ---: | ---: |
| 红 | 0.60 | 0.20 | 0.80 |
| 蓝 | 0.10 | 0.10 | 0.20 |
| 列和 | 0.70 | 0.30 | 1.00 |

这是完整的人造概率表，不是四条文本的实测频率。“第二个是水”包括两种互斥情形，所以概率为 $0.20+0.10=0.30$，不能只保留最可能的一条路径。

## 2. 条件概率：在已知范围内重新归一化

对事件 $A,B$，当 $P(B)>0$ 时：

$$
P(A\mid B)=\frac{P(A\cap B)}{P(B)}
$$

竖线右侧是给定条件。[1] 已知第一个 Token 是蓝，就只在蓝这一行内分配概率；交换条件方向，归一化范围变为水这一列：

$$
P(X_2=\text{水}\mid X_1=\text{蓝})=\frac{0.10}{0.20}=0.50
$$

$$
P(X_1=\text{蓝}\mid X_2=\text{水})=\frac{0.10}{0.30}=\frac13
$$

因此 $P(A\mid B)$ 通常不等于 $P(B\mid A)$。条件关系也没有自动证明因果关系。

**零条件边界**：$P(B)=0$ 时，这个比值未定义，不是概率 0、1 或均匀分布。经验表没见过某前缀，也不能证明现实中它不可能出现；平滑或神经网络给出预测是额外建模选择，不是从零分母直接除出来的。

## 3. 贝叶斯规则：似然还需要乘上基础比例

令 $H_1,\ldots,H_k$ 为互斥且穷尽的假设，观察到事件 $E$。同一联合概率既可写成 $P(H_i\mid E)P(E)$，也可写成 $P(E\mid H_i)P(H_i)$，于是：[2]

$$
\begin{aligned}
P(H_i\mid E)&=\frac{P(E\mid H_i)P(H_i)}{\sum_jP(E\mid H_j)P(H_j)}\\
&\text{条件：}\ P(E)>0
\end{aligned}
$$

想象先按概率选择 A 或 B 图书箱，再从选中的箱中随机抽一本书，最后只看到书上的标签：

- **先验**：看标签前选 A、B 的概率分别为 $0.1,0.9$，它们是本例的基础比例
- **似然**：A 箱有红标签的概率 $P(E\mid A)=0.8$，B 箱为 $P(E\mid B)=0.2$；这是固定观察“红标签”，比较各假设对它的支持
- **证据概率**：$P(E)=0.1\times0.8+0.9\times0.2=0.26$，是所有来源分支的加总
- **后验**：$P(A\mid E)=0.08/0.26=4/13\approx0.3077$，B 则为 $9/13$

红标签在 A 中更常见，却不能推出这本书有 80% 概率来自 A。A 的先验很小，B 分支贡献的红标签概率 $0.18$ 仍大于 A 的 $0.08$。证据把 A 从 10% 提升至约 31%，但没有抹掉基础比例。这里似然恰巧加起来为 1 只是巧合；各 $P(E\mid H_i)$ 针对不同条件，无此归一化要求。

先验、似然与假设集合都是计算的输入，公式不会替你验证它们。如果某假设先验为零，在正证据概率下它的后验仍为零；要重新纳入它，需修改模型。全部分支都排除当前观察时，应检查建模或数据，而非把零分母改成一个小数冒充贝叶斯结论。

贝叶斯规则本身不要求多个证据条件独立。[朴素贝叶斯](?view=garden&scope=concept:naive-bayes) 会进一步用给定类别后的条件独立等假设分解特征似然。[3] 多次看到同一条消息不等于得到多份独立证据，不能无条件把似然重复相乘。本页只铺好这条入口，不包含分类器的训练与平滑方案。

## 4. 期望与方差：平均水平和围绕均值的波动

给数值随机变量 $X$ 的候选值 $x_i$ 配上概率 $p_i$。期望是按概率加权的平均；方差是先减去均值、平方，再加权：[4]

$$
\begin{aligned}
\mu&=\mathbb E[X]=\sum_i p_i x_i\\
\operatorname{Var}(X)&=\mathbb E[(X-\mu)^2]\\
&=\sum_i p_i(x_i-\mu)^2
\end{aligned}
$$

另一个教学任务只可能耗时 1 秒或 3 秒，概率分别为 $0.25,0.75$：

$$
\mu=0.25\times1+0.75\times3=2.5\ \text{秒}
$$

$$
\begin{aligned}
\operatorname{Var}(X)&=0.25(1-2.5)^2\\
&\quad+0.75(3-2.5)^2\\
&=0.75\ \text{秒}^2
\end{aligned}
$$

2.5 秒不是任何一次可能的结果，也不是最可能的 3 秒。它描述分布的平均水平；单次结果仍只有 1 或 3。相同均值也能对应不同波动：永远耗时 2.5 秒的任务方差为 0。方差非负，其单位是原单位的平方；标准差 $\sqrt{0.75}\approx0.866$ 秒恢复原单位。

为什么要平方？直接加权偏差会正负抵消，$\mathbb E[X-\mu]=0$。展开平方还得到 $\operatorname{Var}(X)=\mathbb E[X^2]-\mu^2$；本例是 $7-6.25=0.75$。[4] 本页的实现先消除概率和容差内的舍入偏差，再以正权重取值为锚点计算局部偏移及其中心化平方。这个实现选择避免从已舍入的大均值回减近邻值，但仍不能消除所有浮点误差。

**依赖性提醒**：$\mathbb E[X+Y]=\mathbb E[X]+\mathbb E[Y]$ 不需要独立；方差通常不能直接相加。若 $Y=X$，则 $\operatorname{Var}(X+Y)=4\operatorname{Var}(X)$，不是两倍；独立是方差可相加的充分条件；更一般地，协方差为零即可。[1][4]

条件概率也可以成为期望的权重。例如给图书箱定义有意义的指示变量 $Z$：来自 A 记为 1，否则记为 0。看标签前 $\mathbb E[Z]=0.1$，看到红标签后 $\mathbb E[Z\mid E]=1\times4/13+0\times9/13=4/13$。换了信息就换对应分布；不能把更新后的后验与旧先验权重混着使用。这里对 0/1 求平均有“事件比例”的含义，与任意 Token ID 求平均不同。

## 5. 分布已知，不等于估计没有误差

上节是给定完整分布后计算其矩。若实际只观察四次耗时 $1,3,3,3$，样本均值恰为 2.5，并不能证明真实期望就等于 2.5。对这四个观测各赋权 $1/4$，得到的是经验分布方差 $0.75$；在独立同分布抽样、总体方差有限且 $n>1$ 时，估计总体方差的常用无偏量是：[5]

$$
s^2=\frac{1}{n-1}\sum_{i=1}^n(x_i-\bar x)^2
$$

本例 $s^2=1$，不是前述已知分布的方差计算出错，而是问题与分母不同。分布的波动、估计量的抽样误差、模型偏差是不同问题。样本相关、选择有偏或数据生成过程改变时，不能只凭样本数宣称估计可靠；下一步可读 [统计推断](?view=garden&scope=concept:statistical-inference) 与 [置信区间](?view=garden&scope=concept:confidence-interval)。本页不构造区间，也不评估真实模型的不确定性。

期望还连接到 [价值函数](?view=garden&scope=concept:value-function)：给定状态和策略，对未来回报取条件期望，平均包含环境转移与策略动作的随机性，并非挑一条最好的轨迹。[6] 在状态、动作、奖励取值均有限且回合长度有界的教学设定中，它可看成对完整轨迹回报加权；这里不展开价值估计、Bellman 方程或策略优化。

## 6. 链式法则与自回归：概率为什么能逐项相乘？

反复使用条件概率定义，得到：

$$
P_\theta(x_1,\ldots,x_T)=P_\theta(x_1)\prod_{t=2}^{T}P_\theta(x_t\mid x_1,\ldots,x_{t-1})
$$

链式分解不要求 Token 相互独立；自回归语言模型选择从左到右建模这些条件分布，$\theta$ 为模型参数。[1][7] 若有提示 $c$，每项都保留 $P_\theta(x_t\mid c,x_{<t})$。只保留最近一个 Token 是更强的建模假设，不是“自回归”的定义。空前缀也不是零概率事件；实现可能约定 BOS 等起始符号。

表中“红、茶”的前缀概率为 $0.8\times0.75=0.60$。再设 $P(\mathrm{EOS}\mid\text{红,茶})=0.5$，这条终止路径的概率才是 $0.8\times0.75\times0.5=0.30$。前缀概率与完整回答概率不同，必须说明终止、截断及特殊符号约定。

固定参数看不同文本，是概率 $P_\theta(x)$；固定已观察文本比较参数，是似然 $L(\theta;x)$，不是“参数正确的概率”。最大似然训练提高观察样本的概率；取对数把路径连乘变为求和，本例为 $\log0.3$，没有引入独立假设。训练样本权重、计分位置仍需另定。

## 7. Teacher forcing 与生成的条件不同

训练的 teacher forcing 使用数据中的真实前缀：目标为“红、茶、EOS”时，预测第三个符号仍给“红、茶”。生成若选中了“水”，下一步就必须条件于“红、水”，不能借用答案中的“茶”。这是 Scheduled Sampling 论文讨论的输入差异；并不据此保证该方案普遍更优。[8]

因果 Transformer 能并行计算训练位置。常见标签移位下，输入位置 $t$ 放 $x_t$、预测 $x_{t+1}$；掩码可读当前位置输入，不能读目标及更后面的符号。掩码对角线不等于偷看答案。生成须等待已选符号确定下一前缀，缓存不会消除这个依赖。

## 8. 可运行实验：更新、加权与路径计分

`bayes_update` 接收等长先验与似然，返回后验列表和证据概率；`weighted_moments` 接收等长取值与概率，返回均值和分布方差，**不做样本无偏修正**。列表运算按候选数线性遍历；输入限非空列表/元组及内置有限整数/浮点数，不接受布尔值、字符串或嵌套形状。

```python
# nextchina-example: conditional-probability
import math
import sys

def number(value):
    if type(value) not in (int, float):
        raise ValueError("需要内置 int/float，不接受布尔值或字符串")
    try:
        result = float(value)
    except OverflowError as exc:
        raise ValueError("数值超出浮点范围") from exc
    if not math.isfinite(result):
        raise ValueError("数值必须有限")
    return result

def vector(values):
    if not isinstance(values, (list, tuple)) or not values:
        raise ValueError("需要非空一维列表或元组")
    return [number(v) for v in values]

def probabilities(values, normalized=False):
    ps = vector(values)
    if any(not 0 <= p <= 1 for p in ps):
        raise ValueError("概率必须位于 [0,1]")
    if normalized:
        total = math.fsum(ps)
        if not math.isclose(total, 1.0, rel_tol=0.0, abs_tol=1e-12):
            raise ValueError("分布概率和必须为 1")
        ps = [p / total for p in ps]  # 只修正已通过容差检查的分布
        largest = max(range(len(ps)), key=ps.__getitem__)
        # 从其余项补齐最大项，收回最后的归一化舍入残差。
        ps[largest] = 1.0 - math.fsum(p for i, p in enumerate(ps) if i != largest)
    return ps

def conditional(joint, given):
    joint, given = number(joint), number(given)
    if not (0 <= joint <= given <= 1) or given == 0:
        raise ValueError("需要 0 <= 联合概率 <= 条件事件概率 <= 1，且分母非零")
    return joint / given

def sequence_score(factors):
    factors = probabilities(factors)
    logp = -math.inf if 0 in factors else math.fsum(math.log(p) for p in factors)
    return math.prod(factors), logp

def bayes_update(prior, likelihood):
    prior = probabilities(prior, normalized=True)
    likelihood = probabilities(likelihood)  # 不要求似然在假设之间加总为 1
    if len(prior) != len(likelihood):
        raise ValueError("先验与似然必须一一对应")
    joint = [p * ell for p, ell in zip(prior, likelihood)]
    if any(p > 0 and ell > 0 and q < sys.float_info.min
           for p, ell, q in zip(prior, likelihood, joint)):
        raise ValueError("正联合质量成为零或次正规数；超出本示例范围")
    evidence = math.fsum(joint)
    if evidence == 0:
        raise ValueError("零证据概率，后验未定义")
    return [q / evidence for q in joint], evidence

def weighted_moments(values, probabilities_):
    values = vector(values)
    ps = probabilities(probabilities_, normalized=True)
    if len(values) != len(ps):
        raise ValueError("数值与概率必须一一对应")
    active = [(x, p) for x, p in zip(values, ps) if p > 0]
    anchor = active[0][0]
    offsets = [(x - anchor, p) for x, p in active]
    if any(not math.isfinite(d) for d, _ in offsets):
        raise ValueError("局部偏移超出浮点范围")
    try:
        center = math.fsum(p * d for d, p in offsets)
        mean = anchor + center
        variance = math.fsum(p * (d - center) ** 2 for d, p in offsets)
    except OverflowError as exc:
        raise ValueError("矩计算超出浮点范围") from exc
    if not all(math.isfinite(v) for v in (mean, variance)):
        raise ValueError("矩计算必须得到有限结果")
    return mean, variance

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

posterior, evidence = bayes_update([0.1, 0.9], [0.8, 0.2])
assert math.isclose(evidence, 0.26)
assert all(math.isclose(p, q) for p, q in zip(posterior, [4/13, 9/13]))
assert math.isclose(math.fsum(posterior), 1.0)
indicator_mean, indicator_var = weighted_moments([1, 0], posterior)
assert math.isclose(indicator_mean, 4/13)
assert math.isclose(indicator_var, (4/13) * (9/13))
unchanged, _ = bayes_update([0.25, 0.75], [0.4, 0.4])
assert all(math.isclose(p, q) for p, q in zip(unchanged, [0.25, 0.75]))
assert bayes_update([0.0, 1.0], [1.0, 0.5]) == ([0.0, 1.0], 0.5)
mean, variance = weighted_moments([1, 3], [0.25, 0.75])
assert (mean, variance) == (2.5, 0.75)
assert weighted_moments([2.5], [1]) == (2.5, 0.0)
assert weighted_moments([1, 3, 3, 3], [0.25] * 4) == (2.5, 0.75)
assert weighted_moments([3, 7], [0.25, 0.75]) == (6.0, 3.0)  # 2X+1
assert weighted_moments([1e308, 2], [0, 1]) == (2.0, 0.0)
# 容差内的概率和偏差不能让常量产生方差，或使证据概率超过 1。
near_unit = [0.5, 0.5000000000005]
assert weighted_moments([1e100, 1e100], near_unit) == (1e100, 0.0)
near_post, near_evidence = bayes_update(near_unit, [1, 1])
assert near_evidence == 1.0 and math.fsum(near_post) == 1.0
# 全局均值可能舍入，方差仍在可精确表示的局部间距上计算。
assert weighted_moments([1e16, 1e16 + 2], [0.5, 0.5]) == (1e16, 1.0)
large = 1e100
neighbor = math.nextafter(large, math.inf)
_, translated_var = weighted_moments([large, neighbor], [0.5, 0.5])
assert translated_var == ((neighbor - large) / 2) ** 2
assert weighted_moments([0, 1e-200], [0.5, 0.5])[1] == 0.0  # 真方差下溢

bad_calls = [
    lambda: conditional(0, 0), lambda: conditional(0.4, 0.2),
    lambda: conditional(-0.1, 0.2), lambda: conditional(0.1, float("nan")),
    lambda: conditional(True, 1), lambda: conditional("0.1", 0.2),
    lambda: sequence_score([]), lambda: sequence_score([-0.1]),
    lambda: sequence_score([1.1]), lambda: sequence_score([float("inf")]),
    lambda: sequence_score([[0.5]]), lambda: sequence_score([False]),
    lambda: bayes_update([0.1, 0.9], [0, 0]),
    lambda: bayes_update([1, 0], [0, 1]),
    lambda: bayes_update([0.2, 0.2], [0.8, 0.2]),
    lambda: bayes_update([0.1, 0.9], [0.8]),
    lambda: bayes_update([0.1, 0.9], [1.1, 0.2]),
    lambda: bayes_update([1], [float("nan")]),
    lambda: bayes_update([1], [True]),
    lambda: bayes_update([5e-324, 1], [0.5, 0.5]),
    lambda: bayes_update([0.4, 0.6], [1e-323, 1e-323]),
    lambda: weighted_moments([], []), lambda: weighted_moments([1, 3], [1]),
    lambda: weighted_moments([1, 3], [0.2, 0.2]),
    lambda: weighted_moments([1, 3], [-0.1, 1.1]),
    lambda: weighted_moments([float("inf")], [1]),
    lambda: weighted_moments([1], [float("nan")]),
    lambda: weighted_moments([True], [1]),
    lambda: weighted_moments(["3"], [1]),
    lambda: weighted_moments([[3]], [1]),
    lambda: weighted_moments([10**1000], [1]),
    lambda: weighted_moments([-1e308, 1e308], [0.5, 0.5]),
]
for bad in bad_calls:
    try:
        bad()
    except ValueError:
        pass
    else:
        raise AssertionError("非法输入或浮点边界未被拒绝")
print(round(forward, 6), round(reverse, 6), round(prob, 6), round(logp, 6))
print([round(p, 6) for p in posterior], round(evidence, 6), mean, variance)
```

两行输出分别为 `0.5 0.333333 0.3 -1.203973` 和 `[0.307692, 0.692308] 0.26 2.5 0.75`。分布和先通过 $10^{-12}$ 容差检查，再归一化消除舍入偏差；任意未归一化权重仍被拒绝。Bayes 不接受正因子的乘积落入零或次正规范围（小于 `sys.float_info.min`），因为非零次正规数也可能严重歪曲后验比例。矩计算仍有舍入和下溢：`[0, 1e-200]` 等概率时，真方差 $2.5\times10^{-401}$ 会舍入为 0；中间量溢出也会拒绝，即使更强的算法能表示最终结果。这些函数不是通用高精度库。路径中的真零概率合法，对数为负无穷；长路径的乘积也可能下溢，所以计分宜保留对数。检查通过不会证明输入分布符合现实，或路径因子来自正确前缀。

## 9. 误读边界与自测

- 高 Token 概率表示模型偏好这个符号；“生成文本”和“所述事实成立”是不同事件，归一化预测器仍可不准确
- 路径概率随附加因子不会增大，长度和分词会改变结果；不同长度的乘积不是公平的质量比较
- greedy 的局部最大不保证全局最优序列；抽样、温度、截断还会改变生成分布

**练习 1**：已知第二个 Token 是水，第一个是红的概率是多少？已经生成“红、水”，能否借用红、茶之后的 EOS 概率？

**答案**：$0.20/0.30=2/3$；不能，前缀不同，表里没有所需值就应承认信息不足。

**练习 2**：图书箱先验改为各 $0.5$，似然不变，看到红标签后来自 A 的概率是多少？如果两箱红标签概率都为零呢？

**答案**：证据概率 $0.5$，后验 $0.4/0.5=0.8$。后者证据概率为零，不能按此模型更新；不是任选一个后验。

**练习 3**：将耗时变量改为 $Y=2X+1$，求期望与方差。四次观测 $1,3,3,3$ 的样本无偏方差又是多少？

**答案**：$\mathbb E[Y]=6$、$\operatorname{Var}(Y)=4\times0.75=3$；平移不增加波动。样本无偏方差为 $3/(4-1)=1$，不可把经验分布方差、估计量与已知总体矩混写。

继续阅读 [Softmax 与温度](?view=garden&scope=branch:llm:math/softmax)，了解单步分布从何而来；[熵、交叉熵与困惑度](?view=garden&scope=branch:llm:math/objectives) 把路径概率接到训练目标；[一次训练更新](?view=garden&scope=branch:llm:training/loop) 说明参数如何改变。

## 来源、核验日期与范围

[1] Goodfellow、Bengio、Courville，[Deep Learning 第 3 章，3.2–3.8 节](https://www.deeplearningbook.org/contents/prob.html)：作者教材中的随机变量、边缘化、条件概率、链式法则与依赖性。

[2] H. Pishro-Nik，[Introduction to Probability, Statistics, and Random Processes，1.4.3 节](https://www.probabilitycourse.com/chapter1/1_4_3_bayes_rule.php)：贝叶斯公式、假设划分与全概率分母；图书箱数字为本页自设。

[3] Manning、Raghavan、Schütze，[Introduction to Information Retrieval，13.4 节](https://nlp.stanford.edu/IR-book/html/htmledition/properties-of-naive-bayes-1.html)：作者教材的朴素贝叶斯模型入口，不作为本页已完整讲解该模型的证明。

[4] Pishro-Nik，同书 [3.2.2 节：期望](https://www.probabilitycourse.com/chapter3/3_2_2_expectation.php)、[3.2.4 节：方差](https://www.probabilitycourse.com/chapter3/3_2_4_variance.php)：加权定义、线性性质、中心化、单位与独立和方差。

[5] Pishro-Nik，同书 [8.2.2 节：均值与方差的点估计](https://www.probabilitycourse.com/chapter8/8_2_2_point_estimators_for_mean_and_var.php)：经验方差与样本无偏方差的区别；不据此给出未经验证的置信区间。

[6] Sherstan 等，[Directly Estimating the Variance of the λ-Return Using Temporal-Difference Methods，v2，第 1–2 节](https://arxiv.org/html/1801.08287v2)：原始 RL 论文中的价值期望及回报方差区别；仅用于跨域阅读动机，不复述或复现其算法性能。

[7] Radford 等，[Language Models are Unsupervised Multitask Learners，第 2 节](https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf)：自回归语言建模的原始技术报告。

[8] Bengio 等，[Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks](https://arxiv.org/abs/1506.03099)：训练真实前缀与推理生成前缀的区别，不据此宣称训练方案普遍更优。

核验日期：2026-10-05。核对范围为上述来源对应段落及本页教学计算；限有限离散分布，不覆盖连续密度与一般零概率条件事件。未调用商业模型、未测量模型事实准确率，也未完成独立专家复核；审查状态仍为 `needs-independent-review`。
