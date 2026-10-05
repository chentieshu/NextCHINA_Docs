import { registerOptimizationTests } from './optimization-reader';

registerOptimizationTests({
  "id": "regularization-penalty-generalization",
  "name": "regularization foundation",
  "title": "正则化改变了什么？从 L2 惩罚到泛化的取舍",
  "concept": "concept:regularization",
  "parent": "topic:optimization",
  "path": "training/budget/regularization",
  "sources": [
    "https://proceedings.neurips.cc/paper/1991/file/8eefcfdf5990e441f0fb6f3fad709e21-Paper.pdf",
    "https://d2l.ai/chapter_linear-regression/weight-decay.html",
    "https://scikit-learn.org/1.9/modules/generated/sklearn.linear_model.Ridge.html"
  ],
  "leaf": "regularization",
  "parentPath": "training/budget",
  "headings": [
    "1. 要分开的不只是训练集和测试集",
    "2. 从一个斜率推导 L2 最优解",
    "3. 训练损失上升，究竟换来了什么？",
    "4. 把四种噪声情况算全，而不是挑中一次幸运结果",
    "5. “小权重”要连同坐标与损失刻度一起说",
    "6. L2 惩罚与权重衰减，什么时候才是一回事？",
    "7. 可运行实验：精确分数，而不是一次随机模拟",
    "8. 怎样选超参数，以及本页没有替你完成的事",
    "9. 常见误解与练习",
    "来源与阅读路径"
  ],
  "claims": [
    "没有截距",
    "不是与单位、特征表示无关的",
    "没有证明泛化好",
    "受惩罚参数的选择",
    "不是执行结果",
    "本页尚未完整讲授过拟合与欠拟合"
  ],
  "formulas": [
    "J_\\lambda(w)-J_\\lambda(\\widehat w_\\lambda)",
    "\\frac{4\\lambda^2+2}{2(1+\\lambda)^2}",
    "\\lambda_{\\mathrm{sum}}=n\\lambda"
  ],
  "tableRows": [
    5,
    3,
    4,
    4
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
      "branch:llm:math/probability",
      "llm-conditional-probability"
    ],
    [
      "branch:llm:math/tensor-shapes",
      "llm-tensor-shapes"
    ],
    [
      "concept:train-validation-test",
      "train-validation-test-data-leakage"
    ],
    [
      "concept:floating-point",
      "floating-point-rounding"
    ],
    [
      "branch:llm:training/adamw",
      "adamw-moments-decoupled-decay"
    ]
  ],
  "backlinks": [
    "llm-training-loop",
    "train-validation-test-data-leakage"
  ],
  "directoryLinks": [
    "branch:llm:training/budget"
  ],
  "tableValues": [
    {
      "index": 1,
      "rows": [
        [
          "0",
          "4",
          "0",
          "0",
          "0",
          "2"
        ],
        [
          "1",
          "2",
          "2",
          "2",
          "4",
          "0"
        ],
        [
          "3",
          "1",
          "9/2",
          "3/2",
          "6",
          "1/2"
        ]
      ]
    },
    {
      "index": 3,
      "rows": [
        [
          "0",
          "1",
          "3"
        ],
        [
          "1/2",
          "2/3",
          "8/3"
        ],
        [
          "1",
          "3/4",
          "11/4"
        ],
        [
          "3",
          "19/16",
          "51/16"
        ]
      ]
    }
  ]
});
