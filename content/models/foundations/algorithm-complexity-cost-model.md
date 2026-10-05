> **本页解决的问题**：在同一份有序数据里找插入位置，为什么一种方法逐个看，另一种方法只看几个中点？“二分查找是 $O(\log n)$”究竟数了什么，又漏掉了哪些必须付出的成本？
>
> 前置知识：整数、数组下标、不等式和 2 的幂。核心实验输入一份已经检查过的有序整数序列和一个目标值，输出插入位置与精确的关键比较次数。平均成本另需知道加权平均；可以先读已有的[概率与条件分布](?view=garden&scope=branch:llm:math/probability)。

## 1. 先固定任务，再比较成本

设有序数组为 $a$，长度为 $n$，下标从 0 开始。给定目标值 $x$，我们要找 **第一个满足 $a[i]\ge x$ 的位置**；若不存在，返回 $n$。这叫下界位置（lower bound）。返回值 $r$ 必须满足：

$$
0\le r\le n
$$

$$
i<r\Rightarrow a[i]<x
$$

$$
i\ge r\Rightarrow a[i]\ge x
$$

后两行只谈数组中有效的下标。这与 Python `bisect_left` 文档的分区合同一致；这里会自己写算法，以便数清比较次数。[Python 3.14，bisect_left](https://docs.python.org/3.14/library/bisect.html)

例如 $a=(2,4,4,4,8)$：

- 查 $4$ 得到 $r=1$，而不是任意一个等于 4 的位置
- 查 $5$ 得到 $r=4$，尽管数组中没有 5
- 查 $9$ 得到 $r=5$，这是数组末尾之后的插入位置
- 空数组的结果始终是 0

**找到插入位置不等于找到相等元素。** 如果任务改成“是否包含 $x$”，还要检查 $r<n$ 且 $a[r]=x$；这项检查不在本页的返回合同里。比较两种算法前，必须先保证它们完成的是同一个任务。

## 2. 一次“操作”不是一纳秒

本页先只数搜索核心里每次 `a[i] < target` 的求值，称为**关键比较次数** $C(a,x)$。不把循环条件、下标加法、准备输入、分配内存或打印混进这个计数器。它们仍然有成本，只是要在另一张账单里核算。

这样的选择叫成本模型：先说明基本操作是什么，再数它发生几次。换成“读了多少字节”或“做了多少次远程请求”，可能得到另一种分析。[Sedgewick / Wayne，Algorithms 4e，§1.4 Cost model](https://algs4.cs.princeton.edu/14analysis/)

为了进一步讨论时间和空间的增长，本页采用简化的字长 RAM 模型：数组能按下标常数时间访问，键、下标和计数器装得进固定数量的机器字，基本字操作记为常数成本；空间按字数计。研究更大的 $n$ 时，字长也必须足以表示下标。这不是说真实机器有无限内存。[Open Data Structures，§1.4](https://opendatastructures.org/ods-python/1_4_Model_Computation.html)

因此，“4 次关键比较”不等于“4 条 CPU 指令”，也不能换算成固定的毫秒。解释器、缓存、分支预测、数据搬运和运行环境都会影响实测时间。如果键变成很长的整数或字符串，一次比较还可能依赖其位数或长度；就要增加那个规模变量，不能继续默认常数成本。[MIT 6.006，2011 Lecture 2，pp. 1–4](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6b9b20992d8c6a0f3f10a34ff7878aa9_MIT6_006F11_lec02.pdf)

## 3. O、Ω、Θ 说的是界；最好、最坏说的是输入

先选好一个非负成本函数 $f(n)$，再谈它的渐近增长。

- $f(n)=O(g(n))$：存在常数 $c>0$ 和门槛 $n_0$，使所有 $n\ge n_0$ 都有 $f(n)\le c g(n)$。这是最终成立的**上界**
- $f(n)=\Omega(g(n))$：存在常数 $c>0$ 和门槛 $n_0$，使所有 $n\ge n_0$ 都有 $f(n)\ge c g(n)$。这是最终成立的**下界**
- $f(n)=\Theta(g(n))$：上下界都成立，表示**同阶的紧界**，仍未给出精确次数或常数系数

这里的等号是常用简写，不是说 $O(g(n))$ 是一个普通数值。这三个定义可参照 [MIT 6.006，2020 Recitation 1，p. 3](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/c6d8f06c6f11e3342633dec85498f551_MIT6_006S20_r01.pdf)。

例如 $f(n)=3n+2$，当 $n\ge1$ 时有 $3n\le f(n)\le5n$，所以它是 $\Theta(n)$；它也属于 $O(n^2)$，只是后者更松。看到“甲是 $O(n)$，乙是 $O(n^2)$”，若只有这两个上界，不能断定乙一定增长更快，因为乙也可能只有常数成本。对于小规模，紧界本身也不会告诉你哪段真实代码更快。

**最好、最坏、平均是另一层选择。** 对长度为 $n$ 的合法输入族 $\mathcal I_n$，可以先定义：

$$
C_{\mathrm{best}}(n)=\min_{(a,x)\in\mathcal I_n} C(a,x)
$$

$$
C_{\mathrm{worst}}(n)=\max_{(a,x)\in\mathcal I_n} C(a,x)
$$

若另给定这个输入族上的概率分布 $P_n$，才定义 $C_{\mathrm{avg}}(n)=\mathbb E_{P_n}[C(a,x)]$。随后可以给这三个函数分别写 $O$、$\Omega$ 或 $\Theta$。**$O$ 不等于最坏情况，$\Omega$ 不等于最好情况，$\Theta$ 也不等于平均情况。** 本文算法没有随机步骤；平均值的随机性只来自明确规定的查询分布。

## 4. 两种搜索，怎样保证同一个答案？

### 逐个查：已走过的前缀都小于目标

从下标 0 开始，依次判断 $a[i]<x$。第一次不成立就返回 $i$；如果全部成立就返回 $n$。由于数组有序，停止时右边也不会再出现小于 $x$ 的元素。

把最终位置记为 $r$。当 $r<n$ 时，前 $r$ 次比较为真，再做一次为假的比较；当 $r=n$ 时，只做 $n$ 次比较。因此精确计数为：

$$
C_{\mathrm{linear}}(n,r)=\min(r+1,n)
$$

这个公式也覆盖空数组：$n=r=0$ 时成本为 0。非空输入族的最好次数为 1，最坏次数为 $n$，分别是 $\Theta(1)$ 与 $\Theta(n)$。

### 二分查：保留还没确定的半开区间

维护元素下标区间 $[\mathrm{lo},\mathrm{hi})$，初始为 $[0,n)$。循环保持两件事：`lo` 左边的元素都小于目标；`hi` 及其右边的元素都大于或等于目标。因此答案位置一定在闭区间 $[\mathrm{lo},\mathrm{hi}]$ 内。

取整数中点 $\mathrm{mid}=\lfloor(\mathrm{lo}+\mathrm{hi})/2\rfloor$：

1. 若 $a[\mathrm{mid}]<x$，中点及其左边都不可能是答案，把 `lo` 改成 `mid + 1`
2. 否则，中点可能就是答案，把 `hi` 改成 `mid`，继续检查左侧

相等时也走第二条路，所以不会提前返回后面的重复值。每步都缩小区间；`lo == hi` 时，两条分区条件一起确定了唯一答案。

这里用**迭代和下标边界**，没有递归地复制切片。若每次把半个列表切出来，搬运元素也要付费，不能只数那几次比较就把整段程序称为对数时间。MIT 的 Python 成本讨论明确把切片复制列为随长度增长的工作。[MIT 6.006，2011 Lecture 2，p. 4](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6b9b20992d8c6a0f3f10a34ff7878aa9_MIT6_006F11_lec02.pdf)

### 为什么出现 log？精确次数又是多少？

共有 $n+1$ 个可能的插入位置。每次真假比较把这些候选分成两组；中点选择让两组尽可能接近。连续缩小约一半，所需层数就与 $\log_2(n+1)$ 同阶。[Open Data Structures，§1.3.1](https://opendatastructures.org/ods-python/1_3_Mathematical_Background.html)

更精确地，令 $D(n)$ 按秩 $r=0,\ldots,n$ 列出此实现的比较次数。空数组有一个答案且不用比较，所以 $D(0)=[0]$。令 $m=\lfloor n/2\rfloor$，则：

$$
D(n)=(1+D(m))\;\Vert\;(1+D(n-m-1))
$$

这里 $1+D$ 表示给列表中每项加 1，$\Vert$ 表示拼接。左组有 $m+1$ 个候选位置，右组有 $n-m$ 个，每组都先付一次中点比较。这是按**答案位置构造决策树**，不是重新执行查找代码。

由这个平衡树可得：所有位置的深度只在 $\lfloor\log_2(n+1)\rfloor$ 与 $\lceil\log_2(n+1)\rceil$ 两层。最好和最坏比较次数分别取这两个值；这里的极值遍历同长度的合法输入族，允许选用不同元素和目标来实现相应位置。某一份有重复值的固定数组未必能实现全部秩。

所以此**不在相等处提前结束的下界搜索**，最好和最坏都是 $\Theta(\log(n+1))$（讨论 $n\ge1$）。不要套用“二分搜索碰巧在中点找到相等值，所以最好一次”的另一个程序合同。空数组单独返回零次。最坏次数还可以精确写成整数 `n.bit_length()`，免去浮点对数在 2 的幂附近的舍入问题。

## 5. 八个数的完整账单，和一个明示的平均分布

固定 $a=(2,4,6,8,10,12,14,16)$。只考虑下表九个目标，每个都落在不同的插入间隙：

| 目标 $x$ | 位置 $r$ | 逐个比较次数 | 二分比较次数 |
| --- | --- | --- | --- |
| 1 | 0 | 1 | 4 |
| 3 | 1 | 2 | 4 |
| 5 | 2 | 3 | 3 |
| 7 | 3 | 4 | 3 |
| 9 | 4 | 5 | 3 |
| 11 | 5 | 6 | 3 |
| 13 | 6 | 7 | 3 |
| 15 | 7 | 8 | 3 |
| 17 | 8 | 8 | 3 |

例如查 $x=7$：先比下标 4 的 10，再比下标 2 的 6，最后比下标 3 的 8，返回 3，共三次。查 $x=1$ 时走下标 4、2、1、0，共四次；逐个查却只需一次。这已经反驳“二分对每个输入都做更少比较”。

现在**人为规定**查询只从这九个值中等概率选取，每个概率都是 $1/9$。这不是说真实查询天然均匀，也不是说从所有整数中均匀抽样。加权平均为：

$$
\mathbb E[C_{\mathrm{linear}}]=44/9\approx4.889
$$

$$
\mathbb E[C_{\mathrm{binary}}]=29/9\approx3.222
$$

如果分布改成“目标总是 1”，平均数立即变成 1 与 4。一般地，给各可达秩指定概率 $p_r$，再计算 $\sum_r p_r C(n,r)$；没有分布，就没有唯一的平均复杂度。以上分数来自本页构造的完整枚举，不是设备上的计时基准。

## 6. 准备、查询、输出、空间，要分开结账

二分查找需要有序且在查询期间不变的随机访问数据。示例用 `OrderedInts(values)` 做一次准备：检查类型、长度、整数范围和非递减顺序，并复制为不可变序列。**不自动排序**，因为排序会改变输入合同，还会引入额外成本。

成功准备非空的 $n$ 项输入时，顺序检查恰好比较 $n-1$ 对相邻元素；另外还有 $n$ 项类型/范围检查和复制。这个 $n-1$ 不是下方查询函数返回的计数。按本页模型，准备总工作为 $\Theta(n)$；若连空输入的一次调用开销也保留，统一写成 $\Theta(n+1)$。

| 阶段或对象 | 本页的账单 | 没有包含什么 |
| --- | --- | --- |
| 一次准备 | $\Theta(n+1)$ 工作，建立含 $n$ 项的存储 | 不替调用者排序，不算磁盘或网络读入 |
| 一次二分查询 | 精确关键比较次数由 $D(n)$ 给出；总工作 $\Theta(1+\log(n+1))$ | 不重复准备、不打印 |
| 查询辅助空间 | $O(1)$ 个机器字 | 已存的 $n$ 项输入和调用者原列表 |
| 一次返回值 | 两个整数：位置与计数，$O(1)$ 个字 | 没有复制匹配元素 |

程序每次查询只检查准备值的类型和一个目标整数，**不会重新扫描或复制数组**。不可变表示在这里有一个很窄的作用：先检查一次，之后安心复用。它不是一套通用数据结构或安全框架。

如果只执行一次“准备后查询”，总体仍为 $\Theta(n+1)$，不能把完整过程标成 $O(\log n)$。若准备一次，复用它做 $q$ 次查询，处理一个结果就丢弃，总工作的上界为：

$$
O\bigl(n+1+q[1+\log_2(n+1)]\bigr)
$$

当 $n\ge1$ 时，常简写为 $O(n+q\log(n+1))$。保留那两个 1，是为了让空数组和零次查询也有清楚的账单；如果每次都重新构造输入，就重新支付 $q$ 次线性准备成本。若把全部查询结果收集起来，还要另算 $O(q)$ 的结果存储。

空间也同理：**查询辅助空间是常数，不代表整个程序只占常数空间。** 准备后的输入占 $\Theta(n+1)$ 个模型字；调用者若保留原列表，它也在内存里。Python 对象具体多少字节没有在这里测量。

最后还要问输出合同。返回一个位置只要常数大小；若改成“显式报告 $k$ 个匹配元素”，光逐个输出就至少需要 $\Omega(k)$ 的工作，保存所有结果需要 $\Theta(k)$ 项存储。只返回范围端点或惰性迭代器是另一份合同，不能借此声称已经输出了那 $k$ 项。类似地，Python 文档区分了对数级查找和可能需要移动许多元素的线性级插入。[Python bisect，Performance Notes](https://docs.python.org/3.14/library/bisect.html)

## 7. 可运行实验：计数器只负责一件事

输入范围特意很小：

- `OrderedInts(values)` 只接收内置 `list` 或 `tuple`，长度 0 到 4096，元素必须是内置 `int` 且在 $[-2^{31},2^{31}-1]$ 内，按非递减顺序排列
- 布尔值、浮点数（包括 `1.0`）、类型子类、字符串、迭代器、越界整数、过长或无序输入都会触发 `ValueError`；空数组和重复值合法
- 两个查询函数都只接收通过此构造器得到的 `OrderedInts` 本身和同范围的内置整数目标，返回 `(位置, 关键比较次数)`；两项都是内置整数
- 查询不修改数据。调用者事后修改原列表，不会改变已准备输入的内容或长度

这是普通单线程使用下的教学合同，不处理构造期间的并发修改、自定义比较器、主动绕过构造器或修改类定义。调用参数个数写错等 Python 使用错误不属于上述数据验证承诺。

4096 和整数范围是可运行示例的边界；**渐近结论讨论的是解除这个固定上限后、仍满足相同计算模型的算法族**，不是从有限运行结果拟合出来的定理。

```python
# nextchina-example: algorithm-complexity-cost-model
from fractions import Fraction

MAX_ITEMS = 4096
MIN_KEY = -(2**31)
MAX_KEY = 2**31 - 1


def _bounded_int(value):
    if type(value) is not int or not MIN_KEY <= value <= MAX_KEY:
        raise ValueError("expected a built-in signed-32-bit integer")
    return value


class OrderedInts(tuple):
    """A copied, checked, immutable input for this small experiment."""
    __slots__ = ()

    def __new__(cls, values):
        if cls is not OrderedInts or type(values) not in (list, tuple):
            raise ValueError("use OrderedInts with a built-in list or tuple")
        if len(values) > MAX_ITEMS:
            raise ValueError("at most 4096 entries")
        data = tuple.__new__(cls, values)  # Copy once; no later mutation.
        for value in data:
            _bounded_int(value)
        for i in range(1, len(data)):
            if data[i - 1] > data[i]:
                raise ValueError("entries must be nondecreasing")
        return data


def _check_query(data, target):
    # Constant-size checks: no scan, copy, sort, or key preprocessing.
    if type(data) is not OrderedInts:
        raise ValueError("prepare the input with OrderedInts first")
    _bounded_int(target)


def linear_lower_bound(data, target):
    _check_query(data, target)
    comparisons = 0
    for i in range(len(data)):
        comparisons += 1
        if not data[i] < target:
            return i, comparisons
    return len(data), comparisons


def binary_lower_bound(data, target):
    _check_query(data, target)
    lo, hi = 0, len(data)
    comparisons = 0
    while lo < hi:
        mid = (lo + hi) // 2
        comparisons += 1
        if data[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo, comparisons


data = OrderedInts([2, 4, 6, 8, 10, 12, 14, 16])
targets = tuple(range(1, 18, 2))
linear_results = tuple(linear_lower_bound(data, x) for x in targets)
binary_results = tuple(binary_lower_bound(data, x) for x in targets)
assert tuple(p for p, _ in linear_results) == tuple(range(9))
assert tuple(p for p, _ in binary_results) == tuple(range(9))
linear_counts = tuple(c for _, c in linear_results)
binary_counts = tuple(c for _, c in binary_results)
assert linear_counts == (1, 2, 3, 4, 5, 6, 7, 8, 8)
assert binary_counts == (4, 4, 3, 3, 3, 3, 3, 3, 3)
print("linear counts:", linear_counts)
print("binary counts:", binary_counts)
print("uniform-gap means:",
      Fraction(sum(linear_counts), len(targets)),
      Fraction(sum(binary_counts), len(targets)))

source = [2, 4, 4, 4, 8]
duplicates = OrderedInts(source)
source[1] = 99  # Changing the caller's list cannot change the prepared input.
for search in (linear_lower_bound, binary_lower_bound):
    assert search(duplicates, 4)[0] == 1
    assert search(duplicates, 5)[0] == 4
    assert search(OrderedInts([]), 0) == (0, 0)
    assert search(OrderedInts([7]), 7) == (0, 1)
    assert search(OrderedInts([7]), 8) == (1, 1)
print("duplicate ranks:", binary_lower_bound(duplicates, 4)[0],
      binary_lower_bound(duplicates, 5)[0])
```

前两行输出对应 §5 的两列精确次数；**uniform-gap means** 应为 `44/9 29/9`，`duplicate ranks` 应为 `1 4`。这里用 `Fraction` 只是保留这个有限平均的精确分数，没有为搜索增加另一种数值模型。

复核时要分别查**答案**和**次数**。答案可独立算成“小于目标的元素数量”，再检验左右分区；计数可用 §4 的树深列表和逐个查公式。只验证返回位置，发现不了“结果正确、计数多加一次”的错误。`bisect_left` 也能交叉核对位置，但其文档没有承诺与本页完全相同的内部比较轨迹。

## 8. 把账单带到矩阵和注意力

规模未必只有一个字母。先读懂[向量、张量与矩阵乘法](?view=garden&scope=branch:llm:math/tensor-shapes)中的形状：若 $Q,K$ 都是 $n\times d_k$，朴素计算每一对位置的点积，共有 $n^2$ 个点积，每个做 $d_k$ 次标量乘法，因而乘法次数恰为 $n^2d_k$。

若注意力权重 $A$ 为 $n\times n$，$V$ 为 $n\times d_v$，朴素算 $AV$ 又要 $n^2d_v$ 次标量乘法。这里分别固定了“数乘法”和“朴素逐项实现”；还未加入加法、Softmax、投影、多头、层数或批次。只有明确哪些轴固定，才能把复杂度简写成关于序列长度 $n$ 的“二次”。

**要求输出全部 $n\times n$ 分数**，就有 $n^2$ 项输出；**只要求最终 $n\times d_v$ 向量**，合同不同，不能据此推断必须长期保存所有分数。FlashAttention 正是通过分块和重新安排存储读写，避免把完整中间矩阵都写入高带宽显存；其计算与 I/O 分析有指定的存储层级模型，不能把本页显式实现的二次中间存储当作所有内核的下界。[Dao 等，FlashAttention v2，§2.2–3.1](https://arxiv.org/html/2205.14135v2)

可继续读[注意力逐步计算](?view=garden&scope=branch:llm:mechanisms/attention)，核对具体张量与掩码；读 [KV Cache](?view=garden&scope=branch:llm:inference/kv-cache)，区分已保存的输入状态、追加工作与生成多个 Token 的累计工作。本页没有实现优化内核，也不报告设备速度、模型能力或价格结论。

## 9. 自测：把省略的条件补回来

1. 有人说“逐个查是 $O(n)$，所以查第一个位置也一定要比较 $n$ 次”。哪里混淆了？
2. 对 8 项示例，目标固定为 1 时，两种搜索的平均比较次数是多少？若只报“平均 $O(\log n)$”，还缺什么？
3. 把准备器移进每次二分查询的开头，数出来仍只有 4 次关键比较。能否说整个函数只做常数次或对数级工作？
4. 对 $n=7,8,9$，此二分算法的最坏关键比较次数分别是多少？为什么不直接把 $\log_2 n$ 四舍五入？
5. 一个接口承诺返回全部一百万个匹配元素，另一个只返回范围的两个端点。可以只凭它们同用二分查找就认定总复杂度相同吗？

**参考解析**：第一题把最坏函数当成了每个输入的精确计数；查第一个位置只做一次。第二题分别为 1 和 4；平均分析要写明随规模变化的输入或查询分布，而一次固定规模的平均不是渐近证明。第三题不能，计数器刻意没有计入线性准备工作。第四题为 3、4、4，应由 $\lceil\log_2(n+1)\rceil$ 或 `n.bit_length()` 得到；下界位置有 $n+1$ 种，取整方向也重要。第五题不能，显式输出规模不同，即使定位阶段相同，完整接口的账单也不同。

读到下一条复杂度结论时，先补全五句话：**在什么输入族上，以什么为规模，数哪种操作，讨论哪一种情况，是否包含准备与输出。** 之后才判断那个 $O$ 是否回答了你的实际问题。

## 来源、版本与范围

访问日期为 **2026-10-05 UTC**。表格、决策树推导、程序和练习是本页教学构造；来源提供定义、计算模型和应用背景，没有为本页做专家认证。

1. Pat Morin，[Open Data Structures，§1.3 Mathematical Background](https://opendatastructures.org/ods-python/1_3_Mathematical_Background.html) 与 [§1.4 The Model of Computation](https://opendatastructures.org/ods-python/1_4_Model_Computation.html)：作者站点的伪代码版本（URL 保留 `ods-python`），用于对数、渐近上界和字长 RAM；不采用“只凭两个松上界即可判定速度顺序”的扩大解读
2. MIT 6.006，[Spring 2020 Recitation 1，pp. 3–4](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/c6d8f06c6f11e3342633dec85498f551_MIT6_006S20_r01.pdf)：正式定义 $O$、$\Omega$、$\Theta$，说明静态数组的计算模型
3. MIT 6.006，[Fall 2011 Lecture 2，pp. 1–4](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/6b9b20992d8c6a0f3f10a34ff7878aa9_MIT6_006F11_lec02.pdf)：模型与操作成本、Python 切片以及大整数边界；不把历史 Python 描述或计时常数当作当前版本基准
4. [Python 3.14 bisect 文档](https://docs.python.org/3.14/library/bisect.html)：所读页面标为 3.14.8；用于插入位置、重复值和查找/插入的区别。本例没有调用该库来实现搜索，也不把文档版本当作实际运行版本
5. Sedgewick / Wayne，[Algorithms 4e，§1.4 Analysis of Algorithms](https://algs4.cs.princeton.edu/14analysis/)：作者书站，用于明确成本模型和输入依赖；不移用其 Java 对象字节数
6. Dao 等，[FlashAttention，arXiv:2205.14135v2，2022](https://arxiv.org/html/2205.14135v2)：用于分块、计算和存储层级的区别，不引用其设备加速比作为本站测量

代码仅需 Python 标准库。有限测试能核对已测范围内的合同和次数，不能替代一般性证明、硬件基准或独立内容复核。本页仍标记为待独立复核。
