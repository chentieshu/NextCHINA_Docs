> **本页解决的问题**：训练误差低，是学到了稳定关系，还是记住了这一批标签的偶然变化？当三个模型族都已拟合到各自最优时，怎样分清表示不足、噪声拟合与新观测自身的噪声？
>
> 只需会算平均数和平方。[训练循环](?view=garden&scope=branch:llm:training/loop) 区分目标与优化；[期望与方差](?view=garden&scope=branch:llm:math/probability) 帮助理解重复训练的平均。本页自己推导四点仿射拟合，不要求先掌握逻辑回归。全部数据是完整指定的教学构造，不是真实仪器或模型的性能报告。

## 1. “拟合得好”先要说明在哪些记录上

想象一台有四个档位的测量仪。我们想预测的是某次新测量的读数，而不是复述上一次的读数。**模型族**是允许选择的函数集合，**拟合**是从这份训练记录中选择一个函数；即使已经把训练目标降到该族的最低点，预测新记录仍可能不好。

本文把**欠拟合**具体落实为：所选函数族无法表达任务中的稳定关系，而且这种限制在充分拟合后仍然存在。把**过拟合**具体落实为：对训练记录中的偶然变化拟合得更紧，却损害了对新记录的预测。日常诊断里，“训练和保留误差都高”或“训练低、保留高”是线索，不是已经查明原因的证明。CS229 的泛化章节区分了训练表现、新例表现与两者的差；这里用完全已知的有限过程进一步检查其机制。[1]

对一份训练集 $D$，拟合结果记作 $\widehat f_D$。我们分别计算：

| 量 | 本文的定义 | 对什么平均 |
| --- | --- | --- |
| 训练 MSE | ${\widehat R_D=\frac14\sum_{i=1}^4(\widehat f_D(x_i)-y_i)^2}$ | 这四条训练记录 |
| 新信号风险 | ${R_s(\widehat f_D)=\mathbb E_X[(\widehat f_D(X)-X)^2]}$ | 新输入的干净信号 |
| 新标签风险 | ${R_y(\widehat f_D)=\mathbb E_{X,E}[(\widehat f_D(X)-X-E)^2]}$ | 独立新测量的标签 |
| 重复训练平均 | $\mathbb E_D[R_y(\widehat f_D)]$ | 所有可能训练集及各自拟合结果 |

这里 MSE 是平方残差的平均，不开平方，也没有额外的 $1/2$。它与后续[正则化](?view=garden&scope=branch:llm:training/budget/regularization) 一课的“半均方损失”相差固定倍数，比较数字时不能混用。$R_y-\widehat R_D\,$ 是本文的训练与新标签风险差；风险本身并不等于这个差。

## 2. 先固定数据是怎样来的

新记录按以下过程产生：

- $X$ 等概率取 $-2,-1,1,2$
- 噪声 $E$ 与 $X$、训练记录都独立，等概率取 $-1,+1$
- 标签 $Y=X+E$，所以给定 $X=x$ 的平均标签是 $x$

新记录一共有八个等概率结果：

| $X$ | 两个可能的 $Y$ | 每个 $(X,Y)$ 的概率 |
| --- | --- | --- |
| $-2$ | $-3,-1$ | $1/8$ |
| $-1$ | $-2,0$ | $1/8$ |
| $1$ | $0,2$ | $1/8$ |
| $2$ | $1,3$ | $1/8$ |

训练方式另行规定：**每个档位恰测一次**，顺序按 $x=(-2,-1,1,2)$ 记，四个噪声符号 $e_i\,$ 独立。这是平衡的固定设计，共 $2^4=16$ 份等概率训练数据。它不是从新记录总体中独立同分布抽四个 $X$；后者可能漏掉档位、重复档位，不能直接沿用本页的 16 份枚举或查表拟合规则。

**新记录不等于新特征值。** 新测量的 $X=1$ 完全可能在训练出现过；只要这次独立的标签没有参与拟合，便符合本页任务。反过来，$X=0$ 根本不在声明的总体中；本页不评价这种支持集外预测，代码也明确拒绝它。目标若改成“未见设备”或“未来时间段”，需要重定评估单位，见[训练、验证、测试与泄漏](?view=garden&scope=concept:train-validation-test)。

## 3. 三个嵌套模型族，都从训练标签中实际拟合

| 模型族 | 允许的预测规则 | 在四点支持集上的自由值 |
| --- | --- | ---: |
| 常数 | $f(x)=b$ | 1 |
| 仿射 | $f(x)=b+wx$ | 2 |
| 四值查表 | 每个档位一个自由预测值 | 4 |

常数是斜率为零的仿射函数；任何仿射函数在这四点的取值，也能装进四值表。因此三个族嵌套。在**同一训练数据、同一损失、确实找到最小值**的条件下，扩大函数族不可能使最低训练 MSE 上升：原来的解仍是可选项。这不是总体风险的单调性定理，也没有说更多参数总是更坏或更好。[2]

查表器按 $x$ 存训练响应，并没有偷看新标签、使用行 ID 或获知真实信号。因为本例每个 $x$ 只有一个训练标签，它恰好插值这四条记录。

### 拟合公式不能把真实信号偷偷传进去

对于任意符合四点设计的训练标签，常数拟合是 $\widehat b=\overline y\,$。仿射拟合利用 $\sum x_i=0$、$\sum x_i^2=10$：

$$
\widehat b=\frac14\sum_i y_i,
\qquad
\widehat w=\frac{\sum_i x_i y_i}{10}
$$

这两个公式只需要训练记录。为确认不是“碰巧找到一个驻点”，把仿射训练 MSE 配方，得到：

$$
\widehat R_D(b,w)-\widehat R_D(\widehat b,\widehat w)
=(b-\widehat b)^2+\frac52(w-\widehat w)^2
$$

右边非负，且仅在两个参数都相等时为零，故最优解唯一。常数的同类差值为 $(b-\overline y)^2$。查表器的每个平方项能分别归零，也已经达到唯一的训练最优预测值。

现在仅在**解释拟合结果**时，代入已知教学规律 $y_i=x_i+e_i\,$。令：

$$
S=\sum_i e_i,
\qquad T=\sum_i x_i e_i
$$

便得到常数 $\widehat b=S/4$，仿射 $\widehat b=S/4,\widehat w=1+T/10$，查表 $\widehat f(x_i)=x_i+e_i\,$。代码仍须从 $y_i\,$ 求解，不能直接把这些含真实噪声的解释式当作学习器。

### 表示不足与优化没做完是两回事

就算给常数族最有利的参数，恢复干净信号仍有：

$$
\frac14\sum_x(b-x)^2=b^2+\frac52
\quad\Longrightarrow\quad
\min_b R_s(b)=\frac52
$$

这才是常数族的**近似能力限制**；增加同类训练记录不会让常数变成随档位变化的函数。仿射族则包含 $f(x)=x$，它的最小信号风险为零。若程序停在 $b=w=0$，错误不能据此归咎于仿射族：它可能只是还没把本来可达到的训练目标优化好。现实中还需检查特征、标签、评分尺度和实现错误，不能见到高 loss 就宣布“模型容量不够”。

## 4. 一份具体数据：零差距也可能学得差

先看训练噪声 $(+1,-1,-1,+1)$，对应标签 $(-1,-2,0,3)$。此时 $S=T=0$。

| 拟合器 | 四个档位的预测 | 训练 MSE，除以 4 | 新信号风险，除以 4 | 新标签风险，除以 8 |
| --- | --- | ---: | ---: | ---: |
| 常数 | $(0,0,0,0)$ | $7/2$ | $5/2$ | $7/2$ |
| 仿射 | $(-2,-1,1,2)$ | $1$ | $0$ | $1$ |
| 查表 | $(-1,-2,0,3)$ | $0$ | $1$ | $2$ |

常数的训练误差和新标签风险相同，却没有表达档位关系；仿射的两者也相同，却恰好恢复信号。因此“没有差距”无法区分这两种表现。查表把训练噪声也记住了，训练误差归零，新标签风险反而是仿射的两倍。

为什么新标签风险总比信号风险多 1？先冻结已经拟合的函数，在某个 $x$ 处令 $r=\widehat f(x)-x$。两种独立新噪声的平均为：

$$
\frac{(r-1)^2+(r+1)^2}{2}=r^2+1
$$

再平均四个 $x$，得到 $R_y=R_s+1$。这 1 是在**仅知道 $X$、预测这个带噪标签**时无法消除的部分；它不是说任何新特征或更精细的测量都绝无帮助。若噪声与训练或输入有关、均值不为零，或评分目标改变，上式不能照搬。

这一份训练集只负责说明机制，不能代替对所有可能训练集的平均。

## 5. 把 16 份训练集全部算完

平方展开可得每一份训练数据的精确结果：

| 拟合器 | 训练 MSE | 新信号风险 |
| --- | --- | --- |
| 常数 | ${\frac72+\frac T2-\frac{S^2}{16}}$ | ${\frac52+\frac{S^2}{16}}$ |
| 仿射 | ${1-\frac{S^2}{16}-\frac{T^2}{40}}$ | $\frac{S^2}{16}+\frac{T^2}{40}$ |
| 查表 | $0$ | $1$ |

例如仿射在 $x$ 的信号残差为 $S/4+xT/10$；平方后交叉项因 $\sum x=0$ 消失，$\sum x^2=10$ 给出 $T^2/40$。训练残差则是 $S/4+x_iT/10-e_i\,$，利用 $\sum e_i=S$、$\sum x_ie_i=T$ 展开得到训练一列。常数训练列来自：

$$
\frac14\sum y_i^2-\overline y^2
$$

独立对称符号满足：

$$
\mathbb E_D[S^2]=4,
\qquad \mathbb E_D[T^2]=10,
\qquad \mathbb E_D[T]=0
$$

原因是 $e_i^2=1$，不同符号的乘积期望为零。对上表再平均，并给信号风险加上独立新噪声的 1：

| 拟合器 | 平均训练 MSE | 平均新信号风险 | 平均新标签风险 |
| --- | ---: | ---: | ---: |
| 常数 | $13/4$ | $11/4$ | $15/4$ |
| 仿射 | $1/2$ | $1/2$ | $3/2$ |
| 查表 | $0$ | $1$ | $2$ |

每一列都先评估每份训练集拟合出的函数，再对 16 份训练集平均。它们不是把 16 份数据拼在一起训练的结果，也不是 16 次真实测量实验的统计估计。

这一设定下，查表从仿射的平均训练误差 $1/2$ 降到 0，却把平均新标签风险从 $3/2$ 提高到 2，说明额外自由度用于拟合噪声会付出代价。常数平均新标签风险更高，则主要受到无法表达信号的限制。两个机制可以存在于同一比较中，不能用一个“训练—测试差距”数值概括。

若想与偏差、方差术语对应，只需在本例中看跨训练集的平均预测：常数为 0，仿射和查表均为 $x$。按四点平均的信号偏差平方依次为 $5/2,0,0$；训练噪声引起的预测方差依次为 $1/4,1/2,1$。两项相加正好给出新信号风险。这里没有推导一般模型的容量曲线，更不能从这种分解自动推出 U 形。[1]

## 6. 改一个前提，最佳模型就可能换人

### 对照 A：两侧都没有噪声

训练标签与新标签都变成 $Y=X$。这时只有一份训练集、四种新结果；查表虽仍把训练误差降为零，却也完全恢复支持集上的信号。

| 拟合器 | 训练 MSE | 新标签风险 |
| --- | ---: | ---: |
| 常数 | $5/2$ | $5/2$ |
| 仿射 | $0$ | $0$ |
| 查表 | $0$ | $0$ |

所以**插值不等于过拟合**。这不是靠一句口号保留例外，而是在同一组算法下去掉噪声后直接重算。Belkin 等人的研究也展示了不能靠插值或参数量单独判断泛化的情形；它并不保证任何模型越大越好。[2]

### 对照 B：只让训练仪器无噪声

仍用干净的 $y_i=x_i$ 拟合，但新测量保持 $Y=X+E$。训练 MSE 与对照 A 相同，平均新标签风险却分别为 $7/2,1,1$。改进训练仪器不会自动取消生产环境中新标签自身的噪声。代码中训练和新标签噪声是两个不同开关。

### 对照 C：档位与信号根本无关

现在设 $Y=E$，其余平衡训练设计与独立噪声都不变。仍有 16 份训练集、八种新记录。常数族现在包含真实信号 0，不再承受前面的 $5/2$ 近似误差。

| 拟合器 | 平均训练 MSE | 平均新信号风险 | 平均新标签风险 |
| --- | ---: | ---: | ---: |
| 常数 | $3/4$ | $1/4$ | $5/4$ |
| 仿射 | $1/2$ | $1/2$ | $3/2$ |
| 查表 | $0$ | $1$ | $2$ |

最简单的常数现在胜出。不要把主例改写成“选中间大小总没错”，也不要把四点、四条训练记录的结果推广成任意样本量或高维神经网络的定律。

## 7. 可运行实验：拟合者看训练，评估者知道教学总体

下面只有 Python 标准库。`fit_family` 从传入标签拟合，不接受真实信号或新记录；`risk_report` 才负责按已声明的总体产生数据与评价。返回状态、报告与所有数值分别采用不可变元组和精确 `Fraction`，没有随机模拟误差。

- `fit_family` 的输入必须是内置列表或元组，恰好四行；每行也是内置列表或元组的 $(x,y)$，四个支持点各出现一次，次序任意。$x$ 为确切内置整数，$y$ 为 $[-16,16]$ 内的确切内置整数
- 家族名称只接受确切内置字符串 `constant`、`affine`、`lookup`。返回 `(family, parameters)`，参数分别按截距、截距与斜率、支持点升序的四个预测值排列
- `predict` 和 `mse` 接受这种内置二元组状态。参数必须为内置元组，长度对应模型族；每项的类型须恰为内置 `int` 或标准库 `fractions.Fraction`，不含子类；约分后分子绝对值、分母均不超过 1024。所有合法拟合结果均满足此界限
- `predict` 只接收支持集中的确切整数。`mse` 的评估记录长 1–32，类型与每行取值范围同上，但允许同一 $x$ 重复，不要求覆盖全部支持点；返回均方损失
- `risk_report` 的三个开关分别是信号、训练噪声、新标签噪声，只接受确切内置整数 0 或 1。关闭噪声的一侧只枚举无噪声结果一次。报告按三个模型族顺序，每行为名称、平均训练 MSE、平均新信号风险、平均新标签风险

布尔值、浮点、数值或容器子类、生成器、空输入、错误形状、重复或缺失的训练档位、超界标签或参数均按上述契约抛出 `ValueError`，不作隐式转换，不修改输入。只传预测输入、不传新标签即可获得预测；评估标签变化能改变分数，不能反过来改变已冻结的拟合状态。

这不是通用回归库。固定设计拟合至多四行，评分至多 32 行；一次报告至多拟合 $16\times3=48$ 个模型，每个模型评估四条训练、四条信号和八条新标签记录。有理数规模受输入界限约束；不把任意精度整数的位运算当成普适常数成本。

```python
# nextchina-example: overfitting-underfitting-capacity
from fractions import Fraction
from itertools import product

SUPPORT = (-2, -1, 1, 2)
FAMILIES = ("constant", "affine", "lookup")


def _family(value):
    if type(value) is not str or value not in FAMILIES:
        raise ValueError("family 必须是 constant/affine/lookup")
    return value


def _rows(rows):
    if type(rows) not in (list, tuple) or not 1 <= len(rows) <= 32:
        raise ValueError("rows 必须是 1..32 行的内置 list/tuple")
    copied = []
    for row in rows:
        if type(row) not in (list, tuple) or len(row) != 2:
            raise ValueError("每行必须是内置 list/tuple 的 (x,y)")
        x, y = row
        if type(x) is not int or x not in SUPPORT:
            raise ValueError("x 必须是支持集中的内置整数")
        if type(y) is not int or not -16 <= y <= 16:
            raise ValueError("y 必须是 [-16,16] 的内置整数")
        copied.append((x, y))
    return tuple(copied)


def _model(model):
    if type(model) is not tuple or len(model) != 2:
        raise ValueError("model 必须是 (family, parameters) 内置元组")
    family = _family(model[0])
    parameters = model[1]
    size = {"constant": 1, "affine": 2, "lookup": 4}[family]
    if type(parameters) is not tuple or len(parameters) != size:
        raise ValueError("parameters 必须是对应长度的内置元组")
    checked = []
    for value in parameters:
        if type(value) not in (int, Fraction):
            raise ValueError("参数只接受内置 int 或确切的 Fraction")
        if type(value) is int and abs(value) > 1024:
            raise ValueError("参数超界")
        value = Fraction(value)
        if abs(value.numerator) > 1024 or value.denominator > 1024:
            raise ValueError("约分后分子绝对值和分母须不超过 1024")
        checked.append(value)
    return family, tuple(checked)


def _predict(model, x):
    family, parameters = model
    if family == "constant":
        return parameters[0]
    if family == "affine":
        return parameters[0] + parameters[1] * x
    return parameters[SUPPORT.index(x)]


def fit_family(rows, family):
    rows, family = _rows(rows), _family(family)
    if len(rows) != 4 or tuple(sorted(x for x, _ in rows)) != SUPPORT:
        raise ValueError("训练须恰好覆盖四个支持点，各一次")
    b = Fraction(sum(y for _, y in rows), len(rows))
    if family == "constant":
        return family, (b,)
    if family == "affine":
        w = Fraction(sum(x * y for x, y in rows),
                     sum(x * x for x, _ in rows))
        return family, (b, w)
    ordered = tuple(Fraction(y) for x, y in sorted(rows))
    return family, ordered


def predict(model, x):
    model = _model(model)
    if type(x) is not int or x not in SUPPORT:
        raise ValueError("只预测支持集中的内置整数 x")
    return _predict(model, x)


def mse(model, rows):
    model, rows = _model(model), _rows(rows)
    return sum(((_predict(model, x) - y) ** 2 for x, y in rows),
               Fraction(0)) / len(rows)


def risk_report(signal=1, train_noise=1, fresh_noise=1):
    if any(type(v) is not int or v not in (0, 1)
           for v in (signal, train_noise, fresh_noise)):
        raise ValueError("signal/train_noise/fresh_noise 只接受内置整数 0/1")
    train_signs = tuple(product((-1, 1), repeat=4)) if train_noise else ((0,) * 4,)
    fresh_signs = (-1, 1) if fresh_noise else (0,)
    clean = tuple((x, signal * x) for x in SUPPORT)
    fresh = tuple((x, signal * x + e) for x in SUPPORT for e in fresh_signs)
    report = []
    for family in FAMILIES:
        totals = [Fraction(0), Fraction(0), Fraction(0)]
        for signs in train_signs:
            train = tuple((x, signal * x + e) for x, e in zip(SUPPORT, signs))
            model = fit_family(train, family)
            for index, evaluation in enumerate((train, clean, fresh)):
                totals[index] += mse(model, evaluation)
        report.append((family,) + tuple(v / len(train_signs) for v in totals))
    return tuple(report)


for title, switches in (
    ("signal=1, train_noise=1, fresh_noise=1", (1, 1, 1)),
    ("signal=1, train_noise=0, fresh_noise=0", (1, 0, 0)),
    ("signal=1, train_noise=0, fresh_noise=1", (1, 0, 1)),
    ("signal=0, train_noise=1, fresh_noise=1", (0, 1, 1)),
):
    print(title)
    for row in risk_report(*switches):
        print(row[0], *(str(value) for value in row[1:]))
```

每组输出的后三项依次是“平均训练、新信号、新标签”，不是三个数据划分的名字。四组结果依次对应第 5 节与三个对照，数值使用分数打印。程序枚举的是声明的有限教学总体；没有读取实际测试集，也没有用验证集挑选模型。

## 8. 从这个已知世界走回真实评估

现实里通常不知道完整的 $P(X,Y)$，也拿不到每条记录的干净信号。因此不能照着代码调用 `mse` 就宣称得到了真实总体风险。有限保留集上的平均误差是**估计**，会受抽样、群组相关、时间变化和目标覆盖影响。

遇到“训练好、保留差”，可以依次核对：

1. **是否在比较同一目标与尺度？** 平方损失和半平方损失、干净信号和带噪标签不是同一个数；错误的分母、掩码或预处理也能制造差距
2. **保留集是否回答部署问题？** 输入覆盖、标签定义或时间分布变了，性能下降可能有分布变化的原因；泄漏和选择反馈也会让保留分数失真
3. **训练最优是否真的达到？** 优化不足与表达不足需要分别检查。本页有配方证书；真实复杂模型可能只能提供有限预算下的诊断，不能冒称找到了全局最优
4. **有没有相同协议下的对照？** 比较合理的简单基线、检查残差和标签质量，再用独立保留评估判断增加自由度、数据或正则化是否有帮助；没有任何一项能保证改善

若用验证分数选择模型族，这个分数已经承担选择职责，不能原样当作独立最终测试。选完再评估的边界详见[训练、验证、测试与泄漏](?view=garden&scope=concept:train-validation-test)；抽样波动和区间见[统计推断](?view=garden&scope=branch:llm:rankings/methodology)。CS229 的模型选择笔记也将参数拟合与保留集选择分开；它举过的切分比例不是普遍配方。[3]

本页换了**可选函数族**，并没有加惩罚。下一步可读[正则化改变了什么](?view=garden&scope=branch:llm:training/budget/regularization)，看在指定族中加入偏好怎样改变拟合；若关心每一步如何更新，回到[训练循环](?view=garden&scope=branch:llm:training/loop)。这些联系不把一次有限实验提升为对所有学习任务的保证。

## 9. 自测：先改前提，再算结论

### 题目

1. **同向偏移的校准批次。** 第二次训练恰好四个噪声全为 $+1$。求三个模型、训练 MSE、新信号风险和新标签风险。仿射和查表是否一定预测不同？这一批能否决定跨训练平均排序？
2. **固件停在初始值。** 对第 4 节训练集，工程师把仿射参数留在 $b=w=0$。计算相对精确拟合的训练误差差值，并说明它与仿射族的最佳信号近似误差有什么区别。什么证据才足以认定该族在这里表达不足？
3. **只修好训练仪器。** 训练标签改为干净信号，生产仍有独立 $\pm1$ 噪声。三个新标签风险是多少？若生产也去噪，又是多少？为什么不能共用一张表？
4. **断开的档位。** 信号改为零，标签仅为噪声。求三个平均新标签风险并解释赢家变化。是否能据此建立“总选中间模型”的规则？
5. **重复输入与新记录。** 同事说新记录 $X=1$ 必然泄漏，并把 $X=0$ 当作本实验普通测试输入。分别判断，并说明程序应如何处理 $X=0$。
6. **挑完再报。** 实验室在一份有限保留集上试了很多模型族，把最低分当作独立最终分数。哪里混淆了信息职责？本页知道总体的精确风险，为什么不能替它辩护？

### 参考答案与常见误解

**1.** 标签为 $(-1,0,2,3)$，$S=4,T=0$。常数为 1；仿射为 $1+x$；查表也在四个支持点输出 $1+x$。

| 模型 | 训练 MSE | 新信号风险 | 新标签风险 |
| --- | ---: | ---: | ---: |
| 常数 | $5/2$ | $7/2$ | $9/2$ |
| 仿射 | $0$ | $1$ | $2$ |
| 查表 | $0$ | $1$ | $2$ |

两个不同模型族可以选出相同的支持集预测。不能拿一次相等推翻 16 份平均比较，也不能说查表在每一份训练数据上都严格更差。

**2.** 初始值预测恒为零，训练 MSE 是 $7/2$；精确仿射拟合是 $b=0,w=1$，训练 MSE 为 1，差值 $5/2$ 正好等于配方证书中的斜率项。初始值的信号风险为 $5/2$，但仿射族可以达到信号风险 0。这里已知真实信号就在该族内，无法据此宣布表达不足；错误属于选错参数或未完成拟合。训练最小 MSE 仍为 1，是这一批噪声并不沿同一条直线，而不是恢复信号必须有误差。

**3.** 只有训练去噪时，新标签风险依次为 $7/2,1,1$；两侧都去噪时为 $5/2,0,0$。两组的拟合函数相同，评分目标不同。误解在于把训练数据更干净当成生产标签的噪声也消失。

**4.** 平均新标签风险为 $5/4,3/2,2$。常数已经能表达零信号，额外拟合的斜率或档位值在这个设计中只增加训练噪声波动。赢家依赖生成规律、训练设计与算法；三个名称的排列不是选择准则。

**5.** 对本页“同一档位的新独立测量”任务，重复 $x$ 不等于重复标签信息，不自动构成泄漏；若任务改成未见实体，需重定协议。$X=0$ 则不在已声明支持集，`predict` 与 `mse` 应抛出 `ValueError`，而不是暗中给查表器补零或临时插值。

**6.** 这份保留集承担了模型选择，应将最终评估保留给未参与选择的信息，或采用正确隔离内外层职责的评估流程，并披露选择过程。本页总体完整已知，直接枚举八种新结果；真实保留集只是有限样本。两者都能算平均，并不意味着它们的证据强度相同。

## 来源与核查边界

本页的四点总体、16 份训练数据、精确风险表、控制实验和练习均为独立教学推导；下列来源支持概念与边界，不是这些分数的实验出处。

1. [Tengyu Ma 与 Andrew Ng，CS229 Lecture Notes](https://cs229.stanford.edu/main_notes.pdf)：2026-10-05 核查时封面为 **August 23, 2026**，正文运行页眉为 Spring 2026；第 8 章，特别是印刷页 115–123。区分训练与新例表现、跨训练预测的偏差和方差。本文用固定平衡输入、离散噪声直接求和，不把源文的随机设计或高斯噪声设定当作自己的前提。此 live URL 可能变更
2. [Belkin、Hsu、Ma 与 Mandal，PNAS 116(32), 15849–15854（2019）作者托管版](https://www.cs.columbia.edu/~djhsu/papers/biasvariance-pnas.pdf)：摘要、引言和图 1 讨论；[DOI](https://doi.org/10.1073/pnas.1903070116)。用于限定“插值必坏、参数越多必坏”这类推断；本页不复现其模型或实验，也不声称风险必呈双下降
3. [Andrew Ng，CS229 Regularization and Model Selection 存档笔记](https://cs229.stanford.edu/notes_archive/cs229-notes5.pdf)：§1，印刷页 2–4；打开的存档未显示独立出版日期。用于区分参数拟合和保留集模型选择，不采用其中举例的切分比例作为建议

来源阅读、作者算术检查、独立复核、浏览器呈现与领域专家审核是不同环节。本页内容状态仍为待独立复核，不能把可运行示例当作外部模型的性能背书。
