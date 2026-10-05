import { registerOptimizationTests } from './optimization-reader';

registerOptimizationTests({
  "id": "adamw-moments-decoupled-decay",
  "name": "AdamW foundation",
  "title": "AdamW 怎样更新参数？矩估计、偏差修正与解耦衰减",
  "concept": "concept:adamw",
  "parent": "topic:optimization",
  "path": "training/adamw",
  "sources": [
    "https://arxiv.org/pdf/1412.6980v9",
    "https://arxiv.org/pdf/1711.05101v3",
    "https://docs.pytorch.org/docs/2.14/generated/torch.optim.AdamW.html",
    "https://docs.pytorch.org/docs/2.14/generated/torch.optim.Adam.html",
    "https://arxiv.org/pdf/1904.09237v1"
  ],
  "leaf": "adamw",
  "parentPath": "training",
  "headings": [
    "1. 参数之外，优化器还记住了什么？",
    "2. 偏差修正：补上零初态缺掉的权重",
    "3. 分母决定各坐标怎样缩放",
    "4. L2 项走哪条路，是关键区别",
    "4.2 论文的 lambda，不能原样抄进库参数",
    "5. 两步手算：把状态与参数分开记",
    "6. 三个边界，比一句“衰减到零”更可靠",
    "7. 可运行实验：只做有界的机制实验室",
    "8. 从机制读到应用，哪些结论仍不能跳过？",
    "来源、版本与核验范围"
  ],
  "claims": [
    "不是中心化方差",
    "固定正基础步长",
    "不是完整训练实验",
    "decoupled_weight_decay=False",
    "有限数值测试不是专家认证",
    "未运行框架"
  ],
  "formulas": [
    "v_t=\\beta_2v_{t-1}+(1-\\beta_2)h_t^2",
    "\\widehat m_t=\\frac{m_t}{1-\\beta_1^t}",
    "w_t=(1-\\eta_t\\lambda_{\\mathrm{wd}})w_{t-1}-\\eta_ta_t",
    "\\lambda_{\\mathrm{paper}}=\\alpha\\lambda_{\\mathrm{wd}}"
  ],
  "tableRows": [
    2,
    2,
    2,
    6
  ],
  "onward": [
    [
      "branch:llm:training/loop",
      "llm-training-loop"
    ],
    [
      "branch:llm:math/derivatives",
      "llm-derivatives"
    ],
    [
      "concept:floating-point",
      "floating-point-rounding"
    ],
    [
      "concept:regularization",
      "regularization-penalty-generalization"
    ],
    [
      "concept:train-validation-test",
      "train-validation-test-data-leakage"
    ]
  ],
  "backlinks": [
    "llm-training-loop"
  ],
  "tableValues": [
    {
      "index": 0,
      "rows": [
        [
          "1",
          "(1,-2)",
          "(2,8)"
        ],
        [
          "2",
          "(-1/2,1)",
          "(3,12)"
        ]
      ]
    },
    {
      "index": 1,
      "rows": [
        [
          "1",
          "(2,-4)",
          "(4,16)"
        ],
        [
          "2",
          "(-2/3,4/3)",
          "(4,16)"
        ]
      ]
    },
    {
      "index": 2,
      "rows": [
        [
          "1",
          "(142/75,-9/10)",
          "(1.893333,-0.900000)"
        ],
        [
          "2",
          "(10562/5625,-1363/1500)",
          "(1.877689,-0.908667)"
        ]
      ]
    }
  ]
});
