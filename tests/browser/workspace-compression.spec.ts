import { registerSpectralCompressionTests } from './spectral-compression-reader';

registerSpectralCompressionTests({
  "id": "compression-prefix-codes",
  "name": "compression foundation",
  "concept": "concept:compression",
  "parent": "topic:information-theory",
  "leaf": "compression",
  "claims": [
    "不是所有 Huffman 实现必须产生相同码本",
    "00001010110111",
    "八个 D",
    "这一步不需要位置之间独立",
    "单符号空码不是自定界消息",
    "不是通用文件格式",
    "载荷省了 2 bit，玩具完整帧却多了 2 字节",
    "不是校验和、纠错码、加密或真实性保证",
    "needs-independent-review",
    "共 14 bit",
    "固定两位码需要 16 bit",
    "八个 D，同一码本需要 24 bit",
    "八个 A 则只要 8 bit",
    "48（6 字节）",
    "32 bit，即 4 字节"
  ],
  "formulas": [
    "K=\\sum_i2^{-\\ell_i}\\le1",
    "\\frac{4\\times1+2\\times2+1\\times3+1\\times3}{8}",
    "\\frac74=1.75",
    "H(p)\\le L_H<H(p)+1",
    "L-H(p)=D_{\\mathrm{KL}}(p\\Vert q)-\\log_2K",
    "L_{\\mathrm{old}}=\\frac{1+2+6+12}{8}=\\frac{21}{8}=2.625",
    "q=\\lfloor x/2\\rfloor,\\qquad \\hat x=2q",
    "\\mathbb E[(X-\\hat X)^2]&=\\frac{4}{8}=\\frac12",
    "\\max_x|x-\\hat x|&=1"
  ],
  "tableRows": [
    4,
    7,
    8
  ],
  "tableValues": [
    {
      "index": 0,
      "rows": [
        [
          "A",
          "\\mathtt{0}",
          "1"
        ],
        [
          "B",
          "\\mathtt{10}",
          "2"
        ],
        [
          "C",
          "\\mathtt{110}",
          "3"
        ],
        [
          "D",
          "\\mathtt{111}",
          "3"
        ]
      ]
    },
    {
      "index": 1,
      "rows": [
        [
          "四个长度字段",
          "4\\times3=12"
        ],
        [
          "四个码字内容",
          "1+2+3+3=9"
        ],
        [
          "消息符号数",
          "9"
        ],
        [
          "消息载荷",
          "14"
        ],
        [
          "填充前合计",
          "44"
        ],
        [
          "尾部填充",
          "4"
        ],
        [
          "完整帧",
          "48（6 字节）"
        ]
      ]
    },
    {
      "index": 2,
      "rows": [
        [
          "0",
          "0",
          "0",
          "0"
        ],
        [
          "1",
          "0",
          "0",
          "1"
        ],
        [
          "2",
          "1",
          "2",
          "0"
        ],
        [
          "3",
          "1",
          "2",
          "1"
        ],
        [
          "4",
          "2",
          "4",
          "0"
        ],
        [
          "5",
          "2",
          "4",
          "1"
        ],
        [
          "6",
          "3",
          "6",
          "0"
        ],
        [
          "7",
          "3",
          "6",
          "1"
        ]
      ]
    }
  ],
  "onward": [
    {
      "scope": "branch:llm:math/probability",
      "article": "llm-conditional-probability"
    },
    {
      "scope": "branch:llm:math/objectives",
      "article": "llm-entropy-cross-entropy"
    },
    {
      "scope": "branch:llm:math/mutual-information",
      "article": "mutual-information"
    }
  ],
  "backlinks": [
    "llm-entropy-cross-entropy",
    "mutual-information"
  ],
  "canonicalBacklinks": [
    "mutual-information"
  ],
  "title": "压缩与表示：短了多少位，还能还原什么？",
  "sources": [
    "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
    "https://compression.ru/download/articles/huff/huffman_1952_minimum-redundancy-codes.pdf",
    "https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/5fd6b5c839a76dd0c52d8480c3dad224_book_2.pdf",
    "https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/926689aaa62a0315473fa9b982de1b07_book_3.pdf",
    "https://www.rfc-editor.org/rfc/rfc1951.html",
    "https://www.rfc-editor.org/rfc/rfc3629.html",
    "https://docs.python.org/3.14/library/stdtypes.html"
  ],
  "headings": [
    "1. 先约定“恢复什么”和“多少位”",
    "2. 前缀自由：读到哪里，一个符号就结束了？",
    "3. 已知分布下，Huffman 怎样分配码长？",
    "4. 期望是 1.75 bit，单次消息却不一定如此",
    "5. 熵界说了什么，又没有说什么？",
    "6. 加上码本和帧，14 bit 最后是多少？",
    "7. 分布错了，原来的最优性不跟着走",
    "8. 一个完全规定的有损表示",
    "9. 可运行实验：符号、载荷、外部长度分开传",
    "10. 迁移练习：改变哪条假设，结论就会变？",
    "来源、版本与验证边界"
  ],
  "articleSha256": "f5596837bfc89a01224179d577c778de8dfe01a7b2351ae358db73a5a6f672ed",
  "codeSha256": "49408945ec95e801c2ac23d8e115f9c6bf424d4df36f4ba061e410232c5c1d82",
  "suffixSha256": "780a41ebe1cea3942444de0437889493488d0996475ba59a3a85333ff7ecd28f",
  "prerequisite": {
    "source": "concept:entropy",
    "reason": "本课先沿有限分布学习熵与 bit/nat 单位，再比较熵 H(p)、前缀码期望码长 L 和单条消息的实际位数，理解已知分布下的码长界；这是 compression-prefix-codes 的建议阅读顺序，不是所有编码器的逻辑必要条件。",
    "scope": "compression-prefix-codes 单元中，从有限分布的熵与 bit/nat 单位到已知分布前缀码期望码长界的教学阅读次序；不是所有编码器的逻辑必要条件。",
    "provenance": "entropy-cross-entropy 的熵、单位与 KL 基础、compression-prefix-codes 第 4–5 节与独立关系审阅的编辑性阅读建议；不构成专家认证。"
  },
  "unbrokenTableCells": [
    {
      "table": 0,
      "column": 1,
      "values": [
        "0",
        "10",
        "110",
        "111"
      ]
    }
  ]
});
