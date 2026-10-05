> **本页解决的问题**：怎样读懂向量、矩阵与张量的形状，判断一次乘法究竟在比较位置，还是在变换特征？
>
> 前置知识是实数加减乘除、平方根与下标；不要求先学微积分。若不清楚模型输入从哪里来，可先读 [Token 与 Embedding](?view=garden&scope=branch:llm:math/tokenization)。本页使用实数、稠密数组和自定教学数字，目标是读懂 Attention 的计算接口，不覆盖特征值或奇异值分解。

## 1. 先给每根轴命名

标量是一个数；向量是一列有序坐标；矩阵按两个下标取数；深度学习代码中的张量通常指具有多根轴的数组。[1] “三阶张量”指有三根轴，不是只有三个数，也不是矩阵秩为三。

| 对象 | 形状 | 如何读取 |
| --- | --- | --- |
| 一个位置的表示 $x$ | $(d,)$ | 第 $j$ 个特征坐标 |
| 一个序列的表示 $X$ | $(S,d)$ | 第 $t$ 个位置、第 $j$ 个特征 |
| 一个批次的表示 $H$ | $(B,S,d)$ | 第 $b$ 条序列、第 $t$ 个位置、第 $j$ 个特征 |

这里 $B$ 是批次大小，即一个批次内的序列数，$S$ 是序列长度，$d$ 是隐藏维度。可把批次想成一叠表，每张表有 $S$ 行，每行有 $d$ 个数字。形状 $(2,3,4)$ 共有 $2\times3\times4=24$ 个元素，但三根轴不能随意互换。真实变长序列可能需要补齐与掩码；补齐到同样长度，并不让填充位置变成有效内容。

隐藏维度也不是“明确命名的语义标签数”。教学时把坐标叫特征有助于理解计算，但不能据此断言第一维必然代表情绪、第二维必然代表语法。

## 2. 点积、逐元素乘法与行列约定

对 $u=[1,2,3]$、$v=[4,0,-1]$，逐元素乘法保留三个结果，而点积把它们求和：

$$
u\odot v=[4,0,-3],\qquad u\cdot v=4+0-3=1
$$

点积输入是等长向量，输出是标量。它衡量坐标乘积的合计，可能为负，不是概率。本文把每个位置写为**行向量**，于是投影写作 $xW$。若教材采用列向量，同一变换写成 $W^Tx^T$；先读约定再比较公式。

形状 $(d,)$ 的一维数组本身没有显式行轴或列轴；$(1,d)$ 和 $(d,1)$ 才分别是行、列矩阵。在 NumPy 中，一维数组转置不会自动变成列矩阵。[5] 矩阵转置则交换两个下标：$(X^T)_{ij}=X_{ji}$。[1] 这不是重新按原顺序把数字塞进另一种形状。

## 3. 矩阵乘法：一行与一列做点积

设 $X$ 有 $S$ 行、$d$ 列，$W$ 有 $d$ 行、$r$ 列。内部维度必须相等，外部维度留下来：[2]

$$
\underbrace{X}_{S\times d}\underbrace{W}_{d\times r}
=\underbrace{Y}_{S\times r},\qquad
Y_{tj}=\sum_{k=1}^{d}X_{tk}W_{kj}
$$

每一列 $W_{:,j}$ 指定一种坐标加权方式。对下面两个位置，使用同一份权重：

$$
X=\begin{bmatrix}1&2&3\\0&1&-1\end{bmatrix},\quad
W=\begin{bmatrix}1&0\\0&2\\1&-1\end{bmatrix},\quad
XW=\begin{bmatrix}4&1\\-1&3\end{bmatrix}
$$

第一行第一列是 $1\times1+2\times0+3\times1=4$；第一行第二列是 $1\times0+2\times2+3\times(-1)=1$。第二行同理得到 $-1$ 和 $3$。位置数仍为 2，每个位置从 3 维变为 2 维；这一步没有混合不同位置。

矩阵乘法通常不能交换顺序。这里 $WX$ 也合法，但结果是 $3\times3$，不是上述 $2\times2$ 的结果。“能运行”只能证明维度兼容，不能证明计算含义正确。

## 4. 批次与 Attention：保留谁，求和谁？

当输入为 $(B,S,d)$、共享权重为 $(d,r)$ 时，对每个批次的矩阵分别应用 $XW$，输出是 $(B,S,r)$。[2] 只有特征轴 $d$ 被求和，批次轴与位置轴都保留；不能把批次轴也当作矩阵相乘的内部维度。

单个注意力头中，$Q=XW_Q$、$K=XW_K$ 都是 $(S,d_k)$。要比较每个查询位置与每个键位置，就计算：[4]

$$
\underbrace{Q}_{S\times d_k}
\underbrace{K^T}_{d_k\times S}
=\underbrace{G}_{S\times S},\qquad
G_{ij}=q_i\cdot k_j
$$

对批次张量，只交换 K 的最后两根轴，得到 $(B,d_k,S)$，不能把整套轴顺序一概倒过来。输出 $(B,S,S)$ 的两根 S 轴分别代表查询位置和键位置。把 $QK^T$ 写成 $Q^TK$，会改成聚合位置、比较特征的另一项计算。后续缩放、掩码和 Softmax 见 [Attention 完整计算](?view=garden&scope=branch:llm:mechanisms/attention)。

## 5. 范数、距离和余弦各自回答什么？

L2 范数表示从原点到向量的长度；欧氏距离是两个向量之差的长度；非零向量的余弦相似度比较方向：[1]

$$
\|u\|_2=\sqrt{\sum_i u_i^2},\quad
d(u,v)=\|u-v\|_2,\quad
\operatorname{cos}(u,v)=\frac{u\cdot v}{\|u\|_2\|v\|_2}
$$

取 $u=[3,4]$、$v=[6,8]$：范数分别为 5、10，距离为 5，点积为 50，余弦为 1。同方向不代表相同位置；放大向量会改变长度与点积，却不改变方向。单位向量之间还有 $\|u-v\|_2^2=2-2\operatorname{cos}(u,v)$，但未归一化时不能直接套用。

零向量的范数与到别人的距离仍有定义，余弦却因分母为零而未定义。库若加入 epsilon，那是具体数值约定，不能说数学定义自动给出了零。另一个边界是特征单位：把长度的单位从米改为厘米，会改变未经处理的距离，因此比较前应说明坐标的尺度。

## 6. 广播不会替你理解轴

NumPy 广播从最右边比较轴长：相等或其中一个为 1 才兼容，缺失轴视为 1。[3] 例如对 $(B,S,d)$ 加形状 $(d,)$ 的偏置，是把同一偏置用于每个位置；这符合按特征加偏置的意图。

危险情形是“碰巧相等”：给形状 $(2,3,3)$ 的表示乘一个长度为 3 的**位置**权重，实际广播会沿最后的特征轴对齐，结果仍然合法。要按位置加权，应显式使用 $(1,3,1)$。广播通过、形状正确、轴含义正确，是三层不同检查。

## 7. 可运行的二维算术实验

下例只需 Python 3 标准库，提供可单独测试的函数。它拒绝空输入、不规则行、维度不匹配、非有限数、布尔值以及零向量余弦；数值转换或结果超出有限浮点范围也报错。它仅实现非空向量和二维矩阵的教学运算，**没有**实现批次张量、广播、自动微分或 GPU 内核。

```python
# nextchina-example: tensor-shapes
import math

def finite_number(x):
    if isinstance(x, bool) or not isinstance(x, (int, float)):
        raise ValueError("只接受实数 int/float，不接受布尔值")
    try:
        value = float(x)
    except (OverflowError, ValueError) as exc:
        raise ValueError("数值超出浮点范围") from exc
    if not math.isfinite(value):
        raise ValueError("数值必须有限")
    return value

def vector(values):
    if not isinstance(values, (list, tuple)) or not values:
        raise ValueError("需要非空向量")
    return [finite_number(x) for x in values]

def matrix_shape(rows):
    if not isinstance(rows, (list, tuple)) or not rows:
        raise ValueError("需要非空二维矩阵")
    checked = [vector(row) for row in rows]
    width = len(checked[0])
    if any(len(row) != width for row in checked):
        raise ValueError("矩阵各行必须等长")
    return len(checked), width

def transpose(rows):
    matrix_shape(rows)
    return [list(column) for column in zip(*rows)]

def dot(u, v):
    u, v = vector(u), vector(v)
    if len(u) != len(v):
        raise ValueError("点积要求等长向量")
    try:
        result = math.fsum(a * b for a, b in zip(u, v))
    except (OverflowError, ValueError) as exc:
        raise ValueError("点积超出有限浮点范围") from exc
    return finite_number(result)

def matmul(a, b):
    _, inner = matrix_shape(a)
    other_inner, _ = matrix_shape(b)
    if inner != other_inner:
        raise ValueError("矩阵乘法的内部维度必须相等")
    columns = transpose(b)
    return [[dot(row, column) for column in columns] for row in a]

def l2_norm(u):
    return finite_number(math.hypot(*vector(u)))

def euclidean_distance(u, v):
    u, v = vector(u), vector(v)
    if len(u) != len(v):
        raise ValueError("距离要求等长向量")
    return l2_norm([a - b for a, b in zip(u, v)])

def cosine(u, v):
    u, v = vector(u), vector(v)
    def unit(values):
        scale = max(abs(x) for x in values)
        if scale == 0:
            raise ValueError("零向量的余弦未定义")
        scaled = [x / scale for x in values]
        length = math.hypot(*scaled)
        return [x / length for x in scaled]
    value = dot(unit(u), unit(v))
    return max(-1.0, min(1.0, value))  # 限制浮点舍入越界

X = [[1, 2, 3], [0, 1, -1]]
W = [[1, 0], [0, 2], [1, -1]]
Y = matmul(X, W)
assert matrix_shape(X) == (2, 3)
assert Y == [[4, 1], [-1, 3]]
assert transpose(transpose(X)) == X
assert matmul(X, transpose(X)) == [[14, -1], [-1, 2]]
assert dot([1, 2, 3], [4, 0, -1]) == 1
assert l2_norm([3, 4]) == 5
assert euclidean_distance([3, 4], [6, 8]) == 5
assert math.isclose(cosine([3, 4], [6, 8]), 1.0)
assert l2_norm([0, 0]) == 0
small = math.ulp(0.0)
assert math.isclose(cosine([small, small], [small, 0]), 1 / math.sqrt(2))
for bad in [lambda: matmul([[1, 2]], [[1, 2]]),
            lambda: matrix_shape([[1], [2, 3]]),
            lambda: dot([1], [float("nan")]),
            lambda: l2_norm([]), lambda: vector([True]),
            lambda: cosine([0, 0], [1, 2])]:
    try:
        bad()
    except ValueError:
        pass
    else:
        raise AssertionError("非法输入未被拒绝")
print(Y)
```

预期输出为 `[[4.0, 1.0], [-1.0, 3.0]]`。余弦先将两个向量各自按最大绝对分量缩放，再归一化并做点积。这样既避免直接相乘两个范数带来的溢出，也避免极小非零分量的范数舍入破坏方向；这仍不是任意精度计算。

## 8. 易错点与验收练习

- 把“向量有 d 个坐标”误说成“张量有 d 根轴”：先区分轴数与轴长
- 把点积、逐元素乘法、矩阵乘法当成同一件事：先写输出是标量、向量还是矩阵
- 只检查乘法能否执行：还要写出求和轴、保留轴与每行含义
- 把余弦高当作模型答案正确：几何量本身不提供事实验证

**练习**：输入形状是 $(4,5,3)$，投影权重是 $(3,2)$。输出是什么形状？单头 Q、K 都用该输出时，注意力分数是什么形状？另求 $u=[1,0]$、$v=[0,2]$ 的点积、欧氏距离与余弦。

**答案**：投影为 $(4,5,2)$；每个批次的 Q 乘 K 最后两轴的转置，分数为 $(4,5,5)$。两向量点积为 0，距离为 $\sqrt5$，余弦为 0。能指出第二个 5 是键位置轴，才算理解输出的含义。

继续沿 [点积](?view=garden&scope=concept:dot-product)、[矩阵乘法](?view=garden&scope=concept:matrix-multiplication) 查看概念关联；沿 [Softmax 与温度](?view=garden&scope=branch:llm:math/softmax) 学习分数归一化，再回到 Attention。

## 来源与范围

[1] Goodfellow、Bengio、Courville，[Deep Learning，第 2 章](https://www.deeplearningbook.org/contents/linear_algebra.html)。用于对象、转置、范数与几何量的基本定义；本页数字与练习为独立构造。

[2] [NumPy 官方 matmul 文档](https://numpy.org/doc/stable/reference/generated/numpy.matmul.html)。用于二维乘法的维度约定与批次矩阵语义。

[3] [NumPy 官方广播规则](https://numpy.org/doc/stable/user/basics.broadcasting.html)。用于轴从右对齐的规则；位置权重陷阱为本页构造。

[4] Vaswani 等，[Attention Is All You Need，第 3.2 节](https://arxiv.org/html/1706.03762v7#S3.SS2)。用于 Q/K 投影及位置间点积的连接。

[5] [NumPy 官方 transpose 文档](https://numpy.org/doc/stable/reference/generated/numpy.transpose.html)。用于一维数组转置与多轴置换的边界。

资料核对日期：**2026-10-05**。范围是数学定义、官方算子语义和教学算例，仍待独立复核；不构成完整线性代数课程，也没有重新核验或更新任何商业模型规格、报价与榜单日期。
