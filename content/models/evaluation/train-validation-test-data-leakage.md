> **本页解决的问题**：模型没有见过测试标签，也没有用测试集更新梯度，为什么评估仍可能误导我们？怎样让训练、选方案与最终报告各守自己的信息边界？
>
> 前置阅读：[统计推断与置信区间](?view=garden&scope=branch:llm:rankings/methodology) 帮你区分“这份试卷的分数”和“目标总体的表现”；[训练循环](?view=garden&scope=branch:llm:training/loop) 说明参数更新与标签移位。本页独立讲解训练、验证、测试的职责与数据泄漏，适用于一般预测任务。Python 3.8+ 实验仅用标准库，全部数据为人为构造。

## 1. 三个集合隔离的是信息职责

先写预测任务：为谁预测、在什么时刻预测、预测多远之后的什么结果、当时能拿到哪些字段。没有这些约定，“随机分成 8:1:1”也无法说明评估是否合适。

- **训练集 $T$**：拟合模型参数，以及需要从数据学习的预处理状态
- **验证集 $V$**：比较和选择方案，包括超参数、特征、决策阈值、早停轮数、提示词，以及人工根据结果作出的修改
- **测试集 $S$**：在方案冻结之后作最终评估，不再据此挑选本轮要报告的方案

用 $A$ 表示训练过程，$\lambda$ 表示候选方案，$L_V$ 表示验证损失，可以把基本流程写成三个短步骤：

$$
\begin{aligned}
f_\lambda&=A(T,\lambda)\\
\lambda^*&=\arg\min_\lambda L_V(f_\lambda)\\
\text{报告}&\quad L_S(f_{\lambda^*})
\end{aligned}
$$

即使验证标签没有参加梯度计算，也通过 $\lambda^*$ 影响了最终选择。scikit-learn 官方文档用训练、验证、测试分工说明这一点，并警告在测试集上调参会让测试信息进入方案。[1]

这不是规定必须有三个固定文件，也没有放之四海而皆准的比例；样本量、群组数量、时间跨度和所需估计精度都会影响设计。若预先约定“选完方案后，用 $T\cup V$ 重拟合”，就应对这个重拟合后的模型做保留测试。旧模型的测试分数不能直接充当新模型的分数。

## 2. 划分之前，先决定要泛化到谁

把“行不重复”“实体不重复”“时间向前”分开检查。实体可以是用户、设备、原始文档或一次事件；同一实体的多条记录往往共享信息。

**目标一：预测未见实体。** 若要知道模型对新设备是否有效，就应把同一设备的相关记录放在同一侧；验证、测试设备不能已经出现在对应训练数据里。按类别分层可以维持类别比例，却不能替代实体隔离。[1]

**目标二：预测已知实体的未来。** 若部署时本来就知道某设备过去的记录，同一设备跨集合未必有错。关键是训练信息早于预测时点，历史聚合不能读取未来，训练所用标签也必须已经产生并可获得。时间切分服务于这种问题，不等于自动完成字段审核。

**两个目标同时存在时**，例如“下个月首次出现的新设备”，需要同时考虑实体与时间约束。只做 group split 不会移除未来字段；只按日期排序也不会修复跨越截止点的统计窗口或延迟产生的标签。

普通行级随机切分更接近把行视作可交换样本的设定；有群组依赖或时间结构时，这个假设需要重新检查。官方文档分别提供分组与时间序列切分，正是因为它们回答的泛化问题不同。[1] 选了某个切分器，不等于目标总体已经有代表性。

## 3. 没读测试答案，也能跨过信息边界

这里采用一个明确的**固定归纳式评估协议**：拟合时不使用保留样本的特征或标签来学习模型、预处理状态；部署时对新输入应用已经冻结的规则。数据泄漏指构建或选择预测方案时，使用了这个任务与协议下本不应获得的信息。[2]

### 路径 A：先用全量数据学预处理，再切分

均值中心化、缺失值填补、词表构建和特征选择都可能学习数据状态。正确顺序是先确定切分，在当前训练折上 `fit`，再用同一状态对验证和测试做 `transform`。无须学习状态的固定逐行运算，例如预先规定把米换算成厘米，与估计全量均值不同。[2]

以中心化为例：

$$
\begin{aligned}
\mu_T&=\frac{1}{|T|}\sum_{i\in T}x_i\\
x'_j&=x_j-\mu_T
\end{aligned}
$$

第二行对训练、验证、测试都使用已经确定的 $\mu_T$。如果改用全量均值，测试特征就影响了拟合状态；没有读取 $y$ 也会违反本页协议。某些预先声明的传导式或测试时适应协议允许利用未标注目标输入，那是另一种任务设定，不能不披露就拿来支持“完全未见数据”的归纳式结论。

### 路径 B：字段在预测时还不存在

假设月初预测某订单月底是否取消，却把月底形成的“退款已完成”作为特征。即使订单 ID、客户 ID 完全分组隔离，这个字段仍越过了预测时间。删除直接标签列也不够，标签的后果、事后修正记录或把未来包含进去的聚合值都要检查。

这是依据信息可用性定义构造的例子。实际审核应记录字段的产生时间、可见时间与聚合窗口，不能只看列名。

### 路径 C：反复看测试反馈，再改方案

看测试分数后换提示词、调整阈值或决定只发布哪个模型，都会让测试承担选择职责。模型权重不变也不能排除这种适应性选择。[1][4]

问题不是对同一个冻结程序机械重跑一次，而是结果是否影响了下一次决策。一旦用测试反馈改方案，这份数据对新方案便不再是未触碰的最终测试；应披露用途，并另行安排未参与选择的评估，而不是重命名文件后继续宣称独立。

## 4. 同样各有六行，两个分数回答不同问题

构造六个实体 A–F，每个实体在共同的第 1、2、3 期各有一条记录。标签在本例中固定：A/C/E 为 0，B/D/F 为 1。这个固定标签假设只服务于反例，不是一般任务的要求。特征 $x$ 依次为 0、2、10、12、20、22，每个实体三期都相同。

预测器故意很简单：只记训练实体的标签；遇到未知实体，始终预测预先约定的 0。它不使用 $x$。

- **按行方案**：第 1 期训练、第 2 期验证、第 3 期测试，三份各六行。测试行没有出现在训练中，但 A–F 都是已知实体，故答对 **6/6**
- **按实体方案**：A/B 训练、C/D 验证、E/F 测试，三份仍各六行。E/F 未被记忆，预测全部为 0，故只答对 E 的三行，得到 **3/6**

若事先声明目标是“未见实体”，6/6 就不能支撑该结论；它测的是对已知实体的记忆。若目标本来是“这些已知实体的后续记录”，按行方案的时间顺序可以合理，但还得确认信息在当时可用。相反，按实体方案混合了三期，不能拿它冒充严格前向的未来评估。

两种方案的分数差来自人为构造的数据、记忆规则及测试对象，不是真实模型的性能差距，也没有证明实体切分总会降低分数。泄漏使结论失去相应依据，并不保证每次观察到的指标都上涨。

另作一个独立检查：在实体方案中，训练特征是三个 0 和三个 2，因此训练均值为 1；全量均值是 11。冻结训练均值后，测试表示是三个 19 和三个 21。只把测试 $x$ 加 100，训练均值仍应为 1，全量均值却会改变。这只展示**拟合状态的信息来源**；由于记忆器根本不使用 $x$，不能把它说成“中心化导致了 6/6 与 3/6”。

## 5. 可运行实验：计数、边界与不变性

这是一段有意限缩的教学 API：输入为本例 `Row` 的有限元组，实体为 A–F、期次为整数 1–3、$x$ 为 $[-1000,1000]$ 内的整数、标签为整数 0/1；每个数据元组最多 18 行。`Row` 类型注解不负责运行时校验，调用者需遵守这些前提。任意对象、非法字段和重复行 ID 的通用检测不在本例接口范围内；固定数据的行覆盖与互斥由下方独立断言检查。

- `require_new_entities(parts)`：检查三个非空分区的实体集合两两不交，仅适用于“新实体”目标
- `require_forward_time(parts)`：检查三个非空分区的期次严格前向，仅检查本例共同时间轴
- `fit_memory(train)`：返回实体到标签的字典，拒绝空训练及同一实体的冲突标签
- `correct_count(memory, test)`：返回答对行数，拒绝空评估；`memory` 使用上述字典或空字典，未知实体预测 0
- `fit_mean(data)`：返回传入非空数据的 $x$ 均值；函数不知道哪些行获准参与拟合，这由调用者负责

两个分区检查成功时返回 `None`，上述明确列出的边界违规抛出 `ValueError`。均值检查没有除以标准差，常量特征是合法输入。代码没有实现真实时间戳、缺失值、超参数搜索或通用泄漏检测器。

```python
# nextchina-example: train-validation-test-data-leakage
from dataclasses import dataclass, replace
from itertools import combinations
from statistics import fmean

@dataclass(frozen=True)
class Row:
    entity: str
    visit: int
    x: int
    y: int

rows = tuple(
    Row(entity, visit, x, label)
    for entity, x, label in zip(
        "ABCDEF", (0, 2, 10, 12, 20, 22), (0, 1, 0, 1, 0, 1))
    for visit in (1, 2, 3)
)
row_split = tuple(tuple(r for r in rows if r.visit == visit)
                  for visit in (1, 2, 3))
group_split = tuple(tuple(r for r in rows if r.entity in entities)
                    for entities in ("AB", "CD", "EF"))

def require_new_entities(parts):
    if len(parts) != 3 or any(not part for part in parts):
        raise ValueError("three nonempty parts required")
    groups = [{r.entity for r in part} for part in parts]
    if any(a & b for a, b in combinations(groups, 2)):
        raise ValueError("entity overlap conflicts with new-entity target")

def require_forward_time(parts):
    if len(parts) != 3 or any(not part for part in parts):
        raise ValueError("three nonempty parts required")
    if any(max(r.visit for r in early) >= min(r.visit for r in late)
           for early, late in zip(parts, parts[1:])):
        raise ValueError("parts are not strictly forward in time")

def fit_memory(train):
    if not train:
        raise ValueError("empty training data")
    memory = {}
    for r in train:
        if r.entity in memory and memory[r.entity] != r.y:
            raise ValueError("this toy assumes one fixed label per entity")
        memory[r.entity] = r.y
    return memory

def correct_count(memory, test):
    if not test:
        raise ValueError("empty evaluation data")
    return sum(memory.get(r.entity, 0) == r.y for r in test)

def fit_mean(data):
    if not data:
        raise ValueError("empty fitting data")
    return fmean(r.x for r in data)

require_new_entities(group_split)
require_forward_time(row_split)
row_correct = correct_count(fit_memory(row_split[0]), row_split[2])
group_correct = correct_count(fit_memory(group_split[0]), group_split[2])
assert (row_correct, group_correct) == (6, 3)
expected_ids = {(entity, visit) for entity in "ABCDEF" for visit in (1, 2, 3)}
for split in (row_split, group_split):
    assert tuple(len(part) for part in split) == (6, 6, 6)
    ids = [{(r.entity, r.visit) for r in part} for part in split]
    assert set.union(*ids) == expected_ids
    assert all(not (a & b) for a, b in combinations(ids, 2))
    memory = fit_memory(split[0])
    assert fit_memory(tuple(reversed(split[0]))) == memory
    assert correct_count(memory, tuple(reversed(split[2]))) == correct_count(
        memory, split[2])
print(f"row split: {row_correct}/6; unseen-entity split: {group_correct}/6")

train, validation, test = group_split
train_mean = fit_mean(train)
leaky_mean = fit_mean(train + validation + test)
assert train_mean == 1.0 and leaky_mean == 11.0
assert tuple(r.x - train_mean for r in test) == (19, 19, 19, 21, 21, 21)
# 保持训练行不变，只改保留特征；重新拟合训练状态不受其影响。
for delta in (-100, 100):
    changed_test = tuple(replace(r, x=r.x + delta) for r in test)
    changed_parts = (train, validation, changed_test)
    assert fit_mean(changed_parts[0]) == train_mean
    assert fit_mean(sum(changed_parts, ())) != leaky_mean
assert fit_mean((Row("A", 1, 7, 0), Row("B", 1, 7, 1))) == 7.0
print(f"fit on train: mean={train_mean:g}; fit on all: mean={leaky_mean:g}")

bad_calls = [
    lambda: require_new_entities(row_split),
    lambda: require_forward_time(group_split),
    lambda: require_new_entities(((), validation, test)),
    lambda: require_forward_time((train, (), test)),
    lambda: require_new_entities((train, test)),
    lambda: require_forward_time((train, test)),
    lambda: fit_memory(()),
    lambda: fit_memory((Row("A", 1, 0, 0), Row("A", 2, 0, 1))),
    lambda: correct_count({}, ()),
    lambda: fit_mean(()),
]
for bad in bad_calls:
    try:
        bad()
    except ValueError:
        pass
    else:
        raise AssertionError("expected boundary rejection")
print("ten boundary checks passed")
```

输出依次是 `row split: 6/6; unseen-entity split: 3/6`、`fit on train: mean=1; fit on all: mean=11`、`ten boundary checks passed`。验证集在这个固定规则例子中只用于展示分区职责，没有拿来选模型；因此代码没有验证第 3 节的测试反馈问题，也没有执行完整的训练选择流程。

## 6. 交叉验证能节约数据，不能取消边界

在开发数据上做交叉验证，可以让不同折轮流承担训练与验证职责。每一折需要重新拟合该折的预处理状态；先在全量数据上学完特征变换、再做 CV，仍然跨过了信息边界。

`Pipeline` 把变换器与预测器串在一起。把整条管线交给合适的交叉验证器时，各步会在同一训练子集上拟合，从而帮助避免预处理统计量泄漏。[3] 它不会自动判断“退款已完成”是否来自未来，也不会替你决定该按行、实体还是时间划分。

如果用交叉验证分数挑出最佳方案，再把同一个最佳分数当作最终表现，仍可能过度适应这份有限数据。**嵌套评估**把职责再分一层：内层选择，外层评估包含该选择过程的整套流程；内外层都必须遵守任务的群组和时间约束。[4] 另一条清晰路线是开发集内完成选择，最后使用单独保留的测试集。

外层评估针对的是选择流程，不能无条件解释成后来用全部数据重训的某个模型的精确分数。外层结果如果再次被用于挑流程，也要披露这一层选择；“嵌套”这个名字不是无限试验的豁免。

## 7. 区间更窄，也不会把错误问题变正确

回看 [统计推断与置信区间](?view=garden&scope=branch:llm:rankings/methodology)：区间量化的是指定抽样模型下的不确定性，前提包括目标量、固定方案与适当的独立性设定。

本例同一实体的三条固定标签记录不是三份独立的实体证据，故没有给 6/6、3/6 套上独立 Bernoulli 样本的 Wilson 区间。增加重复行、机械按行 bootstrap，或给旧实体分数加上更窄的区间，都不能把它转换成未见实体表现。group split 也不会自动修复错误字段、全量预处理或测试集选择。

数据泄漏讨论信息使用是否符合任务；本站的 [测试污染](?view=garden&scope=concept:data-contamination) 则另有语料与评测内容重叠等专门问题，不能仅用“做过切分”宣称已审计。即使没有泄漏，新群体或新时期仍可能有 [分布变化](?view=garden&scope=concept:distribution-shift)。这些是后续入口，本页不展开其检测、清除或监测方法。

本页所在分支还包含标签移位和样本打包：标签移位可继续读 [训练循环](?view=garden&scope=branch:llm:training/loop)，样本打包不在本页独立讲解范围内。

## 8. 自测：说明目标与信息，而不只背规则

**练习 1**：所有预处理都只在训练集 `fit`，可以宣布“无泄漏”了吗？

**答案**：不能。还要检查预测时是否能得到字段、实体或时间切分是否对应目标，以及方案是否被测试反馈影响。训练内拟合只守住了其中一条边界。

**练习 2**：同一个用户出现在训练和测试中，必然违规吗？

**答案**：取决于目标。预测未见用户时不应共享；预测已知用户未来行为时可能合理，但只能使用预测前可用的历史信息，且应按真实采样单位处理相关性。

**练习 3**：模型参数完全未改，只按测试分数从二十条提示词中挑了一条，测试仍然独立吗？

**答案**：这份测试已参与方案选择。是否更新权重不是判断标准；需要披露选择过程，并为选定方案另安排未参与选择的评估。

**练习 4**：实体严格分组后，用月底退款状态预测月初风险；同时给准确率加了置信区间。问题解决了吗？

**答案**：没有。分组不让未来字段在月初变得可用，置信区间也不修复这种时间泄漏。应回到预测时点重建可用特征，再按目标设计评估。

接着可用[监督学习与朴素贝叶斯](?view=garden&scope=branch:ai-overview:orientation/naive-bayes)追踪一个实际拟合的分类器：哪些状态只由训练标签产生，为什么保留标签只进入计分。

## 来源与核验范围

[1] scikit-learn，[3.1：Cross-validation: evaluating estimator performance](https://scikit-learn.org/stable/modules/cross_validation.html)。核对首节训练、验证、测试职责，3.1.2.2 的分层作用，3.1.2.4 的未见群组目标，以及 3.1.2.6 的时间结构。本页的人造实体数据与计分不是官方模型实验。

[2] scikit-learn，[12.2：Data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage)。核对信息可用性、先切分再学习预处理状态，以及 `fit` / `transform` 的区分；本页明确采用固定归纳式协议，没有宣称所有利用未标注目标输入的任务都非法。

[3] scikit-learn，[8.1.1：Pipeline: chaining estimators](https://scikit-learn.org/stable/modules/compose.html#pipeline-chaining-estimators)。核对管线在交叉验证中让变换器与预测器使用同一训练子集的作用；未把管线当成任务或字段审核器。

[4] scikit-learn，[Nested versus non-nested cross-validation](https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html)。核对内层选择、外层评估及用同一分数选择并报告的偏差风险；本页未运行其 Iris 实验，也未声称偏差在每次具体运行中都为正。

核验日期：2026-10-05。上述页面访问时均标为 scikit-learn 1.9.1 文档；`stable` 地址可能随发布变化。本文只运行标准库人造反例，不依赖或安装 scikit-learn。独立讲解范围仅为训练/验证/测试与数据泄漏；测试污染、分布变化等链接不代表已经完成对应知识单元。程序检查不能替代独立专家复核，审查状态保留 `needs-independent-review`。
