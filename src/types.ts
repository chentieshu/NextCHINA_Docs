export interface DocChapter {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  categoryName: string;
  readTime: string;
  date: string;
  tags: string[];
  excerpt: string;
  interactiveWidgetId?: string;
  content: string;
}

export interface TableOfContentItem {
  id: string;
  text: string;
  level: number;
}


export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  category: string;
  matchType: 'title' | 'content' | 'tag';
  snippet: string;
}
