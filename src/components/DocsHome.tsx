import React from 'react';
import type { DocChapter, DocSpace } from '../types';
import { ArrowRight, BookOpen, Database, GitBranch, Layers3 } from 'lucide-react';

interface Props { spaces: DocSpace[]; chapters: DocChapter[]; isLight: boolean; onEnter: (id: string) => void; }

export const DocsHome: React.FC<Props> = ({ spaces, chapters, isLight, onEnter }) => (
  <main className="min-h-dvh px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-3xl pt-8 sm:pt-12">
        <div className={`inline-flex items-center gap-2 text-xs font-mono mb-5 ${isLight ? 'text-[#73737b]' : 'text-[#91919a]'}`}><BookOpen className="h-4 w-4" /> NEXTCHINA / DOCS</div>
        <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.045em] leading-[1.05] ${isLight ? 'text-[#17171b]' : 'text-[#f1f1f5]'}`}>理解正在发生的 AI。</h1>
        <p className={`mt-6 text-base sm:text-lg leading-8 max-w-2xl ${isLight ? 'text-[#5d5d65]' : 'text-[#a4a4ad]'}`}>从模型、计算、Agent 到 AI 产品，持续记录能力、原理、价格、基准和微观技术变化。Markdown 负责文章，JSON 负责结构化数据，全部由 GitHub 版本管理。</p>
        <button onClick={() => onEnter(spaces[0].id)} className={`mt-8 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold ${isLight ? 'bg-[#1c1c20] text-white' : 'bg-[#eeeef2] text-[#1c1c20]'}`}>进入文档 <ArrowRight className="h-4 w-4" /></button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-16">
        {spaces.map(space => {
          const count = space.chapterIds.filter(id => chapters.some(chapter => chapter.id === id)).length;
          return <button key={space.id} onClick={() => onEnter(space.id)} className={`text-left rounded-2xl p-5 border transition-all hover:-translate-y-0.5 ${isLight ? 'bg-[#fafafc] border-[#e8e8ed] hover:bg-white' : 'bg-[#1d1d21] border-[#2b2b31] hover:bg-[#222227]'}`}>
            <div className="flex items-center justify-between"><span className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${isLight ? 'bg-white text-[#29292e]' : 'bg-[#29292e] text-[#e5e5eb]'}`}>{space.shortName}</span><span className="text-[11px] font-mono opacity-50">{count} DOCS</span></div>
            <h2 className="mt-5 text-lg font-semibold">{space.name}</h2><p className="mt-2 text-sm leading-6 opacity-65">{space.description}</p>
          </button>;
        })}
      </div>
      <div className={`grid sm:grid-cols-3 gap-6 mt-16 pt-8 border-t text-sm ${isLight ? 'border-[#ececf0] text-[#6c6c74]' : 'border-[#29292e] text-[#898992]'}`}>
        <div className="flex gap-3"><GitBranch className="h-4 w-4 mt-0.5" /><span>GitHub 是内容源与版本历史。</span></div>
        <div className="flex gap-3"><Database className="h-4 w-4 mt-0.5" /><span>Markdown 负责知识，JSON 负责结构化数据。</span></div>
        <div className="flex gap-3"><Layers3 className="h-4 w-4 mt-0.5" /><span>Space → Category → Article 组织知识。</span></div>
      </div>
    </div>
  </main>
);
