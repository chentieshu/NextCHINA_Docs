import React, { useEffect, useMemo, useState } from 'react';
import { DOC_CHAPTERS as RESEARCH_CHAPTERS } from './data/docs';
import { ESSAY_CHAPTERS } from './data/essays';
import { DOC_SPACES, chaptersForSpace, spaceForChapter } from './data/spaces';
import type { DocChapter, DocView } from './types';
import { Sidebar } from './components/Sidebar';
import { DocHeader } from './components/DocHeader';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { SearchModal } from './components/SearchModal';
import { DocsHome } from './components/DocsHome';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';

const ALL_CHAPTERS = [...RESEARCH_CHAPTERS, ...ESSAY_CHAPTERS];

export default function App() {
  const [view, setView] = useState<DocView>({ kind: 'home' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLight, setIsLight] = useState(true);

  const activeSpaceId = view.kind === 'home' ? DOC_SPACES[0].id : view.spaceId;
  const activeSpace = DOC_SPACES.find(space => space.id === activeSpaceId);
  const spaceChapters = useMemo(() => activeSpace ? chaptersForSpace(activeSpace.id, ALL_CHAPTERS) : [], [activeSpaceId]);
  const activeChapter = view.kind === 'article' ? ALL_CHAPTERS.find(chapter => chapter.id === view.chapterId) : undefined;
  const activeIndex = activeChapter ? spaceChapters.findIndex(chapter => chapter.id === activeChapter.id) : -1;
  const prevChapter = activeIndex > 0 ? spaceChapters[activeIndex - 1] : null;
  const nextChapter = activeIndex >= 0 && activeIndex < spaceChapters.length - 1 ? spaceChapters[activeIndex + 1] : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k' && view.kind !== 'home') {
        event.preventDefault();
        setIsSearchOpen(value => !value);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view.kind]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [view]);

  const enterDocs = (spaceId = DOC_SPACES[0].id) => {
    const firstChapter = chaptersForSpace(spaceId, ALL_CHAPTERS)[0];
    if (!firstChapter) return;
    setView({ kind: 'article', spaceId, chapterId: firstChapter.id });
    setIsMobileMenuOpen(false);
  };

  const openArticle = (chapterId: string) => {
    const space = spaceForChapter(chapterId) ?? activeSpace ?? DOC_SPACES[0];
    setView({ kind: 'article', spaceId: space.id, chapterId });
    setIsMobileMenuOpen(false);
  };

  const themeClasses = isLight
    ? 'bg-white text-[#2c2c30] selection:bg-[#e4e4e8] selection:text-[#1c1c20]'
    : 'bg-[#18181b] text-[#cfcfd5] selection:bg-[#34343a] selection:text-[#ececf0]';

  if (view.kind === 'home') {
    return <div id="nextchina-docs-root" className={`min-h-screen ${themeClasses}`}>
      <DocsHome spaces={DOC_SPACES} chapters={ALL_CHAPTERS} isLight={isLight} onEnter={enterDocs} />
    </div>;
  }

  if (!activeSpace) return null;

  return <div id="nextchina-docs-root" className={`min-h-screen ${themeClasses} transition-colors duration-200`}>
    {activeChapter && <DocHeader currentChapter={activeChapter} isLight={isLight} onToggleTheme={() => setIsLight(value => !value)}
      isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(value => !value)}
      onOpenMobileMenu={() => setIsMobileMenuOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />}



    <Sidebar chapters={spaceChapters} activeChapterId={activeChapter?.id ?? ''} onSelectChapter={openArticle}
      onOpenSearch={() => setIsSearchOpen(true)} isOpenMobile={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)}
      isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(value => !value)} isLight={isLight}
      spaces={DOC_SPACES} activeSpaceId={activeSpace.id} onSelectSpace={enterDocs} />

    <div className={`min-h-screen pt-11 transition-all duration-300 ${isSidebarOpen ? 'lg:pl-80' : 'lg:pl-0'}`}>
      {activeChapter ? <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 lg:py-10 flex justify-center">
        <div className="w-full min-w-0 max-w-[820px]">
          <div className="pb-5 sm:pb-6 mb-5 sm:mb-7">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button onClick={() => setIsMobileMenuOpen(true)} className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${isLight ? 'bg-[#f0f0f4] text-[#44444a]' : 'bg-[#26262a] text-[#a5a5ad]'}`}>{activeSpace.name} / {activeChapter.categoryName}</button>
              <span className="opacity-30">•</span><span className="text-xs font-mono flex items-center gap-1 opacity-55"><Calendar className="h-3 w-3" /> {activeChapter.date}</span>
            </div>
            <h1 className="text-[1.65rem] sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 font-serif-sc leading-tight">{activeChapter.title}</h1>
            <p className="text-sm sm:text-base leading-relaxed opacity-65">{activeChapter.subtitle}</p>
          </div>
          <MarkdownRenderer content={activeChapter.content} isLight={isLight} />
          <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {prevChapter ? <button onClick={() => openArticle(prevChapter.id)} className={`w-full sm:w-auto flex items-center gap-3 p-3.5 rounded-xl text-left ${isLight ? 'bg-[#f5f5f8]' : 'bg-[#242428]'}`}><ArrowLeft className="h-4 w-4" /><div><div className="text-[10px] uppercase font-mono opacity-45">上一章</div><div className="text-xs font-medium line-clamp-1">{prevChapter.title}</div></div></button> : <div />}
            {nextChapter ? <button onClick={() => openArticle(nextChapter.id)} className={`w-full sm:w-auto flex items-center gap-3 p-3.5 rounded-xl text-right ${isLight ? 'bg-[#eeeff2]' : 'bg-[#2a2a30]'}`}><div><div className="text-[10px] uppercase font-mono opacity-45">下一章</div><div className="text-xs font-medium line-clamp-1">{nextChapter.title}</div></div><ArrowRight className="h-4 w-4" /></button> : <div />}
          </div>
        </div>
      </main> : null}
    </div>

    <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} chapters={spaceChapters} onSelectChapter={openArticle} isLight={isLight} />
  </div>;
}
