> **一句话理解：**Video Model 的难点不是“连续生成很多图片”，而是同时建模空间、时间、运动、对象持续性、镜头语言和物理变化。

## 1. 视频比图片多了什么？

视频张量：

$$
V\in\mathbb R^{T\times H\times W\times C}
$$

多出的 $T$ 是时间维。

如果每帧有 $N$ 个视觉 patch/token：

$$
N_{video}\approx T\times N
$$

因此视频序列长度非常容易爆炸。

## 2. 视频生成怎样工作？

现代视频模型可以采用 diffusion、flow matching、autoregressive token prediction 或混合路线。

一种 latent diffusion 路线：

~~~text
Video → Video VAE → Latent Video → Add Noise
                         ↓
               Spatiotemporal Model
                         ↓
              Noise / Velocity Prediction
                         ↓
                   Reverse Process
                         ↓
                       Video
~~~

## 3. 时空 Attention

模型既要处理空间关系，也要处理时间关系。

Full spatiotemporal attention 成本高，一些架构会 factorize：

~~~text
Spatial Attention → Temporal Attention
~~~

## 4. 为什么人物会变脸？

单帧合理不代表跨帧一致。

模型还需要维持：

$$
identity(t_1)\approx identity(t_2)\approx...\approx identity(t_T)
$$

同样需要保持衣服、物体、背景和场景状态。

所以视频质量至少包含：

> frame quality + temporal consistency

## 5. Camera Motion 也是状态变化

Pan、tilt、dolly、zoom 会改变整个场景的投影。

模型需要同时学习：

~~~text
Object Motion
+
Camera Motion
+
Scene Geometry
+
Lighting
+
Temporal Causality
~~~

## 6. 为什么长视频特别难？

长度增加意味着更多 token、更长状态依赖和更多累积误差。

如果模型每秒采样 $F$ 个 temporal units、每个单位 $N$ tokens，时长 $S$ 秒：

$$
N_{total}\propto S\times F\times N
$$

所以长视频需要 temporal compression、hierarchical generation、memory 或分段一致性机制。

## 7. Video Model 与 World Model

普通视频生成近似学习：

$$
p(video|condition)
$$

当模型进一步根据 action 预测环境：

$$
p(s_{t+1}|s_t,a_t)
$$

问题就开始靠近 world model。

## 8. 怎么评估？

| 维度 | 问题 |
| --- | --- |
| Visual Quality | 单帧是否稳定 |
| Prompt Alignment | 是否遵循要求 |
| Motion | 动作是否自然 |
| Identity | 人物是否持续一致 |
| Physics | 状态变化是否合理 |
| Camera | 镜头控制是否准确 |
| Duration | 长时间是否崩坏 |
| Audio Sync | 声画是否同步 |

## 参考资料

1. Ho et al., Video Diffusion Models, 2022 — https://arxiv.org/abs/2204.03458
2. Brooks et al., Video generation models as world simulators, 2024 — https://openai.com/research/video-generation-models-as-world-simulators
3. Polyak et al., Movie Gen, 2024 — https://arxiv.org/abs/2410.13720
