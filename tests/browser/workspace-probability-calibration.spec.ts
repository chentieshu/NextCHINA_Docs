import { registerConstraintCalibrationTests } from './constraint-calibration-reader';

registerConstraintCalibrationTests({
  "article": {
    "id": "probability-calibration-brier-bins",
    "file": "content/models/evaluation/probability-calibration-brier-bins.md",
    "space": "models",
    "category": "evaluation-statistics",
    "categoryName": "评测与统计基础",
    "title": "模型给出 90%，应该怎样检查？概率校准、Brier 与分箱盲点",
    "subtitle": "从同分数频率、严格适当评分到精确分解与校准评估隔离",
    "date": "2026-10-05",
    "tags": [
      "概率校准",
      "Brier",
      "ECE",
      "评测",
      "分箱",
      "精确计算"
    ],
    "excerpt": "用八条固定记录区分准确率、校准与分辨能力，推导 Brier 严格适当性和同分数分解，检查分箱抵消及校准映射的数据边界。",
    "knowledgeUnit": {
      "kind": "independent-explanation",
      "reviewStatus": "needs-independent-review",
      "exampleId": "probability-calibration-brier-bins",
      "conceptIds": [
        "concept:calibration"
      ],
      "placements": [
        {
          "hubId": "hub:llm",
          "path": "rankings/calibration"
        }
      ],
      "sourceUrls": [
        "https://proceedings.mlr.press/v70/guo17a/guo17a.pdf",
        "https://proceedings.mlr.press/v89/vaicenavicius19a/vaicenavicius19a.pdf",
        "https://www.eecs.harvard.edu/cs286r/courses/fall10/papers/Gneiting07.pdf",
        "https://scikit-learn.org/stable/modules/calibration.html",
        "https://scikit-learn.org/1.9/modules/generated/sklearn.metrics.brier_score_loss.html"
      ],
      "relatedResourceIds": []
    }
  },
  "name": "probability calibration foundation",
  "parent": "topic:trust-metrics",
  "parentPath": "rankings",
  "siblings": [
    "capabilities",
    "metrics",
    "calibration",
    "methodology",
    "text-preference",
    "composite",
    "specialized",
    "efficiency",
    "system-results"
  ],
  "articleSha256": "52f666dd297a68ffce67087c1496fc8eab8895720b80bcbb0d9ab58a2d9e8cb8",
  "codeSha256": "d0dcfcff1eac48ca60b60a535b6a84d2a25f6ccec1e2bc6a772740d153a3f1ea",
  "suffixSha256": "746174305af21809b20ec1d043e95e31311c9643df6d238608971bfc9dceefff",
  "headings": [
    "1. 先给“90%”一个明确的事件",
    "2. 同样的分类决定，不同的概率",
    "3. Brier：怎样给整个概率预测打分？",
    "为什么诚实报概率能最小化期望损失？",
    "八条记录的直接计算",
    "4. 精确分解：必须按相同的分数分组",
    "5. ECE：分箱看到了什么，又漏掉什么？",
    "同叫 ECE，事件可能不同",
    "6. 校准映射：拟合、应用、评估是三步",
    "7. 可运行实验：精确分数，不把浮点近似当证据",
    "8. 自测：先说清统计对象，再计算",
    "9. 真正报告时，还要补哪些证据？",
    "来源与核验范围"
  ],
  "claims": [
    "这些记录上的同分数分组恰好匹配",
    "Brier 不是只测校准的尺子",
    "总体校准描述条件概率",
    "不表示 Python 字典本身不可变",
    "没有创造新的独立证据",
    "更不能单凭此推断公平性或个体正确性",
    "相关原文段落经检索索引核对"
  ],
  "displays": [
    "P(Y=1\\mid Q=q)=q\n",
    "\\mathbb E[Y\\mid Q]=Q\\quad\\text{几乎处处}\n",
    "\\begin{aligned}\n\\ell(q,y)&=(q-y)^2\\\\\n\\operatorname{BS}&=\\frac1n\\sum_{i=1}^n(q_i-y_i)^2\n\\end{aligned}\n",
    "\\begin{aligned}\n\\mathbb E[(q-Y)^2]\n&=p(q-1)^2+(1-p)q^2\\\\\n&=q^2-2pq+p\\\\\n&=(q-p)^2+p(1-p)\n\\end{aligned}\n",
    "\\begin{aligned}\n&[(1-q)-(1-y)]^2+(q-y)^2\\\\\n&\\qquad=2(q-y)^2\n\\end{aligned}\n",
    "\\operatorname{BS}_{\\text{25\\%/75\\%}}\n=\\frac{6(1/16)+2(9/16)}8=\\frac3{16}\n",
    "\\operatorname{BS}_{\\text{10\\%/90\\%}}\n=\\frac{6(1/100)+2(81/100)}8=\\frac{21}{100}\n",
    "\\frac1{n_g}\\sum_{i\\in g}(q_g-y_i)^2\n=(q_g-r_g)^2+r_g(1-r_g)\n",
    "\\begin{aligned}\n\\sum_gw_gr_g(1-r_g)\n&=r-\\sum_gw_gr_g^2\\\\\n&=r(1-r)-\\sum_gw_g(r_g-r)^2\n\\end{aligned}\n",
    "\\begin{aligned}\n\\operatorname{REL}&=\\sum_gw_g(q_g-r_g)^2\\\\\n\\operatorname{RES}&=\\sum_gw_g(r_g-r)^2\\\\\n\\operatorname{UNC}&=r(1-r)\n\\end{aligned}\n",
    "\\operatorname{BS}=\\operatorname{REL}-\\operatorname{RES}+\\operatorname{UNC}\n",
    "\\frac9{400}-\\frac1{16}+\\frac14=\\frac{21}{100}\n",
    "\\operatorname{ECE}\n=\\sum_{b:n_b>0}\\frac{n_b}{n}\n\\left|\\bar q_b-\\bar y_b\\right|\n",
    "\\operatorname{ECE}_{\\text{两箱}}\n=\\frac48\\frac3{20}+\\frac48\\frac3{20}\n=\\frac3{20}\n",
    "\\begin{aligned}\nm(1/10)&=1/4\\\\\nm(9/10)&=3/4\n\\end{aligned}\n"
  ],
  "tables": [
    {
      "header": [
        "记录",
        "标签 y",
        "常数",
        "25%/75% 概率",
        "10%/90% 概率"
      ],
      "rows": [
        [
          "L1",
          "0",
          "1/2",
          "1/4",
          "1/10"
        ],
        [
          "L2",
          "0",
          "1/2",
          "1/4",
          "1/10"
        ],
        [
          "L3",
          "0",
          "1/2",
          "1/4",
          "1/10"
        ],
        [
          "L4",
          "1",
          "1/2",
          "1/4",
          "1/10"
        ],
        [
          "H1",
          "0",
          "1/2",
          "3/4",
          "9/10"
        ],
        [
          "H2",
          "1",
          "1/2",
          "3/4",
          "9/10"
        ],
        [
          "H3",
          "1",
          "1/2",
          "3/4",
          "9/10"
        ],
        [
          "H4",
          "1",
          "1/2",
          "3/4",
          "9/10"
        ]
      ]
    },
    {
      "header": [
        "预测器",
        "L / H 的决定",
        "准确率"
      ],
      "rows": [
        [
          "常数",
          "1 / 1",
          "1/2"
        ],
        [
          "25%/75%",
          "0 / 1",
          "3/4"
        ],
        [
          "10%/90%",
          "0 / 1",
          "3/4"
        ]
      ]
    },
    {
      "header": [
        "预测器",
        "Brier",
        "本表准确率"
      ],
      "rows": [
        [
          "常数",
          "1/4",
          "1/2"
        ],
        [
          "25%/75%",
          "3/16",
          "3/4"
        ],
        [
          "10%/90%",
          "21/100",
          "3/4"
        ]
      ]
    },
    {
      "header": [
        "预测器",
        "REL",
        "RES",
        "UNC"
      ],
      "rows": [
        [
          "常数",
          "0",
          "0",
          "1/4"
        ],
        [
          "25%/75%",
          "0",
          "1/16",
          "1/4"
        ],
        [
          "10%/90%",
          "9/400",
          "1/16",
          "1/4"
        ]
      ]
    },
    {
      "header": [
        "箱",
        "数量",
        "平均预测",
        "观察正例率"
      ],
      "rows": [
        [
          "[0,1/2)",
          "4",
          "1/10",
          "1/4"
        ],
        [
          "[1/2,1]",
          "4",
          "9/10",
          "3/4"
        ]
      ]
    },
    {
      "header": [
        "箱",
        "数量",
        "平均预测",
        "观察正例率"
      ],
      "rows": [
        [
          "[0,1]",
          "8",
          "1/2",
          "1/2"
        ]
      ]
    },
    {
      "header": [
        "预测器",
        "一箱 ECE",
        "两箱 ECE"
      ],
      "rows": [
        [
          "常数",
          "0",
          "0"
        ],
        [
          "25%/75%",
          "0",
          "0"
        ],
        [
          "10%/90%",
          "0",
          "3/20"
        ]
      ]
    },
    {
      "header": [
        "评估记录",
        "标签 y",
        "原概率",
        "映射后"
      ],
      "rows": [
        [
          "E1",
          "0",
          "1/10",
          "1/4"
        ],
        [
          "E2",
          "0",
          "1/10",
          "1/4"
        ],
        [
          "E3",
          "1",
          "1/10",
          "1/4"
        ],
        [
          "E4",
          "1",
          "1/10",
          "1/4"
        ],
        [
          "E5",
          "0",
          "9/10",
          "3/4"
        ],
        [
          "E6",
          "1",
          "9/10",
          "3/4"
        ],
        [
          "E7",
          "1",
          "9/10",
          "3/4"
        ],
        [
          "E8",
          "1",
          "9/10",
          "3/4"
        ]
      ]
    },
    {
      "header": [
        "预测",
        "准确率",
        "Brier",
        "两箱 ECE"
      ],
      "rows": [
        [
          "原概率",
          "5/8",
          "31/100",
          "11/40"
        ],
        [
          "映射后",
          "5/8",
          "1/4",
          "1/8"
        ]
      ]
    }
  ],
  "onward": [
    [
      "branch:llm:math/probability",
      "llm-conditional-probability"
    ],
    [
      "branch:llm:rankings/metrics",
      "classification-accuracy-precision-recall-f1"
    ],
    [
      "branch:llm:rankings/methodology",
      "statistical-inference-confidence-interval"
    ],
    [
      "branch:llm:training/samples",
      "train-validation-test-data-leakage"
    ],
    [
      "branch:llm:math/softmax",
      "llm-softmax-temperature"
    ]
  ],
  "backlinks": [
    "classification-accuracy-precision-recall-f1"
  ],
  "inlineMath": [
    "Y=1",
    "Y=0",
    "Q\\in[0,1]",
    "Q=0.9",
    "Q=q",
    "1/2",
    "y",
    "q\\ge1/2",
    "1/4",
    "3/4",
    "3/20",
    "1/2",
    "1/2",
    "0\\le q\\le1",
    "y\\in\\{0,1\\}",
    "[0,1]",
    "9/10",
    "y=0",
    "81/100",
    "y=1",
    "1/100",
    "p",
    "Y\\sim\\operatorname{Bernoulli}(p)",
    "q\\in[0,1]",
    "q",
    "q=p",
    "q=p",
    "p=0",
    "p=1",
    "(1-q,q)",
    "(1-y,y)",
    "-2",
    "[0,1]",
    "[0,2]",
    "1/16",
    "9/16",
    "1/100",
    "81/100",
    "g",
    "q_g",
    "n_g",
    "w_g=n_g/n",
    "r_g",
    "r",
    "q_g-y_i",
    "(q_g-r_g)+(r_g-y_i)",
    "\\sum_{i\\in g}(r_g-y_i)=0",
    "r_g(1-r_g)",
    "\\sum_g w_g r_g=r",
    "\\sum_g w_g=1",
    "r(1-r)",
    "r",
    "1/2",
    "(3/20)^2=9/400",
    "(1/4)^2=1/16",
    "1/2",
    "1/2",
    "0-0+1/4",
    "21/100",
    "r_g=y_i",
    "b",
    "\\bar q_b",
    "\\bar y_b",
    "n_b",
    "[0,1/2)",
    "[1/2,1]",
    "q=0",
    "q=1/2",
    "q=1",
    "[0,1/2)",
    "[1/2,1]",
    "[0,1]",
    "[0,1]",
    "1/2",
    "c=\\max(q,1-q)",
    "z=\\mathbf1(\\hat y=y)",
    "q,y",
    "9/10",
    "3/4",
    "3/20",
    "m(q)",
    "p",
    "1/2",
    "y",
    "1/4",
    "\\tfrac12(1/4-1/2)^2=1/32",
    "1/10",
    "9/10",
    "9/100",
    "9/80",
    "9/400",
    "[0,1]",
    "1/2",
    "3/20",
    "9/400",
    "1/16",
    "1/25",
    "1/4-1/25=21/100",
    "1/4",
    "1/4",
    "21/100",
    "1/4",
    "1/2",
    "1/4",
    "4(1/4)(3/4)^3=27/64",
    "(q,y)=(1/2,1)",
    "1/2",
    "1/4",
    "1/10\\mapsto1/4",
    "9/10\\mapsto3/4",
    "9/10",
    "3/4",
    "3/20",
    "q=1/2",
    "y=1/2",
    "1/2",
    "1/2",
    "1/2"
  ],
  "localProse": [
    {
      "anchor": "这是对未知真实概率下的",
      "fragments": [
        "期望",
        "经验损失最小的概率就是真实概率"
      ]
    },
    {
      "anchor": "第二步，冻结并应用",
      "fragments": [
        "不接收新记录标签",
        "不擅自插值"
      ],
      "code": [
        "apply_map(frozen_map, heldout_scores)"
      ]
    },
    {
      "anchor": "改善没有保证",
      "fragments": [
        "反而为",
        "不是另一项真实实验"
      ]
    },
    {
      "anchor": "答案：第一箱为",
      "fragments": [
        "第一箱为"
      ],
      "code": [
        "(0, None, None)"
      ]
    },
    {
      "anchor": "第二箱为",
      "fragments": [
        "空箱没有观察正例率",
        "分类正确也不意味着概率损失为零"
      ],
      "code": [
        "(1, 1/2, 1)"
      ]
    },
    {
      "anchor": "答案：不该",
      "fragments": [
        "应用输出完全不变",
        "需要另留评估证据"
      ]
    },
    {
      "anchor": "这些上限是方便完整检查的课堂边界",
      "fragments": [
        "程序不会修改输入",
        "不支持样本权重、缺失标签、多类别或连续分数的外推"
      ]
    }
  ]
});
