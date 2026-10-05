> **本页解决的问题**：带标签的样本怎样变成可以预测新输入的模型？朴素贝叶斯怎样学习概率、利用特征的出现与缺席，又会在哪里失效？
>
> 前置阅读：[条件概率与贝叶斯规则](?view=garden&scope=branch:llm:math/probability)。本页用两项二元属性、10 条虚构训练邮件和 6 条保留邮件走完流程；Python 3.8+ 标准库即可运行。这是教学算术，不是真实垃圾邮件系统的效果评测。

## 1. 监督学习：数据、学习算法与预测器

监督学习从带有输入与目标的样本学习预测规则。输入 $x$ 必须是在预测时能获得的信息，目标 $y$ 是要预测的结果；训练样本同时提供两者。标签可以来自人工判断，也可以来自后来观测到的结果，“监督”不表示有人盯住每一步计算。学习算法接收训练资料，输出可用于未见样本的预测器。[1]

把一般流程拆成三个短步骤，$D$ 为训练资料、$A$ 为学习算法、$s$ 为学到的状态：

$$
s=A(D)
$$

$$
\hat y=f_s(x)
$$

$$
\text{评估：比较 }\hat y\text{ 与保留标签 }y
$$

**训练的输入有标签，部署时的预测输入没有待预测标签。** 评估者拿到答案后可以计分，但不能把答案交给预测器。这项信息分工，比“代码里有没有梯度下降”更能说明本例在做什么。

本例假设邮件到达时，要判断它后来会被标为普通邮件（0）还是垃圾邮件（1）。只允许使用：

- `has_link`：到达时是否含链接，1 为有，0 为没有
- `known_sender_at_arrival`：到达时发件人是否已在已知名单，1 为是，0 为否；不能用事后更新的名单回填
- 训练行最后的 `y`：后来形成的标签；预测时不能读它

这里的 0 是**已经观测到的缺席或否定**，不是“不知道”或缺失值。每行代表一封不同的虚构邮件；两封邮件可以具有完全相同的两项属性。相同输入也可以有不同标签，因为两个属性没有保留正文、意图等全部信息，标签还可能有噪声。

训练函数 `fit(train)` 返回 `Model`；固定模型后，`predict(model, x)` 只接收两个属性。训练集和保留集各自包含哪些行，由调用者预先决定；函数无法仅凭两个相同的属性判断是不是同一封邮件，更不能自动证明没有泄漏。

### 六件不能混为一谈的事

1. **任务**：从到达时的两个属性预测 0/1，这是二分类
2. **模型族**：本例选用 Bernoulli 朴素贝叶斯，规定如何表示输入和类别的联合概率
3. **学习算法**：按标签分组计数，再按固定公式估计参数；没有神经网络或梯度更新
4. **学到的状态**：类别计数、各属性为 1 的计数，以及由它们算出的类别比例和四个条件参数
5. **超参数与预设**：平滑强度 $\alpha=1$、两个输入字段、类别集合在评估前固定；$\alpha$ 不是从这 10 行中估出来的参数
6. **决策规则**：比较两个类别的模型概率；相等时固定选 0。改变错误成本可能需要改变规则，但本例不在保留集上调阈值

监督学习也可以预测数值目标，这叫回归，还可以处理更丰富的输出；本页只实现二分类。[1] 决策树、线性模型等其他学习方法不必采用这里的概率分解。不能把一种模型的假设当作整个监督学习范式的定义。

## 2. 朴素贝叶斯：假设、估计与决策

### 先明确是哪一种独立

贝叶斯规则把类别先验与输入在该类下的似然结合起来。它本身不要求输入属性独立；朴素贝叶斯额外假设：**给定类别后，特征的联合分布可以分解为各自条件分布的乘积**。[2] 本例只有两个特征，简写为：

$$
P(x_1,x_2\mid y)=P(x_1\mid y)P(x_2\mid y)
$$

简写中的 $P(x_j\mid y)$ 表示指定取值的概率。在三个及更多特征时，需要整个联合分解，即相互条件独立；仅有两两条件独立不够。假设是否合适，要对任务和数据负责，不能从公式能运行推出它成立。

还有另一个层次：用于估计和外推的**不同样本之间**是否独立、是否来自同一分布。它与**同一条样本内部**两个特征给定类别后的独立不同。即使采样设计理想，也不会自动使邮件中的“含链接”和“已知发件人”条件独立。

### 再从计数得到参数

令 $n_c$ 为训练集中类别 $c$ 的行数，$s_{cj}$ 为这些行中特征 $j$ 等于 1 的数量，$N$ 为总行数。类别先验采用经验比例，条件概率使用加一平滑：[2][3]

$$
\pi_c=\frac{n_c}{N}
$$

$$
\theta_{cj}=\frac{s_{cj}+1}{n_c+2}
$$

$\theta_{cj}$ 估计该类中特征为 1 的概率。分母加 2，是因为该特征有“1”和“0”两个结果，各加一个伪计数；并不是因为本例恰好有两个特征。类别比例 $\pi_c$ 本例不平滑，且要求训练中两类都出现。

为缩短计算，先定义一个条件因子：

$$
\begin{aligned}
b_{cj}(1)&=\theta_{cj}\\
b_{cj}(0)&=1-\theta_{cj}
\end{aligned}
$$

再计算每类的未归一化质量及模型内的类概率：

$$
w_c=\pi_c\,b_{c1}(x_1)b_{c2}(x_2)
$$

$$
P_{\rm model}(c\mid x)=\frac{w_c}{w_0+w_1}
$$

$w_c$ 是拟合联合模型中的 $P_{\rm model}(Y=c,X=x)$；两类质量之和才是该输入的模型概率。**特征为 0 时，也必须乘上缺席因子。** 只乘出现项，已经换了模型。[3]

本例选择较大质量对应的类别，恰好相等就选 0。由于分母相同，这与比较归一化后的概率等价。在这个拟合模型和两种错误代价相同的 0–1 损失下，该规则最小化条件期望损失；这不是它在真实邮件上最优的保证。[1][2]

### Bernoulli 不等于所有朴素贝叶斯

- **Bernoulli**：每项属性是 0/1，出现与缺席都参与计算；同一链接出现十次，当前表示仍只有“有链接”这个 1
- **Multinomial**：处理事件或词项计数，重复次数影响分数；条件参数的分母涉及该类的总事件数，不能挪来替换这里的 $n_c+2$
- **Categorical**：每个特征分别有有限的候选类别；加一平滑的分母取决于该特征的类别数
- **Gaussian**：为连续特征建立类条件密度；密度不是某个精确取值的离散概率

这些是分布与表示的不同选择。[3][4] 下方 API 只接受已确定的两个二元属性，不实现自动二值化、词表学习、后三种变体或 scikit-learn 的完整接口。

## 3. 10 条训练记录究竟学到了什么

10 条训练邮件按标签和输入归组如下。次数表示不同邮件的数量，不是同一邮件被重复算分。

| 标签 | 输入 $(x_1,x_2)$ | 数量 |
| --- | --- | ---: |
| 0 | (0,1) | 4 |
| 0 | (1,0) | 1 |
| 0 | (0,0) | 1 |
| 1 | (1,0) | 3 |
| 1 | (0,0) | 1 |

因此模型保存：

- `counts=(6,4)`，`ones=((1,4),(3,0))`
- `prior=(3/5,2/5)`
- `theta[0]=(1/4,5/8)`，`theta[1]=(2/3,1/6)`

例如正类训练行中，没有一条“已知发件人”：原始比例为 0/4，平滑后变为 1/6。这避免了把“小样本没见过”直接写成模型中的不可能事件；但不能由此宣称相关性消失、标签正确或概率已经校准。

现在预测一封“含链接、不是已知发件人”的邮件，即 $x=(1,0)$：

$$
w_0=\frac35\cdot\frac14\cdot\frac38=\frac9{160}
$$

$$
w_1=\frac25\cdot\frac23\cdot\frac56=\frac29
$$

$$
P_{\rm model}(1\mid x)=\frac{320}{401}
$$

两个乘积的最后一项分别是 $1-5/8$ 与 $1-1/6$，都来自“不是已知发件人”。模型选 1，但 **320/401 是拟合模型给出的数值，不是已经验证的真实垃圾邮件比例**。

四种合法输入的全部结果为：

| 输入 | 正类模型概率 | 预测 |
| --- | ---: | ---: |
| (0,0) | 160/403 | 0 |
| (0,1) | 32/437 | 0 |
| (1,0) | 320/401 | 1 |
| (1,1) | 64/199 | 0 |

### 用一次改动验证“学习”确实发生

仅把最后一条训练记录的标签由 1 改为 0，输入仍为 (0,0)。重新 `fit` 后，`counts` 变为 (7,3)，`prior` 变为 (7/10,3/10)，两类的 `theta` 分别变为 (2/9,5/9) 与 (4/5,1/5)。学习算法相同，训练证据改变，拟合状态也改变。

相反，固定训练资料和模型，只改变六条保留邮件的标签，预测应完全相同；计分却可能改变。代码枚举这六个标签的全部 64 种组合来检查这一点。保留特征改变时，预测可以改变，但只要它们没有传入 `fit`，原训练状态仍不受影响。

这不是把几个概率常量手写好再相乘：`fit` 的输出由传入记录算出，修改训练标签的断言会检验这一数据依赖。本例按联合模型做频率估计与平滑，**没有直接搜索训练分类错误最少的参数**。

## 4. 保留评估：4/6 并没有胜过常数基线

在拟合之外，另保留六条不同的虚构邮件。字段、平滑强度、基线和“平局取 0”的规则都事先固定；保留特征与标签都不参与 `fit`。预测完才把标签拿来比较：

| 输入 | 真值 | 预测 |
| --- | ---: | ---: |
| (0,1) | 0 | 0 |
| (0,0) | 0 | 0 |
| (1,1) | 0 | 0 |
| (1,0) | 0 | 1 |
| (1,0) | 1 | 1 |
| (0,0) | 1 | 0 |

混淆矩阵约定**行是真值、列是预测，顺序为 0、1**：两行分别为 (3,1)、(1,1)。也就是 TN=3、FP=1、FN=1、TP=1。

- 训练记录答对 8/10，只描述用于拟合的资料
- 保留记录答对 4/6，准确率为 2/3
- 正类精确率、召回率与 F1 均为 1/2
- 始终预测 0 的基线也答对 4/6，但漏掉两个正类；本模型找回其中一个，同时增加一次误报

两者总准确率持平，错误的构成却不同。是否值得交换，要看任务的错误成本，不能仅凭模型名字或一个总分判断。指标分母与零分母边界见 [精确率与召回率](?view=garden&scope=concept:precision-recall) 和 [准确率与 F1](?view=garden&scope=concept:accuracy-f1)。

这里没有比较多个候选方案，故没有虚构一次验证集选择。如果你看完这六行后挑选更好的 $\alpha$、输入字段或阈值，它们就参与了选择；应增加验证过程，并用另一批未参与选择的资料作最终评价。具体信息边界见 [训练、验证、测试与数据泄漏](?view=garden&scope=branch:llm:training/samples)。

这些邮件是人为安排的，六行也很少，不能给出总体性能保证。标签噪声、有限特征、选择偏差和部署分布变化都可能限制外推；训练分数不能代替泛化证据。进一步的 [统计推断](?view=garden&scope=concept:statistical-inference) 与 [置信区间](?view=garden&scope=concept:confidence-interval) 也需要抽样假设，不会自动把教学构造变成真实实验。

## 5. 两个独立性反例

### 边际独立，不代表给定类别后独立

另造四行等权数据：输入 (0,0)、(0,1)、(1,0)、(1,1)，标签依次为 0、1、1、0。这是 XOR：只有两个输入不同才属于 1。

不看标签时，两个属性各有一半为 1，两者同时为 1 的比例是 1/4，等于边缘概率之积，所以两个输入边际独立。但只看标签 0，剩下 (0,0) 与 (1,1)：每项仍各有一半为 1，同时为 1 的比例却是 1/2，而非 1/4，故给定类别后不独立。

每类每项都恰有一半为 1，平滑后仍是 1/2；两类先验也相同。该模型于是对四个输入全给出 (1/2,1/2)，固定平局规则只预测 0，答对 2/4。这是**同一四行上的表示限制演示**，不是保留泛化成绩。信息藏在两项的组合里，只估计单项条件分布没有保留这种组合关系。

### 条件独立，也不代表边际独立

再定义一个完整的混合模型：两类概率各为 1/2；类 0 中两项各以 1/4 的概率为 1，类 1 中各为 3/4；每一类内部，两项都按独立方式产生。

混合后，两项各自为 1 的概率都是 1/2。但同时为 1 的概率为：

$$
\frac12\left(\frac14\right)^2+\frac12\left(\frac34\right)^2=\frac5{16}
$$

5/16 不等于 1/4，所以边际上不独立。两个反例共同提醒：判断独立时不能丢掉“给定什么”的条件。它们是本文原创有限概率计算，代码用精确分数断言。

## 6. 可运行实验：拟合、预测、评估与反例

这是一组有意限定范围的接口：

- `fit(train)`：仅接收内置 `list`/`tuple`，2–1000 行；每行恰好三个内置整数位，值只能为 0/1，两类必须都出现。返回冻结的 `Model`
- `Model`：字段依次为 `counts, ones, prior, theta`，均为不可变元组，概率使用 `Fraction`。预测函数只接受**未改动的 `fit` 返回值**；它不是外部模型格式校验器
- `masses(model, x)`：`x` 是恰好两个内置整数位组成的列表或元组，返回正的精确联合质量 (w0,w1)
- `posterior(model, x)`：返回相加为 1 的两个 `Fraction`，指拟合模型内的类别后验，不是参数后验或校准保证
- `predict(model, x)`：返回整数 0/1；平局返回 0，不改变模型状态

上述数据形状或数值违规抛出 `ValueError`，包括布尔值、浮点数、字符串、缺失值、未知类别和迭代器；内部 `bits` 只检查这个窄域。固定两个特征、两个类和 $\alpha=1$，没有样本权重、自动调参、阈值参数或通用数据清洗。

```python
# nextchina-example: supervised-learning-naive-bayes
from dataclasses import dataclass
from fractions import Fraction
from itertools import product


@dataclass(frozen=True)
class Model:
    counts: tuple
    ones: tuple
    prior: tuple
    theta: tuple


def bits(value, length):
    if (type(value) not in (tuple, list) or len(value) != length
            or any(type(v) is not int or v not in (0, 1) for v in value)):
        raise ValueError('expected a fixed-length list/tuple of integer bits')
    return tuple(value)


def fit(train):
    if type(train) not in (tuple, list) or not 2 <= len(train) <= 1000:
        raise ValueError('expected 2..1000 training rows')
    train = tuple(bits(row, 3) for row in train)
    counts = tuple(sum(row[2] == y for row in train) for y in (0, 1))
    if 0 in counts:
        raise ValueError('both class labels must occur in training')
    ones = tuple(tuple(sum(row[j] for row in train if row[2] == y)
                       for j in (0, 1)) for y in (0, 1))
    prior = tuple(Fraction(n, len(train)) for n in counts)
    theta = tuple(tuple(Fraction(ones[y][j] + 1, counts[y] + 2)
                        for j in (0, 1)) for y in (0, 1))
    return Model(counts, ones, prior, theta)


def masses(model, x):
    x = bits(x, 2)
    return tuple(model.prior[y]
                 * (model.theta[y][0] if x[0] else 1 - model.theta[y][0])
                 * (model.theta[y][1] if x[1] else 1 - model.theta[y][1])
                 for y in (0, 1))


def posterior(model, x):
    w = masses(model, x)
    return tuple(v / sum(w) for v in w)


def predict(model, x):
    w0, w1 = masses(model, x)
    return int(w1 > w0)  # Equal masses select 0.


# Different invented messages may have the same feature vector.
# Columns: has_link, known_sender_at_arrival, y (1 means junk).
train = ((0, 1, 0), (0, 1, 0), (0, 1, 0), (0, 1, 0),
         (1, 0, 0), (0, 0, 0),
         (1, 0, 1), (1, 0, 1), (1, 0, 1), (0, 0, 1))
holdout = ((0, 1, 0), (0, 0, 0), (1, 1, 0), (1, 0, 0),
           (1, 0, 1), (0, 0, 1))
model = fit(train)  # No held-out features or labels enter fit.
assert model.counts == (6, 4)
assert model.ones == ((1, 4), (3, 0))
assert model.prior == (Fraction(3, 5), Fraction(2, 5))
assert model.theta == ((Fraction(1, 4), Fraction(5, 8)),
                       (Fraction(2, 3), Fraction(1, 6)))
assert masses(model, (1, 0)) == (Fraction(9, 160), Fraction(2, 9))
expected = {(0, 0): Fraction(160, 403), (0, 1): Fraction(32, 437),
            (1, 0): Fraction(320, 401), (1, 1): Fraction(64, 199)}
for x, p1 in expected.items():
    assert posterior(model, x)[1] == p1
    print(x, 'P_model(junk|x)=', p1, 'prediction=', predict(model, x))

train_correct = sum(predict(model, row[:2]) == row[2] for row in train)
predictions = tuple(predict(model, row[:2]) for row in holdout)
matrix = tuple(tuple(sum(row[2] == y and pred == p
                         for row, pred in zip(holdout, predictions))
                     for p in (0, 1)) for y in (0, 1))
assert train_correct == 8
assert predictions == (0, 0, 0, 1, 1, 0)
assert matrix == ((3, 1), (1, 1))  # Rows: true; columns: predicted.
(tn, fp), (fn, tp) = matrix
accuracy = Fraction(tn + tp, len(holdout))
precision = Fraction(tp, tp + fp)
recall = Fraction(tp, tp + fn)
f1 = Fraction(2 * tp, 2 * tp + fp + fn)
baseline = Fraction(sum(row[2] == 0 for row in holdout), len(holdout))
assert accuracy == baseline == Fraction(2, 3)
assert precision == recall == f1 == Fraction(1, 2)
print('training correct:', train_correct, '/', len(train))
print('held-out predictions:', predictions, 'confusion:', matrix)
print('accuracy:', accuracy, 'baseline:', baseline)
print('precision, recall, F1:', precision, recall, f1)

# Change a training label: fitted state changes.
changed_train = train[:-1] + ((0, 0, 0),)
changed_model = fit(changed_train)
assert changed_model.counts == (7, 3)
assert changed_model.prior == (Fraction(7, 10), Fraction(3, 10))
assert changed_model.theta == ((Fraction(2, 9), Fraction(5, 9)),
                               (Fraction(4, 5), Fraction(1, 5)))
assert changed_model != model
assert Fraction(model.ones[1][1], model.counts[1]) == 0
assert model.theta[1][1] == Fraction(1, 6)

# Holdout labels affect scoring, not prediction or fitting.
for labels in product((0, 1), repeat=len(holdout)):
    altered = tuple((r[0], r[1], y) for r, y in zip(holdout, labels))
    assert tuple(predict(model, r[:2]) for r in altered) == predictions
    assert fit(train) == model

# XOR is a separate representation test, using the same four rows.
xor = tuple((a, b, a ^ b) for a, b in product((0, 1), repeat=2))
xor_model = fit(xor)
assert xor_model.theta == ((Fraction(1, 2),) * 2,) * 2
assert all(posterior(xor_model, r[:2]) == (Fraction(1, 2),) * 2
           for r in xor)
assert all(predict(xor_model, r[:2]) == 0 for r in xor)
assert sum(predict(xor_model, r[:2]) == r[2] for r in xor) == 2
assert Fraction(sum(a * b for a, b, y in xor), 4) == Fraction(1, 2)**2
joint_given_zero = Fraction(sum(a * b for a, b, y in xor if y == 0), 2)
assert joint_given_zero == Fraction(1, 2) != Fraction(1, 2)**2

# Independent within each class, dependent after mixing the classes.
marginal = Fraction(1, 2) * (Fraction(1, 4) + Fraction(3, 4))
joint = (Fraction(1, 2) * Fraction(1, 4)**2
         + Fraction(1, 2) * Fraction(3, 4)**2)
assert marginal == Fraction(1, 2)
assert joint == Fraction(5, 16) != marginal**2
print('XOR: 2/4 on the same four rows; all checks passed')

# Executable input boundaries; scores above use nonzero denominators.
for invalid_call in (
        lambda: fit([]),
        lambda: fit(((0, 0, 0), (1, 1, 0))),
        lambda: fit(((0, 0, 0), (1, 1, 2))),
        lambda: predict(model, (True, 0)),
        lambda: posterior(model, (1.0, 0)),
        lambda: masses(model, (1,))):
    try:
        invalid_call()
    except ValueError:
        pass
    else:
        raise AssertionError('invalid input accepted')
```

`Fraction` 让本例的两个因子乘积和归一化保持精确，便于核对算术；它不会消除建模或抽样误差。一般 Bernoulli NB 的计数工作量为 $O(Nd)$，参数存储与单次预测分别为 $O(Kd)$，其中 $N,d,K$ 是样本数、特征数、类别数。这里固定 $K=d=2$；这些算术操作量不代表任意大整数的位运算成本。很多特征连乘时，常改用对数质量和稳定归一化；本例没有实现这种扩展。

## 7. 名称里的 Bayes，没有承诺什么

**类别先验与参数先验是两件事。** 这里的 `prior` 是类别分布 $P(Y)$ 的估计，在训练之后已经固定；参数上的先验 $P(\theta)$ 则描述对未知参数的分布。`posterior` 用固定参数应用贝叶斯规则，得到类别的 $P_{\rm model}(Y\mid x)$。代码没有维护参数后验，也没有对参数不确定性积分。

加一平滑可以有贝叶斯解释，但要说清楚是哪一种。对单个 Bernoulli 条件参数，本文的 $(s+1)/(n+2)$ 也等于 Beta(2,2) 先验下的参数 MAP 点估计；均匀 Beta(1,1) 先验下的 MAP 则是频率 $s/n$，不能把二者混称。[5] 这个解释仍没有把当前程序变成完整的贝叶斯参数推断器。

平滑只避免固定特征空间里的条件参数等于 0 或 1。它不会发现未知类别、补全缺失字段、纠正相关性或保证概率校准。分类正确仅要求正确类别得分较高，概率准确要求更多；来源也提醒不能把朴素贝叶斯概率输出当作天然可靠的概率估计。[4][6] 本页没有校准实验。

## 8. 自检与答案

**问题 1：训练输入和输出是什么？新邮件的真实标签放在哪里？**

答案：`fit` 输入是带 `y` 的三字段训练行，输出是含计数、`prior` 和 `theta` 的 `Model`。`predict` 只接收模型与两个输入字段；真实标签由评估代码与预测结果比较，不传给预测函数。

**问题 2：哪些数是学到的，哪些是预先指定的？把训练资料复制一遍，概率一定不变吗？**

答案：`counts, ones, prior, theta` 来自训练行；字段定义、类别集合、$\alpha=1$ 和平局取 0 是预设。复制数据使类别比例不变，但伪计数相对作用变小：普通类第一个条件参数从 2/8=1/4 变为 3/14，因此不能把复制数据当作平滑模型的不变性。

**问题 3：同一输入为什么可以有不同标签？8/10 训练准确率为什么不能替代泛化证据？**

答案：训练和保留资料中的 (1,0) 都对应过不同标签；两个二元属性不足以决定邮件的全部含义。训练记录已经参与估计，8/10 描述的是已用资料；本例另评估六条保留记录只得到 4/6，且未胜过常数基线。这仍只是人工构造，不能外推真实效果。

**问题 4：去掉“已知发件人”属性为 0 时的因子，会得到同一个模型吗？**

答案：不会。对 (1,0)，当前质量为 9/160 与 2/9；缺席因子分别为 3/8 和 5/6，它们对两类的影响不同。删除它们改变似然和归一化后的概率，不是简化同一个 Bernoulli 计算。

**问题 5：只检查两个特征总体上独立，足以验证 NB 假设吗？**

答案：不够。XOR 的输入边际独立，给定标签却不独立；反方向的混合模型在每类内部独立，边际却相关。必须检查所需的条件联合关系，而且有限样本检查也不能证明真实分布永远满足假设。

## 来源与核验范围

[1] Poole、Mackworth，[Artificial Intelligence: Foundations of Computational Agents，第 3 版，§7.2](https://artint.info/3e/html/ArtInt3e.Ch7.S2.html)。核对监督学习的输入、目标、训练样本、输出预测器及分类/回归边界；§7.2.1 讨论损失与预测评价。

[2] Tom M. Mitchell，[Generative and Discriminative Classifiers: Naive Bayes and Logistic Regression](https://www.cs.cmu.edu/~tom/mlbook/NBayesLogReg.pdf)，§1、§2.1–2.3，PDF 第 1–6 页。实际文件封面为 **2020-10-01 draft**；核对条件独立的联合分解、Bayes 分类、计数与平滑。只链接作者原件，不转载 PDF。

[3] Manning、Raghavan、Schütze，[Introduction to Information Retrieval：The Bernoulli model](https://nlp.stanford.edu/IR-book/html/htmledition/the-bernoulli-model-1.html)，§13.3。核对二元出现/缺席、$n_c+2$ 分母及与计数事件模型的区别；书为 2008 年版，网页日期为 2009-04-07。

[4] scikit-learn，[Naive Bayes User Guide](https://scikit-learn.org/stable/modules/naive_bayes.html)，§1.9，尤其 Bernoulli、Multinomial、Categorical 段。核对变体边界与概率输出警告；本次访问显示 **1.9.1 文档**，`stable` 地址会随版本变化。本页未调用该库，也不声称 API 完整兼容。

[5] Tom M. Mitchell，[Estimating Probabilities](https://www.cs.cmu.edu/~tom/mlbook/Joint_MLE_MAP.pdf)，§2.2、式 (9)，PDF 第 10–12 页。实际文件封面为 **2018-01-26 draft**；核对参数 MAP、Beta 先验和伪计数关系。只链接作者原件，不转载 PDF。

[6] Manning、Raghavan、Schütze，[Introduction to Information Retrieval：Properties of Naive Bayes](https://nlp.stanford.edu/IR-book/html/htmledition/properties-of-naive-bayes-1.html)，§13.4。用于区分分类排序正确与概率估计准确；没有引用书中的真实语料性能结论。

核验日期：2026-10-05（UTC）。本页邮件、计数、精确分数及独立性反例均为原创教学构造；执行断言只能检查相应算术与输入契约，不等于外部效果评测或独立专家复核。

独立讲解范围仅为**监督学习**与**朴素贝叶斯**；后续阅读入口不代表同时完成分类任务全景、数据标注、概率校准、其他学习器或统计推断的独立覆盖。本文审查状态保留 `needs-independent-review`。
