import React, { useState } from 'react';
import { DocChapter, ReadingPreferences } from '../types';
import { 
  PanelLeft, 
  Type, 
  Sun, 
  Moon, 
  ChevronRight,
  Minus,
  Plus,
  Search,
  Presentation
} from 'lucide-react';

interface DocHeaderProps {
  currentChapter: DocChapter;
  preferences: ReadingPreferences;
  onUpdatePreferences: (updated: Partial<ReadingPreferences>) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
  onOpenSearch?: () => void;
  onOpenPresentation?: () => void;
  totalChapters?: number;
  currentIndex?: number;
}

export const DocHeader: React.FC<DocHeaderProps> = ({
  currentChapter,
  preferences,
  onUpdatePreferences,
  isSidebarOpen,
  onToggleSidebar,
  onOpenMobileMenu,
  onOpenSearch,
  onOpenPresentation
}) => {
  const [showPreferencesMenu, setShowPreferencesMenu] = useState(false);

  const fontSizes: Array<ReadingPreferences['fontSize']> = ['sm', 'base', 'lg', 'xl'];

  const increaseFontSize = () => {
    const curIdx = fontSizes.indexOf(preferences.fontSize);
    if (curIdx < fontSizes.length - 1) {
      onUpdatePreferences({ fontSize: fontSizes[curIdx + 1] });
    }
  };

  const decreaseFontSize = () => {
    const curIdx = fontSizes.indexOf(preferences.fontSize);
    if (curIdx > 0) {
      onUpdatePreferences({ fontSize: fontSizes[curIdx - 1] });
    }
  };

  const isLight = preferences.themeScheme === 'light';

  return (
    <header 
      id="apple-style-navbar"
      className={`fixed top-0 left-0 right-0 z-40 h-11 backdrop-blur-xl px-3 sm:px-5 flex items-center justify-between transition-colors ${
        isLight 
          ? 'bg-white/85 text-[#2c2c30]' 
          : 'bg-[#18181b]/85 text-[#d0d0d6]'
      }`}
    >
      {/* Left: Sidebar Toggle, Text Logo NextCHINA & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        {/* Apple style Sidebar toggle icon */}
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              onOpenMobileMenu();
            } else {
              onToggleSidebar();
            }
          }}
          className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
            isLight 
              ? 'text-[#505056] hover:text-[#1c1c20] hover:bg-[#f0f0f3]' 
              : 'text-[#9898a0] hover:text-[#e2e2e8] hover:bg-[#28282d]'
          } ${isSidebarOpen ? '' : 'opacity-85'}`}
          title={isSidebarOpen ? '收起目录' : '展开目录'}
          aria-label="切换侧边栏"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Text Logo: NextCHINA */}
        <span className={`font-bold tracking-tight text-sm sm:text-base font-sans select-none shrink-0 ${
          isLight ? 'text-[#1a1a1e]' : 'text-[#f0f0f4]'
        }`}>
          NextCHINA
        </span>

        {/* Apple style subtle breadcrumb separator & path */}
        <nav className={`hidden sm:flex items-center gap-1.5 text-[12px] truncate ml-1 ${
          isLight ? 'text-[#707076]' : 'text-[#8a8a92]'
        }`}>
          <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
          <span className={`shrink-0 font-medium ${
            isLight ? 'text-[#48484e]' : 'text-[#b8b8c0]'
          }`}>
            {currentChapter.categoryName}
          </span>
          <ChevronRight className="h-3 w-3 opacity-30 shrink-0" />
          <span className={`truncate font-normal ${
            isLight ? 'text-[#606066]' : 'text-[#dedee4]'
          }`}>
            {currentChapter.title}
          </span>
        </nav>
      </div>

      {/* Right: Quick Search, Presentation, Theme Toggle & Typography Preferences */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Fullscreen Presentation Mode Button */}
        {onOpenPresentation && (
          <button
            onClick={onOpenPresentation}
            className={`h-7 px-2 flex items-center gap-1.5 text-xs rounded-md transition-colors ${
              isLight
                ? 'bg-[#f2f2f5] hover:bg-[#e9e9ed] text-[#404046]'
                : 'bg-[#242428] hover:bg-[#2e2e33] text-[#c5c5cb]'
            }`}
            title="全屏演示演讲 (PPT 模式 / F11)"
          >
            <Presentation className="h-3.5 w-3.5 opacity-80" />
            <span className="hidden sm:inline font-sans text-[11.5px]">演讲</span>
          </button>
        )}

        {/* Search button */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className={`h-7 px-2 flex items-center gap-1.5 text-xs rounded-md transition-colors ${
              isLight
                ? 'bg-[#f2f2f5] hover:bg-[#e9e9ed] text-[#55555c]'
                : 'bg-[#242428] hover:bg-[#2e2e33] text-[#a0a0a8]'
            }`}
            title="搜索 (⌘K)"
          >
            <Search className="h-3.5 w-3.5 opacity-70" />
            <kbd className={`hidden md:inline text-[10px] font-mono px-1 rounded ${
              isLight ? 'bg-[#e4e4e8] text-[#505056]' : 'bg-[#18181b] text-[#8e8e96]'
            }`}>
              ⌘K
            </kbd>
          </button>
        )}

        {/* Quick Light/Dark toggle button */}
        <button
          onClick={() => onUpdatePreferences({ themeScheme: isLight ? 'dark' : 'light' })}
          className={`h-7 w-7 flex items-center justify-center rounded-md transition-colors ${
            isLight
              ? 'bg-[#f2f2f5] hover:bg-[#e9e9ed] text-[#404046]'
              : 'bg-[#242428] hover:bg-[#2e2e33] text-[#c5c5cb]'
          }`}
          title={isLight ? '切换为暗黑模式' : '切换为明亮模式'}
        >
          {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </button>

        {/* Typography Settings Popover */}
        <div className="relative">
          <button
            onClick={() => setShowPreferencesMenu(!showPreferencesMenu)}
            className={`h-7 px-2 flex items-center gap-1 text-[11px] rounded-md transition-colors ${
              isLight 
                ? 'bg-[#f2f2f5] hover:bg-[#e9e9ed] text-[#404046]' 
                : 'bg-[#242428] hover:bg-[#2e2e33] text-[#c5c5cb]'
            }`}
            title="排版与主题设定"
          >
            <Type className="h-3.5 w-3.5" />
            <span className="hidden md:inline font-sans">排版</span>
          </button>

          {showPreferencesMenu && (
            <div className={`absolute right-0 mt-1.5 w-64 rounded-xl p-3.5 shadow-xl z-50 space-y-3.5 ${
              isLight 
                ? 'bg-[#ffffff] text-[#2c2c30] shadow-[0_10px_35px_rgba(0,0,0,0.08)]' 
                : 'bg-[#242428] text-[#ceced4]'
            }`}>
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold">排版与主题</span>
                <button
                  onClick={() => setShowPreferencesMenu(false)}
                  className="text-xs opacity-50 hover:opacity-100 p-0.5"
                >
                  ✕
                </button>
              </div>

              {/* Theme Scheme Selection */}
              <div className="space-y-1.5">
                <span className={`text-[11px] font-mono ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
                  主题模式
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    onClick={() => onUpdatePreferences({ themeScheme: 'light' })}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                      isLight 
                        ? 'bg-[#eaebee] text-[#1c1c20] font-semibold' 
                        : 'bg-[#2d2d32] text-[#8e8e96] hover:text-[#d0d0d6]'
                    }`}
                  >
                    <Sun className="h-3 w-3" />
                    <span>明亮白</span>
                  </button>
                  <button
                    onClick={() => onUpdatePreferences({ themeScheme: 'dark' })}
                    className={`py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
                      !isLight 
                        ? 'bg-[#36363c] text-[#dedee4] font-semibold' 
                        : 'bg-[#f4f4f6] text-[#707076] hover:text-[#202024]'
                    }`}
                  >
                    <Moon className="h-3 w-3" />
                    <span>暗黑灰</span>
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <span className={`text-[11px] font-mono ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
                  字号缩放
                </span>
                <div className={`flex items-center justify-between p-1.5 rounded-lg ${
                  isLight ? 'bg-[#f2f2f5]' : 'bg-[#1c1c1f]'
                }`}>
                  <button
                    onClick={decreaseFontSize}
                    disabled={preferences.fontSize === 'sm'}
                    className="p-1 rounded opacity-60 hover:opacity-100 disabled:opacity-20"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-xs font-mono uppercase font-bold">
                    {preferences.fontSize}
                  </span>
                  <button
                    onClick={increaseFontSize}
                    disabled={preferences.fontSize === 'xl'}
                    className="p-1 rounded opacity-60 hover:opacity-100 disabled:opacity-20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <span className={`text-[11px] font-mono ${isLight ? 'text-[#707076]' : 'text-[#8a8a92]'}`}>
                  字体风格
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onUpdatePreferences({ fontFamily: 'sans' })}
                    className={`px-2.5 py-1.5 text-xs rounded-lg text-center transition-all ${
                      preferences.fontFamily === 'sans'
                        ? isLight ? 'bg-[#e4e4e8] text-[#1c1c20] font-medium' : 'bg-[#36363c] text-[#dedee4] font-medium'
                        : isLight ? 'bg-[#f4f4f6] text-[#707076]' : 'bg-[#1c1c1f] text-[#8a8a92]'
                    }`}
                  >
                    现代无衬线
                  </button>
                  <button
                    onClick={() => onUpdatePreferences({ fontFamily: 'serif' })}
                    className={`px-2.5 py-1.5 text-xs rounded-lg text-center font-serif-sc transition-all ${
                      preferences.fontFamily === 'serif'
                        ? isLight ? 'bg-[#e4e4e8] text-[#1c1c20] font-medium' : 'bg-[#36363c] text-[#dedee4] font-medium'
                        : isLight ? 'bg-[#f4f4f6] text-[#707076]' : 'bg-[#1c1c1f] text-[#8a8a92]'
                    }`}
                  >
                    人文宋体
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
