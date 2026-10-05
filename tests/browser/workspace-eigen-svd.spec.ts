import { registerSpectralCompressionTests } from './spectral-compression-reader';

registerSpectralCompressionTests({
  "id": "eigen-svd-low-rank",
  "name": "spectral foundation",
  "concept": "concept:eigen-svd",
  "parent": "topic:linear-algebra",
  "leaf": "eigen-svd",
  "claims": [
    "矩阵秩与张量轴数不是同一个量",
    "不能撤销所有三维向量上的操作",
    "没有证明所有需要的特征向量一定存在",
    "它不会从 a 求出分解",
    "不承诺每个有理矩阵",
    "程序没有用 NumPy、SciPy",
    "这次低秩操作没有按这个口径节省标量",
    "needs-independent-review",
    "k = 0 rank = 2 squared error = 29",
    "k = 1 rank = 2 squared error = 4",
    "k = 2 rank = 2 squared error = 0",
    "diag(3, 2, 1), k = 1: squared Frobenius error = 5",
    "谱范数误差是 2"
  ],
  "formulas": [
    "A=\\begin{bmatrix}3&0\\\\4&0\\\\0&2\\end{bmatrix}",
    "u_1=\\begin{bmatrix}3/5\\\\4/5\\\\0\\end{bmatrix}",
    "U_qU_q^T=\\begin{bmatrix}9/25&12/25&0\\\\12/25&16/25&0\\\\0&0&1\\end{bmatrix}\\ne I_3",
    "S=\\begin{bmatrix}2&1\\\\1&2\\end{bmatrix}",
    "Q=\\frac1{\\sqrt2}\\begin{bmatrix}1&1\\\\1&-1\\end{bmatrix}",
    "\\Lambda=\\operatorname{diag}(3,1)",
    "\\varphi=\\frac{1+\\sqrt5}{2}",
    "(\\sigma_1,\\sigma_2)=(\\varphi,\\varphi^{-1})",
    "v_1=\\frac1d\\begin{bmatrix}1\\\\\\varphi\\end{bmatrix}",
    "u_2=\\frac1d\\begin{bmatrix}-1\\\\\\varphi\\end{bmatrix}",
    "\\Sigma=\\begin{bmatrix}5&0\\\\0&2\\\\0&0\\end{bmatrix}",
    "A_1=\\begin{bmatrix}3&0\\\\4&0\\\\0&0\\end{bmatrix}",
    "A-A_1=\\begin{bmatrix}0&0\\\\0&0\\\\0&2\\end{bmatrix}",
    "\\sqrt{\\sum_{i=k+1}^{q}\\sigma_i^2}",
    "\\sqrt{2^2+1^2}=\\sqrt5",
    "mk+k+nk=k(m+n+1)",
    "m\\times q",
    "q\\times q",
    "m\\times r",
    "n\\times k"
  ],
  "tableRows": [],
  "tableValues": [],
  "onward": [
    {
      "scope": "branch:llm:math/tensor-shapes",
      "article": "llm-tensor-shapes"
    },
    {
      "scope": "branch:llm:math/floating-point",
      "article": "floating-point-rounding"
    },
    {
      "scope": "concept:pca",
      "outlineLabel": "主成分分析"
    },
    {
      "scope": "concept:lora",
      "outlineLabel": "低秩适配"
    }
  ],
  "backlinks": [
    "llm-tensor-shapes"
  ],
  "title": "特征分解与 SVD：哪些方向能分开，丢掉一项会怎样？",
  "sources": [
    "https://ee263.stanford.edu/archive/ee263_course_reader.pdf",
    "https://people.maths.ox.ac.uk/trefethen/publication/PDF/2014_151.pdf",
    "https://slepc.upv.es/release/documentation/manual/svd.html",
    "https://numpy.org/doc/stable/reference/generated/numpy.linalg.svd.html",
    "https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/resources/lecture-7-eckart-young-the-closest-rank-k-matrix-to-a/",
    "https://docs.python.org/3.14/library/fractions.html"
  ],
  "headings": [
    "1. 从两列的组合，看见“独立方向”",
    "2. 正交基为什么让坐标容易分开？",
    "3. 特征分解：同一个空间里的特殊方向",
    "4. SVD：输入与输出允许各用一套方向",
    "5. full、thin、rank-compact、truncated 究竟差在哪？",
    "6. 丢掉一项：先说明用哪把尺子",
    "7. 不唯一：数值相同，不代表方向写法相同",
    "8. 可运行实验：给我一份证书，我精确核验",
    "9. 低秩并不自动节省存储，也不保证任务效果",
    "10. 迁移练习与继续阅读",
    "来源、版本与验证边界"
  ],
  "articleSha256": "30b9ebe1fe479430c7c3e51e71ee03fb02de5030ba447cff1fcbdcb712898868",
  "codeSha256": "a7fadb4b09785e6a53e0097b655b6481678a0591b22f3c5d7722882c15d5e230",
  "suffixSha256": "1d43afdb69562ddda8bd69af15b3736d3bf15551e19d17b0bc4ca838456b63a4",
  "prerequisite": {
    "source": "concept:matrix-multiplication",
    "reason": "先能按行列尺寸、转置和点积核对矩阵乘法，再阅读特征分解与 SVD 的正交性 UᵀU=I、重建 UΣVᵀ 与截断计算。",
    "scope": "本站实矩阵基础课的建议学习顺序；不要求先学通用特征值算法，不表示逻辑必要条件、类型包含、机制 uses 或所有学习路径必须如此。",
    "provenance": "tensor-shapes 第 2–3 节及矩阵乘法例子、eigen-svd-low-rank 第 1–2、4、8 节与独立关系审阅的编辑性阅读建议；不构成专家认证。"
  },
  "mathLists": [
    {
      "label": "full，完整",
      "formulas": [
        "m\\times m",
        "m\\times n",
        "n\\times n"
      ],
      "claims": [
        "包括补齐空间的方向，精确恢复"
      ]
    },
    {
      "label": "thin / reduced，薄",
      "formulas": [
        "m\\times q",
        "q\\times q",
        "n\\times q"
      ],
      "claims": [
        "个奇异值，包括零，仍精确恢复"
      ]
    },
    {
      "label": "rank-compact，秩紧致",
      "formulas": [
        "m\\times r",
        "r\\times r",
        "n\\times r"
      ],
      "claims": [
        "只保留严格正奇异值，仍精确恢复"
      ]
    },
    {
      "label": "truncated，截断",
      "formulas": [
        "0\\le k\\le q",
        "m\\times k",
        "k\\times k",
        "n\\times k",
        "k<r",
        "k\\ge r",
        "k=0"
      ],
      "claims": [
        "必有误差",
        "则精确恢复",
        "解释为空和，即零矩阵"
      ]
    }
  ]
});
