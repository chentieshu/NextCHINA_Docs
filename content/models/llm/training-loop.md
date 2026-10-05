> **本页解决的问题**：“训练模型”在一次迭代中具体做了什么？目标、损失、梯度和参数更新怎样连接？
>
> 本页先用两个可训练参数的分类器手算一次更新，再用独立的二记录二次损失例子回答：SGD 的随机性从哪来？无偏梯度为何仍会让损失上升？学习率多大才合适？两个例子都不是完整 LLM；Python 实验不需要 GPU、API 或第三方包。

前置阅读：[条件概率与自回归](?view=garden&scope=branch:llm:math/probability) 说明条件、期望与方差；[熵、交叉熵与 KL 散度](?view=garden&scope=branch:llm:math/objectives) 给出损失的概率解释；[导数、链式法则与自动微分](?view=garden&scope=branch:llm:math/derivatives) 说明梯度怎样算出来。阅读时始终区分三个量：正在优化的整个训练集目标、当前抽到的样本损失，以及另外保留的数据上的表现。

## 1. 先把输入和目标对齐

考虑教学符号序列：`BOS / 我 / 喜欢 / AI`。一个 next-token 训练样本可整理为：

| 计算位置的输入前缀 | 当前要预测的目标 |
| --- | --- |
| `BOS` | `我` |
| `BOS / 我` | `喜欢` |
| `BOS / 我 / 喜欢` | `AI` |

使用因果注意力时，一次前向可以同时计算这些位置，但每个位置不能读取对应目标及更晚的符号。目标移位与注意力掩码需要一起正确，不能因为训练数据已经完整可见，就允许模型读答案。[1]

工程中有些实现把标签移位封装在模型内部，例如 Hugging Face 的 GPT-2 接口允许直接传入 `labels = input_ids`。使用接口时要确认契约，避免数据层移位一次、模型里又移位一次。[1]

## 2. 损失把“输出不好”变成一个数

给定参数 $\theta$ 和目标序列，自回归分解为：

$$
P_\theta(x_1,\ldots,x_N)=\prod_{t=1}^{N}P_\theta(x_t\mid x_{<t})
$$

相应负对数似然求和为：

$$
L_{sum}=-\sum_{t=1}^{N}\log P_\theta(x_t\mid x_{<t})
$$

实践中经常按有效目标 Token 数取平均，但应明确是求和、按样本平均，还是按 Token 平均。它们的尺度不同，不能在日志中随意比较。下面使用自然对数与单个样本，没有额外权重或标签平滑。[2]

正确目标的概率若从 0.1 升到 0.5，单项损失从约 2.302585 降到约 0.693147。这只说明这项训练目标拟合得更好，不是对事实真实性或综合智能的证明。

## 3. 梯度如何变成参数变化？

若还不清楚局部导数如何沿计算路径相乘、分支如何累加，先用 [导数、链式法则与自动微分](?view=garden&scope=branch:llm:math/derivatives) 手算一次。本节继续说明这些变化率怎样进入参数更新。

对于 Softmax 与单个 one-hot 目标，$\partial L/\partial z_i=p_i-y_i$。如果分数由 $z_i=w_i h$ 得到，且本例把上下文特征 $h$ 固定，那么：

$$
\frac{\partial L}{\partial w_i}=(p_i-y_i)h
$$

再用一次不含动量、权重衰减或其他状态的梯度更新：

$$
w_i^{new}=w_i-\eta\frac{\partial L}{\partial w_i}
$$

学习率 $\eta$ 决定沿所算梯度走多远；它不是“答对的概率”，梯度也不是参数本身。**反向传播负责沿计算图求梯度，优化器负责据此改变参数**，两者不能混为一个步骤。完整神经网络还会通过链式法则计算 $h$ 所依赖参数的梯度；本例故意不训练它，让每一步都能手算。

```mermaid
flowchart LR
  D["样本与目标"] --> F["前向：计算分数"]
  F --> L["损失：与目标比较"]
  L --> G["反向：计算梯度"]
  G --> U["优化器：更新参数"]
  U --> F
```

## 4. 一个完整数值更新

设置 $h=2$、$w=[0,0]$、目标类别为 0、学习率 $\eta=0.1$。

| 步骤 | 结果 |
| --- | --- |
| 初始 logits | $[0,0]$ |
| 初始概率 | $[0.5,0.5]$ |
| 初始损失 | $-\log0.5\approx0.693147$ |
| logits 梯度 | $[-0.5,0.5]$ |
| 参数梯度 | $[-1,1]$ |
| 更新后的参数 | $[0.1,-0.1]$ |
| 新 logits | $[0.2,-0.2]$ |
| 新的目标概率 | 约 $0.598688$ |
| 新损失 | 约 $0.513015$ |

梯度的负号并不意味着“错误越小”。它表示在这个点沿该参数增大的方向作足够小的变化会降低损失，所以减去负梯度会使参数增大。

这里的样本、参数和计算都已固定，没有随机抽样。这是一次确定的单样本梯度更新；写了 $w-\eta g$，或调用名字为 `SGD` 的优化器，都不自动使它具有随机性。下面单独引入抽样，避免把“只有一个样本”和“随机选了一个样本”混在一起。

## 5. SGD 的随机性来自哪一步？

对于固定训练集的 $n$ 条记录，令第 $i$ 条的损失为 $\ell_i(\theta)$，平均目标为 $F(\theta)=n^{-1}\sum_i\ell_i(\theta)$。全批量梯度下降计算所有记录的平均梯度，再更新一次；随机梯度下降（SGD）在每步随机选取记录，用其梯度估计全梯度；mini-batch SGD 则平均一个小批次的梯度。[5][6]

先固定数据集和当前参数。如果索引 $I$ 在全部 $n$ 条记录中等概率抽取，那么有限和直接给出：

$$
\mathbb E_I[g_I(\theta)]
=\frac1n\sum_{i=1}^n\nabla\ell_i(\theta)
=\nabla F(\theta)
$$

这就是这里的**无偏**：重复抽样所得梯度的期望等于这个固定训练集的全梯度，不是每次都算对方向。证明只用了均匀抽样和有限和的求导，**没有要求训练记录本身相互独立**。若给某条记录更高的抽样概率而不作相应校正，期望通常就对应另一个加权目标。[5]

为了能列出每个结果，另设一个标量参数 $\theta$，两条记录的目标为 $y_0=0,y_1=2$。单记录损失及整个训练集的平均目标为：

$$
\begin{aligned}
\ell_i(\theta)&=\frac12(\theta-y_i)^2\\
F(\theta)&=\frac{\ell_0(\theta)+\ell_1(\theta)}2\\
&=\frac12(\theta-1)^2+\frac12
\end{aligned}
$$

于是 $g_i=\theta-y_i$，全梯度 $F'(\theta)=\theta-1$，最优参数为 $1$，最小平均损失为 $1/2$。因为两条记录目标不同，共享参数不可能让两项损失同时归零。这个二次例子和上面的分类器是两个独立模型，不能把这里的 $\theta$ 代入分类器权重。

现在特意从最优点 $\theta=1$ 出发，每条记录以 $1/2$ 的概率被抽中，学习率设为 $\eta=1/2$：

| 抽到的目标 | 单记录梯度 $g_I$ | 更新后 $\theta'=1-\eta g_I$ | 更新后整个训练集的 $F(\theta')$ |
| --- | --- | --- | --- |
| $0$ | $+1$ | $1/2$ | $5/8$ |
| $2$ | $-1$ | $3/2$ | $5/8$ |

$\mathbb E[g_I]=0=F'(1)$，$\operatorname{Var}(g_I)=1$；估计确实无偏，但每一种结果都把平均损失从 $1/2$ 提高到 $5/8$。被抽中那条记录的损失反而从 $1/2$ 降为 $1/8$。因此只看当前样本的 loss，会漏掉它对其他样本的影响。

本例也说明 $\mathbb E[F(\theta')]$ 与 $F(\mathbb E[\theta'])$ 不一样：前者是 $5/8$，后者是 $F(1)=1/2$。“平均更新方向正确”不等于“更新后的损失一定更低”。

## 6. mini-batch 能减少什么，不能证明什么？

继续固定 $\theta=1$，先独立、有放回地抽两次，再把**同一参数处**的两项梯度平均成 $\bar g$，最后只更新一次。这不是抽一次就更新一次。[6]

| 两次抽到的目标（顺序有区别） | 概率 | $\bar g$ | $\theta'=1-\bar g/2$ | $F(\theta')$ |
| --- | --- | --- | --- | --- |
| $(0,0)$ | $1/4$ | $+1$ | $1/2$ | $5/8$ |
| $(0,2)$ | $1/4$ | $0$ | $1$ | $1/2$ |
| $(2,0)$ | $1/4$ | $0$ | $1$ | $1/2$ |
| $(2,2)$ | $1/4$ | $-1$ | $3/2$ | $5/8$ |

由四项枚举可得：

$$
\mathbb E[\bar g]=0,\qquad
\operatorname{Var}(\bar g)=\frac{1+0+0+1}{4}=\frac12
$$

$$
\mathbb E[F(\theta')]
=\frac{5/8+1/2+1/2+5/8}{4}
=\frac9{16}>\frac12
$$

方差减半了，期望损失仍然上升。在固定参数下，若参与平均的梯度独立同分布且方差有限，批量为 $b$ 的平均梯度方差就是单记录梯度方差的 $1/b$；相关抽样还要计算协方差。**求平均保持无偏与方差按 $1/b$ 缩减是两件事**。[6]

若改为无放回抽取两条记录，必然各取一次，在同一 $\theta$ 处平均就等于精确全梯度，方差为零。两次抽取相互依赖，却仍得到正确平均值，这也直接反驳“独立是无偏的必要条件”。但若每取一条就更新，第二个梯度对应的参数已经变了，不能再把两步当成一次全梯度更新。

这里有三种容易混淆的“独立”：

- **抽样索引的独立**：上表规定两次有放回抽样互不影响，用来计算方差。每轮洗牌再逐批更新时，后续样本与已见样本、当前参数会发生依赖；不能直接声称每一步给定当前状态仍是对全训练集的均匀抽样
- **训练数据与真实总体的关系**：随机抽索引只是在已经固定的数据上选记录，不能修复数据泄漏、采集偏差或分布变化，也不证明泛化。需要另行设计[训练、验证与测试](?view=garden&scope=concept:train-validation-test)
- **模型内的条件独立**：[朴素贝叶斯](?view=garden&scope=concept:naive-bayes) 假设给定类别后特征之间条件独立，这是概率模型的假设，与优化器怎样取样无关

要把无偏等式用到多步算法，可以记已见历史为 $\mathcal H_t$，固定数据集并令当前参数 $\theta_t$ 由历史确定。一个充分条件是每条记录在这份历史下仍被等概率选取：

$$
\begin{gathered}
P(I_t=i\mid\mathcal H_t)=\frac1n\\
\Longrightarrow\quad
\mathbb E[g_{I_t}(\theta_t)\mid\mathcal H_t]=\nabla F(\theta_t)
\end{gathered}
$$

每步都要核对抽样规则是否满足所用条件，不能从单步有限和证明跳到整条训练轨迹或总体风险的保证。[7]

## 7. 学习率为什么有范围？

先移除抽样噪声，只对这个二次平均目标使用全梯度，保持学习率恒定。定义距最优点的误差 $e=\theta-1$，就有：

$$
\begin{aligned}
\theta'&=\theta-\eta(\theta-1)\\
e'&=(1-\eta)e\\
F(\theta')-\frac12&=(1-\eta)^2\left(F(\theta)-\frac12\right)
\end{aligned}
$$

从非最优初始点出发，要让误差逐步趋于零，必须且只需 $|1-\eta|<1$，即 **$0<\eta<2$**。$\eta=1$ 一步到达最优点；$1<\eta<2$ 虽会跨过最优点，但误差幅度缩小。$\eta=0$ 不动；$\eta=2$ 等幅来回；$\eta>2$ 误差幅度增大。若本来就在最优点，全梯度为零，有限学习率下参数不动，故不能漏写“非最优初始点”。[8]

从 $\theta_0=0$ 开始，前三次全梯度更新是：

| 固定学习率 | $\theta_0\to\theta_1\to\theta_2\to\theta_3$ | 观察 |
| --- | --- | --- |
| $0.5$ | $0\to0.5\to0.75\to0.875$ | 向 $1$ 靠近 |
| $1.5$ | $0\to1.5\to0.75\to1.125$ | 跨过 $1$，幅度逐步缩小 |
| $2$ | $0\to2\to0\to2$ | 不收敛 |
| $2.5$ | $0\to2.5\to-1.25\to4.375$ | 越走越远 |

这也回应前面的 reduction 约定：若把目标从平均值 $F$ 换为总和 $S=\ell_0+\ell_1=2F$，最优点不变，但梯度变为 $2(\theta-1)$。同一学习率的步长变成两倍，误差递推变为 $e'=(1-2\eta)e$，收敛区间相应减半为 $0<\eta<1$。想保留原轨迹，就必须把学习率减半。

**上述范围是这个一维二次目标、全梯度、恒定学习率和精确算术下的结果。** 它不是所有损失的安全学习率，更不是神经网络或 SGD 的保证。第 5 节已经给出反例：$\eta=0.5$ 虽在这个确定性范围内，单记录随机更新仍把最优点推开。学习率调度、动量等会改变分析，本页不把它们套进同一递推式；实际浮点运算也会有舍入或溢出。

## 8. 梯度裁剪的一个边界提醒

裁剪会把过大的梯度范数限制到阈值，Pascanu 等人的研究用它缓解 RNN 的梯度爆炸；这是一种控制更新幅度的方法，不能代替学习率选择，也不保证收敛。[9]

裁剪是非线性的，“每个样本先剪再平均”与“先平均再剪”通常不同。仍用这两条记录，在 $\theta=1/2$ 时梯度为 $(1/2,-3/2)$。若标量裁剪到 $[-1,1]$，先剪再平均得到 $-1/4$；先平均再剪得到 $-1/2$。因此不能把剪裁后的估计自动称为原全梯度的无偏估计。即使步长被限制，也可能来回震荡：本例若将全梯度裁剪到 $[-1,1]$，取 $\eta=3$，就会从 $\theta=0$ 走到 $3$，再回到 $0$，循环下去。裁剪不等于把坏学习率变成好学习率。

## 9. 可运行实验：更新、抽样枚举与学习率

下面保留分类器的有限差分检查，再运行独立的二次例子。所有抽样结果都被枚举，不依赖一次随机种子碰巧产生的轨迹。

新增的 `quad_` 函数只服务于固定目标 $y=(0,2)$：`quad_loss(theta)` 返回整个训练集的平均损失；`quad_gradient(theta, indices)` 返回所列记录在同一参数处的平均梯度；`quad_step(theta, eta, indices)` 只更新一次。`indices` 必须是长度为 1 或 2 的列表或元组，元素为内置整数 `0` 或 `1`，允许重复；默认 `(0, 1)` 是全梯度。标量只接受可转为有限浮点数的内置 `int/float`，不接受布尔值，学习率非负；结果溢出也报 `ValueError`。允许零学习率，是为了观察“不更新”的边界，不代表它能学到东西。


```python
# nextchina-example: training
import math

h, target, rate = 2.0, 0, 0.1
weights = [0.0, 0.0]

def probabilities(w):
    z = [v * h for v in w]
    m = max(z)
    exps = [math.exp(v - m) for v in z]
    return [v / sum(exps) for v in exps]

def loss(w):
    z = [v * h for v in w]
    m = max(z)
    return m - z[target] + math.log(sum(math.exp(v - m) for v in z))

p = probabilities(weights)
gradients = [(v - int(i == target)) * h for i, v in enumerate(p)]
eps = 1e-5
for i in range(len(weights)):
    plus, minus = weights.copy(), weights.copy()
    plus[i] += eps
    minus[i] -= eps
    numeric = (loss(plus) - loss(minus)) / (2 * eps)
    assert abs(numeric - gradients[i]) < 1e-8

updated = [w - rate * g for w, g in zip(weights, gradients)]
assert gradients == [-1.0, 1.0]
assert updated == [0.1, -0.1]
assert loss(updated) < loss(weights)
assert abs(loss(updated) - 0.5130152523999526) < 1e-12
print(round(loss(weights), 6), round(loss(updated), 6))

# Independent scalar example: y = (0, 2); do not overwrite classifier globals.
def quad_finite(value):
    if type(value) not in (int, float):
        raise ValueError("expected a built-in int or float, not bool")
    try:
        value = float(value)
    except OverflowError:
        raise ValueError("number cannot be represented as a finite float") from None
    if not math.isfinite(value):
        raise ValueError("non-finite input or result")
    return value

def quad_loss(theta):
    theta = quad_finite(theta)
    error = theta - 1.0
    return quad_finite(0.5 * error * error + 0.5)

def quad_gradient(theta, indices=(0, 1)):
    theta = quad_finite(theta)
    if (type(indices) not in (list, tuple) or len(indices) not in (1, 2)
            or any(type(i) is not int or i not in (0, 1) for i in indices)):
        raise ValueError("indices must contain one or two integer IDs, 0 or 1")
    return quad_finite(sum((theta - (0.0, 2.0)[i]) / len(indices)
                           for i in indices))

def quad_step(theta, eta, indices=(0, 1)):
    theta, eta = quad_finite(theta), quad_finite(eta)
    if eta < 0:
        raise ValueError("learning rate must be nonnegative")
    return quad_finite(theta - eta * quad_gradient(theta, indices))

quad_single = tuple(quad_gradient(1, (i,)) for i in (0, 1))
quad_single_losses = tuple(quad_loss(quad_step(1, 0.5, (i,))) for i in (0, 1))
assert quad_gradient(1) == sum(quad_single) / 2 == 0
assert quad_single == (1, -1)
assert sum(g * g for g in quad_single) / 2 == 1
assert quad_single_losses == (5/8, 5/8)
assert quad_loss(1) == 1/2 < sum(quad_single_losses) / 2

quad_pairs = ((0, 0), (0, 1), (1, 0), (1, 1))
quad_batch = tuple(quad_gradient(1, ids) for ids in quad_pairs)
quad_batch_losses = tuple(quad_loss(quad_step(1, 0.5, ids)) for ids in quad_pairs)
assert quad_batch == (1, 0, 0, -1)
assert sum(quad_batch) / 4 == 0
assert sum(g * g for g in quad_batch) / 4 == 1/2
assert quad_batch_losses == (5/8, 1/2, 1/2, 5/8)
assert sum(quad_batch_losses) / 4 == 9/16
assert quad_step(1, 0.5, (0, 1)) == quad_step(1, 0.5, (1, 0)) == 1

quad_paths = {}
for quad_rate in (0, 0.5, 1, 1.5, 2, 2.5):
    quad_path = [0.0]
    for quad_iteration in range(3):
        quad_path.append(quad_step(quad_path[-1], quad_rate))
    quad_paths[quad_rate] = tuple(quad_path)
assert quad_paths[0] == (0, 0, 0, 0)
assert quad_paths[0.5] == (0, 0.5, 0.75, 0.875)
assert quad_paths[1] == (0, 1, 1, 1)
assert quad_paths[1.5] == (0, 1.5, 0.75, 1.125)
assert quad_paths[2] == (0, 2, 0, 2)
assert quad_paths[2.5] == (0, 2.5, -1.25, 4.375)

```

预期输出仍为 `0.693147 0.513015`；二次例子的结果由断言检查。第一段只验证所设分类器的一次局部更新与有限差分一致，后面的枚举才验证所声明的抽样分布与损失期望。运行成功不证明大型模型能收敛或泛化。

## 10. 真正训练还需要哪些约定？

批次决定一次估计使用哪些样本；梯度累积把多次前向/反向的结果合并后再更新。比较等效批次时，要记录平均方式、累积步数和设备数。若更新前没有按实现要求清理旧梯度，会把本来独立的迭代混在一起。

**Loss mask 与 attention mask 不同。** 某个位置不参与损失，不必然意味着模型不能读取该位置。例如指令微调可以将提示作为上下文，只在回答位置计算目标；“不计分”和“不可见”应分别配置。[1][2]

优化器状态、学习率调度、随机状态、数据进度和 tokenizer 配置共同影响恢复训练。只保存权重，未必能从中断位置继续同一条训练轨迹。这是本页提出的复现实验记录要求，而不是宣称所有框架自动保存同样信息。

## 11. 预训练、SFT、RLHF、DPO 的位置

预训练和监督微调可以采用相同的 token-level 预测形式，但数据和监督目标的范围不同。SFT 并不是只修改提示词；它涉及参数优化。Ouyang 等人的研究把演示数据微调与基于偏好反馈的后续优化连接起来，但其结果不能保证模型不再出错。[3]

DPO 使用偏好对构造优化目标，和“给每个正确 Token 做普通交叉熵”不是同一个目标。可以继续用“前向、目标、梯度、更新”检查其流程，但不能因为都要更新参数，就认为不同的后训练方法优化同一件事。[4]

本页不展开每种后训练算法，也不把这个两参数例子称为完整 RLHF 实验。对应独立分支需要继续补齐数据、目标、假设与复现。

## 12. 为什么训练损失低不等于榜单高？

训练集与测试集不同，目标函数与评测任务也可能不同。模型可能记住训练样本，却在新问题上失败。困惑度还依赖 tokenizer、语料与平均口径；没有统一这些条件，单独比较数字并不可靠。

建议将训练记录与 [能力、评测与榜单](?view=garden&scope=branch:llm:rankings) 分开阅读：前者描述如何优化，后者描述在某个协议下测到了什么。这里不会把一次 loss 下降自动写成模型排名提升。

参数更新之外，[RAG](?view=garden&scope=hub:rag) 是把外部材料带入系统的一类方法，上下文学习则通过输入示例影响当前计算；它们都不应因为“给了新信息”就被误称为同一种训练。

## 13. 读完后的自检

1. 不运行代码，先写出分类器更新后的目标概率，再对照 `probabilities(updated)[0]` 是否约为 $0.598688$。说明反向传播和优化器各负责哪一步
2. 从 $\theta=1$ 出发，分别算出单记录更新和两次有放回平均梯度更新的期望损失。应得到 $5/8$ 与 $9/16$，而不是把 $F(\mathbb E[\theta'])=1/2$ 当成答案
3. 将两次抽样改成无放回，说明为什么在同一参数处计算时方差为零；再算“先取目标 $0$ 更新，再取目标 $2$ 更新”。当 $\eta=1/2$ 时后者到达 $1.25$，不是一次全梯度更新后的 $1$
4. 将学习率从 $0.5$ 改为 $2$ 和 $2.5$，观察与最优点的距离；把目标改为总和后，重新推出阈值，不能只复制原学习率
5. 尝试 `quad_gradient(1, [])`、`quad_gradient(1, (True,))`、`quad_step(1, -0.1)` 或非有限参数，应收到 `ValueError`。再解释 `eta=0` 为什么合法却不会学习
6. 指出哪个 mask 控制可见性、哪个控制计分；说明均匀抽训练记录为何不能取代数据划分与任务评测，也不能证明朴素贝叶斯的条件独立假设

继续阅读 [Token 表示](?view=garden&scope=branch:llm:math/tokenization)、[Softmax 与交叉熵](?view=garden&scope=branch:llm:math/softmax)、[推理中的 KV Cache](?view=garden&scope=branch:llm:inference/kv-cache)。

## 来源与范围

[1] [Hugging Face：Causal language modeling](https://huggingface.co/docs/transformers/en/tasks/language_modeling) 与 [GPT-2 模型接口](https://huggingface.co/docs/transformers/model_doc/gpt2)。前者说明 next-token 与因果可见性；后者的 `labels` 契约明确模型内部移位。具体接口应按使用版本核对。

[2] [PyTorch CrossEntropyLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html)，另核对 [本次 stable 入口指向的 2.14 版文档](https://docs.pytorch.org/docs/2.14/generated/torch.nn.CrossEntropyLoss.html)。用于 logits、类别索引标签的 `ignore_index` 和 reduction 契约；加权或软标签时的平均方式不能直接照抄本页的无权重例子。

[3] Ouyang 等，[Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)。

[4] Rafailov 等，[Direct Preference Optimization](https://arxiv.org/abs/2305.18290)。

[5] [Dive into Deep Learning：Stochastic Gradient Descent](https://d2l.ai/chapter_optimization/sgd.html)，§12.4.1。用于固定有限和目标、均匀抽取记录及梯度期望的定义。

[6] [Dive into Deep Learning：Minibatch Stochastic Gradient Descent](https://d2l.ai/chapter_optimization/minibatch-sgd.html)，§12.5.2。用于平均梯度与独立抽样下的方差缩减；本页另外枚举无放回的二记录边界。

[7] [Goodfellow、Bengio、Courville：Deep Learning，第 8 章](https://www.deeplearningbook.org/contents/optimization.html)，§8.1 与 §8.1.3。用于区分优化与学习，以及全批量与小批量的背景；本页的无偏结论以自己的有限和证明为准，不把独立性写成其必要条件。

[8] [Dive into Deep Learning：Gradient Descent](https://d2l.ai/chapter_optimization/gd.html)，§12.3.1。用于学习率、步长与越过最优点的背景；本页 $0<\eta<2$ 的具体范围由所写二次目标自行推导。

[9] Pascanu、Mikolov、Bengio，[On the difficulty of training recurrent neural networks](https://proceedings.mlr.press/v28/pascanu13.pdf)，§3.2、Algorithm 1。仅用于梯度范数裁剪的机制与研究背景，不作为普遍收敛保证。

本页来源核对与教学扩写日期为 2026-10-05。二记录目标、抽样枚举、裁剪次序反例、数值推导与标准库代码为本项目教学构造，未进行大型模型训练或商业 API 实测。
