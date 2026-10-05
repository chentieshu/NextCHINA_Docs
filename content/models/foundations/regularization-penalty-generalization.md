> **本页解决的问题**：为什么给权重加一个惩罚，会让训练拟合变差，却有时让新样本误差更小？它又会在什么时候帮倒忙？
>
> 前置阅读：[训练循环](?view=garden&scope=branch:llm:training/loop) 区分损失、梯度和更新；[导数](?view=garden&scope=branch:llm:math/derivatives) 帮你读懂求最小值；[期望与方差](?view=garden&scope=branch:llm:math/probability) 帮你把四种噪声结果平均。本页的训练记录、保留记录和噪声分布都是完整指定的教学构造，不是真实数据集或模型性能报告。

## 1. 要分开的不只是训练集和测试集

**正则化**是在根据数据拟合的同时，对所选模型或学习过程加入额外偏好。本页只深入一种明确的做法：在训练目标中加入 L2 二次惩罚，偏好这个坐标系中较小的系数。它改变了“拟合时愿意交换什么”，并没有给每个新样本的误差加上保护罩。

先分清五个对象：

| 对象 | 记号 | 回答的问题 |
| --- | --- | --- |
| 训练数据损失 | $F_{\mathrm{train}}(w)$ | 用参数 $w$ 预测训练标签，错了多少？ |
| 未加权惩罚函数 | $\Omega(w)$ | 这个参数违反所选偏好的程度？ |
| 拟合时优化的目标 | $J_\lambda(w)=F_{\mathrm{train}}(w)+\lambda\Omega(w)$ | 数据拟合和惩罚加权后，合计是多少？ |
| 拟合得到的参数 | $\widehat w_\lambda$ | 哪个 $w$ 让这份训练目标最小？ |
| 保留数据上的预测损失 | $L_V(\widehat w_\lambda)$ | 对没有用来拟合参数的标签，预测得怎样？ |

这里 $\lambda\ge0$ 是超参数。先固定它，再用训练数据求 $\widehat w_\lambda$；用验证数据选择候选 $\lambda$ 是另一个阶段，不是把验证标签混进训练目标求导。[D2L §3.7.1](https://d2l.ai/chapter_linear-regression/weight-decay.html) 给出了这种加法目标与超参数约定。

保留集平均损失是有限数据上的分数；**总体风险** $R(w)$ 则是在指定的新样本分布上取期望。现实中这个分布通常未知，不能把一次保留分数当成精确的总体风险。本页后面特意给出完整生成规律，才能算出真正的期望。

## 2. 从一个斜率推导 L2 最优解

设输入 $x$ 和标签 $y$ 都是数值，预测器只做乘法：$f_w(x)=wx$。它只有一个可拟合斜率 $w$，**没有截距**，所以输入为零时预测始终为零。可把它想成一条假想仪器的比例校准规则；这并不声称实际仪器的零点、噪声或响应一定如此。

给定 $n\ge1$ 条训练记录，定义：

$$
\begin{aligned}
F_{\mathrm{train}}(w)&=\frac{1}{2n}\sum_{i=1}^n(wx_i-y_i)^2\\
\Omega(w)&=\frac12w^2\\
J_\lambda(w)&=F_{\mathrm{train}}(w)+\frac{\lambda}{2}w^2
\end{aligned}
$$

数据损失是**平方误差的平均值再除以 2**，不是均方根误差。$1/2$ 让求导时的 2 消掉。向量版的平方 L2 范数是 $\sum_j w_j^2$，可回看[范数与坐标尺度](?view=garden&scope=branch:llm:math/tensor-shapes)。这里所有参数就是这个 $w$；带截距或多参数模型还要另说哪些参数受罚。

把与 $w$ 无关的数据压缩成三个量：

$$
\begin{aligned}
A&=\frac1n\sum_i x_i^2\\
B&=\frac1n\sum_i x_i y_i\\
C&=\frac1n\sum_i y_i^2
\end{aligned}
$$

展开平方，得到一个可直接检查的二次函数：

$$
\begin{aligned}
J_\lambda(w)&=\frac{A+\lambda}{2}w^2-Bw+\frac C2\\
J'_\lambda(w)&=(A+\lambda)w-B
\end{aligned}
$$

如果 $A+\lambda>0$，令导数为零便得到候选解 $\widehat w_\lambda=B/(A+\lambda)$。仅有“导数为零”一般不能证明最小；这里可以完整配方：

$$
J_\lambda(w)=\frac{A+\lambda}{2}
\left(w-\frac B{A+\lambda}\right)^2
+\frac C2-\frac{B^2}{2(A+\lambda)}
$$

所以有精确恒等式：

$$
\boxed{J_\lambda(w)-J_\lambda(\widehat w_\lambda)
=\frac{A+\lambda}{2}(w-\widehat w_\lambda)^2}
$$

右边非负，且仅当 $w=\widehat w_\lambda$ 时为零，故最优解唯一。这个证明保证的是**本训练目标的最小值**，没有使用新样本分布，也就没有证明泛化好。

当 $A>0$ 时，$\widehat w_0=B/A$，因此 $\widehat w_\lambda=\frac A{A+\lambda}\widehat w_0$。这就是本模型的收缩：系数向零靠近，而不是删除某些训练记录。如果所有 $x_i=0$，则 $A=B=0$；$\lambda=0$ 时任何 $w$ 都有相同损失，没有唯一斜率，$\lambda>0$ 时惩罚选出 $w=0$。惩罚能选出参数，不等于零输入提供了辨认斜率的信息。

## 3. 训练损失上升，究竟换来了什么？

固定训练记录 $(-1,-4),(1,4)$，另留两条信号记录 $(-1,-2),(1,2)$。假想的信号斜率是 2，训练标签在这个构造中被推得更远。训练集有 $A=1,B=4,C=16$，所以 $\widehat w_\lambda=4/(1+\lambda)$。

| $\lambda$ | 拟合斜率 | 训练数据损失 | 加权惩罚 $\lambda w^2/2$ | 训练目标 $J_\lambda$ | 保留信号损失 |
| --- | ---: | ---: | ---: | ---: | ---: |
| $0$ | $4$ | $0$ | $0$ | $0$ | $2$ |
| $1$ | $2$ | $2$ | $2$ | $4$ | $0$ |
| $3$ | $1$ | $9/2$ | $3/2$ | $6$ | $1/2$ |

例如 $\lambda=1,w=2$，两个训练残差为 $2,-2$，数据损失是 $(4+4)/4=2$；加权惩罚为 $1\times2^2/2=2$。对保留信号的预测则恰好正确。不要把“目标 4”误报成“预测误差 4”。

表中 $J_0,J_1,J_3$ 是**不同函数**的最小值；跨行比较它们不能挑出总体预测最好的超参数。若训练数据本来就是干净的 $(-1,-2),(1,2)$，无惩罚得到 $w=2$、信号损失 0；$\lambda=1$ 却得到 $w=1$、信号损失 $1/2$。因此正则化并不保证改善；即便在这个最简单模型里，过强或不合适的收缩也会损害信号。

上一张表只是一个完整算例。要回答“在多次可能的训练数据上，平均怎样”，必须再说明这些训练数据如何产生。

## 4. 把四种噪声情况算全，而不是挑中一次幸运结果

现在固定训练输入 $x_1=-1,x_2=1$，真实信号为 $2x$。两个训练标签分别是 $y_i=2x_i+e_i$，其中 $e_1,e_2$ **相互独立**，各以一半概率为 $-2$ 或 $+2$。

| $(e_1,e_2)$ | 两个训练标签 $(y_1,y_2)$ | 概率 | 无惩罚斜率 $\widehat w_0$ |
| --- | --- | ---: | ---: |
| $(-2,-2)$ | $(-4,0)$ | $1/4$ | $2$ |
| $(-2,+2)$ | $(-4,4)$ | $1/4$ | $4$ |
| $(+2,-2)$ | $(0,0)$ | $1/4$ | $0$ |
| $(+2,+2)$ | $(0,4)$ | $1/4$ | $2$ |

令 $d=1+\lambda$，加惩罚后的四个斜率便是 $2/d,4/d,0,2/d$。平均与方差可以直接由四项求和：

$$
\mathbb E_{\mathrm{train}}[\widehat w_\lambda]=\frac2d,
\qquad
\operatorname{Var}_{\mathrm{train}}(\widehat w_\lambda)=\frac2{d^2}
$$

收缩减小了不同训练噪声带来的波动，但均值也由真值 2 向零偏移，偏差为 $-2\lambda/d$。二者必须一起看。

### 先评估信号恢复，再评估新的带噪标签

另取独立的新输入 $X$，等概率为 $-1,+1$。对一个已经固定的斜率 $w$，相对于干净信号 $2X$ 的风险为：

$$
R_{\mathrm{signal}}(w)=\mathbb E_X\!\left[\frac12(wX-2X)^2\right]
=\frac12(w-2)^2
$$

再对四份可能的训练数据平均，记为 $\mathcal R_{\mathrm{signal}}(\lambda)$。直接代入四个斜率，不依赖一句抽象的“偏差—方差权衡”：

$$
\begin{aligned}
\mathcal R_{\mathrm{signal}}(\lambda)
&=\frac18\Bigl[2\left(\frac2d-2\right)^2\\
&\qquad+\left(\frac4d-2\right)^2+(0-2)^2\Bigr]\\
&=\frac{4\lambda^2+2}{2(1+\lambda)^2}
\end{aligned}
$$

也可展开 $\mathbb E[(\widehat w-2)^2]$，得到同一个结果：一半的“偏差平方加方差”。这里 $4\lambda^2/d^2$ 是偏差平方，$2/d^2$ 是方差；这个等式没有说二者中的任一个应该单独最小。

如果目标是新的**带噪标签** $Y=2X+E$，还需规定测试噪声 $E$ 与训练噪声、$X$ 独立，也等概率为 $-2,+2$。对固定残差 $r=(w-2)X$，两个测试噪声结果的平均半平方损失是：

$$
\frac{(r-2)^2+(r+2)^2}{4}=\frac12r^2+2
$$

因此 $R_{\mathrm{label}}(w)=R_{\mathrm{signal}}(w)+2$，再平均训练集也仍加 2：

| $\lambda$ | 期望信号损失 $\mathcal R_{\mathrm{signal}}$ | 期望带噪标签损失 $\mathcal R_{\mathrm{label}}$ |
| --- | ---: | ---: |
| $0$ | $1$ | $3$ |
| $1/2$ | $2/3$ | $8/3$ |
| $1$ | $3/4$ | $11/4$ |
| $3$ | $19/16$ | $51/16$ |

$\lambda=1/2$ 比不加惩罚更好，$\lambda=3$ 却更差。这里新增的 2 来自明确规定的独立、均值为零的测试噪声；换成相关噪声或别的评分目标，不能照搬。

这四种训练噪声和风险公式是本页直接构造并推导的。[Krogh 与 Hertz（1991）§4](https://proceedings.neurips.cc/paper/1991/file/8eefcfdf5990e441f0fb6f3fad709e21-Paper.pdf) 在其线性设定中分析了适当衰减抑制标签噪声的机制；其 §5 对非线性情形使用的局部近似有条件。它们都不是“任何模型加 L2 必定泛化更好”的依据。

## 5. “小权重”要连同坐标与损失刻度一起说

若把一个特征的单位改掉，令 $x'=ax$、$a\ne0$，相同预测需要 $w'=w/a$，因为 $w'x'=wx$。但数值上的 $w'^2=w^2/a^2$ 已变。想让新坐标中的目标和旧目标相同，需要：

$$
\frac{\lambda'}2w'^2=\frac\lambda2w^2
\quad\Longrightarrow\quad \lambda'=a^2\lambda
$$

对第 3 节训练集，把输入乘 2。原来 $\lambda=1$ 得到 $w=2$，预测为 $\pm2$；新坐标有 $A'=4,B'=8$。若仍取 $\lambda'=1$，斜率是 $8/5$，预测为 $\pm16/5$；取 $\lambda'=4$，斜率才是 1，预测恢复 $\pm2$。

所以小参数范数是**指定坐标后的偏好**，不是与单位、特征表示无关的“简单程度”。多特征分别缩放时，还可能改变各方向的相对惩罚，不能只看同一个超参数数值。若用数据学习标准化状态，也应只在获准的训练数据上拟合，见[训练、验证、测试与泄漏](?view=garden&scope=concept:train-validation-test)。

另一种刻度来自平均与求和。本文用平均损失；把每条记录完整复制一次，$A,B,C$ 均不变，拟合斜率也不变。若某实现定义：

$$
J_{\mathrm{sum}}(w)=\frac12\sum_i(wx_i-y_i)^2
+\frac{\lambda_{\mathrm{sum}}}{2}w^2
$$

那么需要 $\lambda_{\mathrm{sum}}=n\lambda$，才有 $J_{\mathrm{sum}}=nJ_\lambda$、最优点相同。只把数据项改成总和而保持惩罚系数不变，会改变相对权重。

真实接口也有自己的约定。[scikit-learn Ridge 1.9 文档](https://scikit-learn.org/1.9/modules/generated/sklearn.linear_model.Ridge.html) 写的是平方残差总和加 `alpha` 乘权重平方范数。对本页**无样本权重、无截距**的设定，应对应 `fit_intercept=False` 与 $\texttt{alpha}=n\lambda$，这是把 $J_\lambda$ 乘以 $2n$ 得出的。这里仅核对目标函数；没有安装或运行 scikit-learn，也不把手写分数程序冒充库的数值求解器。

## 6. L2 惩罚与权重衰减，什么时候才是一回事？

惩罚的值是 $\lambda w^2/2$，它对参数的导数是 $\lambda w$，两者不能互换。记数据梯度为 $g=F'_{\mathrm{train}}(w)$。对**无动量、无预条件缩放、无裁剪的普通梯度下降**，同一更新可以写成：

$$
\begin{aligned}
w_{\mathrm{new}}&=w-\eta(g+\lambda w)\\
&=(1-\eta\lambda)w-\eta g
\end{aligned}
$$

第一行把 L2 项加进梯度，第二行先写出权重衰减再减数据梯度。在这个约定和条件下，它们代数等价。若另一个接口用每步衰减量 $\delta$ 写成 $(1-\delta)w-\eta g$，对应的是 $\delta=\eta\lambda$，不能直接把两个字段抄成同一个数。D2L 的 [§3.7.1 更新式及边界提醒](https://d2l.ai/chapter_linear-regression/weight-decay.html) 同样把这种等价与所用优化器联系起来。

即使在这里，$1-\eta\lambda$ 要落在 $[0,1]$ 才是非翻号的收缩因子；完整更新还有 $-\eta g$，总权重大小仍可能增加。“加了 decay，所以每步范数一定下降”并不成立。

若把含惩罚的梯度送进 Adam 的历史矩与自适应缩放，惩罚会影响那些状态。AdamW 则把衰减从这条路径分开；相同数字的系数不再自动对应同一更新。下一篇[AdamW、矩估计与解耦衰减](?view=garden&scope=branch:llm:training/adamw) 专门算这个区别。目标函数、求它最小值的方法和新样本风险，是三个需要分别核对的问题。

## 7. 可运行实验：精确分数，而不是一次随机模拟

以下仅用 Python 3 标准库，三个公开函数都按第 2 节的无截距、半均方损失定义：

- `ridge_fit(rows, l2)` 返回精确 `Fraction` 斜率
- `ridge_terms(rows, w, l2)` 返回不可变元组 `(data_loss, penalty, objective)`，三项都是 `Fraction`；其中 `penalty` 是已经乘了 `l2` 的贡献
- `prediction_loss(rows, w)` 返回无惩罚的精确预测损失；函数不知道数据属于训练、验证还是测试，信息职责由调用者保证

`rows` 限内置列表或元组，长度 1–32，每行也必须是内置列表或元组且恰有两个内置整数 $x,y\in[-16,16]$。`l2` 限内置整数或确切的 `Fraction` 类型，非负，约分后的分子、分母均不超过 64。待评估 `w` 的类型相同，约分后分子绝对值、分母均不超过 $2^{20}$。每个合法拟合结果都能落入这个评估范围。

布尔值、浮点数、数值或容器子类、生成器、隐式转换、空数据、错形状与超界值均拒绝，抛出 `ValueError`；输入不被修改。全零特征且 `l2=0` 只让拟合因不唯一而报错，给定斜率的损失仍可计算。这是有意限缩的精确算术实验，不能直接装载任意小数数据。

每次调用做 $O(n)$ 次有界有理数运算；校验后的行副本占 $O(n)$ 存储，此外只有 $O(1)$ 聚合状态。这里按这个有限输入契约计数，不把无界大整数的位运算成本假定为常数。

```python
# nextchina-example: regularization-penalty-generalization
from fractions import Fraction
from itertools import product


def _checked_rows(rows):
    if type(rows) not in (list, tuple) or not 1 <= len(rows) <= 32:
        raise ValueError("需要 1..32 行的内置 list/tuple")
    checked = []
    for row in rows:
        if type(row) not in (list, tuple) or len(row) != 2:
            raise ValueError("每行必须是内置 list/tuple 的 (x, y)")
        if any(type(v) is not int or not -16 <= v <= 16 for v in row):
            raise ValueError("x/y 必须是 [-16,16] 的内置整数")
        checked.append((row[0], row[1]))
    return tuple(checked)


def _checked_rational(value, bound, nonnegative=False):
    if type(value) not in (int, Fraction):
        raise ValueError("只接受内置 int 或确切的 Fraction")
    if type(value) is int and abs(value) > bound:
        raise ValueError("整数超出范围")
    value = Fraction(value)
    if (abs(value.numerator) > bound or value.denominator > bound
            or (nonnegative and value < 0)):
        raise ValueError("分子、分母或符号不符合约定")
    return value


def _data_loss(rows, w):
    return sum(((w * x - y) ** 2 for x, y in rows), Fraction(0)) / (
        2 * len(rows))


def ridge_fit(rows, l2):
    rows = _checked_rows(rows)
    l2 = _checked_rational(l2, 64, nonnegative=True)
    sum_xx = sum(x * x for x, _ in rows)
    sum_xy = sum(x * y for x, y in rows)
    curvature_sum = sum_xx + len(rows) * l2
    if curvature_sum == 0:
        raise ValueError("所有 x 为零且 l2=0：不存在唯一斜率")
    return Fraction(sum_xy) / curvature_sum


def ridge_terms(rows, w, l2):
    rows = _checked_rows(rows)
    w = _checked_rational(w, 2 ** 20)
    l2 = _checked_rational(l2, 64, nonnegative=True)
    data_loss = _data_loss(rows, w)
    penalty = l2 * w * w / 2
    return (data_loss, penalty, data_loss + penalty)


def prediction_loss(rows, w):
    rows = _checked_rows(rows)
    w = _checked_rational(w, 2 ** 20)
    return _data_loss(rows, w)


train = ((-1, -4), (1, 4))
signal = ((-1, -2), (1, 2))
print("lambda | slope | train loss | penalty | objective | signal loss")
for l2 in (0, 1, 3):
    w = ridge_fit(train, l2)
    values = (l2, w) + ridge_terms(train, w, l2) + (
        prediction_loss(signal, w),)
    print(" | ".join(map(str, values)))

# 枚举四份训练集；没有采样，也没有随机种子。
noise_sets = tuple(
    ((-1, -2 + e1), (1, 2 + e2))
    for e1, e2 in product((-2, 2), repeat=2)
)
for l2 in (0, Fraction(1, 2), 1, 3):
    slopes = tuple(ridge_fit(rows, l2) for rows in noise_sets)
    risk = sum((prediction_loss(signal, w) for w in slopes),
               Fraction(0)) / 4
    print(f"lambda={l2}: expected signal loss={risk}; noisy loss={risk + 2}")

scaled_train = tuple((2 * x, y) for x, y in train)
assert ridge_fit(scaled_train, 1) == Fraction(8, 5)
assert ridge_fit(scaled_train, 4) == 1
assert ridge_fit(train + train, 1) == ridge_fit(train, 1)
assert prediction_loss(signal, ridge_fit(signal, 1)) == Fraction(1, 2)
print("scale, mean-loss duplication and clean-data harm checks passed")
```

第一段输出复现第 3 节三行数值；接着四行期望信号损失依次为 `1`、`2/3`、`3/4`、`19/16`，带噪损失各加 2。最后确认缩放、均值损失的复制不变性，以及干净训练数据上的伤害反例。`Fraction` 让本例的这些等式可以精确检查；没有 Monte Carlo 采样误差，也没有二进制小数舍入。真实浮点训练还需另外核对[表示与舍入](?view=garden&scope=concept:floating-point)。

## 8. 怎样选超参数，以及本页没有替你完成的事

第 4 节的完整生成规律是出题时已知的数学构造。实际训练通常不知道真斜率或噪声分布；不能把这个例子的最佳 $\lambda$ 当成默认推荐。用开发数据比较候选方案、冻结选择，再使用保留测试报告表现，流程见[训练、验证、测试与数据泄漏](?view=garden&scope=concept:train-validation-test)。反复看测试分数改 $\lambda$，即使没有拿测试标签计算梯度，也让测试承担了调参职责。

L2 也不是正则化的全部。换成 L1 会改变惩罚的形状；限制参数可行集合是另一个问题表述，不能没有条件就声称与某个固定 $\lambda$ 等价；早停改变训练何时结束，数据增强改变提供给学习过程的输入。它们并非本页公式的同义词，这里不据一个斜率算例推导这些方法的效果。

这种问题也不限于语言模型：前面是普通数值预测；Ridge 是实际回归接口；[Krogh 与 Hertz §6](https://proceedings.neurips.cc/paper/1991/file/8eefcfdf5990e441f0fb6f3fad709e21-Paper.pdf) 则报告过 NetTalk 文本到发音任务的实验。历史实验有自己的网络、数据和测量条件，不能直接变成今天某个 LLM 的收益数字。本页尚未完整讲授过拟合与欠拟合、线性与逻辑回归或约束优化；这些更广的问题仍需要各自的论证。

## 9. 常见误解与练习

- **“训练 loss 变差，所以优化没成功。”** 先看日志指数据项还是整个目标；第 3 节的 $\lambda=1$ 解确实把其 $J_1$ 最小化了
- **“惩罚小就说明拟合好。”** $w=0$ 的惩罚恒为零，但预测损失要看标签，不能省掉数据项
- **“没有测到标签噪声，就把信号风险当测试风险。”** 二者评分对象不同；第 4 节的差 2 依赖明确噪声设定
- **“同一个 λ 可以跨预处理、loss reduction 和优化器照搬。”** 先写出完整公式，再对照第 5–6 节的条件

**练习 1：不用求导再证明一次。** 对第 3 节训练集，固定 $\lambda=1$、试探 $w=3$，分别直接算目标差与配方右边。

答案：$J_1(3)=1/2+9/2=5$，$J_1(2)=4$，差为 1；右边 $(1+1)(3-2)^2/2=1$。比较必须使用同一个 $J_1$。

**练习 2：平均最优不代表每份数据都更好。** 第 4 节哪几种训练噪声在 $\lambda=0$ 时已给出真斜率？加 $\lambda=1$ 后呢？

答案：$(-2,-2)$ 与 $(+2,+2)$ 均给出 $w=2$，信号损失为 0；加惩罚后均为 $w=1$，信号损失变 $1/2$。总体平均改善与逐份训练集改善是不同陈述。

**练习 3：本例最佳值为什么不能直接部署？** 对第 4 节风险求导，找 $\lambda\ge0$ 的最小值，并指出现实缺少什么。

答案：导数为 $(4\lambda-2)/(1+\lambda)^3$，在 $1/2$ 左侧负、右侧正，故该构造的最小点为 $1/2$。计算借用了真斜率 2 和完整噪声分布；现实没有这份出题答案，需要另作有效的开发与评估。

**练习 4：复制记录会改变惩罚吗？** 两条记录、平均损失下 $\lambda=1$，对应 sklearn 式 `alpha` 是多少？全部复制一次又是多少？

答案：先是 $n\lambda=2$，复制后是 4。平均目标和拟合预测不变；若采用总和接口却把 `alpha` 固定为 2，相对惩罚就变弱了。

## 来源与阅读路径

- [Krogh 与 Hertz，A Simple Weight Decay Can Improve Generalization](https://proceedings.neurips.cc/paper/1991/file/8eefcfdf5990e441f0fb6f3fad709e21-Paper.pdf)，1991 年论文，印刷页 950–957；重点为 §1 的惩罚、§4 的噪声分析与 §5 的局部适用边界
- [Dive into Deep Learning，§3.7 Weight Decay](https://d2l.ai/chapter_linear-regression/weight-decay.html)，页面版本 1.0.3；用于核对目标、系数、更新与受惩罚参数的选择
- [scikit-learn Ridge，版本路径 1.9](https://scikit-learn.org/1.9/modules/generated/sklearn.linear_model.Ridge.html)，访问时页眉为 1.9.1；用于核对真实接口的总和目标与 `fit_intercept`，不是执行结果

来源核对日期：2026-10-05。下一步读 [AdamW](?view=garden&scope=branch:llm:training/adamw)，或返回[预算、规模、泛化、精度与恢复](?view=garden&scope=branch:llm:training/budget) 继续查看更广的训练问题。
