> **一句话理解：**Audio Model 不是一种单一模型。语音识别、语音合成、音乐生成和原生语音对话分别对应不同的表示与训练目标，现代多模态模型正在逐渐把它们统一。

## 1. 声音在机器里是什么？

数字音频是随时间采样的波形：

\[
x[n]=x(n/f_s)
\]

\(f_s\) 是 sample rate。16 kHz 意味着每秒 16,000 个采样点。

## 2. 为什么要看频率？

Short-Time Fourier Transform：

\[
X(m,\omega)=\sum_n x[n]w[n-m]e^{-j\omega n}
\]

把局部波形转换为“时间 × 频率”表示。Mel-spectrogram 又进一步接近人类听觉频率尺度。

## 3. ASR：声音怎样变文字？

~~~text
Waveform → Audio Encoder → Acoustic Representation → Decoder / CTC → Text
~~~

Whisper 是大规模弱监督语音识别的重要代表。[1]

## 4. TTS：文字怎样变声音？

~~~text
Text → Semantic / Phonetic Representation → Acoustic Representation → Vocoder → Waveform
~~~

TTS 还要建模 speaker、prosody、emotion、timing，而不只是“读对文字”。

## 5. Neural Audio Codec

EnCodec 等神经 codec 可以把连续波形压缩成离散 acoustic tokens。[2]

~~~text
Audio → Codec Encoder → Discrete Tokens → Transformer
~~~

这使音频也能进入 token-based generative modeling。

## 6. Music Generation

音乐需要同时建模 melody、harmony、rhythm、timbre 与 long-term structure。

MusicGen 展示了基于压缩离散音乐表示与 Transformer 的生成路线。[3]

## 7. 原生语音模型为什么重要？

传统语音助手：

~~~text
Speech → ASR → Text LLM → Text → TTS
~~~

更统一的 speech model：

~~~text
Speech Tokens ↔ Multimodal Model ↔ Speech Tokens
~~~

可以减少文字中间层丢失的语气、停顿、情绪，并降低多阶段延迟。

## 8. 怎么评估？

| 类型 | 关键指标 |
| --- | --- |
| ASR | WER、语言覆盖、噪声鲁棒性 |
| TTS | 自然度、可懂度、speaker similarity、latency |
| Speech-to-Speech | turn latency、情绪/韵律保持 |
| Music | 结构、音质、prompt alignment、主观偏好 |

“听起来像真人”不能代表所有音频能力。

## 参考资料

1. Radford et al., Whisper, 2022 — https://arxiv.org/abs/2212.04356
2. Défossez et al., EnCodec, 2022 — https://arxiv.org/abs/2210.13438
3. Copet et al., MusicGen, 2023 — https://arxiv.org/abs/2306.05284
