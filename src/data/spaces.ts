import type { DocChapter, DocSpace } from '../types';
import registry from '../../content/spaces.json';

export const DOC_SPACES: DocSpace[] = registry.spaces;

export function chaptersForSpace(spaceId: string, chapters: DocChapter[]) {
  const space = DOC_SPACES.find(item => item.id === spaceId);
  if (!space) return [];
  const order = new Map(space.chapterIds.map((id, index) => [id, index]));
  return chapters.filter(chapter => order.has(chapter.id)).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export function spaceForChapter(chapterId: string) {
  return DOC_SPACES.find(space => space.chapterIds.includes(chapterId));
}
