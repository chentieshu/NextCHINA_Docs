> **本页解决的问题**：把常见符号写短，究竟省了什么？为什么平均码长更小，一条消息甚至整个文件仍可能更大？有损表示丢掉的东西，还能靠后续无损编码找回来吗？
>
> 前置阅读：[概率与期望](?view=garden&scope=branch:llm:math/probability)、[熵与 KL 散度](?view=garden&scope=branch:llm:math/objectives)。本页只讨论已知有限分布下的符号级二进制前缀码，以及一个完全规定的离散有损表示。所有分布和消息都由正文给定，不是训练数据或真实压缩测评。

## 1. 先约定“恢复什么”和“多少位”

设符号表只有 A、B、C、D。它们先只是四种不同的标签，程序用索引 0、1、2、3 表示。**无损**要求接收方精确恢复原来的符号序列，包括顺序和重复次数；双方还必须约定符号身份、码本，以及怎样确定消息的起点和终点。

一个 **bit** 是一个二进制位置，取值为 0 或 1。码字是某个符号对应的有限 bit 串，码本是完整映射。把各个码字依次拼起来，得到这条消息的**载荷**。文件或传输帧还可能包含码本、长度、填充及其他字段。

以下计数不能直接互换：

- **符号数**：本例的 `AAAABBCD` 是 8 个符号；一个符号不必是一个文本字符，更不必是一个语言模型 Token
- **载荷 bit 数**：取决于本页规定的码字长度
- **Unicode 码点与 UTF-8 字节数**：文本如何表示是另一个约定；UTF-8 对有效 Unicode 标量值使用 1–4 个八位字节，不能把字符数直接当作字节数。[RFC 3629，§3](https://www.rfc-editor.org/rfc/rfc3629.html#section-3)
- **文件字节数与对象内存**：前者取决于实际序列化格式，后者还取决于语言运行时的对象表示

本页 Python 返回的 `'010'` 是**用三个文本字符展示三个理想 bit 位置**，不是把它们打包进一个字节。若单纯按 UTF-8 写出这三个 ASCII 字符，内容就是 3 字节而不是 3 bit；Python `str` 对象占用多少内存又是另一个数。程序不做这两种测量。Python 的字符串和字节序列是不同类型。[Python 字符串与二进制序列文档](https://docs.python.org/3.14/library/stdtypes.html)

## 2. 前缀自由：读到哪里，一个符号就结束了？

固定两位码可以规定 A=`00`、B=`01`、C=`10`、D=`11`。既然有些符号更常见，可不可以给它更短的码字？可以，但**码字不同还不够**。若 A=`0`、B=`1`、C=`01`，收到 `01` 时，既可能是 AB，也可能是 C。

**前缀自由**要求任何一个码字都不是另一个码字的开头。本页正支持至少为两个符号时，所有码字非空。例如：

| 符号 | 码字 | 长度 |
| --- | --- | ---: |
| A | $\mathtt{0}$ | 1 |
| B | $\mathtt{10}$ | 2 |
| C | $\mathtt{110}$ | 3 |
| D | $\mathtt{111}$ | 3 |

解码时，从树根出发，0 走左边，1 走右边。码字对应叶子：一旦到叶子，就确定一个符号，再回树根读下一个。读 `11010` 时，先读到 C 的 `110`，再读到 B 的 `10`。不会在 `1` 或 `11` 处提前停下，因为它们只是内部路径，不是码字。[Gallager，第 2 章 §2.3.2](https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/5fd6b5c839a76dd0c52d8480c3dad224_book_2.pdf)

这解释的是**一个符号的边界**。它没有凭空提供整条消息的终点。如果消息后面还接着另一条消息，或者为凑满字节补了 0，解码器必须知道哪里停止。特别是这里 A 的码字就是 `0`，不能把末尾所有 0 都随意删除。

### 短码字为什么不能无限多？

深度为 $d$ 的完整二叉树有 $2^d$ 个位置。若给某个符号长度为 $\ell_i$ 的码字，它就占据了该前缀下的全部后代；在深度 $d\ge\ell_i$，占去 $2^{d-\ell_i}$ 个位置。前缀自由使不同码字占的位置不重叠。除以 $2^d$，得到 **Kraft 条件**：

$$
K=\sum_i2^{-\ell_i}\le1
$$

例如主码本占去 $1/2+1/4+1/8+1/8=1$，树已经用满。三个长度都为 1 的码字则要求 $K=3/2$，不可能装进二叉树。反过来，有限整数长度满足此条件，就存在这些长度的二进制前缀码；这是 Kraft 定理的充分性部分。[Gallager，定理 2.3.1](https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/5fd6b5c839a76dd0c52d8480c3dad224_book_2.pdf)

## 3. 已知分布下，Huffman 怎样分配码长？

现在**直接规定** A、B、C、D 的权重为 $(4,2,1,1)$，总质量 8，所以概率依次为 $1/2,1/4,1/8,1/8$。这里的 8 是归一化分母，不是抽到了 8 个样本。

Huffman 每次取质量最小的两个结点，合成一个新结点，新质量是两者之和。对本例，逐步做：

1. C 的 1 与 D 的 1 合成 CD，质量为 2
2. B 的 2 与 CD 的 2 合成 BCD，质量为 4
3. A 的 4 与 BCD 的 4 合成根，质量为 8

为让程序结果可复现，本页额外规定：按“质量、唯一序号”排序；初始叶子的序号就是符号索引；父结点从符号槽位总数开始，依生成顺序编号。每次先取出的子树分配 0，后取出的分配 1。因此恰得 A=`0`、B=`10`、C=`110`、D=`111`。这是一条确定性的破同分规则，**不是所有 Huffman 实现必须产生相同码本**。交换同质量结点或左右方向，可能仍然最优。[Huffman 1952，pp. 1099–1100](https://compression.ru/download/articles/huff/huffman_1952_minimum-redundancy-codes.pdf)

### 为什么合并最小的两个有道理？

先看交换：若 $p_i>p_j$ 却给 $i$ 更长的码字，即 $\ell_i>\ell_j$，交换两者的码字，会让期望码长减少

$$
(p_i-p_j)(\ell_i-\ell_j)>0
$$

因此高概率不应被迫占更深的位置。对正概率符号，最优树还可以取为每个内部结点都有两个孩子的满二叉树：只有一个孩子的路径可以缩短，降低成本。最深层必有一对兄弟叶子；利用交换，可以把两个最小概率的符号放到这一对位置而不变差。

把这对兄弟收缩成一个父叶子，原问题就少一个符号。以后重新展开，只会额外增加这两个符号的概率之和；其他符号的码长不变。因此只要缩小后的问题最优，展开后也最优。不断重复，直到只剩根。这给出了贪心合并的依据；完整证明见 [Gallager，§2.5.3](https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/5fd6b5c839a76dd0c52d8480c3dad224_book_2.pdf)。

这个“最优”有明确范围：**已知有限分布、逐个符号使用固定二进制前缀码、最小化期望载荷长度**。它没有比较所有文件压缩方法，也没有利用整段消息的重复结构。

## 4. 期望是 1.75 bit，单次消息却不一定如此

本页全部对数用 $\log_2$，熵和平均码长的单位都是 bit / 符号。前置熵课程若用 nat，换为 bit 要除以 $\ln2$。码长 $\ell_i$ 必须是整数，**平均码长可以不是整数**：

$$
\begin{aligned}
L(C;p)&=\sum_i p_i\ell_i\\
&=\frac{4\times1+2\times2+1\times3+1\times3}{8}\\
&=\frac74=1.75
\end{aligned}
$$

主例的每个码长恰为 $-\log_2p_i$，所以熵也为 $H(p)=7/4$。这组概率和码本出现在 Shannon 1948 年论文中；这里的合并过程和下面的帧账单是另外展开的教学计算。[Shannon，§9，所链修订重印本 p. 18](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf)

一条已经给定的消息 $x_1,\ldots,x_n$，实际载荷是

$$
B(x_1,\ldots,x_n)=\sum_{t=1}^{n}\ell(x_t)
$$

人工选消息 `AAAABBCD`，符号计数恰为 $(4,2,1,1)$。分段是 `0 | 0 | 0 | 0 | 10 | 10 | 110 | 111`；竖线只是讲解时的边界标记，不发送。拼接后是 `00001010110111`，共 **14 bit**，而固定两位码需要 **16 bit**。

这条消息恰好等于 $8L$，是因为我们这样构造了计数。若改成八个 D，同一码本需要 **24 bit**；八个 A 则只要 **8 bit**。二者都不推翻期望最优性。

如果每个随机位置 $X_t$ 的边缘分布都为 $p$，由期望的线性性：

$$
\mathbb E[B]=\sum_{t=1}^{n}\mathbb E[\ell(X_t)]=nL
$$

**这一步不需要位置之间独立。** 但不能顺手写成联合块熵 $H(X_1,\ldots,X_n)=nH(p)$：一般需要独立等附加条件。例如只抽一次 $X$，再把它复制 $n$ 次，每个位置的边缘仍为 $p$，逐符号编码的期望仍是 $nL$；整个块却只包含第一次选择的不确定性，联合熵是 $H(p)$。本页不实现联合块编码，也不推导熵率结论。

## 5. 熵界说了什么，又没有说什么？

只在正概率支持上求和。支持数至少为 2 时，Huffman 得到的最小期望长度满足

$$
H(p)\le L_H<H(p)+1
$$

### 下界：前缀资源有限，平均不能更低

对任意这样的前缀码，令 $K=\sum_i2^{-\ell_i}$，再令 $q_i=2^{-\ell_i}/K$。由于 $K>0$，$q$ 是归一化分布。直接展开 KL，有

$$
L-H(p)=D_{\mathrm{KL}}(p\Vert q)-\log_2K
$$

KL 非负，而 Kraft 保证 $K\le1$，因此右侧非负。等号要求同时有 $K=1$ 和 $p=q$，于是每个正概率都必须恰为 $2^{-\ell_i}$。

### 上界：向上取整，平均不足多一位

暂时选长度 $\ell_i=\lceil-\log_2p_i\rceil$。它满足 $2^{-\ell_i}\le p_i$，所以 Kraft 条件成立；存在这组长度的前缀码。同时，每个长度都严格小于 $-\log_2p_i+1$，按 $p$ 加权后得到 $L<H+1$。Huffman 在这个符号码类中最优，不会比该选择更长。[Gallager，定理 2.5.1、§2.5.3](https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/5fd6b5c839a76dd0c52d8480c3dad224_book_2.pdf)

**达到熵的条件不是“概率分母是 2 的幂”。** 正确条件是每个正概率各自都是 2 的负整数次幂。比如 $(3/4,1/4)$ 的分母都是 4，但两个符号的最优码长仍为 $(1,1)$，$L=1$，而 $H\approx0.811278<1$。再如 $(2/3,1/3)$，也有 $L=1$，但 $H\approx0.918296$。整数码长留下的间隙不是程序错误。

### 零支持、全零与单符号

- 某槽位权重为 0，表示这个**已知模型**认为它不可能出现。它不参与构树，不贡献熵或期望码长；代码返回 `None`。若要求发送该索引，编码器拒绝
- 所有权重都是 0，不能归一化成概率分布，必须拒绝。它与“一个有效分布下发送空消息”是两回事
- 若只有一个正支持符号，并且接收方另有**消息符号数**，无需再发送符号选择。我们约定该符号的码字为空串，得到 $H=L=0$

最后一项必须连同外部长度一起理解：空串本身区分不了零次、一次、三次或 256 次。因此**单符号空码不是自定界消息，也不是对未知长度的所有符号串唯一可解码的编码**。这里可逆的是“已共享模型 + 外部长度 + 载荷”的整体约定。

真实格式可以采用不同约定。若强制单符号也占一位，则 $L=1$，不能再套用严格的 $L<H+1$，因为此时 $H=0$。例如 DEFLATE 对仅有一个被使用的距离码明确要求一位；这不是本页空载荷约定。[RFC 1951，§3.2.7](https://www.rfc-editor.org/rfc/rfc1951.html#section-3.2.7)

## 6. 加上码本和帧，14 bit 最后是多少？

以下**另行规定一个玩具帧协议**，只适用于本节四个已知符号、四个非空码字的例子；它不是通用文件格式，也没有在 Python API 中实现。双方预先知道符号身份和 A/B/C/D 顺序，知道帧从字节边界开始：

1. 先发送四个 3-bit 无符号整数，按顺序记录各码字长度
2. 再按相同顺序发送四个码字本身；其边界由上一项的长度确定
3. 再发送一个 9-bit 无符号整数，记录消息符号数，合法范围是 0–256
4. 发送消息载荷；解出指定数量的符号后结束载荷
5. 在帧尾补 0 到下一个字节边界；填充不属于消息，按已读位数确定其数量

上述整数都按高位在前书写；码字按表中从左到右的顺序发送，拼完后每连续 8 位为一个字节，高位在前。这里不另含魔数、校验和或协议版本字段；这些约定都是预共享的。如果换成含空码、未知字母表或别的元数据的格式，必须重新规定字段，不能直接沿用此账单。

对 `AAAABBCD` 逐项记账：

| 项目 | bit 数 |
| --- | ---: |
| 四个长度字段 | $4\times3=12$ |
| 四个码字内容 | $1+2+3+3=9$ |
| 消息符号数 | 9 |
| 消息载荷 | 14 |
| 填充前合计 | 44 |
| 尾部填充 | 4 |
| 完整帧 | **48（6 字节）** |

可以按小段核对字段：长度为 `001 | 010 | 011 | 011`；码字为 `0 | 10 | 110 | 111`；count 为 `000001000`；载荷为 `00001010110111`；最后填 `0000`。这些分隔符均不发送。

公平的固定码对照也预共享四符号表及固定映射，并带同样的 9-bit count：$9+16=25$ bit，补 7 bit 后是 **32 bit，即 4 字节**。于是这个短消息的 Huffman **载荷省了 2 bit，玩具完整帧却多了 2 字节**。

若码本和分布本来就预共享，本次不必传上述 21-bit 码本；那是另一种开销假设。若一个码本用于许多消息，成本可以分摊；本节“每帧重新发送”的账单不能在中途改口径。实际格式也可以只传长度并使用规范化规则重建码字，而不是重复发送码字内容。DEFLATE 还有块头、固定或动态树描述及块结束符，不能用本节固定账单替代它的格式成本。[RFC 1951，§3.2.3、§3.2.6–3.2.7](https://www.rfc-editor.org/rfc/rfc1951.html)

## 7. 分布错了，原来的最优性不跟着走

继续保留旧码长 $(1,2,3,3)$，但把实际分布改为 $(1,1,2,4)/8$，新的平均载荷变成

$$
L_{\mathrm{old}}=\frac{1+2+6+12}{8}=\frac{21}{8}=2.625
$$

已经超过固定两位码。新分布只是原概率值换了顺序，熵仍为 $7/4$；重新为它设计 Huffman 码可以重新达到该值。但那涉及接收方也使用新码本，不能只改编码端而忽略同步。旧码本对于旧分布最优，从未承诺对新分布仍最优。

若权重来自一份消息的计数 $N_i$，令 $n=\sum_iN_i>0$、$\hat p_i=N_i/n$，有精确恒等式

$$
\sum_iN_i\ell_i=n\sum_i\hat p_i\ell_i
$$

所以在这个符号码类里，按经验频率优化，确实是在优化**这条消息的载荷**。但这没有证明 $\hat p$ 就是生成它的真实分布，也没有保证下一条消息同样省位。没观察到某符号，不等于它在真实来源中不可能出现。本接口不拟合分布、不添加平滑或逃逸符号，也不自动更新码本；这些建模和协议选择需要另外设计。概率与经验频率的关系及实际来源统计变化见 [Gallager，§2.9.3](https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/5fd6b5c839a76dd0c52d8480c3dad224_book_2.pdf)。

## 8. 一个完全规定的有损表示

无损编码改变写法，仍要保留原符号。**有损表示**则允许不同输入产生相同表示。本节另设输入值 $x\in\{0,1,\ldots,7\}$，定义

$$
q=\lfloor x/2\rfloor,\qquad \hat x=2q
$$

先把相邻两点分为一组，用组号 $q$ 表示；再把该组较小的偶数作为恢复值。这里的全部边界、组号、恢复点都已给定，不是待训练的参数，也不声称是所有任务的最优选择。把量化与后续离散编码分开，是源编码的基本层次；解开后者通常只能取回量化后的表示。[Gallager，第 3 章 §3.1–3.2](https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/926689aaa62a0315473fa9b982de1b07_book_3.pdf)

| $x$ | $q$ | $\hat x$ | 平方误差 |
| ---: | ---: | ---: | ---: |
| 0 | 0 | 0 | 0 |
| 1 | 0 | 0 | 1 |
| 2 | 1 | 2 | 0 |
| 3 | 1 | 2 | 1 |
| 4 | 2 | 4 | 0 |
| 5 | 2 | 4 | 1 |
| 6 | 3 | 6 | 0 |
| 7 | 3 | 6 | 1 |

原来的 8 个值可用固定 3 bit 区分，新表示只有 4 个组号，可用固定 2 bit 区分。因此**每个值的这种固定宽度载荷少了 1 bit**，不包括共享规则、长度及其他帧成本。3 与 2 都产生 $q=1$；仅凭组号，无法知道原来是哪一个。

要说平均误差，必须再规定分布。若 $X$ 在八点上均匀，表格是全部可能输入的枚举，不是八次抽样。此时

$$
\begin{aligned}
\mathbb E[(X-\hat X)^2]&=\frac{4}{8}=\frac12\\
\max_x|x-\hat x|&=1
\end{aligned}
$$

换一个分布，平均平方误差就可能改变；最坏绝对误差仍可从完整定义核对。MSE 只是这里选择的损失，不是对视觉、语义或业务效果的通用打分。

任务也要逐个问：$x\ge4$ 当且仅当 $q\ge2$，所以这个判断完全保留；奇偶性却无法从 $q$ 恢复，因为每个组里恰有一个奇数和一个偶数。即便再用 Huffman 无损编码组号，解码后也只能恢复 $q$，丢掉的奇偶位不会重新出现。信息是否保留与哪些变量有关，可继续读[互信息](?view=garden&scope=branch:llm:math/mutual-information)。

## 9. 可运行实验：符号、载荷、外部长度分开传

下面只有四个公共函数。`huffman_codes` 返回与符号索引对齐的码字元组；`encode_symbols` 拼接载荷；`decode_symbols` 必须额外接收 `symbol_count`；`quantize_3bit` 返回（组号元组、恢复值元组、平方误差和）。双方通过同一权重与破同分规则生成同一码本；API 不传输码本，不打包文件，也不读取第 6 节的玩具帧。

**输入合同与资源上限：**

- `weights` 只接受内置 `list` / `tuple`，1–8 项；每项是内置 `int`，范围 0–65536，总和为 1–65536
- `symbols` 只接受内置 `list` / `tuple`，0–256 项；每项是有效且有正支持的内置整数索引
- `bits` 只接受内置 `str`，只能含 ASCII `0` / `1`，长度 0–1792；`symbol_count` 是 0–256 的内置整数
- `values` 只接受内置 `list` / `tuple`，0–256 项；每项是 0–7 的内置整数
- 不接受 `bool`、上述类型的子类、浮点数、迭代器或隐式类型转换。违反输入合同统一抛出 `ValueError`；函数调用参数个数错误仍由 Python 处理，并发修改输入不在合同内

最多 8 个正支持叶子，完整二叉 Huffman 树的最大深度不超过 7，因此最多 256 个符号产生的载荷不超过 $256\times7=1792$ bit。这里的上限用于使教学实验易检查，不是 Huffman 数学理论的限制。空消息有效；量化空输入返回两个空元组与误差和 0，不返回没有定义的空平均。

```python
# nextchina-example: compression-prefix-codes
from fractions import Fraction
from heapq import heapify, heappop, heappush


def _law(weights):
    if type(weights) not in (list, tuple):
        raise ValueError("weights must be a built-in list or tuple")
    if not 1 <= len(weights) <= 8:
        raise ValueError("weights need 1..8 slots")
    if any(type(w) is not int or not 0 <= w <= 65536
           for w in weights):
        raise ValueError("weights must be bounded nonnegative ints")
    if not 1 <= sum(weights) <= 65536:
        raise ValueError("total weight must be in 1..65536")
    return tuple(weights)


def _bounded_sequence(values, name):
    if type(values) not in (list, tuple) or len(values) > 256:
        raise ValueError(name + " must be a list/tuple of length 0..256")
    return tuple(values)


def huffman_codes(weights):
    """Return indexed codewords; None = zero support, '' = singleton."""
    weights = _law(weights)
    heap = [(w, i, i) for i, w in enumerate(weights) if w]
    heapify(heap)
    serial = len(weights)
    while len(heap) > 1:
        wa, _, a = heappop(heap)
        wb, _, b = heappop(heap)
        heappush(heap, (wa + wb, serial, (a, b)))
        serial += 1
    codes = [None] * len(weights)
    stack = [(heap[0][2], "")]
    while stack:
        node, prefix = stack.pop()
        if type(node) is int:
            codes[node] = prefix
        else:
            left, right = node
            stack.append((right, prefix + "1"))
            stack.append((left, prefix + "0"))
    return tuple(codes)


def encode_symbols(weights, symbols):
    """Produce a readable bit string, not packed bytes or a file."""
    codes = huffman_codes(weights)
    symbols = _bounded_sequence(symbols, "symbols")
    if any(type(s) is not int or not 0 <= s < len(codes)
           or codes[s] is None for s in symbols):
        raise ValueError("symbol index must have positive support")
    return "".join(codes[s] for s in symbols)


def decode_symbols(weights, bits, symbol_count):
    """Require an external count and consume the complete payload."""
    codes = huffman_codes(weights)
    if type(bits) is not str or len(bits) > 1792:
        raise ValueError("bits must be a built-in str of length 0..1792")
    if any(b not in "01" for b in bits):
        raise ValueError("payload must contain only 0 and 1")
    if type(symbol_count) is not int or not 0 <= symbol_count <= 256:
        raise ValueError("symbol_count must be an int in 0..256")
    support = [i for i, code in enumerate(codes) if code is not None]
    if len(support) == 1:
        if bits:
            raise ValueError("singleton payload must be empty")
        return (support[0],) * symbol_count
    root = {}
    for symbol in support:
        node = root
        for bit in codes[symbol]:
            node = node.setdefault(bit, {})
        node[None] = symbol
    node = root
    result = []
    for bit in bits:
        if bit not in node:
            raise ValueError("payload leaves the code tree")
        node = node[bit]
        if None in node:
            result.append(node[None])
            if len(result) > symbol_count:
                raise ValueError("more symbols than the external count")
            node = root
    if node is not root:
        raise ValueError("payload ends inside a codeword")
    if len(result) != symbol_count:
        raise ValueError("fewer symbols than the external count")
    return tuple(result)


def quantize_3bit(values):
    """Return (indices, reconstructed_values, squared_error_sum)."""
    values = _bounded_sequence(values, "values")
    if any(type(x) is not int or not 0 <= x <= 7 for x in values):
        raise ValueError("values must be built-in ints in 0..7")
    indices = tuple(x // 2 for x in values)
    reconstructed = tuple(2 * q for q in indices)
    error_sum = sum((x - y) ** 2
                    for x, y in zip(values, reconstructed))
    return indices, reconstructed, error_sum


weights = (4, 2, 1, 1)  # A, B, C, D: specified law, not observations
message = (0, 0, 0, 0, 1, 1, 2, 3)
codes = huffman_codes(weights)
bits = encode_symbols(weights, message)
expected = sum(Fraction(w, sum(weights)) * len(code)
               for w, code in zip(weights, codes) if w)
assert codes == ("0", "10", "110", "111")
assert bits == "00001010110111"
assert decode_symbols(weights, bits, len(message)) == message
print("codes:", codes)
print("payload / expected:", bits, len(bits), expected)
print("eight D symbols:", len(encode_symbols(weights, (3,) * 8)))

assert decode_symbols((0, 0, 5), "", 3) == (2, 2, 2)
print("singleton:", huffman_codes((0, 0, 5)),
      encode_symbols((0, 0, 5), (2, 2, 2)))

indices, restored, error = quantize_3bit(tuple(range(8)))
assert indices == (0, 0, 1, 1, 2, 2, 3, 3)
assert restored == (0, 0, 2, 2, 4, 4, 6, 6)
assert error == 4
print("quantized:", indices)
print("restored:", restored)
print("uniform MSE:", Fraction(error, 8))
```

输出中的关键结果：

- `codes: ('0', '10', '110', '111')`
- `payload / expected: 00001010110111 14 7/4`
- `eight D symbols: 24`
- 单符号码本是 `(None, None, '')`，其三次出现的载荷仍为空串
- 组号为 `(0, 0, 1, 1, 2, 2, 3, 3)`，恢复值为 `(0, 0, 2, 2, 4, 4, 6, 6)`，均匀分布的 MSE 为 `1/2`

程序里的 `Fraction` 只用于精确展示加权结果；Huffman 的比较、合并以及本量化例的误差和都用整数。程序使用 Python 3 标准库，不依赖压缩库、网络、文件、编解码器或机器学习框架。

### 解码成功不等于“没有人改过消息”

对主码本，`bits='1'` 在内部结点结束，必须拒绝；`bits='102'` 含非 bit 字符，必须拒绝。`bits='0', symbol_count=2` 数量太少；`bits='00', symbol_count=1` 数量太多。接收方必须处理**完整 bit 串**，不能见到够数就忽略尾部，也不能用 0 补成完整码字。

代码也保留了“路径不存在”的防御检查；不过它只使用自行生成的完整 Huffman 树，每个内部结点都有 0、1 两支，所以这个 API 下有效二进制字符不会走到缺失分支。截断和数量检查仍然必要。

但 `bits='110', count=1` 是 C；仅把最后一位改成 1，`111` 就成为合法的 D，长度和符号数都没变。前缀自由解决切分歧义，**不是校验和、纠错码、加密或真实性保证**。对单符号，`bits=''`、count 为 3 可以恢复三次；count 被改成 4 仍会恢复四次，载荷本身无法核对外部长度是否可信。

## 10. 迁移练习：改变哪条假设，结论就会变？

**练习一：第三个符号能也只用一位吗？** 现有 A=`0`、B=`1`，想增加 C，同时要求全部仍为一位且前缀自由。

**解析：** 不行。只有两个一位串；Kraft 和也会变成 $3/2>1$。例如改用 A=`0`、B=`10`、C=`11` 才有足够位置，但平均长度还需指定概率后计算。

**练习二：已知权重是 $(0,5,0)$，空载荷代表什么？** 收到空 bit 串时，是否能自行判定消息就是一个索引 1？

**解析：** 不能。若外部 count 为 0，消息为空；为 1，消息是 `(1,)`；为 3，则是 `(1,1,1)`。零支持槽位没有新增可能符号。把权重改成全零则根本没有有效分布。

**练习三：预共享主码本后重新算同一条消息的帧。** 不再发送码长和码字，仍用 9-bit count，并在帧尾补齐字节，`AAAABBCD` 占几字节？

**解析：** $9+14=23$ bit，补 1 bit 得 24 bit，即 3 字节；同条件的固定两位码仍为 4 字节。这与第 6 节不同，是因为现在明确免去了本次传输的码本字段；没有证明码本的建立和共享永远免费。

**练习四：新分布集中在奇数上。** 第 8 节映射不变，若输入在 1、3、5、7 上均匀，MSE 还是 $1/2$ 吗？判断 $x\ge4$ 是否仍能完成？

**解析：** 每个输入都恢复为小一的偶数，平方误差都为 1，所以 MSE 变为 1；阈值判断仍由 $q\ge2$ 精确完成。平均误差与任务可用性是两条不同问题，不能用其中一个替代另一个。

**练习五：每个位置都服从同一分布，就能说块熵是 $nH$ 吗？** 只抽一次 A/B/C/D，再复制八遍，逐符号 Huffman 期望载荷是多少？块熵是多少？

**解析：** 每个位置的边缘仍是主分布，所以期望载荷是 $8\times7/4=14$ bit；整个八符号块由第一次选择唯一决定，块熵只有 $7/4$ bit。不同位置完全依赖，不能把边缘熵直接相加。本页的单符号码没有利用这种块结构。

继续阅读：

- 回到[概率与期望](?view=garden&scope=branch:llm:math/probability)，分清已知 law、单次结果与经验计数
- 回到[熵、交叉熵与 KL](?view=garden&scope=branch:llm:math/objectives)，检查本页熵界的单位与 KL 非负性
- 到[互信息](?view=garden&scope=branch:llm:math/mutual-information)，继续分析一个表示对特定变量保留了多少信息

## 来源、版本与验证边界

访问核验日期为 **2026-10-05**，不是来源的出版日期。

1. Claude E. Shannon，*A Mathematical Theory of Communication*，1948，[Harvard 托管的修订重印本](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf)。使用 §6 的熵定义和 §9 重印本 p. 18 的四符号例；原刊是 Bell System Technical Journal 27，379–423、623–656，重印本页码不是原刊页码。没有把其渐近定理当作有限文件测评
2. David A. Huffman，*A Method for the Construction of Minimum-Redundancy Codes*，Proceedings of the IRE 40(9)，1098–1101，1952，[原论文扫描件](https://compression.ru/download/articles/huff/huffman_1952_minimum-redundancy-codes.pdf)。使用平均码长目标、二进制合并构造及同分选择；不复用扫描表格。DOI：10.1109/JRPROC.1952.273898
3. Robert Gallager，MIT 6.450，Fall 2006，[第 2 章：Coding for Discrete Sources](https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/5fd6b5c839a76dd0c52d8480c3dad224_book_2.pdf)。使用 §2.3.2–2.3.3、定理 2.5.1、§2.5.3、§2.6 与 §2.9.3；印刷页 20–22、28–35、50–51。其 iid 块结论不等于本页只凭共同边缘分布得到的 $nL$
4. Robert Gallager，MIT 6.450，Fall 2006，[第 3 章：Quantization](https://ocw.mit.edu/courses/6-450-principles-of-digital-communications-i-fall-2006/926689aaa62a0315473fa9b982de1b07_book_3.pdf)，§3.1–3.2，印刷页 63–66。支持分区、恢复点和平方误差这三个不同约定；本页八点映射及误差由完整枚举直接计算
5. P. Deutsch，[RFC 1951：DEFLATE 格式 1.3](https://www.rfc-editor.org/rfc/rfc1951.html)，May 1996，Informational，§3.2.3、§3.2.6–3.2.7。只用于说明真实格式还有块头、树描述、结束规则及不同的单符号码约定；不把玩具帧当成 DEFLATE
6. F. Yergeau，[RFC 3629](https://www.rfc-editor.org/rfc/rfc3629.html)，November 2003，§3；以及 [Python 3.14 内置类型文档](https://docs.python.org/3.14/library/stdtypes.html)。用于区分字符、文本字符串、字节序列与本页可读 bit 表示

本页仅绑定“压缩与表示”。没有完成通用压缩器、概率估计、算术编码、率失真理论、语言模型分词、工程权重量化或神经编解码课程。验证范围限于指定输入合同、有限枚举、往返恢复、错误拒绝与精确账单；没有真实文件压缩率、训练效果或运行性能保证。内容状态保留 **`needs-independent-review`**；作者核验和独立内容／数值复核均不等于专家认证。
