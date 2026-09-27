> **本页解决的问题：**文字怎样变成模型的输入？为什么字符、字节和 Token 的数量不同？
>
> 这是独立知识单元，不是某个商业模型的分词结果说明。下文的合并规则、词表和数字均为明确构造的教学样例。代码只需 Python 3 标准库，不需要 API、模型下载或付费服务。

## 1. 先区分五个对象

| 对象 | 含义 | 本页例子 |
| --- | --- | --- |
| 文本 | 人阅读的字符序列 | `lower` |
| 编码后的字节 | 保存文本的一种机器表示 | UTF-8 字节 |
| Token | 分词器输出的符号单位 | 教学划分 `low`、`er` |
| Token ID | 词表中符号的整数编号 | 教学编号 0、1 |
| Embedding | 根据 ID 取出的可训练向量 | 矩阵的第 0、1 行 |

Token ID 不是语义大小：编号 100 不比编号 10 “聪明十倍”。它更像表格行号；交换词表编号时，必须同步交换模型中对应的嵌入与输出位置，不能只换分词器。

子词方法允许常见片段以较少符号表示，同时用更细粒度片段处理罕见词。BPE 在神经机器翻译中的应用可追溯到 Sennrich 等人的论文；SentencePiece 则提供直接从原始句子训练子词模型的工具。[1][2]

```mermaid
flowchart LR
  T["文本"] --> P["规范化与预处理"]
  P --> S["按分词器规则切分"]
  S --> I["Token ID 序列"]
  I --> E["Embedding 查表"]
  E --> H["模型层中的上下文计算"]
```

这里是职责示意图，不要求每个分词器都采用完全相同的预处理步骤。大小写、空格、Unicode 规范化和特殊符号，必须按具体分词器配置解释。[2]

## 2. BPE 的训练与编码不是同一件事

**训练分词器**需要语料：统计相邻单位，根据算法规则反复合并并保存合并顺序。**使用分词器编码**则读取已经固定的规则，并不因为某位用户输入一句新话就重新训练词表。[1]

下面人为指定一个极小的、字符级教学合并表。它不声称来自真实训练语料，也不等同于完整的 byte-level BPE 实现。

| 优先级 | 相邻单位 | 合并结果 |
| ---: | --- | --- |
| 0 | `l` + `o` | `lo` |
| 1 | `lo` + `w` | `low` |
| 2 | `e` + `r` | `er` |
| 3 | `e` + `s` | `es` |
| 4 | `es` + `t` | `est` |

编码 `lower` 时，从 `l / o / w / e / r` 开始，得到 `lo / w / e / r`，再得到 `low / e / r`，最后是 `low / er`。编码 `lowest` 会得到 `low / est`。

合并次序很重要。不能把“总是取最长字符串”当作所有 BPE 编码器的完整定义，也不能把所有 tokenizer 都叫 BPE。SentencePiece 支持不同子词建模方式；具体模型的 tokenizer 文件才是实现依据。[2]

## 3. 可运行的最小编码实验

以下程序只演示固定合并表的应用。未覆盖的输入会报错，而不是悄悄伪造 Token ID。

```python
# nextchina-example: tokenization
merges = [("l", "o"), ("lo", "w"), ("e", "r"),
          ("e", "s"), ("es", "t")]
rank = {pair: i for i, pair in enumerate(merges)}
vocab = {"low": 0, "er": 1, "est": 2}

def encode_toy(text):
    if not isinstance(text, str) or not text:
        raise ValueError("请输入非空字符串")
    parts = list(text)
    while len(parts) > 1:
        candidates = [(rank[pair], i, pair)
                      for i in range(len(parts) - 1)
                      if (pair := (parts[i], parts[i + 1])) in rank]
        if not candidates:
            break
        _, _, pair = min(candidates)
        merged, i = [], 0
        while i < len(parts):
            if i + 1 < len(parts) and (parts[i], parts[i + 1]) == pair:
                merged.append(parts[i] + parts[i + 1])
                i += 2
            else:
                merged.append(parts[i])
                i += 1
        parts = merged
    if any(part not in vocab for part in parts):
        raise ValueError("此教学词表不覆盖该输入")
    return parts, [vocab[part] for part in parts]

assert encode_toy("lower") == (["low", "er"], [0, 1])
assert encode_toy("lowest") == (["low", "est"], [0, 2])
assert len("AI很棒") == 4
assert len("AI很棒".encode("utf-8")) == 8
print(encode_toy("lower"))
```

预期输出为 `(['low', 'er'], [0, 1])`。最后两个断言只是字符数与 UTF-8 字节数的对照，**没有计算任何实际模型的 Token 数**。

## 4. 从 ID 到向量，形状怎样变化？

设批次为 $B$、序列长度为 $S$、词表大小为 $V$、嵌入维度为 $d$。输入 ID 的形状为 $B\times S$，嵌入矩阵 $E$ 的形状为 $V\times d$。查表后得到 $B\times S\times d$ 的张量。

$$
X_{b,t,:}=E_{i_{b,t},:}
$$

这是按行取值，不是把整数 ID 当作实数乘进一个神经网络。Transformer 原论文使用学习到的嵌入，并将最终隐藏状态映射为词表上的预测分数。[3]

以自定的 $V=50{,}000$、$d=4096$、每元素 2 字节为例，仅这一个矩阵就需要：

$$
50{,}000\times4096\times2
=409{,}600{,}000\text{ 字节}
=390.625\text{ MiB}
$$

这没有包含优化器状态、梯度和其他模型层。扩大词表并非没有代价；序列变短也不能直接推出总成本一定降低，因为输出头规模、编码效率和服务实现同时在变化。

## 5. 为什么同一句话在不同模型里长度不同？

阅读某个 tokenizer 的输出时，应同时检查词表与规则版本、文本规范化、空格处理、特殊 Token 和聊天模板。不能只拿一个字符串的字符数乘固定系数，便当作所有模型的准确计费长度。[2]

对于采用单一 Token 窗口的示意系统，可以列一个预算：

$$
N_{\text{输入}}+N_{\text{预留输出}}\le C
$$

输入应包含系统指令、历史消息、检索材料和模板开销。这里的 $C$ 是假设的总窗口；真实产品可能有不同输入、输出上限和额外规则，必须读相应文档。图像、音频等输入也不能套用纯文本的字符换算。

## 6. 易错点与验收练习

“一个中文字符等于一个 Token”不是通用规则；“Token 更少，所以模型更强”也不是能力评测结论。Tokenization 决定表示入口，不能独自解释写作、数学或代码成绩。

词表与模型不匹配、聊天模板重复添加特殊符号、截断时破坏输入结构，都是不同的问题。排错时应先保存精确输入、分词器版本与 ID 序列，而不是立即修改模型参数。

完成本页后，尝试解释：为什么 `lower` 的 5 个字符在教学规则中变成 2 个 Token？为什么两个模型的 ID=0 不必表示同一符号？为什么 390.625 MiB 不是整个模型的内存？能清楚回答，才算把表示链条连起来。

## 7. 与模型选择、价格和其他分支的关系

在 [LLM 的 API 报价分支](?view=garden&scope=branch:llm:pricing/offers) 比较费用时，需要使用相应服务的计量口径；本文不复制价格，也不刷新旧报价的日期。接下来可以阅读 [Softmax 与温度](?view=garden&scope=branch:llm:math/softmax)，理解模型怎样从词表分数得到输出分布；[训练循环](?view=garden&scope=branch:llm:training/loop) 则解释这些分数怎样被学习。

## 来源与范围

[1] Sennrich 等，2016，[Neural Machine Translation of Rare Words with Subword Units](https://aclanthology.org/P16-1162/)。用于子词与 BPE 背景，不是本页虚构词表的来源。

[2] Kudo 与 Richardson，2018，[SentencePiece](https://aclanthology.org/D18-2012/)；[官方实现说明](https://github.com/google/sentencepiece)。用于原始文本、规范化与子词工具的范围说明。

[3] Vaswani 等，[Attention Is All You Need，第 3.4 节](https://arxiv.org/html/1706.03762v7#S3.SS4)。用于嵌入与输出映射的结构背景。

本文核对的是机制资料与教学算例，不是商业模型规格、实时价格或榜单。仍欢迎独立复核和纠错。
