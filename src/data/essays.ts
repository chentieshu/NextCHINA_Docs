import type { DocChapter } from '../types';
import articleRegistry from '../../content/articles.json';

// The registry owns article identity and file placement. Vite resolves raw files at
// build time, so registering an article cannot leave a second import table stale.
const markdownByPath = import.meta.glob<string>('../../content/**/*.md', {
  query: '?raw', import: 'default', eager: true
});

export const ESSAY_CHAPTERS: DocChapter[] = articleRegistry.articles.map(article => {
  const file = article.file;
  if (!file.startsWith('content/') || file.split('/').includes('..') || !file.endsWith('.md')) {
    throw new Error(`Invalid Markdown path for article: ${article.id}`);
  }
  const content = markdownByPath[`../../${file}`];
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`Missing Markdown content for article: ${article.id} (${file})`);
  }
  return {
    id: article.id, slug: article.id, title: article.title, subtitle: article.subtitle,
    category: article.category, categoryName: article.categoryName,
    readTime: `${Math.max(1, Math.ceil(content.length / 800))} 分钟`,
    date: article.date, tags: article.tags, excerpt: article.excerpt, content: content.trim()
  };
});
