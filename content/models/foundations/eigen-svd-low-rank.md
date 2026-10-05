> **本页解决的问题**：矩阵什么时候能拆成互不干扰的方向？为什么有的方阵不能做特征对角化，却仍有 SVD？只留下最大的几个奇异值，究竟丢掉多少？
>
> 前置是[向量、矩阵与张量形状](?view=garden&scope=branch:llm:math/tensor-shapes)中的乘法、转置、点积和 L2 长度。本页会用实际运算补上基、秩与正交坐标，不要求先学行列式。全文讨论实矩阵；例子是明确给出的教学数字。程序只核验给定的精确有理数薄 SVD 并截断，不求解一般矩阵的 SVD。

## 1. 从两列的组合，看见“独立方向”

前一课为模型表示使用行向量 $xW$。本课使用列向量 $Ax$：若原来的行输入是 $x_{\rm row}$，令 $x=x_{\rm row}^T$、$A=W^T$，便有 $(x_{\rm row}W)^T=Ax$。这是同一变换的转置写法，不是更换了数学规则。

取一个把二维输入变成三维输出的矩阵：

$$
A=\begin{bmatrix}3&0\\4&0\\0&2\end{bmatrix},
\qquad x=\begin{bmatrix}a\\b\end{bmatrix}.
$$

乘法可以按列读：

$$
Ax=a\begin{bmatrix}3\\4\\0\end{bmatrix}
+b\begin{bmatrix}0\\0\\2\end{bmatrix}.
$$

例如输入 $(2,-1)^T$ 得到 $(6,8,-2)^T$。改变 $a,b$，便得到两列的所有**线性组合**；这些输出组成的集合叫列空间，也就是两列所**张成**的空间。

两列是否在重复提供同一个方向？令它们的组合为零，第一坐标给出 $3a=0$，第三坐标给出 $2b=0$，所以只能 $a=b=0$。这叫**线性无关**。两列已经张成整个列空间，而且没有冗余，是这个空间的一组**基**；独立方向数为 2，因此 $\operatorname{rank}(A)=2$。

如果改成 $C=\begin{bmatrix}3&6\\4&8\\0&0\end{bmatrix}$，第二列就是第一列的两倍。输出变为 $(a+2b)(3,4,0)^T$，只有一个独立方向，故秩为 1。两者都是有两根轴的矩阵，形状也同为 $3\times2$；**矩阵秩与张量轴数不是同一个量**。另外，$A$ 的列空间只有两个独立方向，并非整个三维输出空间；例如 $(1,0,0)^T$ 不在其中。

## 2. 正交基为什么让坐标容易分开？

把两列除以各自长度，得到

$$
u_1=\begin{bmatrix}3/5\\4/5\\0\end{bmatrix},
\qquad u_2=\begin{bmatrix}0\\0\\1\end{bmatrix}.
$$

它们各自长度为 1，而且 $u_1^Tu_2=0$。长度为 1 叫单位向量，点积为零叫正交；两者合在一起叫**正交归一**。现在 $Ax=5a\,u_1+2b\,u_2$，把输出与 $u_1,u_2$ 分别点积，便直接读出坐标 $5a,2b$。

还可以补上 $u_3=(-4/5,3/5,0)^T$。它与前两者都正交，长度也为 1。于是 $Q=[u_1\ u_2\ u_3]$ 是三维空间的正交基矩阵：

$$
Q^TQ=QQ^T=I_3,\qquad y=Qc,\qquad c=Q^Ty.
$$

这里 $I_3$ 是“输入什么就输出什么”的单位矩阵。例如 $y=(3,4,2)^T$ 的新坐标是 $c=(5,2,0)^T$。原长度平方 $3^2+4^2+2^2=29$，新长度平方 $5^2+2^2=29$。一般地，$\|Qc\|_2^2=c^TQ^TQc=c^Tc$，所以这样的坐标转换保持长度；它可能包含反射，不必都是旋转。

若只保留 $U_q=[u_1\ u_2]$，它的形状为 $3\times2$，则只有

$$
\begin{gathered}
U_q^TU_q=I_2,\\
U_qU_q^T=\begin{bmatrix}
9/25&12/25&0\\
12/25&16/25&0\\
0&0&1
\end{bmatrix}\ne I_3.
\end{gathered}
$$

两列是其列空间的正交基，不能撤销所有三维向量上的操作。例如 $U_q^Tu_3=0$，再乘回 $U_q$ 仍是零，已经找不回 $u_3$。一般矩形列正交矩阵不能随意当作方阵正交矩阵使用。

稍后还会反复使用**外积**。若 $u$ 有 $m$ 个坐标，$v$ 有 $n$ 个坐标，$uv^T$ 是 $m\times n$ 矩阵，元素为 $u_i v_j$，而不是点积标量。其作用是 $uv^Tx=u(v^Tx)$：先取一个坐标，再沿 $u$ 输出。只要 $u,v$ 都非零，输出只有一个独立方向，秩就是 1。

## 3. 特征分解：同一个空间里的特殊方向

对方阵 $M\in\mathbb R^{n\times n}$，非零向量 $v$ 满足

$$
Mv=\lambda v
$$

时，$v$ 是特征向量，$\lambda$ 是特征值。它沿这条直线只做伸缩；负值还会反向，零值则把向量送到零。排除 $v=0$，是因为零向量对任意 $\lambda$ 都满足等式，无法指定特征方向。这个定义要求输入和输出处在同一维空间；不能把 $3\times2$ 的 $Ax$ 与原来的二维 $x$ 直接写成这样的等式。

先算一个实对称例子：

$$
S=\begin{bmatrix}2&1\\1&2\end{bmatrix}.
$$

直接乘得 $S(1,1)^T=3(1,1)^T$，以及 $S(1,-1)^T=(1,-1)^T$。两条方向正交，除以 $\sqrt2$ 后组成

$$
Q=\frac1{\sqrt2}\begin{bmatrix}1&1\\1&-1\end{bmatrix},
\qquad \Lambda=\operatorname{diag}(3,1).
$$

这里 $\operatorname{diag}$ 表示把给出的数放在对角线上，其余位置为零。先换到 $Q$ 的坐标，再分别乘 3 和 1，最后换回来：

$$
S=Q\Lambda Q^T
=\frac12\left(
3\begin{bmatrix}1&1\\1&1\end{bmatrix}
+\begin{bmatrix}1&-1\\-1&1\end{bmatrix}
\right).
$$

**实对称谱定理**说明：任意实对称 $n\times n$ 矩阵都存在由 $n$ 个实正交归一特征向量组成的 $Q$，使 $S=Q\Lambda Q^T$，$\Lambda$ 的元素为实数。这是一般定理，不是刚才一个算例的归纳。[Boyd，EE263，讲义 15–2、15–3](https://ee263.stanford.edu/archive/ee263_course_reader.pdf)

可以验证其中一部分原因：若 $Sv_i=\lambda_i v_i$、$Sv_j=\lambda_j v_j$，由对称性，

$$
\lambda_j v_i^Tv_j
=v_i^TSv_j
=(Sv_i)^Tv_j
=\lambda_i v_i^Tv_j.
$$

当两个特征值不同时，必有 $v_i^Tv_j=0$。但这个等式**没有证明所有需要的特征向量一定存在**，遇到重复特征值时也不能推出任意选择都正交。完整基的存在性及重复值内部能选择正交基，使用上面的谱定理；本页不把这一小段当作完整证明。

本页的特征对角化限定在实数范围。实的非对称矩阵也可能需要复特征值与复向量，那部分不在本课范围内。一般方阵没有对称条件时，要先有 $n$ 个独立的实特征向量。把它们并成可逆矩阵 $P$，才有

$$
MP=P\Lambda,\qquad M=P\Lambda P^{-1}.
$$

$P^{-1}$ 是撤销这次可逆坐标转换的逆矩阵；一般不等于 $P^T$。这就是可对角化的条件，不是任意方阵的默认属性。[Boyd，讲义 11–19 至 11–22](https://ee263.stanford.edu/archive/ee263_course_reader.pdf)

例如 $J=\begin{bmatrix}1&1\\0&1\end{bmatrix}$。设特征向量为 $(x,y)^T$，等式给出

$$
x+y=\lambda x,\qquad y=\lambda y.
$$

如果 $y\ne0$，第二式强迫 $\lambda=1$，第一式又强迫 $y=0$，矛盾。因此 $y=0$；非零要求 $x\ne0$，再得 $\lambda=1$。所有特征向量都沿第一轴，凑不出二维基。这个方阵不能特征对角化。

## 4. SVD：输入与输出允许各用一套方向

特征对角化失败，不等于矩阵无法分解。**任意实 $m\times n$ 矩阵都有奇异值分解**：

$$
A=U\Sigma V^T.
$$

完整形式中，$U$ 为 $m\times m$ 正交矩阵，$V$ 为 $n\times n$ 正交矩阵，$\Sigma$ 为 $m\times n$。令 $q=\min(m,n)$，其对角线上有 $q$ 个非负数，按 $\sigma_1\ge\cdots\ge\sigma_q\ge0$ 排列，其余位置为零。它们叫奇异值。[SLEPc 官方手册，标准 SVD，式 (1)–(5)](https://slepc.upv.es/release/documentation/manual/svd.html)

这次先用 $V^T$ 读输入坐标，再由 $\Sigma$ 伸缩和改变维度，最后用 $U$ 写回输出坐标。输入方向 $v_i\in\mathbb R^n$ 与输出方向 $u_i\in\mathbb R^m$ 不必是同一个向量。对 $1\le i\le q$：

$$
Av_i=\sigma_i u_i\in\mathbb R^m,
\qquad A^Tu_i=\sigma_i v_i\in\mathbb R^n.
$$

因此 $A^TA v_i=\sigma_i^2v_i$。这是特征值与奇异值的一条联系，**不是说 $A$ 的特征值等于奇异值**。对实对称 $S$，才可以用 $S^TS=Q\Lambda^2Q^T$ 推出奇异值是特征值的绝对值，再重新排序。

例如 $T=\begin{bmatrix}0&1\\1&0\end{bmatrix}$ 的两条特征方向仍为 $(1,1)^T$ 与 $(1,-1)^T$，特征值分别为 1、$-1$；奇异值却都是 1。取 $U=T$、$\Sigma=I_2$、$V=I_2$ 就是一份 SVD，符号由方向承担。

连前面的不可对角化矩阵 $J$ 也有 SVD。令

$$
\varphi=\frac{1+\sqrt5}{2},\qquad
 d=\sqrt{1+\varphi^2},
\qquad \varphi^2=\varphi+1.
$$

取两组方向与非负伸缩量：

$$
v_1=\frac1d\begin{bmatrix}1\\\varphi\end{bmatrix},
\qquad v_2=\frac1d\begin{bmatrix}-\varphi\\1\end{bmatrix},
$$

$$
\begin{gathered}
u_1=\frac1d\begin{bmatrix}\varphi\\1\end{bmatrix},
\qquad u_2=\frac1d\begin{bmatrix}-1\\\varphi\end{bmatrix},\\
(\sigma_1,\sigma_2)=(\varphi,\varphi^{-1}).
\end{gathered}
$$

各组点积为零、长度为 1；又有

$$
\begin{gathered}
Jv_1=\frac1d\begin{bmatrix}1+\varphi\\\varphi\end{bmatrix}
=\varphi u_1,\\
Jv_2=\frac1d\begin{bmatrix}1-\varphi\\1\end{bmatrix}
=\varphi^{-1}u_2.
\end{gathered}
$$

这里用了 $\varphi-1=\varphi^{-1}$。两条 $v_i$ 已组成输入基，所以这两次运算确定了整个变换，得到 $J=U\operatorname{diag}(\varphi,\varphi^{-1})V^T$。这是根式的精确代数核对，不是后面有理数程序求出来的结果。

## 5. full、thin、rank-compact、truncated 究竟差在哪？

名称在资料中可能有不同习惯，先查尺寸最稳妥。本页固定 $q=\min(m,n)$、$r=\operatorname{rank}(A)$，使用以下约定：[SLEPc，thin 与 compact 说明](https://slepc.upv.es/release/documentation/manual/svd.html)

- **full，完整**：$U$ 是 $m\times m$，$\Sigma$ 是 $m\times n$，$V$ 是 $n\times n$；包括补齐空间的方向，精确恢复 $A$
- **thin / reduced，薄**：$U_q$ 是 $m\times q$，$\Sigma_q$ 是 $q\times q$，$V_q$ 是 $n\times q$；保留 $q$ 个奇异值，包括零，仍精确恢复 $A$
- **rank-compact，秩紧致**：$U_r$ 是 $m\times r$，$\Sigma_r$ 是 $r\times r$，$V_r$ 是 $n\times r$；只保留严格正奇异值，仍精确恢复 $A$
- **truncated，截断**：给定 $0\le k\le q$，保留前 $k$ 项；因子尺寸为 $m\times k$、$k\times k$、$n\times k$。若 $k<r$ 必有误差；若 $k\ge r$ 则精确恢复。$k=0$ 解释为空和，即零矩阵

回到 $A=\begin{bmatrix}3&0\\4&0\\0&2\end{bmatrix}$，令 $v_1=(1,0)^T$、$v_2=(0,1)^T$，于是

$$
A=5u_1v_1^T+2u_2v_2^T,
\qquad (\sigma_1,\sigma_2)=(5,2).
$$

完整分解用第 2 节的三列 $U=[u_1\ u_2\ u_3]$、$V=I_2$，以及

$$
\Sigma=\begin{bmatrix}5&0\\0&2\\0&0\end{bmatrix}.
$$

薄分解删除 $U$ 的第三列和 $\Sigma$ 的第三行。这里 $q=r=2$，薄分解与秩紧致分解恰好相同。

若把 $A$ 右下的 2 改成 0，秩变为 1，薄分解仍保留 $(5,0)$ 与两组方向；秩紧致分解只剩第一项。零矩阵的 $r=0$，秩紧致形式为空和；薄分解仍有 $q$ 个零奇异值与正交归一方向。**薄不等于已经去掉所有零模式**。

方阵时 $m=n=q$，full 与 thin 的尺寸本来就相同，不能仅凭这两个名称断言尺寸有错。真正的长方矩阵才会在至少一侧显出尺寸差别。实际接口也常返回 $V^T$，以及长度为 $q$ 的数列 `s`，不是完整的 $\Sigma$ 矩阵；例如 NumPy 官方文档用 `Vh`、`s`，并明确区分 `full_matrices` 两种尺寸。[NumPy `linalg.svd`](https://numpy.org/doc/stable/reference/generated/numpy.linalg.svd.html)

## 6. 丢掉一项：先说明用哪把尺子

保留前 $k$ 项，定义

$$
A_k=\sum_{i=1}^k\sigma_i u_i v_i^T.
$$

每项输出都沿某个 $u_i$，所以 $A_k$ 的秩不超过 $k$。主例取 $k=1$：

$$
A_1=\begin{bmatrix}3&0\\4&0\\0&0\end{bmatrix},
\qquad A-A_1=\begin{bmatrix}0&0\\0&0\\0&2\end{bmatrix}.
$$

**Frobenius 范数**把所有矩阵元素当成一条长向量再算 L2 长度：

$$
\|E\|_F^2=\sum_{i,j}E_{ij}^2,
\qquad \|E\|_F=\sqrt{\sum_{i,j}E_{ij}^2}.
$$

因此这里平方误差是 4，误差是 2；不要把两者都称为“误差 4”。全不保留时平方误差为 $3^2+4^2+2^2=29$，两项全保留时为 0。

为什么不会有另一张秩不超过 1 的矩阵做得更好？在**这个例子**中，可以直接给下界。任意这样的 $B$ 的两列相关，存在非零 $z$ 使 $Bz=0$，再把 $z$ 归一化为 $z_1^2+z_2^2=1$。逐行用点积的平方不超过“行长度平方 × $z$ 长度平方”，得到

$$
\begin{aligned}
\|A-B\|_F^2
&\ge \|(A-B)z\|_2^2\\
&=\|Az\|_2^2\\
&=25z_1^2+4z_2^2\ge4.
\end{aligned}
$$

$A_1$ 达到了下界，所以最优。这个小证明没有覆盖任意尺寸与任意 $k$。

一般的截断 SVD 最优近似定理说明：在所有 $\operatorname{rank}(B)\le k$ 的矩阵中，$A_k$ 达到最小 Frobenius 误差：

$$
\min_{\operatorname{rank}(B)\le k}\|A-B\|_F
=\|A-A_k\|_F
=\sqrt{\sum_{i=k+1}^{q}\sigma_i^2}.
$$

这里使用一般定理；$k=0$ 与 $k\ge r$ 的边界也可直接按零矩阵和精确重建核对。[Townsend 与 Trefethen，§2，式 (2.4)–(2.7)](https://people.maths.ox.ac.uk/trefethen/publication/PDF/2014_151.pdf) [MIT 18.065 第 7 讲摘要](https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/resources/lecture-7-eckart-young-the-closest-rank-k-matrix-to-a/)

尾部平方和为何出现，也能单独核对。把矩阵内积定义为逐元素乘积之和，则两个外积项的内积为

$$
\langle u_iv_i^T,u_jv_j^T\rangle_F
=(u_i^Tu_j)(v_i^Tv_j).
$$

不同项为零，同一项为 1。因此相加后的残差平方范数没有交叉项，正好等于丢掉的 $\sigma_i^2$ 之和。这个计算证明了**给定截断的误差公式**；“没有别的低秩矩阵更好”仍是定理的另一层结论。

另一把尺子是**算子 2-范数／谱范数**，看单位输入上最大的输出长度：

$$
\|E\|_2=\max_{\|x\|_2=1}\|Ex\|_2.
$$

残差沿互相正交的奇异方向伸缩，所以当 $k<q$ 时，它的这个误差为 $\sigma_{k+1}$；可沿 $v_{k+1}$ 达到最大值。当 $k=q$ 时没有尾项，误差为 0，不去索引不存在的第 $q+1$ 项。对 $D=\operatorname{diag}(3,2,1)$、$k=1$，Frobenius 误差是 $\sqrt{2^2+1^2}=\sqrt5$，谱范数误差是 2。主例只丢一项，两把尺子恰巧相等，不能据此混用公式。

## 7. 不唯一：数值相同，不代表方向写法相同

奇异值按降序排列后是确定的，但方向不必唯一。[Townsend 与 Trefethen，§2](https://people.maths.ox.ac.uk/trefethen/publication/PDF/2014_151.pdf)

1. **正奇异值的成对变号**：$\sigma_i(-u_i)(-v_i)^T=\sigma_i u_iv_i^T$。同时改左右符号不影响重建或任何截断；只改一边则改变这一非零项，不能继续声称是同一份证书
2. **重复正奇异值的共同换基**：若一组值都等于 $s$，用同一个正交矩阵 $R$ 改变这一组左右方向，得到 $(U_bR)(sI)(V_bR)^T=U_b(sI)V_b^T$。因子改变，整组重建不变
3. **零模式的更多自由**：对应项本来就是零，只翻其中一侧的符号仍合法；零空间内部也可分别选择正交基，但必须保留全部因子的正交性

对固定的矩阵与 $k$，比较由不同合法 SVD 截断得到的矩阵：成对变号总会抵消；只有**截断恰好切开重复的正奇异值**时，才可能得到不同结果。下面用 Frobenius 准则核对它们同样最优；这不是对谱范数下所有最优近似的唯一性断言。例如 $I_2$ 的两个奇异值都是 1，$k=1$ 时保留第一轴或第二轴，分别得到 $\operatorname{diag}(1,0)$ 与 $\operatorname{diag}(0,1)$；两者的 Frobenius 平方误差都是 1。更一般地，任意单位向量 $w$ 给出的 $ww^T$ 也达到 1。

所以核验 SVD 应检查正交性、重建和误差等不变量，不能规定所有实现必须输出同一组奇异向量条目。

## 8. 可运行实验：给我一份证书，我精确核验

下面唯一公共接口是 `audit_svd(a, u, singular_values, vt, k)`。调用者先给出一份薄 SVD，程序核验它，再返回前 $k$ 项；**它不会从 `a` 求出分解**。

输入合同：

- `a` 是 $m\times n$，$1\le m,n\le4$，令 $q=\min(m,n)$；`u` 必须为 $m\times q$，`singular_values` 长度为 $q$，`vt` 为 $q\times n$
- 外层容器、矩阵行和奇异值序列只能是内置 `list` 或 `tuple`；每个标量只能是内置 `int` 或恰为 `fractions.Fraction`，拒绝布尔值、子类、浮点数、字符串、Decimal 和迭代器
- 每个最简分数的分子绝对值、分母都不超过 $2^{20}$；整数也按分母 1 接受同一限制。先验证所有输入标量，再做矩阵算术。这是教学资源上限，不是 SVD 的数学限制
- 奇异值非负、非递增；`k` 是内置整数且 $0\le k\le q$。严格验证列／行正交归一及完整重建，不偷偷排序、归一化或用容差接纳错误证书
- 所有值、类型、尺寸、证书错误统一抛出 `ValueError`；缺参等 Python 调用语法错误仍按语言规则处理；不处理调用期间其他线程改动输入

返回字典恰有四项：`rank` 是严格正奇异值数；`approximation` 是由 `Fraction` 构成的不可变元组矩阵；`residual_squared` 从实际逐元素残差独立计算；`tail_squared` 从舍弃奇异值独立计算。后二者应该精确相等，但代码没有只算一个再复制给另一个。

有理矩阵未必有全有理数的 SVD 因子。$J$ 的奇异值就是无理数，连 $S$ 的单位特征向量也用到了 $\sqrt2$。因此这套接口不承诺每个有理矩阵都能交来可接受的证书；程序拒绝一种表示，不代表数学分解不存在。精确分数运算见 [Python fractions 文档](https://docs.python.org/3.14/library/fractions.html)。

```python
# nextchina-example: eigen-svd-low-rank
from fractions import Fraction


def _svd_sequence(value, name):
    if type(value) not in (list, tuple):
        raise ValueError(name + " must be a built-in list or tuple")
    return value


def _svd_scalar(value):
    if type(value) not in (int, Fraction):
        raise ValueError("scalars must be exact int or Fraction")
    if type(value) is int:
        numerator, denominator = value, 1
    else:
        numerator, denominator = value.numerator, value.denominator
    if abs(numerator) > 2**20 or denominator > 2**20:
        raise ValueError("scalar numerator or denominator exceeds limit")
    return Fraction(value)


def _svd_matrix(value, rows=None, columns=None):
    _svd_sequence(value, "matrix")
    if not 1 <= len(value) <= 4:
        raise ValueError("matrix row count must be 1..4")
    _svd_sequence(value[0], "row")
    width = len(value[0])
    if not 1 <= width <= 4:
        raise ValueError("matrix column count must be 1..4")
    if rows is not None and len(value) != rows:
        raise ValueError("wrong row count")
    if columns is not None and width != columns:
        raise ValueError("wrong column count")
    result = []
    for row in value:
        _svd_sequence(row, "row")
        if len(row) != width:
            raise ValueError("ragged matrix")
        result.append(tuple(_svd_scalar(x) for x in row))
    return tuple(result)


def audit_svd(a, u, singular_values, vt, k):
    """Verify supplied rational thin factors; return exact truncation data."""
    a = _svd_matrix(a)
    m, n = len(a), len(a[0])
    q = min(m, n)
    u = _svd_matrix(u, m, q)
    vt = _svd_matrix(vt, q, n)
    _svd_sequence(singular_values, "singular_values")
    if len(singular_values) != q:
        raise ValueError("thin SVD needs q singular values")
    s = tuple(_svd_scalar(x) for x in singular_values)
    if type(k) is not int or not 0 <= k <= q:
        raise ValueError("k must be a built-in int in 0..q")
    if any(x < 0 for x in s):
        raise ValueError("singular values must be nonnegative")
    if any(s[i] < s[i + 1] for i in range(q - 1)):
        raise ValueError("singular values must be nonincreasing")

    # Every input scalar is validated before these matrix operations.
    zero = Fraction(0)
    for i in range(q):
        for j in range(q):
            left = sum((u[t][i] * u[t][j] for t in range(m)), zero)
            right = sum((vt[i][t] * vt[j][t] for t in range(n)), zero)
            if left != int(i == j) or right != int(i == j):
                raise ValueError("factors are not orthonormal")

    def entry(i, j, count):
        return sum((u[i][t] * s[t] * vt[t][j]
                    for t in range(count)), zero)

    for i in range(m):
        for j in range(n):
            if a[i][j] != entry(i, j, q):
                raise ValueError("certificate does not reconstruct a")
    approximation = tuple(
        tuple(entry(i, j, k) for j in range(n)) for i in range(m)
    )
    residual_squared = sum(
        ((a[i][j] - approximation[i][j]) ** 2
         for i in range(m) for j in range(n)), zero
    )
    tail_squared = sum((x * x for x in s[k:]), zero)
    return {
        "rank": sum(x > 0 for x in s),
        "approximation": approximation,
        "residual_squared": residual_squared,
        "tail_squared": tail_squared,
    }


# Exact checks of unnormalized eigenvectors do not require sqrt(2).
S = ((2, 1), (1, 2))
for vector, eigenvalue in (((1, 1), 3), ((1, -1), 1)):
    product = tuple(sum(S[i][j] * vector[j] for j in range(2))
                    for i in range(2))
    assert product == tuple(eigenvalue * x for x in vector)

A = ((3, 0), (4, 0), (0, 2))
U = ((Fraction(3, 5), 0), (Fraction(4, 5), 0), (0, 1))
VT = ((1, 0), (0, 1))
for keep in (0, 1, 2):
    report = audit_svd(A, U, (5, 2), VT, keep)
    assert report["residual_squared"] == (29, 4, 0)[keep]
    assert report["tail_squared"] == report["residual_squared"]
    print("k =", keep, "rank =", report["rank"],
          "squared error =", report["residual_squared"])

D = ((3, 0, 0), (0, 2, 0), (0, 0, 1))
I3 = ((1, 0, 0), (0, 1, 0), (0, 0, 1))
assert audit_svd(D, I3, (3, 2, 1), I3, 1)["tail_squared"] == 5
print("diag(3, 2, 1), k = 1: squared Frobenius error = 5")
```

输出为：

- `k = 0 rank = 2 squared error = 29`
- `k = 1 rank = 2 squared error = 4`
- `k = 2 rank = 2 squared error = 0`
- `diag(3, 2, 1), k = 1: squared Frobenius error = 5`

第一段另核对 $S$ 的两个未归一特征对；它不需要把 $1/\sqrt2$ 近似成分数。`rank` 指原矩阵的精确秩，不随截断参数变化。程序没有用 NumPy、SciPy，也没有检验它们的求解结果。

工程里通常需要受维护的数值库，并说明浮点容差。上面的 $A^TA$ 恒等式适合解释联系，不是推荐手写“先形成 Gram 矩阵再求特征值”的通用数值求解器：这种路线可能严重损失很小奇异值的精度；SLEPc 官方手册也说明了交叉乘积路线的这一边界。[SLEPc，Equivalent Eigenvalue Problems](https://slepc.upv.es/release/documentation/manual/svd.html) 精确的零与很小的非零值在这里完全不同；实际“数值秩”还依赖容差和任务。表示、舍入与容差请回到[浮点数基础](?view=garden&scope=branch:llm:math/floating-point)。

## 9. 低秩并不自动节省存储，也不保证任务效果

若稠密保存 $U_k$、$k$ 个奇异值和 $V_k$，需要

$$
mk+k+nk=k(m+n+1)
$$

个标量；原矩阵需要 $mn$ 个。主例 $m=3,n=2,k=1$，两者都是 6，所以这次低秩操作没有按这个口径节省标量。即使大矩阵满足 $k(m+n+1)<mn$，也还没核算每个数的精度、字节编码、维度元数据与格式开销，不能直接报成文件压缩比。

计算也要说明条件。已知这些因子时，先算 $V_k^Tx$、逐项缩放、再算 $U_k$ 乘积，可按约 $kn+k+mk$ 次标量乘法计账；直接稠密乘法约为 $mn$ 次。这个粗计数没有包含求分解、存储布局与实际硬件耗时，玩具例子不构成加速测评。

更重要的是，Frobenius 最优在乎**矩阵元素的总平方误差**。它没有看类别标签、语义或任务损失。主例截断后，输入 $(0,1)^T$ 与 $(0,-1)^T$ 都得到零输出，而原输出分别为 $(0,0,2)^T$ 与 $(0,0,-2)^T$。如果任务恰好判断第二个输入坐标的正负，这个截断已经丢掉了所需区别。少保留一项、矩阵误差小、任务仍能做好，需要分别检查。

## 10. 迁移练习与继续阅读

**练习一：只有一个非零模式。** 把主例右下元素改成零，分别取 $k=0,1,2$。原矩阵秩、平方误差与薄分解列数是什么？

**解析：** 原矩阵秩恒为 1；三个平方误差依次为 25、0、0。薄分解仍有 $q=2$ 列；只保留非零模式的秩紧致分解才是 1 列。`k` 与原矩阵秩是不同信息。

**练习二：负号属于谁？** $T=\begin{bmatrix}0&1\\1&0\end{bmatrix}$ 的特征值为 $1,-1$，能否把奇异值也填成 $(1,-1)$？

**解析：** 不能，奇异值非负。可以使用 $U=T$、`s=(1,1)`、$V=I_2$。平方误差公式使用奇异值，不是任意方阵的特征值排序。

**练习三：两种误差门槛。** 对 $D=\operatorname{diag}(3,2,1)$，要求 Frobenius 误差不超过 2，保留一项够吗？

**解析：** 不够，因为 $\sqrt5>2$；保留两项时误差为 1。若改成谱范数误差不超过 2，则保留一项已经满足。先明确范数，再选 $k$。

继续阅读：

- 回到[向量、矩阵与张量形状](?view=garden&scope=branch:llm:math/tensor-shapes)，核对行列约定与每根轴的含义
- 回到[浮点数基础](?view=garden&scope=branch:llm:math/floating-point)，区分精确恒等式、存储值和数值验收
- [PCA 概念入口](?view=garden&scope=concept:pca)与 [LoRA 概念入口](?view=garden&scope=concept:lora)是相关后续方向；本页没有完成它们的数据预处理、训练方法或任务评价，也不据此领取这些概念的教学覆盖

## 来源、版本与验证边界

访问核验日期为 **2026-10-05**，不是网页的出版日期。例子的整数、分数、根式运算和存储账单均在本页展开，可以独立复算。

1. Stephen Boyd，[Lecture Notes for EE263](https://ee263.stanford.edu/archive/ee263_course_reader.pdf)，封面 **Autumn 2008–09**。使用 11–19 至 11–22 的可对角化条件、15–2 至 15–7 的实对称矩阵性质与正交基。读取 PDF 文本；不声称完成整套讲义或视觉页面审阅
2. Alex Townsend、Lloyd N. Trefethen，[Continuous analogues of matrix factorizations](https://people.maths.ox.ac.uk/trefethen/publication/PDF/2014_151.pdf)，仅使用有限矩阵的 §2、式 (2.4)–(2.7)。本文是作者托管版本；一般低秩定理有来源支持，本页算例的检查不代替普遍证明
3. [SLEPc 标准 SVD 手册](https://slepc.upv.es/release/documentation/manual/svd.html)，读取时页面显示 **3.26.0**。使用标准 SVD 的尺寸、薄／秩紧致约定，以及交叉乘积路线的数值警告；`release` 地址随版本变化
4. [NumPy `numpy.linalg.svd`](https://numpy.org/doc/stable/reference/generated/numpy.linalg.svd.html)，读取时页面显示 **v2.5 Manual**。只核对 `full_matrices`、返回 `s` / `Vh` 的文档约定；未安装或执行该库，`stable` 地址随版本变化
5. Gilbert Strang，[MIT 18.065 第 7 讲](https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/resources/lecture-7-eckart-young-the-closest-rank-k-matrix-to-a/)，课程 **Spring 2018**。读取课程摘要，辅助核对低秩最优性与 Frobenius 定义；没有观看视频或宣称读过配套教材章节
6. [Python 3.14 `fractions`](https://docs.python.org/3.14/library/fractions.html)，核对精确有理数及约分后分子／分母的语义；接口限制比标准库本身更窄

本页仅覆盖特征分解与 SVD 的这一基础单元。没有实现通用特征值／SVD 求解器、伪逆、最小二乘、随机化分解或模型训练；没有真实数据或性能测评。代码回归、来源核查、结构验收与独立专家认证是不同层次；单元审阅状态保持 `needs-independent-review`，不把有限算例运行说成一般稳定性或专家认证。
