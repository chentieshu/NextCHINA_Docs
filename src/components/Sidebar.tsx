import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { DocChapter, DocSpace } from '../types';
import { Search, ChevronRight, ChevronDown, Folder, FolderOpen, FileText, ChevronsDownUp, ChevronsUpDown, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SpaceSelector } from './SpaceSelector';

interface SidebarProps {
  chapters: DocChapter[]; activeChapterId: string; onSelectChapter: (id: string) => void;
  onOpenSearch: () => void; isOpenMobile: boolean; onCloseMobile: () => void;
  isSidebarOpen: boolean; isLight?: boolean; spaces: DocSpace[]; activeSpaceId: string;
  onSelectSpace: (id: string) => void; isDesktop: boolean;
}
export const Sidebar: React.FC<SidebarProps> = ({ chapters, activeChapterId, onSelectChapter, onOpenSearch,
  isOpenMobile, onCloseMobile, isSidebarOpen, isLight = false, spaces, activeSpaceId, onSelectSpace, isDesktop }) => {
  const reduceMotion = useReducedMotion();
  const host = useRef<HTMLElement>(null);
  const visible = isDesktop ? isSidebarOpen : isOpenMobile;
  const categories = useMemo(() => {
    const map = new Map<string, { name: string; items: DocChapter[] }>();
    chapters.forEach(chapter => {
      if (!map.has(chapter.category)) map.set(chapter.category, { name: chapter.categoryName, items: [] });
      map.get(chapter.category)!.items.push(chapter);
    });
    return [...map.entries()];
  }, [chapters]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const closeRef = useRef(onCloseMobile);
  closeRef.current = onCloseMobile;
  useEffect(() => {
    if (isDesktop || !isOpenMobile) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => host.current?.querySelector<HTMLButtonElement>('button')?.focus());
    const keydown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = Array.from(host.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"], [role="listbox"]') ?? []).filter(element => element.getClientRects().length);
      const first = elements[0], last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [isDesktop, isOpenMobile]);
  const setAll = (value: boolean) => setExpanded(Object.fromEntries(categories.map(([key]) => [key, value])));
  const muted = isLight ? 'text-[#606068] hover:bg-[#eaebee]' : 'text-[#a0a0a8] hover:bg-[#25252a]';
  return <>
    <AnimatePresence>{!isDesktop && isOpenMobile && <motion.button type="button" aria-label="关闭目录遮罩" tabIndex={-1} onClick={onCloseMobile}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .18 }}
      className={`fixed inset-0 z-40 backdrop-blur-[2px] lg:hidden ${isLight ? 'bg-white/70' : 'bg-black/55'}`} />}</AnimatePresence>
    <motion.aside ref={host} id="vscode-style-sidebar" aria-label="文档导航" aria-hidden={!visible} inert={!visible}
      role={!isDesktop && isOpenMobile ? 'dialog' : undefined} aria-modal={!isDesktop && isOpenMobile ? true : undefined}
      initial={false} animate={{ x: visible ? '0%' : '-100%' }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 38, mass: .8 }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      className={`docs-sidebar fixed left-0 bottom-0 flex flex-col font-sans select-none ${isDesktop ? 'top-11 z-30' : 'top-0 z-50'} ${isLight ? 'bg-[#fafafc] text-[#2c2c30]' : 'bg-[#151518] text-[#cfcfd5]'}`}>
      {!isDesktop && <div className={`min-h-11 flex items-center justify-between px-4 shrink-0 ${isLight ? 'bg-[#f4f4f7]' : 'bg-[#1a1a1e]'}`}>
        <span className="font-bold tracking-tight text-base">NextCHINA</span>
        <button type="button" onClick={onCloseMobile} aria-label="关闭侧边栏" className={`h-10 w-10 flex items-center justify-center rounded-md ${muted}`}><X size={16} /></button>
      </div>}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2 shrink-0">
        <SpaceSelector spaces={spaces} value={activeSpaceId} onChange={onSelectSpace} />
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => setAll(true)} aria-label="展开全部分类" className={`h-9 w-7 flex items-center justify-center rounded ${muted}`}><ChevronsUpDown size={14} /></button>
          <button type="button" onClick={() => setAll(false)} aria-label="折叠全部分类" className={`h-9 w-7 flex items-center justify-center rounded ${muted}`}><ChevronsDownUp size={14} /></button>
        </div>
      </div>
      <div className="px-3 pb-2.5 shrink-0"><button type="button" onClick={onOpenSearch} className={`w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-lg ${isLight ? 'bg-[#f0f0f4] text-[#606068]' : 'bg-[#202024] text-[#aaaab5]'}`}>
        <span className="flex items-center gap-2"><Search size={14} /><span>搜索当前文档…</span></span><kbd className="text-[10px] font-mono">⌘K</kbd>
      </button></div>
      <div className="docs-sidebar-scroll flex-1 overflow-y-auto px-2 pt-1 space-y-1 pb-4">
        {categories.map(([key, category]) => {
          const open = expanded[key] ?? true;
          return <div key={key}>
            <button type="button" aria-expanded={open} aria-controls={`category-${key}`} onClick={() => setExpanded(previous => ({ ...previous, [key]: !open }))}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-2.5 rounded-lg text-left text-xs ${isLight ? 'hover:bg-[#f0f0f4] text-[#3c3c42]' : 'hover:bg-[#1f1f23] text-[#cfcfd6]'}`}>
              <span className="flex items-center gap-2 min-w-0">{open ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}{open ? <FolderOpen size={14} className="shrink-0" /> : <Folder size={14} className="shrink-0" />}<span className="font-medium truncate">{category.name}</span></span>
              <span className="text-[10px] font-mono opacity-60">{category.items.length}</span>
            </button>
            <AnimatePresence initial={false}>{open && <motion.div id={`category-${key}`} key={key} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 38 }} className="pl-4 space-y-0.5 overflow-hidden">
              {category.items.map(chapter => <button type="button" key={chapter.id} aria-current={activeChapterId === chapter.id ? 'page' : undefined}
                onClick={() => { onSelectChapter(chapter.id); if (!isDesktop) onCloseMobile(); }}
                className={`w-full flex items-center gap-2 px-2.5 py-2.5 rounded-lg text-left text-xs ${activeChapterId === chapter.id ? (isLight ? 'bg-[#eaebee] text-[#1a1a1e] font-medium' : 'bg-[#28282e] text-[#f0f0f4] font-medium') : (isLight ? 'text-[#505056] hover:bg-[#f2f2f5]' : 'text-[#aaaab5] hover:bg-[#1c1c20]')}`}>
                <FileText size={14} className="shrink-0 opacity-65" /><span className="truncate leading-snug">{chapter.title}</span>
              </button>)}
            </motion.div>}</AnimatePresence>
          </div>;
        })}
      </div>
    </motion.aside>
  </>;
};
