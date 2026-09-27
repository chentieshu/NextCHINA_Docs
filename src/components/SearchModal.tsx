import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { DocChapter } from '../types';
import { Search, X, BookOpen } from 'lucide-react';

interface SearchModalProps { isOpen: boolean; onClose: () => void; chapters: DocChapter[]; onSelectChapter: (id: string) => void; isLight?: boolean; }
interface SearchResult { chapterId: string; chapterTitle: string; category: string; matchType: 'title' | 'tag' | 'content'; snippet: string; }
export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, chapters, onSelectChapter, isLight = false }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) { setQuery(''); setSelectedIndex(0); return; }
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => { window.clearTimeout(timer); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [isOpen]);
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const found: SearchResult[] = [];
    chapters.forEach(chapter => {
      const base = { chapterId: chapter.id, chapterTitle: chapter.title, category: chapter.categoryName };
      if (chapter.title.toLowerCase().includes(q)) found.push({ ...base, matchType: 'title', snippet: chapter.subtitle });
      else if (chapter.tags.some(tag => tag.toLowerCase().includes(q))) found.push({ ...base, matchType: 'tag', snippet: `匹配标签：${chapter.tags.find(tag => tag.toLowerCase().includes(q))}` });
      else if (chapter.content.toLowerCase().includes(q) || chapter.excerpt.toLowerCase().includes(q) || chapter.categoryName.toLowerCase().includes(q)) {
        const index = chapter.content.toLowerCase().indexOf(q);
        const snippet = index < 0 ? chapter.excerpt : chapter.content.slice(Math.max(0, index - 40), index + 100).replace(/[#*`>]/g, '');
        found.push({ ...base, matchType: 'content', snippet: `…${snippet}…` });
      }
    });
    return found;
  }, [query, chapters]);
  const changeQuery = (value: string) => { setQuery(value); setSelectedIndex(0); };
  const select = (id: string) => { onSelectChapter(id); onClose(); };
  const handleInputKeys = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelectedIndex(index => Math.min(index + 1, Math.max(0, results.length - 1))); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setSelectedIndex(index => Math.max(0, index - 1)); }
    else if (event.key === 'Enter' && results[selectedIndex]) { event.preventDefault(); select(results[selectedIndex].chapterId); }
  };
  if (!isOpen) return null;
  return <div onClick={onClose} className={`fixed inset-0 z-[60] flex items-start justify-center px-4 pt-16 pb-4 backdrop-blur-sm ${isLight ? 'bg-white/80' : 'bg-black/65'}`}
    onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key === 'Tab') {
        const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('input, button:not(:disabled)') ?? []).filter(node => node.getClientRects().length);
        if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); }
      }
    }}>
    <div ref={dialogRef} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="搜索 NextCHINA AI 调研库"
      className={`w-full max-w-2xl min-w-0 max-h-full rounded-2xl border overflow-hidden flex flex-col ${isLight ? 'border-[#dddfe6] bg-[#f6f6f9] text-[#2c2c30]' : 'border-[#3b3b46] bg-[#222226] text-[#cfcfd5]'}`}>
      <div className={`flex items-center px-4 py-3.5 shrink-0 ${isLight ? 'bg-[#eeeef2]' : 'bg-[#1a1a1d]'}`}>
        <Search size={16} className="opacity-50 shrink-0 mr-3" />
        <input ref={inputRef} type="text" value={query} onChange={event => changeQuery(event.target.value)} onKeyDown={handleInputKeys} placeholder="搜索模型、产品、价格…" aria-label="搜索关键词"
          className={`w-full min-w-0 bg-transparent border-0 rounded text-base ${isLight ? 'text-[#1c1c20] placeholder-[#888890]' : 'text-[#e4e4eb] placeholder-[#8a8a95]'}`} />
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          {query && <button type="button" onClick={() => changeQuery('')} aria-label="清空输入" className="h-9 w-9 flex items-center justify-center rounded"><X size={14} /></button>}
          <button type="button" onClick={onClose} aria-label="关闭搜索" className={`px-2 min-h-9 rounded text-xs ${isLight ? 'bg-[#dedee4]' : 'bg-[#2a2a2f]'}`}>关闭</button>
        </div>
      </div>
      <div className="min-h-0 max-h-[60dvh] overflow-y-auto overscroll-contain p-2 space-y-1">
        {!query.trim() ? <div className="p-8 text-center text-xs space-y-2">
          <BookOpen size={32} className="mx-auto opacity-40 mb-2" /><p>输入关键词，查找产品、榜单、功能、价格与核验来源</p>
          <div className="flex justify-center gap-1.5 pt-2 flex-wrap">{['AI SaaS', '大模型', 'Agent', '价格', 'Higgsfield', 'LibTV'].map(tag => <button type="button" key={tag} onClick={() => changeQuery(tag)} className={`px-2.5 py-2 rounded text-xs ${isLight ? 'bg-[#e6e6ec]' : 'bg-[#1a1a1d]'}`}>{tag}</button>)}</div>
        </div> : results.length === 0 ? <p className="p-8 text-center text-xs">未找到与“{query}”相关的记录。</p> : results.map((result, index) => <button type="button" key={result.chapterId} onClick={() => select(result.chapterId)} onMouseEnter={() => setSelectedIndex(index)}
          className={`block w-full text-left p-3 rounded-xl ${index === selectedIndex ? (isLight ? 'bg-[#e2e2e8]' : 'bg-[#2d2d33]') : (isLight ? 'hover:bg-[#eeeef2]' : 'hover:bg-[#1a1a1d]')}`}>
          <span className="flex justify-between text-[11px] opacity-70 mb-1"><span>{result.category}</span><span>{result.matchType}</span></span>
          <span className="block text-sm font-semibold mb-1">{result.chapterTitle}</span><span className="block text-xs line-clamp-2 leading-relaxed opacity-80">{result.snippet}</span>
        </button>)}
      </div>
    </div>
  </div>;
};
