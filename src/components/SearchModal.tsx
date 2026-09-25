import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DocChapter } from '../types';
import { Search, X, BookOpen } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: DocChapter[];
  onSelectChapter: (id: string) => void;
  isLight?: boolean;
}
interface SearchResult {
  chapterId: string;
  chapterTitle: string;
  category: string;
  matchType: 'title' | 'tag' | 'content';
  snippet: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, chapters, onSelectChapter, isLight = false }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) { setQuery(''); setSelectedIndex(0); return; }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const found: SearchResult[] = [];
    chapters.forEach(chapter => {
      const base = { chapterId: chapter.id, chapterTitle: chapter.title, category: chapter.categoryName };
      if (chapter.title.toLowerCase().includes(q)) {
        found.push({ ...base, matchType: 'title', snippet: chapter.subtitle });
      } else if (chapter.tags.some(tag => tag.toLowerCase().includes(q))) {
        found.push({ ...base, matchType: 'tag', snippet: `匹配标签：${chapter.tags.find(tag => tag.toLowerCase().includes(q))}` });
      } else if (chapter.content.toLowerCase().includes(q) || chapter.excerpt.toLowerCase().includes(q) || chapter.categoryName.toLowerCase().includes(q)) {
        const index = chapter.content.toLowerCase().indexOf(q);
        const snippet = index < 0 ? chapter.excerpt : chapter.content.slice(Math.max(0, index - 40), index + 100).replace(/[#*`>]/g, '');
        found.push({ ...base, matchType: 'content', snippet: `…${snippet}…` });
      }
    });
    return found;
  }, [query, chapters]);

  const changeQuery = (value: string) => { setQuery(value); setSelectedIndex(0); };
  const select = (chapterId: string) => { onSelectChapter(chapterId); onClose(); };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelectedIndex(index => Math.min(index + 1, Math.max(0, results.length - 1))); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setSelectedIndex(index => Math.max(0, index - 1)); }
    else if (event.key === 'Enter' && results[selectedIndex]) { event.preventDefault(); select(results[selectedIndex].chapterId); }
    else if (event.key === 'Escape') { event.preventDefault(); onClose(); }
  };
  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer">
      <div onClick={event => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="搜索 NextCHINA AI 调研库"
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col cursor-default ${isLight ? 'bg-[#f6f6f9] text-[#2c2c30]' : 'bg-[#222226] text-[#cfcfd5]'}`}>
        <div className={`flex items-center px-4 py-3.5 ${isLight ? 'bg-[#eeeeF2]' : 'bg-[#1a1a1d]'}`}>
          <Search className="h-4 w-4 opacity-50 shrink-0 mr-3" />
          <input ref={inputRef} type="text" value={query} onChange={event => changeQuery(event.target.value)} onKeyDown={handleKeyDown}
            placeholder="搜索 AI SaaS、大模型、Agent、价格或来源…" aria-label="搜索关键词"
            className={`w-full bg-transparent text-sm focus:outline-none ${isLight ? 'text-[#1c1c20] placeholder-[#888890]' : 'text-[#e4e4eb] placeholder-[#707078]'}`} />
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {query && <button onClick={() => changeQuery('')} title="清空输入" aria-label="清空输入"
              className={`p-1 rounded-md transition-colors ${isLight ? 'hover:bg-[#dedee4] text-[#6e6e76]' : 'hover:bg-[#28282d] text-[#8e8e96]'}`}><X className="h-3.5 w-3.5" /></button>}
            <button onClick={onClose} title="关闭搜索 (ESC)" className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono transition-colors ${isLight ? 'bg-[#dedee4] hover:bg-[#d5d5db] text-[#55555c]' : 'bg-[#2a2a2f] hover:bg-[#36363d] text-[#90909a]'}`}>
              <span>关闭</span><kbd className="text-[10px] opacity-75">ESC</kbd>
            </button>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className={`p-8 text-center text-xs space-y-2 ${isLight ? 'text-[#707078]' : 'text-[#7e7e86]'}`}>
              <BookOpen className="h-8 w-8 mx-auto opacity-40 mb-2" />
              <p>输入关键词，查找产品、榜单、功能、价格与核验来源</p>
              <div className="flex justify-center gap-1.5 pt-2 flex-wrap">
                {['AI SaaS', '大模型', 'Agent', '价格', 'Higgsfield', 'LibTV'].map(tag => (
                  <button key={tag} onClick={() => changeQuery(tag)} className={`px-2.5 py-1 rounded-md text-xs transition-colors ${isLight ? 'bg-[#e6e6ec] hover:bg-[#dedee4] text-[#48484e]' : 'bg-[#1a1a1d] hover:bg-[#28282d] text-[#8e8e96]'}`}>{tag}</button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className={`p-8 text-center text-xs ${isLight ? 'text-[#707078]' : 'text-[#7e7e86]'}`}>未找到与“{query}”相关的记录，请尝试产品名、模型名、功能或价格关键词。</div>
          ) : results.map((result, index) => {
            const selected = index === selectedIndex;
            return (
              <button key={result.chapterId} onClick={() => select(result.chapterId)} onMouseEnter={() => setSelectedIndex(index)}
                className={`block w-full text-left p-3 rounded-xl cursor-pointer transition-colors ${selected ? (isLight ? 'bg-[#e2e2e8] text-[#1c1c20]' : 'bg-[#2d2d33] text-[#ededf4]') : isLight ? 'hover:bg-[#eeeeF2]' : 'hover:bg-[#1a1a1d]'}`}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-mono text-[11px] ${isLight ? 'text-[#707078]' : 'text-[#8a8a92]'}`}>{result.category}</span>
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${isLight ? 'bg-[#dedee4] text-[#55555c]' : 'bg-[#1c1c20] text-[#8a8a92]'}`}>{result.matchType}</span>
                </div>
                <h4 className={`text-sm font-semibold mb-1 ${isLight ? 'text-[#1c1c20]' : 'text-[#dedee4]'}`}>{result.chapterTitle}</h4>
                <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-[#585860]' : 'text-[#9c9ca4]'}`}>{result.snippet}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
