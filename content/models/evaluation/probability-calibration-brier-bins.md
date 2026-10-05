> **本页解决的问题**：两个分类器都答对 75%，一个报 25% / 75%，另一个报 10% / 90%。它们的概率一样可信吗？为什么一箱 ECE 可以等于零，Brier 分数却仍有差别？
>
> 前置知识：[条件概率、期望与方差](?view=garden&scope=branch:llm:math/probability)、[分类阈值与准确率](?view=garden&scope=branch:llm:rankings/metrics)。涉及推断与数据职责时，可接着读[置信区间与抽样](?view=garden&scope=branch:llm:rankings/methodology)、[训练、验证与测试](?view=garden&scope=branch:llm:training/samples)。本页所有记录均为教学构造，不是任何真实模型的成绩；代码仅用 Python 标准库，实际运行版本见文末。

## 1. 先给“90%”一个明确的事件

假设任务是识别垃圾邮件。**正事件固定为：这封邮件按事先确定的标注规则属于垃圾邮件。** 是垃圾邮件记 $Y=1$，否则记 $Y=0$。模型输出 $Q\in[0,1]$，表示它给这个正事件的预测概率。给出 $Q=0.9$ 不是说“这封邮件有九成是真的”，也不是对模型整体质量打 90 分。

还必须指定目标总体，例如某类邮箱在某个期间收到的邮件及其标签。固定预测器和这个总体后，**总体校准**要求：在得到同一个预测概率的邮件中，正事件发生的条件概率与预测相符。对离散分数可写成：

$$
P(Y=1\mid Q=q)=q
$$

这针对总体中实际可能出现的分数。连续分数中，单点事件 $Q=q$ 可能概率为零，更一般的写法是：

$$
\mathbb E[Y\mid Q]=Q\quad\text{几乎处处}
$$

“几乎处处”意味着允许忽略总体概率为零的例外；不是要求有限测试集里每一个不同小数都拥有足够多的记录。有关完整类别概率与不同诱导校准问题的区别，可参见 [Vaicenavicius 等，§3](https://proceedings.mlr.press/v89/vaicenavicius19a/vaicenavicius19a.pdf)。本页只处理二元正事件，不把这个定义直接替换成多类别的最高置信度定义。

有限数据里只能数出观察比例。即使某组四封邮件都报 25%，总体确实满足校准，这四封也不必恰好有一封垃圾邮件。反过来，恰好一封也不能证明总体校准。**“总体中的条件概率相符”与“这些记录上的同分数分组恰好匹配”要分开说。**

## 2. 同样的分类决定，不同的概率

下面是八条固定记录。L、H 只是区分两组的教学编号，每组各四条。三种预测器看的是同一批记录，常数预测器全部报 $1/2$：

| 记录 | 标签 $y$ | 常数 | 25%/75% 概率 | 10%/90% 概率 |
|---|---:|---:|---:|---:|
| L1 | 0 | 1/2 | 1/4 | 1/10 |
| L2 | 0 | 1/2 | 1/4 | 1/10 |
| L3 | 0 | 1/2 | 1/4 | 1/10 |
| L4 | 1 | 1/2 | 1/4 | 1/10 |
| H1 | 0 | 1/2 | 3/4 | 9/10 |
| H2 | 1 | 1/2 | 3/4 | 9/10 |
| H3 | 1 | 1/2 | 3/4 | 9/10 |
| H4 | 1 | 1/2 | 3/4 | 9/10 |

分类规则固定为 $q\ge1/2$ 判 1，**恰好等于阈值也判 1**。因此：

| 预测器 | L / H 的决定 | 准确率 |
|---|---|---:|
| 常数 | 1 / 1 | 1/2 |
| 25%/75% | 0 / 1 | 3/4 |
| 10%/90% | 0 / 1 | 3/4 |

25%/75% 和 10%/90% 预测器的决定完全相同，排序也相同：H 都高于 L，同组内保持并列。可是 L 的观察正例比例是 $1/4$，H 是 $3/4$；10%/90% 的两个概率偏离这些比例各 $3/20$。分类正确数不能分辨这件事。

这也解释了三个不同问题：

- **准确率**：经过指定阈值，多少个类别决定正确？
- **排序或区分能力**：是否把更容易为正的情况放到更高的位置？本例只比较顺序，不计算 AUC
- **校准**：报出的概率值，是否与对应的事件发生频率相符？

还有一个容易混入的概念：概率更靠近 0 或 1，意味着预测更尖锐、更有把握，**不自动意味着它含有更多有效信息**。10%/90% 比 25%/75% 的预测更极端，但没有改变任何分组与排序。

若一个总体的正例率恰好是 $1/2$，永远报 $1/2$ 的预测器在该总体上可以完全校准，却无法区分哪封更可能是垃圾邮件。本表中常数预测器也满足同分数组的观察比例匹配。校准值得检查，但单独追求它还不够。

## 3. Brier：怎样给整个概率预测打分？

本页使用正类概率的二元 Brier **损失**，越小越好：

$$
\begin{aligned}
\ell(q,y)&=(q-y)^2\\
\operatorname{BS}&=\frac1n\sum_{i=1}^n(q_i-y_i)^2
\end{aligned}
$$

因 $0\le q\le1$、$y\in\{0,1\}$，本页的单条损失与平均损失都在 $[0,1]$。例如报 $9/10$ 却出现 $y=0$，损失为 $81/100$；若出现 $y=1$，损失为 $1/100$。它保留了阈值决定丢掉的概率信息。

### 为什么诚实报概率能最小化期望损失？

暂时假设正事件真实概率为 $p$，$Y\sim\operatorname{Bernoulli}(p)$；可自由选择报告 $q\in[0,1]$。直接展开：

$$
\begin{aligned}
\mathbb E[(q-Y)^2]
&=p(q-1)^2+(1-p)q^2\\
&=q^2-2pq+p\\
&=(q-p)^2+p(1-p)
\end{aligned}
$$

最后一项不随报告 $q$ 改变；第一项非负，而且只有 $q=p$ 时为零。因此 $q=p$ 是**唯一**的期望损失最小点，包括 $p=0$ 或 $p=1$。这就是此损失的严格适当性：在这个期望比较里，歪报概率没有收益。

这是对未知真实概率下的**期望**所作的陈述。它不表示看完八条标签后，经验损失最小的概率就是真实概率，也不表示每次有限评估都会把真实概率预测排第一。

Gneiting 与 Raftery 对严格适当性的定义采用“期望奖励越大越好”，其二次评分是完整类别向量的负平方误差；参见 [§1 与 §3 Example 1，印刷页 363](https://www.eecs.harvard.edu/cs286r/courses/fall10/papers/Gneiting07.pdf)。对二元向量 $(1-q,q)$ 与标签向量 $(1-y,y)$，两个分量的平方误差之和为：

$$
\begin{aligned}
&[(1-q)-(1-y)]^2+(q-y)^2\\
&\qquad=2(q-y)^2
\end{aligned}
$$

所以该奖励等于本页单条损失的 $-2$ 倍。改变正比例尺度、再把奖励改为损失，不改变最优报告。比较不同实现时必须先对齐符号与尺度；[scikit-learn 的 Brier API：Notes 与 `scale_by_half`](https://scikit-learn.org/1.9/modules/generated/sklearn.metrics.brier_score_loss.html) 也明确区分二元 $[0,1]$ 与完整类别求和的 $[0,2]$ 约定。

### 八条记录的直接计算

25%/75% 预测器共有六次损失 $1/16$、两次损失 $9/16$，因此：

$$
\operatorname{BS}_{\text{25\%/75\%}}
=\frac{6(1/16)+2(9/16)}8=\frac3{16}
$$

10%/90% 预测器共有六次损失 $1/100$、两次损失 $81/100$：

$$
\operatorname{BS}_{\text{10\%/90\%}}
=\frac{6(1/100)+2(81/100)}8=\frac{21}{100}
$$

| 预测器 | Brier | 本表准确率 |
|---|---:|---:|
| 常数 | 1/4 | 1/2 |
| 25%/75% | 3/16 | 3/4 |
| 10%/90% | 21/100 | 3/4 |

10%/90% 的 Brier 比常数更好，但它的同分数组匹配更差。因此 Brier 不是只测校准的尺子。官方校准指南也提示它同时涉及校准、分辨能力和结果的不确定性；见 [scikit-learn §1.16 的 Note](https://scikit-learn.org/stable/modules/calibration.html)。下一节把本表的这三项直接推导出来。

## 4. 精确分解：必须按相同的分数分组

把预测概率**完全相同**的记录放在一组。对组 $g$，定义：

- $q_g$：组内共同的预测概率
- $n_g$：记录数；$w_g=n_g/n$：样本权重
- $r_g$：该组观察正例比例；$r$：全表观察正例比例

在同分数组内，先把 $q_g-y_i$ 拆成 $(q_g-r_g)+(r_g-y_i)$。展开平方，交叉项因为 $\sum_{i\in g}(r_g-y_i)=0$ 而消失；二元标签的组内平均平方偏差为 $r_g(1-r_g)$。于是：

$$
\frac1{n_g}\sum_{i\in g}(q_g-y_i)^2
=(q_g-r_g)^2+r_g(1-r_g)
$$

再用 $\sum_g w_g r_g=r$、$\sum_g w_g=1$：

$$
\begin{aligned}
\sum_gw_gr_g(1-r_g)
&=r-\sum_gw_gr_g^2\\
&=r(1-r)-\sum_gw_g(r_g-r)^2
\end{aligned}
$$

定义三个量：

$$
\begin{aligned}
\operatorname{REL}&=\sum_gw_g(q_g-r_g)^2\\
\operatorname{RES}&=\sum_gw_g(r_g-r)^2\\
\operatorname{UNC}&=r(1-r)
\end{aligned}
$$

就得到本表的精确恒等式：

$$
\operatorname{BS}=\operatorname{REL}-\operatorname{RES}+\operatorname{UNC}
$$

- **REL，可靠性项**：组内预测与观察比例的平方差，越小越好。这里算的是有限表的经验量，不是已知的总体校准误差
- **RES，分辨项**：不同分数组的观察比例偏离全表比例多少。它奖励分组后出现不同事件率，而不是单纯奖励概率更极端
- **UNC，不确定性项**：本表标签比例带来的 $r(1-r)$。它不是置信区间，也没有直接估计部署总体的不确定性

三个预测器的 $r$ 都为 $1/2$：

| 预测器 | REL | RES | UNC |
|---|---:|---:|---:|
| 常数 | 0 | 0 | 1/4 |
| 25%/75% | 0 | 1/16 | 1/4 |
| 10%/90% | 9/400 | 1/16 | 1/4 |

例如10%/90% 的可靠性项为 $(3/20)^2=9/400$，而分辨项仍为 $(1/4)^2=1/16$，所以：

$$
\frac9{400}-\frac1{16}+\frac14=\frac{21}{100}
$$

它相对常数获得的分辨收益，大于可靠性项的增加。25%/75% 与10%/90% 的 RES 相同，也再次说明“更极端”不等于“更能区分”。

**限制一：同分数分组不是粗分箱。** 若把10%/90% 的全部记录塞进一个箱，用平均预测 $1/2$、平均标签 $1/2$ 算三项，会得到 $0-0+1/4$，而原始 Brier 是 $21/100$。前者是把每条预测都改成箱均值后，新预测器的 Brier；不能冒充原始预测的精确分解。

**限制二：恒等式不保证统计估计有用。** 若每条记录的分数都不同，每组只有一条，则 $r_g=y_i$，REL 直接等于 Brier，RES 等于 UNC。代数仍然成立，却没有因此知道每个分数下的总体事件概率。连续概率需要平滑、分箱或其他估计方法，同时承担新的估计假设与误差。

## 5. ECE：分箱看到了什么，又漏掉什么？

实际记录常没有足够多的完全相同分数，可以先确定若干互不重叠的箱。对非空箱 $b$，用 $\bar q_b$ 表示平均预测概率，$\bar y_b$ 表示观察正例比例，$n_b$ 表示记录数。本页的**正类概率 ECE**定义为：

$$
\operatorname{ECE}
=\sum_{b:n_b>0}\frac{n_b}{n}
\left|\bar q_b-\bar y_b\right|
$$

本页固定端点规则：除最后一箱外左闭右开，最后一箱两端闭合。两箱就是 $[0,1/2)$、$[1/2,1]$；$q=0$ 在第一箱，$q=1/2$ 与 $q=1$ 在第二箱。空箱权重为零，但其均值和观察比例**未定义**，代码输出 `None`，不能伪造为“观察比例 0”。

先看10%/90% 预测器的两箱：

| 箱 | 数量 | 平均预测 | 观察正例率 |
|---|---:|---:|---:|
| $[0,1/2)$ | 4 | 1/10 | 1/4 |
| $[1/2,1]$ | 4 | 9/10 | 3/4 |

$$
\operatorname{ECE}_{\text{两箱}}
=\frac48\frac3{20}+\frac48\frac3{20}
=\frac3{20}
$$

现在只改变箱，不改变任何预测或标签。合成一个 $[0,1]$ 的箱：

| 箱 | 数量 | 平均预测 | 观察正例率 |
|---|---:|---:|---:|
| $[0,1]$ | 8 | 1/2 | 1/2 |

一箱 ECE 变为 0，因为低分组少报的正事件与高分组多报的正事件在取绝对值之前抵消了。它只证明这张表的**全局平均预测等于全局观察比例**。

| 预测器 | 一箱 ECE | 两箱 ECE |
|---|---:|---:|
| 常数 | 0 | 0 |
| 25%/75% | 0 | 0 |
| 10%/90% | 0 | 3/20 |

箱数不是越多就越接近真相：细分会改变统计量，也会减少每箱支持数。固定粗分区即使有大量数据仍可能遮住区间内差异；有限数据又带来随机波动。这类问题由 [Vaicenavicius 等 §4.1、Theorems 1–2 与 §4.2](https://proceedings.mlr.press/v89/vaicenavicius19a/vaicenavicius19a.pdf) 专门讨论；本文的一箱反例只证明本例的抵消，不声称复现论文的渐近定理。

### 同叫 ECE，事件可能不同

Guo 等在 [§2，式 (1)–(3)](https://proceedings.mlr.press/v70/guo17a/guo17a.pdf) 主要按**预测类别的置信度**分箱，比较置信度和“预测类别是否正确”的比例。这是最高标签置信度口径。本文始终按“是垃圾邮件的概率”分箱，比较正例比例。

在二分类阈值 $1/2$ 的设定下，最高标签置信度为 $c=\max(q,1-q)$，正确性为 $z=\mathbf1(\hat y=y)$。它们不是本页的 $q,y$。例如10%/90% 预测器的八条最高标签置信度都为 $9/10$、正确率为 $3/4$；按该口径放在一个箱，误差是 $3/20$。本页正类口径的一箱误差却为零。**比较 ECE 前，先对齐事件、概率对象、分箱和平均方式。** 多类别中只检查最高标签，还会舍去其余类别概率信息。

## 6. 校准映射：拟合、应用、评估是三步

校准也可以指一个后处理过程：冻结原预测器，再从单独的数据学习映射 $m(q)$。Guo 等 [§4 与 §4.1](https://proceedings.mlr.press/v70/guo17a/guo17a.pdf) 介绍了这种验证数据上的后处理及分箱频率方法；[scikit-learn §1.16.2](https://scikit-learn.org/stable/modules/calibration.html) 也解释了为何拟合校准器的数据应与拟合原分类器的数据分离。

这里不训练原分类器，只把第 2 节八条记录明确指定为**校准拟合表**。按原分数分组，学习各组标签平均值：

$$
\begin{aligned}
m(1/10)&=1/4\\
m(9/10)&=3/4
\end{aligned}
$$

这相当于在两个已知分数组内分别最小化经验平方损失。因第 3 节的展开把 $p$ 换成组内经验频率即可，最小点是该组标签平均值。拟合表上的同分数匹配为零偏差，是这个拟合规则带来的结果，不能拿它当作新数据上的成功证据。

**第一步，拟合：** `fit_map(calibration_rows)` 读取拟合表的分数和标签。

**第二步，冻结并应用：** `apply_map(frozen_map, heldout_scores)` 只读取已冻结映射和新记录的原分数，不接收新记录标签。此处“冻结”指之后不再改动字典或重新拟合，不表示 Python 字典本身不可变。此查表器只支持拟合时见过的分数，遇到 $1/2$ 等未知分数会报错，不擅自插值。

**第三步，评估：** 预测已经确定后，才用单独保留的标签计算指标。新的八条**评估记录**如下；它们不是上一表改名，且标签不会传入拟合函数：

| 评估记录 | 标签 $y$ | 原概率 | 映射后 |
|---|---:|---:|---:|
| E1 | 0 | 1/10 | 1/4 |
| E2 | 0 | 1/10 | 1/4 |
| E3 | 1 | 1/10 | 1/4 |
| E4 | 1 | 1/10 | 1/4 |
| E5 | 0 | 9/10 | 3/4 |
| E6 | 1 | 9/10 | 3/4 |
| E7 | 1 | 9/10 | 3/4 |
| E8 | 1 | 9/10 | 3/4 |

| 预测 | 准确率 | Brier | 两箱 ECE |
|---|---:|---:|---:|
| 原概率 | 5/8 | 31/100 | 11/40 |
| 映射后 | 5/8 | 1/4 | 1/8 |

映射后这次较好，但它仍不满足评估表上的同分数匹配：报 $1/4$ 的四条里，有一半是正例。因此其 REL 为 $\tfrac12(1/4-1/2)^2=1/32$，不是零。

这两表都是人为给出的固定数字。“保留”描述函数间的信息职责；不能据此宣称它们是统计独立、同分布的随机样本。真实研究需要另行保证抽样与切分方式。

**改善没有保证。** 保持同一个已拟合映射，换一张每个原分数组各十条、正例率分别恰好为 $1/10$ 与 $9/10$ 的评估表。原概率 Brier 为 $9/100$，映射后反而为 $9/80$。映射把已匹配的概率挪开了，差值是 $9/400$。这只是一个足以否定“总会改善”的算术反例，不是另一项真实实验。

真实校准器还有估计误差与方法选择误差。若看过最终测试标签，再挑映射、分箱、阈值或展示人群，就不能把同一份成绩称为未经选择的最终评估。应在允许用于选择的数据里完成选择，冻结整个流程，再评估。

## 7. 可运行实验：精确分数，不把浮点近似当证据

下面是完整实验。`analyze` 返回准确率、Brier、REL、RES、UNC；`bin_stats` 返回 ECE 与按箱顺序排列的 `(数量, 平均预测, 观察正例率)`。标量结果全部为 `Fraction`，空箱后两个位置为 `None`。

这是一个有意很小的教学 API：

- 记录和分数容器只接受内置 `list` / `tuple`，每次 1–64 条；一条记录恰有 `(q,y)` 两项
- 概率和箱边界只接受内置 `int` 或 `Fraction`，在 $[0,1]$ 内，约分后分母至多 10000；不接受 `bool`、浮点数或字符串自动转换
- 标签只接受内置整数 0 / 1；最多 16 箱，边界严格递增、从 0 到 1
- 映射是 1–64 项内置字典，键值均满足上述概率约定；应用时未知分数报错。上述契约之外的输入统一抛出 `ValueError`

这些上限是方便完整检查的课堂边界，不是统计方法的条件。程序不会修改输入；不支持样本权重、缺失标签、多类别或连续分数的外推。精确有理数的运算成本仍与整数位数有关，不能把一次 `Fraction` 运算当作任意精度下固定成本。

```python
# nextchina-example: probability-calibration-brier-bins
from fractions import Fraction as F

MAX_ROWS = 64
MAX_BINS = 16
MAX_DENOMINATOR = 10000


def _prob(value):
    if type(value) not in (int, F):
        raise ValueError('probability must be an exact int or Fraction')
    value = F(value)
    if not 0 <= value <= 1 or value.denominator > MAX_DENOMINATOR:
        raise ValueError('probability outside classroom bounds')
    return value


def _sequence(values, lower, upper):
    if type(values) not in (list, tuple) or not lower <= len(values) <= upper:
        raise ValueError('expected a bounded list or tuple')
    return values


def _records(rows):
    result = []
    for row in _sequence(rows, 1, MAX_ROWS):
        _sequence(row, 2, 2)
        q, y = row
        if type(y) is not int or y not in (0, 1):
            raise ValueError('label must be built-in int 0 or 1')
        result.append((_prob(q), y))
    return tuple(result)


def _groups(rows):
    groups = {}
    for q, y in rows:
        groups.setdefault(q, []).append(y)
    return groups


def analyze(rows):
    rows = _records(rows)
    n = len(rows)
    rate = F(sum(y for q, y in rows), n)
    accuracy = F(sum(int(q >= F(1, 2)) == y for q, y in rows), n)
    brier = sum(((q - y) ** 2 for q, y in rows), F(0)) / n
    rel = res = F(0)
    for q, labels in _groups(rows).items():
        weight = F(len(labels), n)
        local_rate = F(sum(labels), len(labels))
        rel += weight * (q - local_rate) ** 2
        res += weight * (local_rate - rate) ** 2
    return accuracy, brier, rel, res, rate * (1 - rate)


def bin_stats(rows, edges=(0, F(1, 2), 1)):
    rows = _records(rows)
    edges = tuple(_prob(x) for x in _sequence(edges, 2, MAX_BINS + 1))
    if edges[0] != 0 or edges[-1] != 1:
        raise ValueError('edges must start at 0 and end at 1')
    if any(a >= b for a, b in zip(edges, edges[1:])):
        raise ValueError('edges must be strictly increasing')
    groups = [[] for _ in range(len(edges) - 1)]
    for q, y in rows:
        for j, (left, right) in enumerate(zip(edges, edges[1:])):
            if left <= q < right or (j == len(groups) - 1 and q == 1):
                groups[j].append((q, y))
                break
    ece = F(0)
    summaries = []
    for group in groups:
        count = len(group)
        if count == 0:
            summaries.append((0, None, None))
            continue
        mean_q = sum((q for q, y in group), F(0)) / count
        rate = F(sum(y for q, y in group), count)
        ece += F(count, len(rows)) * abs(mean_q - rate)
        summaries.append((count, mean_q, rate))
    return ece, tuple(summaries)


def fit_map(calibration_rows):
    groups = _groups(_records(calibration_rows))
    return {q: F(sum(labels), len(labels)) for q, labels in groups.items()}


def apply_map(mapping, scores):
    if type(mapping) is not dict or not 1 <= len(mapping) <= MAX_ROWS:
        raise ValueError('mapping must be a nonempty bounded dict')
    checked = {_prob(q): _prob(rate) for q, rate in mapping.items()}
    scores = tuple(_prob(q) for q in _sequence(scores, 1, MAX_ROWS))
    if any(q not in checked for q in scores):
        raise ValueError('unseen score: this lookup map cannot extrapolate')
    return tuple(checked[q] for q in scores)


labels = (0, 0, 0, 1, 0, 1, 1, 1)
raw_scores = (F(1, 10),) * 4 + (F(9, 10),) * 4
quarter_scores = (F(1, 4),) * 4 + (F(3, 4),) * 4
forecasts = {'constant': (F(1, 2),) * 8,
             'quarter': quarter_scores, 'tenth': raw_scores}
print('name accuracy Brier REL RES UNC ECE_one ECE_two')
for name, scores in forecasts.items():
    rows = tuple(zip(scores, labels))
    print(name, *analyze(rows), bin_stats(rows, (0, 1))[0], bin_stats(rows)[0])
print('tenth two-bin (count, mean_q, positive_rate):')
for count, mean_q, rate in bin_stats(tuple(zip(raw_scores, labels)))[1]:
    print(count, mean_q, rate)

calibration_rows = tuple(zip(raw_scores, labels))
frozen_map = fit_map(calibration_rows)
heldout_scores = raw_scores
# Applying the frozen map never receives held-out labels.
heldout_mapped_scores = apply_map(frozen_map, heldout_scores)
heldout_labels = (0, 0, 1, 1, 0, 1, 1, 1)
print('heldout name accuracy Brier ECE_two')
for name, scores in (('raw', heldout_scores), ('mapped', heldout_mapped_scores)):
    rows = tuple(zip(scores, heldout_labels))
    print(name, *analyze(rows)[:2], bin_stats(rows)[0])
assert analyze(calibration_rows)[1] == F(21, 100)
assert bin_stats(calibration_rows)[0] == F(3, 20)
assert analyze(tuple(zip(heldout_mapped_scores, heldout_labels)))[1] == F(1, 4)
print('示例检查通过')
```

关键输出应与第 3–6 节表格一致：10%/90% 的 Brier 为 `21/100`，两箱 ECE 为 `3/20`；保留评估的原概率 / 映射后 Brier 为 `31/100` / `1/4`，两箱 ECE 为 `11/40` / `1/8`。最后一行是“示例检查通过”。打印分数只验证构造数据上的算术，不验证真实模型或总体校准。

补充回归还会反转记录顺序、完整复制记录、互换正负类、改变评估标签以及检查箱端点。完整复制不会改变平均指标，但**没有创造新的独立证据**。互换正负类时，Brier 和三项分解不变；ECE 还必须同时反射箱及端点的归属，不能默认沿用左闭右开的规则后所有边界值仍落在对应箱。

## 8. 自测：先说清统计对象，再计算

**练习 1：零误差代表什么？** 10%/90% 预测器一箱 ECE 为零，能说总体校准吗？

**答案**：不能。这个零只来自八条记录的平均预测与平均标签同为 $1/2$。拆成两箱后 ECE 为 $3/20$，且这仍只是有限表的描述，尚未说明总体。

**练习 2：是不是越保守越好？** 常数预测器的 REL 为零，为什么 Brier 比10%/90%差？

**答案**：常数的 RES 为零；10%/90%增加 $9/400$ 的 REL，却获得 $1/16$ 的 RES，净下降 $1/25$。所以 $1/4-1/25=21/100$。不能只凭 Brier 高低比较校准项。

**练习 3：能否用粗箱偷换分解？** 把10%/90%记录全放在一个箱，得到 REL=0、RES=0、UNC=$1/4$。原 Brier 是否应该改为 $1/4$？

**答案**：不改，原值仍是 $21/100$。$1/4$ 属于将每条预测替换成箱均值 $1/2$ 后的新预测器。精确恒等式要求组内原预测完全相同。

**练习 4：校准是否要求每四条正好一条为正？** 若四次结果独立，正事件概率都确为 $1/4$，恰好一条正例的概率是多少？

**答案**：$4(1/4)(3/4)^3=27/64$，不是 1。总体校准描述条件概率，不强制每个小批次的实际计数。这里的独立同概率是假设，不是由本页八条记录推断出来的。

**练习 5：空箱和阈值。** 只有一条记录 $(q,y)=(1/2,1)$，使用两箱时，两箱摘要、ECE 和准确率分别是什么？

**答案**：第一箱为 `(0, None, None)`。

第二箱为 `(1, 1/2, 1)`；ECE 为 $1/2$，准确率为 1。空箱没有观察正例率；分类正确也不意味着概率损失为零，Brier 此时为 $1/4$。

**练习 6：标签从哪里进入？** 不改拟合表，只把评估标签全部翻转，是否该重新得到一张映射？

**答案**：不该。映射仍是 $1/10\mapsto1/4$、$9/10\mapsto3/4$；应用输出完全不变，只有评估成绩可能变化。根据这次评估反馈重拟合后，需要另留评估证据。

**练习 7：同一个“置信度”。** 10%/90%表按 Guo 的最高标签置信度口径合为一箱，为什么不是零？

**答案**：八条置信度都是 $9/10$，正确性平均数是 $3/4$，差为 $3/20$。本页正类概率的一箱计算使用平均 $q=1/2$ 和平均 $y=1/2$。更换了事件与概率对象，不能把两个结果混报。

**练习 8：整体匹配能覆盖子群吗？** 四条记录都报 $1/2$，其中 A 组标签为 `(0,0)`，B 组为 `(1,1)`，整体及各子群是否都匹配？

**答案**：整体观察比例为 $1/2$，恰好匹配；A 为 0、B 为 1，各偏离预测 $1/2$。整体结果不能保证子群校准，更不能单凭此推断公平性或个体正确性。

## 9. 真正报告时，还要补哪些证据？

一份能被解释的校准评估，至少要交代：

1. **事件与总体**：正类含义、标签规则、目标人群或来源、预测发生时点与评价时间范围
2. **记录怎样来**：抽样方式、计数单位、总样本量、正例数、重复实体或时间相关性如何处理
3. **哪些东西已冻结**：原预测器版本、校准器类型、拟合数据、方法选择数据、最终评估集；阈值若参与评估，也要报告其选择来源
4. **分数的口径**：正类概率还是最高标签置信度、Brier 尺度、ECE 的边界与箱数、空箱处理、每箱数量和均值
5. **误差能否推广**：抽样不确定性、重要子群的支持数与结果，以及部署人群、基础比例或条件关系是否已经改变

有限样本的箱内比例会波动，数据相关、重复记录或标签缺失还会改变推断条件。不能把 ECE 写成“若干次成功 / 总次数”直接套准确率的二项置信区间；也不能把固定构造表上的精确分数解释为部署误差的精确值。关于区间含义和抽样前提，可回到[统计推断与置信区间](?view=garden&scope=branch:llm:rankings/methodology)。

同一个映射在旧总体上表现良好，也不保证新邮箱来源、新时间段或新的正例基础比例下仍然成立。整体校准还可能掩盖子群差异；它没有承诺每个个体都正确、每次高风险决定都安全，或错误后果足够小。是否采取行动还要考虑错误成本和具体任务。

最后，把神经网络输出通过 [Softmax](?view=garden&scope=branch:llm:math/softmax) 归一化，只保证一组数的概率向量形式；Token 的下一步概率也不是一句话事实正确的概率。先明确事件，再谈校准。

## 来源与核验范围

[1] Guo、Pleiss、Sun、Weinberger，[On Calibration of Modern Neural Networks](https://proceedings.mlr.press/v70/guo17a/guo17a.pdf)，ICML 2017。§2 式 (1)–(3) 核对最高标签置信度口径；§4、§4.1 核对保留数据后处理与分箱频率拟合。未把文中 2017 年模型实验结论当作当前模型的表现。本页端点和正类 ECE 约定是明确给出的教学选择。

[2] Vaicenavicius 等，[Evaluating model calibration in classification](https://proceedings.mlr.press/v89/vaicenavicius19a/vaicenavicius19a.pdf)，AISTATS 2019。§3 区分不同校准对象；§4.1、Theorems 1–2 与 §4.2 讨论分区、估计和变异性。本页没有实现其检验或证明渐近定理。

[3] Gneiting、Raftery，[Strictly Proper Scoring Rules, Prediction, and Estimation](https://www.eecs.harvard.edu/cs286r/courses/fall10/papers/Gneiting07.pdf)，JASA 102(477)，2007，359–378。§1 的期望奖励定义、§3 Example 1（印刷页 363）的完整向量负二次评分；本文已转换为正类二元损失。作者站与大学镜像本轮直接打开均失败，相关原文段落经检索索引核对；没有声称重新阅读全文。二元严格适当性与同分数分解的证明均在本页完整展开。

[4] scikit-learn，[Probability calibration](https://scikit-learn.org/stable/modules/calibration.html)，§1.16 的 Note、§1.16.1–1.16.2。核对 Brier 不只测校准、正例可靠性图与校准器拟合的数据分离。

[5] scikit-learn，[brier_score_loss](https://scikit-learn.org/1.9/modules/generated/sklearn.metrics.brier_score_loss.html)，`scale_by_half` 与 Notes。核对正类概率及二元/完整向量的尺度。

核验日期：2026-10-05（UTC）。本次两个 scikit-learn 页面显示 **1.9.1 文档**；`stable` 是可变地址。本例实际运行版本为 Python 3.12.14，没有安装或调用 scikit-learn。全部表格、反例与练习数值为本文构造并作精确计算，不是文献数据复现。

**证据边界**：本页标记代码及作者回归已经运行，覆盖固定表格、独立直接/分组计算、端点与空箱、排列与复制、正负类互换及信息隔离。自动化检查验证教学实现和有限测试，并不证明真实总体校准，也不替代独立专家复核。独立讲解范围仅为**概率校准**；Brier、ECE 和分解作为理解工具，不额外宣称覆盖公平性、鲁棒性、多类别校准、生成式评测或模型榜单。审查状态保留 `needs-independent-review`。
