> **本页解决的问题**：给定两个变量的完整联合分布，知道其中一个，平均能少掉多少关于另一个的不确定性？为什么边缘分布相同，依赖程度仍可能不同？
>
> 前置阅读：[概率、联合分布与条件概率](?view=garden&scope=branch:llm:math/probability)，以及[熵与 KL 散度](?view=garden&scope=branch:llm:math/objectives)。本页只讨论有限离散变量；下列概率表都是完整指定的人造分布，不是采样得到的频数，也没有训练模型。

## 1. 先把共同出现的概率写全

设一次试验同时产生两个二元变量 $X,Y$，行表示 $X$，列表示 $Y$。先看这张“带噪声的复制”表：

| $X$ 与 $Y$ | $Y=0$ | $Y=1$ | 行和 $p_X$ |
| --- | ---: | ---: | ---: |
| $X=0$ | $3/8$ | $1/8$ | $1/2$ |
| $X=1$ | $1/8$ | $3/8$ | $1/2$ |
| 列和 $p_Y$ | $1/2$ | $1/2$ | $1$ |

例如 $P(X=0,Y=1)=1/8$。沿行求和得到 $p_X(0)=3/8+1/8=1/2$；沿列求和得到 $p_Y(0)=3/8+1/8=1/2$。但 $p_X,p_Y$ 不能还原这张联合表：

| 完整联合分布，按行写出 | $p_X$ 与 $p_Y$ | 看见 $Y$ 后，对 $X$ 知道什么？ |
| --- | --- | --- |
| $(1/4,1/4);\ (1/4,1/4)$ | 均为 $(1/2,1/2)$ | 仍各有一半可能 |
| $(3/8,1/8);\ (1/8,3/8)$ | 均为 $(1/2,1/2)$ | 与 $Y$ 相同的概率是 $3/4$ |
| $(1/2,0);\ (0,1/2)$ | 均为 $(1/2,1/2)$ | $X=Y$，可以确定 $X$ |

三个分布中，单看 $X$ 或单看 $Y$ 都像一枚公平硬币；区别藏在它们怎样共同出现。互信息要量化的正是这种依赖。

## 2. 互信息是平均减少的不确定性

本页统一用以 2 为底的对数，单位为 **bit**。有限变量的熵为 $H(X)=-\sum_{x:p_X(x)>0}p_X(x)\log_2p_X(x)$。一枚公平硬币的熵是 1 bit，已经确定的变量为 0。

观察到一个有正概率的结果 $Y=y$ 后，要用该条件下重新归一化的概率 $p(x\mid y)=p(x,y)/p_Y(y)$ 计算 $H(X\mid Y=y)$。**条件熵 $H(X\mid Y)$ 还要再按不同 $y$ 出现的概率取平均**：

$$
H(X\mid Y)=\sum_{y:p_Y(y)>0}p_Y(y)H(X\mid Y=y)
$$

互信息就是观察前的熵减去这个平均剩余量：

$$
\begin{aligned}
I(X;Y)&=H(X)-H(X\mid Y)\\
      &=H(Y)-H(Y\mid X)\\
      &=H(X)+H(Y)-H(X,Y)
\end{aligned}
$$

这里 $H(X,Y)$ 是把每一对 $(x,y)$ 当作一个可能结果计算的联合熵。这些等式连接了联合、边缘与条件分布，适用于本页的有限离散范围。[Gray，§2.5](https://ee.stanford.edu/~gray/it.pdf)

记二元熵为 $h_2(q)=-q\log_2q-(1-q)\log_2(1-q)$，端点的零项按 0 处理。上节三张表的 $H(X)$ 都是 1 bit：

- 独立表：$H(X\mid Y)=1$，所以 $I(X;Y)=0$
- 带噪复制表：每一列归一化后都是 $(3/4,1/4)$ 或其交换，故 $H(X\mid Y)=h_2(1/4)\approx0.811278$，互信息约为 **0.188722 bit**
- 完全复制表：每列只有一个可能的 $X$，所以条件熵为 0，互信息为 **1 bit**

互信息不是一个必须落在 0 到 1 之间的比例。这里的上界是 1，因为目标恰为公平二元变量；有限离散情形一般有 $0\le I(X;Y)\le\min\{H(X),H(Y)\}$。[MIT 6.441，定理 2.3–2.4](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/184197ca5d5418da2415d37e929860b9_MIT6_441S16_chapter_2.pdf) 数值单位也不等于某个具体文件的压缩字节数。

前一篇熵课程使用自然对数、单位为 nat。转换时 $I_{\mathrm{nat}}=I_{\mathrm{bit}}\ln2$；反向则除以 $\ln2$。换底只改变刻度，不改变是否独立。单位约定见 [Gray，§2.2](https://ee.stanford.edu/~gray/it.pdf)。

### “平均”不能省：某次观察反而会增加熵

另设完整分布如下，与前面三张表无关：

| $X$ 与 $Y$ | $Y=0$ | $Y=1$ | 行和 |
| --- | ---: | ---: | ---: |
| $X=0$ | $8/10$ | $1/10$ | $9/10$ |
| $X=1$ | $0$ | $1/10$ | $1/10$ |
| 列和 | $4/5$ | $1/5$ | $1$ |

未观察时 $H(X)=h_2(1/10)\approx0.468996$ bit。若看见 $Y=0$，就能确定 $X=0$；若看见较少出现的 $Y=1$，$X$ 却变成等概率的 0 或 1，熵升到 **1 bit**。

按结果出现的概率平均，才得到：

$$
\begin{aligned}
H(X\mid Y)&=\frac45\times0+\frac15\times1=\frac15\\
I(X;Y)&=h_2(1/10)-\frac15\approx0.268996\ \text{bit}
\end{aligned}
$$

因此，“知道 $Y$ 平均减少不确定性”成立，“每观察到一个 $y$ 都使熵下降”不成立。这个表由本页直接构造和计算；MIT 讲义的另一则 OR 例子也专门区分了单次结果与平均条件熵。[MIT 6.441，推论 2.4 后的例子](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/184197ca5d5418da2415d37e929860b9_MIT6_441S16_chapter_2.pdf)

## 3. 同一件事，也可以看成联合分布与独立分布的 KL

保留真实联合表的两个边缘分布，另造一个对照分布：$q(x,y)=p_X(x)p_Y(y)$。它把两个变量独立组合；它的边缘仍是原来的 $p_X,p_Y$。比较真实共同出现的概率与这个独立对照，得到：

$$
\begin{aligned}
I(X;Y)&=D_{\mathrm{KL}}(p_{XY}\Vert p_Xp_Y)\\
&=\sum_{x,y:p(x,y)>0}p(x,y)\log_2\frac{p(x,y)}{p_X(x)p_Y(y)}
\end{aligned}
$$

将对数比写成 $\log_2p(x\mid y)-\log_2p_X(x)$，再按联合概率求和，就回到 $H(X)-H(X\mid Y)$。这也说明互信息需要联合分布，而不是把两个边缘各算一次熵就结束。[Gray，§2.5](https://ee.stanford.edu/~gray/it.pdf)

对带噪复制表，独立对照的四格均为 $1/4$。两格对角线的比值为 $3/2$，两格非对角线的比值为 $1/2$，所以：

$$
I(X;Y)=\frac34\log_2\frac32+\frac14\log_2\frac12
       \approx0.188722\ \text{bit}
$$

非对角线上的对数比是 $-1$，其加权项也是负的。**非负性属于完整的平均，不能要求每一格都非负。** 这个逐格对数比有时称为点互信息；它与本页报告的平均互信息要分开。

KL 的性质给出 $I(X;Y)\ge0$，且等于零当且仅当 $p(x,y)=p_X(x)p_Y(y)$ 对每一格都成立，即两个变量独立。[MIT 6.441，定义 2.3、定理 2.3](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/184197ca5d5418da2415d37e929860b9_MIT6_441S16_chapter_2.pdf) 这是关于精确分布的判据，不能替换成“程序显示 0.000000 就独立”。

### 零概率不需要补一个小数

联合概率为零的格子贡献 0，不计算它的对数。联合概率为正时，对应行和、列和必然为正，因此分母 $p_X(x)p_Y(y)$ 不会为零。完全不出现的行或列也可以保留。

但是，$p_Y(y)=0$ 时的 $p(x\mid y)$ 没有定义；程序将该列的条件熵标为 `None`。它在**平均条件熵**里不贡献概率质量，不会让整个平均变成 `None`。为这些格子加 epsilon 或平滑，会改掉已经指定的分布，而非只是“避免报错”。零项与条件分布的约定见 [Gray，§2.2、§2.5](https://ee.stanford.edu/~gray/it.pdf)。

## 4. 把表示碰撞写成一张概率表

[无监督与自监督学习的信号案例 D](?view=garden&scope=branch:ai-overview:orientation/learning-signals) 先讨论 A、B、C 三张源图像的同源配对，之后**另设**了一个两圆碰撞例子。这里量化的仅是后者，不能把三图配对档案当成等概率数据集。

沿用两圆例子的全部附加条件：目标 $C$ 为红、蓝两种颜色，各以 $1/2$ 出现；原观察 $V$ 分别是能辨色的红圆、蓝圆；人为规定的变换把两者都变成逐元素完全相同的灰圆数组 $G$。读取 $G$ 的系统没有原图、ID 或其他颜色信息。

变换前，行是颜色、列是原观察的联合质量表为 `[[1, 0], [0, 1]]`，除以总质量 2 得到概率。颜色由原观察完全确定：$I(C;V)=1$ bit。变换后，观察只剩一个可能值，质量表为 `[[1], [1]]`：

$$
H(C\mid G)=1\ \text{bit},\qquad I(C;G)=0
$$

这既说明没有颜色信息，也解释了原案例在等概率条件下为什么不能仅凭 $G$ 超过一半的期望分类准确率。红蓝比例若改变，颜色熵及最佳常量预测准确率都会改变；“碰撞”本身不够推出一半这个数字。

一般地，对固定的确定性变换 $g$，$I(C;g(V))\le I(C;V)$：仅处理已有观察，不能增加它关于同一目标的互信息；一一对应的重新编码则保留互信息。[MIT 6.441，定理 2.3](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/184197ca5d5418da2415d37e929860b9_MIT6_441S16_chapter_2.pdf) 丢掉某些细节也不必严格降低关于每个目标的互信息，必须先说明目标是什么。

这个例子规定的是**常量输出规则**，并不证明真实灰度转换或 SimCLR 必然抹掉颜色。若数组并不相同，或引入带有颜色信息的旁路输入，就已经换了本例条件。

## 5. 对称、标签与高阶依赖：数字能说到哪里

**互信息对称，但条件熵通常不对称。** $I(X;Y)=I(Y;X)$；交换行列只是重新列出同一批概率项。这不是交换 KL 的两个分布：$D_{\mathrm{KL}}(p_Xp_Y\Vert p_{XY})$ 一般不等于互信息；完全复制表的这个反向 KL 甚至为无穷，因为乘积分布给非对角线正概率，而真实联合分布给零。

**对称也没有指定因果方向。** 以公平的 $X=Y$ 为例，可以先生成 $X$ 再复制给 $Y$，先生成 $Y$ 再复制给 $X$，或生成共同来源 $U$ 再同时复制给二者。三个构造给出完全相同的联合表和 1 bit 互信息。仅靠这张表的互信息无法挑出哪一个生成过程；这是本页构造直接展示的限制。

**换标签不会制造或消灭依赖。** 给所有行或列作一一对应的重命名，概率和信息量不变。把完全复制表中的 $Y$ 标签 0、1 对调，得到每次都相反的二元变量，互信息仍为 1 bit。能从一个变量确定另一个，不等于它们的文字标签相同，更不等于答案符合事实。若目标本来就是常量，其熵和与任何变量的互信息均为零，也不能据此断言预测系统“无用”。

### 两两独立，仍可能藏着共同约束

另设两个独立公平比特 $A,B$，并令 $T=A\mathbin{\mathrm{XOR}}B$，即 $A,B$ 取值不相同时 $T=1$，相同时 $T=0$。完整的三变量分布只有以下四种结果，每种概率均为 $1/4$，其他四种三元组合的概率均为 0：

| $A$ | $B$ | $T$ |
| ---: | ---: | ---: |
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

任选两个变量，四种二元组合都各出现一次。因此 $I(A;B)=I(A;T)=I(B;T)=0$。但只要同时知道 $A,B$，$T$ 就已经确定，而 $H(T)=1$ bit。

把 $(A,B)$ 当作一个取值为 $00,01,10,11$ 的变量，它与 $T$ 的联合质量表依次为 `[[1, 0], [0, 1], [0, 1], [1, 0]]`，总质量 4，于是 $I((A,B);T)=1$ bit。**遗漏约束的是只看两两互信息的摘要，互信息本身可以通过组合变量捕捉它。** 这不是三个变量相互独立，也不需要在代码里另造一个多变量信息接口。

## 6. 可运行实验：精确分布与近似对数分开

数学定义不限制概率必须是某种分数；这个小实验为了让边界可检查，使用整数相对质量表示给定分布。例如 `[[3, 1], [1, 3]]` 规定四格概率为 $3/8,1/8,1/8,3/8$。质量单位可以整体放大，概率不会改变。这里的总质量 8 **不是样本量**。

唯一公共函数是 `analyze_joint(weights)`。输入必须是内置 `list` 或 `tuple` 构成的矩形表，行、列各 1–8 个，格子为非负内置整数，总质量在 1–65536 之间。布尔值、浮点数（包括 `1.0`）、子类对象、迭代器、空表、不等长行、负数和越界质量均以 `ValueError` 拒绝。全零的行或列有效，但全表不能为零；不支持运行中并发修改输入。

返回字典只包含下面八个字段：

- `joint`、`px`、`py`：精确的 `Fraction` 概率，分别放在嵌套元组、行边缘元组、列边缘元组中
- `h_x_bits`：$H(X)$ 的浮点近似
- `h_x_given_y_bits`：平均条件熵 $H(X\mid Y)$ 的浮点近似
- `h_x_given_each_y_bits`：按列给出 $H(X\mid Y=y)$ 的元组；零质量列为 `None`
- `mi_bits`：互信息的浮点近似；`independent`：根据整数关系判定独立与否的精确布尔值

令总质量为 $N$，格子质量为 $w$，对应行、列质量为 $r,c$。代码逐格比较 $wN$ 与 $rc$，不拿浮点阈值判断独立。对正质量格，互信息直接累加概率加权的对数比，并先用整数算出 $wN-rc$：

$$
\log_2\frac{wN}{rc}
=\frac{\operatorname{log1p}((wN-rc)/(rc))}{\ln2}
$$

`log1p(z)` 计算 $\ln(1+z)$，在 $z$ 接近零时避免先算 `1 + z` 丢掉细小偏移；`fsum` 改善求和精度。[Python math 文档](https://docs.python.org/3.14/library/math.html) 这样不必把两项接近的浮点熵相减来求主结果，但除法、对数、乘法和求和仍会舍入；精确分数也不会让对数变成精确值。

```python
# nextchina-example: mutual-information
import math
from fractions import Fraction


def analyze_joint(weights):
    """Analyze a specified finite joint law, with X in rows and Y in columns."""
    if type(weights) not in (list, tuple) or not 1 <= len(weights) <= 8:
        raise ValueError("weights must have 1..8 built-in list/tuple rows")
    rows = []
    width = None
    total = 0
    for row in weights:
        if type(row) not in (list, tuple) or not 1 <= len(row) <= 8:
            raise ValueError("each row must have 1..8 entries")
        if width is None:
            width = len(row)
        if len(row) != width:
            raise ValueError("weights must be rectangular")
        for w in row:
            if type(w) is not int or not 0 <= w <= 65536:
                raise ValueError("each mass must be a built-in int in 0..65536")
            total += w
            if total > 65536:
                raise ValueError("total mass must not exceed 65536")
        rows.append(tuple(row))
    if total == 0:
        raise ValueError("total mass must be positive")

    row_totals = tuple(sum(row) for row in rows)
    col_totals = tuple(sum(row[j] for row in rows) for j in range(width))
    joint = tuple(tuple(Fraction(w, total) for w in row) for row in rows)
    px = tuple(Fraction(r, total) for r in row_totals)
    py = tuple(Fraction(c, total) for c in col_totals)

    def entropy(masses, denominator):
        return math.fsum(-(w / denominator) * math.log2(w / denominator)
                         for w in masses if w)

    h_each = tuple(
        entropy((row[j] for row in rows), c) if c else None
        for j, c in enumerate(col_totals)
    )
    h_conditional = math.fsum(
        (c / total) * h for c, h in zip(col_totals, h_each) if c
    )
    terms = []
    independent = True
    for i, row in enumerate(rows):
        for j, w in enumerate(row):
            product = row_totals[i] * col_totals[j]
            difference = w * total - product  # exact integer subtraction
            independent = independent and difference == 0
            if w:  # positive joint mass implies positive row and column mass
                log_ratio = math.log1p(difference / product) / math.log(2)
                terms.append((w / total) * log_ratio)
    return {
        "joint": joint, "px": px, "py": py,
        "h_x_bits": entropy(row_totals, total),
        "h_x_given_y_bits": h_conditional,
        "h_x_given_each_y_bits": h_each,
        "mi_bits": math.fsum(terms),
        "independent": independent,
    }


same_marginals = [analyze_joint(w) for w in (
    [[1, 1], [1, 1]], [[3, 1], [1, 3]], [[1, 0], [0, 1]]
)]
assert all(r["px"] == r["py"] == (Fraction(1, 2), Fraction(1, 2))
           for r in same_marginals)
print("same marginals:", *(f'{r["mi_bits"]:.9f}' for r in same_marginals))

rare = analyze_joint([[8, 1], [0, 1]])
assert rare["h_x_given_each_y_bits"] == (0.0, 1.0)
assert rare["h_x_given_each_y_bits"][1] > rare["h_x_bits"]
print("rare outcome:", *(f'{rare[k]:.9f}' for k in (
    "h_x_bits", "h_x_given_y_bits", "mi_bits")))

color_after = analyze_joint([[1], [1]])
assert color_after["independent"] and color_after["mi_bits"] == 0.0
assert color_after["h_x_given_y_bits"] == 1.0
xor_grouped = analyze_joint([[1, 0], [0, 1], [0, 1], [1, 0]])
assert abs(xor_grouped["mi_bits"] - 1.0) <= 1e-12
print("color after / XOR grouped:", color_after["mi_bits"],
      xor_grouped["mi_bits"])

near = analyze_joint([[16385, 16383], [16383, 16385]])
assert not near["independent"]
print("near independent:", f'{near["mi_bits"]:.3e}', near["independent"])
```

输出的前两行依次显示三张同边缘表的互信息，以及反例的 $H(X)$、$H(X\mid Y)$、$I(X;Y)$：

- `same marginals: 0.000000000 0.188721876 1.000000000`
- `rare outcome: 0.468995594 0.200000000 0.268995594`
- `color after / XOR grouped: 0.0 1.0`
- `near independent: 2.687e-09 False`

最后的近独立表总质量为 65536，行列边缘仍各为 $1/2$，但每格并不都等于 $1/4$。若只显示小数点后六位，它的互信息会显示为零；精确判据依然返回 `False`。

**数值边界。** 质量上限使正概率至少为 $2^{-16}$，正边缘乘积至少为 $2^{-32}$，正概率比处于 $[2^{-16},2^{16}]$ 内；这些量在通常的双精度浮点环境中不会上溢或下溢。舍入仍可能影响接近零的结果，极小的带符号残差不构成负互信息的数学反例。代码不把负结果偷偷裁成 0，也不把很小的依赖改判为独立。测试使用 $10^{-12}$ bit 的绝对误差阈值核对独立实现的高精度熵恒等式；这是本例的回归检查标准，并非所有输入上的严格误差定理。

代码访问 $R\times C$ 个格子，并返回同量级的概率项；在这里的有界整数、基本运算计数口径下，工作量为 $O(RC)$。这不是计时承诺，取消整数上限后还需考虑整数位数。运行只需 Python 3 标准库，`Fraction` 的精确有理数行为见 [Python fractions 文档](https://docs.python.org/3.14/library/fractions.html)。

## 7. 把频数代进去，问题就从计算变成了估计

如果四个整数来自实际抽样，程序仍能计算那张**经验分布**的互信息，却不会自动知道总体的真实联合分布。没采到某格不等于真实概率为零；类别如何划分、样本是否独立、样本量是否足够，以及是否用同一份数据选择了表示，都会影响推断。

有限数据可能带来估计偏差与不确定性。不能由“各项熵估计有向下偏差”直接断言“所有分布的代入式互信息估计都向上偏”；Paninski 明确指出了这一区别。[Paninski 2003，§3、§3.3](https://sites.stat.columbia.edu/liam/research/pubs/info_est-nc.pdf) 本页没有实现估计器、误差区间或因果识别，也没有证明某种真实表征保留了任务所需的信息。抽样后的结论需要另查采样与评价协议。

## 8. 迁移练习与继续阅读

**练习一：改变基础比例。** 两圆例子改成红色概率 $3/4$、蓝色概率 $1/4$，仍规定变换前能辨色、变换后只有同一个 $G$。变换前后关于颜色的互信息各是多少？

**解析：** 变换前为 $H(C)=h_2(1/4)\approx0.811278$ bit，变换后仍为 0。最佳常量预测总猜红，准确率为 $3/4$。零互信息意味着观察没有增加关于颜色的信息，不意味着任何预测都只能有一半准确率。

**练习二：添加不可能的结果。** 在完全复制表右边加一列全零质量。互信息是否变化？新列的条件熵应写成 0 还是 `None`？

**解析：** 联合分布没有增加任何正概率事件，互信息仍为 1 bit，平均条件熵仍为 0。新列对应零概率条件，单独的条件熵是未定义的 `None`；不能把它误认为又增加一个有概率的确定性结果。

继续阅读：

- 回到[概率基础](?view=garden&scope=branch:llm:math/probability)，检查联合、边缘和条件方向
- 回到[熵、交叉熵与 KL](?view=garden&scope=branch:llm:math/objectives)，区分平均不确定性、预测损失与分布比较
- 到[无监督与自监督学习](?view=garden&scope=branch:ai-overview:orientation/learning-signals)，追踪训练信号来自哪里，并核对信息碰撞所需的条件
- [信息压缩概念入口](?view=garden&scope=concept:compression)已有[压缩与表示基础课](?view=garden&scope=branch:llm:math/compression)，可继续区分已知分布的码长、完整帧开销与有损信息边界；[对比学习概念入口](?view=garden&scope=concept:contrastive-learning)的独立教学单元仍待建设，本页不把该应用计作已完成

## 来源、版本与验证边界

访问核验日期为 **2026-10-05**，不等同于来源的出版日期。

1. Robert M. Gray，*Entropy and Information Theory*，[作者托管全文](https://ee.stanford.edu/~gray/it.pdf)。所读封面为 **First Edition, Corrected，June 26, 2023**，不是 2011 年第二版；使用 §2.2、§2.3、§2.5 的有限离散定义、零项、单位与恒等式
2. Yury Polyanskiy、Yihong Wu，MIT 6.441，Spring 2016，[课程讲义索引](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/pages/lecture-notes/)及[第 2 章全文](https://ocw.mit.edu/courses/6-441-information-theory-spring-2016/184197ca5d5418da2415d37e929860b9_MIT6_441S16_chapter_2.pdf)。使用 §2.3，印刷页 23–24，定义 2.3、定理 2.3–2.4 与推论 2.4；本页例子的具体整数质量均在正文完整指定
3. Liam Paninski，*Estimation of Entropy and Mutual Information*，Neural Computation 15，1191–1253，2003，[作者托管出版版](https://sites.stat.columbia.edu/liam/research/pubs/info_est-nc.pdf)，使用 §3、§3.3；只支持估计与已知分布计算的区别及偏差提醒
4. Python [math](https://docs.python.org/3.14/library/math.html) 与 [fractions](https://docs.python.org/3.14/library/fractions.html) 的 3.14 文档：核对 `log1p`、`fsum`、`Fraction` 的行为；教学代码使用 Python 3 标准库

本页的验证范围是有限人造分布、函数输入边界和数值恒等式。未做真实数据估计、模型训练或性能测评；独立内容与数值复核也不等于独立专家认证。
