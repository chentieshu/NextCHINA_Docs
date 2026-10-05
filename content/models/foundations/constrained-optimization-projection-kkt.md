> **本页解决的问题**：希望两项分配尽量接近 $(3,2)$，但总量最多只有 3，怎样找到可行的最优分配，并给出可以逐项检查的证明？
>
> 前置阅读：[向量、点积与范数](?view=garden&scope=branch:llm:math/tensor-shapes) 帮你读懂距离；[导数](?view=garden&scope=branch:llm:math/derivatives) 帮你求变化率；[训练循环](?view=garden&scope=branch:llm:training/loop) 区分目标和更新规则。本页的分配单位、目标点与相同的误差权重都是教学构造，不是实际业务的成本收益模型。

## 1. 先规定哪些答案允许出现

设 $x,y$ 是两项可连续分割的资源，不能为负，总量不超过预算 $B$。我们希望它们靠近目标 $(a,b)$，用平方距离的一半衡量偏离：

$$
\begin{aligned}
f(x,y)&=\frac12\bigl[(x-a)^2+(y-b)^2\bigr]\\
C_B&=\{(x,y):x\ge0,\ y\ge0,\ x+y\le B\}
\end{aligned}
$$

问题是**在 $C_B$ 内把 $f$ 降到最低**。这里的 $x,y$ 是决策变量，$a,b,B$ 是事先给定的数；$1/2$ 只是让求导时的系数更简洁。资源若必须取整数，这个连续模型就不适用；改变坐标单位或误差权重，也会改变“最近”的含义。

一般写法中的不等式是 $g_i(w)\le0$，等式是 $h_j(w)=0$。满足全部约束的点叫可行点；使目标在可行集合内最小的点叫最优解；把它代入目标得到的数才叫最优值。这套术语见 [Boyd 与 Vandenberghe §4.1.1–4.1.2](https://www.seas.ucla.edu/~vandenbe/cvxbook/bv_cvxbook.pdf)。

固定 $(a,b)=(3,2)$、$B=3$，几个答案的地位完全不同：

| 点 | 是否可行 | $f(x,y)$ | 判断 |
| --- | --- | ---: | --- |
| $(3,2)$ | 否，总量为 5 | $0$ | 无约束最优，不能采用 |
| $(0,0)$ | 是 | $13/2$ | 合规不等于最优 |
| $(2,1)$ | 是 | $1$ | 后文证明它最优 |
| $(9/5,6/5)$ | 是 | $26/25$ | 等比例缩放，稍差 |

最后一行来自把 $(3,2)$ 乘以 $3/5$。它确实用满预算，但不能因为“归一化后满足总量”就叫它欧氏投影。

当 $B>0$，可行域是包含边界的三角形，顶点为 $(0,0),(B,0),(0,B)$；$B=0$ 时只剩原点；$B<0$ 时根本没有可行点。对 $B\ge0$，集合非空、闭且有界，连续的 $f$ 能取到最小值。它也是凸集：任意两个可行分配的加权平均仍满足三个约束。平方距离是严格凸函数，因此本题最优点唯一；第 4 节会把唯一性写成一个直接可算的式子。

## 2. 为什么最优点的梯度不一定为零？

先只看预算边 $x+y=3$，代入 $y=3-x$，并保留 $0\le x\le3$：

$$
\begin{aligned}
f(x,3-x)&=\frac12\bigl[(x-3)^2+(1-x)^2\bigr]\\
\frac{d}{dx}f(x,3-x)&=2x-4
\end{aligned}
$$

边上最小点是 $x=2,y=1$。这里我们只比较了这条边，还没证明它胜过三角形内的所有点。

原来二维目标的梯度是 $\nabla f(x,y)=(x-a,y-b)$，所以：

$$
\nabla f(2,1)=(-1,-1)\ne(0,0)
$$

沿负梯度 $(1,1)$ 移动，目标会先下降，却立即违反预算。这就是约束带来的关键变化：只需排除**允许方向**上的改进，不能要求所有方向上的变化率都为零。沿预算边的切向 $(1,-1)$，梯度点积为 0；沿向内方向，目标一阶变化不会更好。下一节把这些方向关系组织成一个证书。

## 3. KKT 证书：符号、平衡与互补

先统一三个不等式的方向：

$$
\begin{aligned}
g_1(x,y)&=x+y-B\le0\\
g_2(x,y)&=-x\le0\\
g_3(x,y)&=-y\le0
\end{aligned}
$$

给它们分别配上非负乘子 $\lambda,\alpha,\beta$，组成拉格朗日函数：

$$
\begin{aligned}
L&=f(x,y)+\lambda(x+y-B)\\
&\quad-\alpha x-\beta y
\end{aligned}
$$

等式约束若存在，使用 $+\nu h(x,y)$，其乘子 $\nu$ 不要求非负。本题和后面的代码只处理上述三个不等式，没有偷偷把等式或其他约束交给一个通用接口。

对一个候选点与一组乘子，逐项检查：

1. **原始可行性**：$x\ge0,\ y\ge0,\ x+y\le B$
2. **对偶可行性**：$\lambda,\alpha,\beta\ge0$
3. **驻点条件**：拉格朗日函数对决策变量的梯度为零
4. **互补松弛**：每个乘子与对应约束剩余量的乘积为零

后二项在本题中就是：

$$
\begin{aligned}
x-a+\lambda-\alpha&=0\\
y-b+\lambda-\beta&=0\\
\lambda(x+y-B)&=0\\
\alpha x=\beta y&=0
\end{aligned}
$$

这种可检查的组合称为 KKT 条件。凸问题中的充分性，以及必要性所需的附加条件，见 [Boyd 与 Vandenberghe §5.5.3，印刷页 243–244](https://www.seas.ucla.edu/~vandenbe/cvxbook/bv_cvxbook.pdf)。本页接着直接证明这个具体二次问题的充分性，不把一般定理当作黑箱。

对于 $(a,b)=(3,2),B=3$，取点 $(2,1)$ 与证书 $(\lambda,\alpha,\beta)=(1,0,0)$：

- 三个约束成立，三个乘子非负
- 驻点等式分别为 $2-3+1=0$、$1-2+1=0$
- 预算恰好用满，故 $1\times(2+1-3)=0$；另两个乘子本来为零

预算约束的法向量是 $(1,1)$，乘上 $\lambda=1$，恰好平衡目标梯度 $(-1,-1)$。被平衡到零的是拉格朗日梯度，不是单独的目标梯度。

**活跃**只表示一个约束取到等号。由互补松弛，“严格不活跃”会迫使乘子为零，“乘子为正”会迫使约束活跃；逆向的“活跃就一定有正乘子”不成立。

## 4. 一条恒等式，证明所有其他可行点都不更好

记目标向量为 $t=(a,b)$。设 $w$ 与 $(\lambda,\alpha,\beta)$ 满足上一节四项条件，另取任意可行点 $z=(z_x,z_y)$。先展开两个平方距离之差：

$$
\begin{aligned}
f(z)-f(w)
&=\frac12\|z-w\|_2^2\\
&\quad+(w-t)\mathbin{\cdot}(z-w)
\end{aligned}
$$

驻点条件给出 $w-t=-\lambda(1,1)+(\alpha,\beta)$。将它代入，再用互补关系 $\lambda(w_x+w_y)=\lambda B$、$\alpha w_x=\beta w_y=0$，得到：

$$
\begin{aligned}
f(z)-f(w)
&=\frac12\|z-w\|_2^2\\
&\quad+\lambda(B-z_x-z_y)\\
&\quad+\alpha z_x+\beta z_y\ \ge0
\end{aligned}
$$

右边每项都非负：$z$ 可行提供预算余量和非负坐标，证书提供非负乘子。若 $z\ne w$，平方距离项严格为正，因此 $f(z)>f(w)$。这样既证明了**全局最优**，也证明了**原始最优点唯一**，没有只凭“数值残差很小”下结论。

主例中 $w=(2,1)$，证书使公式简化为：

$$
f(z)-1=\frac12\|z-(2,1)\|_2^2+(3-z_x-z_y)
$$

比如取 $z=(1,1)$，左边为 $5/2-1=3/2$；右边为 $1/2+1=3/2$。用满预算时最后一项为零，仍然不能消除离开最优点的距离代价。

这里证明的是这个凸二次族的结论。任意可微非凸问题既不能照搬全局最优性，也不能无条件声称最优点必有 KKT 乘子。必要性涉及约束资格条件；对本页则可以直接构造证书，不需要把读者带进一套通用对偶求解器。

## 5. 从边界分类推导精确投影

**欧氏投影**就是找集合内距离目标最近的点，因而本题最优解正是 $\Pi_{C_B}(a,b)$。先在非负象限上各自截断：

$$
u=\bigl(\max(a,0),\max(b,0)\bigr)
$$

如果 $u_x+u_y\le B$，这个点已经是更大集合“整个非负象限”上的最优点，又落在 $C_B$ 里，自然也是本题最优点。

如果截断后的总量超过 $B$，最优点必须在 $x+y=B$ 上。否则，从一个尚有预算余量的候选点朝象限最优点 $u$ 移动一小步，仍可行且会降低目标，与最优性矛盾。沿这条边代入 $y=B-x$：

$$
\begin{aligned}
\frac{d}{dx}f(x,B-x)&=2x-a+b-B\\
x^*&=\operatorname{clip}\!\left(\frac{a-b+B}{2},0,B\right)\\
y^*&=B-x^*
\end{aligned}
$$

其中 $\operatorname{clip}(s,0,B)=\min(B,\max(0,s))$。如果边上无约束的驻点超出线段，就取最近的端点。

证书也能沿分支推出来：

- 预算用满且两坐标均为正时，$\alpha=\beta=0$，故 $x=a-\lambda,y=b-\lambda$；用满预算给出 $\lambda=(a+b-B)/2$
- 在 $(B,0)$ 且 $B>0$ 时，$\alpha=0$，故 $\lambda=a-B$，而 $\beta=\lambda-b\ge0$
- 在 $(0,B)$ 且 $B>0$ 时，对称地有 $\lambda=b-B$、$\alpha=\lambda-a\ge0$
- 象限截断已可行时可以取 $\lambda=0$；$B=0$ 时可直接取 $\lambda=\max(0,a,b)$

还可以检查这些分支为何恰好合并成一个最大值。对共同扣减量 $s\ge0$，有恒等式：

$$
\begin{aligned}
&\max(a-s,0)+\max(b-s,0)\\
&\quad=\max(0,a-s,b-s,a+b-2s)
\end{aligned}
$$

由于 $B\ge0$，右边不超过 $B$ 等价于 $s\ge a-B$、$s\ge b-B$、$s\ge(a+b-B)/2$。再加 $s\ge0$，最小的共同扣减量就是下式的 $\lambda$。若它为正，截断后的总量恰好降到 $B$；若它为零，原先的非负截断已经可行。配合上面的分支，这给出一组合法证书：

$$
\begin{aligned}
\lambda&=\max\bigl(0,(a+b-B)/2,\\
&\qquad a-B,b-B\bigr)\\
x^*&=\max(a-\lambda,0)\\
y^*&=\max(b-\lambda,0)\\
\alpha&=\max(\lambda-a,0)\\
\beta&=\max(\lambda-b,0)
\end{aligned}
$$

它只对应本页的二维、等权平方距离和三条仿射约束。换成别的目标、带权距离或更多约束，不能继续把这个 `max` 表达式当优化器。

### 同一目标，六种预算

下面固定 $(a,b)=(3,2)$；三元组依次为预算乘子、$x$ 下界乘子、$y$ 下界乘子：

| $B$ | 最优点 | 最优值 | $(\lambda,\alpha,\beta)$ |
| ---: | --- | ---: | --- |
| $6$ | $(3,2)$ | $0$ | $(0,0,0)$ |
| $5$ | $(3,2)$ | $0$ | $(0,0,0)$ |
| $3$ | $(2,1)$ | $1$ | $(1,0,0)$ |
| $1$ | $(1,0)$ | $4$ | $(2,0,0)$ |
| $1/2$ | $(1/2,0)$ | $41/8$ | $(5/2,0,1/2)$ |
| $0$ | $(0,0)$ | $13/2$ | $(3,0,1)$ |

$B=6$ 时预算不活跃。$B=5$ 时预算活跃，但乘子仍为零；$B=1$ 时 $y$ 下界也活跃，但 $\beta=0$。这些是真实的退化边界，不应由程序把零乘子“修正”为正数。

$B=0$ 时点唯一，乘子却不唯一：任意 $\lambda\ge3$，配 $\alpha=\lambda-3,\beta=\lambda-2$ 都满足证书。表中只是选择最小的可行 $\lambda=3$。

此时不存在同时满足 $x>0,y>0,x+y<0$ 的严格可行点，所以不能使用“所有不等式都严格成立”的 Slater 版本。但三个约束全是仿射函数（常数加变量的一次项），目标定义域是整个平面；允许仿射不等式取等号的**精化 Slater 条件**仍适用，见 [Boyd 与 Vandenberghe §5.2.3，式 (5.26)–(5.27)，印刷页 226–227](https://www.seas.ucla.edu/~vandenbe/cvxbook/bv_cvxbook.pdf)。没有严格内部，不等于这里所有约束资格条件都失败；前面的直接证书证明也一直有效。

## 6. 投影更新：一步解出只是本目标的特殊性

普通梯度下降先走到 $w-\eta\nabla f(w)$，这个点可能越界。投影梯度更新再把它投回可行集合：

$$
w_{\mathrm{next}}=\Pi_{C_B}\bigl(w-\eta\nabla f(w)\bigr)
$$

这个更新式及闭凸集投影的讨论见 [MIT 6.7220/15.084 Lecture 14，§L14.1，印刷页 1，式 (1)](https://ocw.mit.edu/courses/6-7220j-nonlinear-optimization-spring-2025/mit6_7220_s25_lec14.pdf)。投影保证输出在集合内；收敛速度还取决于目标和步长等条件。

本题恰好有 $\nabla f(w)=w-t$，Hessian（各坐标二阶导数组成的矩阵）是单位矩阵。令 $\eta=1$：

$$
\begin{aligned}
w-\nabla f(w)&=w-(w-t)=t\\
w_{\mathrm{next}}&=\Pi_{C_B}(t)=w^*
\end{aligned}
$$

所以从任意起点做这一步，投影前都会到同一目标 $t$，投影后就是最优点。这是代数恒等式带来的特殊结论，不是“约束优化通常只要一步”。如果把目标改成带权平方和，或换成一般训练损失，梯度不再等于 $w-t$；原来的步长和结论都要重新检查。

## 7. 把超预算加进惩罚，为什么仍会越界？

现在固定目标 $(3,2)$、预算数字 3，保留 $x,y\ge0$，**移除硬预算约束**，改为最小化：

$$
\begin{aligned}
J_\rho(x,y)&=f(x,y)\\
&\quad+\frac\rho2\bigl[\max(0,x+y-3)\bigr]^2,\\
\rho&\ge0
\end{aligned}
$$

这个问题允许超预算，只是给超出的部分加平方代价。它与[正则化：加法目标的含义与边界](?view=garden&scope=branch:llm:training/budget/regularization) 相连，但我们在这里只问可行性，不推导预测或泛化收益。

在超预算区域令 $v=x+y-3>0$，两个驻点方程为：

$$
\begin{aligned}
x-3+\rho v&=0\\
y-2+\rho v&=0\\
v&=2-2\rho v
\end{aligned}
$$

解出：

$$
\begin{aligned}
v&=\frac{2}{1+2\rho}\\
x_\rho&=3-\frac{2\rho}{1+2\rho}\\
y_\rho&=2-\frac{2\rho}{1+2\rho}
\end{aligned}
$$

对每个有限 $\rho\ge0$，两个坐标都为正且 $v>0$，所以推导时假定的区域确实成立。平方正部函数 $s\mapsto\max(0,s)^2$ 是凸且可微的：其导数在 $s\le0$ 为 0，在 $s>0$ 为 $2s$，单调不减。因此 $J_\rho$ 是严格凸平方距离加一个凸项；梯度为零的这个点是全局唯一最优点，也符合保留的非负约束。

| $\rho$ | $x_\rho$ | $y_\rho$ | 超预算量 $v$ |
| ---: | ---: | ---: | ---: |
| $0$ | $3$ | $2$ | $2$ |
| $1/2$ | $5/2$ | $3/2$ | $1$ |
| $1$ | $7/3$ | $4/3$ | $2/3$ |
| $2$ | $11/5$ | $6/5$ | $2/5$ |
| $100$ | $403/201$ | $202/201$ | $2/201$ |

增加这个惩罚系数会靠近硬约束解 $(2,1)$，但**任何有限系数都没有真正满足预算**。这是这个平方惩罚的精确反例，不是所有惩罚都无法精确实现约束；其他惩罚形式及带条件的等价关系需要分别证明。原问题的 $\lambda=1$ 也不等于“随手把惩罚系数设成 $\rho=1$”：后者在这里仍超出 $2/3$。

## 8. 可运行实验：精确算术与独立检查

下面只用 Python 标准库。三个小函数的范围是：

- `project(target, budget)` 只求本页 $C_B$ 上的二维投影，返回点与按 $(\lambda,\alpha,\beta)$ 排列的证书
- `loss(point, target)` 计算本页平方距离的一半；它不判断点是否可行，也不接受其他目标函数
- `penalty_fixed(rho)` 只求第 7 节固定目标 $(3,2)$、固定预算 3 的惩罚问题，返回最优点

坐标对必须是长度恰为 2 的内置 `tuple` 或 `list`；每个数必须是类型恰为 `int` 或 `Fraction` 的精确数。布尔值、浮点数、字符串及这些类型的自定义子类都不接受，类型错误抛 `TypeError`；坐标长度错误、负预算或负惩罚系数抛 `ValueError`。没有批处理、任意维度、整数规划或其他约束接口，输入也不会被改写。

函数没有人为截断有理数的数值或位数；这不代表任意大的分子、分母都能在固定时间内算完。精确算术的代价会随位数增长。下面实际运行的实验只包含表中的六个预算和五个惩罚系数，不使用随机采样或浮点容差。

```python
# nextchina-example: constrained-optimization-projection-kkt
from fractions import Fraction


def _rational(value):
    if type(value) not in (int, Fraction):
        raise TypeError("expected an exact int or Fraction")
    return Fraction(value)


def _point(value):
    if type(value) not in (tuple, list):
        raise TypeError("expected a two-coordinate tuple or list")
    if len(value) != 2:
        raise ValueError("expected exactly two coordinates")
    return tuple(_rational(v) for v in value)


def loss(point, target):
    x, y = _point(point)
    a, b = _point(target)
    return ((x - a) ** 2 + (y - b) ** 2) / 2


def project(target, budget):
    """Only C_B = {x >= 0, y >= 0, x+y <= B}; return point, KKT triple."""
    a, b = _point(target)
    budget = _rational(budget)
    if budget < 0:
        raise ValueError("negative budget: the feasible set is empty")
    zero = Fraction(0)
    lam = max(zero, (a + b - budget) / 2,
              a - budget, b - budget)
    x, y = max(a - lam, zero), max(b - lam, zero)
    alpha, beta = max(lam - a, zero), max(lam - b, zero)
    return (x, y), (lam, alpha, beta)


def penalty_fixed(rho):
    """Only target=(3,2), B=3, squared positive-part budget penalty."""
    rho = _rational(rho)
    if rho < 0:
        raise ValueError("rho must be nonnegative")
    shift = 2 * rho / (1 + 2 * rho)
    return Fraction(3) - shift, Fraction(2) - shift


target = (3, 2)
print("B | x | y | f | lambda | alpha | beta")
for budget in (6, 5, 3, 1, Fraction(1, 2), 0):
    point, certificate = project(target, budget)
    x, y = point
    lam, alpha, beta = certificate
    assert x >= 0 and y >= 0 and x + y <= budget
    assert min(certificate) >= 0
    assert x - 3 + lam - alpha == 0
    assert y - 2 + lam - beta == 0
    assert lam * (x + y - budget) == alpha * x == beta * y == 0
    row = (budget, x, y, loss(point, target)) + certificate
    print(" | ".join(map(str, row)))

scaled = (Fraction(9, 5), Fraction(6, 5))
assert loss(scaled, target) == Fraction(26, 25)
start = (Fraction(1, 4), Fraction(1, 2))
gradient = tuple(w - t for w, t in zip(start, target))
pre_projection = tuple(w - g for w, g in zip(start, gradient))
assert pre_projection == target  # eta=1, only this identity-Hessian objective
assert project(pre_projection, 3)[0] == (2, 1)

print("rho | x | y | budget violation")
for rho in (0, Fraction(1, 2), 1, 2, 100):
    x, y = penalty_fixed(rho)
    violation = x + y - 3
    assert x > 0 and y > 0 and violation > 0
    assert violation == 2 / (1 + 2 * Fraction(rho))
    assert x - 3 + rho * violation == 0
    assert y - 2 + rho * violation == 0
    print(" | ".join(map(str, (rho, x, y, violation))))
print("exact table, KKT and finite-penalty checks passed")
```

第一段输出与第 5 节六行表逐项一致；第二段输出与第 7 节五行表一致。中间还检查等比例缩放的 $26/25$，以及特殊步长 $\eta=1$ 的投影结果。证书断言同时检查可行性、乘子符号、驻点等式与互补关系，而不是仅核对打印标签。

另一个不依赖乘子公式的核对办法是**枚举三条边上的最小值**：在 $x=0$ 边上截断 $b$ 到 $[0,B]$；在 $y=0$ 边上截断 $a$；在斜边上解一维二次函数；若目标本身可行，再加入这个内部候选。全局最小点要么在边界上，要么在内部满足 $\nabla f=0$，因此这些候选足够覆盖本题。逐个直接计算平方距离，取最小者，可以独立核对投影公式。

**证据边界**：本页作者回归将实际代码块与独立逐面最小化比较，检查了 $a,b\in\{-3,-5/2,\ldots,3\}$、$B\in\{0,1/2,\ldots,6\}$ 的 2,197 个精确有理数组合，另检查证书恒等式、边界、输入拒绝与固定惩罚例子。有限检查用于发现实现错误，不能取代第 4–5 节对整个数学族的推导；作者自测也不是独立专家审稿或生产求解器认证。本页仍需独立内容审阅。

## 9. 常见误解与练习

- **“目标值更小，就该选它。”** 先检查可行性；主例的目标点虽然损失为零，却超出预算
- **“最优点必须有零目标梯度。”** 有约束时，允许方向才决定能不能改进；主例梯度由约束法向量平衡
- **“约束取等号，乘子就一定大于零。”** $B=5$ 的预算约束和 $B=1$ 的 $y$ 下界都是反例
- **“解唯一，证书也唯一。”** $B=0$ 的原点唯一，但存在无穷多组合法乘子
- **“惩罚很大，硬限制就落实了。”** 先算实际违规量；本页任何有限 $\rho$ 都仍超预算
- **“数学约束自动保证系统安全。”** 证明只覆盖模型中写出的约束和目标；未建模的需求、测量误差与部署行为没有因此得到保证

**练习 1：换成不对称且含负数的目标。** 目标为 $(-1,4)$，预算为 2，求投影、证书与最优值。

答案：非负截断 $(0,4)$ 超预算，斜边候选落在 $x<0$，故投影为 $(0,2)$。可取 $(\lambda,\alpha,\beta)=(2,3,0)$；驻点式为 $0-(-1)+2-3=0$、$2-4+2=0$。最优值为 $(1+4)/2=5/2$。

**练习 2：用证书判断一个可行备选点。** 主例取 $z=(0,3)$，计算目标差，并用第 4 节恒等式复核。

答案：$f(0,3)=5$，与最优值 1 相差 4。预算余量为零，距离项为 $[(-2)^2+2^2]/2=4$，两种算法一致。

**练习 3：给零预算再造一份证书。** 仍用目标 $(3,2)$、$B=0$，把预算乘子改成 4，应如何选其余乘子？最优点改变吗？

答案：取 $\alpha=1,\beta=2$；驻点式分别为 $-3+4-1=0$ 与 $-2+4-2=0$，互补关系成立。可行域仍只有 $(0,0)$，最优点不变。

**练习 4：很小的违规仍然是违规。** 在第 7 节的固定惩罚问题中，要让超预算量不超过 $1/100$，$\rho$ 至少多少？这是否保证严格可行？

答案：$2/(1+2\rho)\le1/100$ 等价于 $\rho\ge199/2$。在等号处仍超预算 $1/100$；对任意有限 $\rho$ 都有正违规量。允许容差是一种额外的业务规则，不能把它说成原硬约束已经满足。

**练习 5：判断一步更新的前提。** 若目标改为 $\widetilde f(w)=\|w-t\|_2^2$，仍取 $\eta=1$，投影前还必定等于 $t$ 吗？

答案：不再必定成立。新梯度为 $2(w-t)$，投影前为 $2t-w$；若取 $\eta=1/2$ 才恢复本例的抵消关系。只是把目标整体乘 2，就已经改变这个一步结论所需的步长。

## 来源与阅读路径

- [Boyd 与 Vandenberghe，Convex Optimization](https://www.seas.ucla.edu/~vandenbe/cvxbook/bv_cvxbook.pdf)，2004 年教材，第七次印刷修正版（2009）；链接为共同作者 UCLA 站点提供的 PDF，[Stanford 同书入口](https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf) 亦可查阅。定位：§4.1.1–4.1.2 的问题表述；§5.2.3、式 (5.26)–(5.27)、印刷页 226–227 的严格与精化 Slater 条件；§5.5.3、印刷页 243–244 的 KKT 条件及凸充分性。本页数值例子、分支公式与平方差证明为本地构造和推导
- [Gabriele Farina，MIT 6.7220/15.084，Lecture 14](https://ocw.mit.edu/courses/6-7220j-nonlinear-optimization-spring-2025/mit6_7220_s25_lec14.pdf)，2025 年春课程材料；§L14.1、印刷页 1、式 (1) 用于核对投影梯度更新。讲义本身注明没有经过正式同行评审

来源核对日期：2026-10-05。MIT PDF 正文可访问；Stanford 完整 PDF 直接抓取超时，本次通过共同作者 UCLA 站点的 PDF 核对了上述相关章节，未声称通读全书。继续读[正则化](?view=garden&scope=branch:llm:training/budget/regularization)，区分“改变目标”与“改变允许集合”；或回到[训练循环](?view=garden&scope=branch:llm:training/loop)，检查目标、梯度与步长之间的关系。本页不是通用非凸优化、完整对偶理论或训练效果保证。
