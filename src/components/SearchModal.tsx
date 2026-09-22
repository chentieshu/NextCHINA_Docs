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

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  chapters,
  onSelectChapter,
  isLight = false
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global ESC key listener to guarantee modal can always close
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search logic across title, category, tags, and body content
  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const found: SearchResult[] = [];

    chapters.forEach(ch => {
      // Match title
      if (ch.title.toLowerCase().includes(q)) {
        found.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          category: ch.categoryName,
          matchType: 'title',
          snippet: ch.subtitle
        });
      }
      // Match keywords
      else if (ch.tags.some(t => t.toLowerCase().includes(q))) {
        found.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          category: ch.categoryName,
          matchType: 'content',
          snippet: `匹配论点: ${ch.tags.find(t => t.toLowerCase().includes(q))}`
        });
      }
      // Match excerpt or content
      else if (ch.content.toLowerCase().includes(q) || ch.excerpt.toLowerCase().includes(q)) {
        const idx = ch.content.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 40);
        const end = Math.min(ch.content.length, idx + 80);
        const snippetText = ch.content.slice(start, end).replace(/[#*`>]/g, '');

        found.push({
          chapterId: ch.id,
          chapterTitle: ch.title,
          category: ch.categoryName,
          matchType: 'content',
          snippet: `...${snippetText}...`
        });
      }
    });

    return found;
  }, [query, chapters]);

  // Keyboard navigation inside input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      onSelectChapter(results[selectedIndex].chapterId);
      onClose();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col cursor-default ${
          isLight ? 'bg-[#f6f6f9] text-[#2c2c30]' : 'bg-[#222226] text-[#cfcfd5]'
        }`}
      >
        {/* Search Input Bar - No Borders */}
        <div className={`flex items-center px-4 py-3.5 ${
          isLight ? 'bg-[#eeeeF2]' : 'bg-[#1a1a1d]'
        }`}>
          <Search className="h-4 w-4 opacity-50 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章、AIGC审美、微观弱叙事、技术哲学..."
            className={`w-full bg-transparent text-sm focus:outline-none ${
              isLight ? 'text-[#1c1c20] placeholder-[#888890]' : 'text-[#e4e4eb] placeholder-[#707078]'
            }`}
          />
          
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {query && (
              <button
                onClick={() => setQuery('')}
                className={`p-1 rounded-md transition-colors ${
                  isLight ? 'hover:bg-[#dedee4] text-[#6e6e76]' : 'hover:bg-[#28282d] text-[#8e8e96]'
                }`}
                title="清空输入"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Direct close button */}
            <button
              onClick={onClose}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono transition-colors ${
                isLight 
                  ? 'bg-[#dedee4] hover:bg-[#d5d5db] text-[#55555c]' 
                  : 'bg-[#2a2a2f] hover:bg-[#36363d] text-[#90909a]'
              }`}
              title="关闭搜索 (ESC)"
            >
              <span>关闭</span>
              <kbd className="text-[10px] opacity-75">ESC</kbd>
            </button>
          </div>
        </div>

        {/* Results List - No Borders */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {query.trim() === '' ? (
            <div className={`p-8 text-center text-xs space-y-2 ${isLight ? 'text-[#707078]' : 'text-[#7e7e86]'}`}>
              <BookOpen className="h-8 w-8 mx-auto opacity-40 mb-2" />
              <p>输入关键词以快速检索《艺术与科技文集》的论点与案例</p>
              <div className="flex justify-center gap-1.5 pt-2 flex-wrap">
                {['AIGC', '微观弱叙事', '控制论', '以人为本', '空间计算'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      isLight 
                        ? 'bg-[#e6e6ec] hover:bg-[#dedee4] text-[#48484e]' 
                        : 'bg-[#1a1a1d] hover:bg-[#28282d] text-[#8e8e96]'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className={`p-8 text-center text-xs ${isLight ? 'text-[#707078]' : 'text-[#7e7e86]'}`}>
              未检索到与 “{query}” 相关的思辨论述，尝试搜索其他哲学或技术关键词
            </div>
          ) : (
            results.map((res, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${res.chapterId}-${idx}`}
                  onClick={() => {
                    onSelectChapter(res.chapterId);
                    onClose();
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected 
                      ? (isLight 
                          ? 'bg-[#e2e2e8] text-[#1c1c20]' 
                          : 'bg-[#2d2d33] text-[#ededf4]')
                      : isLight 
                        ? 'hover:bg-[#eeeeF2]' 
                        : 'hover:bg-[#1a1a1d]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className={`font-mono text-[11px] ${isLight ? 'text-[#707078]' : 'text-[#8a8a92]'}`}>
                      {res.category}
                    </span>
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                      isLight ? 'bg-[#dedee4] text-[#55555c]' : 'bg-[#1c1c20] text-[#8a8a92]'
                    }`}>
                      {res.matchType}
                    </span>
                  </div>
                  <h4 className={`text-sm font-semibold mb-1 ${isLight ? 'text-[#1c1c20]' : 'text-[#dedee4]'}`}>
                    {res.chapterTitle}
                  </h4>
                  <p className={`text-xs line-clamp-2 leading-relaxed ${isLight ? 'text-[#585860]' : 'text-[#9c9ca4]'}`}>
                    {res.snippet}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
