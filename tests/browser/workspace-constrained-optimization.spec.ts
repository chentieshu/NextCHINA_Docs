import { registerConstraintCalibrationTests } from './constraint-calibration-reader';

registerConstraintCalibrationTests({
  "article": {
    "id": "constrained-optimization-projection-kkt",
    "file": "content/models/foundations/constrained-optimization-projection-kkt.md",
    "space": "models",
    "category": "foundations",
    "categoryName": "AI 基础原理",
    "title": "约束优化：在可行范围内，怎样证明已经最优？",
    "subtitle": "二维精确投影、KKT 证书、活跃边界与有限惩罚反例",
    "date": "2026-10-05",
    "tags": [
      "约束优化",
      "可行域",
      "欧氏投影",
      "KKT",
      "精确计算"
    ],
    "excerpt": "从预算三角形推导唯一最近点，逐项验证 KKT 证书并直接证明最优性，区分活跃约束、乘子、投影更新和有限平方惩罚。",
    "knowledgeUnit": {
      "kind": "independent-explanation",
      "reviewStatus": "needs-independent-review",
      "exampleId": "constrained-optimization-projection-kkt",
      "conceptIds": [
        "concept:constrained-optimization"
      ],
      "placements": [
        {
          "hubId": "hub:llm",
          "path": "math/constrained-optimization"
        }
      ],
      "sourceUrls": [
        "https://www.seas.ucla.edu/~vandenbe/cvxbook/bv_cvxbook.pdf",
        "https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf",
        "https://ocw.mit.edu/courses/6-7220j-nonlinear-optimization-spring-2025/mit6_7220_s25_lec14.pdf"
      ],
      "relatedResourceIds": []
    }
  },
  "name": "constrained optimization foundation",
  "parent": "topic:optimization",
  "parentPath": "math",
  "siblings": [
    "tokenization",
    "representations",
    "tensor-shapes",
    "floating-point",
    "probability",
    "softmax",
    "objectives",
    "mutual-information",
    "compression",
    "derivatives",
    "complexity",
    "eigen-svd",
    "constrained-optimization"
  ],
  "articleSha256": "c35fb882466863e9ecbf03f966b02f37e284da1a790399f81110f270e43df0d4",
  "codeSha256": "f5b5340b41a04a9d30c02d91afa9c3bd7152e454a40cc8ea183d7033361cd1f9",
  "suffixSha256": "458e8fb721d597a0568ad85047d777491a6a6cacc094f024937edd5e4b4da580",
  "headings": [
    "1. 先规定哪些答案允许出现",
    "2. 为什么最优点的梯度不一定为零？",
    "3. KKT 证书：符号、平衡与互补",
    "4. 一条恒等式，证明所有其他可行点都不更好",
    "5. 从边界分类推导精确投影",
    "同一目标，六种预算",
    "6. 投影更新：一步解出只是本目标的特殊性",
    "7. 把超预算加进惩罚，为什么仍会越界？",
    "8. 可运行实验：精确算术与独立检查",
    "9. 常见误解与练习",
    "来源与阅读路径"
  ],
  "claims": [
    "原始最优点唯一",
    "精化 Slater 条件",
    "被平衡到零的是拉格朗日梯度",
    "不是所有惩罚都无法精确实现约束",
    "作者自测也不是独立专家审稿",
    "有限检查用于发现实现错误"
  ],
  "displays": [
    "\\begin{aligned}\nf(x,y)&=\\frac12\\bigl[(x-a)^2+(y-b)^2\\bigr]\\\\\nC_B&=\\{(x,y):x\\ge0,\\ y\\ge0,\\ x+y\\le B\\}\n\\end{aligned}\n",
    "\\begin{aligned}\nf(x,3-x)&=\\frac12\\bigl[(x-3)^2+(1-x)^2\\bigr]\\\\\n\\frac{d}{dx}f(x,3-x)&=2x-4\n\\end{aligned}\n",
    "\\nabla f(2,1)=(-1,-1)\\ne(0,0)\n",
    "\\begin{aligned}\ng_1(x,y)&=x+y-B\\le0\\\\\ng_2(x,y)&=-x\\le0\\\\\ng_3(x,y)&=-y\\le0\n\\end{aligned}\n",
    "\\begin{aligned}\nL&=f(x,y)+\\lambda(x+y-B)\\\\\n&\\quad-\\alpha x-\\beta y\n\\end{aligned}\n",
    "\\begin{aligned}\nx-a+\\lambda-\\alpha&=0\\\\\ny-b+\\lambda-\\beta&=0\\\\\n\\lambda(x+y-B)&=0\\\\\n\\alpha x=\\beta y&=0\n\\end{aligned}\n",
    "\\begin{aligned}\nf(z)-f(w)\n&=\\frac12\\|z-w\\|_2^2\\\\\n&\\quad+(w-t)\\mathbin{\\cdot}(z-w)\n\\end{aligned}\n",
    "\\begin{aligned}\nf(z)-f(w)\n&=\\frac12\\|z-w\\|_2^2\\\\\n&\\quad+\\lambda(B-z_x-z_y)\\\\\n&\\quad+\\alpha z_x+\\beta z_y\\ \\ge0\n\\end{aligned}\n",
    "f(z)-1=\\frac12\\|z-(2,1)\\|_2^2+(3-z_x-z_y)\n",
    "u=\\bigl(\\max(a,0),\\max(b,0)\\bigr)\n",
    "\\begin{aligned}\n\\frac{d}{dx}f(x,B-x)&=2x-a+b-B\\\\\nx^*&=\\operatorname{clip}\\!\\left(\\frac{a-b+B}{2},0,B\\right)\\\\\ny^*&=B-x^*\n\\end{aligned}\n",
    "\\begin{aligned}\n&\\max(a-s,0)+\\max(b-s,0)\\\\\n&\\quad=\\max(0,a-s,b-s,a+b-2s)\n\\end{aligned}\n",
    "\\begin{aligned}\n\\lambda&=\\max\\bigl(0,(a+b-B)/2,\\\\\n&\\qquad a-B,b-B\\bigr)\\\\\nx^*&=\\max(a-\\lambda,0)\\\\\ny^*&=\\max(b-\\lambda,0)\\\\\n\\alpha&=\\max(\\lambda-a,0)\\\\\n\\beta&=\\max(\\lambda-b,0)\n\\end{aligned}\n",
    "w_{\\mathrm{next}}=\\Pi_{C_B}\\bigl(w-\\eta\\nabla f(w)\\bigr)\n",
    "\\begin{aligned}\nw-\\nabla f(w)&=w-(w-t)=t\\\\\nw_{\\mathrm{next}}&=\\Pi_{C_B}(t)=w^*\n\\end{aligned}\n",
    "\\begin{aligned}\nJ_\\rho(x,y)&=f(x,y)\\\\\n&\\quad+\\frac\\rho2\\bigl[\\max(0,x+y-3)\\bigr]^2,\\\\\n\\rho&\\ge0\n\\end{aligned}\n",
    "\\begin{aligned}\nx-3+\\rho v&=0\\\\\ny-2+\\rho v&=0\\\\\nv&=2-2\\rho v\n\\end{aligned}\n",
    "\\begin{aligned}\nv&=\\frac{2}{1+2\\rho}\\\\\nx_\\rho&=3-\\frac{2\\rho}{1+2\\rho}\\\\\ny_\\rho&=2-\\frac{2\\rho}{1+2\\rho}\n\\end{aligned}\n"
  ],
  "tables": [
    {
      "header": [
        "点",
        "是否可行",
        "f(x,y)",
        "判断"
      ],
      "rows": [
        [
          "(3,2)",
          "否，总量为 5",
          "0",
          "无约束最优，不能采用"
        ],
        [
          "(0,0)",
          "是",
          "13/2",
          "合规不等于最优"
        ],
        [
          "(2,1)",
          "是",
          "1",
          "后文证明它最优"
        ],
        [
          "(9/5,6/5)",
          "是",
          "26/25",
          "等比例缩放，稍差"
        ]
      ]
    },
    {
      "header": [
        "B",
        "最优点",
        "最优值",
        "(\\lambda,\\alpha,\\beta)"
      ],
      "rows": [
        [
          "6",
          "(3,2)",
          "0",
          "(0,0,0)"
        ],
        [
          "5",
          "(3,2)",
          "0",
          "(0,0,0)"
        ],
        [
          "3",
          "(2,1)",
          "1",
          "(1,0,0)"
        ],
        [
          "1",
          "(1,0)",
          "4",
          "(2,0,0)"
        ],
        [
          "1/2",
          "(1/2,0)",
          "41/8",
          "(5/2,0,1/2)"
        ],
        [
          "0",
          "(0,0)",
          "13/2",
          "(3,0,1)"
        ]
      ]
    },
    {
      "header": [
        "\\rho",
        "x_\\rho",
        "y_\\rho",
        "超预算量 v"
      ],
      "rows": [
        [
          "0",
          "3",
          "2",
          "2"
        ],
        [
          "1/2",
          "5/2",
          "3/2",
          "1"
        ],
        [
          "1",
          "7/3",
          "4/3",
          "2/3"
        ],
        [
          "2",
          "11/5",
          "6/5",
          "2/5"
        ],
        [
          "100",
          "403/201",
          "202/201",
          "2/201"
        ]
      ]
    }
  ],
  "onward": [
    [
      "branch:llm:math/tensor-shapes",
      "llm-tensor-shapes"
    ],
    [
      "branch:llm:math/derivatives",
      "llm-derivatives"
    ],
    [
      "branch:llm:training/loop",
      "llm-training-loop"
    ],
    [
      "branch:llm:training/budget/regularization",
      "regularization-penalty-generalization"
    ]
  ],
  "backlinks": [
    "regularization-penalty-generalization"
  ],
  "inlineMath": [
    "(3,2)",
    "x,y",
    "B",
    "(a,b)",
    "C_B",
    "f",
    "x,y",
    "a,b,B",
    "1/2",
    "g_i(w)\\le0",
    "h_j(w)=0",
    "(a,b)=(3,2)",
    "B=3",
    "f(x,y)",
    "(3,2)",
    "0",
    "(0,0)",
    "13/2",
    "(2,1)",
    "1",
    "(9/5,6/5)",
    "26/25",
    "(3,2)",
    "3/5",
    "B>0",
    "(0,0),(B,0),(0,B)",
    "B=0",
    "B<0",
    "B\\ge0",
    "f",
    "x+y=3",
    "y=3-x",
    "0\\le x\\le3",
    "x=2,y=1",
    "\\nabla f(x,y)=(x-a,y-b)",
    "(1,1)",
    "(1,-1)",
    "\\lambda,\\alpha,\\beta",
    "+\\nu h(x,y)",
    "\\nu",
    "x\\ge0,\\ y\\ge0,\\ x+y\\le B",
    "\\lambda,\\alpha,\\beta\\ge0",
    "(a,b)=(3,2),B=3",
    "(2,1)",
    "(\\lambda,\\alpha,\\beta)=(1,0,0)",
    "2-3+1=0",
    "1-2+1=0",
    "1\\times(2+1-3)=0",
    "(1,1)",
    "\\lambda=1",
    "(-1,-1)",
    "t=(a,b)",
    "w",
    "(\\lambda,\\alpha,\\beta)",
    "z=(z_x,z_y)",
    "w-t=-\\lambda(1,1)+(\\alpha,\\beta)",
    "\\lambda(w_x+w_y)=\\lambda B",
    "\\alpha w_x=\\beta w_y=0",
    "z",
    "z\\ne w",
    "f(z)>f(w)",
    "w=(2,1)",
    "z=(1,1)",
    "5/2-1=3/2",
    "1/2+1=3/2",
    "\\Pi_{C_B}(a,b)",
    "u_x+u_y\\le B",
    "C_B",
    "B",
    "x+y=B",
    "u",
    "y=B-x",
    "\\operatorname{clip}(s,0,B)=\\min(B,\\max(0,s))",
    "\\alpha=\\beta=0",
    "x=a-\\lambda,y=b-\\lambda",
    "\\lambda=(a+b-B)/2",
    "(B,0)",
    "B>0",
    "\\alpha=0",
    "\\lambda=a-B",
    "\\beta=\\lambda-b\\ge0",
    "(0,B)",
    "B>0",
    "\\lambda=b-B",
    "\\alpha=\\lambda-a\\ge0",
    "\\lambda=0",
    "B=0",
    "\\lambda=\\max(0,a,b)",
    "s\\ge0",
    "B\\ge0",
    "B",
    "s\\ge a-B",
    "s\\ge b-B",
    "s\\ge(a+b-B)/2",
    "s\\ge0",
    "\\lambda",
    "B",
    "(a,b)=(3,2)",
    "x",
    "y",
    "B",
    "(\\lambda,\\alpha,\\beta)",
    "6",
    "(3,2)",
    "0",
    "(0,0,0)",
    "5",
    "(3,2)",
    "0",
    "(0,0,0)",
    "3",
    "(2,1)",
    "1",
    "(1,0,0)",
    "1",
    "(1,0)",
    "4",
    "(2,0,0)",
    "1/2",
    "(1/2,0)",
    "41/8",
    "(5/2,0,1/2)",
    "0",
    "(0,0)",
    "13/2",
    "(3,0,1)",
    "B=6",
    "B=5",
    "B=1",
    "y",
    "\\beta=0",
    "B=0",
    "\\lambda\\ge3",
    "\\alpha=\\lambda-3,\\beta=\\lambda-2",
    "\\lambda=3",
    "x>0,y>0,x+y<0",
    "w-\\eta\\nabla f(w)",
    "\\nabla f(w)=w-t",
    "\\eta=1",
    "t",
    "w-t",
    "(3,2)",
    "x,y\\ge0",
    "v=x+y-3>0",
    "\\rho\\ge0",
    "v>0",
    "s\\mapsto\\max(0,s)^2",
    "s\\le0",
    "s>0",
    "2s",
    "J_\\rho",
    "\\rho",
    "x_\\rho",
    "y_\\rho",
    "v",
    "0",
    "3",
    "2",
    "2",
    "1/2",
    "5/2",
    "3/2",
    "1",
    "1",
    "7/3",
    "4/3",
    "2/3",
    "2",
    "11/5",
    "6/5",
    "2/5",
    "100",
    "403/201",
    "202/201",
    "2/201",
    "(2,1)",
    "\\lambda=1",
    "\\rho=1",
    "2/3",
    "C_B",
    "(\\lambda,\\alpha,\\beta)",
    "(3,2)",
    "26/25",
    "\\eta=1",
    "x=0",
    "b",
    "[0,B]",
    "y=0",
    "a",
    "\\nabla f=0",
    "a,b\\in\\{-3,-5/2,\\ldots,3\\}",
    "B\\in\\{0,1/2,\\ldots,6\\}",
    "B=5",
    "B=1",
    "y",
    "B=0",
    "\\rho",
    "(-1,4)",
    "(0,4)",
    "x<0",
    "(0,2)",
    "(\\lambda,\\alpha,\\beta)=(2,3,0)",
    "0-(-1)+2-3=0",
    "2-4+2=0",
    "(1+4)/2=5/2",
    "z=(0,3)",
    "f(0,3)=5",
    "[(-2)^2+2^2]/2=4",
    "(3,2)",
    "B=0",
    "\\alpha=1,\\beta=2",
    "-3+4-1=0",
    "-2+4-2=0",
    "(0,0)",
    "1/100",
    "\\rho",
    "2/(1+2\\rho)\\le1/100",
    "\\rho\\ge199/2",
    "1/100",
    "\\rho",
    "\\widetilde f(w)=\\|w-t\\|_2^2",
    "\\eta=1",
    "t",
    "2(w-t)",
    "2t-w",
    "\\eta=1/2"
  ],
  "localProse": [
    {
      "anchor": "坐标对必须是长度恰为 2",
      "fragments": [
        "自定义子类都不接受",
        "输入也不会被改写"
      ],
      "code": [
        "tuple",
        "list",
        "int",
        "Fraction",
        "TypeError",
        "ValueError"
      ]
    },
    {
      "anchor": "答案：非负截断",
      "fragments": [
        "斜边候选落在",
        "故投影为",
        "可取",
        "最优值为"
      ]
    },
    {
      "anchor": "答案：取",
      "fragments": [
        "互补关系成立",
        "最优点不变"
      ]
    },
    {
      "anchor": "允许容差是一种额外的业务规则",
      "fragments": [
        "原硬约束已经满足",
        "仍超预算"
      ]
    },
    {
      "anchor": "新梯度为",
      "fragments": [
        "不再必定成立",
        "改变这个一步结论所需的步长"
      ]
    }
  ]
});
