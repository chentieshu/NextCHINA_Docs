import React from 'react';
import type { DocChapter } from '../types';
import { PanelLeft, Sun, Moon, ChevronRight, Search } from 'lucide-react';

interface DocHeaderProps {
  currentChapter: DocChapter; isLight: boolean; onToggleTheme: () => void;
  isSidebarOpen: boolean; onToggleSidebar: () => void; onOpenMobileMenu: () => void;
  onOpenSearch?: () => void; totalChapters?: number; currentIndex?: number;
}
export const DocHeader: React.FC<DocHeaderProps> = ({ currentChapter, isLight, onToggleTheme, isSidebarOpen, onToggleSidebar, onOpenMobileMenu, onOpenSearch }) => <header
  id="apple-style-navbar" className={`fixed top-0 left-0 right-0 z-40 h-11 backdrop-blur-xl pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-5 flex items-center justify-between gap-2 ${isLight ? 'bg-white/85 text-[#2c2c30]' : 'bg-[#18181b]/85 text-[#d0d0d6]'}`}>
  <div className="flex flex-1 items-center gap-2 sm:gap-2.5 min-w-0">
    <button type="button" onClick={() => window.innerWidth < 1024 ? onOpenMobileMenu() : onToggleSidebar()} aria-label="切换侧边栏" aria-controls="vscode-style-sidebar"
      className={`h-9 w-9 shrink-0 flex items-center justify-center rounded-md ${isLight ? 'text-[#505056] hover:bg-[#f0f0f3]' : 'text-[#b8b8c0] hover:bg-[#28282d]'} ${isSidebarOpen ? '' : 'opacity-85'}`}><PanelLeft size={16} /></button>
    <span className={`font-bold tracking-tight text-sm sm:text-base font-sans select-none shrink-0 ${isLight ? 'text-[#1a1a1e]' : 'text-[#f0f0f4]'}`}>NextCHINA</span>
    <nav aria-label="当前位置" className="hidden md:flex items-center gap-1.5 text-xs min-w-0 ml-1">
      <ChevronRight size={12} className="opacity-30 shrink-0" /><span className="shrink-0 opacity-75">{currentChapter.categoryName}</span><ChevronRight size={12} className="opacity-30 shrink-0" /><span className="truncate">{currentChapter.title}</span>
    </nav>
  </div>
  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
    {onOpenSearch && <button type="button" onClick={onOpenSearch} aria-label="搜索文档" className={`h-9 px-2 flex items-center gap-1.5 text-xs rounded-md ${isLight ? 'bg-[#f2f2f5] text-[#55555c]' : 'bg-[#242428] text-[#bcbcc8]'}`}>
      <Search size={14} /><kbd className="hidden md:inline text-[10px] font-mono">⌘K</kbd>
    </button>}
    <button type="button" onClick={onToggleTheme} aria-label={isLight ? '切换为暗黑模式' : '切换为明亮模式'} className={`h-9 w-9 flex items-center justify-center rounded-md ${isLight ? 'bg-[#f2f2f5] text-[#404046]' : 'bg-[#242428] text-[#c5c5cb]'}`}>
      {isLight ? <Moon size={14} /> : <Sun size={14} />}
    </button>
  </div>
</header>;
