import type { DocChapter } from '../types';
import articleRegistry from '../../content/articles.json';
import premiumVideoMarkdown from '../../content/craft/video/apple-style-premium-product-video.md?raw';
import llmMarkdown from '../../content/models/llm/llm-how-it-works.md?raw';
import vlmMarkdown from '../../content/models/vlm/vlm-how-it-works.md?raw';
import diffusionMarkdown from '../../content/models/generative/diffusion-dit.md?raw';
import embeddingMarkdown from '../../content/models/embedding/embedding-models.md?raw';
import audioMarkdown from '../../content/models/audio/audio-models.md?raw';
import videoMarkdown from '../../content/models/video/video-models.md?raw';
import worldMarkdown from '../../content/models/world/world-models.md?raw';

const contentById: Record<string, string> = {
  'apple-style-premium-product-video': premiumVideoMarkdown,
  'llm-how-it-works': llmMarkdown,
  'vlm-how-it-works': vlmMarkdown,
  'diffusion-dit': diffusionMarkdown,
  'embedding-models': embeddingMarkdown,
  'audio-models': audioMarkdown,
  'video-models': videoMarkdown,
  'world-models': worldMarkdown
};

export const ESSAY_CHAPTERS: DocChapter[] = articleRegistry.articles.map(article => {
  const content = contentById[article.id];
  if (!content) throw new Error(`Missing Markdown content for article: ${article.id}`);
  return {
    id: article.id,
    slug: article.id,
    title: article.title,
    subtitle: article.subtitle,
    category: article.category,
    categoryName: article.categoryName,
    readTime: `${Math.max(1, Math.ceil(content.length / 800))} 分钟`,
    date: article.date,
    tags: article.tags,
    excerpt: article.excerpt,
    content: content.trim()
  };
});
