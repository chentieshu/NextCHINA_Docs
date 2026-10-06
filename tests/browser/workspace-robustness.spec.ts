// ISOLATED DRAFT: no repository/browser execution or adoption. Published batch17 and independent review are pending.
import { registerTrustMetricsTests, type TrustMetricsLesson } from './trust-metrics-reader';

const lesson = {
  "article": {
    "id": "robustness-perturbation-scope",
    "file": "content/models/evaluation/robustness-perturbation-scope.md",
    "space": "models",
    "category": "evaluation-statistics",
    "categoryName": "评测与统计基础",
    "title": "鲁棒性评价：哪些变化测过了，哪些范围证明了？",
    "subtitle": "从有限探针、逐例最坏与分组权重，到字面分段函数的精确区间判定",
    "date": "2026-10-05",
    "tags": [
      "鲁棒性",
      "评测",
      "允许变化",
      "量词",
      "精确计算"
    ],
    "excerpt": "用带狭窄错误缺口的原创分类器，区分清洁、平均变化、测试最坏与完整集合正确性；通过分段证明和几何核对解释搜索失败为何不是认证。",
    "knowledgeUnit": {
      "kind": "independent-explanation",
      "reviewStatus": "needs-independent-review",
      "exampleId": "robustness-perturbation-scope",
      "conceptIds": [
        "concept:robustness"
      ],
      "placements": [
        {
          "hubId": "hub:ai-overview",
          "path": "orientation/robustness"
        }
      ],
      "sourceUrls": [
        "https://arxiv.org/pdf/1706.06083v4",
        "https://arxiv.org/pdf/1903.12261v1",
        "https://proceedings.neurips.cc/paper_files/paper/2020/file/d8330f857a17c53d217014ee776bfd50-Paper.pdf",
        "https://docs.python.org/3/library/fractions.html"
      ],
      "relatedResourceIds": []
    }
  },
  "name": "鲁棒性评价课",
  "parent": "topic:trust-metrics",
  "articleSha256": "30b1e5d7c7d20b22c11f2f4726b6fd040dc78718d7aa58998e828826e6c37755",
  "codeSha256": "e8412e7767d3a3eafaecc9655a3e04b8cc31ea2ffb2c3d88052a5031c4175a19",
  "suffixSha256": "bd475667b42554a03a726bd413e1fba4cafe0e5cada744bde0599a5d10dd467d",
  "proseBlocks": [
    {
      "kind": "blockquote",
      "parts": [
        "本页解决的问题：原始输入全答对，加了几种变化也全答对，能否说模型“已经鲁棒”？怎样把“没找到错误”“所有测试变化都正确”和“所有允许输入都正确”分开？",
        "前置知识：分类与准确率、评价数据集、评测协议，以及闭区间、绝对值。可选阅读：范数与距离。本页只独立讲解鲁棒性，使用原创一维函数和固定教学工作量，不运行真实模型，也不借用论文数据。"
      ],
      "fields": [
        "本页解决的问题"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先想一个分类器：输入稍微改变后，答案始终不变。它可能一直正确，也可能一直错误。因此本页研究的是变化后的正确性，不会用预测不变代替它。"
      ],
      "fields": [
        "变化后的正确性"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "一个可复查的鲁棒性问题至少要固定六项："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "ordered-list",
      "parts": [
        "任务：要判断什么，参考标签由什么规则确定",
        "系统：模型参数、预测规则，以及解码、归一化等预处理",
        "输入域：哪些输入有意义，超出范围怎样处理",
        "变化集合：允许怎样改输入，在哪里施加变化",
        "预算：变化大小怎样度量，最大可以多大",
        "汇总对象：哪些案例、各占多少权重，取平均还是逐例最坏"
      ],
      "fields": [
        "任务",
        "系统",
        "输入域",
        "变化集合",
        "预算",
        "汇总对象"
      ],
      "start": 1
    },
    {
      "kind": "paragraph",
      "parts": [
        "例如“图片每个像素最多改变某个值”，并没有自动证明改变后的图片仍属于原来的类别。测量单位换了、像素缩放换了，同一个数字预算也可能代表不同变化。对真实任务，标签保持性需要任务知识、标注或其他证据；不能从距离小直接推出。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "若预处理是 p，分类模型是 h，对外系统就是 f=h\\circ p。在原始输入上改变后再预处理，与直接改变模型接收的张量，定义的是两个可能不同的集合。本页把预处理固定为恒等映射：输入一个数，分类器就看到这个数。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先声明允许集合、再对每条案例考察集合内的最坏情况，是 Madry 等 §2、式 (2.1) 的稳健风险表述所强调的结构。本页不训练模型、不实现其搜索方法，只借此明确问题的量词；写出优化目标并不等于已经求得最坏值。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "输入域是实数闭区间 D=[-3,3]。参考标签为："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "固定分类器故意留有一个狭窄的错误缺口："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这不是拟合出来的神经网络，而是完整定义已知的字面函数。在 5/4 处预测0，在 4/3 处预测1；两个等号不能随意交换。"
      ],
      "fields": [
        "完整定义已知的字面函数"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对中心 x_i\\,，变化量记作 \\delta，预算为 \\varepsilon："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "允许输入为整个闭区间："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本课只接受完整位于 D 内、且 g 在其中不变的区间。我们不把越界部分剪掉，也不把跨过标签边界的点继续算作原标签。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "例如 x=1/4,\\varepsilon=1/2 给出 [-1/4,3/4]，包含两种参考标签，因而不属于本课的有效输入。把半径扩大，可能先让错误暴露，也可能使原来的任务前提失效。两者必须分开。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "一条记录可以代表多条相同案例。令其次数为 n_i>0，总案例数为 N=\\sum_i n_i\\,。重复次数只规定这份工作量的权重，不意味着这些记录是独立随机样本。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "在标签保持性已确认后，定义正确指示量："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "其中 y_i=g(x_i)。值为1表示正确，0表示错误。下面每个分数都先定义每条案例的量，再按案例次数汇总。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "不做变化，只检查原始输入："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "分母是 N 条案例。它是基线，不能替代变化后的评测。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先声明变化分布 q_i\\,，再平均："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本课程序采用同一份含 k 个不同探针的列表 P，各探针概率为 1/k。于是每条案例有 k 次判分，分母是 Nk，分子是所有“案例×探针”的正确次数。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "如果偏向容易的变化、改了变化类型的比例，平均分就可能升高，模型却没有变化。要比较平均分，必须连同变化分布一起比较。本课没有把这个平均称作 ImageNet-C 的 mCE；后者还有自身的基线归一化约定。Hendrycks 与 Dietterich §3–4.2 区分平均腐蚀表现、预测一致性与最坏情况，并列出了其特定基准的度量。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对一条案例，必须所有已测探针都正确："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这里“最坏”只针对列出的有限集合。一条案例测试十次、错一次，就不计入分子；不会因为其余九次正确而记为0.9条。分母仍然是 N，不是测试调用总数。"
      ],
      "fields": [
        "列出的有限集合"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "要求每一个允许变化都正确，包括没有显式试过的输入："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这个“全部”是数学上的全称要求。它针对固定的 N 条中心及各自允许集合，仍不是“整个现实总体都正确”。本课的集合非空，指示量只取0或1，因此这里的最小值含义明确。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "若每个 P_i\\, 都包含0，且是对应允许集合的子集，则逐例都有 r_i\\le t_i\\le C_i(0)。使用相同的非负权重汇总后："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "有限搜索没找到错误，给出的测试最坏准确率是完整集合鲁棒准确率的上界。 这不提供“完整集合至少这么好”的保证。找到一个合法错误，则足以否定该案例的全称正确性。"
      ],
      "fields": [
        "有限搜索没找到错误，给出的测试最坏准确率是完整集合鲁棒准确率的上界。"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "在同一测试集合上，还有 A_{\\rm test}\\le A_{\\rm avg}\\,，因为“全部正确”不可能比“正确比例”大。平均变化准确率与清洁准确率则没有一般的大小关系：变化也可能把原本错误的点移到正确区。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "下面三行代表20条固定案例。组名只是便于检查的切片，没有自然人或敏感属性。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "前两行属于 far 组，共18条；最后一行属于 notch-near 组，共2条。半径固定为 \\varepsilon=1/2。三个允许区间分别为 [-5/2,-3/2]、[3/2,5/2]、[1/2,3/2]，全部在域内，参考标签也都不变。"
      ],
      "fields": [
        "far",
        "notch-near"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "三个中心都预测正确，所以清洁准确率为 20/20=1。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "先测试："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "最靠近错误缺口的中心 x=1 被送到 1/2,1,3/2，这三点都不在缺口内。far 组的点也全部正确。因此60次测试都正确，20条案例也都通过所有探针："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "平均变化准确率：60/60=1",
        "测试集合最坏准确率：20/20=1"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "但取 \\delta=3/10，中心1会被送到 13/10。它仍为正数，标签没有改变，且："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "分类器在那里报0，真实标签为1。这就是一个合法反例。先前的三探针没有覆盖这个窄区间。"
      ],
      "fields": [
        "合法反例"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "现在把它加到列表："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "far 的18条案例各通过4次；notch-near 的2条案例各通过3次、失败1次。因此："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "而测试集合最坏准确率是 18/20=9/10，因为两条 near 案例都不再满足“所有探针正确”。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "高平均分 39/40 可以与某个切片“没有一条案例通过全部测试”同时成立。这份表应保留两个分母，而不是只给一个“鲁棒性97.5%”。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "三点搜索失败，为什么下面的有限程序又敢检查无限多个实数？区别在于：我们知道字面函数的全部分段边界，并证明每个未逐点检查的区域上预测是常数。证明来自函数结构，不能由“取了很多点”替代。"
      ],
      "fields": [
        "全部分段边界"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "对合法闭区间 [a,b]，执行以下步骤："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "ordered-list",
      "parts": [
        "收集 a,b，以及区间内所有分段点 0,5/4,4/3",
        "排序并去重，单独检查每一个收集到的点",
        "每对相邻分段点之间若存在开区间，检查它的中点",
        "所有检查都与该案例标签相同，才判定整段正确"
      ],
      "fields": [],
      "start": 1
    },
    {
      "kind": "paragraph",
      "parts": [
        "这些单点与开区间构成 [a,b] 的不重不漏划分。每个开区间内没有模型分段点，所以 f 恒定；参考标签又已确认在整段不变。中点正确等价于所在整个开区间正确。边界点单独检查，负责处理半开缺口的等号。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "因此：若程序接受，每一个划分单元都正确，整个区间都正确；若程序拒绝，被检查到的错误点就是区间内的反例。两方向同时成立，所以这对指定函数是精确判定。"
      ],
      "fields": [
        "精确判定"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "输入端点与中点使用有理数计算，但结论包括区间中的无理数：它们也位于某个恒定开区间中。代码没有枚举实数，也没有用浮点网格近似实数。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "零半径时 a=b，排序后只剩一个点，没有开区间；检查这个单点即可。若删除分段点，或只查整个区间的中点，这个证明就不成立。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "独立核对可以直接看错误集合，不重复实现分区算法。本课错误集合恰好为："
      ],
      "fields": [
        "错误集合"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "合法负标签区间不与它相交，处处正确。对合法正标签闭区间 [a,b]，不与错误集合相交，当且仅当："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "若两个条件都不满足，即 b\\ge5/4 且 a<4/3，取 z=\\max(a,5/4)。由 a\\le b 和 b\\ge5/4 可得 z\\le b；由 a<4/3 和 5/4<4/3 可得 z<4/3。于是 z 同时位于 [a,b] 和 E，确有错误。这证明了上述条件的另一方向。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "端点值得单独列出："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "主工作量的两个 far 区间避开错误集合，near 区间与之相交。因此完整区间鲁棒准确率是 18/20=9/10；分组为 18/18 与 0/2。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本例 P4 的测试最坏准确率恰好等于精确值，但这个相等是由结构证明确认的。不能因为 P4 比 P3 多找了一处错误，就推断任何后续集合都找齐了错误。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本节的“精确”只适用于这一个字面函数和合法区间。换模型、加随机性、改预处理、改标签规则或允许集合，都需要重新论证。它不是神经网络认证器，也不是现实系统安全保证。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "逐例最坏要求每条案例都能分别选择最不利的变化。它与“所有案例必须共用同一个变化”不同。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "取两个正标签案例 x_1=11/10、x_2=3/2，各一次；半径 1/4，测试列表为 \\{-1/4,0,1/5\\}："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "若每条案例先取自己的最坏值，两条都能找到错误，平均为0。若先固定一个共用变化再平均，三列变化对应的准确率是 1/2,1,1/2，最小为 1/2。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "用短式分别写出这个区别："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这里两式都对列出的有限探针集合 P 取最小。第一式不大于第二式。因为对任意固定 \\delta，逐例最小值都不大于那一列的值；汇总后，再对右边取最小仍保留不等式。两式可以相等，也可以像本例一样严格不同。报告“最坏情况”时，要交代选择变化的单位。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "若改为完整变化区间 [-1/4,1/4]，本例也得到0与1/2，但需另行检查：案例1的错误变化为 [3/20,7/30)，案例2为 [-1/4,-1/6)。两段各自非空且互不相交，所以逐例都可失败，却没有一个共用变化同时让两例失败。这个完整集合结果不是仅由三探针推出的。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "主工作量里 far 占 18/20，near 占 2/20。精确组分数分别为1和0，因此按案例汇总为 9/10。若问题改为“两组各占一半”，分数就是："
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这不是计算误差，而是改了汇总问题。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "现在保持模型、半径、输入中心和每组条件表现不变，只把工作量改成 far 两行各1次、near 18次。新的完整集合鲁棒准确率是 2/20=1/10；P4平均变化准确率变为 62/80=31/40；P3仍然全部通过。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "所以总分变化可能来自工作量混合变化，不能只归因于模型变差。组等权的完整集合分数仍是 1/2。这些是人为构造的算术反例，既不揭示真实人群分布，也不支持某种组划分最优。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "下面是唯一的可执行示例，全部使用 Python 标准库。分区计算负责整段判断；测试探针只负责有限集合。返回结果始终保留正确数和分母。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "cases 是内建 list 或 tuple，1至64行；每行为内建 dict，键恰好为 group、x、label、count",
        "group 只能是内建字符串far 或 notch-near；只出现一个组也可以。重复案例行保留次数，不自动去重",
        "label 是内建整数0或1，并与参考标签一致；count 是1至10000的内建整数",
        "中心、半径、探针只接受内建 int 或 Fraction；拒绝 bool、float、字符串、子类和隐式转换。约分后的分子绝对值、分母均不超过1000000",
        "半径范围为[0,1]；完整区间必须在[-3,3]中且标签不变。内部有理数运算不再套用公开输入的大小阈值",
        "探针列表为内建 list 或 tuple，1至64项，必须含0、数值不重复、绝对值不超过半径；每个探针等概率",
        "两个报告函数只接受字面 toy_predict 对象；其他 callable 也拒绝。没有 clip 参数，不裁剪、不训练、不发网络请求",
        "无论成功或失败都不修改输入；非法输入抛出 TypeError 或 ValueError。各组结果仅列实际出现的组"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "Python 官方 Fraction 文档 说明整数分子/分母的有理数构造与浮点构造的差异。本例用 Fraction(3, 10)，不会先把0.3转成二进制浮点再试图恢复“原来的分数”。接口故意比 Fraction 本身支持的输入更窄。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "程序打印的五个总分依次为1、1、39/40、9/10、9/10。完整字典还保留 cases、probe_trials 及相应正确数，不能只抄简化后比例而丢掉样本支持。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "两个报告中 cases 字段都表示该范围内的 \\sum_i n_i\\,，即 count 的总和；分组字典只对本组求和，不是记录行数。主例的总 cases 为20，far为18，near为2。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "probe_report 的平均分以案例数乘探针数为分母；测试最坏分以案例数为分母。exact_interval_report 的正确数只累计整段处处正确的案例。程序没有以“中心数3”代替“案例数20”，也不会对两个组自动等权。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "将越界区间剪回定义域，会缩小允许集合，让问题变容易；剔除重复探针，会改变用户给出的变化分布；把 float 近似成分数，可能改变半开区间的端点归属。这些都不是中性的清理。因此接口要求调用者先修正说明与输入，再重新运行。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "输入行数、次数和有理数大小上限只是为了把教学程序的计算量限制住，不是鲁棒性的数学定义。数学论证适用于声明的字面实数函数；程序对外只接收能精确表达且满足契约的有理参数。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“输出没变，所以鲁棒。” 在 x=13/10,\\varepsilon=0 时，唯一输出稳定为0，但参考为1，清洁、测试和完整集合正确率都为0。稳定性问题应另用“变化后是否仍等于原预测”表述，不能偷换为“是否等于真值”。"
      ],
      "fields": [
        "“输出没变，所以鲁棒。”"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“搜了很多次，都没找到错误，所以认证通过。” 搜索可能漏掉窄区间；搜索失败只是当前方法和预算下没有找到反例。精确证明还需覆盖所有允许点的理由。本课的分段结构提供了这个理由，普通黑盒调用次数本身没有提供。"
      ],
      "fields": [
        "“搜了很多次，都没找到错误，所以认证通过。”"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“半径变大，分数一定按同一规则继续算。” 若两个半径的允许集合嵌套，且任务标签、模型、工作量与评分都保持有效，那么逐例完整集合正确性随半径增大不会变好。但跨标签或越域后，本课拒绝继续用旧问题打分。负标签区间的右端点等于0时已跨标签，正标签区间的左端点等于0却仍合法，因为 g(0)=1。"
      ],
      "fields": [
        "“半径变大，分数一定按同一规则继续算。”"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“平均腐蚀测试很好，现实变化就有保障。” 合成变化集合与现实数据收集造成的变化，不是相同的分布。本页没有给两者建立覆盖或转移定理。Taori 等 §3.1、§4.2–4.3 在其2020图像分类试验范围内比较了合成与自然变化，提示从一种测试推到另一种需要证据。这既不是2026模型排名，也不表示任何合成测试都无用或不可能发生转移。"
      ],
      "fields": [
        "“平均腐蚀测试很好，现实变化就有保障。”"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“20条里18条整段正确，所以总体有90%保证。” 本课20条是固定构造工作量，重复次数不是独立抽样依据。整段的函数证明与总体统计推断是两个层次。若要推断现实总体，需另说明目标总体、抽样/聚类机制、标签质量与选择过程；可先读置信区间与抽样，不能把本课计数直接配上区间就称为实证证据。"
      ],
      "fields": [
        "“20条里18条整段正确，所以总体有90%保证。”"
      ],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "“在预处理恒等、参考阈值为0、字面缺口分类器固定、半径1/2且标签不变的20条构造案例上，三探针全部通过；加入3/10后，平均正确78/80，18/20条通过全部四探针。依据全部分段边界的证明，18/20条在整个闭区间上处处正确；near组为0/2。未测试真实数据分布或任何真实模型。”"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "这句话长一些，却把模型、任务、集合、分母、证据与限制都留住了。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "ordered-list",
      "parts": [
        "若near组改为18条、far两行各1条，求清洁、P3测试最坏、P4平均、P4测试最坏、完整集合五个总分",
        "区间[1,5/4]和[4/3,3/2]哪个处处正确？若把缺口改为开区间(5/4,4/3)，第一个答案怎样变化？哪些代码和证明必须同步更新？",
        "用 x=-1/4 和 x=1/4、同为半径1/4，解释为什么一个输入必须拒绝而另一个合法",
        "不含0的探针列表为何可能使测试最坏分高于清洁分？用本页模型给出一个具体反例；说明本课API会怎样处理它",
        "两个量词比较案例中，为何不能用“最坏的一个共用探针”替代逐例最坏？这会使报告变乐观还是变悲观？",
        "若一份现实报告只写“100次扰动都没成功，鲁棒率100%”，还缺哪些信息？即使补齐信息，哪种结论仍不能由失败搜索推出？"
      ],
      "fields": [],
      "start": 1
    },
    {
      "kind": "ordered-list",
      "parts": [
        "清洁1，P3测试最坏1，P4平均31/40，P4测试最坏1/10，完整集合1/10。P4总分母80，正确62；后两个分母20，正确2。near为54/72次正确、0/18条全通过；far为8/8次正确、2/2条全通过。组等权的完整集合分数仍为1/2",
        "[1,5/4]失败，因为5/4属于错误集合；[4/3,3/2]成功，因为4/3已离开缺口。若改成开区间，第一个区间会成功。预测器端点规则、错误集合交集条件、分区边界判值以及所有端点测试都要同步更新，原证明不能原封不动套用",
        "负中心的区间[-1/2,0]包含标签1的点0，不能沿用标签0；正中心的区间[0,1/2]全部为标签1，所以合法",
        "取中心13/10、半径1/10，只测变化1/10。中心在错误缺口内，清洁为0；变化后7/5在缺口外，唯一探针正确，测试最坏为1。该区间标签保持，但列表缺少0，本课API拒绝它。大小关系中的完整集合≤测试集合仍成立，测试集合≤清洁则失去依据",
        "每条案例各自能找到错误，所以逐例最坏为0；共用探针最多同时使一条错误，最坏平均为1/2。把后者冒充前者，会给出更乐观的分数。变化选择的单位是定义的一部分",
        "至少补任务/参考标签、模型和预处理版本、有效域、允许集合/预算、变化施加位置、案例与切片支持、搜索方法/次数分配、0是否纳入、失败/超时如何算及分母。补齐后可以复述指定搜索未找到反例，仍不能仅由此证明全部允许输入正确，也不能推出自然分布或总体保证"
      ],
      "fields": [],
      "start": 1
    },
    {
      "kind": "paragraph",
      "parts": [
        "资料复查日期：2026-10-05。正文用到的原理均按以下版本限缩理解；表格、数字、函数、证明和练习为本页原创。没有复制论文数据、下载基准资产或重跑论文模型。"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "unordered-list",
      "parts": [
        "Madry 等，ICLR 2018；本页读取 arXiv v4，2019-09-04：§1–2、式(2.1)，用于允许集合与逐例最坏的量词结构；没有将搜索成功率等同于求得全局最坏值",
        "Hendrycks 与 Dietterich，ICLR 2019；arXiv v1，2019-03-28：§3–4.2，用于区分平均表现、一致性、最坏情况及基准专属指标；本课39/40不是mCE",
        "Taori 等，NeurIPS 2020会议论文：§3.1、§4.2–4.3，用于限制合成测试向自然变化的外推。其历史结果不作为当前能力证据",
        "Python 官方 fractions 文档：有理数构造和浮点转换说明；本例实际隔离运行版本为 Python 3.12.14，不以在线文档的版本号冒充运行环境"
      ],
      "fields": [],
      "start": null
    },
    {
      "kind": "paragraph",
      "parts": [
        "本页状态仍为 needs-independent-review；并未声称专家审核。有限程序的作者检查不替代独立内容审核，也不替代未来集成后的页面与回归验证。"
      ],
      "fields": [],
      "start": null
    }
  ],
  "headings": [
    {
      "depth": 2,
      "text": "1. “对变化不敏感”还缺哪些条件？"
    },
    {
      "depth": 3,
      "text": "本课的任务与模型"
    },
    {
      "depth": 2,
      "text": "2. 四个分数，四种问题"
    },
    {
      "depth": 3,
      "text": "清洁准确率"
    },
    {
      "depth": 3,
      "text": "平均变化准确率"
    },
    {
      "depth": 3,
      "text": "测试集合最坏准确率"
    },
    {
      "depth": 3,
      "text": "完整允许集合鲁棒准确率"
    },
    {
      "depth": 2,
      "text": "3. 三个探针怎样漏掉缺口？"
    },
    {
      "depth": 2,
      "text": "4. 何时有限计算能够证明整个区间？"
    },
    {
      "depth": 3,
      "text": "分区证明"
    },
    {
      "depth": 3,
      "text": "不同结构的核对方法"
    },
    {
      "depth": 2,
      "text": "5. 量词顺序和组权重不能省略"
    },
    {
      "depth": 3,
      "text": "谁能选择变化？"
    },
    {
      "depth": 3,
      "text": "总分由谁占多少决定？"
    },
    {
      "depth": 2,
      "text": "6. 一份可运行的精确程序"
    },
    {
      "depth": 3,
      "text": "输入契约"
    },
    {
      "depth": 3,
      "text": "为什么拒绝，而不是悄悄修复？"
    },
    {
      "depth": 2,
      "text": "7. 哪些结论不能从分数跳过去？"
    },
    {
      "depth": 3,
      "text": "一句可复查的结论"
    },
    {
      "depth": 2,
      "text": "8. 自测"
    },
    {
      "depth": 2,
      "text": "9. 自测答案"
    },
    {
      "depth": 2,
      "text": "10. 来源与复查范围"
    }
  ],
  "tables": [
    [
      [
        "中心 x",
        "标签",
        "次数"
      ],
      [
        "−2",
        "0",
        "9"
      ],
      [
        "2",
        "1",
        "9"
      ],
      [
        "1",
        "1",
        "2"
      ]
    ],
    [
      [
        "范围",
        "P4正确次数",
        "P4全通过案例"
      ],
      [
        "far",
        "72/72",
        "18/18"
      ],
      [
        "notch-near",
        "6/8",
        "0/2"
      ],
      [
        "全部",
        "78/80",
        "18/20"
      ]
    ],
    [
      [
        "输入或区间",
        "判定"
      ],
      [
        "单点5/4",
        "错误"
      ],
      [
        "单点4/3",
        "正确"
      ],
      [
        "[1,5/4]",
        "非处处正确"
      ],
      [
        "[4/3,3/2]",
        "处处正确"
      ],
      [
        "[5/4,4/3]",
        "非处处正确"
      ]
    ],
    [
      [
        "变化量",
        "案例1正确？",
        "案例2正确？"
      ],
      [
        "−1/4",
        "1",
        "0"
      ],
      [
        "0",
        "1",
        "1"
      ],
      [
        "1/5",
        "0",
        "1"
      ]
    ]
  ],
  "displayMath": [
    "g(x)=\\begin{cases}\n0,&x<0\\\\\n1,&x\\ge0\n\\end{cases}",
    "\\rule{0pt}{3em}f(x)=\\begin{cases}\n0,&x<0\\\\\n0,&5/4\\le x<4/3\\\\\n1,&\\text{其余输入}\n\\end{cases}",
    "|\\delta|\\le\\varepsilon",
    "A_i=[x_i-\\varepsilon,\\ x_i+\\varepsilon]",
    "C_i(\\delta)=\\mathbf1\\{f(x_i+\\delta)=y_i\\}",
    "A_{\\rm clean}=\\frac1N\\sum_i n_i C_i(0)",
    "A_{\\rm avg}=\\frac1N\\sum_i n_i\n\\mathbb E_{\\delta\\sim q_i}[C_i(\\delta)]",
    "t_i=\\min_{\\delta\\in P_i} C_i(\\delta)",
    "A_{\\rm test}=\\frac1N\\sum_i n_i t_i",
    "r_i=\\min_{|\\delta|\\le\\varepsilon} C_i(\\delta)",
    "A_{\\rm all}=\\frac1N\\sum_i n_i r_i",
    "A_{\\rm all}\\le A_{\\rm test}\\le A_{\\rm clean}",
    "P_3=\\{-1/2,\\ 0,\\ 1/2\\}",
    "5/4\\le13/10<4/3",
    "P_4=\\{-1/2,\\ 0,\\ 3/10,\\ 1/2\\}",
    "A_{\\rm avg}=\\frac{18\\times4+2\\times3}{20\\times4}\n=\\frac{39}{40}",
    "E=[5/4,4/3)",
    "b<5/4\\quad\\text{或}\\quad a\\ge4/3",
    "\\frac1N\\sum_i n_i\\min_{\\delta\\in P}C_i(\\delta)",
    "\\min_{\\delta\\in P}\\frac1N\\sum_i n_i C_i(\\delta)",
    "\\tfrac12\\times1+\\tfrac12\\times0=\\tfrac12"
  ],
  "inlineMath": [
    "p",
    "h",
    "f=h\\circ p",
    "D=[-3,3]",
    "5/4",
    "4/3",
    "x_i\\,",
    "\\delta",
    "\\varepsilon",
    "D",
    "g",
    "x=1/4,\\varepsilon=1/2",
    "[-1/4,3/4]",
    "n_i>0",
    "N=\\sum_i n_i\\,",
    "y_i=g(x_i)",
    "N",
    "q_i\\,",
    "k",
    "P",
    "1/k",
    "k",
    "Nk",
    "N",
    "N",
    "P_i\\,",
    "r_i\\le t_i\\le C_i(0)",
    "A_{\\rm test}\\le A_{\\rm avg}\\,",
    "x",
    "\\varepsilon=1/2",
    "[-5/2,-3/2]",
    "[3/2,5/2]",
    "[1/2,3/2]",
    "20/20=1",
    "x=1",
    "1/2,1,3/2",
    "60/60=1",
    "20/20=1",
    "\\delta=3/10",
    "13/10",
    "18/20=9/10",
    "39/40",
    "[a,b]",
    "a,b",
    "0,5/4,4/3",
    "[a,b]",
    "f",
    "a=b",
    "[a,b]",
    "b\\ge5/4",
    "a<4/3",
    "z=\\max(a,5/4)",
    "a\\le b",
    "b\\ge5/4",
    "z\\le b",
    "a<4/3",
    "5/4<4/3",
    "z<4/3",
    "z",
    "[a,b]",
    "E",
    "18/20=9/10",
    "18/18",
    "0/2",
    "x_1=11/10",
    "x_2=3/2",
    "1/4",
    "\\{-1/4,0,1/5\\}",
    "1/2,1,1/2",
    "1/2",
    "P",
    "\\delta",
    "[-1/4,1/4]",
    "[3/20,7/30)",
    "[-1/4,-1/6)",
    "18/20",
    "2/20",
    "9/10",
    "2/20=1/10",
    "62/80=31/40",
    "1/2",
    "\\sum_i n_i\\,",
    "x=13/10,\\varepsilon=0",
    "g(0)=1",
    "x=-1/4",
    "x=1/4"
  ],
  "inlineCode": [
    "cases",
    "group",
    "x",
    "label",
    "count",
    "group",
    "far",
    "notch-near",
    "label",
    "count",
    "toy_predict",
    "clip",
    "Fraction(3, 10)",
    "cases",
    "probe_trials",
    "cases",
    "count",
    "cases",
    "probe_report",
    "exact_interval_report"
  ],
  "sections": [
    {
      "heading": "1. “对变化不敏感”还缺哪些条件？",
      "fields": [
        "变化后的正确性",
        "任务",
        "系统",
        "输入域",
        "变化集合",
        "预算",
        "汇总对象",
        "完整定义已知的字面函数"
      ]
    },
    {
      "heading": "本课的任务与模型",
      "fields": [
        "完整定义已知的字面函数"
      ]
    },
    {
      "heading": "2. 四个分数，四种问题",
      "fields": [
        "列出的有限集合",
        "有限搜索没找到错误，给出的测试最坏准确率是完整集合鲁棒准确率的上界。"
      ]
    },
    {
      "heading": "清洁准确率",
      "fields": []
    },
    {
      "heading": "平均变化准确率",
      "fields": []
    },
    {
      "heading": "测试集合最坏准确率",
      "fields": [
        "列出的有限集合"
      ]
    },
    {
      "heading": "完整允许集合鲁棒准确率",
      "fields": [
        "有限搜索没找到错误，给出的测试最坏准确率是完整集合鲁棒准确率的上界。"
      ]
    },
    {
      "heading": "3. 三个探针怎样漏掉缺口？",
      "fields": [
        "far",
        "notch-near",
        "合法反例"
      ]
    },
    {
      "heading": "4. 何时有限计算能够证明整个区间？",
      "fields": [
        "全部分段边界",
        "精确判定",
        "错误集合"
      ]
    },
    {
      "heading": "分区证明",
      "fields": [
        "精确判定"
      ]
    },
    {
      "heading": "不同结构的核对方法",
      "fields": [
        "错误集合"
      ]
    },
    {
      "heading": "5. 量词顺序和组权重不能省略",
      "fields": []
    },
    {
      "heading": "谁能选择变化？",
      "fields": []
    },
    {
      "heading": "总分由谁占多少决定？",
      "fields": []
    },
    {
      "heading": "6. 一份可运行的精确程序",
      "fields": []
    },
    {
      "heading": "输入契约",
      "fields": []
    },
    {
      "heading": "为什么拒绝，而不是悄悄修复？",
      "fields": []
    },
    {
      "heading": "7. 哪些结论不能从分数跳过去？",
      "fields": [
        "“输出没变，所以鲁棒。”",
        "“搜了很多次，都没找到错误，所以认证通过。”",
        "“半径变大，分数一定按同一规则继续算。”",
        "“平均腐蚀测试很好，现实变化就有保障。”",
        "“20条里18条整段正确，所以总体有90%保证。”"
      ]
    },
    {
      "heading": "一句可复查的结论",
      "fields": []
    },
    {
      "heading": "8. 自测",
      "fields": []
    },
    {
      "heading": "9. 自测答案",
      "fields": []
    },
    {
      "heading": "10. 来源与复查范围",
      "fields": []
    }
  ],
  "anchors": [
    {
      "text": "分类与准确率",
      "href": "?view=garden&scope=branch:llm:rankings/metrics",
      "section": null
    },
    {
      "text": "评价数据集",
      "href": "?view=garden&scope=branch:llm:rankings/datasets",
      "section": null
    },
    {
      "text": "评测协议",
      "href": "?view=garden&scope=branch:llm:rankings/protocol",
      "section": null
    },
    {
      "text": "范数与距离",
      "href": "?view=garden&scope=concept:norm-distance",
      "section": null
    },
    {
      "text": "鲁棒性",
      "href": "?view=garden&scope=concept:robustness",
      "section": null
    },
    {
      "text": "Madry 等 §2、式 (2.1)",
      "href": "https://arxiv.org/pdf/1706.06083v4",
      "section": "1. “对变化不敏感”还缺哪些条件？"
    },
    {
      "text": "Hendrycks 与 Dietterich §3–4.2",
      "href": "https://arxiv.org/pdf/1903.12261v1",
      "section": "平均变化准确率"
    },
    {
      "text": "Python 官方 Fraction 文档",
      "href": "https://docs.python.org/3/library/fractions.html",
      "section": "输入契约"
    },
    {
      "text": "Taori 等 §3.1、§4.2–4.3",
      "href": "https://proceedings.neurips.cc/paper_files/paper/2020/file/d8330f857a17c53d217014ee776bfd50-Paper.pdf",
      "section": "7. 哪些结论不能从分数跳过去？"
    },
    {
      "text": "置信区间与抽样",
      "href": "?view=garden&scope=branch:llm:rankings/methodology",
      "section": "7. 哪些结论不能从分数跳过去？"
    },
    {
      "text": "Madry 等，ICLR 2018；本页读取 arXiv v4，2019-09-04",
      "href": "https://arxiv.org/pdf/1706.06083v4",
      "section": "10. 来源与复查范围"
    },
    {
      "text": "Hendrycks 与 Dietterich，ICLR 2019；arXiv v1，2019-03-28",
      "href": "https://arxiv.org/pdf/1903.12261v1",
      "section": "10. 来源与复查范围"
    },
    {
      "text": "Taori 等，NeurIPS 2020会议论文",
      "href": "https://proceedings.neurips.cc/paper_files/paper/2020/file/d8330f857a17c53d217014ee776bfd50-Paper.pdf",
      "section": "10. 来源与复查范围"
    },
    {
      "text": "Python 官方 fractions 文档",
      "href": "https://docs.python.org/3/library/fractions.html",
      "section": "10. 来源与复查范围"
    }
  ],
  "onward": [
    {
      "scope": "branch:llm:rankings/metrics",
      "articleId": "classification-accuracy-precision-recall-f1",
      "anchorIndex": 0,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:rankings/datasets",
      "articleId": "evaluation-dataset-target-coverage",
      "anchorIndex": 1,
      "mode": "embedded-branch"
    },
    {
      "scope": "branch:llm:rankings/protocol",
      "articleId": "benchmark-protocol-comparable-runs",
      "anchorIndex": 2,
      "mode": "embedded-branch"
    },
    {
      "scope": "concept:norm-distance",
      "articleId": "llm-tensor-shapes",
      "anchorIndex": 3,
      "mode": "canonical-folder"
    },
    {
      "scope": "concept:robustness",
      "articleId": "robustness-perturbation-scope",
      "anchorIndex": 4,
      "mode": "canonical-folder"
    },
    {
      "scope": "branch:llm:rankings/methodology",
      "articleId": "statistical-inference-confidence-interval",
      "anchorIndex": 9,
      "mode": "embedded-branch"
    }
  ]
} satisfies TrustMetricsLesson;

registerTrustMetricsTests(lesson);
