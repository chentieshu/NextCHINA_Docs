// Exact accepted v2 manuscript semantics, frozen independently of live DOM snapshots.
import { registerLinearGeneralizationTests, type LinearGeneralizationLesson } from './linear-generalization-reader';

const lesson = {
  "article": {
    "id": "linear-logistic-regression",
    "file": "content/models/classical/linear-logistic-regression.md",
    "space": "models",
    "category": "classical-supervised-learning",
    "categoryName": "经典模型与监督学习",
    "title": "线性与逻辑回归：怎样拟合数值和事件概率？",
    "subtitle": "截距、设计矩阵与最优值，从精确最小二乘到有停止诊断的逻辑训练",
    "date": "2026-10-05",
    "tags": [
      "线性回归",
      "逻辑回归",
      "最小二乘",
      "截距",
      "似然",
      "优化边界"
    ],
    "excerpt": "精确拟合三条数值记录，再用梯度实际拟合八条二元记录，检查系数唯一性、决策阈值、可分数据的无有限最优值与稳定损失计算。",
    "knowledgeUnit": {
      "kind": "independent-explanation",
      "reviewStatus": "needs-independent-review",
      "exampleId": "linear-logistic-regression",
      "conceptIds": [
        "concept:linear-models"
      ],
      "placements": [
        {
          "hubId": "hub:ai-overview",
          "path": "orientation/linear-models"
        }
      ],
      "sourceUrls": [
        "https://cs229.stanford.edu/notes2022fall/main_notes.pdf",
        "https://www.cs.cmu.edu/~tom/mlbook/NBayesLogReg.pdf",
        "https://www.jmlr.org/papers/v19/18-188.html",
        "https://nhigham.com/2021/01/05/what-is-the-log-sum-exp-function/"
      ],
      "relatedResourceIds": []
    }
  },
  "name": "线性与逻辑回归课",
  "parent": "topic:classical-ml",
  "articleSha256": "556c2a54d851db96ff05f2808d87cd6fce5e0bb0fd8cfb0b2f2e1113812f8a27",
  "codeSha256": "5794b32665eebc907ad91997834bfe31a6b008e587ed301a81d2ec91ab6e9a87",
  "suffixSha256": "7e80d820cb87d3cb5730f960e4fe03489ca494fb57f03dbb8f0b395c34c4ac0b",
  "proseBlocks": [
    {
      "kind": "blockquote",
      "parts": [
        "本页解决的问题：同样是特征的加权和，怎样分别预测数值和二元事件？截距与系数怎样从标签拟合？什么时候最佳系数不唯一，甚至没有有限最优值？",
        "前置是监督学习与朴素贝叶斯里的训练、拟合状态、预测之分，以及导数与链式法则里的偏导数。下面会补足截距、设计矩阵和对数几率。两组数据都是原创的虚构教学记录，不是实测设备结果；程序只处理有界的单个数值特征。"
      ],
      "fields": [
        "本页解决的问题"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "假设一台仪器在读取时提供特征 x，我们后来才取得目标 y。如果 y 是连续读数，可以先选仿射预测器："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "如果 y 表示“后续窗口中某事件是否发生”，只能取 0 或 1，则先算分数，再把分数变成模型概率："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这两者都要从带标签的训练记录中拟合 b,w，但输出意义、损失和最优值的存在条件都不同。逻辑回归名称中有“回归”，本页用途却是二元事件建模与分类；数值回归的仿射输出没有自动落在 [0,1] 内。[1]"
      ],
      "fields": [
        "输出意义、损失和最优值的存在条件都不同"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "更一般地，先固定特征表示 \\phi(x)，再学习系数："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“线性”指对待拟合系数的线性关系。固定使用 x 和 x^2 两个特征，仍是线性系数模型，却可以画出一条抛物线。特征值是每条记录的输入；b,w_j\\, 是训练后保存的参数。截距 b 允许仿射分数整体上下移动。删去截距后，分数在特征空间原点 \\phi(x)=0 处必须为零；逻辑回归在这里的概率是 \\sigma(0)=1/2。原始输入 x=0 未必映射到特征空间原点。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这里没有把 w 解释成干预效果：输入变化时模型预测怎样变，与人为改变输入会使结果怎样变，是两个问题。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对 n 条训练记录，定义每行设计向量 a_i^T\\,，其中第一项恒为 1："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "把 a_i^T\\, 堆成 n\\times(d+1) 的矩阵 A，则整批预测为 A\\theta。本页使用均值半平方误差，不是平方误差总和："
      ],
      "fields": [
        "均值半平方误差"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "因此最优参数满足正规方程："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "它也在说：预测减观测的残差与每一列设计特征正交。含常数列时，残差之和为零；单特征时，x_i\\, 加权残差之和也为零。[1]"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "为什么这里的驻点就是全局最优？若 \\theta_*\\, 满足正规方程，展开平方并消去交叉项，可得："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "后项非负。如果 A 满列秩，即不同列没有非零线性组合等于零，则只有 v=0 才使后项为零，系数唯一。样本数不少于列数只是必要条件，不能替代满列秩检查。若秩不足，最小二乘仍有解、训练预测向量仍唯一，但系数可能有无穷多组；这时不能直接使用矩阵求逆式。真实数值计算通常还要考虑病态程度，本文不实现一般矩阵求逆或通用最小二乘求解器。"
      ],
      "fields": [
        "满列秩"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "使用三个不同的虚构观测，x 已预先用同一尺度表示："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "此处 \\sum x_i=0、\\sum x_i^2=2、\\sum y_i=4、\\sum x_iy_i=3，所以正规方程变为："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "解为 b_*=4/3、w_*=3/2。逐行检查："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "残差之和与加权和均为零。均方误差 MSE 为 1/18，而本文的目标 L_{\\rm sq}\\, 是它的一半，即 1/36。更强的、对所有 b,w 成立的证书是："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "两个平方项只能同时在上述系数处为零，因此最优值存在且唯一。注意第一个拟合值为负；无约束仿射回归不会自动遵守某项物理读数非负的要求。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "另有三条记录，输入都为 2，输出为 1、3、5。这些数据只识别出："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "例如 (b,w)=(3,0) 与 (1,1) 都让训练预测等于 3，MSE 都为 8/3。但在未观测的 x=0 处，两者分别预测 3 和 1。相同训练拟合值，并不保证离开已观测的特征关系后仍相同。"
      ],
      "fields": [
        "相同训练拟合值，并不保证离开已观测的特征关系后仍相同。"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "后面的精确拟合函数只承诺返回唯一系数，所以拒绝常数 x。错误信息是“系数不唯一”，不是“最小二乘无解”。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "当 0<p<1，几率为 p/(1-p)。逻辑回归把它的对数设为仿射分数："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "反解得到 sigmoid："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "有限实数分数给出严格介于 0 和 1 的数学概率；计算机上的舍入可能把它变成恰好 0 或 1。w 表示 x 增加一单位时模型对数几率增加多少，e^w 是相应的模型几率比，不是概率差，也不是因果效应。"
      ],
      "fields": [
        "模型几率比"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "把不同记录的条件标签建模为独立的 Bernoulli 观测，条件似然为各记录概率的乘积。取负对数并除以 n。下文 \\log 都是自然对数，平均 NLL 的单位为 nat/记录："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "由 \\sigma'(z)=p(1-p) 与链式法则，单行对分数的导数为 p-y，因此："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这直接拟合 P(Y\\mid X)。前一课的朴素贝叶斯则先估计 P(Y) 与 P(X\\mid Y)，再得到条件概率；不能把它的“给定类别后特征独立”假设搬给逻辑回归。[2] 记录间的独立假设与一条记录内特征间的条件独立也不是一回事。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "下面每组四台都是不同的虚构设备；同一个 x 可以对应不同事件标签。x 是事先取得的标准化特征，y 在之后的观察窗口形成："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "记 p_0=\\sigma(b)、p_1=\\sigma(b+w)。八行的平均损失为："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对单组事件比例 q，其交叉熵对 p 的导数是："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "故两组分别在 p_0=1/4、p_1=3/4 处最小。两组都含 0 和 1，任一组概率逼近 0 或 1 都会让该组损失发散；不会出现只靠无穷大系数取得更好极限的情况。两组对数几率又唯一决定 b,w："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这不是一般逻辑回归的闭式解，而是特定两组数据给出的独立核对答案。程序仍逐行读取标签，真正执行梯度更新；不会直接返回上述系数。"
      ],
      "fields": [
        "独立核对答案"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "重复的 x 没有使这里的设计矩阵失去满列秩：常数列与取值为 0、1 的特征列并非倍数。一般向量形式的 Hessian 为："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "在本例最优点，按 (b,w) 排列："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对有限系数，若设计矩阵满列秩，Hessian 正定，因此损失严格凸，若有限最小点存在，则它唯一。存在性仍要另外检查，下一节给出反例。"
      ],
      "fields": [
        "若有限最小点存在，则它唯一"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本文预先声明规则：p\\geq\\tau 判为 1，否则判为 0；恰好相等取 1。默认 \\tau=1/2。对本例的精确最优参数："
      ],
      "fields": [
        "恰好相等取 1"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "于是训练的两个特征组分别判为 0、1。边界处模型概率为 1/2，但训练中没有 x=1/2 的设备；它是指定函数形式给出的插值，并非该点实际频率的观测证据。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "若把阈值改为 0.8，两组都判为 0；系数、模型概率和原来的训练 NLL 都不变。阈值选择要考虑错误成本与验证流程，不能偷偷用最终测试标签来选它。默认阈值也没有自动表达任何真实业务成本。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "有限次迭代的系数只是近似值，计算出的边界可能略有偏差。“打印成 0.50”不表示未经舍入的概率恰好相等；代码按实际计算值比较，不额外制造一个模糊平局区。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "改用两条记录 (-1,0) 和 (1,1)，不加正则项。沿着 b=0,w>0："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "任意有限 w 时损失都大于零，w\\to+\\infty 时趋于零；因此下确界为零，但没有任何有限系数取得它。任意有限参数的每行 Bernoulli NLL 都严格为正，也不可能在这条路径之外取得零。与此同时，只要 w>0，默认阈值下两条记录就已经全部分对。[3]"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "所以："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "分类准确率不再变化，不代表 NLL 已达到最小值",
        "优化器返回两个有限数字，不是有限最小点存在的证明",
        "梯度很小也可能是系数已经很大、损失曲线很平；小梯度不能普遍保证参数误差很小",
        "加惩罚项会改变问题；本页保留这个反例，不悄悄用正则化把它消掉"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "常数特征对逻辑回归的影响也要分情况。例如 x=2 时各有一个 0 和 1，b+2w=0 都达到同一个最优概率。后面的逻辑学习器允许这类数据，返回从零初始化得到的一组状态，而不声称系数唯一。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本程序每次使用全部训练行，计算同一份平均损失的梯度，再同时更新 b,w。对单特征设计 a_i=(1,x_i)^T，任意向量 v 有："
      ],
      "fields": [
        "平均"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "第一步用了 p(1-p)\\leq1/4，第二步是点积的 Cauchy–Schwarz 不等式。因此 L_{\\rm bound}\\, 是梯度的全局 Lipschitz 上界。用步长 \\alpha=1/L_{\\rm bound}\\,，在精确算术下，光滑性不等式给出："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这解释了该步长的选择，却没有证明所有输入都有有限最小点，也没有承诺 2000 步内达到任意精度。浮点算术还会带来舍入。把 x 的原点平移，数学上的预测族可以等价，优化的坐标几何、上述上界与实际停止步数却会变化。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本例从 b=w=0 开始，初始梯度为 (0,-1/8)，L_{\\rm bound}=3/8，所以第一次更新得到 (0,1/3)。这一步已经可独立核对，不能靠把最终答案写进函数来冒充训练。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "停止状态只报告两件事之一：gradient 表示返回点的梯度 L2 长度不大于容差；budget 表示更新预算用完。steps 是完成的更新次数；损失和梯度长度对应返回的参数。零步预算也可检查初始化状态；若初始化已经满足容差，会先报告 gradient。"
      ],
      "fields": [
        "返回的参数"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "数学上，单行损失还可写成 \\log(1+e^z)-yz。直接计算 e^{1000} 会溢出；先算 sigmoid 再对错误类别概率取对数，也可能遇到舍入的零。对 y\\in\\{0,1\\}，使用等价形式：[4]"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "程序用 log1p 计算最后一项。指数的自变量不会是巨大正数，也不需要从两个很大的近等数相减得到小损失。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "当 z=1000,y=0 时，损失约为 1000，是有限值；当 z=1000,y=1 时，数学损失是一个极小正数，在通常双精度下可能下溢成 0。负分数时对调标签即可。稳定形式避免这里的溢出，并不保证无限精度，也不把舍入的零变成“事件绝对不会发生”。代码计算 y=1 的梯度残差时用 -\\sigma(-z)，避免过早在 \\sigma(z)-1 中消掉仍可表示的小量。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "输入契约故意很窄，便于看清学习过程："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "两种训练函数都只接收内置 list 或 tuple，含 2–32 行；每行也是二元素列表或元组。x 是绝对值不超过 8 的内置整数；布尔值不是合法整数输入",
        "仿射目标是绝对值不超过 100 的整数，返回精确 Fraction 系数；常数 x 被拒绝。逻辑目标只能是整数 0 或 1，允许常数特征或单一标签，但不保证有限最优值存在",
        "预测只收拟合状态与 x，不收标签。查询允许绝对值不超过 8 的整数、有限浮点数或 Fraction；仿射模型对有理数查询保留精确算术。这个数值支持范围并非观测过的输入范围，更不代表外推已验证",
        "逻辑训练默认最多 2000 次更新，预算允许 0–5000 的内置整数；容差允许有限整数或浮点数，范围为 [10^{-12},10^{-3}]，默认 10^{-9}。预算与容差排除布尔值",
        "独立的损失梯度函数返回损失与梯度二元组，梯度按截距、斜率排序。参数只支持绝对值不超过 10000 的有限内置整数或浮点数。单行损失的分数上限是绝对值 100000，标签仍须是整数 0 或 1",
        "阈值是严格处于 0 与 1 之间的有限内置整数或浮点数，排除布尔值。契约外输入抛出 ValueError；状态只支持函数返回的不可变记录，不承诺手工伪造记录的行为。函数不修改调用方的训练行"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "以下是一个完整程序。它不安装学习库，不读文件，不用随机数，也不使用解析参考系数来代替学习："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "常见双精度环境下，仪器拟合得到 b=4/3,w=3/2；设备拟合的参数约为 −1.09861227、2.19722455，两组概率约为 0.25、0.75。该示例运行报告 180 次更新、gradient，平均 NLL 约 0.5623351446；最后几位与临界停止步数可能随浮点环境略有差异。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "可分反例只给 20 次更新，报告 budget，损失约 0.02434151。它不是“训练失败所以数学上无解”的证据：没有有限最小点已经由前面的极限推导建立；有限运行只展示这种边界下的真实停止诊断。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "与示例配套的独立算术检查使用精确平方证书和高精度 Bernoulli 计算，另改标签、改输入原点、翻转全部标签、复制完整记录，并检查零步与一步输出。复制完整记录不改变本文的均值目标与梯度；它不等于获得更多独立信息。若把损失换成总和，却只改变梯度或只改变步长，已经不再遵循同一尺度约定。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "代码是小规模教学实现。仿射拟合只需遍历数据；逻辑训练每次更新也遍历全部数据，工作量随 n 与实际步数相乘增长。它不处理缺失值、任意维特征、样本权重、置信区间或通用优化诊断。查询的 Fraction 只限制值域，未限制分子、分母的位数；固定示例与固定检查的运行预算，不是任意巨大有理数表示的运行时间保证。多维拟合与数值线性代数的工程实现需要另外设计，不能把这个短程序当作生产求解器。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "概率落在 0 到 1，不等于校准。 本例两组拟合概率等于训练事件比例，是这份数据与模型结构共同产生的结果。要判断部署概率是否可靠，需要匹配目标人群与时间窗口的独立观测，并检查相应的概率评价；参见概率校准、Brier 与分箱。小训练 NLL 不能替代这些证据。"
      ],
      "fields": [
        "概率落在 0 到 1，不等于校准。"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "系数不自动具有因果意义。 例如较大的设备输入可能同时对应不同使用环境；拟合只描述在所用表示和资料下的预测关联。解释干预效果还需要研究设计、混杂处理等额外依据，不能由系数符号或拟合优度推出来。"
      ],
      "fields": [
        "系数不自动具有因果意义。"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "可计算不等于可外推。 精确设备模型在 x=2 时给出 27/28，但训练只观测了 0 和 1；这个数来自延长所选对数几率直线。它没有证明新设备、不同量程或未来环境仍遵循同一关系。即使仍在数值 API 支持范围内，也可能已经离开观测范围。"
      ],
      "fields": [
        "可计算不等于可外推。"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "训练最优不等于新样本最优。 本页解决的是既定表示、数据与目标下如何拟合。是否过拟合、如何选择模型族或阈值，要有另一层评价设计；训练、验证、测试与泄漏解释这些数据角色。"
      ],
      "fields": [
        "训练最优不等于新样本最优。"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "把三条仪器响应都加 2，输入不变。不重新做三次预测的平方展开，求新系数、残差和最优 MSE。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "答案： 新截距为 10/3，斜率仍为 3/2。每个预测也加 2，所以预测减观测的残差仍为 (-1/6,1/3,-1/6)，MSE 仍为 1/18。有截距的表示容许整体平移；删掉截距后，这个结论就不再自动成立。"
      ],
      "fields": [
        "答案："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "把输入改写成 x'=x+3，目标不变。原函数怎样改写？为什么不能据此宣称梯度程序每一步也完全不变？"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "答案： 代入 x=x'-3，新斜率不变，新截距为 b-3w；仪器例得到 -19/6 与 3/2。预测函数代表同一关系，但优化坐标、梯度和数据导出的步长上界改变；有限步数输出不必按同样规则精确变换。这个区分也适用于逻辑模型。"
      ],
      "fields": [
        "答案："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "把八条设备标签全部翻转，0 变 1、1 变 0。新的最优系数与最小 NLL 是什么？如果只改保留集标签呢？"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "答案： 训练标签翻转使模型概率变成 1-p，最优系数变为 b=\\log3,w=-2\\log3，最小平均 NLL 不变。若只改保留集标签，训练拟合状态与输入对应的预测不变，评价分数则可能改变；预测函数没有读取保留集标签的入口。"
      ],
      "fields": [
        "答案："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "保持原来的设备模型，把阈值从 0.5 改为 0.8。训练两组的类别、概率、参数与 NLL 各怎样变化？若未经舍入的概率恰好等于阈值呢？"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "答案： x=0 仍判为 0，x=1 从 1 变成 0；概率仍为 1/4,3/4，参数与 NLL 不变。本文平局取 1。更高阈值只是改变决策，不能被描述成“把概率重新训练得更谨慎”。"
      ],
      "fields": [
        "答案："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "所有仪器输入都是 2，响应为 1、3、5。写出两组不同最优参数，比较它们在 x=2 与 x=0 的预测。再问：使用固定特征 (x,x^2) 是否还是线性模型？额外复制一列 x 呢？"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "答案： (3,0) 与 (1,1) 都满足 b+2w=3，在训练点都预测 3，在 x=0 分别预测 3 和 1。使用 x^2 仍对系数线性，但不必是输入的一条直线；重复一列 x 则不能区分两列各自的系数，只能识别它们的和。增加列数不自动增加独立方向。"
      ],
      "fields": [
        "答案："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对两条可分设备记录，某次运行已经全部分对，但仍有正 NLL。能否断言学习器写错了？把 z=1000 的 sigmoid 打印为 1，又能否断言其错误标签损失为无穷大？"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "答案： 都不能。该无惩罚模型没有有限最小点，系数继续增大可让正损失继续下降；完美分类不是有限 NLL 最优证书。有限分数的错误标签损失约为 1000，稳定 logit 计算仍然有限；“先舍入概率再取对数”才制造了这里不必要的无穷大。"
      ],
      "fields": [
        "答案："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本例两个设备组的拟合概率恰好等于各自训练比例。一位同事据此声称“概率已经校准，斜率还证明了输入的因果作用”。指出两条断言各缺什么。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "答案： 校准仍需目标场景的独立结果资料与适当评价，不能只复述参与拟合的组内频率。因果解释还需要支持干预识别的研究设计或明确、可信的额外假设。损失下降、sigmoid 有界与这两种证据均不是同一件事。"
      ],
      "fields": [
        "答案："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "继续阅读：熵、交叉熵与 KL解释概率损失；特征分解、SVD 与低秩进一步讨论秩；正则化与泛化说明加入惩罚项后目标怎样改变。这些是延伸入口，不是本文额外完成的概念覆盖。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "[1] Andrew Ng，Tengyu Ma 更新，CS229 Lecture Notes，2022 Fall 存档。存档路径标为 2022 Fall，PDF 页眉为 Spring 2022；不把目录名当作另一个发布日期。核对第 1 章 §1.2.2、印刷页 14–15 的设计矩阵与正规方程，第 2 章 §2.1、印刷页 20–22 的 logistic 条件似然与梯度。本文自行声明均值损失，并补足秩与有限最优值的条件。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "[2] Tom M. Mitchell，Generative and Discriminative Classifiers，实际封面为\n2020-10-01 draft，版权标注 2017。核对 §3 与印刷页 14 附近的条件模型、联合模型区别。只链接原件，不转载 PDF；本文统一采用 \\sigma(z)=1/(1+e^{-z})，不混用来源中另一种符号方向。"
      ],
      "fields": [
        "2020-10-01 draft"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "[3] Soudry、Hoffer、Nacson、Gunasekar、Srebro，The Implicit Bias of Gradient Descent on Separable Data，JMLR 19(70):1–57，2018。核对论文 §2、印刷页 2–3 的可分数据与无有限最小点讨论；本页用两行数据另作直接极限证明，没有把论文的渐近方向结论扩展成此程序的有限预算保证。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "[4] Nick Higham，What Is the Log-Sum-Exp Function?，2021-01-05，网页还显示 2021-01-12。核对移位后的 log-sum-exp 与 log1p 数值处理；本文的二元分支表达式由该思路代数化简得到，不是数值库的精度认证。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "来源重新核对日期：2026-10-05（UTC）。两组记录、平方证书、解析组概率、练习及具体浮点程序均为本页教学构造。可运行检查只验证相应算术、边界与实现契约；不等于外部效果验证、部署验证或独立专家复核。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本页独立讲解范围仅为线性与逻辑回归。阅读链接或术语出现，不为正则化、概率校准、因果推断、SVD 或泛化新增覆盖。审查状态保持 needs-independent-review。"
      ],
      "fields": [
        "线性与逻辑回归"
      ],
      "start": null
    }
  ],
  "headings": [
    {
      "depth": 2,
      "text": "1. 一个加权和，两种预测问题"
    },
    {
      "depth": 2,
      "text": "2. 平方误差：从导数到可检查的最佳拟合"
    },
    {
      "depth": 3,
      "text": "把截距放进设计矩阵"
    },
    {
      "depth": 3,
      "text": "三条仪器记录，精确算出一个最优值"
    },
    {
      "depth": 3,
      "text": "秩不足：有最佳拟合，不一定有唯一系数"
    },
    {
      "depth": 2,
      "text": "3. 逻辑回归：拟合事件概率，再另作决策"
    },
    {
      "depth": 3,
      "text": "为什么是对数几率？"
    },
    {
      "depth": 3,
      "text": "标签通过似然进入拟合"
    },
    {
      "depth": 3,
      "text": "八条不同设备记录：有限且唯一的最优值"
    },
    {
      "depth": 3,
      "text": "概率到类别，还差一个阈值"
    },
    {
      "depth": 2,
      "text": "4. 分得全对，也可能根本没有有限最优系数"
    },
    {
      "depth": 2,
      "text": "5. 有限预算的训练，以及稳定的损失计算"
    },
    {
      "depth": 3,
      "text": "有依据的步长，不是万能收敛承诺"
    },
    {
      "depth": 3,
      "text": "不要先把概率舍入到 0，再对它取对数"
    },
    {
      "depth": 2,
      "text": "6. 可运行实验：精确拟合数值，再实际训练概率模型"
    },
    {
      "depth": 2,
      "text": "7. 拟合完成以后，哪些结论仍然不能下？"
    },
    {
      "depth": 2,
      "text": "8. 迁移练习、答案与常见误区"
    },
    {
      "depth": 3,
      "text": "练习 1：仪器零点整体抬高"
    },
    {
      "depth": 3,
      "text": "练习 2：换特征原点，不换物理记录"
    },
    {
      "depth": 3,
      "text": "练习 3：设备事件定义反过来"
    },
    {
      "depth": 3,
      "text": "练习 4：一次更保守的告警决定"
    },
    {
      "depth": 3,
      "text": "练习 5：重复特征与最佳拟合"
    },
    {
      "depth": 3,
      "text": "练习 6：分类已全对，还要继续增大系数？"
    },
    {
      "depth": 3,
      "text": "练习 7：到底学到了概率，还是学到了训练频率？"
    },
    {
      "depth": 2,
      "text": "来源、版本与核验边界"
    }
  ],
  "tables": [
    [
      [
        "特征 x",
        "观测 y"
      ],
      [
        "−1",
        "0"
      ],
      [
        "0",
        "1"
      ],
      [
        "1",
        "3"
      ]
    ],
    [
      [
        "x",
        "拟合值",
        "残差：拟合值减观测"
      ],
      [
        "−1",
        "-1/6",
        "-1/6"
      ],
      [
        "0",
        "4/3",
        "1/3"
      ],
      [
        "1",
        "17/6",
        "-1/6"
      ]
    ],
    [
      [
        "x",
        "四台设备的标签",
        "事件数 / 记录数"
      ],
      [
        "0",
        "0、0、0、1",
        "1/4"
      ],
      [
        "1",
        "0、1、1、1",
        "3/4"
      ]
    ]
  ],
  "displayMath": [
    "\\widehat y=b+wx.",
    "z=b+wx,\n\\qquad p_{\\rm model}(Y=1\\mid x)=\\sigma(z).",
    "z=b+\\sum_{j=1}^{d}w_j\\phi_j(x).",
    "a_i=\\begin{bmatrix}1\\\\\\phi_1(x_i)\\\\\\vdots\\\\\\phi_d(x_i)\\end{bmatrix},\n\\qquad\n\\theta=\\begin{bmatrix}b\\\\w_1\\\\\\vdots\\\\w_d\\end{bmatrix}.",
    "\\begin{aligned}\nL_{\\rm sq}(\\theta)&=\\frac{1}{2n}\\|A\\theta-y\\|_2^2,\\\\\n\\nabla L_{\\rm sq}(\\theta)&=\\frac1n A^T(A\\theta-y).\n\\end{aligned}",
    "A^TA\\theta=A^Ty.",
    "L_{\\rm sq}(\\theta_*+v)\n=L_{\\rm sq}(\\theta_*)+\\frac{1}{2n}\\|Av\\|_2^2.",
    "\\begin{aligned}\n3b&=4,\\\\\n2w&=3.\n\\end{aligned}",
    "L_{\\rm sq}(b,w)\n=\\frac1{36}\n+\\frac12\\left(b-\\frac43\\right)^2\n+\\frac13\\left(w-\\frac32\\right)^2.",
    "b+2w=3.",
    "\\log\\frac{p}{1-p}=z=b+wx.",
    "p=\\sigma(z)=\\frac1{1+e^{-z}}.",
    "\\begin{aligned}\n\\ell(z_i,y_i)&=-y_i\\log p_i-(1-y_i)\\log(1-p_i),\\\\\nL_{\\rm log}(b,w)&=\\frac1n\\sum_{i=1}^n\\ell(b+wx_i,y_i).\n\\end{aligned}",
    "\\begin{aligned}\n\\frac{\\partial L_{\\rm log}}{\\partial b}\n&=\\frac1n\\sum_i(p_i-y_i),\\\\\n\\frac{\\partial L_{\\rm log}}{\\partial w}\n&=\\frac1n\\sum_i(p_i-y_i)x_i.\n\\end{aligned}",
    "\\begin{aligned}\nL_{\\rm log}=-\\frac18\\bigl[&3\\log(1-p_0)+\\log p_0\\\\\n&+\\log(1-p_1)+3\\log p_1\\bigr].\n\\end{aligned}",
    "\\frac{d}{dp}\\left[-q\\log p-(1-q)\\log(1-p)\\right]\n=\\frac{p-q}{p(1-p)}.",
    "\\begin{aligned}\nb_*&=-\\log3,\\\\\nw_*&=2\\log3,\\\\\nL_*&=\\log4-\\frac34\\log3\n\\approx0.5623351446.\n\\end{aligned}",
    "\\nabla^2L_{\\rm log}\n=\\frac1n\\sum_i p_i(1-p_i)a_ia_i^T.",
    "H_*=\\begin{bmatrix}\n3/16&3/32\\\\\n3/32&3/32\n\\end{bmatrix},\n\\qquad \\det H_*=9/1024>0.",
    "b_*+w_*x=0\n\\quad\\Longleftrightarrow\\quad x=1/2.",
    "L_{\\rm log}(0,w)=\\log(1+e^{-w}).",
    "\\begin{aligned}\nv^T\\nabla^2L_{\\rm log}v\n&=\\frac1n\\sum_i p_i(1-p_i)(a_i^Tv)^2\\\\\n&\\leq\\frac1{4n}\\sum_i\\|a_i\\|_2^2\\,\\|v\\|_2^2\\\\\n&=L_{\\rm bound}\\|v\\|_2^2,\\\\\nL_{\\rm bound}&=\\frac1{4n}\\sum_i(1+x_i^2).\n\\end{aligned}",
    "L(\\theta-\\alpha g)\n\\leq L(\\theta)-\\frac{\\|g\\|_2^2}{2L_{\\rm bound}},\n\\qquad g=\\nabla L(\\theta).",
    "\\ell(z,y)=\\begin{cases}\n\\max(z,0)+\\log(1+e^{-|z|}),&y=0,\\\\\n\\max(-z,0)+\\log(1+e^{-|z|}),&y=1.\n\\end{cases}"
  ],
  "inlineMath": [
    "x",
    "y",
    "y",
    "y",
    "b,w",
    "[0,1]",
    "\\phi(x)",
    "x",
    "x^2",
    "b,w_j\\,",
    "b",
    "\\phi(x)=0",
    "\\sigma(0)=1/2",
    "x=0",
    "w",
    "n",
    "a_i^T\\,",
    "a_i^T\\,",
    "n\\times(d+1)",
    "A",
    "A\\theta",
    "x_i\\,",
    "\\theta_*\\,",
    "A",
    "v=0",
    "x",
    "x",
    "y",
    "\\sum x_i=0",
    "\\sum x_i^2=2",
    "\\sum y_i=4",
    "\\sum x_iy_i=3",
    "b_*=4/3",
    "w_*=3/2",
    "x",
    "-1/6",
    "-1/6",
    "4/3",
    "1/3",
    "17/6",
    "-1/6",
    "1/18",
    "L_{\\rm sq}\\,",
    "1/36",
    "b,w",
    "(b,w)=(3,0)",
    "(1,1)",
    "8/3",
    "x=0",
    "x",
    "0<p<1",
    "p/(1-p)",
    "w",
    "x",
    "e^w",
    "n",
    "\\log",
    "\\sigma'(z)=p(1-p)",
    "p-y",
    "P(Y\\mid X)",
    "P(Y)",
    "P(X\\mid Y)",
    "x",
    "x",
    "y",
    "x",
    "p_0=\\sigma(b)",
    "p_1=\\sigma(b+w)",
    "q",
    "p",
    "p_0=1/4",
    "p_1=3/4",
    "b,w",
    "x",
    "(b,w)",
    "p\\geq\\tau",
    "\\tau=1/2",
    "1/2",
    "x=1/2",
    "(-1,0)",
    "(1,1)",
    "b=0,w>0",
    "w",
    "w\\to+\\infty",
    "w>0",
    "x=2",
    "b+2w=0",
    "b,w",
    "a_i=(1,x_i)^T",
    "v",
    "p(1-p)\\leq1/4",
    "L_{\\rm bound}\\,",
    "\\alpha=1/L_{\\rm bound}\\,",
    "x",
    "b=w=0",
    "(0,-1/8)",
    "L_{\\rm bound}=3/8",
    "(0,1/3)",
    "\\log(1+e^z)-yz",
    "e^{1000}",
    "y\\in\\{0,1\\}",
    "z=1000,y=0",
    "z=1000,y=1",
    "y=1",
    "-\\sigma(-z)",
    "\\sigma(z)-1",
    "x",
    "x",
    "x",
    "[10^{-12},10^{-3}]",
    "10^{-9}",
    "b=4/3,w=3/2",
    "n",
    "x=2",
    "27/28",
    "10/3",
    "3/2",
    "(-1/6,1/3,-1/6)",
    "1/18",
    "x'=x+3",
    "x=x'-3",
    "b-3w",
    "-19/6",
    "3/2",
    "1-p",
    "b=\\log3,w=-2\\log3",
    "x=0",
    "x=1",
    "1/4,3/4",
    "x=2",
    "x=0",
    "(x,x^2)",
    "x",
    "(3,0)",
    "(1,1)",
    "b+2w=3",
    "x=0",
    "x^2",
    "x",
    "z=1000",
    "\\sigma(z)=1/(1+e^{-z})"
  ],
  "inlineCode": [
    "gradient",
    "budget",
    "steps",
    "gradient",
    "log1p",
    "list",
    "tuple",
    "Fraction",
    "Fraction",
    "ValueError",
    "gradient",
    "budget",
    "Fraction",
    "log1p",
    "needs-independent-review"
  ],
  "sections": [
    {
      "heading": "1. 一个加权和，两种预测问题",
      "fields": [
        "输出意义、损失和最优值的存在条件都不同"
      ]
    },
    {
      "heading": "2. 平方误差：从导数到可检查的最佳拟合",
      "fields": [
        "均值半平方误差",
        "满列秩",
        "相同训练拟合值，并不保证离开已观测的特征关系后仍相同。"
      ]
    },
    {
      "heading": "把截距放进设计矩阵",
      "fields": [
        "均值半平方误差",
        "满列秩"
      ]
    },
    {
      "heading": "三条仪器记录，精确算出一个最优值",
      "fields": []
    },
    {
      "heading": "秩不足：有最佳拟合，不一定有唯一系数",
      "fields": [
        "相同训练拟合值，并不保证离开已观测的特征关系后仍相同。"
      ]
    },
    {
      "heading": "3. 逻辑回归：拟合事件概率，再另作决策",
      "fields": [
        "模型几率比",
        "独立核对答案",
        "若有限最小点存在，则它唯一",
        "恰好相等取 1"
      ]
    },
    {
      "heading": "为什么是对数几率？",
      "fields": [
        "模型几率比"
      ]
    },
    {
      "heading": "标签通过似然进入拟合",
      "fields": []
    },
    {
      "heading": "八条不同设备记录：有限且唯一的最优值",
      "fields": [
        "独立核对答案",
        "若有限最小点存在，则它唯一"
      ]
    },
    {
      "heading": "概率到类别，还差一个阈值",
      "fields": [
        "恰好相等取 1"
      ]
    },
    {
      "heading": "4. 分得全对，也可能根本没有有限最优系数",
      "fields": []
    },
    {
      "heading": "5. 有限预算的训练，以及稳定的损失计算",
      "fields": [
        "平均",
        "返回的参数"
      ]
    },
    {
      "heading": "有依据的步长，不是万能收敛承诺",
      "fields": [
        "平均",
        "返回的参数"
      ]
    },
    {
      "heading": "不要先把概率舍入到 0，再对它取对数",
      "fields": []
    },
    {
      "heading": "6. 可运行实验：精确拟合数值，再实际训练概率模型",
      "fields": []
    },
    {
      "heading": "7. 拟合完成以后，哪些结论仍然不能下？",
      "fields": [
        "概率落在 0 到 1，不等于校准。",
        "系数不自动具有因果意义。",
        "可计算不等于可外推。",
        "训练最优不等于新样本最优。"
      ]
    },
    {
      "heading": "8. 迁移练习、答案与常见误区",
      "fields": [
        "答案：",
        "答案：",
        "答案：",
        "答案：",
        "答案：",
        "答案：",
        "答案："
      ]
    },
    {
      "heading": "练习 1：仪器零点整体抬高",
      "fields": [
        "答案："
      ]
    },
    {
      "heading": "练习 2：换特征原点，不换物理记录",
      "fields": [
        "答案："
      ]
    },
    {
      "heading": "练习 3：设备事件定义反过来",
      "fields": [
        "答案："
      ]
    },
    {
      "heading": "练习 4：一次更保守的告警决定",
      "fields": [
        "答案："
      ]
    },
    {
      "heading": "练习 5：重复特征与最佳拟合",
      "fields": [
        "答案："
      ]
    },
    {
      "heading": "练习 6：分类已全对，还要继续增大系数？",
      "fields": [
        "答案："
      ]
    },
    {
      "heading": "练习 7：到底学到了概率，还是学到了训练频率？",
      "fields": [
        "答案："
      ]
    },
    {
      "heading": "来源、版本与核验边界",
      "fields": [
        "2020-10-01 draft",
        "线性与逻辑回归"
      ]
    }
  ],
  "anchors": [
    {
      "text": "监督学习与朴素贝叶斯",
      "href": "?view=garden&scope=branch:ai-overview:orientation/naive-bayes",
      "section": null
    },
    {
      "text": "导数与链式法则",
      "href": "?view=garden&scope=branch:llm:math/derivatives",
      "section": null
    },
    {
      "text": "概率校准、Brier 与分箱",
      "href": "?view=garden&scope=branch:llm:rankings/calibration",
      "section": "7. 拟合完成以后，哪些结论仍然不能下？"
    },
    {
      "text": "训练、验证、测试与泄漏",
      "href": "?view=garden&scope=branch:llm:training/samples",
      "section": "7. 拟合完成以后，哪些结论仍然不能下？"
    },
    {
      "text": "熵、交叉熵与 KL",
      "href": "?view=garden&scope=branch:llm:math/objectives",
      "section": "练习 7：到底学到了概率，还是学到了训练频率？"
    },
    {
      "text": "特征分解、SVD 与低秩",
      "href": "?view=garden&scope=branch:llm:math/eigen-svd",
      "section": "练习 7：到底学到了概率，还是学到了训练频率？"
    },
    {
      "text": "正则化与泛化",
      "href": "?view=garden&scope=branch:llm:training/budget/regularization",
      "section": "练习 7：到底学到了概率，还是学到了训练频率？"
    },
    {
      "text": "CS229 Lecture Notes，2022 Fall 存档",
      "href": "https://cs229.stanford.edu/notes2022fall/main_notes.pdf",
      "section": "来源、版本与核验边界"
    },
    {
      "text": "Generative and Discriminative Classifiers",
      "href": "https://www.cs.cmu.edu/~tom/mlbook/NBayesLogReg.pdf",
      "section": "来源、版本与核验边界"
    },
    {
      "text": "The Implicit Bias of Gradient Descent on Separable Data",
      "href": "https://www.jmlr.org/papers/v19/18-188.html",
      "section": "来源、版本与核验边界"
    },
    {
      "text": "论文",
      "href": "https://www.jmlr.org/papers/volume19/18-188/18-188.pdf",
      "section": "来源、版本与核验边界"
    },
    {
      "text": "What Is the Log-Sum-Exp Function?",
      "href": "https://nhigham.com/2021/01/05/what-is-the-log-sum-exp-function/",
      "section": "来源、版本与核验边界"
    }
  ],
  "onward": [
    {
      "scope": "branch:ai-overview:orientation/naive-bayes",
      "articleId": "supervised-learning-naive-bayes",
      "anchorIndex": 0,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:math/derivatives",
      "articleId": "llm-derivatives",
      "anchorIndex": 1,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:rankings/calibration",
      "articleId": "probability-calibration-brier-bins",
      "anchorIndex": 2,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:training/samples",
      "articleId": "train-validation-test-data-leakage",
      "anchorIndex": 3,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:math/objectives",
      "articleId": "llm-entropy-cross-entropy",
      "anchorIndex": 4,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:math/eigen-svd",
      "articleId": "eigen-svd-low-rank",
      "anchorIndex": 5,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:training/budget/regularization",
      "articleId": "regularization-penalty-generalization",
      "anchorIndex": 6,
      "mode": "embedded-branch"
    }
  ]
} satisfies LinearGeneralizationLesson;

registerLinearGeneralizationTests(lesson);
