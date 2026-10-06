> **本页解决的问题**：首个输出何时到达、后面的流有多快、一批请求完成多少，以及最慢的一尾，分别应该从哪段时间、哪一组记录计算？为什么同一份日志里几个“Token/s”都算对了，却不能互相替代？
>
> 前置知识：[Token 与分词](?view=garden&scope=concept:tokenization)帮助你确认计数单位；[期望与方差](?view=garden&scope=concept:expectation-variance)帮助你区分平均与分布；[评测协议](?view=garden&scope=concept:benchmark-protocol)说明比较条件。以下时间、计数和请求全部为原创教学构造；程序只复算日志，不连接模型、服务器或 GPU。

## 1. 先画清四个边界

假设客户端发出一次生成请求，之后陆续收到内容，最后确认请求成功。最少应区分：

| 符号 | 本页记录的事件 |
| --- | --- |
| $s$ | 客户端发出请求 |
| $a_1$ | 首个非空内容块到达 |
| $a_m$ | 最后一个内容块到达 |
| $e$ | 观察到成功、错误或超时的终止事件 |

时间都来自**同一个单调时钟**，单位为毫秒。单调时钟用于测间隔，避免把系统日期校准造成的跳变当成请求耗时。多个客户端各自记录的计时起点不能直接拼成同一时间轴；跨机汇总需要另行解决时钟对应关系。本页没有做这种同步。Python 对单调时钟的契约也强调只使用同一时钟读数的差值。[Python 3.12，time.monotonic](https://docs.python.org/3.12/library/time.html#time.monotonic)

“内容块”是客户端一次收到的非空输出内容。HTTP 头、空的流式消息、心跳、结束标记都不在内容块列表里。**首 Token 时延（TTFT）** 在本页具体指：

$$
\operatorname{TTFT}=a_1-s
$$

如果一个块里装了多个 Token，这实际是“首个含 Token 的内容块到达时延”。它没有把块内每个 Token 单独计时。若完全没收到内容，TTFT 未知，返回 `None`，不能把超时时长填进去。

TTFT 也不是 HTTP 首字节时间。协议字节可能先到，用户可读的内容还没到。它可能包含网络传输、排队、输入处理、首个输出产生和客户端交付等过程，不能只看一个 TTFT 数就定位为“预填充算得慢”。[NVIDIA AIPerf Metrics Reference，TTFT 与 HTTP Waiting 条目](https://docs.nvidia.com/aiperf/reference/ai-perf-metrics-reference)

另两段时间是：

$$
L=e-s
$$

$$
D=a_m-a_1
$$

$L$ 对成功请求是本页的**成功终止时延**；对错误、超时请求只是到相应终止观察的时长。$D$ 是首块之后到末块的观察区间，本页只有至少两块时才给出。末内容和成功终止不一定同时发生，因此不能总拿 $L-\operatorname{TTFT}$ 代替 $D$。

例如请求 D 在 0 ms 发出，100、200 ms 各收到一个 Token，260 ms 才收到成功确认。它的 TTFT 是 100 ms，末内容时延是 200 ms，成功终止时延是 260 ms，而首后区间是 100 ms。把结束控制消息当成第三个 Token，会同时改坏计数和区间。

## 2. 一次请求里的“生成速度”至少有两种

### A、B 的逐条记录

先看两个成功请求。每个列出的内容事件**恰好一个 Token**，最后内容到达即确认成功。它们在同一时间轴上重叠执行。

| A 的事件 | 时刻/ms |
| --- | ---: |
| 发出 | 0 |
| 内容 1 | 100 |
| 内容 2 | 200 |
| 内容 3 | 300 |
| 内容 4，成功 | 500 |

| B 的事件 | 时刻/ms |
| --- | ---: |
| 发出 | 100 |
| 内容 1 | 400 |
| 内容 2 | 500 |
| 内容 3，成功 | 600 |

A 总共得到 4 个 Token，TTFT 为 100 ms，成功终止时延为 500 ms。B 得到 3 个 Token，TTFT 为 300 ms，成功终止时延也为 500 ms。**同样的完成时间长度，不表示同样快地开始输出。**

### 整次速率与首后速率

记总 Token 数为 $N$，首块包含 $c$ 个 Token。本页用两个明确名称，避免只写裸的 TPS：

$$
R_{\rm whole}=\frac{1000N}{e-s}
$$

这是**整次请求输出速率**，分子含首块，分母从发出直到成功终止。

$$
R_{\rm post}=\frac{1000(N-c)}{a_m-a_1}
$$

这是**首块之后输出速率**，只计算首块之后到达的 Token，以首块到末块为分母。两者单位都是 Token/s；乘 1000 是把毫秒换算成秒。此处的“速率”描述客户端看到的输出节奏，不是 GPU 在某一时刻的生成吞吐。

对 A：

$$
R_{\rm whole}=1000\times4/500=8
$$

$$
R_{\rm post}=1000\times3/400=7.5
$$

对 B：整次速率为 $1000\times3/500=6$，首后速率为 $1000\times2/200=10$。A 更早开始，B 开始后更快；只报“速度更快”会掩盖选择的指标。

每块恰好一个 Token 时，A 的三个相邻 Token 间隔是 100、100、200 ms，算术平均为 $400/3$ ms；B 的两个间隔是 100、100 ms，平均为 100 ms。此时“1000 除以平均间隔”恰好等于上述首后速率。**先平均间隔再取倒数，与先把每个间隔转成速率再平均，也不是同一操作。** A 的逐间隔速率为 10、10、5，平均 $25/3$，不是 $15/2$。

### 为什么包含 TTFT 的速率反而可能更大？

不能仅因分母加入 TTFT，就断言整次速率必然更小：分子也加入了首块的 Token。设成功终止与末内容重合，$f=\operatorname{TTFT}>0$，$d=D>0$。约去共同的单位因子后：

$$
\frac{N}{f+d}>\frac{N-c}{d}
$$

等价于：

$$
cd>(N-c)f
$$

A 的左边是 400，右边是 300，所以整次速率 8 大于首后速率 7.5；B 则相反。若终止还比末内容晚 $h$，右边要改为 $(N-c)(f+h)$。这是一段给定计数下的代数比较，不是鼓励人为增加首块大小来提高服务质量。

## 3. Token、块与不可观察的间隔

### C：第一块就有三个 Token

C 在 0 ms 发出，100 ms 收到含 3 个 Token 的块，400 ms 收到含 2 个 Token 的块并成功。总数是 5，首后区间为 300 ms，**首后新增数是 2**：

$$
R_{\rm post}=1000\times2/300=20/3
$$

若机械地用 $N-1$，会把首块里的另两个 Token 也算进首后区间，得到 $40/3$ Token/s，恰好高估一倍。整次速率则为 $1000\times5/400=25/2$ Token/s。

这里直接观测到的只有**一个块间隔：300 ms**。5 个有序 Token 有 4 处相邻关系，其中 3 处发生在块内，日志没有给它们各自的时间戳；跨块那处也不能直接当成两次服务器生成之间的时间。程序因此不给 C 返回逐 Token 间隔均值。

你可以人为把同一块里的所有 Token 都赋上同一个接收时刻，于是构造出 0、0、300、0 ms 的“逐 Token 间隔”。这是把块级时间摊到 Token 上的约定，不能宣传成恢复了块内生成时间或更细的交付测量。把 300 ms 除以首后两个 Token 得到 150 ms，也只是这个观察窗口的 Token 归一化时长，不能说“测得两个真实 Token 间隔各为 150 ms”。

### S：只有一个 Token

S 在 20 ms 发出，120 ms 收到唯一一个 Token 并成功。TTFT 和成功终止时延均为 100 ms，整次速率为 10 Token/s。没有首块之后的 Token 或相邻间隔，首后速率和平均 Token 间隔都返回 `None`。零表示一个实际数值，无穷大暗示瞬间完成正量输出；两者都没有这里的证据。

### 计数政策必须和时间政策一起公开

本页的增量来自**预先给定的同一套合成 Token ID 计数**，只包含输出内容，不含输入、隐藏推理和控制/特殊 Token。程序接收计数，不执行分词。在真实资料里至少应记录分词器及版本、特殊 Token 规则、推理 Token 的归属，以及数量来自服务端还是客户端。

一个常见错误是把每个文本块分别重新分词，再把数量相加。块边界未必是分词边界，拼接后的分词结果可能不同；仅知道最终文本总数，也不代表知道首块具体贡献多少个最终 Token。没有可靠的逐块增量，就不要把本页需要 $c$ 的公式伪装成精确已知量。AIPerf 的 ITL 文档区分默认首块假设与可选逐块计数修正；本页遇到无效计数直接报错，不照搬其回退行为。[AIPerf Metrics Reference，ITL 与 Output Token Count 条目](https://docs.nvidia.com/aiperf/reference/ai-perf-metrics-reference)

## 4. 吞吐量的分母是一段共同时间

### 同时服务了多少工作？

用共同观察窗口 $[0,600]$ ms 包住 A、B。成功输出共 $4+3=7$ 个 Token，成功请求共 2 次。**聚合成功输出吞吐**为：

$$
H_{\rm tok}=\frac7{0.6}=\frac{35}3\ \text{Token/s}
$$

**聚合成功请求吞吐**为：

$$
H_{\rm req}=\frac2{0.6}=\frac{10}3\ \text{次/s}
$$

两者分母都是这段共同时间，不是两次请求时延的和。A、B 各经历 500 ms，但其中一部分在重叠发生。两者分子也不同；生成更长可能增加 Token 数，却不增加成功请求数，更不自动增加用户拿到的有效答案数。

### 三种“平均速度”不要互换

同一份 A、B 日志还可以算出：

1. **等请求平均首后速率**：$(7.5+10)/2=8.75$ Token/s，每个合格请求一票
2. **合并首后区间的速率**：$(3+2)/(0.4+0.2)=25/3$ Token/s，以各请求首后时长作权重
3. **共同窗口的聚合吞吐**：$7/0.6=35/3$ Token/s，包含成功请求的首块，分母只走一次共同时间

A、B 的五个后续 Token 间隔合在一起，平均为 $(400+200)/5=120$ ms，其倒数对应第 2 项。它不是把两个请求的平均间隔各算一票，更不是第 3 项。若请求持续时间或输出长度不同，权重差别会更加明显。

这三项分别回答“典型被等权请求的速率”“合并这些后续观察区间的速率”“这段共同时间完成多少输出”。它们都可以计算，却不能只换个列名后当成一个指标。

### 改发送时刻，单请求数值可以不变

把 B 的所有时刻整体向后移 400 ms：发出变为 500，内容变为 800、900、1000，成功也在 1000。B 的所有自身间隔和速率保持不变，A 也不变；但包住整批的窗口变为 $[0,1000]$，于是聚合吞吐变为 7 Token/s 和 2 次/s。

另外，即使原日志一动不动，只把观察窗口声明成 $[0,1000]$，这两个聚合值也同样变小。后面 400 ms 的空闲属于分母。这两个不同操作说明：**比较吞吐前要固定到达方式、并发和窗口规则。** 它们不是一次真实调度优化实验，不能证明把真实请求重叠起来就一定提升多少性能。

程序要求所有请求从发出到终止都包含在声明窗口里；跨窗口的请求直接拒绝，不偷偷裁剪。生产环境可以采用其他明确的窗口政策，但不能拿本页这个“完整包住一批请求”的结果冒充长期稳态容量。

## 5. 尾部时延：均值不会告诉你最慢一尾

**尾部时延**关注时延分布的高端，例如 p95、p99。先说清正在对什么取百分位：本节只对成功请求的“发出到成功终止”时延取值，不把 TTFT、块间隔和终止时延混在一个样本里。

### 一个可手算的经验百分位约定

把 $n$ 个观测从小到大排好，写成 $x_{(1)},\ldots,x_{(n)}$。本页选择**最近秩法（nearest rank）**：

$$
k=\lceil np\rceil,\qquad Q_p=x_{(k)}
$$

其中 $0<p\le1$，向上取整，不插值。它等于经验分布中“累计比例第一次达到 $p$ 的观测值”。软件还可能选择插值等其他定义；不报约定，小样本百分位很容易对不上。本页分位参数用精确分数，例如 `Fraction(99, 100)`，避免浮点误差改变整数边界。

构造 L 组：19 个成功请求各用 50 ms，另 1 个用 1050 ms。它们都在 0 ms 发出，各在终止时收到唯一一个 Token。另造 U 组：20 个成功请求全部用 110 ms。两组只是分开的教学样本。

| 成功时延摘要 | L | U |
| --- | ---: | ---: |
| 样本数 | 20 | 20 |
| 均值/ms | 100 | 110 |
| p95/ms | 50 | 110 |
| p99/ms | 1050 | 110 |

L 的均值来自 $(19\times50+1050)/20=100$。p95 的秩是 $\lceil20\times0.95\rceil=19$，所以还是 50；p99 的秩是 $\lceil20\times0.99\rceil=20$，于是取到 1050。U 的每一个排序位置都是 110。

L 的均值较小，p99 却大得多。若用户任务要等待多个子请求全部完成，最慢的一个还可能决定总等待时间。比如两个子任务分别 30 和 240 ms 完成，忽略额外合并开销，也得等到 240 ms；不是它们的平均 135 ms。历史论文《The Tail at Scale》讨论了共享资源、排队和扇出如何让尾部成为服务体验问题；本页不沿用论文测量数值，也不假定子请求彼此独立。[Dean 与 Barroso，2013，印刷页 76](https://barroso.org/publications/TheTailAtScale.pdf)

### 20 个样本的 p99 有多大解释力？

在本约定下，它就是样本最大值。改变一个最大记录就可能显著改变 p99；20 个值只有 5% 的经验概率步长，不能因为列名叫 p99 就声称测到了稳定的总体第 99 百分位。

即使额外假定请求独立同分布，若总体有 1% 的概率超过某阈值，20 次恰好一次都没超过的概率仍为 $0.99^{20}\approx0.818$。这只是一段明确假设下的概率演算，用来说明“样本里没看到”并不等于“不会发生”。真实请求可能受时间段、排队和共享资源影响；本页没有证明独立同分布，也没有计算总体分位数置信区间。

要把观察变成服务承诺，需要定义目标工作量、重复运行和不确定性、失败政策以及达标判据。[评价数据集](?view=garden&scope=concept:evaluation-dataset)中的覆盖问题，在时延样本里同样存在。

### 为什么不能把各分片 p99 平均？

把 L 的前 19 个 50 ms 放在分片一，把 1050 ms 放在分片二。两片 p99 分别是 50 和 1050。简单平均得到 550；按样本数加权得到 $(19\times50+1050)/20=100$。**两者都不等于合并样本的 p99：1050。**

均值能用数量和总和合并，百分位一般不能只靠各片某个百分位和样本数恢复。应合并原始样本，或使用能按兼容规则合并的分布资料并交代近似误差；不能把“支持合并的分布”误解为“把几个 p99 算平均”。

## 6. 超时不能从分母里消失

给 L 再加一个请求 T：在 0 ms 发出，没有任何内容，5000 ms 超时并取消。窗口因此扩为 $[0,5000]$。

- 成功请求仍是 20 个，其成功时延 p99 仍为 1050 ms，必须标注“仅成功样本，n=20”
- 总尝试数是 21，超时数是 1，超时比例为 $1/21$；这条记录不能悄悄删去
- 共同窗口里成功请求吞吐为 $20/5=4$ 次/s；每个成功请求只有一个 Token，所以成功输出吞吐也为 4 Token/s，数值相同但单位不同
- T 没有首内容，TTFT 为 `None`；5000 ms 是到超时观察的时长，不能当成“5000 ms 成功完成”加入成功时延样本

从完成时间的角度，T 在观察截止处没有给出完成值，这就是需要单独处理的**删失信息**。取消后甚至没有继续观察它会不会完成；不能擅自补出一个未来完成时刻。本页不作生存模型拟合，也不从“成功样本 p99 达标”推出“全体请求达标”。

再看部分输出后的错误：E 在 10 ms 发出，60 ms 收到 2 个 Token，90 ms 报错。它有已观察到的 TTFT 50 ms、到错误的时长 80 ms，以及 2 个部分 Token，但没有成功完成。本页不给失败请求计算完整请求输出速率；这些部分 Token 也不进入**成功输出**吞吐的分子。

把 A、B、T、E 放进 $[0,5000]$ 窗口：4 次尝试，2 次成功，1 次错误，1 次超时；成功 Token 为 7，部分 Token 为 2。成功输出吞吐 $7/5=1.4$ Token/s，成功请求吞吐 $2/5=0.4$ 次/s。若另有目的要统计所有已交付内容，须另命名并明确其失败部分，这里不能悄悄把分子换成 9。

重试也必须有规则。本程序里的 ID 标记一次尝试，不把多次尝试合成一个用户任务。如果一个用户任务经历失败后重试，用户总等待时间和尝试级时延不是同一个量；不能保留最后成功的一次，忘掉前面的时间与代价。

## 7. 换成图像分类，哪些量仍然成立？

两个普通图像分类请求 X、Y 的发出与成功终止时刻分别为 $(0,80)$、$(20,120)$ ms。它们各返回一次类别结果，没有 Token 流。单次时延为 80、100 ms，均值为 90 ms；在 $[0,120]$ 共同窗口，成功请求吞吐为：

$$
2/0.12=50/3\ \text{次/s}
$$

最近秩法对这两个成功时延算出的 p95、p99 都是 100 ms，只是极小样本的最大值。没有内容 Token 事件，就不该硬造 TTFT 或 Token/s。检索接口、分类服务、图像分析中的请求时延和吞吐也遵循这种分子、分母、样本范围核对；生成特有的 Token 指标不能直接搬过去。

真正对照两套服务时，至少把下列条件放在结果旁边：

1. **任务与长度**：输入、输出长度分布、质量要求、停止规则、模型及分词版本
2. **到达与并发**：预定发送时间表或到达过程、并发上限、队列策略、客户端是否会等上一个完成后才发下一个
3. **计时位置**：客户端或服务端、时钟与精度、首内容定义、末内容和终止定义、网络与连接状态
4. **观察范围**：预热/测量窗口、是否包含空闲、跨窗请求政策、成功/错误/超时和重试数量
5. **汇总规则**：每请求或合并区间的权重、百分位算法、样本量、重复运行、未观察到的范围

只让固定数量的用户“上一条完成后再发下一条”，与按外部预定节奏持续到达，不是在施加同一负载。服务变慢时，前一种方式还可能自动减少后续发出次数。因此两份吞吐数不能在缺少到达证据时被解释成设备容量差异。

MLPerf Inference 的官方场景与提交规范也是比较条件的一部分；本页没有执行其负载生成器、适用规则或提交验证，不能称作 MLPerf 成绩。[MLCommons Inference Submission Guide，Scenarios 与 LoadGen](https://docs.mlcommons.org/inference/submission/)

## 8. 可运行实验：只复算给定事件

下面是一个完整的 Python 标准库程序。它不采集时钟、不安装工具、不发 API 请求。[`Fraction`](https://docs.python.org/3.12/library/fractions.html) 保留精确分数；`None` 表示在所选政策下无定义或不适用，不是零。

### 输入契约

三个公开函数是 `trace_metrics`、`summarize`、`nearest_rank`。下述错误统一抛出 `ValueError`；不修改输入，不把布尔值当整数，不接受相应内建类型的子类，不自动修复、排序事件或丢弃坏行。

**单条记录**是精确内建 `dict`，且恰有 `id`、`sent_ms`、`chunks`、`end_ms`、`status` 五个键：

- ID 为精确内建 `str`，1–24 个 ASCII 字母、数字、下划线或连字符
- 发送、终止时刻为精确内建 `int`，范围 0–1,000,000,000 ms；终止严格晚于发送
- 状态为精确内建 `str`，只接收 `ok`、`error`、`timeout`；没有默认成功或未知状态回退
- 块容器为精确内建 `list` 或 `tuple`，0–64 项；每项也必须是这两种容器之一，恰好两项：整数时刻、整数新增 Token 数
- 每个内容时刻严格晚于发送、严格晚于前一个内容、且不晚于终止；每块增量 1–4096，总数不超过 65536
- 成功必须至少有一个内容块；错误、超时可以为空。若真实记录因毫秒取整而出现相同时刻，本接口拒绝它，需要更合适的精度或另行公开的计时契约

**批次**是精确内建 `list` 或 `tuple`，1–64 条合法记录，ID 不重复；窗口端点同样是上述范围的精确整数且前小后大，每条记录全部在窗口内。空批次和跨窗记录均拒绝。

**分位数**输入为精确内建 `list` 或 `tuple`，1–256 个 0–1,000,000,000 的精确整数样本；参数必须是精确 `Fraction` 且在 $(0,1]$。传入浮点数 `0.99`、整数 `1` 或分数子类都拒绝。样本排序使用新副本。

### 返回值怎样读

`trace_metrics` 返回记录身份与状态、发送/终止、到终止观察的时长、Token 数、TTFT、末内容时延、首后区间、首后 Token 数和块间隔。失败记录仍可保留已观察到的内容时间，但两种完成输出速率一律为 `None`。`mean_token_gap_ms` 只对成功、至少两块、每块一个 Token 的记录返回精确分数。

`summarize` 同时返回窗口时长、尝试/成功/错误/超时数、成功与部分 Token 数、成功吞吐、成功终止时延样本，以及两种首后速率汇总。没有成功请求时，成功吞吐确实为零；没有合格首后区间时，两种首后速率汇总为 `None`。成功时延样本按输入顺序保留，计算百分位时才另行排序。

`nearest_rank` 返回所选的整数观测值。它不知道样本来自成功、TTFT 还是错误时长，调用者必须先选对样本；程序没有把函数名字当成数据政策。

```python
# nextchina-example: serving-timing-throughput-tails
from fractions import Fraction


_LIMIT = 1_000_000_000
_FIELDS = {"id", "sent_ms", "chunks", "end_ms", "status"}
_ID_CHARS = (
    "abcdefghijklmnopqrstuvwxyz"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"
)


def _integer(value, low, high):
    if type(value) is not int or not low <= value <= high:
        raise ValueError("integer type or bound")
    return value


def _sequence(value, low, high):
    if type(value) not in (list, tuple):
        raise ValueError("sequence type")
    if not low <= len(value) <= high:
        raise ValueError("sequence length")


def trace_metrics(record):
    if type(record) is not dict or set(record) != _FIELDS:
        raise ValueError("record fields")
    name, state = record["id"], record["status"]
    if (type(name) is not str or not 1 <= len(name) <= 24
            or any(c not in _ID_CHARS for c in name)):
        raise ValueError("request id")
    if type(state) is not str or state not in ("ok", "error", "timeout"):
        raise ValueError("request status")
    start = _integer(record["sent_ms"], 0, _LIMIT)
    end = _integer(record["end_ms"], 0, _LIMIT)
    if end <= start:
        raise ValueError("terminal order")
    chunks = record["chunks"]
    _sequence(chunks, 0, 64)
    if state == "ok" and not chunks:
        raise ValueError("success requires content")
    times, counts = [], []
    previous = start
    for chunk in chunks:
        _sequence(chunk, 2, 2)
        time = _integer(chunk[0], 0, _LIMIT)
        count = _integer(chunk[1], 1, 4096)
        if not previous < time <= end:
            raise ValueError("content order")
        times.append(time)
        counts.append(count)
        previous = time
    tokens = sum(counts)
    if tokens > 65536:
        raise ValueError("total token bound")
    gaps = tuple(b - a for a, b in zip(times, times[1:]))
    post = times[-1] - times[0] if len(times) >= 2 else None
    after = sum(counts[1:])
    whole_rate = post_rate = mean_gap = None
    if state == "ok":
        whole_rate = Fraction(1000 * tokens, end - start)
        if post is not None:
            post_rate = Fraction(1000 * after, post)
            if all(n == 1 for n in counts):
                mean_gap = Fraction(post, len(gaps))
    return {
        "id": name, "status": state,
        "sent_ms": start, "end_ms": end,
        "observed_ms": end - start, "tokens": tokens,
        "ttft_ms": times[0] - start if times else None,
        "content_ms": times[-1] - start if times else None,
        "post_ms": post, "after_first_tokens": after,
        "gaps_ms": gaps, "whole_rate": whole_rate,
        "post_rate": post_rate, "mean_token_gap_ms": mean_gap,
    }


def summarize(records, window_start_ms, window_end_ms):
    _sequence(records, 1, 64)
    lo = _integer(window_start_ms, 0, _LIMIT)
    hi = _integer(window_end_ms, 0, _LIMIT)
    if hi <= lo:
        raise ValueError("window order")
    metrics = [trace_metrics(r) for r in records]
    if len({m["id"] for m in metrics}) != len(metrics):
        raise ValueError("duplicate request id")
    if any(m["sent_ms"] < lo or m["end_ms"] > hi for m in metrics):
        raise ValueError("record outside window")
    good = [m for m in metrics if m["status"] == "ok"]
    post = [m for m in good if m["post_rate"] is not None]
    ok_tokens = sum(m["tokens"] for m in good)
    mean_post = pooled_post = None
    if post:
        mean_post = sum((m["post_rate"] for m in post), Fraction(0))
        mean_post /= len(post)
        pooled_post = Fraction(
            1000 * sum(m["after_first_tokens"] for m in post),
            sum(m["post_ms"] for m in post),
        )
    return {
        "window_ms": hi - lo, "attempts": len(metrics),
        "successes": len(good),
        "errors": sum(m["status"] == "error" for m in metrics),
        "timeouts": sum(m["status"] == "timeout" for m in metrics),
        "ok_tokens": ok_tokens,
        "partial_tokens": sum(m["tokens"] for m in metrics
                              if m["status"] != "ok"),
        "ok_tokens_per_s": Fraction(1000 * ok_tokens, hi - lo),
        "ok_requests_per_s": Fraction(1000 * len(good), hi - lo),
        "success_ms": tuple(m["observed_ms"] for m in good),
        "mean_post_rate": mean_post, "pooled_post_rate": pooled_post,
    }


def nearest_rank(samples, q):
    _sequence(samples, 1, 256)
    for value in samples:
        _integer(value, 0, _LIMIT)
    if type(q) is not Fraction or not 0 < q <= 1:
        raise ValueError("quantile must be an exact Fraction in (0,1]")
    # Integer ceiling, with no float conversion or interpolation.
    rank = (len(samples) * q.numerator + q.denominator - 1)
    rank //= q.denominator
    return sorted(samples)[rank - 1]


A = {"id": "A", "sent_ms": 0,
     "chunks": [(100, 1), (200, 1), (300, 1), (500, 1)],
     "end_ms": 500, "status": "ok"}
B = {"id": "B", "sent_ms": 100,
     "chunks": [(400, 1), (500, 1), (600, 1)],
     "end_ms": 600, "status": "ok"}
C = {"id": "C", "sent_ms": 0,
     "chunks": [(100, 3), (400, 2)],
     "end_ms": 400, "status": "ok"}
print("A:", trace_metrics(A))
print("A+B:", summarize([A, B], 0, 600))
print("C:", trace_metrics(C))
print("tail p95/p99:",
      nearest_rank([50] * 19 + [1050], Fraction(95, 100)),
      nearest_rank([50] * 19 + [1050], Fraction(99, 100)))
```

运行后，A 的 `whole_rate` 为 `Fraction(8, 1)`，`post_rate` 为 `Fraction(15, 2)`；A+B 的成功 Token 吞吐为 `Fraction(35, 3)`，等请求首后均值为 `Fraction(35, 4)`，合并首后速率为 `Fraction(25, 3)`。C 的平均 Token 间隔为 `None`。最后两项百分位输出依次为 50、1050。

这些输出检查公式、单位和输入政策，**不是一次性能压测**。作者在 Python 3.12.14 标准库环境运行了程序与算术/拒绝用例；独立复核状态另行保留，不把程序可运行等同于真实测量可靠或人工专家认证。

## 9. 六个容易误读的说法

1. **“TTFT 就是预填充时间。”** 客户端只看见事件边界，没有自动分离排队、输入处理和传输
2. **“每块一个 Token，不用再查。”** 这是 A、B 的构造条件，C 已给出反例
3. **“把各请求 TPS 平均，就是服务总吞吐。”** 分子范围、时间重叠和权重都可能不同
4. **“首后间隔减掉了起始等待，就不受网络影响。”** 若第一个内容延迟 10 ms、第二个延迟 40 ms，观察间隔相对原间隔会增加 30 ms；共同常数能抵消，不同交付延迟不能。客户端调度与缓冲也可能改变可见节奏
5. **“成功 p99 很好，所以所有请求都好。”** 超时或错误可能被排除在这个条件分布之外，必须同时报告它们
6. **“分片 p99 取平均或按数量加权即可。”** L 的两片构成了明确反例，合并时要保存足够的分布信息

此外，较长输出常会把一次性的等待摊薄，而较短输出可能较早满足需求。比较时应同时看输出长度、质量要求和用户任务完成；不能仅靠一个 Token/s 列宣布总体更优。

## 10. 练习与可核对答案

先遮住答案，写出分子、分母、单位、样本范围，再算数值。

### 练习

- **T1**：B 的 TTFT、整次速率、首后速率各是多少？把三个内容时刻都向后移 50 ms，但发送不变、成功仍与末内容重合，会改变哪些值？
- **T2**：D 的末内容在 200 ms、成功确认在 260 ms。求其两种输出速率；如果误用成功终止减首内容作为首后分母，会得到什么？
- **T3**：C 首块三个、后块两个 Token。为什么用 $N-1$ 会多计？能否从日志恢复四个真实相邻 Token 的生成间隔？
- **T4**：原 A、B 不变，只把窗口延长到 1000 ms。成功 Token 吞吐、请求吞吐和等请求首后均值分别怎样变？
- **T5**：L 的 p95、p99 各取哪一个排序位置？两片 p99 的简单平均和加权平均为什么都不对？
- **T6**：L 加 T 后，成功样本量和总尝试数各多少？5000 ms 能否代替 T 的成功时延？
- **T7**：一份报告只给“TPS=12，p99=800 ms”。至少追问哪四件事，才知道它在描述什么？

### 答案

**T1**：原 B 为 300 ms、6 Token/s、10 Token/s。只把内容和成功整体延后 50 ms 后，TTFT 为 350 ms，成功终止时延为 550 ms，整次速率 $3000/550=60/11$ Token/s；首后区间仍 200 ms，首后速率仍为 10。这里不是把 B 的发送也一起平移，因此不是整条记录的平移不变性测试。

**T2**：整次速率 $2000/260=100/13$ Token/s；首后速率 $1000/(200-100)=10$ Token/s。误把结束确认也放进首后区间，会得到 $1000/(260-100)=25/4$ Token/s，混入了末内容之后的 60 ms。

**T3**：正确首后新增数是 $5-3=2$，错误写法是 $5-1=4$，多了首块里的两个 Token，结果翻倍。日志只给一个块间隔，没有提供全部四个逐 Token 生成间隔；人为赋时或平均分摊不能补出它们。

**T4**：成功 Token 吞吐为 7 Token/s，请求吞吐为 2 次/s；等请求首后均值仍为 8.75 Token/s，因为两条记录各自完全没变。合并首后速率也仍为 $25/3$ Token/s。

**T5**：取第 19、20 位，分别为 50、1050 ms。分片 p99 简单平均为 550 ms，按 19:1 加权为 100 ms，都不是合并 p99 的 1050 ms；平均几个位置值丢失了合并后排序的信息。

**T6**：20 个成功样本、21 次尝试，超时比例 $1/21$。5000 ms 是截至取消仍未成功的观察时长，不是观测到的成功完成值。应并列报告成功分位数与超时，而不是偷偷填值或删除失败。

**T7**：例如：TPS 具体分子/分母是什么；Token 计数和块边界如何确定；p99 对哪种时延和哪些状态取值、使用何种算法、有几个样本；共同窗口、到达方式与并发是多少。还应查任务、长度、质量、失败/重试和计时位置。缺少这些信息，12 与 800 不能支持可靠的系统比较。

## 11. 来源范围与继续阅读

本页的记录、数值、反例、代码和练习均为原创构造。公式以本文声明的事件与计数契约为准，不复刻某个工具的全部实现。\
来源核对日期：**2026-10-05**。

- [NVIDIA AIPerf Metrics Reference](https://docs.nvidia.com/aiperf/reference/ai-perf-metrics-reference)：核对时页面标示 Latest v0.13.0。用于核对 TTFT、块/Token 区别和不同聚合层级。它是可变页面；本页不采用整次速率必较小、流内间隔完全不受网络影响等宽泛表述，也不把其末内容口径与本文独立终止事件混用
- [Dean 与 Barroso，《The Tail at Scale》](https://research.google/pubs/the-tail-at-scale/)及[作者 PDF](https://barroso.org/publications/TheTailAtScale.pdf)：2013 年历史论文，本文只借助印刷页 76 的尾部与扇出动机，没有搬用其测量结果
- [MLCommons Inference Submission Guide](https://docs.mlcommons.org/inference/submission/)：核对场景与负载生成器的角色；没有把当前规则套给这份手工轨迹，也没有复述版本敏感的达标阈值
- [Python 3.12 的 Fraction](https://docs.python.org/3.12/library/fractions.html)与[单调时钟](https://docs.python.org/3.12/library/time.html#time.monotonic)：分别用于精确有理数及计时边界说明；代码只使用前者，没有实际采集时钟
- [NVIDIA GenAI-Perf 文档](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/perf_analyzer/genai-perf/README.html)：核对时已公告逐步退出、停止新功能开发；这里只说明资料状态，不把它作为当前安装推荐，本页也没有运行它

下一步可回到[评测协议](?view=garden&scope=concept:benchmark-protocol)，把计时、计数和失败政策写进可复查的比较条件；再用[评价数据集](?view=garden&scope=concept:evaluation-dataset)检查请求样本代表哪些实际负载。数学计算相同，不代表观察对象、实验条件或可外推范围相同。
