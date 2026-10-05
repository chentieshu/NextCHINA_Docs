> **本页解决的问题**：屏幕显示的 `0.1` 为什么不一定是精确的十分之一？当 `0.1 + 0.2` 显示为 `0.30000000000000004`，怎样分别核算输入表示、加法舍入和显示的作用，再决定怎样比较结果？
>
> 前置知识：分数、2 的幂、四则运算和基础 Python。输入是一小组已经存下的有限浮点数，以及明确写出的理想值与验收容差；输出是可复核的误差账单。本页只讲浮点数基础，不替代数值稳定算法、导数、向量矩阵或概率课程。

## 1. 同一个“0.1”，先分清四层

写下“十分之一”时，我们可能指四件不同的事：

1. **意图中的精确数**：有理数 $1/10$，在程序中可以明确写成 `Fraction(1, 10)`
2. **已经存下的数**：`a = 0.1` 得到的二进制浮点值，用 `Fraction.from_float(a)` 查看它的精确分数
3. **某一步运算的结果**：`a + b` 把已有输入相加，再舍入到一个可表示的浮点数
4. **显示的文本**：`repr(a)` 或 `format(a, '.17g')` 生成字符串，供人阅读

从浮点数构造 `Fraction` 得到的是第二层，不会自动猜回第一层。Python 文档也特别区分 `Fraction.from_float(0.3)` 与 `Fraction(3, 10)`。[Python 3.14，fractions：from_float](https://docs.python.org/3.14/library/fractions.html)

本文的固定数值结论有一个共同前提：`float` 使用 **binary64 的数值格式、53 位二进制有效精度、最近偶数舍入**，所示每一步确实按这一精度执行。“最近偶数”是先选择最近的可表示值，恰在中点时选择有效数字末位为偶数的那个。不是把所有小数都舍成偶数整数。

实验会检查格式信息并做运行时探针。通过这些有限检查，只说明满足本实验检查的条件，不是对整个解释器、数学库或硬件的 IEEE 符合性认证。

## 2. 刻度有限，而且间距会随大小改变

二进制小数每一位代表 $1/2,1/4,1/8,\ldots$。例如：

$$
0.125=\frac18=0.001_2
$$

它能用有限位表示；本页涉及的数值范围也足够，因此 `0.125` 可以精确存下。最简分数的分母若还含有 2 以外的质因子，就没有有限二进制展开。$1/10$ 的分母含 5，所以只能取近似值。**有有限二进制展开仍不等于必能放进 binary64**：还要满足有效位数和指数范围。[Python 3.14 浮点教程，§15、§15.1](https://docs.python.org/3.14/tutorial/floatingpoint.html)

正规数可以看作“固定长度的有效数字 × 2 的某次幂”。指数让范围很广，却没有给每个量级同样细的刻度。先记住这个直觉：越大的正规数，通常相邻刻度越远。有限值也未必是原始输入的精确值。

表示精度和可用范围是两种不同的限制；Goldberg 分别讨论了不能精确表示的数与超出范围的数。[Goldberg，Rounding Error / Floating-point Formats](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)

## 3. 给 0.1 + 0.2 做一张精确账单

以下大写字母表示精确分数，小写字母表示程序里的浮点变量。令 `a = 0.1`、`b = 0.2`、`c = a + b`，并单独声明理想和 $T=3/10$。

### 3.1 输入已经发生了近似

记 $m=3602879701896397$，那么两个存储值是：

$$
A=\frac{m}{2^{55}}
$$

$$
B=\frac{m}{2^{54}}
$$

可独立核对 $A$ 的来历：在这个量级，用分母 $2^{56}$ 的网格逼近 $1/10$。整数除法给出：

$$
2^{56}=10q+6
$$

其中 $q=7205759403792793$。余数 6 超过半个分母 10，所以选择 $q+1$；约分后正是 $A=m/2^{55}$。$1/5$ 的情况只是指数增加一位，得到 $B$。这与教程 §15.1 的表示分析一致，但下面的各项误差可直接用整数和分数重算。[Python 3.14 浮点教程，Representation Error](https://docs.python.org/3.14/tutorial/floatingpoint.html)

输入的两笔有符号误差分别是：

$$
A-\frac1{10}=\frac1{5\cdot2^{55}}
$$

$$
B-\frac15=\frac1{5\cdot2^{54}}
$$

两者都略偏大。先把存储值精确相加，尚不做新的浮点舍入：

$$
S=A+B=\frac{10808639105689191}{2^{55}}
$$

因此输入表示误差为：

$$
E_{\mathrm{in}}=S-T
=\frac3{180143985094819840}
$$

### 3.2 加法还会产生自己的一笔舍入

$S$ 恰好处在相邻两个可表示数的中点。用共同分母 $2^{54}$ 写出两端：

$$
L=\frac{5404319552844595}{2^{54}}
$$

$$
U=\frac{5404319552844596}{2^{54}}
$$

上端的有效整数是偶数，所以最近偶数舍入选择 $U$。程序得到的 `c` 精确值为：

$$
C=U=\frac{1351079888211149}{2^{52}}
$$

这一步相对于已有输入之和的误差是：

$$
E_{\mathrm{op}}=C-S
=\frac1{36028797018963968}
$$

总误差则必须相对于原先声明的理想和计算：

$$
E_{\mathrm{total}}=C-T
=\frac1{22517998136852480}
$$

可检查的分账恒等式是：

$$
E_{\mathrm{total}}
=E_{\mathrm{in}}+E_{\mathrm{op}}
$$

这三个数分别约为 $1.67\times10^{-17}$、$2.78\times10^{-17}$、$4.44\times10^{-17}$。近似小数帮助感知大小，精确分数才是本例的核对依据。

### 3.3 与 float(0.3) 比较，是另一个问题

令 `d = 0.3`，它的存储值恰好是上面的 $L$：

$$
D=\frac{5404319552844595}{2^{54}}
$$

所以 `c - d` 在本例中精确等于：

$$
C-D=\frac1{18014398509481984}
$$

它与 $C-T$ 不同。一个是在比较两个存储值，一个是在计算结果相对理想 $3/10$ 的误差。只看到 `c != d`，还没有完成误差归因。

### 3.4 显示可以换，已经存下的数没有换

在实测环境中，`repr(a)` 是 `0.1`，`format(a, '.17g')` 是 `0.10000000000000001`；两种字符串重新转为 `float` 都得到同一个 $A$。显示更多位没有创造更多计算精度；显示为 `0.1` 也不证明内部是精确的 $1/10$。[Python 3.14 浮点教程，短 repr 与显示舍入](https://docs.python.org/3.14/tutorial/floatingpoint.html)

`format(c, '.1f')` 只生成文本 `0.3`。`round(c, 1)` 则产生另一个数值，在本例中等于 `d`，依然不等于精确 $3/10$。而预先执行 `round(a, 1) + round(b, 1)` 仍不等于 `round(d, 1)`。因此显示、数值舍入、恢复原始信息是三件事。

## 4. 顺序能改变结果，减法不一定是肇事者

令 `Q = float(2**53)`，这里的 $Q$、$1$、$-Q$ 都能精确存下。数学上的总和是 1，没有输入表示误差。

在 $Q$ 上方，下一刻度是 $Q+2$，所以 $Q+1$ 位于中点，最近偶数舍入回 $Q$。于是：

$$
\operatorname{fl}(Q+1)=Q
$$

$$
\operatorname{fl}(Q-Q)=0
$$

显式顺序循环处理 `[Q, 1.0, -Q]`，最终得到 `0.0`。丢掉 1 的是前一步加法；后一步相减对它实际收到的两个数是精确的。

换成 `[Q, -Q, 1.0]`，先精确抵消成零，再加 1，结果就是 `1.0`。改变括号也能看到区别：`(Q + 1.0) + (-Q)` 为零，`Q + (1.0 - Q)` 为一。后一式中 $Q-1$ 仍可表示，因为 $Q$ 下方的间距是 1；不能把上方间距 2 误用到两侧。

这说明浮点加法一般不满足结合律。消去可能让此前已有的误差在小结果中变得显眼，却不意味着每次相减都不稳定。Goldberg 的 Cancellation 一节明确区分恶性与良性消去，并给出减法暴露早先误差的例子。[Goldberg，Cancellation](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)

也有直接使用等号完全正确的例子：`0.125 + 0.25 == 0.375` 为真。三个值和这一步结果都精确可表示。等号适合问“两个存储值是否相等”；是否允许近似差别，要看任务。

## 5. fsum 能改进哪一层？

`math.fsum` 跟踪多个部分和，减少求和过程的信息损失。文档同时说明其精度依赖算术与舍入条件，某些构建的扩展精度中间计算可能发生二次舍入。因此不能承诺所有环境、所有输入都无条件正确舍入。[Python 3.14，math.fsum](https://docs.python.org/3.14/library/math.html)

对本实验的 `[Q, 1.0, -Q]`，`fsum` 得到 `1.0`，相对存储输入精确和的误差为零。但它没有收到“用户原来想输入什么”的额外信息。看另一个列表 `[0.1, 0.2, -0.3]`：

$$
A+B-D=\frac1{2^{55}}
$$

实测 `fsum` 返回的正是这个非零数；顺序循环返回 $1/2^{54}$。如果先验意图是 $1/10+1/5-3/10=0$，偏差在输入变成浮点数时已经存在。`fsum` 没有把那三个十进制意图恢复回来。

这里故意实现显式循环，而不把内置 `sum` 当作朴素累加的同义词。**Python 3.12 已更换浮点求和算法**，官方说明它在多数构建上提高精度；旧版本记忆中的失败输出不是跨版本事实。[Python 3.12，sum 的版本变更](https://docs.python.org/3.12/library/functions.html#sum)

## 6. ULP、epsilon 和容差不是同一个量

**绝对误差**是近似值与参考值差的绝对值；**相对误差**再除以参考值的绝对值，参考值为零时不能这样定义。**ULP** 则以浮点网格的局部刻度衡量大小。它们回答不同的问题。[Goldberg，Relative Error and Ulps](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)

在本页格式下：

$$
\operatorname{ulp}(1.0)=2^{-52}
$$

$$
\operatorname{ulp}(2^{53})=2
$$

Python 的 `sys.float_info.epsilon` 特指 1.0 与它上方相邻值的差，这里是 $2^{-52}$。`math.ulp(x)` 会随数值改变；在最大有限数和零处还各有定义，不能一律理解为到正无穷方向下一数的距离。[Python 3.14，sys.float_info](https://docs.python.org/3.14/library/sys.html)；[Python 3.14，math.ulp](https://docs.python.org/3.14/library/math.html)

常见单步误差模型把 $u=2^{-53}$ 称为单位舍入误差。若精确结果处在正规数范围、没有上溢或下溢，并且该步按最近值正确舍入，可以写成：

$$
\operatorname{fl}(z)=z(1+\delta)
$$

$$
|\delta|\le u
$$

这是有条件的**单步**模型，不是整个程序的误差保证。还要区分术语：Goldberg 文中的 machine epsilon 采用舍入误差界的约定；Python `float_info.epsilon` 采用 1.0 上方间距的约定。本页显式写 $u$ 和数值，避免把二者混为一谈。上述两种量都不是可复制到所有任务里的验收容差。

### 接近零时，先说清允许多大的绝对差

对有限数，`math.isclose` 的文档判据可拆成两行：

$$
M=\max(|a|,|b|)
$$

$$
|a-b|\le\max(rM,t)
$$

其中 $r$ 是 `rel_tol`，没有单位；$t$ 是 `abs_tol`，与输入同单位。它取两个预算中较大的一个，并非把两项相加。[Python 3.14，math.isclose](https://docs.python.org/3.14/library/math.html)

对本例的 `c` 和 `d`，设定相对验收预算 `1e-15`、绝对预算 `0.0`，结果为真：已知差约为 $5.55\times10^{-17}$，小于约 $3\times10^{-16}$ 的允许差。这只表示这对输入通过了这个明示标准，不表示二者精确相等。

改问残差 `r = c - d` 是否接近零，只有同样的相对容差时，结果为假。对于这里的普通尺度，阈值随残差一起缩小，无法表示“允许这么大的零附近噪声”。如果我们把此练习的**绝对验收预算预先定为 $10^{-16}$**，已有精确账单说明残差小于它，于是通过；`1e-12` 则仍应被拒绝。这个教学预算不能带到不同函数、单位、数据噪声或误差传播过程里。[PEP 485，Behavior near zero / Absolute tolerance default](https://peps.python.org/pep-0485/)

程序中的容差乘法与差值本身也用浮点计算，极端边界仍会舍入。核对精确边界时，可以先选择差值与阈值乘法都精确可表示的案例；不要据此推断所有极端输入的程序结果都与精确分数判据一致。

选择标准时依次问：参考对象是理想值还是另一计算结果？允许误差来自测量、算法分析还是业务要求？单位和数量级是什么？先回答这些，再设置阈值，不要为了让测试变绿才反复加大容差。

## 7. 边界必须写进合同

在本页 binary64 前提下，最大有限数是 `sys.float_info.max`；最小正**正规数**是 $2^{-1022}$，它不是最小正浮点数。子正规数继续填充更靠近零的区域，最小正子正规数为 $2^{-1074}$，即 `math.ulp(0.0)`。[Python 3.14，sys.float_info.min / max](https://docs.python.org/3.14/library/sys.html)；[math.ulp](https://docs.python.org/3.14/library/math.html)

- **上溢**：本环境中最大有限数再加自身得到 `inf`。所有输入有限，不保证中间结果有限。`[最大值, 最大值, -最大值]` 的精确总和虽然有限，顺序循环仍会先溢出
- **下溢边界**：最小正子正规数除以 2，最近偶数舍入为正零。该步相对误差为 1，不能套用正规数的 $u$ 界
- **正负零**：`+0.0 == -0.0` 为真，但符号可用 `math.copysign` 区分。本实验接受二者；验证单个值时保留原值。求和从正零开始，`Fraction` 也只有一个有理数零，因此审计不承诺保留零的符号
- **NaN 与无穷**：原生 `math.isclose` 不把 NaN 视为接近任何值；无穷只与同号无穷接近。本文接口一律拒绝非有限数，是为了把账单限定为有限有理数，不是说这些特殊值在浮点体系中不合法。[Python 3.14，math 的 isclose / copysign / nan](https://docs.python.org/3.14/library/math.html)

`fsum` 也不是“只要输入有限就成功”。本次运行中，它对 `[最大值, 最大值, -最大值]` 抛出 `OverflowError`。还有单独的错误路径：令 `h = math.ldexp(1.0, 969)`，浮点列表 `[最大值, h, h]` 的顺序加法把两次小增量分别舍掉，仍然有限；`fsum` 则溢出。下方接口明确拒绝这些情况，不默默重排、不钳位到最大值，也不把失败解释成原数学和不存在。

## 8. 可运行实验：审核存储值，不猜测原始意图

仅用 Python 3.9+ 标准库；这里只有一个计算单元。实际完成运行的是同一 x86_64 环境中的 **CPython 3.12.14（Clang 22.1.3）与 CPython 3.13.5（GCC 14.2.0）**。阅读的 3.14 文档不等于实测了 3.14；3.9、3.11、3.14、其他 CPU、PyPy、GPU 和 BLAS 均未测试。

平台检查不合适时抛出 `RuntimeError`，不会静默跳过再宣布通过。`sys.float_info.rounds` 反映解释器启动时的信息，`1` 只表示最近舍入，不能单独证明中点取偶或之后所有运算的模式；代码另外在运行时变量上检查中点与子正规数，避免用可能被常量折叠的表达式代替探针。[Python 3.14，float_info.rounds](https://docs.python.org/3.14/library/sys.html)

四个函数的合同刻意很小：

- `finite_float(x)`：只收**内置且有限的 float**，原值返回。拒绝整数、布尔值、字符串、Fraction、Decimal、float 子类及其他对象，不做隐藏转换；接受有限子正规数和正负零
- `sequential_sum(values)`：只收长度 1–32 的内置列表或元组，从 `0.0` 按输入顺序逐项加。所有项和中间结果必须有限，返回一个 float；32 是教学上限，不是数值定理
- `sum_audit(values)`：同样验证输入，返回字典。`exact_stored_sum` 是存储输入的精确 Fraction 和；`sequential`、`fsum` 是两种浮点结果；`sequential_error`、`fsum_error` 是“结果减精确存储和”的有符号 Fraction 误差。循环先溢出时整次拒绝；不会因为另一求和方式可能成功就部分返回
- `within_tolerance(a, b, *, rel_tol, abs_tol)`：四个值都须为有限内置 float，明确传入两个容差，要求 $0\le r<1$、$t\ge0$，返回布尔值。这是本页比原生库更窄的教学政策，不声称所有 Python 版本都按这份拒绝合同实现 `math.isclose`

参数值无效或求和超出合同统一抛 `ValueError`，包括捕获到的 `fsum` 求和异常与非有限结果；缺少必需参数等 Python 调用语法错误仍遵循语言自己的规则。它不是面向任意类型、任意长度、所有舍入模式的通用数值库。

```python
# nextchina-example: floating-point-rounding
import math
import platform
import sys
from fractions import Fraction


def _require_binary64():
    """Check this lesson's assumptions, not universal IEEE conformance."""
    if sys.version_info < (3, 9):
        raise RuntimeError("This lesson needs Python 3.9 or later")
    info = sys.float_info
    shape = (info.radix, info.mant_dig, info.max_exp,
             info.min_exp, info.rounds)
    if shape != (2, 53, 1024, -1021, 1):
        raise RuntimeError("Unsupported float format or startup rounding mode")
    one = 1.0
    two = 2.0
    zero = 0.0
    half_ulp = math.ldexp(one, -53)
    next_one = math.nextafter(one, math.inf)
    tiny = math.ulp(zero)
    big = float(2**53)
    try:
        probes = (
            info.epsilon == math.ldexp(one, -52),
            info.min == math.ldexp(one, -1022),
            one + half_ulp == one,
            next_one + half_ulp == math.nextafter(next_one, math.inf),
            big + one == big,
            big - one == float(2**53 - 1),
            Fraction.from_float(tiny) == Fraction(1, 2**1074),
            tiny / two == zero,
            tiny * two == math.nextafter(tiny, math.inf),
            math.copysign(one, -zero) == -one,
            math.isinf(info.max + info.max),
        )
    except (ArithmeticError, ValueError) as exc:
        raise RuntimeError("Unsupported arithmetic behavior") from exc
    if not all(probes):
        raise RuntimeError("Required nearest-even/subnormal probes failed")


def finite_float(x):
    """Return a finite builtin float; do not silently convert inputs."""
    if type(x) is not float or not math.isfinite(x):
        raise ValueError("Expected a finite builtin float")
    return x


def _values(values):
    if type(values) not in (list, tuple) or not 1 <= len(values) <= 32:
        raise ValueError("Expected a builtin list/tuple of length 1..32")
    return tuple(finite_float(x) for x in values)


def sequential_sum(values):
    """Add in the given order from +0.0; reject nonfinite intermediates."""
    xs = _values(values)
    total = 0.0
    for x in xs:
        total = total + x
        if not math.isfinite(total):
            raise ValueError("Sequential intermediate is not finite")
    return total


def sum_audit(values):
    """Compare two sums with the exact rational sum of STORED inputs."""
    xs = _values(values)
    exact = Fraction(0)
    for x in xs:
        exact += Fraction.from_float(x)
    sequential = sequential_sum(xs)
    try:
        accurate = math.fsum(xs)
    except (OverflowError, ValueError) as exc:
        raise ValueError("fsum cannot produce this lesson's result") from exc
    if not math.isfinite(accurate):
        raise ValueError("fsum result is not finite")
    return {
        "exact_stored_sum": exact,
        "sequential": sequential,
        "fsum": accurate,
        "sequential_error": Fraction.from_float(sequential) - exact,
        "fsum_error": Fraction.from_float(accurate) - exact,
    }


def within_tolerance(a, b, *, rel_tol, abs_tol):
    """Teaching policy: finite floats, 0 <= rel_tol < 1, abs_tol >= 0."""
    a, b = finite_float(a), finite_float(b)
    rel_tol, abs_tol = finite_float(rel_tol), finite_float(abs_tol)
    if not 0.0 <= rel_tol < 1.0 or abs_tol < 0.0:
        raise ValueError("Need 0 <= rel_tol < 1 and abs_tol >= 0")
    return math.isclose(a, b, rel_tol=rel_tol, abs_tol=abs_tol)


_require_binary64()
a, b, target = 0.1, 0.2, 0.3
result = a + b
A = Fraction.from_float(a)
B = Fraction.from_float(b)
C = Fraction.from_float(result)
D = Fraction.from_float(target)
ideal = Fraction(3, 10)
representation_error = A + B - ideal
operation_error = C - (A + B)
total_error = C - ideal
assert total_error == representation_error + operation_error

big = float(2**53)
order_a = sum_audit([big, 1.0, -big])
order_b = sum_audit([big, -big, 1.0])
decimal_residual = sum_audit([a, b, -target])
dyadic_residual = sum_audit([0.125, 0.25, -0.375])
residual = result - target
relative_only = within_tolerance(
    residual, 0.0, rel_tol=1e-15, abs_tol=0.0)
absolute_budget = within_tolerance(
    residual, 0.0, rel_tol=0.0, abs_tol=1e-16)

print("Runtime:", platform.python_implementation(), platform.python_version())
print("Stored 0.1:", A)
print("Display:", repr(a), format(a, ".17g"))
print("Representation error:", representation_error)
print("Addition rounding error:", operation_error)
print("Total error:", total_error)
print("Compared with float(0.3):", C - D)
print("Orders:", order_a["sequential"], order_b["sequential"])
print("fsum of stored decimals:", decimal_residual["fsum"])
print("Exact dyadic residual:", dyadic_residual["exact_stored_sum"])
print("Near zero:", relative_only, absolute_budget)
```

程序输出中的三项误差应与 §3 的分数一致。`Orders` 的两个值应为 `0.0` 与 `1.0`；`Near zero` 应为 `False` 与 `True`。运行时版本行只是诊断信息。要检验算法，应检查分数、结果和拒绝路径，不把整段标准输出的字节当作真值。

审计器本身不接收理想值，是有意为之：任意传入 `0.1`，程序并不知道它来自十进制录入、前一次计算还是测量。主例能计算输入误差，是因为我们额外、明确地给出了 $1/10$、$1/5$ 和 $3/10$。

## 9. 练习：用账单解释，而不只报 True / False

1. 保持代码里的 `result`（即前文的 `c`）不变，在代码运行后分别执行 `format(result, '.17g')` 和 `format(result, '.1f')`。四层中的哪一层改变了？总误差有没有改变？
2. 把 `[Q, 1.0, -Q]` 改成 `[Q, -Q, 1.0]`，逐步列出循环收到的两个输入。哪一步丢了 1？为什么不能总结成“相减都危险”？
3. 某残差以米为单位，绝对验收预算为 $10^{-6}$ 米。改用毫米时，数值和 `abs_tol` 各如何改变？相对容差是否需要乘 1000？
4. 对 `[0.1, 0.2, -0.3]`，`fsum` 给出非零值。若要求精确十进制恒等式，应先改变输入表示，还是对输出执行 `round` 就足够？说清需要保留哪一层的信息。

**参考解析**：第一题只改显示文本，$C$ 和 $C-T$ 都不变。第二题的原顺序先把 $Q+1$ 舍入回 $Q$；新顺序先精确得到零，所以保留了最后的 1。第三题两者都乘 1000，绝对预算变成 $10^{-3}$ 毫米；相对容差无单位而不变。实际单位换算若也使用浮点运算，仍要计入它带来的舍入。第四题应在信息丢失前明确输入意图，例如从整数比构造 Fraction；显示或事后舍入不能反推唯一原始值，也没有修复整个算法的普遍保证。

继续阅读时，把这张账单带到已有单元：

- [Softmax 与温度](?view=garden&scope=branch:llm:math/softmax)：理解为什么代数等价的指数归一化写法可能具有不同的溢出风险
- [导数、链式法则与自动微分](?view=garden&scope=branch:llm:math/derivatives)：解释有限差分中为什么过小扰动会消失，为什么要同时检查尺度与误差
- [向量与张量形状](?view=garden&scope=branch:llm:math/tensor-shapes)：把有限输入验证和求和审计用于理解已有向量计算例子

这些是应用与延伸阅读，不是本页新增的概念覆盖。本文仍待独立内容复核；有限测试通过不等于专家认证、跨平台保证或全部数值算法的正确性证明。

## 来源、版本与核验范围

访问日期为 **2026-10-05 UTC**。以下是实际读到的官方页面版本，不能与本地运行版本混为一谈。

1. [Python 3.14 浮点教程](https://docs.python.org/3.14/tutorial/floatingpoint.html)：页面显示 3.14.8，§15 与 §15.1。用于表示、短 repr 和精确比例；其中“多数平台”表述不作为所有 Python 实现的保证
2. [Python 3.14 fractions](https://docs.python.org/3.14/library/fractions.html)：页面显示 3.14.8，Fraction / from_float。代码未使用 3.14 新增构造接口
3. [Python 3.14 math](https://docs.python.org/3.14/library/math.html)：页面显示 3.14.8，fsum、isclose、ulp、nextafter、copysign、nan。以 API 页的限制为准，不把教程中的求和简述扩大成无条件精度保证；代码只用 3.9 已有的 nextafter 双参数形式
4. [Python 3.14 sys](https://docs.python.org/3.14/library/sys.html)：页面显示 3.14.8，float_info / rounds。格式信息与有限探针不能证明整个运行环境符合某标准
5. [Python 3.12 sum](https://docs.python.org/3.12/library/functions.html#sum)：页面显示 3.12.15，Changed in version 3.12。只用于确认实现有版本变化，不把文档版本当作本地安装版本
6. [PEP 485](https://peps.python.org/pep-0485/)：面向 Python 3.5 的设计提案，Behavior near zero、Absolute tolerance default、Symmetry。用于比较问题的设计动机；本页接口合同与实际测试另行声明
7. [David Goldberg，What Every Computer Scientist Should Know About Floating-Point Arithmetic](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html)：Oracle 托管、获许可的 1991 年 3 月 Computing Surveys 论文编辑重印，阅读 Rounding Error、Relative Error and Ulps、Cancellation 等文字段落。它不是最新 IEEE 标准全文；网页有图片公式，本文不依赖未解读图片的定理，也不声称审阅了原出版版全部附录
