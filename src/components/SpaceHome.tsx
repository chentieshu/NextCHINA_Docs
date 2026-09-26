import React from 'react';
import type { DocChapter, DocSpace } from '../types';
import { ArrowRight, FolderOpen } from 'lucide-react';

interface Props { space: DocSpace; chapters: DocChapter[]; isLight: boolean; onOpenArticle: (id: string) => void; }

export const SpaceHome: React.FC<Props> = ({ space, chapters, isLight, onOpenArticle }) => {
  const categories = new Map<string, { name: string; items: DocChapter[] }>();
  chapters.forEach(chapter => {
    if (!categories.has(chapter.category)) categories.set(chapter.category, { name: chapter.categoryName, items: [] });
    categories.get(chapter.category)!.items.push(chapter);
  });
  return <main className="w-full px-5 sm:px-8 lg:px-10 py-10 lg:py-14">
    <div className="max-w-5xl mx-auto">
      <div className="max-w-2xl"><div className="text-xs font-mono opacity-50 mb-3">SPACE / {space.id.toUpperCase()}</div><h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{space.name}</h1><p className="mt-3 text-sm sm:text-base leading-7 opacity-65">{space.description}</p></div>
      <div className="grid md:grid-cols-2 gap-4 mt-10">
        {[...categories.entries()].map(([id, category]) => <section key={id} className={`rounded-2xl border p-5 ${isLight ? 'border-[#e8e8ed] bg-[#fafafc]' : 'border-[#2b2b31] bg-[#1d1d21]'}`}>
          <div className="flex items-center gap-2 mb-4"><FolderOpen className="h-4 w-4 opacity-50" /><h2 className="font-semibold">{category.name}</h2><span className="ml-auto text-[10px] font-mono opacity-40">{category.items.length}</span></div>
          <div className="space-y-1">{category.items.map(chapter => <button key={chapter.id} onClick={() => onOpenArticle(chapter.id)} className={`w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 text-sm ${isLight ? 'hover:bg-white' : 'hover:bg-[#29292e]'}`}><span className="min-w-0 flex-1"><span className="block truncate font-medium">{chapter.title}</span><span className="block truncate text-xs opacity-45 mt-0.5">{chapter.excerpt}</span></span><ArrowRight className="h-3.5 w-3.5 opacity-35 shrink-0" /></button>)}</div>
        </section>)}
      </div>
    </div>
  </main>;
};
