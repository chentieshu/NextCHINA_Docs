import type { DocChapter } from '../types';
import articleRegistry from '../../content/articles.json';
import premiumVideoMarkdown from '../../content/tutorials/video/apple-style-premium-product-video.md?raw';
import llmMarkdown from '../../content/models/llm/llm-how-it-works.md?raw';
import vlmMarkdown from '../../content/models/vlm/vlm-how-it-works.md?raw';
import diffusionMarkdown from '../../content/models/generative/diffusion-dit.md?raw';
import embeddingMarkdown from '../../content/models/embedding/embedding-models.md?raw';
import audioMarkdown from '../../content/models/audio/audio-models.md?raw';
import videoMarkdown from '../../content/models/video/video-models.md?raw';
import worldMarkdown from '../../content/models/world/world-models.md?raw';
import tokenization from '../../content/models/llm/tokenization.md?raw';
import softmax from '../../content/models/llm/softmax-temperature.md?raw';
import attention from '../../content/models/llm/attention-calculation.md?raw';
import training from '../../content/models/llm/training-loop.md?raw';
import kvCache from '../../content/models/llm/kv-cache.md?raw';
import tensorShapes from '../../content/models/llm/tensor-shapes.md?raw';
import conditionalProbability from '../../content/models/llm/conditional-probability.md?raw';
import statisticalInferenceConfidenceInterval from '../../content/models/evaluation/statistical-inference-confidence-interval.md?raw';
import trainValidationTestDataLeakage from '../../content/models/evaluation/train-validation-test-data-leakage.md?raw';
import entropyCrossEntropy from '../../content/models/llm/entropy-cross-entropy.md?raw';

import derivatives from '../../content/models/llm/derivatives.md?raw';

const contentById: Record<string, string> = {
  'apple-style-premium-product-video': premiumVideoMarkdown,
  'llm-how-it-works': llmMarkdown,
  'vlm-how-it-works': vlmMarkdown,
  'diffusion-dit': diffusionMarkdown,
  'embedding-models': embeddingMarkdown,
  'audio-models': audioMarkdown,
  'video-models': videoMarkdown,
  'world-models': worldMarkdown,
  'llm-tokenization': tokenization,
  'llm-softmax-temperature': softmax,
  'llm-attention-calculation': attention,
  'llm-training-loop': training,
  'llm-kv-cache': kvCache,
  'llm-tensor-shapes': tensorShapes,
  'llm-conditional-probability': conditionalProbability,
  'statistical-inference-confidence-interval': statisticalInferenceConfidenceInterval,
  'train-validation-test-data-leakage': trainValidationTestDataLeakage,
  'llm-entropy-cross-entropy': entropyCrossEntropy,
  'llm-derivatives': derivatives
};

export const ESSAY_CHAPTERS: DocChapter[] = articleRegistry.articles.map(article => {
  const content = contentById[article.id];
  if (!content) throw new Error(`Missing Markdown content for article: ${article.id}`);
  return {
    id: article.id, slug: article.id, title: article.title, subtitle: article.subtitle,
    category: article.category, categoryName: article.categoryName,
    readTime: `${Math.max(1, Math.ceil(content.length / 800))} 分钟`,
    date: article.date, tags: article.tags, excerpt: article.excerpt, content: content.trim()
  };
});
