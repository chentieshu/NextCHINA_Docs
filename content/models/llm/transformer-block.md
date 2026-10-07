> **本页解决的问题**：Attention 之外，一个 Transformer 块还有什么？为什么组成关系不同于“阅读时放在同一个目录”？
>
> 本页把原始后归一化结构作为明确参照，不把所有现代变体等同于它。数值例子只执行 FFN、残差与归一化子链；完整 Attention 运算复用已有文章，而不是复制另一份实现。尚待独立审核。

## 1. 先分清结构与数据

Transformer 是架构家族，不是某个商业产品或检查点。原始编码器层组合多头自注意力、逐位置前馈网络、残差与 LayerNorm；解码器还包含因果掩码以及连接编码器输出的交叉注意力。[1]

输入隐藏状态可写作 $X\in\mathbb{R}^{B\times N\times d}$。Attention 混合序列位置的信息；逐位置 FFN 作用于每个位置的特征向量。在本文参照结构中，层输出仍为 $B\times N\times d$，并不直接成为自然语言答案。输出头和解码策略另有职责。

## 2. 组成关系与使用关系

在限定的原始结构中，可以声明“多头注意力 `part_of` Transformer”“FFN `part_of` Transformer”。而“自注意力 `uses` 矩阵乘法”“自注意力 `uses` Softmax”表达实际运算。专题入口引用这些概念只是 `references`，不能代替机制关系。

不要声明“RoPE 属于所有 Transformer”：原论文采用的位置编码与 RoPE 不同。也不要把 KV Cache 当作所有训练步骤中的固定架构部件；它是某些推理实现的运行状态。相关边需要注明实现和阶段。[1]

## 3. 形状怎样闭合

原始前馈子层可写为：

$$
\operatorname{FFN}(x)=\max(0,xW_1+b_1)W_2+b_2
$$

其中 $W_1\in\mathbb{R}^{d\times d_f}$、$W_2\in\mathbb{R}^{d_f\times d}$。中间维度可以扩展，最终必须回到 $d$，否则无法与 $x$ 逐元素相加。本文后归一化参照为：

$$
y=\operatorname{LayerNorm}(x+\operatorname{FFN}(x))
$$

归一化按每个位置的特征维度计算，而不是把所有位置或整个批次混在一起。LayerNorm 的可学习缩放和平移通常存在；为隔离计算，本例固定为 1 和 0。[1][2]

## 4. 两维手算与代码

自定 $x=(1,2)$，令第一层输出 $(x_1+x_2,x_1-x_2)$，第二层为恒等变换。ReLU 得 $(3,0)$，残差和为 $(4,2)$，均值为 3、总体方差为 1。因此输出接近 $(1,-1)$，但包含 $\epsilon$ 时不是恰好这两个数。

```python
# nextchina-example: transformer-block
import math


def layer_norm(values, epsilon=1e-5):
    if not values or not all(math.isfinite(x) for x in values):
        raise ValueError("finite non-empty features required")
    if not math.isfinite(epsilon) or epsilon <= 0:
        raise ValueError("epsilon must be positive")
    mean = sum(values) / len(values)
    variance = sum((x-mean)**2 for x in values) / len(values)
    return [(x-mean) / math.sqrt(variance+epsilon) for x in values]


def ffn_residual_norm(x):
    if len(x) != 2 or not all(math.isfinite(v) for v in x):
        raise ValueError("this teaching FFN expects two finite features")
    hidden = [max(0.0, x[0]+x[1]), max(0.0, x[0]-x[1])]
    residual = [x[i]+hidden[i] for i in range(2)]
    return layer_norm(residual)


y = ffn_residual_norm([1.0, 2.0])
assert abs(y[0]-1/math.sqrt(1+1e-5)) < 1e-12
assert abs(sum(y)) < 1e-12
assert layer_norm([7.0, 7.0]) == [0.0, 0.0]
assert all(abs(a-b) < 1e-12 for a,b in zip(layer_norm([4,2]), layer_norm([14,12])))
assert len(ffn_residual_norm([-1,1])) == 2
print([round(v, 6) for v in y])
```

## 5. 失败边界

这不是可训练 Transformer，没有真实模型权重，没有 Attention，也没有输出头。它验证的是维度闭合和局部数值规律，不能验证语言能力。模型实际使用前归一化、RMSNorm、门控 FFN 或稀疏专家时，需要单独写出公式和关系，不能直接套用本例结果。

即使张量形状正确，也可能有掩码错误、位置处理错误或数值溢出。形状测试是必要检查，不是模型正确性的充分证明。进一步实验应同时检查前缀因果性、批次独立性和误差范围。

## 6. 接回宏观网络

复用方向应当清晰：数学运算解释 Attention；Attention 与 FFN 解释架构块；架构再被特定语言、视觉或生成系统使用；训练目标、推理预算与评测是另外的维度，不应被架构名称吞掉。

继续阅读：[自注意力](?view=garden&scope=concept:self-attention)、[多头注意力](?view=garden&scope=concept:multi-head)、[MLP](?view=garden&scope=concept:mlp)、[残差与归一化](?view=garden&scope=concept:residual-normalization)。

## 来源

[1] Vaswani 等，Attention Is All You Need，§3：https://arxiv.org/html/1706.03762v7

[2] Ba 等，Layer Normalization：https://arxiv.org/abs/1607.06450
