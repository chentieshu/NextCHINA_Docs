import { DOC_CHAPTERS, CHAPTER_BRIEFS } from '../../data/docs';

// Keep the existing presentation component contract; no second copy of research values.
export interface SlideItem {
  id: string;
  chapterRefId?: string;
  category: string;
  title: string;
  subtitle: string;
  type: 'manifesto' | 'diagram' | 'xml-spec' | 'comparison' | 'matrix' | 'conclusion';
  keyQuote?: string;
  bulletPoints?: { label: string; desc: string }[];
  xmlSnippet?: { filename: string; description: string; code: string };
  diagramType?: 'tri-circle-loop' | 'tech-matrix' | 'collaboration-synergy' | 'digital-craft';
  speechNotes: { hook: string; talkingPoints: string[]; presenterTip: string };
  estimatedDuration: string;
}

export const PRESENTATION_SLIDES: SlideItem[] = DOC_CHAPTERS.map((chapter, index) => {
  const bullets = CHAPTER_BRIEFS[chapter.id];
  return {
    id: `research-${chapter.id}`,
    chapterRefId: chapter.id,
    category: chapter.categoryName,
    title: chapter.title,
    subtitle: chapter.subtitle,
    type: index === 0 ? 'manifesto' : 'matrix',
    keyQuote: index === 0 ? '模型提供能力，产品组织工作，Agent 执行任务。' : undefined,
    bulletPoints: bullets,
    speechNotes: {
      hook: chapter.subtitle,
      talkingPoints: bullets.map(point => `${point.label}：${point.desc}`),
      presenterTip: `核验日期 ${chapter.date}。用“阅读原文”查看具体来源、榜单快照日期与价格条件，不把核验日期称为数据实时日期。`
    },
    estimatedDuration: '2 分钟'
  };
});
