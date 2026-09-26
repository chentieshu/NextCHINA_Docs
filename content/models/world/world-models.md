> **一句话理解：**World Model 试图学习“世界状态怎样随行动和时间变化”。它的目标不只是生成像真的内容，而是形成可用于预测、规划和控制的内部环境模型。

## 1. 世界模型学什么？

状态 \(s_t\)、行动 \(a_t\) 下：

\[
p(s_{t+1}|s_t,a_t)
\]

如果还预测 observation 与 reward：

\[
p(o_{t+1},r_{t+1},s_{t+1}|s_t,a_t)
\]

它允许 Agent 在真正行动之前预测未来。

## 2. 为什么需要 Latent State？

真实 observation 太高维。

先编码：

\[
z_t=E(o_t)
\]

再学习 dynamics：

\[
z_{t+1}=F(z_t,a_t)
\]

这样规划可以在更紧凑的 latent space 中进行。

## 3. Dreamer 路线

Dreamer 在 learned latent dynamics 中进行 imagined rollouts，再学习 policy/value。[1]

~~~text
Environment → Observation → Encoder → Latent State
                                      ↓
                                  World Model
                                      ↓
                               Imagined Futures
                                      ↓
                                 Policy / Value
~~~

## 4. Video Model 与 World Model 的区别

视频模型可能学习：

\[
p(video|prompt)
\]

World Model 更强调：

\[
p(future|state,action)
\]

也就是 action-conditioned dynamics。

“生成一个推倒杯子的视频”与“机器人执行推杯动作后准确预测下一状态”不是同一个要求。

## 5. LLM 是 World Model 吗？

LLM 参数包含大量世界统计规律，也能做文字模拟，但这不自动意味着它拥有完整、物理一致、可控制的世界状态。

World Model 更强调：

- persistent state；
- dynamics；
- action consequence；
- spatial consistency；
- planning。

## 6. 为什么它对 Agent 重要？

没有可靠模型：

~~~text
Action → 真实环境 → Observation
~~~

有 world model：

~~~text
Candidate Actions
 ↓
Internal Rollouts
 ↓
Compare Futures
 ↓
Choose Action
~~~

这会把 Agent 从单纯反应式工具调用推进到 model-based planning。

## 7. 最大困难

真实世界有 partial observability、随机性、隐藏变量、多尺度时间和复杂物理。

一个能生成漂亮视频的模型仍可能物体消失、违反守恒、因果错误或长期状态漂移。

因此“生成模型 = 世界模拟器”需要非常谨慎地定义。

## 参考资料

1. Hafner et al., Dream to Control: Learning Behaviors by Latent Imagination, 2019 — https://arxiv.org/abs/1912.01603
2. Ha & Schmidhuber, World Models, 2018 — https://arxiv.org/abs/1803.10122
3. LeCun, A Path Towards Autonomous Machine Intelligence, 2022 — https://openreview.net/forum?id=BZ5a1r-kVsf
