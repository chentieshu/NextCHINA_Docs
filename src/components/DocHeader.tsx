import React from 'react';
import { DocChapter } from '../types';
import { PanelLeft, Sun, Moon, ChevronRight, Search } from 'lucide-react';

interface DocHeaderProps {
  currentChapter: DocChapter;
  isLight: boolean;
  onToggleTheme: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
  onOpenSearch?: () => void;
  totalChapters?: number;
  currentIndex?: number;
}

export const DocHeader: React.FC<DocHeaderProps> = ({
  currentChapter,
  isLight,
  onToggleTheme,
  isSidebarOpen,
  onToggleSidebar,
  onOpenMobileMenu,
  onOpenSearch
}) => (
  <header
    id="apple-style-navbar"
    className={`fixed top-0 left-0 right-0 z-40 h-11 backdrop-blur-xl pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-5 flex items-center justify-between transition-colors ${
      isLight ? 'bg-white/85 text-[#2c2c30]' : 'bg-[#18181b]/85 text-[#d0d0d6]'
    }`}
  >
    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
      <button
        onClick={() => window.innerWidth < 1024 ? onOpenMobileMenu() : onToggleSidebar()}
        className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
          isLight ? 'text-[#505056] hover:text-[#1c1c20] hover:bg-[#f0f0f3]' : 'text-[#9898a0] hover:text-[#e2e2e8] hover:bg-[#28282d]'
        } ${isSidebarOpen ? '' : 'opacity-85'}`}
        title={isSidebarOpen ? '收起目录' : '展开目录'}
        aria-label="切换侧边栏"
      >
        <PanelLeft className="h-4 w-4" />
      </button>

      <span className={`font-bold tracking-tight text-sm sm:text-base font-sans select-none shrink-0 ${
        isLight ? 'text-[#1a1a1e]' : 'text-[#f0f0f4]'
      }`}>NextCHINA</span>

      <nav className={`hidden md:flex items-center gap-1.5 text-[12px] truncate ml-1 ${
        isLight ? 'text-[#707076]' : 'text-[#8a8a92]'
      }`}>
        <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
        <span className={`shrink-0 font-medium ${isLight ? 'text-[#48484e]' : 'text-[#b8b8c0]'}`}>
          {currentChapter.categoryName}
        </span>
        <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
        <span className={`truncate font-normal ${isLight ? 'text-[#606066]' : 'text-[#dedee4]'}`}>
          {currentChapter.title}
        </span>
      </nav>
    </div>

    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
      {onOpenSearch && (
        <button
          onClick={onOpenSearch}
          className={`h-7 px-2 flex items-center gap-1.5 text-xs rounded-md transition-colors ${
            isLight ? 'bg-[#f2f2f5] hover:bg-[#e9e9ed] text-[#55555c]' : 'bg-[#242428] hover:bg-[#2e2e33] text-[#a0a0a8]'
          }`}
          title="搜索 (⌘K)"
        >
          <Search className="h-3.5 w-3.5 opacity-70" />
          <kbd className={`hidden md:inline text-[10px] font-mono px-1 rounded ${
            isLight ? 'bg-[#e4e4e8] text-[#505056]' : 'bg-[#18181b] text-[#8e8e96]'
          }`}>⌘K</kbd>
        </button>
      )}

      <button
        onClick={onToggleTheme}
        className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${
          isLight ? 'bg-[#f2f2f5] hover:bg-[#e9e9ed] text-[#404046]' : 'bg-[#242428] hover:bg-[#2e2e33] text-[#c5c5cb]'
        }`}
        title={isLight ? '切换为暗黑模式' : '切换为明亮模式'}
        aria-label={isLight ? '切换为暗黑模式' : '切换为明亮模式'}
      >
        {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </button>
    </div>
  </header>
);
