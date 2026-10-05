> **本页解决的问题**：测试集答对 80%，是在报告这份试卷，还是在估计今后同类样本的正确率？置信区间如何量化抽样误差，又有哪些可靠性问题回答不了？
>
> 前置知识：[概率、期望与方差](?view=garden&scope=branch:llm:math/probability)、平方根与一元二次方程。本页只讲固定分类器在独立同分布测试样本上的准确率，数字均为教学构造，不代表任何真实模型的表现。代码使用 Python 3.8+ 标准库。

## 1. 先说清楚：我们要推断哪个量？

假设已经冻结一个垃圾邮件分类器 $f$，固定标签定义和判分规则。目标分布 $D$ 指某个明确场景下的新邮件，例如某类邮箱在指定期间接收的邮件及其正确标签；它不是“世界上所有问题”。从 $D$ 独立、同分布地抽取 $n$ 封未用于训练或选择模型的邮件，得到测试样本。

给第 $i$ 封邮件定义正确性指标 $X_i$：分类正确为 1，否则为 0。这里每封邮件的正确性都只有两种结果，即使原任务有多个类别也一样。我们关心的总体参数是：

$$
p=P_{(x,y)\sim D}\bigl(f(x)=y\bigr)
$$

$p$ 是固定但未知的总体准确率；它依赖分类器、目标分布和标签规则。统计推断利用有限样本，对这个未直接观察到的量作估计并说明不确定性。样本中答对 $K=\sum_iX_i$ 封，准确率估计量为：

$$
\widehat P=\frac{K}{n}
$$

抽样之前，$K$ 和 $\widehat P$ 随可能抽到的样本而变；观察到 $K=k$ 后，具体估计值写成 $\hat p=k/n$。例如 $80/100=0.8$ 是一个实现值，不证明未知参数 $p$ 恰好等于 0.8。

**固定试卷与总体推断是两个问题。** 如果只问“这个已固定模型在这 100 条、标签无争议的固定记录上答对多少”，答案就是 80%，不需要用抽样区间把已数清的结果变得模糊。只有把这些记录视作某个抽样过程的结果、想推断 $D$ 上的准确率时，才进入本页的模型。若从一个有限名单无放回抽取较大比例，样本不再独立，不能直接套用下面的二项公式。

## 2. 抽样分布与标准误：波动的是平均数

在上述设定下，各 $X_i$ 是独立的 Bernoulli 随机变量：$P(X_i=1)=p$，$P(X_i=0)=1-p$。直接代入期望和方差定义：

$$
\begin{aligned}
\mathbb E[X_i]&=p\\
\operatorname{Var}(X_i)&=p(1-p)
\end{aligned}
$$

独立性让和的方差可以相加，于是：

$$
\begin{aligned}
\mathbb E[\widehat P]&=p\\
\operatorname{Var}(\widehat P)&=\frac{n p(1-p)}{n^2}\\
&=\frac{p(1-p)}{n}
\end{aligned}
$$

若反复按同一规则各抽 $n$ 封邮件，每次都会得到一个 $\widehat P$；这些可能值及其概率构成估计量的**抽样分布**。在本模型中，$K\sim\operatorname{Binomial}(n,p)$，所以 $\widehat P$ 只能取 $0,1/n,\ldots,1$，不是任意连续数值。

- 单条正确性指标的标准差是 $\sqrt{p(1-p)}$，描述一次 0/1 结果的波动
- 准确率估计量的标准误是 $\operatorname{SE}(\widehat P)=\sqrt{p(1-p)/n}$，即其抽样分布的标准差

为了看清量级，暂时假定教学总体的真 $p=0.8$。单条指标的标准差为 0.4；$n=100$ 时准确率的标准误是 0.04，即 4 个百分点；$n=400$ 时为 0.02。四倍独立样本让标准误减半，没有让每封邮件的结果更确定。

现实里未知 $p$，常用 $\sqrt{\hat p(1-\hat p)/n}$ 作代入估计。这不是知道了真实标准误，尤其当 $k=0$ 或 $k=n$ 时会得到零。下一节要解决的正是：怎样从随机的点估计构造有明确解释的区间，而不是机械地在分数旁加减一个数。

## 3. “95%”描述区间方法的重复抽样表现

设 $I(K)$ 是看完样本后按预先确定的方法生成的区间。在固定 $p$、固定样本量与抽样规则下，这个方法的覆盖率是：

$$
C_n(p)=P_p\bigl(p\in I(K)\bigr)
$$

这里的概率来自重复抽样产生的不同 $K$，不是把固定参数 $p$ 当成随机变量。频率学派置信区间的解释是：如果大量重复同一实验并每次用同一方法构造区间，覆盖真参数的比例应符合该方法的覆盖性质。NIST 对均值区间的说明也强调，置信水平属于构造方法；给定样本算出的区间，或者包含真值，或者不包含。[1]

因此，得到区间 $[0.7112,0.8666]$ 后，不能单凭频率学派定义说“$p$ 有 95% 概率在这里”。给参数分配后验概率需要另行引入先验与贝叶斯模型。这个区间也不是“95% 的邮件正确率在里面”，不是下一批样本准确率的预测区间，更不是所有可靠性问题的统一保证。

还要区分**名义水平**与**实际覆盖率**。下面的 Wilson 方法使用正态近似的 95% 阈值；称为“95% Wilson 区间”不意味着每一个有限 $n$、每一个 $p$ 都有恰好或至少 95% 的实际覆盖率。第 5 节会直接算出一个低于 95% 的例子。

## 4. Wilson 区间：从候选参数反推区间

一个直观但有缺陷的做法是 Wald 区间：

$$
\begin{gathered}
\hat p\ \pm\ z\sqrt{\frac{\hat p(1-\hat p)}{n}}\\
z=\Phi^{-1}(0.975)\\
z\approx1.9599639845
\end{gathered}
$$

$\Phi$ 为标准正态分布的累积分布函数。这个公式把估计值代进标准误；若 20 封全对，就给出 $[1,1]$，好像已经排除了任何错误率。它还可能越出 $[0,1]$。把越界端点裁剪回来不能修好其覆盖性质。

Wilson 区间换一个方向：对每个候选总体准确率 $p_0\in(0,1)$，使用该候选值对应的标准误，考察 score 统计量：

$$
Z(p_0)=\frac{\hat p-p_0}{\sqrt{p_0(1-p_0)/n}}
$$

把满足 $|Z(p_0)|\le z$ 的候选值收集起来，便是在反演双侧 score 检验。[2] 这里用正态阈值近似抽样分布；“精确地解出了二次不等式”并不让正态近似变成精确的二项覆盖保证。平方、移项得到：

$$
\begin{gathered}
n(\hat p-p_0)^2\le z^2p_0(1-p_0)\\[4pt]
\begin{aligned}
& (n+z^2)p_0^2\\
&\quad -(2n\hat p+z^2)p_0\\
&\quad +n\hat p^2\le0
\end{aligned}
\end{gathered}
$$

二次项系数为正，不等式在两个根之间成立。解得：

$$
\begin{aligned}
[L,U]&=[c-h,c+h]\\
d&=1+z^2/n\\
c&=\frac{\hat p+z^2/(2n)}{d}\\
h&=\frac{z}{d}\sqrt{\frac{\hat p(1-\hat p)}{n}+\frac{z^2}{4n^2}}
\end{aligned}
$$

端点处可用二次不等式或极限解释，而不能在 $Z(0)$、$Z(1)$ 中除以零。特别地：

$$
\begin{aligned}
k=0:\quad [L,U]&=\left[0,\frac{z^2}{n+z^2}\right]\\[4pt]
k=n:\quad [L,U]&=\left[\frac{n}{n+z^2},1\right]
\end{aligned}
$$

这些是同一 Wilson 公式的边界，不是额外加上的先验。一般情况下区间中心 $c$ 不等于 $\hat p$，区间也不必围绕观察分数对称。

## 5. 三个区间，以及一个可精确枚举的覆盖率

使用相同的双侧 95% 阈值：

| 答对数 / 样本量 | 样本准确率 | Wilson 区间 | 能读出的信息 |
| --- | ---: | --- | --- |
| 80 / 100 | 80% | [71.1171%, 86.6633%] | 同类总体准确率仍有明显抽样不确定性 |
| 320 / 400 | 80% | [75.8030%, 83.6263%] | 同一分数、更多独立样本，区间更窄 |
| 20 / 20 | 100% | [83.8875%, 100%] | 样本全对没有证明总体永不出错 |

接着做一个无需模拟的思想实验：设教学总体真 $p=4/5$、每次抽 $n=100$。枚举 $K=0,\ldots,100$；只有 $K=73,\ldots,87$ 算出的 Wilson 区间包含 0.8。因此实际覆盖率为：

$$
\begin{aligned}
r_k&=(4/5)^k(1/5)^{100-k}\\
&=\frac{4^k}{5^{100}}\\[4pt]
C_{100}(0.8)&=\sum_{k=73}^{87}\binom{100}{k}r_k\\
&=\frac{\sum_{k=73}^{87}\binom{100}{k}4^k}{5^{100}}\\
&\approx0.9405196171
\end{aligned}
$$

约 94.052%，确实低于 95%。这里“精确枚举”指逐项累加完整二项分布，而不是 Monte Carlo 抽样；它没有把 Wilson 改造成精确区间。下方代码用有理数累加概率，最后显示时才转浮点数。纳入集合还用 score 不等式交叉核对：最近的被排除值 $k=72,88$ 的平方 score 为 4，与阈值 $z^2\approx3.84146$ 有明显间隔，本例不处在浮点判定的临界点。NIST 另列了基于二项尾概率反演的区间构造；选择其他方法时也要核对其覆盖约定和适用假设。[2]

## 6. 可运行实验：端点、边界与覆盖率

`wilson95(successes, trials)` 输入答对数和样本量，返回 `(下限, 上限)`。它只接受内置整数，拒绝布尔值、浮点计数、字符串和嵌套结构；教学支持范围为 $1\le n\le10000$、$0\le k\le n$，固定双侧 95%。这个上限是为了给示例一个清晰、可验证的数值范围，不是 Wilson 方法的统计限制。函数不接受准确率小数作为答对数，也不推测独立性是否成立。

```python
# nextchina-example: statistical-inference-confidence-interval
import math
from fractions import Fraction
from statistics import NormalDist

Z95 = NormalDist().inv_cdf(0.975)
MAX_TRIALS = 10_000

def wilson95(successes, trials):
    if type(successes) is not int or type(trials) is not int:
        raise ValueError("答对数与样本量必须是内置整数，不接受布尔值")
    if not 1 <= trials <= MAX_TRIALS or not 0 <= successes <= trials:
        raise ValueError("需要 1 <= n <= 10000 且 0 <= k <= n")
    z2 = Z95 * Z95
    # 使用解析边界，避免相减舍入让零端点变成微小正数。
    if successes == 0:
        return 0.0, z2 / (trials + z2)
    if successes == trials:
        return trials / (trials + z2), 1.0
    phat = successes / trials
    denominator = 1.0 + z2 / trials
    center = (phat + z2 / (2 * trials)) / denominator
    half_width = Z95 * math.sqrt(
        phat * (1.0 - phat) / trials + z2 / (4 * trials * trials)
    ) / denominator
    return center - half_width, center + half_width

# 与独立计算后写入的参考端点比对，不用同一函数产生期望值。
references = [
    (80, 100, (0.7111708344068413, 0.8666330666689674)),
    (320, 400, (0.7580296831332990, 0.8362629402661231)),
    (20, 20, (0.8388748419471808, 1.0)),
]
for k, n, expected in references:
    actual = wilson95(k, n)
    assert all(math.isclose(a, b, rel_tol=0.0, abs_tol=1e-12)
               for a, b in zip(actual, expected))
    print(f"{k}/{n}: [{actual[0]:.6f}, {actual[1]:.6f}]")

# 下界、上界及支持范围边缘，连同成功/失败互换的对称性。
for n in (1, 2, 20, 100, MAX_TRIALS):
    for k in sorted({0, 1, n // 2, n - 1, n}):
        lower, upper = wilson95(k, n)
        mirror_lower, mirror_upper = wilson95(n - k, n)
        assert 0.0 <= lower <= k / n <= upper <= 1.0
        assert math.isclose(lower, 1 - mirror_upper, rel_tol=0, abs_tol=1e-12)
        assert math.isclose(upper, 1 - mirror_lower, rel_tol=0, abs_tol=1e-12)
    assert wilson95(0, n)[0] == 0.0
    assert wilson95(n, n)[1] == 1.0

# 固定教学总体 n=100, p=4/5：端点与score不等式分别决定纳入哪些k。
p = Fraction(4, 5)
n = 100
included = [k for k in range(n + 1)
            if wilson95(k, n)[0] <= float(p) <= wilson95(k, n)[1]]
z2_exact_float = Fraction.from_float(Z95) ** 2
included_by_score = [k for k in range(n + 1)
    if (Fraction(k, n) - p) ** 2 <= z2_exact_float * p * (1 - p) / n]
assert included == included_by_score == list(range(73, 88))
# 二项质量的分母相同，可先累加整数分子，避免浮点下溢及求和误差。
total_mass = Fraction(sum(math.comb(n, k) * 4**k for k in range(n + 1)), 5**n)
coverage = Fraction(sum(math.comb(n, k) * 4**k for k in included), 5**n)
assert total_mass == 1
assert coverage < Fraction(95, 100)
assert math.isclose(float(coverage), 0.9405196171395281, rel_tol=0, abs_tol=1e-15)
print(f"n=100, p=0.8: coverage={float(coverage):.6f}")

bad_inputs = [
    (0, 0), (0, -1), (-1, 10), (11, 10), (1, 10001),
    (True, 10), (1, True), (1.0, 10), (1, 10.0),
    ("1", 10), (1, "10"), (None, 10), ([], 10), (1, [10]),
    (float("nan"), 10), (1, float("nan")),
    (float("inf"), 10), (1, float("inf")),
    (1, 10**1000), (10**1000, 10), (complex(1, 0), 10),
]
for args in bad_inputs:
    try:
        wilson95(*args)
    except ValueError:
        pass
    else:
        raise AssertionError("非法计数或超出教学范围的输入未被拒绝")
```

四行输出依次为 `80/100: [0.711171, 0.866633]`、`320/400: [0.758030, 0.836263]`、`20/20: [0.838875, 1.000000]`、`n=100, p=0.8: coverage=0.940520`。区间端点和正态分位数仍是浮点近似；精确有理数只用于这一固定二项实验的质量累加与 score 核对。本例没有实现任意置信水平、任意巨大样本量或通用高精度区间库。

## 7. 区间算对了，还要检查什么？

区间只量化指定抽样模型内的误差。下面的问题不能靠“样本足够大”自动解决：

- **重复或相关样本**：同一邮件复制 100 次不等于 100 份独立证据。独立性失效后，第 2 节方差中的协方差项不能丢掉；相关样本需按真实采样单元设计分析。官方交叉验证文档专门区分分组与时间序列数据。[3]
- **泄漏与测试集调参**：用测试答案训练、选择阈值、挑模型，或看一次分数就修改再测，会让“预先固定模型的独立测试”前提失效。预处理也应避免从保留集学习信息。[3] 具体划分策略另见 [训练、验证与测试](?view=garden&scope=concept:train-validation-test)。
- **分布改变与选择偏差**：只从整洁、短小邮件中取样，不能代表所有目标邮件；从旧场景得到的 $p_D$ 区间，也不自动约束新场景的 $p_{D'}$。这是 [分布偏移](?view=garden&scope=concept:distribution-shift) 与 [评测数据集](?view=garden&scope=concept:evaluation-dataset) 的后续问题。
- **目标量与指标改变**：本页的 $K$ 是 $n$ 个等权 0/1 正确性指标之和。F1、宏平均、加权分数或一次训练后多折分数不自动服从这个二项模型，不能把它们乘上样本数冒充答对数。
- **判分与训练的不确定性**：标签争议、裁判误差、重新训练的随机性、不同训练集带来的变化，都未被这个固定分类器的区间纳入。应分别报告和设计实验。
- **从区间跳到决策**：两个模型的区间重叠与否不能代替差异检验。同一批样本上的结果尤其有配对关系；“检测不到差异”也不等于“效果相等”。比较方案与 [统计功效](?view=garden&scope=concept:statistical-power) 需另行设计。

要让结果可解释，至少记录目标分布、模型与数据版本、样本数、独立采样单位、判分方式、区间方法以及是否用过测试结果做选择。完整的 [评测协议](?view=garden&scope=concept:benchmark-protocol) 还包含更多控制项，本页只为其中的统计解释提供基础。

## 8. 自测：你能把结论说到哪里？

**练习 1**：A 次评测为 80/100，B 次为 320/400。能否说 B 的分类器更准确？

**答案**：不能。观察比例相同；在本页假设下，B 对其目标准确率的估计更精细。仅凭这两个汇总数，连是否同一分类器、同一总体也不知道。

**练习 2**：20 封全对，为什么不能报告“总体准确率 100% 且无误差”？

**答案**：没观察到错误不等于错误概率为零。Wilson 区间为约 [83.8875%, 100%]；若只陈述这份固定试卷的得分，100% 没问题，但不能把它变成总体保证。

**练习 3**：把同一份 100 封邮件反复运行 100 次，能按 10000 个样本报告更窄区间吗？

**答案**：对于固定、确定性分类器，重复运行只是重复同一批结果，没有新增来自 $D$ 的独立邮件。若预测本身随机，重复运行可研究另一种随机性，但不是本页的独立新邮件抽样。

**练习 4**：代码精确枚举的覆盖率约为 94.052%，是否说明程序算错了“95%”？

**答案**：不是。这里名义 95% 来自正态阈值；离散二项分布下的实际覆盖率取决于 $n,p$。枚举揭示了该近似方法在这个参数点的真实性能，不是在估计一次已观察区间包含参数的后验概率。

## 来源与核验范围

[1] NIST/SEMATECH，[e-Handbook 1.3.5.2：Confidence Limits for the Mean](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm)。使用其“置信水平属于方法、固定区间包含或不包含真值”的解释；本页没有把均值的 t 区间直接套给二项准确率。

[2] NIST/SEMATECH，[e-Handbook 7.2.4.1：Confidence intervals](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm)。核对 Wilson 的 score 反演、双侧公式、large-sample 限定与另外列出的二项尾概率方法。该页术语说明明确区分 Wilson 与 adjusted Wald / Agresti–Coull；本页使用 Wilson，未实现后两者。

[3] scikit-learn 官方文档，[3.1：Cross-validation: evaluating estimator performance](https://scikit-learn.org/stable/modules/cross_validation.html)。核对测试集调参导致泄漏、预处理的保留集隔离、分组与时间序列假设；访问时页面标为 1.9.1 文档。文档的交叉验证示例没有被当成本页二项区间的有效性证明。

核验日期：2026-10-05。NIST 页面未标可固定的软件版本，以本次访问的章节内容为准；scikit-learn 的 `stable` 链接可能随发布更新。本页推导、三个区间与固定二项覆盖率均为教学分析，未训练或测试真实分类器，未作商业模型可靠性判断，也未完成独立专家复核；审查状态保留 `needs-independent-review`。独立讲解范围仅为统计推断与置信区间，后续阅读入口不代表对应主题已经完整覆盖。
