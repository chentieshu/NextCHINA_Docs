> **本页解决的问题**：原始输入全答对，加了几种变化也全答对，能否说模型“已经鲁棒”？怎样把“没找到错误”“所有测试变化都正确”和“所有允许输入都正确”分开？
>
> 前置知识：[分类与准确率](?view=garden&scope=branch:llm:rankings/metrics)、[评价数据集](?view=garden&scope=branch:llm:rankings/datasets)、[评测协议](?view=garden&scope=branch:llm:rankings/protocol)，以及闭区间、绝对值。可选阅读：[范数与距离](?view=garden&scope=concept:norm-distance)。本页只独立讲解[鲁棒性](?view=garden&scope=concept:robustness)，使用原创一维函数和固定教学工作量，不运行真实模型，也不借用论文数据。

## 1. “对变化不敏感”还缺哪些条件？

先想一个分类器：输入稍微改变后，答案始终不变。它可能一直正确，也可能一直错误。因此本页研究的是**变化后的正确性**，不会用预测不变代替它。

一个可复查的鲁棒性问题至少要固定六项：

1. **任务**：要判断什么，参考标签由什么规则确定
2. **系统**：模型参数、预测规则，以及解码、归一化等预处理
3. **输入域**：哪些输入有意义，超出范围怎样处理
4. **变化集合**：允许怎样改输入，在哪里施加变化
5. **预算**：变化大小怎样度量，最大可以多大
6. **汇总对象**：哪些案例、各占多少权重，取平均还是逐例最坏

例如“图片每个像素最多改变某个值”，并没有自动证明改变后的图片仍属于原来的类别。测量单位换了、像素缩放换了，同一个数字预算也可能代表不同变化。对真实任务，标签保持性需要任务知识、标注或其他证据；不能从距离小直接推出。

若预处理是 $p$，分类模型是 $h$，对外系统就是 $f=h\circ p$。在原始输入上改变后再预处理，与直接改变模型接收的张量，定义的是两个可能不同的集合。本页把预处理固定为恒等映射：输入一个数，分类器就看到这个数。

先声明允许集合、再对每条案例考察集合内的最坏情况，是 [Madry 等 §2、式 (2.1)](https://arxiv.org/pdf/1706.06083v4) 的稳健风险表述所强调的结构。本页不训练模型、不实现其搜索方法，只借此明确问题的量词；写出优化目标并不等于已经求得最坏值。

### 本课的任务与模型

输入域是实数闭区间 $D=[-3,3]$。参考标签为：

$$
g(x)=\begin{cases}
0,&x<0\\
1,&x\ge0
\end{cases}
$$

固定分类器故意留有一个狭窄的错误缺口：

$$
\rule{0pt}{3em}f(x)=\begin{cases}
0,&x<0\\
0,&5/4\le x<4/3\\
1,&\text{其余输入}
\end{cases}
$$

这不是拟合出来的神经网络，而是**完整定义已知的字面函数**。在 $5/4$ 处预测0，在 $4/3$ 处预测1；两个等号不能随意交换。

对中心 $x_i\,$，变化量记作 $\delta$，预算为 $\varepsilon$：

$$
|\delta|\le\varepsilon
$$

允许输入为整个闭区间：

$$
A_i=[x_i-\varepsilon,\ x_i+\varepsilon]
$$

本课只接受完整位于 $D$ 内、且 $g$ 在其中不变的区间。我们不把越界部分剪掉，也不把跨过标签边界的点继续算作原标签。

例如 $x=1/4,\varepsilon=1/2$ 给出 $[-1/4,3/4]$，包含两种参考标签，因而不属于本课的有效输入。把半径扩大，可能先让错误暴露，也可能使原来的任务前提失效。两者必须分开。

## 2. 四个分数，四种问题

一条记录可以代表多条相同案例。令其次数为 $n_i>0$，总案例数为 $N=\sum_i n_i\,$。重复次数只规定这份工作量的权重，不意味着这些记录是独立随机样本。

在标签保持性已确认后，定义正确指示量：

$$
C_i(\delta)=\mathbf1\{f(x_i+\delta)=y_i\}
$$

其中 $y_i=g(x_i)$。值为1表示正确，0表示错误。下面每个分数都先定义每条案例的量，再按案例次数汇总。

### 清洁准确率

不做变化，只检查原始输入：

$$
A_{\rm clean}=\frac1N\sum_i n_i C_i(0)
$$

分母是 $N$ 条案例。它是基线，不能替代变化后的评测。

### 平均变化准确率

先声明变化分布 $q_i\,$，再平均：

$$
A_{\rm avg}=\frac1N\sum_i n_i
\mathbb E_{\delta\sim q_i}[C_i(\delta)]
$$

本课程序采用同一份含 $k$ 个不同探针的列表 $P$，各探针概率为 $1/k$。于是每条案例有 $k$ 次判分，分母是 $Nk$，分子是所有“案例×探针”的正确次数。

如果偏向容易的变化、改了变化类型的比例，平均分就可能升高，模型却没有变化。要比较平均分，必须连同变化分布一起比较。本课没有把这个平均称作 ImageNet-C 的 mCE；后者还有自身的基线归一化约定。[Hendrycks 与 Dietterich §3–4.2](https://arxiv.org/pdf/1903.12261v1) 区分平均腐蚀表现、预测一致性与最坏情况，并列出了其特定基准的度量。

### 测试集合最坏准确率

对一条案例，必须所有已测探针都正确：

$$
t_i=\min_{\delta\in P_i} C_i(\delta)
$$

$$
A_{\rm test}=\frac1N\sum_i n_i t_i
$$

这里“最坏”只针对**列出的有限集合**。一条案例测试十次、错一次，就不计入分子；不会因为其余九次正确而记为0.9条。分母仍然是 $N$，不是测试调用总数。

### 完整允许集合鲁棒准确率

要求每一个允许变化都正确，包括没有显式试过的输入：

$$
r_i=\min_{|\delta|\le\varepsilon} C_i(\delta)
$$

$$
A_{\rm all}=\frac1N\sum_i n_i r_i
$$

这个“全部”是数学上的全称要求。它针对固定的 $N$ 条中心及各自允许集合，仍不是“整个现实总体都正确”。本课的集合非空，指示量只取0或1，因此这里的最小值含义明确。

若每个 $P_i\,$ 都包含0，且是对应允许集合的子集，则逐例都有 $r_i\le t_i\le C_i(0)$。使用相同的非负权重汇总后：

$$
A_{\rm all}\le A_{\rm test}\le A_{\rm clean}
$$

**有限搜索没找到错误，给出的测试最坏准确率是完整集合鲁棒准确率的上界。** 这不提供“完整集合至少这么好”的保证。找到一个合法错误，则足以否定该案例的全称正确性。

在同一测试集合上，还有 $A_{\rm test}\le A_{\rm avg}\,$，因为“全部正确”不可能比“正确比例”大。平均变化准确率与清洁准确率则没有一般的大小关系：变化也可能把原本错误的点移到正确区。

## 3. 三个探针怎样漏掉缺口？

下面三行代表20条固定案例。组名只是便于检查的切片，没有自然人或敏感属性。

| 中心 $x$ | 标签 | 次数 |
|---|---:|---:|
| −2 | 0 | 9 |
| 2 | 1 | 9 |
| 1 | 1 | 2 |

前两行属于 **far** 组，共18条；\
最后一行属于 **notch-near** 组，共2条。半径固定为 $\varepsilon=1/2$。三个允许区间分别为 $[-5/2,-3/2]$、$[3/2,5/2]$、$[1/2,3/2]$，全部在域内，参考标签也都不变。

三个中心都预测正确，所以清洁准确率为 $20/20=1$。

先测试：

$$
P_3=\{-1/2,\ 0,\ 1/2\}
$$

最靠近错误缺口的中心 $x=1$ 被送到 $1/2,1,3/2$，这三点都不在缺口内。far 组的点也全部正确。因此60次测试都正确，20条案例也都通过所有探针：

- 平均变化准确率：$60/60=1$
- 测试集合最坏准确率：$20/20=1$

但取 $\delta=3/10$，中心1会被送到 $13/10$。它仍为正数，标签没有改变，且：

$$
5/4\le13/10<4/3
$$

分类器在那里报0，真实标签为1。这就是一个**合法反例**。先前的三探针没有覆盖这个窄区间。

现在把它加到列表：

$$
P_4=\{-1/2,\ 0,\ 3/10,\ 1/2\}
$$

far 的18条案例各通过4次；notch-near 的2条案例各通过3次、失败1次。因此：

$$
A_{\rm avg}=\frac{18\times4+2\times3}{20\times4}
=\frac{39}{40}
$$

而测试集合最坏准确率是 $18/20=9/10$，因为两条 near 案例都不再满足“所有探针正确”。

| 范围 | P4正确次数 | P4全通过案例 |
|---|---:|---:|
| far | 72/72 | 18/18 |
| notch-near | 6/8 | 0/2 |
| 全部 | 78/80 | 18/20 |

高平均分 $39/40$ 可以与某个切片“没有一条案例通过全部测试”同时成立。这份表应保留两个分母，而不是只给一个“鲁棒性97.5%”。

## 4. 何时有限计算能够证明整个区间？

三点搜索失败，为什么下面的有限程序又敢检查无限多个实数？区别在于：我们知道字面函数的**全部分段边界**，并证明每个未逐点检查的区域上预测是常数。证明来自函数结构，不能由“取了很多点”替代。

### 分区证明

对合法闭区间 $[a,b]$，执行以下步骤：

1. 收集 $a,b$，以及区间内所有分段点 $0,5/4,4/3$
2. 排序并去重，单独检查每一个收集到的点
3. 每对相邻分段点之间若存在开区间，检查它的中点
4. 所有检查都与该案例标签相同，才判定整段正确

这些单点与开区间构成 $[a,b]$ 的不重不漏划分。每个开区间内没有模型分段点，所以 $f$ 恒定；参考标签又已确认在整段不变。中点正确等价于所在整个开区间正确。边界点单独检查，负责处理半开缺口的等号。

因此：若程序接受，每一个划分单元都正确，整个区间都正确；若程序拒绝，被检查到的错误点就是区间内的反例。两方向同时成立，所以这对指定函数是**精确判定**。

输入端点与中点使用有理数计算，但结论包括区间中的无理数：它们也位于某个恒定开区间中。代码没有枚举实数，也没有用浮点网格近似实数。

零半径时 $a=b$，排序后只剩一个点，没有开区间；检查这个单点即可。若删除分段点，或只查整个区间的中点，这个证明就不成立。

### 不同结构的核对方法

独立核对可以直接看**错误集合**，不重复实现分区算法。本课错误集合恰好为：

$$
E=[5/4,4/3)
$$

合法负标签区间不与它相交，处处正确。对合法正标签闭区间 $[a,b]$，不与错误集合相交，当且仅当：

$$
b<5/4\quad\text{或}\quad a\ge4/3
$$

若两个条件都不满足，即 $b\ge5/4$ 且 $a<4/3$，取 $z=\max(a,5/4)$。由 $a\le b$ 和 $b\ge5/4$ 可得 $z\le b$；由 $a<4/3$ 和 $5/4<4/3$ 可得 $z<4/3$。于是 $z$ 同时位于 $[a,b]$ 和 $E$，确有错误。这证明了上述条件的另一方向。

端点值得单独列出：

| 输入或区间 | 判定 |
|---|---|
| 单点5/4 | 错误 |
| 单点4/3 | 正确 |
| [1,5/4] | 非处处正确 |
| [4/3,3/2] | 处处正确 |
| [5/4,4/3] | 非处处正确 |

主工作量的两个 far 区间避开错误集合，near 区间与之相交。因此完整区间鲁棒准确率是 $18/20=9/10$；分组为 $18/18$ 与 $0/2$。

本例 P4 的测试最坏准确率恰好等于精确值，但这个相等是由结构证明确认的。不能因为 P4 比 P3 多找了一处错误，就推断任何后续集合都找齐了错误。

本节的“精确”只适用于这一个字面函数和合法区间。换模型、加随机性、改预处理、改标签规则或允许集合，都需要重新论证。它不是神经网络认证器，也不是现实系统安全保证。

## 5. 量词顺序和组权重不能省略

### 谁能选择变化？

逐例最坏要求每条案例都能分别选择最不利的变化。它与“所有案例必须共用同一个变化”不同。

取两个正标签案例 $x_1=11/10$、$x_2=3/2$，各一次；半径 $1/4$，测试列表为 $\{-1/4,0,1/5\}$：

| 变化量 | 案例1正确？ | 案例2正确？ |
|---|---:|---:|
| −1/4 | 1 | 0 |
| 0 | 1 | 1 |
| 1/5 | 0 | 1 |

若每条案例先取自己的最坏值，两条都能找到错误，平均为0。若先固定一个共用变化再平均，三列变化对应的准确率是 $1/2,1,1/2$，最小为 $1/2$。

用短式分别写出这个区别：

$$
\frac1N\sum_i n_i\min_{\delta\in P}C_i(\delta)
$$

$$
\min_{\delta\in P}\frac1N\sum_i n_i C_i(\delta)
$$

这里两式都对列出的有限探针集合 $P$ 取最小。第一式不大于第二式。因为对任意固定 $\delta$，逐例最小值都不大于那一列的值；汇总后，再对右边取最小仍保留不等式。两式可以相等，也可以像本例一样严格不同。报告“最坏情况”时，要交代选择变化的单位。

若改为完整变化区间 $[-1/4,1/4]$，本例也得到0与1/2，但需另行检查：案例1的错误变化为 $[3/20,7/30)$，案例2为 $[-1/4,-1/6)$。两段各自非空且互不相交，所以逐例都可失败，却没有一个共用变化同时让两例失败。这个完整集合结果不是仅由三探针推出的。

### 总分由谁占多少决定？

主工作量里 far 占 $18/20$，near 占 $2/20$。精确组分数分别为1和0，因此按案例汇总为 $9/10$。若问题改为“两组各占一半”，分数就是：

$$
\tfrac12\times1+\tfrac12\times0=\tfrac12
$$

这不是计算误差，而是改了汇总问题。

现在保持模型、半径、输入中心和每组条件表现不变，只把工作量改成 far 两行各1次、near 18次。新的完整集合鲁棒准确率是 $2/20=1/10$；P4平均变化准确率变为 $62/80=31/40$；P3仍然全部通过。

所以总分变化可能来自工作量混合变化，不能只归因于模型变差。组等权的完整集合分数仍是 $1/2$。这些是人为构造的算术反例，既不揭示真实人群分布，也不支持某种组划分最优。

## 6. 一份可运行的精确程序

下面是唯一的可执行示例，全部使用 Python 标准库。分区计算负责整段判断；测试探针只负责有限集合。返回结果始终保留正确数和分母。

### 输入契约

- `cases` 是内建 list 或 tuple，1至64行；每行为内建 dict，键恰好为 `group`、`x`、`label`、`count`
- `group` 只能是内建字符串\
  `far` 或 `notch-near`；只出现一个组也可以。重复案例行保留次数，不自动去重
- `label` 是内建整数0或1，并与参考标签一致；`count` 是1至10000的内建整数
- 中心、半径、探针只接受内建 int 或 Fraction；拒绝 bool、float、字符串、子类和隐式转换。约分后的分子绝对值、分母均不超过1000000
- 半径范围为[0,1]；完整区间必须在[-3,3]中且标签不变。内部有理数运算不再套用公开输入的大小阈值
- 探针列表为内建 list 或 tuple，1至64项，必须含0、数值不重复、绝对值不超过半径；每个探针等概率
- 两个报告函数只接受字面 `toy_predict` 对象；其他 callable 也拒绝。没有 `clip` 参数，不裁剪、不训练、不发网络请求
- 无论成功或失败都不修改输入；非法输入抛出 TypeError 或 ValueError。各组结果仅列实际出现的组

[Python 官方 Fraction 文档](https://docs.python.org/3/library/fractions.html) 说明整数分子/分母的有理数构造与浮点构造的差异。本例用 `Fraction(3, 10)`，不会先把0.3转成二进制浮点再试图恢复“原来的分数”。接口故意比 Fraction 本身支持的输入更窄。

```python
# nextchina-example: robustness-perturbation-scope
from fractions import Fraction

_Q = Fraction
_GROUPS = ("far", "notch-near")
_LIMIT = 1_000_000


def _rational(value, name):
    if type(value) not in (int, Fraction):
        raise TypeError(name + ": expected int or Fraction")
    q = _Q(value)
    if abs(q.numerator) > _LIMIT or q.denominator > _LIMIT:
        raise ValueError(name + ": rational exceeds input limit")
    return q


def _literal(x):
    # Private evaluation: all inputs here are already exact rationals.
    return int(x >= 0 and not (_Q(5, 4) <= x < _Q(4, 3)))


def toy_predict(x):
    x = _rational(x, "x")
    if not -3 <= x <= 3:
        raise ValueError("x: outside [-3,3]")
    return _literal(x)


_SUPPORTED_MODEL = toy_predict


def _validate_cases(cases, epsilon, model):
    if model is not _SUPPORTED_MODEL:
        raise ValueError("only the literal toy_predict is supported")
    e = _rational(epsilon, "epsilon")
    if not 0 <= e <= 1:
        raise ValueError("epsilon: outside [0,1]")
    if type(cases) not in (list, tuple) or not 1 <= len(cases) <= 64:
        raise ValueError("cases: expected 1..64 rows")
    rows = []
    for case in cases:
        if type(case) is not dict or set(case) != {
            "group", "x", "label", "count"
        }:
            raise ValueError("case: wrong schema")
        group, y, count = case["group"], case["label"], case["count"]
        if type(group) is not str or group not in _GROUPS:
            raise ValueError("group: unknown slice")
        if type(y) is not int or y not in (0, 1):
            raise ValueError("label: expected integer 0 or 1")
        if type(count) is not int or not 1 <= count <= 10000:
            raise ValueError("count: expected integer 1..10000")
        x = _rational(case["x"], "x")
        lo, hi = x - e, x + e
        if lo < -3 or hi > 3:
            raise ValueError("interval: outside domain; no clipping")
        if y != int(x >= 0):
            raise ValueError("label: disagrees with reference")
        if not (hi < 0 or lo >= 0):
            raise ValueError("interval: changes reference label")
        rows.append((group, x, y, count, lo, hi))
    return tuple(rows), e


def _validate_probes(deltas, epsilon):
    if type(deltas) not in (list, tuple) or not 1 <= len(deltas) <= 64:
        raise ValueError("deltas: expected 1..64 probes")
    probes = tuple(_rational(d, "delta") for d in deltas)
    if len(set(probes)) != len(probes):
        raise ValueError("deltas: duplicate numeric probes")
    if _Q(0) not in probes:
        raise ValueError("deltas: must include zero")
    if any(abs(d) > epsilon for d in probes):
        raise ValueError("delta: exceeds budget")
    return probes


def _summarize(rows, score):
    # Each summary receives only its own rows and denominator.
    return {
        "total": score(rows),
        "groups": {
            g: score(tuple(r for r in rows if r[0] == g))
            for g in _GROUPS if any(r[0] == g for r in rows)
        },
    }


def probe_report(cases, deltas, epsilon, *, model=toy_predict):
    rows, e = _validate_cases(cases, epsilon, model)
    probes = _validate_probes(deltas, e)

    def score(selected):
        n = sum(r[3] for r in selected)
        clean = correct = robust = 0
        for _, x, y, count, _, _ in selected:
            clean += count * (_literal(x) == y)
            passed = tuple(_literal(x + d) == y for d in probes)
            correct += count * sum(passed)
            robust += count * all(passed)
        trials = n * len(probes)
        return {
            "cases": n,
            "clean_correct": clean,
            "clean_accuracy": _Q(clean, n),
            "probe_trials": trials,
            "probe_correct": correct,
            "average_accuracy": _Q(correct, trials),
            "tested_robust_correct": robust,
            "tested_robust_accuracy": _Q(robust, n),
        }

    return _summarize(rows, score)


def _partition_correct(lo, hi, y):
    cuts = {lo, hi}
    for point in (_Q(0), _Q(5, 4), _Q(4, 3)):
        if lo <= point <= hi:
            cuts.add(point)
    ordered = sorted(cuts)
    # All singleton boundaries plus one point per open constant region.
    witnesses = ordered + [
        (left + right) / 2
        for left, right in zip(ordered, ordered[1:])
    ]
    return all(_literal(z) == y for z in witnesses)


def exact_interval_report(cases, epsilon, *, model=toy_predict):
    rows, _ = _validate_cases(cases, epsilon, model)

    def score(selected):
        n = sum(r[3] for r in selected)
        correct = sum(
            count * _partition_correct(lo, hi, y)
            for _, _, y, count, lo, hi in selected
        )
        return {
            "cases": n,
            "robust_correct": correct,
            "robust_accuracy": _Q(correct, n),
        }

    return _summarize(rows, score)


cases = [
    {"group": "far", "x": -2, "label": 0, "count": 9},
    {"group": "far", "x": 2, "label": 1, "count": 9},
    {"group": "notch-near", "x": 1, "label": 1, "count": 2},
]
epsilon = _Q(1, 2)
probes3 = [-epsilon, 0, epsilon]
probes4 = [-epsilon, 0, _Q(3, 10), epsilon]
p3 = probe_report(cases, probes3, epsilon)
p4 = probe_report(cases, probes4, epsilon)
intervals = exact_interval_report(cases, epsilon)
print("clean", p3["total"]["clean_accuracy"])
print("tested P3", p3["total"]["tested_robust_accuracy"])
print("average P4", p4["total"]["average_accuracy"])
print("tested P4", p4["total"]["tested_robust_accuracy"])
print("exact intervals", intervals["total"]["robust_accuracy"])
for group in intervals["groups"]:
    print(group, intervals["groups"][group])
```

程序打印的五个总分依次为1、1、39/40、9/10、9/10。完整字典还保留 `cases`、`probe_trials` 及相应正确数，不能只抄简化后比例而丢掉样本支持。

两个报告中 `cases` 字段都表示该范围内的 $\sum_i n_i\,$，即 `count` 的总和；分组字典只对本组求和，不是记录行数。主例的总 `cases` 为20，far为18，near为2。

`probe_report` 的平均分以案例数乘探针数为分母；测试最坏分以案例数为分母。`exact_interval_report` 的正确数只累计整段处处正确的案例。程序没有以“中心数3”代替“案例数20”，也不会对两个组自动等权。

### 为什么拒绝，而不是悄悄修复？

将越界区间剪回定义域，会缩小允许集合，让问题变容易；剔除重复探针，会改变用户给出的变化分布；把 float 近似成分数，可能改变半开区间的端点归属。这些都不是中性的清理。因此接口要求调用者先修正说明与输入，再重新运行。

输入行数、次数和有理数大小上限只是为了把教学程序的计算量限制住，不是鲁棒性的数学定义。数学论证适用于声明的字面实数函数；程序对外只接收能精确表达且满足契约的有理参数。

## 7. 哪些结论不能从分数跳过去？

**“输出没变，所以鲁棒。”** 在 $x=13/10,\varepsilon=0$ 时，唯一输出稳定为0，但参考为1，清洁、测试和完整集合正确率都为0。稳定性问题应另用“变化后是否仍等于原预测”表述，不能偷换为“是否等于真值”。

**“搜了很多次，都没找到错误，所以认证通过。”** 搜索可能漏掉窄区间；搜索失败只是当前方法和预算下没有找到反例。精确证明还需覆盖所有允许点的理由。本课的分段结构提供了这个理由，普通黑盒调用次数本身没有提供。

**“半径变大，分数一定按同一规则继续算。”** 若两个半径的允许集合嵌套，且任务标签、模型、工作量与评分都保持有效，那么逐例完整集合正确性随半径增大不会变好。但跨标签或越域后，本课拒绝继续用旧问题打分。负标签区间的右端点等于0时已跨标签，正标签区间的左端点等于0却仍合法，因为 $g(0)=1$。

**“平均腐蚀测试很好，现实变化就有保障。”** 合成变化集合与现实数据收集造成的变化，不是相同的分布。本页没有给两者建立覆盖或转移定理。[Taori 等 §3.1、§4.2–4.3](https://proceedings.neurips.cc/paper_files/paper/2020/file/d8330f857a17c53d217014ee776bfd50-Paper.pdf) 在其2020图像分类试验范围内比较了合成与自然变化，提示从一种测试推到另一种需要证据。这既不是2026模型排名，也不表示任何合成测试都无用或不可能发生转移。

**“20条里18条整段正确，所以总体有90%保证。”** 本课20条是固定构造工作量，重复次数不是独立抽样依据。整段的函数证明与总体统计推断是两个层次。若要推断现实总体，需另说明目标总体、抽样/聚类机制、标签质量与选择过程；可先读[置信区间与抽样](?view=garden&scope=branch:llm:rankings/methodology)，不能把本课计数直接配上区间就称为实证证据。

### 一句可复查的结论

“在预处理恒等、参考阈值为0、字面缺口分类器固定、半径1/2且标签不变的20条构造案例上，三探针全部通过；加入3/10后，平均正确78/80，18/20条通过全部四探针。依据全部分段边界的证明，18/20条在整个闭区间上处处正确；near组为0/2。未测试真实数据分布或任何真实模型。”

这句话长一些，却把模型、任务、集合、分母、证据与限制都留住了。

## 8. 自测

1. 若near组改为18条、far两行各1条，求清洁、P3测试最坏、P4平均、P4测试最坏、完整集合五个总分
2. 区间[1,5/4]和[4/3,3/2]哪个处处正确？若把缺口改为开区间(5/4,4/3)，第一个答案怎样变化？哪些代码和证明必须同步更新？
3. 用 $x=-1/4$ 和 $x=1/4$、同为半径1/4，解释为什么一个输入必须拒绝而另一个合法
4. 不含0的探针列表为何可能使测试最坏分高于清洁分？用本页模型给出一个具体反例；说明本课API会怎样处理它
5. 两个量词比较案例中，为何不能用“最坏的一个共用探针”替代逐例最坏？这会使报告变乐观还是变悲观？
6. 若一份现实报告只写“100次扰动都没成功，鲁棒率100%”，还缺哪些信息？即使补齐信息，哪种结论仍不能由失败搜索推出？

## 9. 自测答案

1. 清洁1，P3测试最坏1，P4平均31/40，P4测试最坏1/10，完整集合1/10。P4总分母80，正确62；后两个分母20，正确2。near为54/72次正确、0/18条全通过；far为8/8次正确、2/2条全通过。组等权的完整集合分数仍为1/2
2. [1,5/4]失败，因为5/4属于错误集合；[4/3,3/2]成功，因为4/3已离开缺口。若改成开区间，第一个区间会成功。预测器端点规则、错误集合交集条件、分区边界判值以及所有端点测试都要同步更新，原证明不能原封不动套用
3. 负中心的区间[-1/2,0]包含标签1的点0，不能沿用标签0；正中心的区间[0,1/2]全部为标签1，所以合法
4. 取中心13/10、半径1/10，只测变化1/10。中心在错误缺口内，清洁为0；变化后7/5在缺口外，唯一探针正确，测试最坏为1。该区间标签保持，但列表缺少0，本课API拒绝它。大小关系中的完整集合≤测试集合仍成立，测试集合≤清洁则失去依据
5. 每条案例各自能找到错误，所以逐例最坏为0；共用探针最多同时使一条错误，最坏平均为1/2。把后者冒充前者，会给出更乐观的分数。变化选择的单位是定义的一部分
6. 至少补任务/参考标签、模型和预处理版本、有效域、允许集合/预算、变化施加位置、案例与切片支持、搜索方法/次数分配、0是否纳入、失败/超时如何算及分母。补齐后可以复述指定搜索未找到反例，仍不能仅由此证明全部允许输入正确，也不能推出自然分布或总体保证

## 10. 来源与复查范围

资料复查日期：2026-10-05。正文用到的原理均按以下版本限缩理解；表格、数字、函数、证明和练习为本页原创。没有复制论文数据、下载基准资产或重跑论文模型。

- [Madry 等，ICLR 2018；本页读取 arXiv v4，2019-09-04](https://arxiv.org/pdf/1706.06083v4)：§1–2、式(2.1)，用于允许集合与逐例最坏的量词结构；没有将搜索成功率等同于求得全局最坏值
- [Hendrycks 与 Dietterich，ICLR 2019；arXiv v1，2019-03-28](https://arxiv.org/pdf/1903.12261v1)：§3–4.2，用于区分平均表现、一致性、最坏情况及基准专属指标；本课39/40不是mCE
- [Taori 等，NeurIPS 2020会议论文](https://proceedings.neurips.cc/paper_files/paper/2020/file/d8330f857a17c53d217014ee776bfd50-Paper.pdf)：§3.1、§4.2–4.3，用于限制合成测试向自然变化的外推。其历史结果不作为当前能力证据
- [Python 官方 fractions 文档](https://docs.python.org/3/library/fractions.html)：有理数构造和浮点转换说明；本例实际隔离运行版本为 Python 3.12.14，不以在线文档的版本号冒充运行环境

本页状态仍为 needs-independent-review；并未声称专家审核。有限程序的作者检查不替代独立内容审核，也不替代未来集成后的页面与回归验证。
