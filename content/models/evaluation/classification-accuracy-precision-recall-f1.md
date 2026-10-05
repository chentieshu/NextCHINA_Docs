> **本页解决的问题**：一个分类器准确率达到 90%，为什么可能漏掉全部目标？准确率、精确率、召回率与 F1 分别在数什么，换阈值、换类别比例、换平均方式后，结论为什么会改变？
>
> 前置知识：分数、比例与加权平均；第 5 节可结合 [条件概率](?view=garden&scope=concept:conditional-probability) 和 [贝叶斯规则](?view=garden&scope=concept:bayes-rule) 阅读。本页的消息、分数与矩阵全部为教学构造，不代表真实模型表现。示例使用 Python 3.8+ 标准库。

## 1. 先定正类，再定分母

假设要判断一条消息是否属于某个指定主题。每条消息有且只有一个真实标签、一个预测标签：属于该主题记为 **正类 1**，不属于记为 **负类 0**。“正”只是要单独关注的标签，不等于“好”“安全”或“正确”；把另一类定为正类，会改变正类精确率、召回率和 F1 的含义。

在报分数前，先写清楚要回答哪个问题：

- **目标总体与来源**：例如某个频道、某个时间段的消息。只取短消息得出的分数，不能直接代表所有长度、所有频道
- **真实标签如何确定**：主题边界、标注规则与争议处理。下文暂把教学标签视为无争议，不代表现实标签永远可靠
- **计数单位**：本页一条消息算一次，不按 token、用户或会话计数。换单位就是换问题
- **决策与报告规则**：正类、完整类别集合、分数阈值、平均方式以及零分母的处理

四格计数把“错误”拆开。本文固定采用 **行是真实标签、列是预测标签**，两个轴的顺序都是 0、1，与 scikit-learn 的混淆矩阵约定一致。[1]

| 真实标签 | 预测 0 | 预测 1 |
| --- | --- | --- |
| 0 | TN：正确排除 | FP：误报 |
| 1 | FN：漏报 | TP：正确找回 |

因此，代码中的矩阵是 `((TN, FP), (FN, TP))`。不要只记“左上角是什么”：别的资料可能交换轴或标签顺序，读图时必须看标注。

## 2. 四个指标，四种问题

令 $N$ 为消息总数。以下公式都先要求分母大于零，零分母留到第 4 节处理。

**准确率 Accuracy**：所有消息里，标签判断正确的比例。

$$
A=\frac{TP+TN}{N}
$$

**精确率 Precision**：被判成正类的消息里，真正属于正类的比例。

$$
P=\frac{TP}{TP+FP}
$$

**召回率 Recall**：真实正类消息里，被找回的比例。

$$
R=\frac{TP}{TP+FN}
$$

精确率和召回率的分子相同，分母方向不同：前者先看“预测为正”的集合，后者先看“实际为正”的集合。[2] 它们是这一批记录的条件比例，不是某一条新消息的可靠性保证，也不是模型分数已经校准成概率的证明。

**F1**：把正类精确率和召回率作调和组合，而不是普通算术平均。[3]

$$
F_1=\frac{2PR}{P+R}
$$

该写法要求 $P,R$ 都已定义且 $P+R>0$。更适合直接从计数计算的是：

$$
F_1=\frac{2TP}{2TP+FP+FN}
$$

例如 $TP=0$ 但 $FP+FN>0$ 时，计数式明确给出 F1 为 0。此时 $P$ 或 $R$ 可能未定义，也可能两者均为 0；不能直接套用不满足前提的调和写法。F1 不包含 TN：在 TP、FP、FN 不变时多加正确负例，正类 F1 不变，但准确率可能上升。

**选指标是在选问题。** F1 不是“全面正确率”，也没有自动写入你的误报成本和漏报成本。是否需要找回小类、控制误报、满足处理容量或衡量总体正确率，应由任务要求决定，不能只因为某个分数更好看就选它。

## 3. 100 条消息：准确率 90% 仍能漏掉全部正类

我们手工构造 100 条消息，其中 10 条为正、90 条为负。再人为指定下面的整数分数。分数只是决定排序与阈值的教学数值，**不是概率**。

| 真实标签 | 分数 | 条数 |
| --- | --- | --- |
| 1 | 90 | 4 |
| 1 | 70 | 4 |
| 1 | 40 | 2 |
| 0 | 80 | 1 |
| 0 | 60 | 8 |
| 0 | 10 | 81 |

决策规则是“分数 **大于或等于** 阈值就判正”。不重新训练，也不改变任何分数，只换阈值。

**阈值 50**：8 条正类被找回、2 条漏掉；9 条负类误报、81 条正确排除。

- TP=8、FP=9、FN=2、TN=81
- 准确率为 89/100，即 89%
- 精确率为 8/17，约 47.06%；召回率为 4/5，即 80%
- F1 为 16/27，约 59.26%

**阈值 75**：只找回 4 条正类、漏掉 6 条；误报降到 1 条。

- TP=4、FP=1、FN=6、TN=89
- 准确率为 93/100，即 93%
- 精确率为 4/5，即 80%；召回率为 2/5，即 40%
- F1 为 8/15，约 53.33%

**全部判负**：用大于所有分数的阈值 101，TP=0、FP=0、FN=10、TN=90。准确率仍有 90%，召回率和 F1 都是 0，精确率则未定义。这说明高准确率可以与“一个目标也没找回”同时成立。经典信息检索教材也用全负基线提醒读者留意稀有类别。[4] 这不是说所有类别不平衡任务都必须改用 F1，而是说需要把基线和各类错误一起报告。

### 阈值提高，精确率一定提高吗？

不一定。在 **同一份固定分数、同一批标签** 上提高阈值，预测正类集合只会缩小，所以 TP、FP 都不会增加，FN、TN 都不会减少。有真实正类时，召回率不会增加；但精确率是两个会变化的计数之比，不保证单调。

把本例阈值从 40 提到 50，只移除了两条真阳性，误报数仍为 9：精确率从 10/19 下降到 8/17。继续提到 75，精确率又升到 4/5。若阈值高到没有预测正类，精确率变为未定义。不能把“通常希望阈值提高后更精确”当成数学保证。

### 哪个阈值更合适？先说后果，再做验证

若每次误报成本为 1、每次漏报成本为 5，本例阈值 50 的总成本为 19，阈值 75 为 31；若成本改为误报 3、漏报 1，两者则为 29 和 9。相同预测会得到相反选择。这是人为指定成本后的算例，不表示 F1 隐含了任意一种通用成本。

真实工作中，指标、模型和阈值的选择应放在验证阶段，可以用适合任务的交叉验证或独立验证数据。模型训练用的数据也不能直接充当无偏的阈值选择证据；官方阈值调优指南明确提示了这种过拟合风险。[5] 在查看最终测试结果前锁定规则，最后用保留测试集评估。[8] 反复看测试成绩再调阈值，是在把测试集用于选择。详见 [训练、验证与测试](?view=garden&scope=concept:train-validation-test) 与 [数据泄漏](?view=garden&scope=concept:data-leakage)。

## 4. 零分母：未定义不能悄悄写成零

四种问题需要分别判断：

- 没有预测正类：TP+FP=0，精确率未定义
- 没有真实正类：TP+FN=0，召回率未定义
- 既无真实正类也无预测正类：TP=FP=FN=0，计数式 F1 未定义
- 没有任何记录：N=0，准确率未定义；本页代码直接拒绝空评价集

若没有预测正类、但确实存在真实正类，精确率未定义，召回率和 F1 都为 0。反过来，没有真实正类、却预测了一些正类时，召回率未定义，精确率和 F1 都为 0。“没法除”和“算出来等于零”是不同信息。

本页的报告策略是保留 `None`，显示为“未定义”；不添加一个很小的数来掩盖分母，不静默补 0 或 1。scikit-learn 提供 `zero_division` 选项，访问时文档中的默认 `warn` 会返回 0 并发出警告，选择 `np.nan` 则在平均时排除相应未定义值。[2] 这属于软件约定，不能当成零分母的数学答案。发表结果时应写出具体策略、版本以及参与平均的类别。

## 5. 类别更稀有，为何精确率可能大幅下降？

令真实正类比例为 $\pi$，召回率为 $r$，误报率为 $f$。这里 **误报率** 的分母是真实负类，不是预测正类：

$$
f=\frac{FP}{FP+TN}
$$

在相应条件比例已定义、预测正类比例大于零时，由 [贝叶斯规则](?view=garden&scope=concept:bayes-rule) 和全概率公式可得：[6]

$$
P=\frac{r\pi}{r\pi+f(1-\pi)}
$$

分子是真实正类且被预测为正的比例；分母再加上真实负类却被预测为正的比例。这个关系不需要额外假设“标签与预测独立”。

构造两批各 10000 条的记录，**刻意固定** 召回率为 0.8、误报率为 0.1，只改变正类比例：

- 正类占 10%：TP=800、FN=200、FP=900、TN=8100。精确率为 8/17，约 47.06%
- 正类占 1%：TP=80、FN=20、FP=990、TN=8910。精确率为 8/107，约 7.48%

第二批仍找回了 80% 的正类；但大量负类中的 10% 误报，远多于找回的 80 条正类。召回率相同不意味着精确率相同。F1 也从 16/27 变为 16/117，约 13.68%。

这只是在固定类条件预测率下重新混合类别的教学实验。真实部署换场景后，召回率和误报率也可能改变，不能假定同一个模型在任意分布变化下都保持二者不变。人为把评价集的正负类抽成一半一半后得到的精确率，也不能直接当成自然流量中的精确率；先核对目标总体与抽样方式。

## 6. 多类别：先看各类，再说明怎么平均

现在有 0、1、2 三个类别，每条消息仍只有一个真实类别和一个预测类别。完整类别集合固定为 `{0, 1, 2}`，下面仍是行真实、列预测：

| 真实类别 | 预测 0 | 预测 1 | 预测 2 |
| --- | --- | --- | --- |
| 0 | 90 | 0 | 0 |
| 1 | 9 | 1 | 0 |
| 2 | 0 | 1 | 9 |

共有 110 条，100 条正确，准确率为 10/11，约 90.91%。但类别 1 的 10 条记录只找回了 1 条，召回率只有 10%。一个总体分数很容易掩盖它。

对每个类别，暂把它看作正类，把其他类别合为负类，即 one-vs-rest，再算该类 P、R、F1。**支持数 support** 指该类在真实标签中出现的条数，本例依次为 90、10、10，不是预测成该类的条数。[2]

### 三种平均，权重与计算顺序不同

**Macro（宏平均）**：先算每一类的某项指标，再对类别等权平均。此例各类 F1 依次为 20/21、1/6、18/19，macro F1 为 1649/2394，约 68.88%。它不是“先平均 P 和 R，再取二者的调和平均”。[7] 本例平均 P 为 53/66、平均 R 为 2/3，二者调和平均是 212/291，约 72.85%，与 68.88% 并不相同。

**Support-weighted（按支持数加权）**：先算各类指标，再按真实支持数加权。此例 weighted F1 为 7729/8778，约 88.05%。类别 0 占 90/110 的权重，因此加权并不等于自动保护小类；仍须展示逐类结果。

**Micro（微平均）**：先把各类 TP、FP、FN 分别相加，再用这些总计数计算指标。在本页非空、单标签、**完整类别集合全部纳入**的条件下：

$$
P_{\mathrm{micro}}=R_{\mathrm{micro}}
$$

$$
F_{1,\mathrm{micro}}=A=10/11
$$

为什么相等？设答对 $K$ 条。每个正确预测给其类别贡献一个 TP；每个错误预测给实际类别贡献一个 FN，同时给预测类别贡献一个 FP。汇总后 TP 为 $K$，FP 和 FN 都为 $N-K$，代入三个公式都得到 $K/N$。[7] 这项恒等式不能不加条件地搬到标签子集或多标签任务上。

### 平均中的未定义值也要明说

本页示例采用一个刻意严格的规则：完整类别集合中，**只要有一类 F1 未定义，strict macro F1 就未定义**。weighted F1 则让支持数为零的类别贡献零权重；支持数为正时，计数式 F1 的分母一定大于零。这是教学实现的显式选择，与 scikit-learn 的默认补零、或 `np.nan` 排除后平均都不能混为一谈。

例如矩阵 `((3, 0), (0, 0))` 仍包含完整的两个类别：准确率与 micro F1 为 1，正类 1 的 P、R、F1 全未定义，strict macro F1 未定义，而 weighted F1 为 1。不能悄悄删掉没出现的类别后仍声称采用同一套宏平均规则。

本节只讨论单标签分类。多标签任务里，一条记录可有一组标签；scikit-learn 的 subset accuracy 要求预测标签集合与真实集合完全一致才算该条正确。[7] 它不是“每个标签判断正确的平均比例”。本页不展开多标签评价，也不实现 `samples` 平均、只选部分标签、样本权重、弃权或层级分类。

## 7. 可运行例子：保留精确分数与未定义值

把下面唯一的 Python 块保存为一个文件，使用 Python 3.8+ 运行，无需第三方包。它没有训练模型、调用服务、寻找最优阈值或构造置信区间。

**支持的三个接口：**

- `confusion(y_true, y_pred, k=2)`：接受两个等长的内置 `list` 或 `tuple`，每个位置对应同一条记录；返回行真实、列预测的嵌套元组
- `summarize(matrix)`：接受同样行列含义的方形计数矩阵，返回字典。`per_class[i]` 是类别 i 的 one-vs-rest 计数、支持数及 P/R/F1；另返回准确率、micro P/R/F1、strict macro F1 和 weighted F1。**不返回 macro/weighted P 或 R**
- `threshold_labels(scores, threshold)`：按“分数≥阈值”返回 0/1 标签元组

**输入边界：**完整类别为整数 0 到 k−1，k 为 2–5；记录数或矩阵总计数为 1–10000；计数、类别、k、分数和阈值只接受内置 `int`，不接受 `bool`。矩阵和每行必须为内置 `list` 或 `tuple`，非负整数计数且方形；分数为 0–100，阈值为 0–101。阈值 0 全判正，101 全判负。字符串、浮点数、生成器和多标签集合均不在支持范围，非法输入抛出 `ValueError`。

比例使用 `Fraction` 保留精确有理数；`None` 表示未定义。`sequence`、`integer` 和 `display` 是内部辅助函数，不是通用数据清洗或格式化接口。代码中的固定断言检查主例、阈值等号、零分母和多类别结果。

```python
# nextchina-example: classification-accuracy-precision-recall-f1
# Python 3.8+, standard library only.
# One label per record; full labels 0..k-1, k=2..5; no sample weights.
from fractions import Fraction

def sequence(value):
    if type(value) not in (list, tuple):
        raise ValueError('expected list or tuple')
    return value

def integer(value, low, high):
    if type(value) is not int or not low <= value <= high:
        raise ValueError('integer outside supported bounds')
    return value

def confusion(y_true, y_pred, k=2):
    integer(k, 2, 5)
    sequence(y_true)
    sequence(y_pred)
    if not 1 <= len(y_true) <= 10000 or len(y_true) != len(y_pred):
        raise ValueError('nonempty equal lengths, at most 10000')
    matrix = [[0] * k for _ in range(k)]
    for actual, predicted in zip(y_true, y_pred):
        integer(actual, 0, k - 1)
        integer(predicted, 0, k - 1)
        matrix[actual][predicted] += 1
    return tuple(tuple(row) for row in matrix)

def summarize(matrix):
    sequence(matrix)
    k = integer(len(matrix), 2, 5)
    for row in matrix:
        sequence(row)
        if len(row) != k:
            raise ValueError('matrix must be square')
        for count in row:
            integer(count, 0, 10000)
    n = sum(map(sum, matrix))
    integer(n, 1, 10000)
    ratio = lambda a, b: None if b == 0 else Fraction(a, b)
    per_class = []
    for label in range(k):
        tp = matrix[label][label]
        support = sum(matrix[label])
        predicted = sum(row[label] for row in matrix)
        fn, fp = support - tp, predicted - tp
        per_class.append({
            'tp': tp, 'fp': fp, 'fn': fn, 'tn': n - tp - fp - fn,
            'support': support, 'precision': ratio(tp, predicted),
            'recall': ratio(tp, support), 'f1': ratio(2 * tp, 2 * tp + fp + fn),
        })
    correct = sum(matrix[i][i] for i in range(k))
    tp = sum(row['tp'] for row in per_class)
    fp = sum(row['fp'] for row in per_class)
    fn = sum(row['fn'] for row in per_class)
    f1s = [row['f1'] for row in per_class]
    # Explicit policy: undefined class F1 makes strict macro F1 undefined.
    # Zero-support classes contribute zero weight to support-weighted F1.
    macro = None if None in f1s else sum(f1s, Fraction(0)) / k
    weighted = sum((row['support'] * row['f1'] for row in per_class
                    if row['support']), Fraction(0)) / n
    return {
        'matrix': tuple(tuple(row) for row in matrix), 'n': n,
        'accuracy': Fraction(correct, n), 'per_class': tuple(per_class),
        'micro_precision': ratio(tp, tp + fp),
        'micro_recall': ratio(tp, tp + fn),
        'micro_f1': ratio(2 * tp, 2 * tp + fp + fn),
        'macro_f1_strict': macro, 'weighted_f1': weighted,
    }

def display(value):
    return '未定义' if value is None else str(value)

def threshold_labels(scores, threshold):
    sequence(scores)
    if not 1 <= len(scores) <= 10000:
        raise ValueError('nonempty scores, at most 10000')
    integer(threshold, 0, 101)
    for score in scores:
        integer(score, 0, 100)
    # Invented decision scores, NOT calibrated probabilities. Equality is positive.
    return tuple(int(score >= threshold) for score in scores)

# Fixed teaching set, six groups expanded into 100 individual records.
y_true = (1,) * 10 + (0,) * 90
scores = (90,) * 4 + (70,) * 4 + (40,) * 2 + (80,) + (60,) * 8 + (10,) * 81
reports = {t: summarize(confusion(y_true, threshold_labels(scores, t)))
           for t in (40, 50, 75, 101)}
for t in (50, 75, 101, 40):
    row = reports[t]['per_class'][1]
    print('threshold', t, 'matrix', reports[t]['matrix'],
          'accuracy', reports[t]['accuracy'], 'precision', display(row['precision']),
          'recall', display(row['recall']), 'F1', display(row['f1']))

# Conditional rates fixed by construction: recall 4/5, false-positive rate 1/10.
# This models only prior/base-rate change, not arbitrary deployment shift.
base_rate_reports = {
    '10%': summarize(((8100, 900), (200, 800))),
    '1%': summarize(((8910, 990), (20, 80))),
}
for prevalence, report in base_rate_reports.items():
    print('base rate', prevalence, 'precision', report['per_class'][1]['precision'],
          'recall', report['per_class'][1]['recall'], 'F1', report['per_class'][1]['f1'])

# Three single-label classes, all included; class 1 has only 1/10 recall.
multiclass = summarize(((90, 0, 0), (9, 1, 0), (0, 1, 9)))
print('multiclass accuracy/micro F1', multiclass['accuracy'], multiclass['micro_f1'],
      'macro F1', multiclass['macro_f1_strict'], 'weighted F1', multiclass['weighted_f1'])
print('per-class F1', [row['f1'] for row in multiclass['per_class']])

# Fixed checks are part of the runnable example.
assert len(y_true) == len(scores) == 100
assert threshold_labels((39, 40, 41), 40) == (0, 1, 1)
assert threshold_labels((0, 100), 0) == (1, 1)
assert threshold_labels((0, 100), 101) == (0, 0)
expected = {
    50: (((81, 9), (2, 8)), Fraction(16, 27)),
    75: (((89, 1), (6, 4)), Fraction(8, 15)),
    101: (((90, 0), (10, 0)), Fraction(0)),
    40: (((81, 9), (0, 10)), Fraction(20, 29)),
}
for threshold, (matrix, f1) in expected.items():
    assert reports[threshold]['matrix'] == matrix
    assert reports[threshold]['per_class'][1]['f1'] == f1
assert reports[101]['accuracy'] == Fraction(9, 10)
assert reports[101]['per_class'][1]['precision'] is None
absent = summarize(((3, 0), (0, 0)))
assert absent['per_class'][1]['f1'] is None
assert absent['macro_f1_strict'] is None
assert absent['weighted_f1'] == 1
assert multiclass['accuracy'] == multiclass['micro_f1'] == Fraction(10, 11)
assert multiclass['macro_f1_strict'] == Fraction(1649, 2394)
assert multiclass['weighted_f1'] == Fraction(7729, 8778)
assert base_rate_reports['10%']['per_class'][1]['precision'] == Fraction(8, 17)
assert base_rate_reports['1%']['per_class'][1]['precision'] == Fraction(8, 107)
print('示例检查通过')
```

关键输出应与第 3、5、6 节相同：阈值 50 的精确率 `8/17`、F1 `16/27`；阈值 75 的精确率 `4/5`、F1 `8/15`；阈值 101 的精确率显示“未定义”。三分类输出 micro F1 `10/11`、macro F1 `1649/2394`、weighted F1 `7729/8778`。最后一行是“示例检查通过”。运行结果验证的是这份教学实现与给定算例，不是实际模型质量。

## 8. 自测：能否从数字说回问题？

**练习 1：换正类。** 把阈值 50 的负类改称正类，准确率和正类 F1 是否都不变？

**答案**：准确率仍为 89/100。新正类的 TP=81、FP=2、FN=9，精确率为 81/83、召回率为 9/10、F1 为 162/173；不再是原来的 16/27。报告“F1”时省略正类定义会丢掉关键信息。

**练习 2：全负基线。** 100 条记录中有 10 条正类，全判负的精确率该写 0、1 还是未定义？F1 呢？

**答案**：按本页策略，精确率未定义，因为没有预测正类；F1 为 0，因为 FN=10，计数式的分母不为零。若所用库按约定输出 0，必须说明这个零来自零分母策略。

**练习 3：阈值反例。** 为什么阈值 40→50 时，预测正类更少，精确率反而变低？这是否推翻“召回率不会增加”？

**答案**：被移除的是两条真正的正类，而 9 条误报没变。精确率从 10/19 降到 8/17；召回率从 1 降到 4/5，没有违反固定分数下的召回率性质。

**练习 4：从总体数看小类。** 第 6 节准确率超过 90%，为什么还要展示各类支持数与召回率？把 macro F1 改为 weighted F1 能补救类别 1 吗？

**答案**：类别 1 只有 1/10 被找回，整体正确率被较大的类别 0 主导。换成按支持数加权会让大类占更大权重，不会修复类别 1 的预测。应先定位实际错误，再根据任务选择改进方法。

**练习 5：给 F1 套准确率区间。** F1 为 16/27，能把它当成“27 次里成功 16 次”，直接输入二项准确率的区间函数吗？

**答案**：不能。这里的 16 是两倍 TP，27 是 2TP+FP+FN，不是 27 次预先定义、独立同分布的 0/1 试验。F1 的不确定性分析需要针对其统计量和抽样设计另行处理，不能凭分数长得像比例就套公式。

## 9. 报告时，哪些信息不能省？

一份可以被解释的分类结果，至少应同时给出：目标总体与取样方式、计数单位、标签定义与正类、模型和数据版本、样本数与各类支持数、矩阵轴和类别顺序、阈值及选择数据、逐类指标、平均方式、零分母策略。

还要警惕几个常见跳跃：

- **“精确率高，就几乎没漏报。”** 精确率不以真实正类为分母，不能代替召回率
- **“F1 高，就代表所有错误成本都低。”** F1 忽略 TN，也不替任务设定实际后果
- **“micro F1 就是准确率。”** 本页等式依赖单标签和完整类别集合，不能删去条件
- **“换人群后沿用同一个精确率。”** 类别比例和类条件预测表现都可能改变
- **“公式算对，评测就可靠。”** 错误标注、选择偏差、重复样本与测试集调参并不会被四个公式发现

这些分数首先描述指定样本。要从样本推断今后的目标总体，还需说明抽样机制与不确定性；可接着阅读 [统计推断](?view=garden&scope=concept:statistical-inference) 和 [置信区间](?view=garden&scope=concept:confidence-interval)。那里对准确率的二项模型不能直接替 F1、宏平均或加权分数提供区间。

## 来源与核验范围

[1] scikit-learn，[confusion_matrix](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.confusion_matrix.html)。核对行真实、列预测、标签顺序与四格位置。

[2] scikit-learn，[precision_recall_fscore_support](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.precision_recall_fscore_support.html)。核对 P/R、support、逐类计算、平均含义与 `zero_division`。本页严格 macro/`None` 策略是自定教学契约，不是该库默认行为。

[3] scikit-learn，[f1_score](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.f1_score.html)。核对 F1 的调和解释、计数公式以及正类/标签集合的作用。

[4] Manning、Raghavan、Schütze，[Introduction to Information Retrieval：Evaluation of text classification](https://nlp.stanford.edu/IR-book/html/htmledition/evaluation-of-text-classification-1.html)。使用其全负基线、稀有类与分类评价的提醒；网页标注 © 2008，页面日期 2009-04-07。本页没有复用书中的语料、矩阵或模型成绩。

[5] scikit-learn，[Tuning the decision threshold for class prediction](https://scikit-learn.org/stable/modules/classification_threshold.html)。核对阈值选择、独立验证与训练数据复用的过拟合风险。

[6] Pishro-Nik，[Introduction to Probability, Statistics, and Random Processes：1.4.3 Bayes' Rule](https://www.probabilitycourse.com/chapter1/1_4_3_bayes_rule.php)。核对条件方向转换与全概率展开；类别比例算例为本文自行构造，未使用书中的应用数值。

[7] scikit-learn，[Metrics and scoring：Precision, recall and F-measures](https://scikit-learn.org/stable/modules/model_evaluation.html#precision-recall-f-measure-metrics)。核对宏平均计算顺序、单标签全类别 micro 恒等式，以及同页 Accuracy score 节对多标签 subset accuracy 的定义。

[8] scikit-learn，[Cross-validation: evaluating estimator performance](https://scikit-learn.org/stable/modules/cross_validation.html)。核对验证选择与最终保留测试的职责分离，不把交叉验证折中的评价结果当成未经选择的最终测试。

核验日期：2026-10-05（UTC）。以上六个 scikit-learn 页面在本次访问时均标为 **1.9.1 文档**；`stable` 链接会随发布变化。概率教材页面没有标明可固定的网页版本，以本次访问内容为准。本例只运行 Python 标准库实现，没有安装或调用 scikit-learn 做逐值比对。

独立讲解范围仅为**准确率与 F1**、**精确率与召回率**。不覆盖概率校准、曲线面积、排序指标、多模态指标、生成式评测或真实模型榜单；后续阅读链接不代表新增独立覆盖。本文尚未完成独立专家复核，审查状态保留 `needs-independent-review`。
