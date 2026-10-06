// ISOLATED DRAFT: no repository/browser execution or adoption. Published batch17 and independent review are pending.
import { registerTrustMetricsTests, type TrustMetricsLesson } from './trust-metrics-reader';

const lesson = {
  "article": {
    "id": "fairness-evaluation-group-rates",
    "file": "content/models/evaluation/fairness-evaluation-group-rates.md",
    "space": "models",
    "category": "evaluation-statistics",
    "categoryName": "评测与统计基础",
    "title": "公平性评价：分母相同了吗，判断依据够了吗？",
    "subtitle": "从分组条件率、校准与阈值，到缺失证据和判断边界",
    "date": "2026-10-05",
    "tags": [
      "公平性评价",
      "分组指标",
      "条件概率",
      "判断边界",
      "精确计算"
    ],
    "excerpt": "用两份虚构 A/B 汇总档案计算分组条件率，限定错误率与 PPV 冲突的前提，区分校准和阈值后比较，并随参考错位、组别缺失、细分不可得和范围变化改写结论。",
    "knowledgeUnit": {
      "kind": "independent-explanation",
      "reviewStatus": "needs-independent-review",
      "exampleId": "fairness-evaluation-group-rates",
      "conceptIds": [
        "concept:fairness-evaluation"
      ],
      "placements": [
        {
          "hubId": "hub:ai-overview",
          "path": "orientation/fairness-evaluation"
        }
      ],
      "sourceUrls": [
        "https://papers.nips.cc/paper/6374-equality-of-opportunity-in-supervised-learning.pdf",
        "https://arxiv.org/pdf/1703.00056v1",
        "https://friedler.net/papers/sts_fat2019.pdf",
        "https://docs.python.org/3/library/fractions.html"
      ],
      "relatedResourceIds": []
    }
  },
  "name": "公平性评价课",
  "parent": "topic:trust-metrics",
  "articleSha256": "608111f30815fa286021723dbba9786c8c4a7cf9734287a4f944540e6489f544",
  "codeSha256": "481396ee1b5fe5d45e3b7f973f7e1e7552b724751280bfd8966be47172dadf4b",
  "suffixSha256": "44d2786422c7294c2cdb11bdb2bf843df8b9266f33458bc467831b2a33dbf5f3",
  "proseBlocks": [
    {
      "kind": "blockquote",
      "parts": [
        "本页解决的问题：两组的真正率、假正率都一样，为什么被判为正例之后的可靠程度仍不同？六个组别×分数单元都恰好匹配预测概率，为什么也不能得到一个“公平”的总认证？",
        "前置知识：分类指标与混淆矩阵、条件概率、概率校准。请先能区分“在实际正例中”与“在预测正例中”。阅读判断部分还需要评价数据集与评测协议的对象、参考和覆盖概念。本页只绑定公平性评价；链接不是额外概念的覆盖承诺。"
      ],
      "fields": [
        "本页解决的问题"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "公平性评价的一部分工作，是把“结果是否不同”拆成可核对的问题。另一部分同样重要：这些结果测到了什么，遗漏了谁，差异在这个任务中意味着什么。算出相同的两个比率，只回答了前一种问题里的一个小问题。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本页所有记录均为新构造的教学数据，不是实际的人、受保护属性或决策档案。A、B 只是两组抽象测试记录的名称，不表示原因、价值高低或内在属性。不能把例子的数值移作真实个人决策依据。"
      ],
      "fields": [
        "新构造的教学数据"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "每个观察单位是一条测试记录。先固定这些约定："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "G\\in\\{A,B\\}：已记录、互不重叠的分组；本页不从其他属性推断组别",
        "Y\\in\\{0,1\\}：观察到的二元参考标记；它是否合适，要另外检查",
        "D\\in\\{0,1\\}：冻结分类器的二元输出；D=1 简称“判正”或“入选”",
        "可选的 S\\in[0,1]：声称表示 Y=1 概率的分数"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“正”首先是一种编码。判正究竟意味着发现故障、匹配目标，还是获得某种机会，不能从数字 1 推出。称作“入选率”也没有暗示入选一定有利。改变正事件的含义会改变哪些错误值得关心；即使交换 0/1 后算术仍能运行，也不能让上下文自动保持不变。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "还应说明模型、参考版本、记录来源和期间。本文的两个档案 F-A、F-B 是不同的构造集合，不能把它们接成同一系统的前后成绩。下面的概率记号给出一般条件定义；具体表格里的数值是这份有限表的观察比率。"
      ],
      "fields": [
        "这份有限表的观察比率"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "在每个组 g 内，四格分别为："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "令该组总数为 N=TN+FP+FN+TP。先数出分母，再作除法："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "同一个 TP 放在不同分母上，就回答不同的问题：TPR 问“本组参考为正的记录中，有多少判正”，PPV 问“本组判正的记录中，有多少参考为正”。PPV 也是二元正类的精确率；TPR 是召回率。FPR 的分母是参考为负的记录，不是全部记录，也不是全部判正记录。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "条件定义可分两次看："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "没有条件集合就没有这个比率。 某组无参考正例，TPR 未定义；无参考负例，FPR 未定义；无人判正，PPV 未定义；无人判负，NPV 未定义。程序保留 None，不把它涂成零，也不把两个 None 叫作“相等”。全部记录为空则没有组内总体，属于本程序拒绝的输入。"
      ],
      "fields": [
        "没有条件集合就没有这个比率。"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "几种常见比较只是不同的约束："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "入选率相等：比较 r_A,r_B\\,，常称 demographic/statistical parity",
        "真正率相等：只比较 t_A,t_B\\,；在已说明正事件的二元设定下，对应 equal opportunity 的条件",
        "真正率和假正率都相等：同时比较 t_A,t_B\\, 与 f_A,f_B\\,，即 binary equalized odds",
        "PPV 相等：比较判正以后参考为正的比例，即本页使用的 predictive parity"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "Hardt、Price、Srebro，2016，§2 定义 2.1–2.3给出了前述条件独立与二元条件率定义。这里将它们用于一个有界的描述练习，不继承任何应用场景中的优先级。哪一个约束值得关注，需要目标、后果与流程证据；术语里的“平等”不能替这些问题作决定。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先看原始四格；每组各有 100 条："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "不要先比较 FP 的绝对数量。A 的参考负例为 80，B 的参考负例为 40；10 次和 5 次假正，对应同一个假正率。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "逐项代入："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "例如 A 的 PPV 为 15/(15+10)=3/5，B 为 45/(45+5)=9/10。本表满足两个错误率条件，却不满足入选率或 PPV 相等。它也没有相同的准确率，因为："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "共同的 TPR/FPR 仍以不同的基础正例率混合。说 equalized odds “使两组整体准确率相等”会误读这张表。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "程序还给出“B 减 A”的有符号差值：基础正例率 2/5、入选率 1/4、TPR 与 FPR 均为 0、PPV 为 3/10、NPV 为 -7/30、准确率为 -1/20。正负号只表示相减方向，不表示哪组更应当获益，也不是公平性分数。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "V1 只把 B 的 TN/FP 从 35/5 改成 30/10，FN/TP 不动。B 的 TPR 仍为 3/4，FPR 却成为 10/40=1/4。因此 TPR 相等不包含 FPR 相等。不要仅凭“机会相等”这个名称扩大它的条件。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "合并两组还能得到一个整体 PPV：60/75=4/5。这是判正记录按数量混合的结果；A/B 的 PPV 简单平均是 3/4。两个量的分母结构不同，而且无论报哪一个单值，都不会保留两组之间的差异。"
      ],
      "fields": [
        "无论报哪一个单值，都不会保留两组之间的差异"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "在每组都有参考正例与负例时，写 p=p_g\\,、t=t_g\\,、f=f_g\\,。相对全组的真阳性份额是 tp，假阳性份额是 f(1-p)，所以只要判正份额非零："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这是条件概率的重组。它对应 Chouldechova，arXiv v1，§2.3 式 (2.6)所讨论的基础比例、预测值与错误率关系。本页另外把使用条件及退化情形写全。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "假设两组 0<p_A,p_B<1，且共享严格为正的 t>0,f>0。令 d_g=tp_g+f(1-p_g)>0。交叉相减得到："
      ],
      "fields": [
        "严格为正"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "分母为正，tf>0。因此基础正例率不同，PPV 必定不同；若 p_B>p_A\\,，B 的 PPV 较大。这里才是一个成立的、范围清楚的“不可能同时相等”结论。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "它没有证明“所有公平概念互不兼容”，也没有证明“只有完美分类器才可能同时满足 PPV 与错误率相等”。以下边界可以直接检验："
      ],
      "fields": [
        "没有"
      ],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "若 f=0,t>0 且两组均有参考正例，判正中没有假正，PPV 都等于 1；TPR 可以小于 1，仍然有漏报",
        "若 t=0,f>0 且两组均有参考负例，判正全是假正，PPV 都等于 0；这当然不是良好预测，但属于代数例外",
        "若 t=f=0，所有记录都判负，PPV 分母为零，不能声称 PPV parity 成立",
        "若某组 p=0 或 p=1，其 TPR 或 FPR 本身缺少条件支持，不能沿用“共同且定义良好的两种错误率”前提",
        "若两组 p 相同，这个推导不造成上述冲突；也没有由此保证其他目标都满足"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "V2 给出了第一个例外的具体构造：将原表两组的 FP 全部挪到 TN，保留 FN/TP。A 变成 (80,0,5,15)，B 变成 (40,0,15,45)。两组 TPR 都为 3/4、FPR 都为 0、PPV 都为 1，但仍分别漏掉 5、15 条参考正例。边界条件不是可以省掉的脚注，而是结论的一部分。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先分清三个命题。对本页有支持的离散分数："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "ordered-list",
      "parts": [
        "组内概率校准要求 P(Y=1\\mid S=s,G=g)=s，右边是分数自己的数值",
        "同分数跨组一致要求同一个 s 下，A、B 的正例条件概率相同；二者可以同时偏离 s",
        "阈值后 PPV 相等比较整个 S\\ge\\tau 集合的正例率；这个集合通常混合多个分数"
      ],
      "fields": [
        "组内概率校准",
        "同分数跨组一致",
        "阈值后 PPV 相等"
      ],
      "start": 1
    },
    {
      "kind": "paragraph",
      "parts": [
        "Chouldechova v1，§2.1 定义 1、2中的第一个条件采用同分数跨组比较；不能看到 calibration 一词就直接换成本页的数值概率定义。连续分数的总体定义还需条件期望等形式，本页只计算有正支持数的离散单元。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "下面六个单元的“正例数/条数”恰好等于分数："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "例如 s=3/4 时，A 是 3/4，B 是 12/16=3/4。六格的“观察正例率减分数”均为零，这张有限表同时具备组内数值匹配与同分数跨组匹配。它不证明未知总体校准；这些整数本来就是教学构造。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "阈值事先固定为 \\tau=1/2，规则为 D=1 当且仅当 S\\ge1/2，恰好等于阈值也判正："
      ],
      "fields": [
        "D=1 当且仅当 S\\ge1/2"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "A 判正的 12 条里，8 条分数为 1/2、4 条为 3/4；B 判正的 24 条里，8 条分数为 1/2、16 条为 3/4。权重变了："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "同分数单元完全一致，不等于阈值后的分数组成一致。把 1/2 与 3/4 不加权平均成 5/8，则两组都会算错。"
      ],
      "fields": [
        "分数组成"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "再做一个不重新采样的思想实验：仅把分数标签 1/4,1/2,3/4 分别改为 1/10,2/5,9/10，六格的计数不变。对应同分数处的两组正例率仍然相同，但它们不再等于新的概率数值，偏差分别为 3/20,1/10,-3/20。所以命题 2 不推出命题 1。这里没有选择新阈值，也没有声称重新标分改善了模型。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "当两组某个分数没有共同支持时，不能补一个零再比较。程序分别保留已有单元，不生成不存在的组/分数格；“这个位置没有比较证据”与“这个位置不一致”是两回事。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "以下都是原始教学事实的更新。每个问题要求保留仍成立的部分，同时明确新的缺口；不能用“数据可能有偏”一句话代替分析。这些练习回应了Selbst 等，FAT* 2019，§2.1–§2.3关于测量边界、场景迁移与形式化的提醒，具体档案和结论由本页独立构造。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "已知： F-A 的 Y 来自旧验证器；真正想讨论的 Z 是“满足全部任务要求”。旧验证器不检查最后一步。一次方便抽查发现 12 条 D=1,Y=1 的记录缺少必需的最后一步，但没有它们的 A/B 明细，没有随机抽样方案，也没有其他 Z 标签。"
      ],
      "fields": [
        "已知："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先问： 原 PPV 是否立刻变成“满足全部要求的比例”？能判断哪组的 Z 差异更大吗？"
      ],
      "fields": [
        "先问："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "有界结论： 原表仍精确描述输出 D 与旧标记 Y 的关系。若记录集合、G 和 D 不变，A/B 入选率仍为 1/4 与 1/2，差值仍为 1/4，因为入选率不依赖 Y 或 Z。它没有测完 D 与 Z 的关系，也没有由此解释入选差异是否正当。抽查已提供具体反例：至少部分原先看作真阳性的记录，对目标 Z 不应如此编码；但不能把方便抽查的失败比例外推到全部判正记录，也不能在缺少组别明细时判定 A/B 的 Z 差距大小或方向。"
      ],
      "fields": [
        "有界结论："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "为什么： 将“验证器通过”换成“任务完成”，改变了被测构念，不是换一种指标缩写。把原表复制十倍或多计算几种率，都没有补上 Z。若这些失配主要在 A，和主要在 B，会导致不同的改写；现有证据不能区分。"
      ],
      "fields": [
        "为什么："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "修复证据： 明确完整任务规范与不可判定情形，保留旧 Y 及版本，用可追溯的对应记录取得 Z 参考；说明抽查选择方式，才能研究其代表性。若暂时做不到，只能缩小结论为“相对于旧验证器的组内比率”。这不是建议实际处置任何记录，也没有预设新评估一定更差或更平等。"
      ],
      "fields": [
        "修复证据："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "已知： F-A 只包含记录了 G 的项。目标集合另外有 40 条 G 缺失的项，四格为 (10,10,10,10)。缺失原因及其 A/B 归属未知；禁止猜测归属。"
      ],
      "fields": [
        "已知："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先问： 删除这 40 条后，能把原组率称为整个目标的组率吗？"
      ],
      "fields": [
        "先问："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "有界结论： 原入选率 1/4 与 1/2 只描述组别已知的记录。两种逻辑上可能的补全就能改变目标组率："
      ],
      "fields": [
        "有界结论："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "它们给出不同的 B−A 差值：5/28 与 1/4。这不是实际填补方案，也不是差值的完整上下界；它只是证明现有证据不能唯一确定目标组率。另一方面，所有 240 条的整体入选率可以确定为 95/240=19/48，因为这个量不需要 G。知道一个整体值，仍没有找回缺失的分组信息。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "还能确定多少？ 未知的只是精确组率，并非所有比较都未知。本题 40 条缺失记录里，判正、判负各 20 条。将更多缺失判正项分配给 A，会提高 A 入选率并降低 B 入选率；将更多缺失判负项分给 A，方向相反。因此全部可行分配中，最小差值来自“20 条判正都属 A、20 条判负都属 B”，为 5/12-3/8=1/24；最大差值来自相反分配，为 7/12-5/24=3/8。所以目标集合的 B−A 入选率差一定为正，且在 [1/24,3/8] 内，但确切大小未识别。先前两种全分给一组的补全不是极值。这个界限完全依赖本题给定的缺失计数和 A/B 完备分组假设，不是一般缺失问题的结论，更没有解释差异是否正当。"
      ],
      "fields": [
        "还能确定多少？",
        "一定为正，且在 [1/24,3/8] 内"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "修复证据： 查清组别字段的采集和遗漏机制，在已有授权与适当治理下核对可恢复的原始记录，而不是从代理特征猜 G。若不能恢复，应单列缺失数量和结果，保留“组别已知部分”的限定；任何假设性敏感性分析都要明示假设，不能暗称随机缺失。"
      ],
      "fields": [
        "修复证据："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "已知： 只保留了 F-A 的 A/B 汇总，另一二元分区 H 的 x/z 记录没有保留。下面两种可能的细分都能加回原表："
      ],
      "fields": [
        "已知："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先问： 仅凭原汇总，可以排除哪一种？“所有细组都具有相同 TPR”能成立吗？"
      ],
      "fields": [
        "先问："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "有界结论： 两者都符合原汇总，故原证据无法选择。P 的四个交叉组 TPR 都为 3/4；Q 在 x 中为 A 的 1 与 B 的 0，在 z 中为 A 的 0 与 B 的 1。A/B 的边际 TPR 都是 3/4，却掩盖了完全不同的内部图景。"
      ],
      "fields": [
        "有界结论："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "为什么： 每个粗组率都按其参考正例在细组中的分布加权。汇总丢掉这些联系后，不能从边际值还原联合分布。这也不证明现实中必定藏着这种差异；P 正是相反的可能性。"
      ],
      "fields": [
        "为什么："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "修复证据： 若 H 对明确问题有意义且适合记录，应保存可核验的联合分区与条件支持数，预先说明关注哪些交叉比较。细分后样本可能稀少，需要单独面对不确定性与记录治理。若 H 一直不可得，报告只到已观察的 A/B 分区，不称“所有子组均已检验”。"
      ],
      "fields": [
        "修复证据："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "已知： 一份冻结集合只有渠道 x 的 A/B 记录；目标还包括渠道 z，但没有 z 的输入、参考或输出。未给出两渠道错误结构或组别构成的关系。"
      ],
      "fields": [
        "已知："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "有界报告： “本结果限于已记录的渠道 x、其参考和分组；渠道 z 的组内表现尚无观测依据。”给 z 填零、沿用 x 的组率或仅给渠道填权重，都没有测到 z。缺失表现可以高也可以低，不能断言迁移必失败，更不能断言必成功。"
      ],
      "fields": [
        "有界报告："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "修复证据： 先明确 z 的同一任务是否仍成立，以及参考和 D 在该流程中的含义；再取得适合目标的、同版本、可核对的分组输出和参考，并说明抽样过程。若最终要汇总两渠道，还需目标构成和相应汇总定义。这里修复的是评价证据，不是从统计表推出如何对真实对象作决定。"
      ],
      "fields": [
        "修复证据："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这些构造整数支持精确的描述算术，没有抽样过程，不能为它们附一个置信区间就称为总体证据。有限表中恰好相等，也不意味着总体差值严格为零；观察到不同也没有自动给出差异的原因、后果或正当性。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "如果以后面对真实样本，至少还要问："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "抽取单位是什么，是否重复测量、同一来源聚集或选择性进入？原始记录数未必是独立支持数",
        "每个条件集合有多少项？总样本很多，不代表每组判正集合或罕见交叉组也很多",
        "阈值、组别划分和比较问题是否事前固定？看完测试结果再挑“最好看”的切片会改变推断问题",
        "参考标签是否可靠，缺失是否有机制，样本与目标有什么联系？更多重复记录不能修复构念错位",
        "估计的是哪一个差值，采用什么符合抽样和依赖结构的方法？想检验“不同于零”和想支持“足够接近”是不同目标"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "两个各自的置信区间重叠，不等价于组差异不存在，也不建立统计等效；等效问题需要说明有意义的容许范围及相应方法。本页不提供通用显著性检验、万能样本数或允许差异阈值。基础推断可见统计推断与置信区间。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "程序只做两件事：group_rates(cells) 汇总 A/B 的四格；score_group_audit(score_cells, threshold) 保留分数格，再按固定的 >= 阈值生成四格。二者都不返回 is_fair。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "精确输入契约： 外层必须是非空的内置 list；每行必须是内置 dict，键恰好如示例。计数必须是内置 int，拒绝布尔、小数、字符串和子类。四格非负，每组总数为正；A/B 各一行，不许重复、缺组或其他组名。分数组可有不同分数支持，但每格 total>0，且 0≤positives≤total；重复的组/分数对被拒绝。group 必须是精确 str 类型的 A 或 B。"
      ],
      "fields": [
        "精确输入契约："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "分数与阈值只收精确的 Fraction 类型且在 [0,1]，连整数 0/1 也需写成 Fraction(0) / Fraction(1)。这种刻意狭窄的 API 防止静默转换；例如浮点 0.1 转成分数不保证得到 1/10，见 Python fractions 官方文档。所有违约输入抛出 ValueError，不改写输入、不截断、不平滑、不删除坏行。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "输出契约： counts 保留四格和五个支持数；rates 的七个有名字段全为 Fraction 或 None。gap_B_minus_A 在任一侧未定义时仍是 None。分数输出保留 group、score、total、positives，并给出 empirical_positive_rate 与 calibration_gap；它们表示逐格观察率及“观察率减分数”。score_cells 按组别和分数排序，decision_audit 的结构与前一个函数相同。输出容器不与输入共享可变对象。"
      ],
      "fields": [
        "输出契约："
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "F-A 的完整 rates 已列于第 3 节。F-B 的七项输出可逐项核对："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "程序没有读入真实数据、选择阈值、推断分组、拟合、显著性检验或联网。它会保留没有正例、没有负例以及全判正/全判负时的零条件分母，但不接受整组为空。一个返回值只能覆盖 API 表达的证据，无法自动发现 C1 的错位目标或 C3 未保存的分区。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "ordered-list",
      "parts": [
        "F-A 中，B 的 PPV 高于 A，是否能说 B 的召回率也高？写出各自分母",
        "将 F-A 中每组 TP 全挪到 FN、保留 TN/FP，求两组 TPR、FPR、PPV。它反驳了哪种过强“不可能”说法？这个构造是否值得被称为良好预测？",
        "把 F-B 的阈值条件误写为 >，哪些等于 1/2 的记录改变位置？重新求两组 PPV",
        "如果没有任何判正项，应该报 PPV=0、PPV=1，还是未定义？同时判断“两个未定义的 PPV 相等”这句话",
        "C1 中，把记录复制十倍能不能修复 Z 的证据？C2 中，为什么整体入选率可算，组率却仍不唯一？",
        "逐行相加验证 C3 两种补全，再写一句明确限定了分区和证据范围的报告"
      ],
      "fields": [],
      "start": 1
    },
    {
      "kind": "ordered-list",
      "parts": [
        "不能。两组 TPR 都是 3/4，分母为 20 与 60；PPV 分母是 25 与 50。条件方向不能互换",
        "两组 TPR 都为 0、FPR 都为 1/8、PPV 都为 0。虽然基础正例率不同，三种比率仍同时相等，因为严格正的 TPR 前提不成立。分类器漏掉全部正例，还存在假正；代数可行不代表符合任务目标",
        "A 的四格变为 (16,1,8,3)，B 为 (7,4,5,12)，PPV 都为 3/4。这是另一个冻结规则的结果，不能替换原来 >= 的结论；本页也没有据此挑选阈值",
        "PPV 未定义，必须保留零支持数；两个未知/未定义位置不能被用作相等证据",
        "复制没有产生 Z 参考，也没有改变抽查设计。C2 的所有 D 已知，所以整体判正数可加；G 未知导致组别分母和分子无法唯一分配",
        "例如：“在 F-A 所保存的 A/B 边际表及参考 Y 下，观察 TPR 同为 3/4；H 的交叉比较尚未识别，不能扩展为每个细组都相同。”P/Q 证明证据不足，不是在推断真实 H"
      ],
      "fields": [],
      "start": 1
    },
    {
      "kind": "unordered-list",
      "parts": [
        "“基础正例率不同，所以不用继续评价”：错误。代数关系解释了某个约束冲突，没有解释基础差异的成因或合理性",
        "“同分数比较一致，所以概率数字正确”：错误。改标分数的例子保持前者，却破坏后者",
        "“整体校准就够了”：错误。汇总可能掩盖组内偏差；本页只在有支持的六格上逐格计算",
        "“有不可能定理，所以随便选个指标”：错误。必须写出实际问题、前提、损失与缺失证据；定理不替代判断",
        "“修好了指标就修好了流程”：错误。Y 的定义、进入数据的过程、细分覆盖与实际后果未必改变"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“在 F-A 的 200 条构造记录、参考 Y 和 A/B 分区上，两组观察 TPR 均为 3/4、FPR 均为 1/8；PPV 为 3/5 与 9/10。这些是指定条件集合上的描述率，不证明总体相等、因果解释或公平认证。若关注不同目标 Z、组别缺失记录或未保存的 H 分区，需要对应的新证据。”"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这比给表格盖一个通过印章更有用：读者能看见测了什么、没有测什么，以及什么证据会改变结论。相关概念继续读概率校准、评价数据集与评测协议。它们各有自己的问题，本页没有顺便完成那些主题。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "Hardt、Price、Srebro，Equality of Opportunity in Supervised Learning，NeurIPS 2016 的 9 页会议版本；核对 §2 定义 2.1–2.3，印刷页 2–3，限于条件定义及其描述边界，没有复现后处理算法或使用论文实证数据",
        "Chouldechova，Fair prediction with disparate impact，arXiv:1703.00056v1，版本提交日期 2017-02-28，17 页；核对 §2.1 定义 1–4、§2.3 式 (2.6)，印刷页 3–4、7。区分该文的同分数定义与数值概率校准；本页限定前提的推导、边界反例与数据均为自行构造",
        "Selbst 等，Fairness and Abstraction in Sociotechnical Systems，FAT* 2019 作者托管 PDF，10 页；核对 §2.1–§2.3 的边界、迁移和形式化讨论。这里只使用方法论提醒，没有搬用法律实例、合规门槛或替任何真实场景作裁决",
        "Python fractions 官方文档：核对整数分子/分母构造及浮点转换区别；网页打开时标为 Python 3.14.8 文档，实际隔离运行环境为 CPython 3.12.14，二者不是同一个版本声明"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "上述一手来源在 2026-10-05 重新打开并核对指定段落；PDF 以文本提取阅读，未声称完成图像版面核验或全篇审计。未复制来源的数据、图表或程序。作者的标准库精确算术、输入拒绝和记录展开检查已在隔离目录运行；仓库整套测试、构建、浏览器验证与集成未执行。本文状态仍为 needs-independent-review，expertReview=false；作者测试不等于独立专家认证。"
      ],
      "fields": [],
      "start": null
    }
  ],
  "headings": [
    {
      "depth": 2,
      "text": "1. 先确定正在比较谁、什么结果"
    },
    {
      "depth": 2,
      "text": "2. 把分母留在眼前"
    },
    {
      "depth": 2,
      "text": "3. 档案 F-A：错误率相等，PPV 不同"
    },
    {
      "depth": 3,
      "text": "改一处，再问一次"
    },
    {
      "depth": 2,
      "text": "4. 为什么会冲突，又有哪些例外"
    },
    {
      "depth": 2,
      "text": "5. 档案 F-B：三种“可靠”不能混叫"
    },
    {
      "depth": 2,
      "text": "6. 比率之外：四份需要改写结论的证据"
    },
    {
      "depth": 3,
      "text": "C1：参考标记并非想测的目标"
    },
    {
      "depth": 3,
      "text": "C2：缺组别的记录没有消失"
    },
    {
      "depth": 3,
      "text": "C3：粗分组相等，细分组还不知道"
    },
    {
      "depth": 3,
      "text": "C4：换了目标范围，旧相等不能直接继承"
    },
    {
      "depth": 2,
      "text": "7. 不确定性不是另加一列误差条"
    },
    {
      "depth": 2,
      "text": "8. 一个保留分母与未知值的程序"
    },
    {
      "depth": 2,
      "text": "9. 自检：不要只看最终分数"
    },
    {
      "depth": 3,
      "text": "参考解析"
    },
    {
      "depth": 3,
      "text": "常见误解"
    },
    {
      "depth": 2,
      "text": "10. 能带走的报告方式"
    },
    {
      "depth": 2,
      "text": "来源与核验范围"
    }
  ],
  "tables": [
    [
      [
        "格子",
        "参考 Y",
        "决定 D"
      ],
      [
        "TN",
        "0",
        "0"
      ],
      [
        "FP",
        "0",
        "1"
      ],
      [
        "FN",
        "1",
        "0"
      ],
      [
        "TP",
        "1",
        "1"
      ]
    ],
    [
      [
        "指标",
        "分子 / 分母"
      ],
      [
        "基础正例率 p",
        "(TP+FN)/N"
      ],
      [
        "入选率",
        "(TP+FP)/N"
      ],
      [
        "真正率 TPR",
        "TP/(TP+FN)"
      ],
      [
        "假正率 FPR",
        "FP/(TN+FP)"
      ],
      [
        "阳性预测值 PPV",
        "TP/(TP+FP)"
      ],
      [
        "阴性预测值 NPV",
        "TN/(TN+FN)"
      ],
      [
        "准确率",
        "(TP+TN)/N"
      ]
    ],
    [
      [
        "组",
        "TN",
        "FP",
        "FN",
        "TP"
      ],
      [
        "A",
        "70",
        "10",
        "5",
        "15"
      ],
      [
        "B",
        "35",
        "5",
        "15",
        "45"
      ]
    ],
    [
      [
        "条件支持数",
        "A",
        "B"
      ],
      [
        "参考正例",
        "20",
        "60"
      ],
      [
        "参考负例",
        "80",
        "40"
      ],
      [
        "判正",
        "25",
        "50"
      ],
      [
        "判负",
        "75",
        "50"
      ]
    ],
    [
      [
        "观察比率",
        "A",
        "B"
      ],
      [
        "基础正例率",
        "1/5",
        "3/5"
      ],
      [
        "入选率",
        "1/4",
        "1/2"
      ],
      [
        "TPR",
        "3/4",
        "3/4"
      ],
      [
        "FPR",
        "1/8",
        "1/8"
      ],
      [
        "PPV",
        "3/5",
        "9/10"
      ],
      [
        "NPV",
        "14/15",
        "7/10"
      ],
      [
        "准确率",
        "17/20",
        "4/5"
      ]
    ],
    [
      [
        "组",
        "分数 s",
        "条数",
        "正例数"
      ],
      [
        "A",
        "1/4",
        "16",
        "4"
      ],
      [
        "A",
        "1/2",
        "8",
        "4"
      ],
      [
        "A",
        "3/4",
        "4",
        "3"
      ],
      [
        "B",
        "1/4",
        "4",
        "1"
      ],
      [
        "B",
        "1/2",
        "8",
        "4"
      ],
      [
        "B",
        "3/4",
        "16",
        "12"
      ]
    ],
    [
      [
        "组",
        "TN",
        "FP",
        "FN",
        "TP"
      ],
      [
        "A",
        "12",
        "5",
        "4",
        "7"
      ],
      [
        "B",
        "3",
        "8",
        "1",
        "16"
      ]
    ],
    [
      [
        "纯假设补全",
        "A 入选率",
        "B 入选率"
      ],
      [
        "缺失项全属 A",
        "45/140 = 9/28",
        "1/2"
      ],
      [
        "缺失项全属 B",
        "1/4",
        "70/140 = 1/2"
      ]
    ],
    [
      [
        "补全 P",
        "TN",
        "FP",
        "FN",
        "TP"
      ],
      [
        "A/x",
        "14",
        "2",
        "1",
        "3"
      ],
      [
        "A/z",
        "56",
        "8",
        "4",
        "12"
      ],
      [
        "B/x",
        "7",
        "1",
        "3",
        "9"
      ],
      [
        "B/z",
        "28",
        "4",
        "12",
        "36"
      ]
    ],
    [
      [
        "补全 Q",
        "TN",
        "FP",
        "FN",
        "TP"
      ],
      [
        "A/x",
        "35",
        "5",
        "0",
        "15"
      ],
      [
        "A/z",
        "35",
        "5",
        "5",
        "0"
      ],
      [
        "B/x",
        "15",
        "5",
        "15",
        "0"
      ],
      [
        "B/z",
        "20",
        "0",
        "0",
        "45"
      ]
    ],
    [
      [
        "观察比率",
        "A",
        "B"
      ],
      [
        "基础正例率",
        "11/28",
        "17/28"
      ],
      [
        "入选率",
        "3/7",
        "6/7"
      ],
      [
        "TPR",
        "7/11",
        "16/17"
      ],
      [
        "FPR",
        "5/17",
        "8/11"
      ],
      [
        "PPV",
        "7/12",
        "2/3"
      ],
      [
        "NPV",
        "3/4",
        "3/4"
      ],
      [
        "准确率",
        "19/28",
        "19/28"
      ]
    ]
  ],
  "displayMath": [
    "\\begin{aligned}\np_g&=P(Y=1\\mid G=g)\\\\\nr_g&=P(D=1\\mid G=g)\\\\\nt_g&=P(D=1\\mid Y=1,G=g)\\\\\nf_g&=P(D=1\\mid Y=0,G=g)\n\\end{aligned}",
    "\\begin{aligned}\n\\mathrm{PPV}_g&=P(Y=1\\mid D=1,G=g)\\\\\n\\mathrm{NPV}_g&=P(Y=0\\mid D=0,G=g)\n\\end{aligned}",
    "\\mathrm{Accuracy}_g=t_gp_g+(1-f_g)(1-p_g)",
    "\\mathrm{PPV}=\\frac{tp}{tp+f(1-p)}",
    "\\mathrm{PPV}_B-\\mathrm{PPV}_A\n=\\frac{tf(p_B-p_A)}{d_Ad_B}",
    "\\begin{aligned}\n\\mathrm{PPV}_A&=\\frac{8(1/2)+4(3/4)}{12}=\\frac7{12}\\\\\n\\mathrm{PPV}_B&=\\frac{8(1/2)+16(3/4)}{24}=\\frac23\n\\end{aligned}"
  ],
  "inlineMath": [
    "G\\in\\{A,B\\}",
    "Y\\in\\{0,1\\}",
    "D\\in\\{0,1\\}",
    "D=1",
    "S\\in[0,1]",
    "Y=1",
    "g",
    "Y",
    "D",
    "N=TN+FP+FN+TP",
    "p",
    "(TP+FN)/N",
    "(TP+FP)/N",
    "TP/(TP+FN)",
    "FP/(TN+FP)",
    "TP/(TP+FP)",
    "TN/(TN+FN)",
    "(TP+TN)/N",
    "r_A,r_B\\,",
    "t_A,t_B\\,",
    "t_A,t_B\\,",
    "f_A,f_B\\,",
    "15/(15+10)=3/5",
    "45/(45+5)=9/10",
    "2/5",
    "1/4",
    "3/10",
    "-7/30",
    "-1/20",
    "3/4",
    "10/40=1/4",
    "60/75=4/5",
    "3/4",
    "p=p_g\\,",
    "t=t_g\\,",
    "f=f_g\\,",
    "tp",
    "f(1-p)",
    "0<p_A,p_B<1",
    "t>0,f>0",
    "d_g=tp_g+f(1-p_g)>0",
    "tf>0",
    "p_B>p_A\\,",
    "f=0,t>0",
    "t=0,f>0",
    "t=f=0",
    "p=0",
    "p=1",
    "p",
    "(80,0,5,15)",
    "(40,0,15,45)",
    "3/4",
    "P(Y=1\\mid S=s,G=g)=s",
    "s",
    "s",
    "S\\ge\\tau",
    "s",
    "s=3/4",
    "3/4",
    "12/16=3/4",
    "\\tau=1/2",
    "D=1",
    "S\\ge1/2",
    "1/2",
    "3/4",
    "1/2",
    "3/4",
    "1/2",
    "3/4",
    "5/8",
    "1/4,1/2,3/4",
    "1/10,2/5,9/10",
    "3/20,1/10,-3/20",
    "D=1,Y=1",
    "1/4",
    "1/2",
    "1/4",
    "(10,10,10,10)",
    "1/4",
    "1/2",
    "5/28",
    "1/4",
    "95/240=19/48",
    "5/12-3/8=1/24",
    "7/12-5/24=3/8",
    "[1/24,3/8]",
    "3/4",
    "3/4",
    "1/2",
    "3/4",
    "1/8",
    "(16,1,8,3)",
    "(7,4,5,12)",
    "3/4",
    "3/4",
    "3/4",
    "1/8",
    "3/5",
    "9/10"
  ],
  "inlineCode": [
    "None",
    "None",
    "group_rates(cells)",
    "score_group_audit(score_cells, threshold)",
    ">=",
    "is_fair",
    "list",
    "dict",
    "int",
    "str",
    "Fraction",
    "Fraction(0)",
    "Fraction(1)",
    "ValueError",
    "Fraction",
    "None",
    "None",
    ">",
    ">=",
    "needs-independent-review",
    "expertReview=false"
  ],
  "sections": [
    {
      "heading": "1. 先确定正在比较谁、什么结果",
      "fields": [
        "新构造的教学数据",
        "这份有限表的观察比率"
      ]
    },
    {
      "heading": "2. 把分母留在眼前",
      "fields": [
        "没有条件集合就没有这个比率。"
      ]
    },
    {
      "heading": "3. 档案 F-A：错误率相等，PPV 不同",
      "fields": [
        "无论报哪一个单值，都不会保留两组之间的差异"
      ]
    },
    {
      "heading": "改一处，再问一次",
      "fields": [
        "无论报哪一个单值，都不会保留两组之间的差异"
      ]
    },
    {
      "heading": "4. 为什么会冲突，又有哪些例外",
      "fields": [
        "严格为正",
        "没有"
      ]
    },
    {
      "heading": "5. 档案 F-B：三种“可靠”不能混叫",
      "fields": [
        "组内概率校准",
        "同分数跨组一致",
        "阈值后 PPV 相等",
        "D=1 当且仅当 S\\ge1/2",
        "分数组成"
      ]
    },
    {
      "heading": "6. 比率之外：四份需要改写结论的证据",
      "fields": [
        "已知：",
        "先问：",
        "有界结论：",
        "为什么：",
        "修复证据：",
        "已知：",
        "先问：",
        "有界结论：",
        "还能确定多少？",
        "一定为正，且在 [1/24,3/8] 内",
        "修复证据：",
        "已知：",
        "先问：",
        "有界结论：",
        "为什么：",
        "修复证据：",
        "已知：",
        "有界报告：",
        "修复证据："
      ]
    },
    {
      "heading": "C1：参考标记并非想测的目标",
      "fields": [
        "已知：",
        "先问：",
        "有界结论：",
        "为什么：",
        "修复证据："
      ]
    },
    {
      "heading": "C2：缺组别的记录没有消失",
      "fields": [
        "已知：",
        "先问：",
        "有界结论：",
        "还能确定多少？",
        "一定为正，且在 [1/24,3/8] 内",
        "修复证据："
      ]
    },
    {
      "heading": "C3：粗分组相等，细分组还不知道",
      "fields": [
        "已知：",
        "先问：",
        "有界结论：",
        "为什么：",
        "修复证据："
      ]
    },
    {
      "heading": "C4：换了目标范围，旧相等不能直接继承",
      "fields": [
        "已知：",
        "有界报告：",
        "修复证据："
      ]
    },
    {
      "heading": "7. 不确定性不是另加一列误差条",
      "fields": []
    },
    {
      "heading": "8. 一个保留分母与未知值的程序",
      "fields": [
        "精确输入契约：",
        "输出契约："
      ]
    },
    {
      "heading": "9. 自检：不要只看最终分数",
      "fields": []
    },
    {
      "heading": "参考解析",
      "fields": []
    },
    {
      "heading": "常见误解",
      "fields": []
    },
    {
      "heading": "10. 能带走的报告方式",
      "fields": []
    },
    {
      "heading": "来源与核验范围",
      "fields": []
    }
  ],
  "anchors": [
    {
      "text": "分类指标与混淆矩阵",
      "href": "?view=garden&scope=concept:precision-recall",
      "section": null
    },
    {
      "text": "条件概率",
      "href": "?view=garden&scope=concept:conditional-probability",
      "section": null
    },
    {
      "text": "概率校准",
      "href": "?view=garden&scope=concept:calibration",
      "section": null
    },
    {
      "text": "评价数据集",
      "href": "?view=garden&scope=concept:evaluation-dataset",
      "section": null
    },
    {
      "text": "评测协议",
      "href": "?view=garden&scope=concept:benchmark-protocol",
      "section": null
    },
    {
      "text": "Hardt、Price、Srebro，2016，§2 定义 2.1–2.3",
      "href": "https://papers.nips.cc/paper/6374-equality-of-opportunity-in-supervised-learning.pdf",
      "section": "2. 把分母留在眼前"
    },
    {
      "text": "Chouldechova，arXiv v1，§2.3 式 (2.6)",
      "href": "https://arxiv.org/pdf/1703.00056v1",
      "section": "4. 为什么会冲突，又有哪些例外"
    },
    {
      "text": "Chouldechova v1，§2.1 定义 1、2",
      "href": "https://arxiv.org/pdf/1703.00056v1",
      "section": "5. 档案 F-B：三种“可靠”不能混叫"
    },
    {
      "text": "Selbst 等，FAT* 2019，§2.1–§2.3",
      "href": "https://friedler.net/papers/sts_fat2019.pdf",
      "section": "6. 比率之外：四份需要改写结论的证据"
    },
    {
      "text": "统计推断与置信区间",
      "href": "?view=garden&scope=concept:confidence-interval",
      "section": "7. 不确定性不是另加一列误差条"
    },
    {
      "text": "Python fractions 官方文档",
      "href": "https://docs.python.org/3/library/fractions.html",
      "section": "8. 一个保留分母与未知值的程序"
    },
    {
      "text": "概率校准",
      "href": "?view=garden&scope=concept:calibration",
      "section": "10. 能带走的报告方式"
    },
    {
      "text": "评价数据集",
      "href": "?view=garden&scope=concept:evaluation-dataset",
      "section": "10. 能带走的报告方式"
    },
    {
      "text": "评测协议",
      "href": "?view=garden&scope=concept:benchmark-protocol",
      "section": "10. 能带走的报告方式"
    },
    {
      "text": "Equality of Opportunity in Supervised Learning",
      "href": "https://papers.nips.cc/paper/6374-equality-of-opportunity-in-supervised-learning.pdf",
      "section": "来源与核验范围"
    },
    {
      "text": "Fair prediction with disparate impact，arXiv:1703.00056v1",
      "href": "https://arxiv.org/pdf/1703.00056v1",
      "section": "来源与核验范围"
    },
    {
      "text": "Fairness and Abstraction in Sociotechnical Systems",
      "href": "https://friedler.net/papers/sts_fat2019.pdf",
      "section": "来源与核验范围"
    },
    {
      "text": "Python fractions 官方文档",
      "href": "https://docs.python.org/3/library/fractions.html",
      "section": "来源与核验范围"
    }
  ],
  "onward": [
    {
      "scope": "concept:precision-recall",
      "articleId": "classification-accuracy-precision-recall-f1",
      "anchorIndex": 0,
      "mode": "canonical-folder"
    },
    {
      "scope": "concept:conditional-probability",
      "articleId": "llm-conditional-probability",
      "anchorIndex": 1,
      "mode": "canonical-folder"
    },
    {
      "scope": "concept:calibration",
      "articleId": "probability-calibration-brier-bins",
      "anchorIndex": 2,
      "mode": "canonical-folder"
    },
    {
      "scope": "concept:evaluation-dataset",
      "articleId": "evaluation-dataset-target-coverage",
      "anchorIndex": 3,
      "mode": "canonical-folder"
    },
    {
      "scope": "concept:benchmark-protocol",
      "articleId": "benchmark-protocol-comparable-runs",
      "anchorIndex": 4,
      "mode": "canonical-folder"
    },
    {
      "scope": "concept:confidence-interval",
      "articleId": "statistical-inference-confidence-interval",
      "anchorIndex": 9,
      "mode": "canonical-folder"
    }
  ]
} satisfies TrustMetricsLesson;

registerTrustMetricsTests(lesson);
