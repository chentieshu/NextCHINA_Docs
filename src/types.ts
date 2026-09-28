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
  content: string;
  readingLayout?: 'prose' | 'reference';
}

export interface DocSpace {
  id: string;
  name: string;
  shortName: string;
  description: string;
  chapterIds: string[];
}

export type DocView =
  | { kind: 'home' }
  | { kind: 'article'; spaceId: string; chapterId: string };

export interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  category: string;
  matchType: 'title' | 'content' | 'tag';
  snippet: string;
}
