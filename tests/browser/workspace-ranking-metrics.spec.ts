// ISOLATED CANDIDATE: unintegrated and unexecuted; requires independent review and parent adoption.
import { registerRankingEfficiencyTests, type RankingEfficiencyLesson } from './ranking-efficiency-reader';

const lesson = {
  "article": {
    "id": "ranking-mrr-ndcg-judgments",
    "file": "content/models/evaluation/ranking-mrr-ndcg-judgments.md",
    "space": "models",
    "category": "evaluation-statistics",
    "categoryName": "评测与统计基础",
    "title": "MRR 与 NDCG：第一条可用结果，还是前几条整体质量？",
    "subtitle": "从相关性等级、截断与理想分母，到缺失标注和并列排序",
    "date": "2026-10-05",
    "tags": [
      "排序评价",
      "MRR",
      "NDCG",
      "相关性标注",
      "评价协议"
    ],
    "excerpt": "从完整的查询与文档等级表推导倒数排名和归一化折损收益，用短列表、零分母、收益反转及并列反例检查约定，并运行有界标准库计算器。",
    "knowledgeUnit": {
      "kind": "independent-explanation",
      "reviewStatus": "needs-independent-review",
      "exampleId": "ranking-mrr-ndcg-judgments",
      "conceptIds": [
        "concept:ranking-metrics"
      ],
      "placements": [
        {
          "hubId": "hub:llm",
          "path": "rankings/ranking-metrics"
        }
      ],
      "sourceUrls": [
        "https://trec.nist.gov/pubs/trec8/papers/qa_report.pdf",
        "https://nlp.stanford.edu/IR-book/pdf/08eval.pdf",
        "https://scikit-learn.org/1.9/modules/generated/sklearn.metrics.ndcg_score.html"
      ],
      "relatedResourceIds": []
    }
  },
  "name": "排序指标课",
  "parent": "topic:task-metrics",
  "articleSha256": "9694a0e4f553ecfe62b87cc6ab5a2de21fa66ce1b7bef198ad61f751a6c08d4f",
  "codeSha256": "a4d9a22b944ccbb4e10ad979a5f3e8910d594549c34e38951d7158c7352f6d02",
  "suffixSha256": "bb728bc53817d0f333d478773cec8f1a1f7c1eb4cbcd1408eabc25dd18e97bcc",
  "text": "本页解决的问题：同一份相关性标注里，“第一条可用结果排第几”与“前几条整体排得怎样”是不是同一个问题？为什么 RR 相同的排序，NDCG 仍可能相差很多？前置知识：会求平均数即可开始；期望与平均帮助理解查询权重，精确率与召回率帮助区分结果集合与结果顺序。先想清楚评价数据集代表谁，再固定这里的查询、候选文档和标注。本页数据全部为教学构造，不是真实搜索引擎或模型的成绩。1. 先分清查询、文档、标注和排序分数一次评价至少涉及三种对象：查询：一个具体的信息需求，同一句短语在不同任务背景下可能不是同一查询候选文档：有稳定 ID 的结果对象；也可以是推荐物品或检索片段，但一次评价中要固定单位相关性标注：评审按规则给某个“查询、文档”对的等级，不能只给文档一个跨查询通用等级本页把一个查询的完整候选集合称为 U。为方便手算，等级 r(d) 只取 0、1、2、3，分别表示本教学规则下的不相关、较弱相关、较强相关、高度相关。具体项目应把这些词改写为可执行的判定标准，并记录评审分歧和版本。等级不是概率，3 也不表示“比 1 有三倍把握”。系统可能给每个候选一个预测分数，再按分数排序。这个分数与评审等级是两回事：前者决定系统输出次序，后者用于评价次序。本页计算器直接接收已经确定的文档 ID 顺序，不接收预测分数，也不从分数大小猜等级。最后固定截断位置 k：只看前 k 个结果。返回不足 k 条时，只给实际返回的位置计分；未返回的位置不产生收益。这里不把重复 ID 当成新的结果。2. RR：第一条达到要求的结果在哪里？先选一个可用阈值 t：本页默认等级 r(d)\\ge1 就算可用。若业务要求至少“较强相关”，应在看结果之前把 t 改成 2。这个阈值施加在评审等级上，不是分类器的预测概率阈值。设 h 是前 k 条中第一次达到阈值的位置，位置从 1 开始。单个查询的倒数排名为：\\operatorname{RR}@k=\n\\begin{cases}\n1/h,&\\text{前 }k\\text{ 条内有命中}\\\\\n0,&\\text{前 }k\\text{ 条内没有命中}\n\\end{cases}第一条命中得 1，第二条得 1/2，第三条得 1/3。一旦第一次命中位置确定，把后面的文档全部换掉，也不会改变这个查询的 RR。它因此适合表达“多早碰到一条够用结果”，但不能独自表达“后面还找到了多少条、它们有多好”。本页把每个固定查询等权平均，得到平均倒数排名 MRR：\\operatorname{MRR}@k=\\frac1{|Q|}\\sum_{q\\in Q}\\operatorname{RR}_q@k这是先取每个查询的倒数、再求平均。第一命中位置为 1 和 3 时，MRR 为 (1+1/3)/2=2/3，不是平均位置 2 的倒数 1/2；未命中也不能硬填一个有限名次后再求倒数。一个历史实例是 TREC-8 问答报告第 1 页 §1：每题返回五个回答，按首个正确回答的倒数排名计分，没有正确回答记零，再跨题平均。本页借用其核心计分思想，另行声明检索候选、等级阈值和 k；不把历史的五回答协议说成所有现代 MRR 的唯一协议。3. NDCG：让前几条的等级和位置都起作用先定义收益，再定义位置折扣NDCG 的全称是归一化折损累积收益。本页选用如下约定：g(r)=2^r-1,\\qquad w_i=\\frac1{\\log_2(i+1)}等级 r0123收益 g(r)0137位置 1 的权重是 1，位置 2 约为 0.630930，位置 3 是 0.5。越后面的收益，乘上的权重越小。累积起来得到 DCG：\\operatorname{DCG}@k=\\sum_{i=1}^{\\min(k,m)}g(r(d_i))w_i这里 m 为返回条数，d_i 为第 i 个文档。指数收益与 \\log_2(i+1) 的这一搭配可见 《信息检索导论》§8.4，式 8.9，印刷页 163。它是一种明确的约定，并非 NDCG 名字本身保证采用的唯一公式。为什么需要理想排序？不同查询拥有的高等级文档数量可能不同。给一个只有一条弱相关结果的查询与一个拥有许多强相关结果的查询直接比较 DCG，基准并不相同。本页把整个已声明候选集合 U 的等级从高到低排好，在同一个 k 上计算理想 DCG，记为 IDCG。它与系统实际返回了哪些候选无关。然后逐查询计算：\\operatorname{NDCG}@k=\\frac{\\operatorname{DCG}@k}{\\operatorname{IDCG}@k}这个比值只在 IDCG 大于零时定义。这里约定：IDCG 为零就返回“不可用”，代码用 None，不把 0/0 偷换成 1。统计多查询平均值时，必须同时报告有定义的查询数与排除数。为什么高等级应排前面？设两个位置 i<j 都在截断范围内，较低收益为 a，较高收益为 b。交换前后，DCG 的增加为：\\Delta=(b-a)(w_i-w_j)\\ge0若只有较早位置在前 k 内，增加量是 (b-a)w_i；若两者都在范围外，增加量为零。重复消除逆序，就能得到高等级在前的最优顺序。这解释了 IDCG 的构造，也说明在本页非负等级、无重复、同一候选集合的数学条件下，NDCG 在 [0,1] 内。浮点实现允许极小舍入误差，不能把输入错误靠裁剪到这个区间掩盖。4. 从原始等级逐步算：同一个 RR，不同的 NDCG三个查询使用相同的五个 ID，但每个查询分别标注。每个候选都已判过，不存在未标注文档：文档Q1Q2Q3a300b200c100d030e010系统输出的左端为第 1 名：查询A 的顺序B 的顺序Q1c,d,a,b,eb,a,c,d,eQ2a,d,e,b,ca,b,c,e,dQ3a,b,c,d,ea,b,c,d,eQ1：第一条都够用，但后面的组成不同先固定 k=3,t=1。A 的前三级为 (1,0,3)，B 为 (2,3,1)。两者第一条都达到阈值，所以 RR 都是 1。逐位置收益如下：位置A 的折损收益B 的折损收益113207/\\log_2 337/21/2因此：\\begin{aligned}\n\\operatorname{DCG}_A@3&=1+0+7/2=4.5\\\\\n\\operatorname{DCG}_B@3&=3+7/\\log_2 3+1/2\\\\\n&\\approx7.916508\n\\end{aligned}完整候选中最好的三级是 (3,2,1)，所以共同分母为：\\operatorname{IDCG}@3=7+3/\\log_2 3+1/2\\approx9.392789A 的 NDCG 约 0.479091，B 约 0.842828。RR 并未算错；它只保留了首个合格位置的信息。 NDCG 则看到了前几条的等级组合和位置。若预先把可用阈值改为 2，A 的第一次命中在第 3 名，B 在第 1 名，RR 分别变成 1/3 与 1。阈值改为 3 时，B 的 RR 又变成 1/2。本页 NDCG 仍使用原来的四级收益，不随 RR 阈值改变；不能含糊地说“我们提高了相关性阈值”却不说明改了哪个计算。Q2：截断改变了允许看到的范围在 k=3,t=1 下，A 的等级序列为 (0,3,1)，RR 为 1/2。其 DCG 是 7/\\log_2 3+1/2\\approx4.916508；理想序列是 (3,1,0)，IDCG 约 7.630930，所以 NDCG 约 0.644287。B 的前三级全为零，因此 RR 与 NDCG 都为零。可它并非永远找不到：改为 k=5 后，第一次可用结果在第 4 名，RR 变成 1/4，NDCG 约 0.411306。一次看前三条、一次看前五条，回答的是不同的问题，不能作为同一指标直接互换。固定顺序和阈值时，增大 k 不会降低 RR；NDCG 没有同样保证，因为分子与理想分母都会随 k 改变。例如候选等级为 a=3、b=2、c=0，顺序 a,c,b：NDCG@1 是 1，而 NDCG@2 为 7/(7+3/\\log_2 3)<1。Q3：没有相关候选，不等于完美检索Q3 的整个已标注集合都是零。这与 Q2 的 B 在前三条没找到不同：Q2 的完整候选中确实有相关文档，Q3 在声明的候选集合中没有。本页固定三查询总体，所以 Q3 的 RR 仍记零并进入 MRR；NDCG 因 IDCG=0 而不可用。若只评价“候选里至少有一条达标文档”的查询，那是另一套应事先声明的查询总体。不能看了系统表现后再选择排除谁，也不能由 Q3 推断现实世界根本不存在答案。5. 平均时，先看每个查询的分母按上一节统一的 k=3,t=1：查询A 的 RRB 的 RRQ111Q21/20Q300A 的 MRR 为 (1+1/2+0)/3=1/2；B 为 (1+0+0)/3=1/3，两者的查询数都是 3。查询A 的 NDCGB 的 NDCGQ10.4790910.842828Q20.6442870Q3不可用不可用本页采用“先逐查询归一化、再对有定义者等权平均”。A 的平均 NDCG 约为 0.561689，B 约为 0.421414；两者有定义查询数为 2、排除数为 1。若全体 IDCG 都为零，平均 NDCG 也应不可用。不要把它改成“先把 DCG 全加起来，再除以 IDCG 的总和”。后一种算法会按各查询的 IDCG 加权；A 在本例得到约 0.553140，并不是等权平均的 0.561689。这不只是小数精度差异，而是查询权重变了。还要注意：RR 的可用阈值与 NDCG 的正分母条件不一定一致。某个查询若只有等级 1 的候选，在 t=3 时没有 RR 合格候选，但它仍有正 IDCG，NDCG 仍有定义。不能复用一个“有效查询掩码”而不检查含义。6. 四个会改变结论的约定只用已返回文档构造理想分母，会奖励漏检Q1 如果只返回 c，RR@3 仍为 1。DCG@3 是 1，但候选集合仍是五个文档，IDCG 仍约 9.392789，因此 NDCG 约为 0.106465。如果偷偷把分母改成“只在返回的 c 中找最优顺序”，分母就成了 1，得出所谓满分。那是在换一个只含 c 的候选集合，不能描述原五文档检索任务。理想排序要在评价协议声明的候选范围内计算。计算器只能检查传进来的集合：若调用者把 a、b 等候选连同标注一起删掉，它无法凭空知道这些文档曾经存在。因此数据清单、版本及完整性检查仍是调用者的责任。未标注不是已判不相关真实文档库可能很大，只标注多个系统返回结果的并集，是一种 pooling 做法；《信息检索导论》§8.5，印刷页 164–165说明了部分标注及人工判断背景。没进入标注池，表示相关性未知，并不等于评审已给零级。例如新增文档 u 没有判断，却被一个新系统排到第一。把 u 当零、删去 u 后压缩名次、补充评审，都会定义不同的评价程序。需要说明使用了哪种规则、哪些结果未被判过，以及比较是否受此影响。本页仅处理完整闭合集合：返回未知 ID 就报错；它不实现不完整标注的评价方法。换收益函数，甚至可以反转两种排序的胜负下面两种顺序来自同一组等级，固定 k=3：X：(1,2,0,3,2)Y：(0,1,3,2,2)用线性收益 g(r)=r 时：\\begin{aligned}\n\\operatorname{DCG}_X&=1+2/\\log_2 3\\approx2.261860\\\\\n\\operatorname{DCG}_Y&=1/\\log_2 3+3/2\\approx2.130930\n\\end{aligned}改用本页指数收益时：\\begin{aligned}\n\\operatorname{DCG}_X&=1+3/\\log_2 3\\approx2.892789\\\\\n\\operatorname{DCG}_Y&=1/\\log_2 3+7/2\\approx4.130930\n\\end{aligned}每种约定内，X 与 Y 因候选等级相同而共享 IDCG，所以 NDCG 的胜负也跟着反转。这不是“哪个公式在数学上更正确”的证据；它表明收益函数表达了对等级差异的不同重视程度，需要与标注设计一起声明。并列预测分数，不自动给出唯一顺序只看 a=3、c=1 两个候选，若系统都给分数 0.9，固定 k=1：把 a 放前面，NDCG 为 1；把 c 放前面，NDCG 为 1/7。在 RR 阈值 t=3 下，相应 RR 分别为 1 与 0。可选一种事先固定并记录的并列打破规则，也可采用明确的并列平均方法，但不能假装分数自己确定了唯一排序。本页程序只评估传入的严格顺序，不实现随机并列或排列平均。实现接口也要核对。scikit-learn 1.9.1 的 ndcg_score 参数与并列示例说明其默认处理并列；它将 y_true 直接作为收益，而不会自动把原始等级转换成 2^r-1。本页没有执行该库，也不把不同输入约定下的数字称为库之间的误差。7. 一个可复算的标准库计算器下面只有一个完整可运行的 Python 例子。它从文档 ID 与原始等级计算，不是把上文答案写成查找表。输入契约：score_ranking(judgments, ranking, k, threshold=1) 的 judgments 必须是内置 dict，含 1–64 个候选；ID 为 1–16 个 ASCII 小写字母或数字、首位必须为字母，等级为内置 int 的 0–3。ranking 是内置 list 或 tuple，长度 0–64，只能含唯一的已知 ID。即使错误发生在第 k 项之后，也拒绝整次调用。k 是内置整数 1–64，允许大于返回数或候选数；threshold 是内置整数 1–3，比较含等号。布尔值、容器或数值的子类、隐式转换、负等级、实数等级、未知 ID、重复 ID 均不接受，违规统一抛出 ValueError。这里拒绝布尔值是因为 Python 中它虽是整数子类，却不是本契约的等级或截断位置。返回字典的 rr 是精确 Fraction；dcg、idcg、非空 ndcg 是浮点近似。relevant_total 数完整候选中达到 RR 阈值的项；examined 为实际计分条数；returned 为全部返回数；universe_size 为声明候选数。后三者不要混用。函数不修改输入；多查询平均在固定示范数据的循环里完成，不是另一个通用聚合 API。数值与功能范围：最多 64 项、每项收益至多 7，DCG 与 IDCG 的实数值不超过 448；不承诺任意大等级、任意精度或跨平台逐位一致。程序不支持预测分数、并列平均、部分标注、查询权重、置信区间、排序训练或生成答案判分。# nextchina-example: ranking-mrr-ndcg-judgments\nfrom fractions import Fraction\nfrom math import fsum, log2\nfrom re import fullmatch\n\n\ndef score_ranking(judgments, ranking, k, threshold=1):\n    if type(judgments) is not dict or not 1 <= len(judgments) <= 64:\n        raise ValueError(\"judgments must be a dict of size 1..64\")\n    for doc, grade in judgments.items():\n        if type(doc) is not str or not fullmatch(r\"[a-z][a-z0-9]{0,15}\", doc):\n            raise ValueError(\"invalid document ID\")\n        if type(grade) is not int or not 0 <= grade <= 3:\n            raise ValueError(\"grades must be exact ints in 0..3\")\n    if type(ranking) not in (list, tuple) or len(ranking) > 64:\n        raise ValueError(\"ranking must be a list/tuple of size 0..64\")\n    seen = set()\n    for doc in ranking:  # Validate even entries beyond the cutoff.\n        if type(doc) is not str or not fullmatch(r\"[a-z][a-z0-9]{0,15}\", doc):\n            raise ValueError(\"invalid ranked document ID\")\n        if doc not in judgments or doc in seen:\n            raise ValueError(\"unknown or repeated document ID\")\n        seen.add(doc)\n    if type(k) is not int or not 1 <= k <= 64:\n        raise ValueError(\"k must be an exact int in 1..64\")\n    if type(threshold) is not int or not 1 <= threshold <= 3:\n        raise ValueError(\"threshold must be an exact int in 1..3\")\n\n    top = [judgments[doc] for doc in ranking[:k]]\n    first = next((i for i, grade in enumerate(top, 1)\n                  if grade >= threshold), None)\n    rr = Fraction(0) if first is None else Fraction(1, first)\n    dcg = fsum((2 ** grade - 1) / log2(i + 1)\n               for i, grade in enumerate(top, 1))\n    ideal = sorted(judgments.values(), reverse=True)[:k]\n    idcg = fsum((2 ** grade - 1) / log2(i + 1)\n                for i, grade in enumerate(ideal, 1))\n    return {\n        \"rr\": rr,\n        \"dcg\": dcg,\n        \"idcg\": idcg,\n        \"ndcg\": dcg / idcg if idcg > 0 else None,\n        \"relevant_total\": sum(g >= threshold for g in judgments.values()),\n        \"examined\": len(top),\n        \"returned\": len(ranking),\n        \"universe_size\": len(judgments),\n    }\n\n\nqueries = {\n    \"Q1\": {\"a\": 3, \"b\": 2, \"c\": 1, \"d\": 0, \"e\": 0},\n    \"Q2\": {\"a\": 0, \"b\": 0, \"c\": 0, \"d\": 3, \"e\": 1},\n    \"Q3\": {\"a\": 0, \"b\": 0, \"c\": 0, \"d\": 0, \"e\": 0},\n}\nruns = {\n    \"A\": {\"Q1\": [\"c\", \"d\", \"a\", \"b\", \"e\"],\n          \"Q2\": [\"a\", \"d\", \"e\", \"b\", \"c\"],\n          \"Q3\": [\"a\", \"b\", \"c\", \"d\", \"e\"]},\n    \"B\": {\"Q1\": [\"b\", \"a\", \"c\", \"d\", \"e\"],\n          \"Q2\": [\"a\", \"b\", \"c\", \"e\", \"d\"],\n          \"Q3\": [\"a\", \"b\", \"c\", \"d\", \"e\"]},\n}\nfor name, run in runs.items():\n    rows = []\n    for qid, judgments in queries.items():\n        result = score_ranking(judgments, run[qid], 3)\n        rows.append(result)\n        value = result[\"ndcg\"]\n        shown = \"NA\" if value is None else f\"{value:.6f}\"\n        print(qid, name, \"RR\", result[\"rr\"], \"NDCG\", shown)\n    mrr = sum((row[\"rr\"] for row in rows), Fraction(0)) / len(rows)\n    defined = [row[\"ndcg\"] for row in rows if row[\"ndcg\"] is not None]\n    mean_ndcg = fsum(defined) / len(defined) if defined else None\n    print(name, \"MRR\", mrr, \"queries\", len(rows),\n          \"mean NDCG\", mean_ndcg,\n          \"eligible\", len(defined), \"excluded\", len(rows) - len(defined))运行时应看到 Q1 的两个 RR 都为 1，但两个 NDCG 不同；Q3 显示 NA；汇总同时打印 MRR 的三查询分母和 NDCG 的“2 个有定义、1 个排除”。这是一个程序对一组构造输入的计算，不是多个独立实测基准。8. 常见误解：一个好分数没有替你检查什么？“MRR=1 说明结果都很好。” 它只说明每个被计入查询的首条已达到所选阈值；其余结果可以很差“NDCG=0.8 表示答对了 80%。” 它是指定收益、折扣与候选分母下的归一化排序得分，不是准确率，也不是成功概率“相关等级是客观真相。” 等级依赖信息需求、判定规则、评审与版本。判分修订后，旧结果也应按同一新版重计“缺失标注就填零，大家都这样就公平。” 这是一项需要声明并检查影响的处理政策，不能让未知自动变成已知负例“同名指标就能比较。” 还需对齐查询总体、候选集合、k、RR 阈值、收益函数、并列规则、缺失和零分母政策、聚合权重“检索得分高，RAG 答案一定正确。” 即使相关证据排第一，生成器仍可能引用错误、遗漏限制或作出证据不支持的断言；生成正确性需要另外的参考、判分和逐项检查本页的普通 NDCG 也不直接奖励证据多样性或新增信息：两个不同 ID 的文档可能内容近乎重复。拒绝重复 ID 只能排除最明显的重复计数，不能自动解决语义冗余。排序评价与用户完成任务之间仍隔着内容、界面和下游使用过程；《信息检索导论》§8.5.1 与 §8.6，印刷页 167–168讨论了冗余及用户效用这一层差别。9. 练习：换一组候选，自己确定分子与分母新的完整候选集合 E：x=2、y=0、z=1、w=3，返回顺序为 y,z,x，固定 k=3。分别用阈值 1 和 2 求 RR；写出用于 IDCG 的等级顺序，并计算 DCG 与 NDCG现在把 w 追加到第 4 名，分别考察 k=3 与 k=4。阈值 1 的 RR 变了吗？NDCG 的哪些分子、分母项变了？若返回一个未标注的 u，把它写成零级是在补事实还是加政策？本页 API 怎样处理？反过来，若调用者只传 x、y、z 的标注，API 能知道漏掉了 w 吗？若把一个完整候选全为零的查询加入事先固定的总体，它的 RR、NDCG 分别如何记录？两个平均值各增加哪个分母？检索得到 NDCG=1，但生成器用其中一个文档支持文档没有说过的断言。这个检索分数能否证明答案正确？还缺哪类评价证据？参考解析第 1 题。 返回等级为 (0,1,2)。阈值 1 的第一次命中在第 2 名，RR=1/2；阈值 2 的第一次命中在第 3 名，RR=1/3。理想前三级是 (3,2,1)，不能因为 w 没被返回就把它删出理想序列。\\begin{aligned}\n\\operatorname{DCG}@3&=1/\\log_2 3+3/2\\\\\n&\\approx2.130930\\\\\n\\operatorname{IDCG}@3&=7+3/\\log_2 3+1/2\\\\\n&\\approx9.392789\n\\end{aligned}NDCG 约为 0.226869，两种 RR 阈值不改变本页的四级 NDCG。第 2 题。 保持 k=3，w 在截断之外，两个指标都不变。改为 k=4，阈值 1 的首个合格位置仍为 2，所以 RR 仍为 1/2。DCG 新增 7/\\log_2 5\\approx3.014736，更新后的 DCG 约为 5.145666；理想顺序的第四级是 0，因此 IDCG 不变，NDCG 约为 0.547831。这里 NDCG 上升，不代表任意排名增加 k 都上升，Q2 后面的反例已经说明边界。第 3 题。 u 的相关性未知，填零是新增处理政策。本页 API 对未知返回 ID 抛 ValueError。但若 w 同时从候选标注与返回顺序中消失，API 只能把 x、y、z 当成调用者声明的完整集合，无法自动发现漏项。这需要外部候选清单和数据版本核对。第 4 题。 RR=0，并把固定总体的 MRR 查询数加 1；NDCG 不可用，有定义分母不变，排除数加 1。若原本也没有任何有定义查询，平均 NDCG 保持不可用。这里明确采用全查询 MRR 政策，不能套用一个未经声明的“只算有答案题”的分母。第 5 题。 不能。检索排序是相对于候选等级的评价；还需要待核对的生成断言、证据支持关系，以及适合任务的答案正确性判定标准。相关文档包含正确事实，与生成器正确使用了那些事实，是两项不同证据。10. 接下来读什么评价数据集：把本页的查询总体、候选清单、标注规则与版本写成可检查的评价输入评测协议：把截断、并列、未标注处理、零分母与聚合方式纳入可复现协议置信区间：本页只有固定集合上的描述得分；要谈抽样不确定性，需要另外明确抽样单位和推断条件来源与版本本页于 2026-10-05 核查以下原始报告、作者教材或官方接口文档。全部等级、排序、练习和反例为本页原创构造，未使用来源中的实验成绩或例题；不转载来源文件。Ellen M. Voorhees，1999，The TREC-8 Question Answering Track Report：实际查看 PDF 第 1 页 §1 的图像，核对首个正确回答、五项内无命中记零和跨题均值。此来源的任务是历史问答轨道，不是本页闭合检索任务的完整协议Manning、Raghavan、Schütze，Introduction to Information Retrieval，第 8 章，在线版标注 2009：核对 §8.4 式 8.9（印刷页 163）、§8.5（164–165）、§8.5.1 及 §8.6 开头（167–168）。分别用于公式约定、部分标注、冗余和用户效用的范围提醒；本页零 IDCG 政策由本页明确选择scikit-learn 1.9.1，ndcg_score：核对定义、y_true、k、sample_weight、ignore_ties 与并列示例，仅用于接口差异说明，未安装或运行该库作者在 Python 3.12.14 上执行了本页程序，并用 80 位 Decimal 对数及小候选集全排列最大值独立构造数值参照；覆盖穷举小输入、无命中、零分母、截断、重命名、等级交换、完整分母、边界与拒绝路径。此类检查能发现实现与约定不符，不能证明现实标注完整、指标适合所有任务或模型性能已通过实测。知识单元继续标为 needs-independent-review，不宣称专家认证。",
  "headings": [
    {
      "depth": 2,
      "text": "1. 先分清查询、文档、标注和排序分数"
    },
    {
      "depth": 2,
      "text": "2. RR：第一条达到要求的结果在哪里？"
    },
    {
      "depth": 2,
      "text": "3. NDCG：让前几条的等级和位置都起作用"
    },
    {
      "depth": 3,
      "text": "先定义收益，再定义位置折扣"
    },
    {
      "depth": 3,
      "text": "为什么需要理想排序？"
    },
    {
      "depth": 2,
      "text": "4. 从原始等级逐步算：同一个 RR，不同的 NDCG"
    },
    {
      "depth": 3,
      "text": "Q1：第一条都够用，但后面的组成不同"
    },
    {
      "depth": 3,
      "text": "Q2：截断改变了允许看到的范围"
    },
    {
      "depth": 3,
      "text": "Q3：没有相关候选，不等于完美检索"
    },
    {
      "depth": 2,
      "text": "5. 平均时，先看每个查询的分母"
    },
    {
      "depth": 2,
      "text": "6. 四个会改变结论的约定"
    },
    {
      "depth": 3,
      "text": "只用已返回文档构造理想分母，会奖励漏检"
    },
    {
      "depth": 3,
      "text": "未标注不是已判不相关"
    },
    {
      "depth": 3,
      "text": "换收益函数，甚至可以反转两种排序的胜负"
    },
    {
      "depth": 3,
      "text": "并列预测分数，不自动给出唯一顺序"
    },
    {
      "depth": 2,
      "text": "7. 一个可复算的标准库计算器"
    },
    {
      "depth": 2,
      "text": "8. 常见误解：一个好分数没有替你检查什么？"
    },
    {
      "depth": 2,
      "text": "9. 练习：换一组候选，自己确定分子与分母"
    },
    {
      "depth": 3,
      "text": "参考解析"
    },
    {
      "depth": 2,
      "text": "10. 接下来读什么"
    },
    {
      "depth": 2,
      "text": "来源与版本"
    }
  ],
  "tables": [
    [
      [
        "等级 r",
        "0",
        "1",
        "2",
        "3"
      ],
      [
        "收益 g(r)",
        "0",
        "1",
        "3",
        "7"
      ]
    ],
    [
      [
        "文档",
        "Q1",
        "Q2",
        "Q3"
      ],
      [
        "a",
        "3",
        "0",
        "0"
      ],
      [
        "b",
        "2",
        "0",
        "0"
      ],
      [
        "c",
        "1",
        "0",
        "0"
      ],
      [
        "d",
        "0",
        "3",
        "0"
      ],
      [
        "e",
        "0",
        "1",
        "0"
      ]
    ],
    [
      [
        "查询",
        "A 的顺序",
        "B 的顺序"
      ],
      [
        "Q1",
        "c,d,a,b,e",
        "b,a,c,d,e"
      ],
      [
        "Q2",
        "a,d,e,b,c",
        "a,b,c,e,d"
      ],
      [
        "Q3",
        "a,b,c,d,e",
        "a,b,c,d,e"
      ]
    ],
    [
      [
        "位置",
        "A 的折损收益",
        "B 的折损收益"
      ],
      [
        "1",
        "1",
        "3"
      ],
      [
        "2",
        "0",
        "7/\\log_2 3"
      ],
      [
        "3",
        "7/2",
        "1/2"
      ]
    ],
    [
      [
        "查询",
        "A 的 RR",
        "B 的 RR"
      ],
      [
        "Q1",
        "1",
        "1"
      ],
      [
        "Q2",
        "1/2",
        "0"
      ],
      [
        "Q3",
        "0",
        "0"
      ]
    ],
    [
      [
        "查询",
        "A 的 NDCG",
        "B 的 NDCG"
      ],
      [
        "Q1",
        "0.479091",
        "0.842828"
      ],
      [
        "Q2",
        "0.644287",
        "0"
      ],
      [
        "Q3",
        "不可用",
        "不可用"
      ]
    ]
  ],
  "displayMath": [
    "\\operatorname{RR}@k=\n\\begin{cases}\n1/h,&\\text{前 }k\\text{ 条内有命中}\\\\\n0,&\\text{前 }k\\text{ 条内没有命中}\n\\end{cases}",
    "\\operatorname{MRR}@k=\\frac1{|Q|}\\sum_{q\\in Q}\\operatorname{RR}_q@k",
    "g(r)=2^r-1,\\qquad w_i=\\frac1{\\log_2(i+1)}",
    "\\operatorname{DCG}@k=\\sum_{i=1}^{\\min(k,m)}g(r(d_i))w_i",
    "\\operatorname{NDCG}@k=\\frac{\\operatorname{DCG}@k}{\\operatorname{IDCG}@k}",
    "\\Delta=(b-a)(w_i-w_j)\\ge0",
    "\\begin{aligned}\n\\operatorname{DCG}_A@3&=1+0+7/2=4.5\\\\\n\\operatorname{DCG}_B@3&=3+7/\\log_2 3+1/2\\\\\n&\\approx7.916508\n\\end{aligned}",
    "\\operatorname{IDCG}@3=7+3/\\log_2 3+1/2\\approx9.392789",
    "\\begin{aligned}\n\\operatorname{DCG}_X&=1+2/\\log_2 3\\approx2.261860\\\\\n\\operatorname{DCG}_Y&=1/\\log_2 3+3/2\\approx2.130930\n\\end{aligned}",
    "\\begin{aligned}\n\\operatorname{DCG}_X&=1+3/\\log_2 3\\approx2.892789\\\\\n\\operatorname{DCG}_Y&=1/\\log_2 3+7/2\\approx4.130930\n\\end{aligned}",
    "\\begin{aligned}\n\\operatorname{DCG}@3&=1/\\log_2 3+3/2\\\\\n&\\approx2.130930\\\\\n\\operatorname{IDCG}@3&=7+3/\\log_2 3+1/2\\\\\n&\\approx9.392789\n\\end{aligned}"
  ],
  "inlineMath": [
    "U",
    "r(d)",
    "k",
    "k",
    "k",
    "t",
    "r(d)\\ge1",
    "t",
    "h",
    "k",
    "1/2",
    "1/3",
    "(1+1/3)/2=2/3",
    "1/2",
    "k",
    "r",
    "g(r)",
    "m",
    "d_i",
    "i",
    "\\log_2(i+1)",
    "U",
    "k",
    "0/0",
    "i<j",
    "a",
    "b",
    "k",
    "(b-a)w_i",
    "[0,1]",
    "k=3,t=1",
    "(1,0,3)",
    "(2,3,1)",
    "7/\\log_2 3",
    "7/2",
    "1/2",
    "(3,2,1)",
    "1/3",
    "1/2",
    "k=3,t=1",
    "(0,3,1)",
    "1/2",
    "7/\\log_2 3+1/2\\approx4.916508",
    "(3,1,0)",
    "k=5",
    "1/4",
    "k",
    "k",
    "7/(7+3/\\log_2 3)<1",
    "k=3,t=1",
    "(1+1/2+0)/3=1/2",
    "(1+0+0)/3=1/3",
    "t=3",
    "k=3",
    "(1,2,0,3,2)",
    "(0,1,3,2,2)",
    "g(r)=r",
    "k=1",
    "1/7",
    "t=3",
    "2^r-1",
    "k",
    "k",
    "k=3",
    "k=3",
    "k=4",
    "(0,1,2)",
    "1/2",
    "1/3",
    "(3,2,1)",
    "k=3",
    "k=4",
    "1/2",
    "7/\\log_2 5\\approx3.014736",
    "k"
  ],
  "inlineCode": [
    "None",
    "ndcg_score",
    "y_true",
    "score_ranking(judgments, ranking, k, threshold=1)",
    "judgments",
    "dict",
    "int",
    "ranking",
    "list",
    "tuple",
    "k",
    "threshold",
    "ValueError",
    "rr",
    "Fraction",
    "dcg",
    "idcg",
    "ndcg",
    "relevant_total",
    "examined",
    "returned",
    "universe_size",
    "NA",
    "ValueError",
    "ndcg_score",
    "y_true",
    "k",
    "sample_weight",
    "ignore_ties"
  ],
  "sections": [
    {
      "heading": "1. 先分清查询、文档、标注和排序分数",
      "text": "一次评价至少涉及三种对象：查询：一个具体的信息需求，同一句短语在不同任务背景下可能不是同一查询候选文档：有稳定 ID 的结果对象；也可以是推荐物品或检索片段，但一次评价中要固定单位相关性标注：评审按规则给某个“查询、文档”对的等级，不能只给文档一个跨查询通用等级本页把一个查询的完整候选集合称为 U。为方便手算，等级 r(d) 只取 0、1、2、3，分别表示本教学规则下的不相关、较弱相关、较强相关、高度相关。具体项目应把这些词改写为可执行的判定标准，并记录评审分歧和版本。等级不是概率，3 也不表示“比 1 有三倍把握”。系统可能给每个候选一个预测分数，再按分数排序。这个分数与评审等级是两回事：前者决定系统输出次序，后者用于评价次序。本页计算器直接接收已经确定的文档 ID 顺序，不接收预测分数，也不从分数大小猜等级。最后固定截断位置 k：只看前 k 个结果。返回不足 k 条时，只给实际返回的位置计分；未返回的位置不产生收益。这里不把重复 ID 当成新的结果。",
      "fields": [
        "查询",
        "候选文档",
        "相关性标注",
        "等级不是概率"
      ]
    },
    {
      "heading": "2. RR：第一条达到要求的结果在哪里？",
      "text": "先选一个可用阈值 t：本页默认等级 r(d)\\ge1 就算可用。若业务要求至少“较强相关”，应在看结果之前把 t 改成 2。这个阈值施加在评审等级上，不是分类器的预测概率阈值。设 h 是前 k 条中第一次达到阈值的位置，位置从 1 开始。单个查询的倒数排名为：\\operatorname{RR}@k=\n\\begin{cases}\n1/h,&\\text{前 }k\\text{ 条内有命中}\\\\\n0,&\\text{前 }k\\text{ 条内没有命中}\n\\end{cases}第一条命中得 1，第二条得 1/2，第三条得 1/3。一旦第一次命中位置确定，把后面的文档全部换掉，也不会改变这个查询的 RR。它因此适合表达“多早碰到一条够用结果”，但不能独自表达“后面还找到了多少条、它们有多好”。本页把每个固定查询等权平均，得到平均倒数排名 MRR：\\operatorname{MRR}@k=\\frac1{|Q|}\\sum_{q\\in Q}\\operatorname{RR}_q@k这是先取每个查询的倒数、再求平均。第一命中位置为 1 和 3 时，MRR 为 (1+1/3)/2=2/3，不是平均位置 2 的倒数 1/2；未命中也不能硬填一个有限名次后再求倒数。一个历史实例是 TREC-8 问答报告第 1 页 §1：每题返回五个回答，按首个正确回答的倒数排名计分，没有正确回答记零，再跨题平均。本页借用其核心计分思想，另行声明检索候选、等级阈值和 k；不把历史的五回答协议说成所有现代 MRR 的唯一协议。",
      "fields": [
        "可用阈值"
      ]
    },
    {
      "heading": "3. NDCG：让前几条的等级和位置都起作用",
      "text": "先定义收益，再定义位置折扣NDCG 的全称是归一化折损累积收益。本页选用如下约定：g(r)=2^r-1,\\qquad w_i=\\frac1{\\log_2(i+1)}等级 r0123收益 g(r)0137位置 1 的权重是 1，位置 2 约为 0.630930，位置 3 是 0.5。越后面的收益，乘上的权重越小。累积起来得到 DCG：\\operatorname{DCG}@k=\\sum_{i=1}^{\\min(k,m)}g(r(d_i))w_i这里 m 为返回条数，d_i 为第 i 个文档。指数收益与 \\log_2(i+1) 的这一搭配可见 《信息检索导论》§8.4，式 8.9，印刷页 163。它是一种明确的约定，并非 NDCG 名字本身保证采用的唯一公式。为什么需要理想排序？不同查询拥有的高等级文档数量可能不同。给一个只有一条弱相关结果的查询与一个拥有许多强相关结果的查询直接比较 DCG，基准并不相同。本页把整个已声明候选集合 U 的等级从高到低排好，在同一个 k 上计算理想 DCG，记为 IDCG。它与系统实际返回了哪些候选无关。然后逐查询计算：\\operatorname{NDCG}@k=\\frac{\\operatorname{DCG}@k}{\\operatorname{IDCG}@k}这个比值只在 IDCG 大于零时定义。这里约定：IDCG 为零就返回“不可用”，代码用 None，不把 0/0 偷换成 1。统计多查询平均值时，必须同时报告有定义的查询数与排除数。为什么高等级应排前面？设两个位置 i<j 都在截断范围内，较低收益为 a，较高收益为 b。交换前后，DCG 的增加为：\\Delta=(b-a)(w_i-w_j)\\ge0若只有较早位置在前 k 内，增加量是 (b-a)w_i；若两者都在范围外，增加量为零。重复消除逆序，就能得到高等级在前的最优顺序。这解释了 IDCG 的构造，也说明在本页非负等级、无重复、同一候选集合的数学条件下，NDCG 在 [0,1] 内。浮点实现允许极小舍入误差，不能把输入错误靠裁剪到这个区间掩盖。",
      "fields": [
        "整个已声明候选集合 U"
      ]
    },
    {
      "heading": "先定义收益，再定义位置折扣",
      "text": "NDCG 的全称是归一化折损累积收益。本页选用如下约定：g(r)=2^r-1,\\qquad w_i=\\frac1{\\log_2(i+1)}等级 r0123收益 g(r)0137位置 1 的权重是 1，位置 2 约为 0.630930，位置 3 是 0.5。越后面的收益，乘上的权重越小。累积起来得到 DCG：\\operatorname{DCG}@k=\\sum_{i=1}^{\\min(k,m)}g(r(d_i))w_i这里 m 为返回条数，d_i 为第 i 个文档。指数收益与 \\log_2(i+1) 的这一搭配可见 《信息检索导论》§8.4，式 8.9，印刷页 163。它是一种明确的约定，并非 NDCG 名字本身保证采用的唯一公式。",
      "fields": []
    },
    {
      "heading": "为什么需要理想排序？",
      "text": "不同查询拥有的高等级文档数量可能不同。给一个只有一条弱相关结果的查询与一个拥有许多强相关结果的查询直接比较 DCG，基准并不相同。本页把整个已声明候选集合 U 的等级从高到低排好，在同一个 k 上计算理想 DCG，记为 IDCG。它与系统实际返回了哪些候选无关。然后逐查询计算：\\operatorname{NDCG}@k=\\frac{\\operatorname{DCG}@k}{\\operatorname{IDCG}@k}这个比值只在 IDCG 大于零时定义。这里约定：IDCG 为零就返回“不可用”，代码用 None，不把 0/0 偷换成 1。统计多查询平均值时，必须同时报告有定义的查询数与排除数。为什么高等级应排前面？设两个位置 i<j 都在截断范围内，较低收益为 a，较高收益为 b。交换前后，DCG 的增加为：\\Delta=(b-a)(w_i-w_j)\\ge0若只有较早位置在前 k 内，增加量是 (b-a)w_i；若两者都在范围外，增加量为零。重复消除逆序，就能得到高等级在前的最优顺序。这解释了 IDCG 的构造，也说明在本页非负等级、无重复、同一候选集合的数学条件下，NDCG 在 [0,1] 内。浮点实现允许极小舍入误差，不能把输入错误靠裁剪到这个区间掩盖。",
      "fields": [
        "整个已声明候选集合 U"
      ]
    },
    {
      "heading": "4. 从原始等级逐步算：同一个 RR，不同的 NDCG",
      "text": "三个查询使用相同的五个 ID，但每个查询分别标注。每个候选都已判过，不存在未标注文档：文档Q1Q2Q3a300b200c100d030e010系统输出的左端为第 1 名：查询A 的顺序B 的顺序Q1c,d,a,b,eb,a,c,d,eQ2a,d,e,b,ca,b,c,e,dQ3a,b,c,d,ea,b,c,d,eQ1：第一条都够用，但后面的组成不同先固定 k=3,t=1。A 的前三级为 (1,0,3)，B 为 (2,3,1)。两者第一条都达到阈值，所以 RR 都是 1。逐位置收益如下：位置A 的折损收益B 的折损收益113207/\\log_2 337/21/2因此：\\begin{aligned}\n\\operatorname{DCG}_A@3&=1+0+7/2=4.5\\\\\n\\operatorname{DCG}_B@3&=3+7/\\log_2 3+1/2\\\\\n&\\approx7.916508\n\\end{aligned}完整候选中最好的三级是 (3,2,1)，所以共同分母为：\\operatorname{IDCG}@3=7+3/\\log_2 3+1/2\\approx9.392789A 的 NDCG 约 0.479091，B 约 0.842828。RR 并未算错；它只保留了首个合格位置的信息。 NDCG 则看到了前几条的等级组合和位置。若预先把可用阈值改为 2，A 的第一次命中在第 3 名，B 在第 1 名，RR 分别变成 1/3 与 1。阈值改为 3 时，B 的 RR 又变成 1/2。本页 NDCG 仍使用原来的四级收益，不随 RR 阈值改变；不能含糊地说“我们提高了相关性阈值”却不说明改了哪个计算。Q2：截断改变了允许看到的范围在 k=3,t=1 下，A 的等级序列为 (0,3,1)，RR 为 1/2。其 DCG 是 7/\\log_2 3+1/2\\approx4.916508；理想序列是 (3,1,0)，IDCG 约 7.630930，所以 NDCG 约 0.644287。B 的前三级全为零，因此 RR 与 NDCG 都为零。可它并非永远找不到：改为 k=5 后，第一次可用结果在第 4 名，RR 变成 1/4，NDCG 约 0.411306。一次看前三条、一次看前五条，回答的是不同的问题，不能作为同一指标直接互换。固定顺序和阈值时，增大 k 不会降低 RR；NDCG 没有同样保证，因为分子与理想分母都会随 k 改变。例如候选等级为 a=3、b=2、c=0，顺序 a,c,b：NDCG@1 是 1，而 NDCG@2 为 7/(7+3/\\log_2 3)<1。Q3：没有相关候选，不等于完美检索Q3 的整个已标注集合都是零。这与 Q2 的 B 在前三条没找到不同：Q2 的完整候选中确实有相关文档，Q3 在声明的候选集合中没有。本页固定三查询总体，所以 Q3 的 RR 仍记零并进入 MRR；NDCG 因 IDCG=0 而不可用。若只评价“候选里至少有一条达标文档”的查询，那是另一套应事先声明的查询总体。不能看了系统表现后再选择排除谁，也不能由 Q3 推断现实世界根本不存在答案。",
      "fields": [
        "RR 并未算错；它只保留了首个合格位置的信息。"
      ]
    },
    {
      "heading": "Q1：第一条都够用，但后面的组成不同",
      "text": "先固定 k=3,t=1。A 的前三级为 (1,0,3)，B 为 (2,3,1)。两者第一条都达到阈值，所以 RR 都是 1。逐位置收益如下：位置A 的折损收益B 的折损收益113207/\\log_2 337/21/2因此：\\begin{aligned}\n\\operatorname{DCG}_A@3&=1+0+7/2=4.5\\\\\n\\operatorname{DCG}_B@3&=3+7/\\log_2 3+1/2\\\\\n&\\approx7.916508\n\\end{aligned}完整候选中最好的三级是 (3,2,1)，所以共同分母为：\\operatorname{IDCG}@3=7+3/\\log_2 3+1/2\\approx9.392789A 的 NDCG 约 0.479091，B 约 0.842828。RR 并未算错；它只保留了首个合格位置的信息。 NDCG 则看到了前几条的等级组合和位置。若预先把可用阈值改为 2，A 的第一次命中在第 3 名，B 在第 1 名，RR 分别变成 1/3 与 1。阈值改为 3 时，B 的 RR 又变成 1/2。本页 NDCG 仍使用原来的四级收益，不随 RR 阈值改变；不能含糊地说“我们提高了相关性阈值”却不说明改了哪个计算。",
      "fields": [
        "RR 并未算错；它只保留了首个合格位置的信息。"
      ]
    },
    {
      "heading": "Q2：截断改变了允许看到的范围",
      "text": "在 k=3,t=1 下，A 的等级序列为 (0,3,1)，RR 为 1/2。其 DCG 是 7/\\log_2 3+1/2\\approx4.916508；理想序列是 (3,1,0)，IDCG 约 7.630930，所以 NDCG 约 0.644287。B 的前三级全为零，因此 RR 与 NDCG 都为零。可它并非永远找不到：改为 k=5 后，第一次可用结果在第 4 名，RR 变成 1/4，NDCG 约 0.411306。一次看前三条、一次看前五条，回答的是不同的问题，不能作为同一指标直接互换。固定顺序和阈值时，增大 k 不会降低 RR；NDCG 没有同样保证，因为分子与理想分母都会随 k 改变。例如候选等级为 a=3、b=2、c=0，顺序 a,c,b：NDCG@1 是 1，而 NDCG@2 为 7/(7+3/\\log_2 3)<1。",
      "fields": []
    },
    {
      "heading": "Q3：没有相关候选，不等于完美检索",
      "text": "Q3 的整个已标注集合都是零。这与 Q2 的 B 在前三条没找到不同：Q2 的完整候选中确实有相关文档，Q3 在声明的候选集合中没有。本页固定三查询总体，所以 Q3 的 RR 仍记零并进入 MRR；NDCG 因 IDCG=0 而不可用。若只评价“候选里至少有一条达标文档”的查询，那是另一套应事先声明的查询总体。不能看了系统表现后再选择排除谁，也不能由 Q3 推断现实世界根本不存在答案。",
      "fields": []
    },
    {
      "heading": "5. 平均时，先看每个查询的分母",
      "text": "按上一节统一的 k=3,t=1：查询A 的 RRB 的 RRQ111Q21/20Q300A 的 MRR 为 (1+1/2+0)/3=1/2；B 为 (1+0+0)/3=1/3，两者的查询数都是 3。查询A 的 NDCGB 的 NDCGQ10.4790910.842828Q20.6442870Q3不可用不可用本页采用“先逐查询归一化、再对有定义者等权平均”。A 的平均 NDCG 约为 0.561689，B 约为 0.421414；两者有定义查询数为 2、排除数为 1。若全体 IDCG 都为零，平均 NDCG 也应不可用。不要把它改成“先把 DCG 全加起来，再除以 IDCG 的总和”。后一种算法会按各查询的 IDCG 加权；A 在本例得到约 0.553140，并不是等权平均的 0.561689。这不只是小数精度差异，而是查询权重变了。还要注意：RR 的可用阈值与 NDCG 的正分母条件不一定一致。某个查询若只有等级 1 的候选，在 t=3 时没有 RR 合格候选，但它仍有正 IDCG，NDCG 仍有定义。不能复用一个“有效查询掩码”而不检查含义。",
      "fields": []
    },
    {
      "heading": "6. 四个会改变结论的约定",
      "text": "只用已返回文档构造理想分母，会奖励漏检Q1 如果只返回 c，RR@3 仍为 1。DCG@3 是 1，但候选集合仍是五个文档，IDCG 仍约 9.392789，因此 NDCG 约为 0.106465。如果偷偷把分母改成“只在返回的 c 中找最优顺序”，分母就成了 1，得出所谓满分。那是在换一个只含 c 的候选集合，不能描述原五文档检索任务。理想排序要在评价协议声明的候选范围内计算。计算器只能检查传进来的集合：若调用者把 a、b 等候选连同标注一起删掉，它无法凭空知道这些文档曾经存在。因此数据清单、版本及完整性检查仍是调用者的责任。未标注不是已判不相关真实文档库可能很大，只标注多个系统返回结果的并集，是一种 pooling 做法；《信息检索导论》§8.5，印刷页 164–165说明了部分标注及人工判断背景。没进入标注池，表示相关性未知，并不等于评审已给零级。例如新增文档 u 没有判断，却被一个新系统排到第一。把 u 当零、删去 u 后压缩名次、补充评审，都会定义不同的评价程序。需要说明使用了哪种规则、哪些结果未被判过，以及比较是否受此影响。本页仅处理完整闭合集合：返回未知 ID 就报错；它不实现不完整标注的评价方法。换收益函数，甚至可以反转两种排序的胜负下面两种顺序来自同一组等级，固定 k=3：X：(1,2,0,3,2)Y：(0,1,3,2,2)用线性收益 g(r)=r 时：\\begin{aligned}\n\\operatorname{DCG}_X&=1+2/\\log_2 3\\approx2.261860\\\\\n\\operatorname{DCG}_Y&=1/\\log_2 3+3/2\\approx2.130930\n\\end{aligned}改用本页指数收益时：\\begin{aligned}\n\\operatorname{DCG}_X&=1+3/\\log_2 3\\approx2.892789\\\\\n\\operatorname{DCG}_Y&=1/\\log_2 3+7/2\\approx4.130930\n\\end{aligned}每种约定内，X 与 Y 因候选等级相同而共享 IDCG，所以 NDCG 的胜负也跟着反转。这不是“哪个公式在数学上更正确”的证据；它表明收益函数表达了对等级差异的不同重视程度，需要与标注设计一起声明。并列预测分数，不自动给出唯一顺序只看 a=3、c=1 两个候选，若系统都给分数 0.9，固定 k=1：把 a 放前面，NDCG 为 1；把 c 放前面，NDCG 为 1/7。在 RR 阈值 t=3 下，相应 RR 分别为 1 与 0。可选一种事先固定并记录的并列打破规则，也可采用明确的并列平均方法，但不能假装分数自己确定了唯一排序。本页程序只评估传入的严格顺序，不实现随机并列或排列平均。实现接口也要核对。scikit-learn 1.9.1 的 ndcg_score 参数与并列示例说明其默认处理并列；它将 y_true 直接作为收益，而不会自动把原始等级转换成 2^r-1。本页没有执行该库，也不把不同输入约定下的数字称为库之间的误差。",
      "fields": [
        "理想排序要在评价协议声明的候选范围内计算。"
      ]
    },
    {
      "heading": "只用已返回文档构造理想分母，会奖励漏检",
      "text": "Q1 如果只返回 c，RR@3 仍为 1。DCG@3 是 1，但候选集合仍是五个文档，IDCG 仍约 9.392789，因此 NDCG 约为 0.106465。如果偷偷把分母改成“只在返回的 c 中找最优顺序”，分母就成了 1，得出所谓满分。那是在换一个只含 c 的候选集合，不能描述原五文档检索任务。理想排序要在评价协议声明的候选范围内计算。计算器只能检查传进来的集合：若调用者把 a、b 等候选连同标注一起删掉，它无法凭空知道这些文档曾经存在。因此数据清单、版本及完整性检查仍是调用者的责任。",
      "fields": [
        "理想排序要在评价协议声明的候选范围内计算。"
      ]
    },
    {
      "heading": "未标注不是已判不相关",
      "text": "真实文档库可能很大，只标注多个系统返回结果的并集，是一种 pooling 做法；《信息检索导论》§8.5，印刷页 164–165说明了部分标注及人工判断背景。没进入标注池，表示相关性未知，并不等于评审已给零级。例如新增文档 u 没有判断，却被一个新系统排到第一。把 u 当零、删去 u 后压缩名次、补充评审，都会定义不同的评价程序。需要说明使用了哪种规则、哪些结果未被判过，以及比较是否受此影响。本页仅处理完整闭合集合：返回未知 ID 就报错；它不实现不完整标注的评价方法。",
      "fields": []
    },
    {
      "heading": "换收益函数，甚至可以反转两种排序的胜负",
      "text": "下面两种顺序来自同一组等级，固定 k=3：X：(1,2,0,3,2)Y：(0,1,3,2,2)用线性收益 g(r)=r 时：\\begin{aligned}\n\\operatorname{DCG}_X&=1+2/\\log_2 3\\approx2.261860\\\\\n\\operatorname{DCG}_Y&=1/\\log_2 3+3/2\\approx2.130930\n\\end{aligned}改用本页指数收益时：\\begin{aligned}\n\\operatorname{DCG}_X&=1+3/\\log_2 3\\approx2.892789\\\\\n\\operatorname{DCG}_Y&=1/\\log_2 3+7/2\\approx4.130930\n\\end{aligned}每种约定内，X 与 Y 因候选等级相同而共享 IDCG，所以 NDCG 的胜负也跟着反转。这不是“哪个公式在数学上更正确”的证据；它表明收益函数表达了对等级差异的不同重视程度，需要与标注设计一起声明。",
      "fields": []
    },
    {
      "heading": "并列预测分数，不自动给出唯一顺序",
      "text": "只看 a=3、c=1 两个候选，若系统都给分数 0.9，固定 k=1：把 a 放前面，NDCG 为 1；把 c 放前面，NDCG 为 1/7。在 RR 阈值 t=3 下，相应 RR 分别为 1 与 0。可选一种事先固定并记录的并列打破规则，也可采用明确的并列平均方法，但不能假装分数自己确定了唯一排序。本页程序只评估传入的严格顺序，不实现随机并列或排列平均。实现接口也要核对。scikit-learn 1.9.1 的 ndcg_score 参数与并列示例说明其默认处理并列；它将 y_true 直接作为收益，而不会自动把原始等级转换成 2^r-1。本页没有执行该库，也不把不同输入约定下的数字称为库之间的误差。",
      "fields": []
    },
    {
      "heading": "7. 一个可复算的标准库计算器",
      "text": "下面只有一个完整可运行的 Python 例子。它从文档 ID 与原始等级计算，不是把上文答案写成查找表。输入契约：score_ranking(judgments, ranking, k, threshold=1) 的 judgments 必须是内置 dict，含 1–64 个候选；ID 为 1–16 个 ASCII 小写字母或数字、首位必须为字母，等级为内置 int 的 0–3。ranking 是内置 list 或 tuple，长度 0–64，只能含唯一的已知 ID。即使错误发生在第 k 项之后，也拒绝整次调用。k 是内置整数 1–64，允许大于返回数或候选数；threshold 是内置整数 1–3，比较含等号。布尔值、容器或数值的子类、隐式转换、负等级、实数等级、未知 ID、重复 ID 均不接受，违规统一抛出 ValueError。这里拒绝布尔值是因为 Python 中它虽是整数子类，却不是本契约的等级或截断位置。返回字典的 rr 是精确 Fraction；dcg、idcg、非空 ndcg 是浮点近似。relevant_total 数完整候选中达到 RR 阈值的项；examined 为实际计分条数；returned 为全部返回数；universe_size 为声明候选数。后三者不要混用。函数不修改输入；多查询平均在固定示范数据的循环里完成，不是另一个通用聚合 API。数值与功能范围：最多 64 项、每项收益至多 7，DCG 与 IDCG 的实数值不超过 448；不承诺任意大等级、任意精度或跨平台逐位一致。程序不支持预测分数、并列平均、部分标注、查询权重、置信区间、排序训练或生成答案判分。# nextchina-example: ranking-mrr-ndcg-judgments\nfrom fractions import Fraction\nfrom math import fsum, log2\nfrom re import fullmatch\n\n\ndef score_ranking(judgments, ranking, k, threshold=1):\n    if type(judgments) is not dict or not 1 <= len(judgments) <= 64:\n        raise ValueError(\"judgments must be a dict of size 1..64\")\n    for doc, grade in judgments.items():\n        if type(doc) is not str or not fullmatch(r\"[a-z][a-z0-9]{0,15}\", doc):\n            raise ValueError(\"invalid document ID\")\n        if type(grade) is not int or not 0 <= grade <= 3:\n            raise ValueError(\"grades must be exact ints in 0..3\")\n    if type(ranking) not in (list, tuple) or len(ranking) > 64:\n        raise ValueError(\"ranking must be a list/tuple of size 0..64\")\n    seen = set()\n    for doc in ranking:  # Validate even entries beyond the cutoff.\n        if type(doc) is not str or not fullmatch(r\"[a-z][a-z0-9]{0,15}\", doc):\n            raise ValueError(\"invalid ranked document ID\")\n        if doc not in judgments or doc in seen:\n            raise ValueError(\"unknown or repeated document ID\")\n        seen.add(doc)\n    if type(k) is not int or not 1 <= k <= 64:\n        raise ValueError(\"k must be an exact int in 1..64\")\n    if type(threshold) is not int or not 1 <= threshold <= 3:\n        raise ValueError(\"threshold must be an exact int in 1..3\")\n\n    top = [judgments[doc] for doc in ranking[:k]]\n    first = next((i for i, grade in enumerate(top, 1)\n                  if grade >= threshold), None)\n    rr = Fraction(0) if first is None else Fraction(1, first)\n    dcg = fsum((2 ** grade - 1) / log2(i + 1)\n               for i, grade in enumerate(top, 1))\n    ideal = sorted(judgments.values(), reverse=True)[:k]\n    idcg = fsum((2 ** grade - 1) / log2(i + 1)\n                for i, grade in enumerate(ideal, 1))\n    return {\n        \"rr\": rr,\n        \"dcg\": dcg,\n        \"idcg\": idcg,\n        \"ndcg\": dcg / idcg if idcg > 0 else None,\n        \"relevant_total\": sum(g >= threshold for g in judgments.values()),\n        \"examined\": len(top),\n        \"returned\": len(ranking),\n        \"universe_size\": len(judgments),\n    }\n\n\nqueries = {\n    \"Q1\": {\"a\": 3, \"b\": 2, \"c\": 1, \"d\": 0, \"e\": 0},\n    \"Q2\": {\"a\": 0, \"b\": 0, \"c\": 0, \"d\": 3, \"e\": 1},\n    \"Q3\": {\"a\": 0, \"b\": 0, \"c\": 0, \"d\": 0, \"e\": 0},\n}\nruns = {\n    \"A\": {\"Q1\": [\"c\", \"d\", \"a\", \"b\", \"e\"],\n          \"Q2\": [\"a\", \"d\", \"e\", \"b\", \"c\"],\n          \"Q3\": [\"a\", \"b\", \"c\", \"d\", \"e\"]},\n    \"B\": {\"Q1\": [\"b\", \"a\", \"c\", \"d\", \"e\"],\n          \"Q2\": [\"a\", \"b\", \"c\", \"e\", \"d\"],\n          \"Q3\": [\"a\", \"b\", \"c\", \"d\", \"e\"]},\n}\nfor name, run in runs.items():\n    rows = []\n    for qid, judgments in queries.items():\n        result = score_ranking(judgments, run[qid], 3)\n        rows.append(result)\n        value = result[\"ndcg\"]\n        shown = \"NA\" if value is None else f\"{value:.6f}\"\n        print(qid, name, \"RR\", result[\"rr\"], \"NDCG\", shown)\n    mrr = sum((row[\"rr\"] for row in rows), Fraction(0)) / len(rows)\n    defined = [row[\"ndcg\"] for row in rows if row[\"ndcg\"] is not None]\n    mean_ndcg = fsum(defined) / len(defined) if defined else None\n    print(name, \"MRR\", mrr, \"queries\", len(rows),\n          \"mean NDCG\", mean_ndcg,\n          \"eligible\", len(defined), \"excluded\", len(rows) - len(defined))运行时应看到 Q1 的两个 RR 都为 1，但两个 NDCG 不同；Q3 显示 NA；汇总同时打印 MRR 的三查询分母和 NDCG 的“2 个有定义、1 个排除”。这是一个程序对一组构造输入的计算，不是多个独立实测基准。",
      "fields": [
        "输入契约",
        "数值与功能范围"
      ]
    },
    {
      "heading": "8. 常见误解：一个好分数没有替你检查什么？",
      "text": "“MRR=1 说明结果都很好。” 它只说明每个被计入查询的首条已达到所选阈值；其余结果可以很差“NDCG=0.8 表示答对了 80%。” 它是指定收益、折扣与候选分母下的归一化排序得分，不是准确率，也不是成功概率“相关等级是客观真相。” 等级依赖信息需求、判定规则、评审与版本。判分修订后，旧结果也应按同一新版重计“缺失标注就填零，大家都这样就公平。” 这是一项需要声明并检查影响的处理政策，不能让未知自动变成已知负例“同名指标就能比较。” 还需对齐查询总体、候选集合、k、RR 阈值、收益函数、并列规则、缺失和零分母政策、聚合权重“检索得分高，RAG 答案一定正确。” 即使相关证据排第一，生成器仍可能引用错误、遗漏限制或作出证据不支持的断言；生成正确性需要另外的参考、判分和逐项检查本页的普通 NDCG 也不直接奖励证据多样性或新增信息：两个不同 ID 的文档可能内容近乎重复。拒绝重复 ID 只能排除最明显的重复计数，不能自动解决语义冗余。排序评价与用户完成任务之间仍隔着内容、界面和下游使用过程；《信息检索导论》§8.5.1 与 §8.6，印刷页 167–168讨论了冗余及用户效用这一层差别。",
      "fields": [
        "“MRR=1 说明结果都很好。”",
        "“NDCG=0.8 表示答对了 80%。”",
        "“相关等级是客观真相。”",
        "“缺失标注就填零，大家都这样就公平。”",
        "“同名指标就能比较。”",
        "“检索得分高，RAG 答案一定正确。”"
      ]
    },
    {
      "heading": "9. 练习：换一组候选，自己确定分子与分母",
      "text": "新的完整候选集合 E：x=2、y=0、z=1、w=3，返回顺序为 y,z,x，固定 k=3。分别用阈值 1 和 2 求 RR；写出用于 IDCG 的等级顺序，并计算 DCG 与 NDCG现在把 w 追加到第 4 名，分别考察 k=3 与 k=4。阈值 1 的 RR 变了吗？NDCG 的哪些分子、分母项变了？若返回一个未标注的 u，把它写成零级是在补事实还是加政策？本页 API 怎样处理？反过来，若调用者只传 x、y、z 的标注，API 能知道漏掉了 w 吗？若把一个完整候选全为零的查询加入事先固定的总体，它的 RR、NDCG 分别如何记录？两个平均值各增加哪个分母？检索得到 NDCG=1，但生成器用其中一个文档支持文档没有说过的断言。这个检索分数能否证明答案正确？还缺哪类评价证据？参考解析第 1 题。 返回等级为 (0,1,2)。阈值 1 的第一次命中在第 2 名，RR=1/2；阈值 2 的第一次命中在第 3 名，RR=1/3。理想前三级是 (3,2,1)，不能因为 w 没被返回就把它删出理想序列。\\begin{aligned}\n\\operatorname{DCG}@3&=1/\\log_2 3+3/2\\\\\n&\\approx2.130930\\\\\n\\operatorname{IDCG}@3&=7+3/\\log_2 3+1/2\\\\\n&\\approx9.392789\n\\end{aligned}NDCG 约为 0.226869，两种 RR 阈值不改变本页的四级 NDCG。第 2 题。 保持 k=3，w 在截断之外，两个指标都不变。改为 k=4，阈值 1 的首个合格位置仍为 2，所以 RR 仍为 1/2。DCG 新增 7/\\log_2 5\\approx3.014736，更新后的 DCG 约为 5.145666；理想顺序的第四级是 0，因此 IDCG 不变，NDCG 约为 0.547831。这里 NDCG 上升，不代表任意排名增加 k 都上升，Q2 后面的反例已经说明边界。第 3 题。 u 的相关性未知，填零是新增处理政策。本页 API 对未知返回 ID 抛 ValueError。但若 w 同时从候选标注与返回顺序中消失，API 只能把 x、y、z 当成调用者声明的完整集合，无法自动发现漏项。这需要外部候选清单和数据版本核对。第 4 题。 RR=0，并把固定总体的 MRR 查询数加 1；NDCG 不可用，有定义分母不变，排除数加 1。若原本也没有任何有定义查询，平均 NDCG 保持不可用。这里明确采用全查询 MRR 政策，不能套用一个未经声明的“只算有答案题”的分母。第 5 题。 不能。检索排序是相对于候选等级的评价；还需要待核对的生成断言、证据支持关系，以及适合任务的答案正确性判定标准。相关文档包含正确事实，与生成器正确使用了那些事实，是两项不同证据。",
      "fields": [
        "第 1 题。",
        "第 2 题。",
        "第 3 题。",
        "第 4 题。",
        "第 5 题。"
      ]
    },
    {
      "heading": "参考解析",
      "text": "第 1 题。 返回等级为 (0,1,2)。阈值 1 的第一次命中在第 2 名，RR=1/2；阈值 2 的第一次命中在第 3 名，RR=1/3。理想前三级是 (3,2,1)，不能因为 w 没被返回就把它删出理想序列。\\begin{aligned}\n\\operatorname{DCG}@3&=1/\\log_2 3+3/2\\\\\n&\\approx2.130930\\\\\n\\operatorname{IDCG}@3&=7+3/\\log_2 3+1/2\\\\\n&\\approx9.392789\n\\end{aligned}NDCG 约为 0.226869，两种 RR 阈值不改变本页的四级 NDCG。第 2 题。 保持 k=3，w 在截断之外，两个指标都不变。改为 k=4，阈值 1 的首个合格位置仍为 2，所以 RR 仍为 1/2。DCG 新增 7/\\log_2 5\\approx3.014736，更新后的 DCG 约为 5.145666；理想顺序的第四级是 0，因此 IDCG 不变，NDCG 约为 0.547831。这里 NDCG 上升，不代表任意排名增加 k 都上升，Q2 后面的反例已经说明边界。第 3 题。 u 的相关性未知，填零是新增处理政策。本页 API 对未知返回 ID 抛 ValueError。但若 w 同时从候选标注与返回顺序中消失，API 只能把 x、y、z 当成调用者声明的完整集合，无法自动发现漏项。这需要外部候选清单和数据版本核对。第 4 题。 RR=0，并把固定总体的 MRR 查询数加 1；NDCG 不可用，有定义分母不变，排除数加 1。若原本也没有任何有定义查询，平均 NDCG 保持不可用。这里明确采用全查询 MRR 政策，不能套用一个未经声明的“只算有答案题”的分母。第 5 题。 不能。检索排序是相对于候选等级的评价；还需要待核对的生成断言、证据支持关系，以及适合任务的答案正确性判定标准。相关文档包含正确事实，与生成器正确使用了那些事实，是两项不同证据。",
      "fields": [
        "第 1 题。",
        "第 2 题。",
        "第 3 题。",
        "第 4 题。",
        "第 5 题。"
      ]
    },
    {
      "heading": "10. 接下来读什么",
      "text": "评价数据集：把本页的查询总体、候选清单、标注规则与版本写成可检查的评价输入评测协议：把截断、并列、未标注处理、零分母与聚合方式纳入可复现协议置信区间：本页只有固定集合上的描述得分；要谈抽样不确定性，需要另外明确抽样单位和推断条件",
      "fields": []
    },
    {
      "heading": "来源与版本",
      "text": "本页于 2026-10-05 核查以下原始报告、作者教材或官方接口文档。全部等级、排序、练习和反例为本页原创构造，未使用来源中的实验成绩或例题；不转载来源文件。Ellen M. Voorhees，1999，The TREC-8 Question Answering Track Report：实际查看 PDF 第 1 页 §1 的图像，核对首个正确回答、五项内无命中记零和跨题均值。此来源的任务是历史问答轨道，不是本页闭合检索任务的完整协议Manning、Raghavan、Schütze，Introduction to Information Retrieval，第 8 章，在线版标注 2009：核对 §8.4 式 8.9（印刷页 163）、§8.5（164–165）、§8.5.1 及 §8.6 开头（167–168）。分别用于公式约定、部分标注、冗余和用户效用的范围提醒；本页零 IDCG 政策由本页明确选择scikit-learn 1.9.1，ndcg_score：核对定义、y_true、k、sample_weight、ignore_ties 与并列示例，仅用于接口差异说明，未安装或运行该库作者在 Python 3.12.14 上执行了本页程序，并用 80 位 Decimal 对数及小候选集全排列最大值独立构造数值参照；覆盖穷举小输入、无命中、零分母、截断、重命名、等级交换、完整分母、边界与拒绝路径。此类检查能发现实现与约定不符，不能证明现实标注完整、指标适合所有任务或模型性能已通过实测。知识单元继续标为 needs-independent-review，不宣称专家认证。",
      "fields": [
        "2026-10-05",
        "3.12.14",
        "needs-independent-review"
      ]
    }
  ],
  "anchors": [
    {
      "text": "期望与平均",
      "href": "?view=garden&scope=concept:expectation-variance",
      "section": null
    },
    {
      "text": "精确率与召回率",
      "href": "?view=garden&scope=concept:precision-recall",
      "section": null
    },
    {
      "text": "评价数据集代表谁",
      "href": "?view=garden&scope=concept:evaluation-dataset",
      "section": null
    },
    {
      "text": "TREC-8 问答报告第 1 页 §1",
      "href": "https://trec.nist.gov/pubs/trec8/papers/qa_report.pdf",
      "section": "2. RR：第一条达到要求的结果在哪里？"
    },
    {
      "text": "《信息检索导论》§8.4，式 8.9，印刷页 163",
      "href": "https://nlp.stanford.edu/IR-book/pdf/08eval.pdf",
      "section": "先定义收益，再定义位置折扣"
    },
    {
      "text": "《信息检索导论》§8.5，印刷页 164–165",
      "href": "https://nlp.stanford.edu/IR-book/pdf/08eval.pdf",
      "section": "未标注不是已判不相关"
    },
    {
      "text": "scikit-learn 1.9.1 的 ndcg_score 参数与并列示例",
      "href": "https://scikit-learn.org/1.9/modules/generated/sklearn.metrics.ndcg_score.html",
      "section": "并列预测分数，不自动给出唯一顺序"
    },
    {
      "text": "《信息检索导论》§8.5.1 与 §8.6，印刷页 167–168",
      "href": "https://nlp.stanford.edu/IR-book/pdf/08eval.pdf",
      "section": "8. 常见误解：一个好分数没有替你检查什么？"
    },
    {
      "text": "评价数据集",
      "href": "?view=garden&scope=concept:evaluation-dataset",
      "section": "10. 接下来读什么"
    },
    {
      "text": "评测协议",
      "href": "?view=garden&scope=concept:benchmark-protocol",
      "section": "10. 接下来读什么"
    },
    {
      "text": "置信区间",
      "href": "?view=garden&scope=concept:confidence-interval",
      "section": "10. 接下来读什么"
    },
    {
      "text": "The TREC-8 Question Answering Track Report",
      "href": "https://trec.nist.gov/pubs/trec8/papers/qa_report.pdf",
      "section": "来源与版本"
    },
    {
      "text": "Introduction to Information Retrieval，第 8 章",
      "href": "https://nlp.stanford.edu/IR-book/pdf/08eval.pdf",
      "section": "来源与版本"
    },
    {
      "text": "scikit-learn 1.9.1，ndcg_score",
      "href": "https://scikit-learn.org/1.9/modules/generated/sklearn.metrics.ndcg_score.html",
      "section": "来源与版本"
    }
  ],
  "onward": [
    {
      "scope": "concept:expectation-variance",
      "articleId": "llm-conditional-probability",
      "anchorIndex": 0
    },
    {
      "scope": "concept:precision-recall",
      "articleId": "classification-accuracy-precision-recall-f1",
      "anchorIndex": 1
    },
    {
      "scope": "concept:evaluation-dataset",
      "articleId": "evaluation-dataset-target-coverage",
      "anchorIndex": 2
    },
    {
      "scope": "concept:benchmark-protocol",
      "articleId": "benchmark-protocol-comparable-runs",
      "anchorIndex": 9
    },
    {
      "scope": "concept:confidence-interval",
      "articleId": "statistical-inference-confidence-interval",
      "anchorIndex": 10
    }
  ]
} satisfies RankingEfficiencyLesson;

registerRankingEfficiencyTests(lesson);
