> **本页解决的问题**：同一个数据梯度进入 Adam 后，为什么会产生不同大小的更新？把 L2 项加入梯度和把权重单独衰减，为什么不是一回事？
>
> 输入是一组初始参数、一小段人为给定的数据梯度，以及明确的更新规则；输出是每一步的参数和矩状态。本页只独立讲解 AdamW。这里的梯度回放比较更新机制，不是完整训练实验，也没有证明这段梯度来自某个固定损失函数。

前置阅读：[训练循环](?view=garden&scope=branch:llm:training/loop) 已区分求梯度与更新参数；[导数与自动微分](?view=garden&scope=branch:llm:math/derivatives) 解释梯度怎样产生；[浮点数与舍入](?view=garden&scope=concept:floating-point) 解释为什么程序中的小数需要容差核对。下面在本页定义所需的 Adam 状态，不预设读者已经学过动量。

## 1. 参数之外，优化器还记住了什么？

先固定一个参数坐标。$w_{t-1}$ 是更新前参数，$g_t$ 是当前**数据损失**对它的梯度。$h_t$ 则是实际送进矩计算的有效梯度：两种机制可能用不同的 $h_t$。所有向量公式都逐坐标计算，平方不是向量内积。

从 $m_0=v_0=0$ 开始，Adam 保存两份指数移动平均：

$$
m_t=\beta_1m_{t-1}+(1-\beta_1)h_t
$$

$$
v_t=\beta_2v_{t-1}+(1-\beta_2)h_t^2
$$

$0\le\beta_1,\beta_2<1$。$m_t$ 积累带符号的梯度，过去的正负方向可能相互抵消；$v_t$ 积累平方，记录每个坐标近期梯度的量级。较大的 $\beta$ 在这项平均中保留更多旧状态；$\beta=0$ 只用当前项。$t$ 计数的是本次调用中的更新步骤，不是样本数或 epoch 数。这组递推与零初态见 [Adam 原论文，Algorithm 1、§2](https://arxiv.org/pdf/1412.6980v9)。

**$v_t$ 是二阶原始矩的估计，不是中心化方差。** 若随机量为 $H$，二阶原始矩是 $\mathbb E[H^2]$，方差是 $\mathbb E[H^2]-(\mathbb E[H])^2$。例如每一步恒为 $h=2$，方差为零，而修正后的二阶矩应为 4。这里没有减去均值平方，也不能把 $v_t$ 直接读作参数不确定度、曲率或预测置信度。

同一个当前梯度在不同历史下可以有不同的 $m_t,v_t$，所以参数更新不只由眼前的 $g_t$ 决定。重新启动时只恢复权重，却把这些状态归零，通常不是继续原来的更新轨迹；本文只实现零状态起步，不实现恢复接口。

## 2. 偏差修正：补上零初态缺掉的权重

把第一条递推展开，可直接核对：

$$
m_t=(1-\beta_1)\sum_{i=1}^{t}\beta_1^{t-i}h_i
$$

$$
v_t=(1-\beta_2)\sum_{i=1}^{t}\beta_2^{t-i}h_i^2
$$

每组有限几何权重之和分别是 $1-\beta_1^t$ 与 $1-\beta_2^t$。当相应的 $0<\beta<1$ 时，这个和小于 1；允许的边界 $\beta=0$ 则已经等于 1。于是定义：

$$
\widehat m_t=\frac{m_t}{1-\beta_1^t},\qquad
\widehat v_t=\frac{v_t}{1-\beta_2^t}
$$

在精确算术下，若整段输入恒为 $h_i=c$，就得到 $m_t=(1-\beta_1^t)c$、$v_t=(1-\beta_2^t)c^2$；修正后恰好是 $c,c^2$，第一步也成立。这是可以手算的检查，不是“让第一步学得更多”的任意补丁。[Adam 原论文 §3](https://arxiv.org/pdf/1412.6980v9) 从相同的加权和讨论零初始化偏差。

“无偏”必须附带要估计什么的假设。如果各步有效梯度有相同的一阶期望 $\mu$ 和二阶原始矩 $\nu$，期望的线性性给出 $\mathbb E[\widehat m_t]=\mu$、$\mathbb E[\widehat v_t]=\nu$；这个有限等式不需要各步相互独立。训练中的参数、抽样和有效梯度会变化，不能无条件把它们当成同一个分布。修正也不让非线性的比值 $\widehat m_t/(\sqrt{\widehat v_t}+\epsilon)$ 自动成为某个理想方向的无偏估计。

## 3. 分母决定各坐标怎样缩放

先不加任何正则项，定义自适应方向：

$$
a_t=\frac{\widehat m_t}{\sqrt{\widehat v_t}+\epsilon},\qquad
w_t=w_{t-1}-\eta_ta_t
$$

$\eta_t$ 是学习率。分母较大时，同样的分子会产生较小的移动；实际分子和分母又都来自历史，不能只看到一个“大梯度”就断言步长一定大。本页遵循 [Adam Algorithm 1](https://arxiv.org/pdf/1412.6980v9) 和 [PyTorch 2.14 AdamW 的公式](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html)，把正数 $\epsilon$ 放在**平方根外**。

$\sqrt{\widehat v_t}+\epsilon$ 与 $\sqrt{\widehat v_t+\epsilon}$ 是不同规则。例如 $\widehat v_t=4,\epsilon=1$ 时，分母分别为 3 与 $\sqrt5$。当二阶矩为零，外面的正 $\epsilon$ 避免该分母为零；它不保证所有中间值有限，也不证明算法稳定或收敛。

梯度尺度也不是无条件抵消。取新状态、$\beta_1=\beta_2=0,\epsilon=1$，$g=1$ 的方向是 $1/2$，$g=2$ 的方向是 $2/3$。只有在另加条件时才能讨论某种尺度不变性，例如理想算术、$\epsilon=0$、非零分母和正的共同缩放。实际把损失从均值改为总和，不能不检查梯度尺度、$\epsilon$ 和正则系数，就宣称更新不变。

## 4. L2 项走哪条路，是关键区别

令数据损失为 $F(w)$。给目标加上 $\lambda_{\mathrm{loss}}\|w\|^2/2$，其梯度增加 $\lambda_{\mathrm{loss}}w$。因此本页的 **Adam+L2** 是：

$$
h_t=g_t+\lambda_{\mathrm{loss}}w_{t-1}
$$

$$
w_t=w_{t-1}-\eta_ta_t
$$

这里的 $a_t$ 由这个 $h_t$ 的矩状态计算。惩罚项不只改变当前分子，也进入平方和以后的历史。与之对照，本页采用库式系数的 **AdamW**：

$$
h_t=g_t
$$

$$
w_t=(1-\eta_t\lambda_{\mathrm{wd}})w_{t-1}-\eta_ta_t
$$

衰减项绕过了矩与自适应缩放路径。这才是这里“解耦”的含义。[AdamW 论文 §2、Algorithm 2](https://arxiv.org/pdf/1711.05101v3) 讨论这一区别；[PyTorch 2.14 AdamW](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html) 明确给出本页采用的、乘以完整学习率的衰减约定。

不要只凭优化器类名猜机制。[PyTorch 2.14 Adam 文档](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Adam.html) 中，默认的 `decoupled_weight_decay=False` 把 `weight_decay` 当作 L2 梯度项；设置为 `True` 则说明与 AdamW 等价。本文的两种模式固定其更新含义，不模拟该类的所有选项。

### 4.1 为什么普通梯度下降曾让这两个词看起来一样？

不带动量、没有自适应缩放时，只需展开：

$$
w-\eta(g+\lambda_{\mathrm{loss}}w)
=(1-\eta\lambda_{\mathrm{loss}})w-\eta g
$$

在**这个条件和系数约定下**，令 $\lambda_{\mathrm{wd}}=\lambda_{\mathrm{loss}}$，两种写法给出同一步。若另一个接口直接指定每步衰减量 $\delta$，写成 $(1-\delta)w-\eta g$，对应的却是 $\delta=\eta\lambda_{\mathrm{loss}}$。一旦梯度被送进 Adam 的两条状态递推，上述简单展开就不能证明等价。

目标、惩罚和更新规则是三件事。关于一个 L2 目标到底偏好什么，以及拟合和新样本误差为什么不相同，见 [正则化、L2 惩罚与泛化边界](?view=garden&scope=concept:regularization)。不能据此把实际 AdamW 的每条轨迹都解释成在优化同一个固定 L2 目标；AdamW 论文 Proposition 3 的相关解释有**固定预条件器**的限制。

### 4.2 论文的 lambda，不能原样抄进库参数

AdamW 论文 Algorithm 2 把基础步长记作 $\alpha$，把调度倍率记作 $\eta_{\mathrm{paper},t}$。取其中解耦的分支，写成：

$$
w_t=w_{t-1}-\eta_{\mathrm{paper},t}
\bigl(\alpha a_t+\lambda_{\mathrm{paper}}w_{t-1}\bigr)
$$

与本页库式公式匹配，在固定正基础步长 $\alpha$ 下需要：

$$
\eta_t=\eta_{\mathrm{paper},t}\alpha
$$

$$
\lambda_{\mathrm{paper}}=\alpha\lambda_{\mathrm{wd}}
$$

例如 $\alpha=0.1,\eta_{\mathrm{paper},t}=0.5,\lambda_{\mathrm{wd}}=0.2$，对应 $\eta_t=0.05,\lambda_{\mathrm{paper}}=0.02$，两边单独的衰减倍率都是 $0.99$。同样叫 lambda 不代表数值相等。这里仅作代数对齐，不实现论文的归一化衰减或调度实验。[AdamW Algorithm 2](https://arxiv.org/pdf/1711.05101v3)

## 5. 两步手算：把状态与参数分开记

下面是特意构造的两坐标梯度回放：

$$
w_0=(2,-1),\quad g_1=(2,-4),\quad g_2=(-2,4)
$$

$$
\beta_1=\beta_2=\frac12,\quad
\eta=\frac1{10},\quad
\lambda_{\mathrm{wd}}=\frac15,\quad \epsilon=1
$$

这些数值是为手算选的，尤其 $\epsilon=1$ **不是调参建议**。每步单独的衰减倍率为 $49/50$。

| 步骤 | $m_t$ | $v_t$ |
| --- | --- | --- |
| 1 | $(1,-2)$ | $(2,8)$ |
| 2 | $(-1/2,1)$ | $(3,12)$ |

| 步骤 | $\widehat m_t$ | $\widehat v_t$ |
| --- | --- | --- |
| 1 | $(2,-4)$ | $(4,16)$ |
| 2 | $(-2/3,4/3)$ | $(4,16)$ |

第一步第一坐标的自适应方向为 $2/(2+1)=2/3$，所以：

$$
w_{1,1}=\frac{49}{50}\cdot2-\frac1{10}\cdot\frac23
=\frac{142}{75}
$$

第二步第一矩改变符号，但第二原始矩仍由平方累积。第二步第一坐标为：

$$
w_{2,1}=\frac{49}{50}\cdot\frac{142}{75}
-\frac1{10}\cdot\frac{-2/3}{2+1}
=\frac{10562}{5625}
$$

两坐标完整参数结果是：

| 步骤 | 精确数学参数 | 约为 |
| --- | --- | --- |
| 1 | $(142/75,-9/10)$ | $(1.893333,-0.900000)$ |
| 2 | $(10562/5625,-1363/1500)$ | $(1.877689,-0.908667)$ |

注意第一步的两个自适应方向大小为 $2/3$ 和 $4/5$，并非保持原梯度大小之比 $1:2$；加入衰减后，还要分别算参数自身那一项。

程序使用浮点数，不能要求它与所有表中分数逐位相等。表中分数来自有理数手算；后面的复核用它们检查返回的状态和参数，而不是把四舍五入后的输出当作真值。

## 6. 三个边界，比一句“衰减到零”更可靠

### 6.1 当前梯度为零，要先问有没有历史

仍用上节超参数，但第一步数据梯度直接给 $(0,0)$。AdamW 的两条矩为零，只执行衰减：

$$
w_1=(49/25,-49/50)
$$

同样的数值系数用于 Adam+L2，输入矩的却是 $h_1=(2/5,-1/5)$。零初始化修正后，$\widehat m_1=h_1,\widehat v_1=h_1^2$，因此：

$$
w_1=(69/35,-59/60)
$$

两者已经不同；相同的系数数值不能证明“正则化强度相同”。

再改成先输入 $(2,-4)$，第二步才给 $(0,0)$。AdamW 此时有 $m_2=(1/2,-1)$，修正后为 $(2/3,-4/3)$，自适应方向仍不为零。因此“当前梯度是零”不等于“只有衰减”，更不等于“参数不动”。

这里的零是**提供了数值零梯度**。[PyTorch 2.14 的 zero_grad 说明](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html) 区分零梯度与 `None`：缺失梯度的参数可能跳过整步。本接口拒绝 `None`，不把这两种情况混在一起。

### 6.2 解耦仍然受学习率影响

若从零矩起步，且整段原始梯度都为零，则 AdamW 在精确算术下简化为：

$$
w_T=w_0\prod_{t=1}^{T}(1-\eta_t\lambda_{\mathrm{wd}})
$$

固定学习率就是 $w_T=(1-\eta\lambda_{\mathrm{wd}})^Tw_0$。所以学习率、调度和更新次数都影响累计衰减；“不进入矩”不等于“衰减量独立于学习率”。下方程序固定学习率，上式的调度只用于解释约定。

单看倍率 $q=1-\eta\lambda_{\mathrm{wd}}$：

| $\eta\lambda_{\mathrm{wd}}$ | $q$ | 非零参数只经历衰减时 |
| --- | --- | --- |
| 0 | 1 | 不变 |
| $1/2$ | $1/2$ | 不变号，绝对值减半 |
| 1 | 0 | 归零 |
| $3/2$ | $-1/2$ | 变号，绝对值减半 |
| 2 | $-1$ | 变号，绝对值不变 |
| $5/2$ | $-3/2$ | 变号，绝对值增大 |

$0\le\eta\lambda_{\mathrm{wd}}\le1$ 给出非负且不放大的倍率，右端点是零；严格正倍率需 $\eta\lambda_{\mathrm{wd}}<1$。若还加入自适应方向，即便倍率落在正常缩小区间，总更新也不保证减小参数范数。例如 $w=1,g=-1,\beta_1=\beta_2=0,\epsilon=1,\eta=0.1,\lambda_{\mathrm{wd}}=0.2$，一步得到 $0.98+0.05=1.03$。

### 6.3 两种零超参数，关闭的东西不同

- `coefficient=0`：AdamW 和 Adam+L2 都退回本文同一个 Adam 递推，仍有矩状态和自适应更新
- `lr=0`：成功返回时参数保持不变，但 $t,m,v$ 仍推进。本接口仍会校验数据并计算状态，不用零学习率掩盖无效输入或溢出

## 7. 可运行实验：只做有界的机制实验室

仅用 Python 3 标准库，不安装 PyTorch。本次实际运行环境为 Linux x86_64 的 CPython 3.12.14，float 为 53 位二进制有效精度；没有测量其他平台或框架的数值一致性。函数 `adam_trace(initial, data_gradients, *, lr, coefficient, beta1, beta2, eps, mode)` 的六个关键字参数均须显式给出。`mode` 必须是内置字符串 `"adamw"` 或 `"adam-l2"`，`coefficient` 分别代表 $\lambda_{\mathrm{wd}}$ 或 $\lambda_{\mathrm{loss}}$。

接口刻意较窄：

- `initial` 是长度 1–8 的内置列表或元组；梯度序列是长度 1–32 的内置列表或元组，每行也是与初始参数等宽的内置列表或元组
- 数值只接受内置 `int/float`，拒绝 bool、子类、Fraction、Decimal、字符串及隐式转换对象。接受的整数转为 float，可能发生舍入；转成无穷或无法转换的巨大整数被拒绝
- 所有值有限；学习率与系数非负；两个 beta 在 $[0,1)$；epsilon 严格为正。完整输入先校验，再开始更新，且不改写输入
- 每次从零矩开始，学习率、两个 beta、epsilon 和系数在调用内不变。返回内置元组，元素是不可变的 `AdamStep(t, weights, m, v, mhat, vhat)`；除了整数 `t`，其余字段都是等宽的 float 元组。没有 $t=0$ 输出记录
- 无效数值、形状或非有限中间结果统一报 `ValueError`，不返回半段轨迹；缺少参数等 Python 调用语法错误仍遵循语言本身的规则。代码先计算梯度平方，再乘其权重；先计算自适应比值，再乘学习率。这些中间值溢出也拒绝
- 有限下溢和舍入仍可能发生，例如很小的梯度平方变成零、很小的衰减被舍掉；代码不偷偷补偿或替换 epsilon，也不保证保留零的符号

本例不接受缺失或稀疏梯度，不提供自动求导、参数组、调度、AMSGrad、混合精度和恢复状态。它的作用是展开状态账单，不是一个生产优化器框架。

```python
# nextchina-example: adamw-moments-decoupled-decay
import math
from collections import namedtuple


AdamStep = namedtuple("AdamStep", "t weights m v mhat vhat")


def _adam_number(value):
    if type(value) not in (int, float):
        raise ValueError("Expected a builtin int/float, excluding bool")
    try:
        value = float(value)
    except OverflowError as exc:
        raise ValueError("Number is outside the finite float range") from exc
    return _adam_checked(value)


def _adam_checked(value):
    if not math.isfinite(value):
        raise ValueError("Nonfinite input, intermediate or result")
    return value


def _adam_vector(values, width=None):
    if type(values) not in (list, tuple) or not 1 <= len(values) <= 8:
        raise ValueError("Expected a builtin vector of length 1..8")
    if width is not None and len(values) != width:
        raise ValueError("Gradient width must match initial weights")
    return tuple(_adam_number(x) for x in values)


def adam_trace(initial, data_gradients, *, lr, coefficient,
               beta1, beta2, eps, mode):
    """Replay a dense gradient tape from zero moments; return immutable steps."""
    if type(mode) is not str or mode not in ("adamw", "adam-l2"):
        raise ValueError("Mode must be adamw or adam-l2")
    lr, coefficient, beta1, beta2, eps = (
        _adam_number(x) for x in (lr, coefficient, beta1, beta2, eps))
    if (lr < 0 or coefficient < 0 or not 0 <= beta1 < 1
            or not 0 <= beta2 < 1 or eps <= 0):
        raise ValueError("Invalid optimizer hyperparameter range")
    weights = _adam_vector(initial)
    if (type(data_gradients) not in (list, tuple)
            or not 1 <= len(data_gradients) <= 32):
        raise ValueError("Expected a builtin gradient tape of length 1..32")
    tape = tuple(_adam_vector(row, len(weights)) for row in data_gradients)
    # All inputs are validated before the first update.
    factor = 1.0
    if mode == "adamw":
        factor = _adam_checked(1.0 - _adam_checked(lr * coefficient))
    m = v = (0.0,) * len(weights)
    trace = []
    for t, raw_gradient in enumerate(tape, 1):
        correction1, correction2 = 1.0 - beta1**t, 1.0 - beta2**t
        next_w, next_m, next_v, mhats, vhats = [], [], [], [], []
        for old_w, old_m, old_v, g in zip(weights, m, v, raw_gradient):
            h = g
            if mode == "adam-l2":
                h = _adam_checked(g + _adam_checked(coefficient * old_w))
            h_squared = _adam_checked(h * h)
            new_m = _adam_checked(beta1 * old_m + (1.0 - beta1) * h)
            new_v = _adam_checked(beta2 * old_v
                                  + (1.0 - beta2) * h_squared)
            mhat = _adam_checked(new_m / correction1)
            vhat = _adam_checked(new_v / correction2)
            denominator = _adam_checked(math.sqrt(vhat) + eps)
            adaptive = _adam_checked(mhat / denominator)
            change = _adam_checked(lr * adaptive)
            decayed = _adam_checked(factor * old_w)
            new_w = _adam_checked(decayed - change)
            next_w.append(new_w)
            next_m.append(new_m)
            next_v.append(new_v)
            mhats.append(mhat)
            vhats.append(vhat)
        weights, m, v = tuple(next_w), tuple(next_m), tuple(next_v)
        trace.append(AdamStep(t, weights, m, v, tuple(mhats), tuple(vhats)))
    return tuple(trace)


# These are supplied gradients, not gradients recomputed from a fixed loss.
settings = dict(lr=0.1, coefficient=0.2, beta1=0.5, beta2=0.5, eps=1.0)
example = adam_trace((2, -1), ((2, -4), (-2, 4)),
                     mode="adamw", **settings)
for step in example:
    print("step", step.t, "weights", tuple(round(x, 6) for x in step.weights))
    print("  mhat", step.mhat, "vhat", step.vhat)

cold_w = adam_trace((2, -1), ((0, 0),), mode="adamw", **settings)[0]
cold_l2 = adam_trace((2, -1), ((0, 0),), mode="adam-l2", **settings)[0]
print("zero data gradient, AdamW:", cold_w.weights)
print("zero data gradient, Adam+L2:", cold_l2.weights)

with_history = adam_trace((2, -1), ((2, -4), (0, 0)),
                         mode="adamw", **settings)
assert with_history[1].m != (0.0, 0.0)
zero_decay = dict(settings, coefficient=0.0)
assert adam_trace((2, -1), ((2, -4), (-2, 4)), mode="adamw", **zero_decay) == (
    adam_trace((2, -1), ((2, -4), (-2, 4)), mode="adam-l2", **zero_decay))
```

第一、二步显示的参数分别约为 `(1.893333, -0.9)` 和 `(1.877689, -0.908667)`。零数据梯度的两行展示 §6.1 的不同更新。`mhat`、`vhat` 输出用于帮助读数；真正的检验必须检查返回值、分数参考、独立加权和与拒绝路径，不能仅匹配标准输出。

### 成本要把整份账单也算进去

设参数宽度为 $d$、步数为 $T$。把一次有限浮点基本运算视为常数成本，每步做 $O(d)$ 个逐坐标运算，运行中的权重与两份矩等工作向量占 $O(d)$ 空间。**本函数另存完整校验后的梯度序列，并返回所有步骤的五组向量，因此总工作量为 $O(Td)$，轨迹和输入副本各占 $O(Td)$ 空间**。返回完整账单的成本不能算成只存两个矩。

真实模型还有梯度、激活、张量布局、dtype、临时缓冲区和分布式状态等成本；这里没有测量 GPU 速度或实际内存字节数。小函数执行快，不是 AdamW 比其他优化器更快的实验依据。

## 8. 从机制读到应用，哪些结论仍不能跳过？

AdamW 不只出现在语言模型训练中。其原论文 §4 研究了图像分类 ResNet，在 CIFAR-10 和 ImageNet32x32 上比较所设的正则化与学习率方案。那是有模型、数据和搜索预算的研究结果，本页没有重做这些实验，也不把它扩大为所有视觉模型或 LLM 都更好的结论。[AdamW，§4](https://arxiv.org/pdf/1711.05101v3)

优化轨迹、训练损失、留出数据表现仍是不同问题。本页没有给梯度序列配上固定损失，不能从参数变小或两种轨迹不同推出哪一种训练更好。选择系数和学习率时，应遵循[训练、验证与测试的边界](?view=garden&scope=concept:train-validation-test)，而不是看着测试结果反复挑选。

也不要把状态归一化当作收敛保证。Reddi、Kale 与 Kumar 的论文在特定在线凸优化设置中给出了 Adam 的非零渐近平均遗憾反例；本页不复现该定理，也不声称它意味着每次 AdamW 训练都会失败。它足以提醒我们，任何“Adam 类方法总会收敛”的说法都需要重新检查条件。[On the Convergence of Adam and Beyond，§3 Theorem 1、Appendix A](https://arxiv.org/pdf/1904.09237v1)

**练习与参考解析**：

1. 每步有效梯度都为 $-3$，$\beta_1=1/2,\beta_2=3/4$。第二步的修正矩是什么？答案是 $\widehat m_2=-3,\widehat v_2=9$；二阶矩不是零，尽管常数序列没有中心化波动
2. 第一梯度非零，第二梯度为零，把第二步称作“纯权重衰减”漏了什么？漏了未消失的第一矩；只有相应状态确为零等额外条件成立时，自适应方向才消失
3. 论文基础步长 $\alpha=0.02$，库中 `weight_decay=0.1`，应匹配怎样的论文系数？$\lambda_{\mathrm{paper}}=0.002$；还要把完整学习率与调度倍率乘基础步长对齐
4. 同一系数的 Adam+L2 与 AdamW 轨迹不同，能判定哪一个泛化更好么？不能。这是机制差异；需要另设训练问题和独立的评估协议

本页仍待独立内容复核。有限数值测试不是专家认证、跨平台承诺或一般收敛证明；没有额外完成动量、所有优化算法、正则化理论或模型训练工程的独立覆盖。

## 来源、版本与核验范围

以下来源于 **2026-10-05 UTC** 实际访问；文档版本不等于本地安装或执行版本。

1. [Kingma 与 Ba，Adam: A Method for Stochastic Optimization，arXiv v9](https://arxiv.org/pdf/1412.6980v9)：ICLR 2015，版本修订于 2017-01-30；Algorithm 1、§2–3 支持状态与零初始化修正
2. [Loshchilov 与 Hutter，Decoupled Weight Decay Regularization，arXiv v3](https://arxiv.org/pdf/1711.05101v3)：ICLR 2019，版本修订于 2019-01-04；§2 Algorithm 2、固定预条件器限制与 §4 实验范围
3. [PyTorch 2.14 AdamW](https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html)：用于库式衰减、epsilon 位置与零/缺失梯度区别；未运行框架或比较 fused/foreach 实现
4. [PyTorch 2.14 Adam](https://docs.pytorch.org/docs/2.14/generated/torch.optim.Adam.html)：用于 `weight_decay` 和 `decoupled_weight_decay` 的明确配置含义
5. [Reddi、Kale 与 Kumar，On the Convergence of Adam and Beyond，arXiv v1](https://arxiv.org/pdf/1904.09237v1)：ICLR 2018，上传于 2019-04-19；仅引用 §3 Theorem 1 与 Appendix A 的限定反例，不借此宣称 AdamW 必胜或必败
