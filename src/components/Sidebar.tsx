import React, { useState, useMemo } from 'react';
import { DocChapter, DocSpace } from '../types';
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  ChevronsDownUp,
  ChevronsUpDown,
  X,
  ChevronsUpDown as SpaceChevron
} from 'lucide-react';

interface SidebarProps {
  chapters: DocChapter[];
  activeChapterId: string;
  onSelectChapter: (id: string) => void;
  onOpenSearch: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isSidebarOpen: boolean;
  isLight?: boolean;
  spaces: DocSpace[];
  activeSpaceId: string;
  onSelectSpace: (id: string) => void;
}


export const Sidebar: React.FC<SidebarProps> = ({
  chapters,
  activeChapterId,
  onSelectChapter,
  onOpenSearch,
  isOpenMobile,
  onCloseMobile,
  isSidebarOpen,
  isLight = false,
  spaces,
  activeSpaceId,
  onSelectSpace
}) => {

  // Group chapters by category (Parent Folders)
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; items: DocChapter[] }>();
    chapters.forEach(ch => {
      if (!map.has(ch.category)) {
        map.set(ch.category, { name: ch.categoryName, items: [] });
      }
      map.get(ch.category)!.items.push(ch);
    });
    return Array.from(map.entries());
  }, [chapters]);

  // Folder expanded states - all categories expanded by default
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    chapters.forEach(ch => {
      initial[ch.category] = true;
    });
    return initial;
  });


  const toggleFolder = (catKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };


  const collapseAll = () => {
    const collapsed: Record<string, boolean> = {};
    categories.forEach(([key]) => {
      collapsed[key] = false;
    });
    setExpandedFolders(collapsed);
  };

  const expandAll = () => {
    const expanded: Record<string, boolean> = {};
    categories.forEach(([key]) => {
      expanded[key] = true;
    });
    setExpandedFolders(expanded);
  };


  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* VS Code Style Hierarchical Tree Sidebar */}
      <aside 
        id="vscode-style-sidebar"
        className={`
          fixed bottom-0 left-0 w-72 md:w-80 flex flex-col transition-all duration-300 ease-in-out font-sans select-none
          ${isOpenMobile 
            ? 'top-0 z-50 translate-x-0 opacity-100 shadow-2xl h-full' 
            : `lg:top-11 z-30 lg:h-[calc(100vh-44px)] ${
                isSidebarOpen 
                  ? 'lg:translate-x-0 -translate-x-full lg:opacity-100' 
                  : '-translate-x-full opacity-0 pointer-events-none'
              }`
          }
          ${isLight 
            ? 'bg-[#fafafc] text-[#2c2c30]' 
            : 'bg-[#151518] text-[#cfcfd5]'}
        `}
      >
        {/* Mobile Header */}
        <div className={`h-11 flex items-center justify-between px-4 shrink-0 lg:hidden ${
          isLight ? 'bg-[#f4f4f7]' : 'bg-[#1a1a1e]'
        }`}>
          <span className={`font-bold tracking-tight text-base font-sans ${
            isLight ? 'text-[#1c1c20]' : 'text-[#f0f0f4]'
          }`}>
            NextCHINA
          </span>

          <button
            onClick={onCloseMobile}
            className={`p-1.5 rounded-md ${
              isLight ? 'text-[#6e6e74] hover:text-[#222226]' : 'text-[#8a8a92] hover:text-[#dedee4]'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Space selector + tree actions */}
        <div className="px-3 pt-3 pb-2 flex items-center gap-2 shrink-0">
          <div className="relative flex-1 min-w-0">
            <select
              value={activeSpaceId}
              onChange={(event) => onSelectSpace(event.target.value)}
              aria-label="切换文档大分类"
              className={`w-full appearance-none rounded-lg pl-3 pr-8 py-2 text-[12px] font-semibold outline-none cursor-pointer ${
                isLight ? 'bg-[#f0f0f4] text-[#303036]' : 'bg-[#202024] text-[#d7d7de]'
              }`}
            >
              {spaces.map(space => <option key={space.id} value={space.id}>{space.name}</option>)}
            </select>
            <SpaceChevron className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-45" />
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              className={`p-1 rounded transition-colors ${
                isLight ? 'hover:bg-[#eaebee] text-[#606068]' : 'hover:bg-[#25252a] text-[#a0a0a8]'
              }`}
              title="展开全部目录与章节"
            >
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={collapseAll}
              className={`p-1 rounded transition-colors ${
                isLight ? 'hover:bg-[#eaebee] text-[#606068]' : 'hover:bg-[#25252a] text-[#a0a0a8]'
              }`}
              title="折叠全部目录"
            >
              <ChevronsDownUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Search Box */}
        <div className="px-3 pb-2.5 shrink-0">
          <button
            onClick={onOpenSearch}
            className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-all ${
              isLight 
                ? 'bg-[#f0f0f4] hover:bg-[#e7e7eb] text-[#606068]' 
                : 'bg-[#202024] hover:bg-[#28282d] text-[#8e8e96]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 opacity-60" />
              <span className="text-[11px]">搜索当前文档...</span>
            </span>
            <kbd className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isLight ? 'bg-[#e2e2e7] text-[#55555c]' : 'bg-[#18181b] text-[#8e8e96]'
            }`}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Category folders and document files */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin pb-4">
          {categories.map(([catKey, cat]) => {
            const isFolderOpen = expandedFolders[catKey] ?? true;

            return (
              <div key={catKey} className="group/folder select-none mb-1">
                {/* Level 0: Parent Folder Item */}
                <div
                  onClick={(e) => toggleFolder(catKey, e)}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isLight 
                      ? 'hover:bg-[#f0f0f4] text-[#3c3c42]' 
                      : 'hover:bg-[#1f1f23] text-[#cfcfd6]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Expand/Collapse Chevron */}
                    <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-60">
                      {isFolderOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </span>

                    {/* Folder Icon */}
                    <span className={`shrink-0 ${
                      isLight ? 'text-[#64646c]' : 'text-[#9c9ca4]'
                    }`}>
                      {isFolderOpen ? (
                        <FolderOpen className="h-3.5 w-3.5" />
                      ) : (
                        <Folder className="h-3.5 w-3.5" />
                      )}
                    </span>

                    {/* Category Title */}
                    <span className="font-medium text-[12.5px] truncate tracking-tight">
                      {cat.name}
                    </span>
                  </div>

                  {/* Child Count Badge */}
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    isLight ? 'text-[#84848c] bg-[#eeeeF2]' : 'text-[#74747c] bg-[#1d1d21]'
                  }`}>
                    {cat.items.length}
                  </span>
                </div>

                {/* Level 1: Child Files (Chapters) */}
                {isFolderOpen && (
                  <div className="relative pl-3.5 space-y-0.5 mt-0.5">
                    {/* Indentation Tree Line */}
                    <div className={`absolute left-4 top-1 bottom-1 w-[1px] ${
                      isLight ? 'bg-[#e8e8ed]' : 'bg-[#242429]'
                    }`} />

                    {cat.items.map(chapter => {
                      const isActive = activeChapterId === chapter.id;

                      return (
                        <div key={chapter.id} className="relative group/file">
                          {/* Chapter Item Row */}
                          <div
                            onClick={() => {
                              onSelectChapter(chapter.id);
                              if (window.innerWidth < 1024) {
                                onCloseMobile();
                              }
                            }}
                            className={`relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isActive
                                ? isLight
                                  ? 'bg-[#eaebee] text-[#1a1a1e] font-medium'
                                  : 'bg-[#28282e] text-[#f0f0f4] font-medium'
                                : isLight
                                  ? 'text-[#505056] hover:bg-[#f2f2f5] hover:text-[#1c1c20]'
                                  : 'text-[#9c9ca4] hover:bg-[#1c1c20] hover:text-[#dedee4]'
                            }`}
                          >
                            {/* Active Indicator Bar */}
                            {isActive && (
                              <div className={`absolute left-0 top-1.5 bottom-1.5 w-[2.5px] rounded-r ${
                                isLight ? 'bg-[#55555c]' : 'bg-[#a0a0a8]'
                              }`} />
                            )}

                            <div className="flex items-center gap-2 min-w-0 pl-1">
                              {/* Markdown File Icon */}
                              <FileText className={`h-3.5 w-3.5 shrink-0 ${
                                isActive 
                                  ? (isLight ? 'text-[#202024]' : 'text-[#e4e4eb]') 
                                  : (isLight ? 'text-[#7e7e86]' : 'text-[#7a7a82]')
                              }`} />

                              {/* Title */}
                              <span className="text-[12px] truncate leading-tight">
                                {chapter.title}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};
