// Exact accepted v2 manuscript semantics, frozen independently of live DOM snapshots.
import { registerLinearGeneralizationTests, type LinearGeneralizationLesson } from './linear-generalization-reader';

const lesson = {
  "article": {
    "id": "overfitting-underfitting-capacity",
    "file": "content/models/foundations/overfitting-underfitting-capacity.md",
    "space": "models",
    "category": "foundations",
    "categoryName": "AI 基础原理",
    "title": "过拟合与欠拟合：训练误差低，学到的就一定对吗？",
    "subtitle": "从四点有限总体比较常数、仿射与查表，区分表示不足、噪声拟合和新观测噪声",
    "date": "2026-10-05",
    "tags": [
      "过拟合",
      "欠拟合",
      "模型容量",
      "泛化",
      "精确计算"
    ],
    "excerpt": "完整枚举 16 份固定设计训练数据和八种独立新记录，从三个实际拟合的嵌套模型族解释训练误差与总体风险，并用去噪、零信号对照检验结论边界。",
    "knowledgeUnit": {
      "kind": "independent-explanation",
      "reviewStatus": "needs-independent-review",
      "exampleId": "overfitting-underfitting-capacity",
      "conceptIds": [
        "concept:overfitting"
      ],
      "placements": [
        {
          "hubId": "hub:llm",
          "path": "training/budget/overfitting"
        }
      ],
      "sourceUrls": [
        "https://cs229.stanford.edu/main_notes.pdf",
        "https://www.cs.columbia.edu/~djhsu/papers/biasvariance-pnas.pdf",
        "https://cs229.stanford.edu/notes_archive/cs229-notes5.pdf"
      ],
      "relatedResourceIds": []
    }
  },
  "name": "过拟合与欠拟合课",
  "parent": "topic:generalization",
  "articleSha256": "5306d5a1d5dc01948769d2446a6110d269b4db1615fb58e94bae7122fc201af0",
  "codeSha256": "9a30b765b497818fdfbfcea0bf4ad75eac93425b478a0d4df2a5c851cfbb20d7",
  "suffixSha256": "4b2b8236ba4a5c791a5007468c2905be55075cb3601d0c55826f0a213c486c39",
  "proseBlocks": [
    {
      "kind": "blockquote",
      "parts": [
        "本页解决的问题：训练误差低，是学到了稳定关系，还是记住了这一批标签的偶然变化？当三个模型族都已拟合到各自最优时，怎样分清表示不足、噪声拟合与新观测自身的噪声？",
        "只需会算平均数和平方。训练循环 区分目标与优化；期望与方差 帮助理解重复训练的平均。本页自己推导四点仿射拟合，不要求先掌握逻辑回归。全部数据是完整指定的教学构造，不是真实仪器或模型的性能报告。"
      ],
      "fields": [
        "本页解决的问题"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "想象一台有四个档位的测量仪。我们想预测的是某次新测量的读数，而不是复述上一次的读数。模型族是允许选择的函数集合，拟合是从这份训练记录中选择一个函数；即使已经把训练目标降到该族的最低点，预测新记录仍可能不好。"
      ],
      "fields": [
        "模型族",
        "拟合"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本文把欠拟合具体落实为：所选函数族无法表达任务中的稳定关系，而且这种限制在充分拟合后仍然存在。把过拟合具体落实为：对训练记录中的偶然变化拟合得更紧，却损害了对新记录的预测。日常诊断里，“训练和保留误差都高”或“训练低、保留高”是线索，不是已经查明原因的证明。CS229 的泛化章节区分了训练表现、新例表现与两者的差；这里用完全已知的有限过程进一步检查其机制。[1]"
      ],
      "fields": [
        "欠拟合",
        "过拟合"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对一份训练集 D，拟合结果记作 \\widehat f_D。我们分别计算："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这里 MSE 是平方残差的平均，不开平方，也没有额外的 1/2。它与后续正则化 一课的“半均方损失”相差固定倍数，比较数字时不能混用。R_y-\\widehat R_D\\, 是本文的训练与新标签风险差；风险本身并不等于这个差。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "新记录按以下过程产生："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "X 等概率取 -2,-1,1,2",
        "噪声 E 与 X、训练记录都独立，等概率取 -1,+1",
        "标签 Y=X+E，所以给定 X=x 的平均标签是 x"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "新记录一共有八个等概率结果："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "训练方式另行规定：每个档位恰测一次，顺序按 x=(-2,-1,1,2) 记，四个噪声符号 e_i\\, 独立。这是平衡的固定设计，共 2^4=16 份等概率训练数据。它不是从新记录总体中独立同分布抽四个 X；后者可能漏掉档位、重复档位，不能直接沿用本页的 16 份枚举或查表拟合规则。"
      ],
      "fields": [
        "每个档位恰测一次"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "新记录不等于新特征值。 新测量的 X=1 完全可能在训练出现过；只要这次独立的标签没有参与拟合，便符合本页任务。反过来，X=0 根本不在声明的总体中；本页不评价这种支持集外预测，代码也明确拒绝它。目标若改成“未见设备”或“未来时间段”，需要重定评估单位，见训练、验证、测试与泄漏。"
      ],
      "fields": [
        "新记录不等于新特征值。"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "常数是斜率为零的仿射函数；任何仿射函数在这四点的取值，也能装进四值表。因此三个族嵌套。在同一训练数据、同一损失、确实找到最小值的条件下，扩大函数族不可能使最低训练 MSE 上升：原来的解仍是可选项。这不是总体风险的单调性定理，也没有说更多参数总是更坏或更好。[2]"
      ],
      "fields": [
        "同一训练数据、同一损失、确实找到最小值"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "查表器按 x 存训练响应，并没有偷看新标签、使用行 ID 或获知真实信号。因为本例每个 x 只有一个训练标签，它恰好插值这四条记录。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对于任意符合四点设计的训练标签，常数拟合是 \\widehat b=\\overline y\\,。仿射拟合利用 \\sum x_i=0、\\sum x_i^2=10："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这两个公式只需要训练记录。为确认不是“碰巧找到一个驻点”，把仿射训练 MSE 配方，得到："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "右边非负，且仅在两个参数都相等时为零，故最优解唯一。常数的同类差值为 (b-\\overline y)^2。查表器的每个平方项能分别归零，也已经达到唯一的训练最优预测值。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "现在仅在解释拟合结果时，代入已知教学规律 y_i=x_i+e_i\\,。令："
      ],
      "fields": [
        "解释拟合结果"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "便得到常数 \\widehat b=S/4，仿射 \\widehat b=S/4,\\widehat w=1+T/10，查表 \\widehat f(x_i)=x_i+e_i\\,。代码仍须从 y_i\\, 求解，不能直接把这些含真实噪声的解释式当作学习器。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "就算给常数族最有利的参数，恢复干净信号仍有："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这才是常数族的近似能力限制；增加同类训练记录不会让常数变成随档位变化的函数。仿射族则包含 f(x)=x，它的最小信号风险为零。若程序停在 b=w=0，错误不能据此归咎于仿射族：它可能只是还没把本来可达到的训练目标优化好。现实中还需检查特征、标签、评分尺度和实现错误，不能见到高 loss 就宣布“模型容量不够”。"
      ],
      "fields": [
        "近似能力限制"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先看训练噪声 (+1,-1,-1,+1)，对应标签 (-1,-2,0,3)。此时 S=T=0。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "常数的训练误差和新标签风险相同，却没有表达档位关系；仿射的两者也相同，却恰好恢复信号。因此“没有差距”无法区分这两种表现。查表把训练噪声也记住了，训练误差归零，新标签风险反而是仿射的两倍。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "为什么新标签风险总比信号风险多 1？先冻结已经拟合的函数，在某个 x 处令 r=\\widehat f(x)-x。两种独立新噪声的平均为："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "再平均四个 x，得到 R_y=R_s+1。这 1 是在仅知道 X、预测这个带噪标签时无法消除的部分；它不是说任何新特征或更精细的测量都绝无帮助。若噪声与训练或输入有关、均值不为零，或评分目标改变，上式不能照搬。"
      ],
      "fields": [
        "仅知道 X、预测这个带噪标签"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这一份训练集只负责说明机制，不能代替对所有可能训练集的平均。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "平方展开可得每一份训练数据的精确结果："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "例如仿射在 x 的信号残差为 S/4+xT/10；平方后交叉项因 \\sum x=0 消失，\\sum x^2=10 给出 T^2/40。训练残差则是 S/4+x_iT/10-e_i\\,，利用 \\sum e_i=S、\\sum x_ie_i=T 展开得到训练一列。常数训练列来自："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "独立对称符号满足："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "原因是 e_i^2=1，不同符号的乘积期望为零。对上表再平均，并给信号风险加上独立新噪声的 1："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "每一列都先评估每份训练集拟合出的函数，再对 16 份训练集平均。它们不是把 16 份数据拼在一起训练的结果，也不是 16 次真实测量实验的统计估计。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这一设定下，查表从仿射的平均训练误差 1/2 降到 0，却把平均新标签风险从 3/2 提高到 2，说明额外自由度用于拟合噪声会付出代价。常数平均新标签风险更高，则主要受到无法表达信号的限制。两个机制可以存在于同一比较中，不能用一个“训练—测试差距”数值概括。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "若想与偏差、方差术语对应，只需在本例中看跨训练集的平均预测：常数为 0，仿射和查表均为 x。按四点平均的信号偏差平方依次为 5/2,0,0；训练噪声引起的预测方差依次为 1/4,1/2,1。两项相加正好给出新信号风险。这里没有推导一般模型的容量曲线，更不能从这种分解自动推出 U 形。[1]"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "训练标签与新标签都变成 Y=X。这时只有一份训练集、四种新结果；查表虽仍把训练误差降为零，却也完全恢复支持集上的信号。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "所以插值不等于过拟合。这不是靠一句口号保留例外，而是在同一组算法下去掉噪声后直接重算。Belkin 等人的研究也展示了不能靠插值或参数量单独判断泛化的情形；它并不保证任何模型越大越好。[2]"
      ],
      "fields": [
        "插值不等于过拟合"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "仍用干净的 y_i=x_i 拟合，但新测量保持 Y=X+E。训练 MSE 与对照 A 相同，平均新标签风险却分别为 7/2,1,1。改进训练仪器不会自动取消生产环境中新标签自身的噪声。代码中训练和新标签噪声是两个不同开关。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "现在设 Y=E，其余平衡训练设计与独立噪声都不变。仍有 16 份训练集、八种新记录。常数族现在包含真实信号 0，不再承受前面的 5/2 近似误差。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "最简单的常数现在胜出。不要把主例改写成“选中间大小总没错”，也不要把四点、四条训练记录的结果推广成任意样本量或高维神经网络的定律。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "下面只有 Python 标准库。fit_family 从传入标签拟合，不接受真实信号或新记录；risk_report 才负责按已声明的总体产生数据与评价。返回状态、报告与所有数值分别采用不可变元组和精确 Fraction，没有随机模拟误差。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "fit_family 的输入必须是内置列表或元组，恰好四行；每行也是内置列表或元组的 (x,y)，四个支持点各出现一次，次序任意。x 为确切内置整数，y 为 [-16,16] 内的确切内置整数",
        "家族名称只接受确切内置字符串 constant、affine、lookup。返回 (family, parameters)，参数分别按截距、截距与斜率、支持点升序的四个预测值排列",
        "predict 和 mse 接受这种内置二元组状态。参数必须为内置元组，长度对应模型族；每项的类型须恰为内置 int 或标准库 fractions.Fraction，不含子类；约分后分子绝对值、分母均不超过 1024。所有合法拟合结果均满足此界限",
        "predict 只接收支持集中的确切整数。mse 的评估记录长 1–32，类型与每行取值范围同上，但允许同一 x 重复，不要求覆盖全部支持点；返回均方损失",
        "risk_report 的三个开关分别是信号、训练噪声、新标签噪声，只接受确切内置整数 0 或 1。关闭噪声的一侧只枚举无噪声结果一次。报告按三个模型族顺序，每行为名称、平均训练 MSE、平均新信号风险、平均新标签风险"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "布尔值、浮点、数值或容器子类、生成器、空输入、错误形状、重复或缺失的训练档位、超界标签或参数均按上述契约抛出 ValueError，不作隐式转换，不修改输入。只传预测输入、不传新标签即可获得预测；评估标签变化能改变分数，不能反过来改变已冻结的拟合状态。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这不是通用回归库。固定设计拟合至多四行，评分至多 32 行；一次报告至多拟合 16\\times3=48 个模型，每个模型评估四条训练、四条信号和八条新标签记录。有理数规模受输入界限约束；不把任意精度整数的位运算当成普适常数成本。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "每组输出的后三项依次是“平均训练、新信号、新标签”，不是三个数据划分的名字。四组结果依次对应第 5 节与三个对照，数值使用分数打印。程序枚举的是声明的有限教学总体；没有读取实际测试集，也没有用验证集挑选模型。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "现实里通常不知道完整的 P(X,Y)，也拿不到每条记录的干净信号。因此不能照着代码调用 mse 就宣称得到了真实总体风险。有限保留集上的平均误差是估计，会受抽样、群组相关、时间变化和目标覆盖影响。"
      ],
      "fields": [
        "估计"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "遇到“训练好、保留差”，可以依次核对："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "ordered-list",
      "parts": [
        "是否在比较同一目标与尺度？ 平方损失和半平方损失、干净信号和带噪标签不是同一个数；错误的分母、掩码或预处理也能制造差距",
        "保留集是否回答部署问题？ 输入覆盖、标签定义或时间分布变了，性能下降可能有分布变化的原因；泄漏和选择反馈也会让保留分数失真",
        "训练最优是否真的达到？ 优化不足与表达不足需要分别检查。本页有配方证书；真实复杂模型可能只能提供有限预算下的诊断，不能冒称找到了全局最优",
        "有没有相同协议下的对照？ 比较合理的简单基线、检查残差和标签质量，再用独立保留评估判断增加自由度、数据或正则化是否有帮助；没有任何一项能保证改善"
      ],
      "fields": [
        "是否在比较同一目标与尺度？",
        "保留集是否回答部署问题？",
        "训练最优是否真的达到？",
        "有没有相同协议下的对照？"
      ],
      "start": 1
    },
    {
      "kind": "paragraph",
      "parts": [
        "若用验证分数选择模型族，这个分数已经承担选择职责，不能原样当作独立最终测试。选完再评估的边界详见训练、验证、测试与泄漏；抽样波动和区间见统计推断。CS229 的模型选择笔记也将参数拟合与保留集选择分开；它举过的切分比例不是普遍配方。[3]"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本页换了可选函数族，并没有加惩罚。下一步可读正则化改变了什么，看在指定族中加入偏好怎样改变拟合；若关心每一步如何更新，回到训练循环。这些联系不把一次有限实验提升为对所有学习任务的保证。"
      ],
      "fields": [
        "可选函数族"
      ],
      "start": null
    },
    {
      "kind": "ordered-list",
      "parts": [
        "同向偏移的校准批次。 第二次训练恰好四个噪声全为 +1。求三个模型、训练 MSE、新信号风险和新标签风险。仿射和查表是否一定预测不同？这一批能否决定跨训练平均排序？",
        "固件停在初始值。 对第 4 节训练集，工程师把仿射参数留在 b=w=0。计算相对精确拟合的训练误差差值，并说明它与仿射族的最佳信号近似误差有什么区别。什么证据才足以认定该族在这里表达不足？",
        "只修好训练仪器。 训练标签改为干净信号，生产仍有独立 \\pm1 噪声。三个新标签风险是多少？若生产也去噪，又是多少？为什么不能共用一张表？",
        "断开的档位。 信号改为零，标签仅为噪声。求三个平均新标签风险并解释赢家变化。是否能据此建立“总选中间模型”的规则？",
        "重复输入与新记录。 同事说新记录 X=1 必然泄漏，并把 X=0 当作本实验普通测试输入。分别判断，并说明程序应如何处理 X=0。",
        "挑完再报。 实验室在一份有限保留集上试了很多模型族，把最低分当作独立最终分数。哪里混淆了信息职责？本页知道总体的精确风险，为什么不能替它辩护？"
      ],
      "fields": [
        "同向偏移的校准批次。",
        "固件停在初始值。",
        "只修好训练仪器。",
        "断开的档位。",
        "重复输入与新记录。",
        "挑完再报。"
      ],
      "start": 1
    },
    {
      "kind": "paragraph",
      "parts": [
        "1. 标签为 (-1,0,2,3)，S=4,T=0。常数为 1；仿射为 1+x；查表也在四个支持点输出 1+x。"
      ],
      "fields": [
        "1."
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "两个不同模型族可以选出相同的支持集预测。不能拿一次相等推翻 16 份平均比较，也不能说查表在每一份训练数据上都严格更差。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "2. 初始值预测恒为零，训练 MSE 是 7/2；精确仿射拟合是 b=0,w=1，训练 MSE 为 1，差值 5/2 正好等于配方证书中的斜率项。初始值的信号风险为 5/2，但仿射族可以达到信号风险 0。这里已知真实信号就在该族内，无法据此宣布表达不足；错误属于选错参数或未完成拟合。训练最小 MSE 仍为 1，是这一批噪声并不沿同一条直线，而不是恢复信号必须有误差。"
      ],
      "fields": [
        "2."
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "3. 只有训练去噪时，新标签风险依次为 7/2,1,1；两侧都去噪时为 5/2,0,0。两组的拟合函数相同，评分目标不同。误解在于把训练数据更干净当成生产标签的噪声也消失。"
      ],
      "fields": [
        "3."
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "4. 平均新标签风险为 5/4,3/2,2。常数已经能表达零信号，额外拟合的斜率或档位值在这个设计中只增加训练噪声波动。赢家依赖生成规律、训练设计与算法；三个名称的排列不是选择准则。"
      ],
      "fields": [
        "4."
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "5. 对本页“同一档位的新独立测量”任务，重复 x 不等于重复标签信息，不自动构成泄漏；若任务改成未见实体，需重定协议。X=0 则不在已声明支持集，predict 与 mse 应抛出 ValueError，而不是暗中给查表器补零或临时插值。"
      ],
      "fields": [
        "5."
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "6. 这份保留集承担了模型选择，应将最终评估保留给未参与选择的信息，或采用正确隔离内外层职责的评估流程，并披露选择过程。本页总体完整已知，直接枚举八种新结果；真实保留集只是有限样本。两者都能算平均，并不意味着它们的证据强度相同。"
      ],
      "fields": [
        "6."
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本页的四点总体、16 份训练数据、精确风险表、控制实验和练习均为独立教学推导；下列来源支持概念与边界，不是这些分数的实验出处。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "ordered-list",
      "parts": [
        "Tengyu Ma 与 Andrew Ng，CS229 Lecture Notes：2026-10-05 核查时封面为 August 23, 2026，正文运行页眉为 Spring 2026；第 8 章，特别是印刷页 115–123。区分训练与新例表现、跨训练预测的偏差和方差。本文用固定平衡输入、离散噪声直接求和，不把源文的随机设计或高斯噪声设定当作自己的前提。此 live URL 可能变更",
        "Belkin、Hsu、Ma 与 Mandal，PNAS 116(32), 15849–15854（2019）作者托管版：摘要、引言和图 1 讨论；DOI。用于限定“插值必坏、参数越多必坏”这类推断；本页不复现其模型或实验，也不声称风险必呈双下降",
        "Andrew Ng，CS229 Regularization and Model Selection 存档笔记：§1，印刷页 2–4；打开的存档未显示独立出版日期。用于区分参数拟合和保留集模型选择，不采用其中举例的切分比例作为建议"
      ],
      "fields": [
        "August 23, 2026"
      ],
      "start": 1
    },
    {
      "kind": "paragraph",
      "parts": [
        "来源阅读、作者算术检查、独立复核、浏览器呈现与领域专家审核是不同环节。本页内容状态仍为待独立复核，不能把可运行示例当作外部模型的性能背书。"
      ],
      "fields": [],
      "start": null
    }
  ],
  "headings": [
    {
      "depth": 2,
      "text": "1. “拟合得好”先要说明在哪些记录上"
    },
    {
      "depth": 2,
      "text": "2. 先固定数据是怎样来的"
    },
    {
      "depth": 2,
      "text": "3. 三个嵌套模型族，都从训练标签中实际拟合"
    },
    {
      "depth": 3,
      "text": "拟合公式不能把真实信号偷偷传进去"
    },
    {
      "depth": 3,
      "text": "表示不足与优化没做完是两回事"
    },
    {
      "depth": 2,
      "text": "4. 一份具体数据：零差距也可能学得差"
    },
    {
      "depth": 2,
      "text": "5. 把 16 份训练集全部算完"
    },
    {
      "depth": 2,
      "text": "6. 改一个前提，最佳模型就可能换人"
    },
    {
      "depth": 3,
      "text": "对照 A：两侧都没有噪声"
    },
    {
      "depth": 3,
      "text": "对照 B：只让训练仪器无噪声"
    },
    {
      "depth": 3,
      "text": "对照 C：档位与信号根本无关"
    },
    {
      "depth": 2,
      "text": "7. 可运行实验：拟合者看训练，评估者知道教学总体"
    },
    {
      "depth": 2,
      "text": "8. 从这个已知世界走回真实评估"
    },
    {
      "depth": 2,
      "text": "9. 自测：先改前提，再算结论"
    },
    {
      "depth": 3,
      "text": "题目"
    },
    {
      "depth": 3,
      "text": "参考答案与常见误解"
    },
    {
      "depth": 2,
      "text": "来源与核查边界"
    }
  ],
  "tables": [
    [
      [
        "量",
        "本文的定义",
        "对什么平均"
      ],
      [
        "训练 MSE",
        "{\\widehat R_D=\\frac14\\sum_{i=1}^4(\\widehat f_D(x_i)-y_i)^2}",
        "这四条训练记录"
      ],
      [
        "新信号风险",
        "{R_s(\\widehat f_D)=\\mathbb E_X[(\\widehat f_D(X)-X)^2]}",
        "新输入的干净信号"
      ],
      [
        "新标签风险",
        "{R_y(\\widehat f_D)=\\mathbb E_{X,E}[(\\widehat f_D(X)-X-E)^2]}",
        "独立新测量的标签"
      ],
      [
        "重复训练平均",
        "\\mathbb E_D[R_y(\\widehat f_D)]",
        "所有可能训练集及各自拟合结果"
      ]
    ],
    [
      [
        "X",
        "两个可能的 Y",
        "每个 (X,Y) 的概率"
      ],
      [
        "-2",
        "-3,-1",
        "1/8"
      ],
      [
        "-1",
        "-2,0",
        "1/8"
      ],
      [
        "1",
        "0,2",
        "1/8"
      ],
      [
        "2",
        "1,3",
        "1/8"
      ]
    ],
    [
      [
        "模型族",
        "允许的预测规则",
        "在四点支持集上的自由值"
      ],
      [
        "常数",
        "f(x)=b",
        "1"
      ],
      [
        "仿射",
        "f(x)=b+wx",
        "2"
      ],
      [
        "四值查表",
        "每个档位一个自由预测值",
        "4"
      ]
    ],
    [
      [
        "拟合器",
        "四个档位的预测",
        "训练 MSE，除以 4",
        "新信号风险，除以 4",
        "新标签风险，除以 8"
      ],
      [
        "常数",
        "(0,0,0,0)",
        "7/2",
        "5/2",
        "7/2"
      ],
      [
        "仿射",
        "(-2,-1,1,2)",
        "1",
        "0",
        "1"
      ],
      [
        "查表",
        "(-1,-2,0,3)",
        "0",
        "1",
        "2"
      ]
    ],
    [
      [
        "拟合器",
        "训练 MSE",
        "新信号风险"
      ],
      [
        "常数",
        "{\\frac72+\\frac T2-\\frac{S^2}{16}}",
        "{\\frac52+\\frac{S^2}{16}}"
      ],
      [
        "仿射",
        "{1-\\frac{S^2}{16}-\\frac{T^2}{40}}",
        "\\frac{S^2}{16}+\\frac{T^2}{40}"
      ],
      [
        "查表",
        "0",
        "1"
      ]
    ],
    [
      [
        "拟合器",
        "平均训练 MSE",
        "平均新信号风险",
        "平均新标签风险"
      ],
      [
        "常数",
        "13/4",
        "11/4",
        "15/4"
      ],
      [
        "仿射",
        "1/2",
        "1/2",
        "3/2"
      ],
      [
        "查表",
        "0",
        "1",
        "2"
      ]
    ],
    [
      [
        "拟合器",
        "训练 MSE",
        "新标签风险"
      ],
      [
        "常数",
        "5/2",
        "5/2"
      ],
      [
        "仿射",
        "0",
        "0"
      ],
      [
        "查表",
        "0",
        "0"
      ]
    ],
    [
      [
        "拟合器",
        "平均训练 MSE",
        "平均新信号风险",
        "平均新标签风险"
      ],
      [
        "常数",
        "3/4",
        "1/4",
        "5/4"
      ],
      [
        "仿射",
        "1/2",
        "1/2",
        "3/2"
      ],
      [
        "查表",
        "0",
        "1",
        "2"
      ]
    ],
    [
      [
        "模型",
        "训练 MSE",
        "新信号风险",
        "新标签风险"
      ],
      [
        "常数",
        "5/2",
        "7/2",
        "9/2"
      ],
      [
        "仿射",
        "0",
        "1",
        "2"
      ],
      [
        "查表",
        "0",
        "1",
        "2"
      ]
    ]
  ],
  "displayMath": [
    "\\widehat b=\\frac14\\sum_i y_i,\n\\qquad\n\\widehat w=\\frac{\\sum_i x_i y_i}{10}",
    "\\widehat R_D(b,w)-\\widehat R_D(\\widehat b,\\widehat w)\n=(b-\\widehat b)^2+\\frac52(w-\\widehat w)^2",
    "S=\\sum_i e_i,\n\\qquad T=\\sum_i x_i e_i",
    "\\frac14\\sum_x(b-x)^2=b^2+\\frac52\n\\quad\\Longrightarrow\\quad\n\\min_b R_s(b)=\\frac52",
    "\\frac{(r-1)^2+(r+1)^2}{2}=r^2+1",
    "\\frac14\\sum y_i^2-\\overline y^2",
    "\\mathbb E_D[S^2]=4,\n\\qquad \\mathbb E_D[T^2]=10,\n\\qquad \\mathbb E_D[T]=0"
  ],
  "inlineMath": [
    "D",
    "\\widehat f_D",
    "{\\widehat R_D=\\frac14\\sum_{i=1}^4(\\widehat f_D(x_i)-y_i)^2}",
    "{R_s(\\widehat f_D)=\\mathbb E_X[(\\widehat f_D(X)-X)^2]}",
    "{R_y(\\widehat f_D)=\\mathbb E_{X,E}[(\\widehat f_D(X)-X-E)^2]}",
    "\\mathbb E_D[R_y(\\widehat f_D)]",
    "1/2",
    "R_y-\\widehat R_D\\,",
    "X",
    "-2,-1,1,2",
    "E",
    "X",
    "-1,+1",
    "Y=X+E",
    "X=x",
    "x",
    "X",
    "Y",
    "(X,Y)",
    "-2",
    "-3,-1",
    "1/8",
    "-1",
    "-2,0",
    "1/8",
    "1",
    "0,2",
    "1/8",
    "2",
    "1,3",
    "1/8",
    "x=(-2,-1,1,2)",
    "e_i\\,",
    "2^4=16",
    "X",
    "X=1",
    "X=0",
    "f(x)=b",
    "f(x)=b+wx",
    "x",
    "x",
    "\\widehat b=\\overline y\\,",
    "\\sum x_i=0",
    "\\sum x_i^2=10",
    "(b-\\overline y)^2",
    "y_i=x_i+e_i\\,",
    "\\widehat b=S/4",
    "\\widehat b=S/4,\\widehat w=1+T/10",
    "\\widehat f(x_i)=x_i+e_i\\,",
    "y_i\\,",
    "f(x)=x",
    "b=w=0",
    "(+1,-1,-1,+1)",
    "(-1,-2,0,3)",
    "S=T=0",
    "(0,0,0,0)",
    "7/2",
    "5/2",
    "7/2",
    "(-2,-1,1,2)",
    "1",
    "0",
    "1",
    "(-1,-2,0,3)",
    "0",
    "1",
    "2",
    "x",
    "r=\\widehat f(x)-x",
    "x",
    "R_y=R_s+1",
    "X",
    "{\\frac72+\\frac T2-\\frac{S^2}{16}}",
    "{\\frac52+\\frac{S^2}{16}}",
    "{1-\\frac{S^2}{16}-\\frac{T^2}{40}}",
    "\\frac{S^2}{16}+\\frac{T^2}{40}",
    "0",
    "1",
    "x",
    "S/4+xT/10",
    "\\sum x=0",
    "\\sum x^2=10",
    "T^2/40",
    "S/4+x_iT/10-e_i\\,",
    "\\sum e_i=S",
    "\\sum x_ie_i=T",
    "e_i^2=1",
    "13/4",
    "11/4",
    "15/4",
    "1/2",
    "1/2",
    "3/2",
    "0",
    "1",
    "2",
    "1/2",
    "3/2",
    "x",
    "5/2,0,0",
    "1/4,1/2,1",
    "Y=X",
    "5/2",
    "5/2",
    "0",
    "0",
    "0",
    "0",
    "y_i=x_i",
    "Y=X+E",
    "7/2,1,1",
    "Y=E",
    "5/2",
    "3/4",
    "1/4",
    "5/4",
    "1/2",
    "1/2",
    "3/2",
    "0",
    "1",
    "2",
    "(x,y)",
    "x",
    "y",
    "[-16,16]",
    "x",
    "16\\times3=48",
    "P(X,Y)",
    "+1",
    "b=w=0",
    "\\pm1",
    "X=1",
    "X=0",
    "X=0",
    "(-1,0,2,3)",
    "S=4,T=0",
    "1+x",
    "1+x",
    "5/2",
    "7/2",
    "9/2",
    "0",
    "1",
    "2",
    "0",
    "1",
    "2",
    "7/2",
    "b=0,w=1",
    "5/2",
    "5/2",
    "7/2,1,1",
    "5/2,0,0",
    "5/4,3/2,2",
    "x",
    "X=0"
  ],
  "inlineCode": [
    "fit_family",
    "risk_report",
    "Fraction",
    "fit_family",
    "constant",
    "affine",
    "lookup",
    "(family, parameters)",
    "predict",
    "mse",
    "int",
    "fractions.Fraction",
    "predict",
    "mse",
    "risk_report",
    "ValueError",
    "mse",
    "predict",
    "mse",
    "ValueError"
  ],
  "sections": [
    {
      "heading": "1. “拟合得好”先要说明在哪些记录上",
      "fields": [
        "模型族",
        "拟合",
        "欠拟合",
        "过拟合"
      ]
    },
    {
      "heading": "2. 先固定数据是怎样来的",
      "fields": [
        "每个档位恰测一次",
        "新记录不等于新特征值。"
      ]
    },
    {
      "heading": "3. 三个嵌套模型族，都从训练标签中实际拟合",
      "fields": [
        "同一训练数据、同一损失、确实找到最小值",
        "解释拟合结果",
        "近似能力限制"
      ]
    },
    {
      "heading": "拟合公式不能把真实信号偷偷传进去",
      "fields": [
        "解释拟合结果"
      ]
    },
    {
      "heading": "表示不足与优化没做完是两回事",
      "fields": [
        "近似能力限制"
      ]
    },
    {
      "heading": "4. 一份具体数据：零差距也可能学得差",
      "fields": [
        "仅知道 X、预测这个带噪标签"
      ]
    },
    {
      "heading": "5. 把 16 份训练集全部算完",
      "fields": []
    },
    {
      "heading": "6. 改一个前提，最佳模型就可能换人",
      "fields": [
        "插值不等于过拟合"
      ]
    },
    {
      "heading": "对照 A：两侧都没有噪声",
      "fields": [
        "插值不等于过拟合"
      ]
    },
    {
      "heading": "对照 B：只让训练仪器无噪声",
      "fields": []
    },
    {
      "heading": "对照 C：档位与信号根本无关",
      "fields": []
    },
    {
      "heading": "7. 可运行实验：拟合者看训练，评估者知道教学总体",
      "fields": []
    },
    {
      "heading": "8. 从这个已知世界走回真实评估",
      "fields": [
        "估计",
        "是否在比较同一目标与尺度？",
        "保留集是否回答部署问题？",
        "训练最优是否真的达到？",
        "有没有相同协议下的对照？",
        "可选函数族"
      ]
    },
    {
      "heading": "9. 自测：先改前提，再算结论",
      "fields": [
        "同向偏移的校准批次。",
        "固件停在初始值。",
        "只修好训练仪器。",
        "断开的档位。",
        "重复输入与新记录。",
        "挑完再报。",
        "1.",
        "2.",
        "3.",
        "4.",
        "5.",
        "6."
      ]
    },
    {
      "heading": "题目",
      "fields": [
        "同向偏移的校准批次。",
        "固件停在初始值。",
        "只修好训练仪器。",
        "断开的档位。",
        "重复输入与新记录。",
        "挑完再报。"
      ]
    },
    {
      "heading": "参考答案与常见误解",
      "fields": [
        "1.",
        "2.",
        "3.",
        "4.",
        "5.",
        "6."
      ]
    },
    {
      "heading": "来源与核查边界",
      "fields": [
        "August 23, 2026"
      ]
    }
  ],
  "anchors": [
    {
      "text": "训练循环",
      "href": "?view=garden&scope=branch:llm:training/loop",
      "section": null
    },
    {
      "text": "期望与方差",
      "href": "?view=garden&scope=branch:llm:math/probability",
      "section": null
    },
    {
      "text": "正则化",
      "href": "?view=garden&scope=branch:llm:training/budget/regularization",
      "section": "1. “拟合得好”先要说明在哪些记录上"
    },
    {
      "text": "训练、验证、测试与泄漏",
      "href": "?view=garden&scope=concept:train-validation-test",
      "section": "2. 先固定数据是怎样来的"
    },
    {
      "text": "训练、验证、测试与泄漏",
      "href": "?view=garden&scope=concept:train-validation-test",
      "section": "8. 从这个已知世界走回真实评估"
    },
    {
      "text": "统计推断",
      "href": "?view=garden&scope=branch:llm:rankings/methodology",
      "section": "8. 从这个已知世界走回真实评估"
    },
    {
      "text": "正则化改变了什么",
      "href": "?view=garden&scope=branch:llm:training/budget/regularization",
      "section": "8. 从这个已知世界走回真实评估"
    },
    {
      "text": "训练循环",
      "href": "?view=garden&scope=branch:llm:training/loop",
      "section": "8. 从这个已知世界走回真实评估"
    },
    {
      "text": "Tengyu Ma 与 Andrew Ng，CS229 Lecture Notes",
      "href": "https://cs229.stanford.edu/main_notes.pdf",
      "section": "来源与核查边界"
    },
    {
      "text": "Belkin、Hsu、Ma 与 Mandal，PNAS 116(32), 15849–15854（2019）作者托管版",
      "href": "https://www.cs.columbia.edu/~djhsu/papers/biasvariance-pnas.pdf",
      "section": "来源与核查边界"
    },
    {
      "text": "DOI",
      "href": "https://doi.org/10.1073/pnas.1903070116",
      "section": "来源与核查边界"
    },
    {
      "text": "Andrew Ng，CS229 Regularization and Model Selection 存档笔记",
      "href": "https://cs229.stanford.edu/notes_archive/cs229-notes5.pdf",
      "section": "来源与核查边界"
    }
  ],
  "onward": [
    {
      "scope": "branch:llm:training/loop",
      "articleId": "llm-training-loop",
      "anchorIndex": 0,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:math/probability",
      "articleId": "llm-conditional-probability",
      "anchorIndex": 1,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:training/budget/regularization",
      "articleId": "regularization-penalty-generalization",
      "anchorIndex": 2,
      "mode": "embedded-branch"
    },
    {
      "scope": "concept:train-validation-test",
      "articleId": "train-validation-test-data-leakage",
      "anchorIndex": 3,
      "mode": "canonical-folder"
    },
    {
      "scope": "concept:train-validation-test",
      "articleId": "train-validation-test-data-leakage",
      "anchorIndex": 4,
      "mode": "canonical-folder"
    },
    {
      "scope": "branch:llm:rankings/methodology",
      "articleId": "statistical-inference-confidence-interval",
      "anchorIndex": 5,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:training/budget/regularization",
      "articleId": "regularization-penalty-generalization",
      "anchorIndex": 6,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:training/loop",
      "articleId": "llm-training-loop",
      "anchorIndex": 7,
      "mode": "embedded-branch"
    }
  ]
} satisfies LinearGeneralizationLesson;

registerLinearGeneralizationTests(lesson);
