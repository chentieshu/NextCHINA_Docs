import React, { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { DOC_CHAPTERS as RESEARCH_CHAPTERS } from './data/docs';
import { ESSAY_CHAPTERS } from './data/essays';
import { DOC_SPACES, chaptersForSpace, spaceForChapter } from './data/spaces';
import { Sidebar } from './components/Sidebar';
import { DocHeader } from './components/DocHeader';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { SearchModal } from './components/SearchModal';
import { DocsHome } from './components/DocsHome';
import { LazyBoundary } from './components/LazyBoundary';
import { ArrowLeft, ArrowRight, Calendar, Compass } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { gardenHome, readRoute, routeUrl, useAppRoute } from './routing';

const ALL_CHAPTERS = [...RESEARCH_CHAPTERS, ...ESSAY_CHAPTERS];
const GardenPage = lazy(() => import('./features/garden/GardenPage'));

export default function App() {
  const [view, navigate] = useAppRoute();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLight, setIsLight] = useState(() => {
    try { return window.localStorage.getItem('nextchina-theme') !== 'dark'; } catch { return true; }
  });
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const reduceMotion = useReducedMotion();
  const desktopSidebarWidth = 'clamp(288px, 22vw, 304px)';
  const activeSpaceId = view.kind === 'article' ? (spaceForChapter(view.chapterId)?.id ?? DOC_SPACES[0].id) : DOC_SPACES[0].id;
  const activeSpace = DOC_SPACES.find(space => space.id === activeSpaceId)!;
  const spaceChapters = useMemo(() => chaptersForSpace(activeSpaceId, ALL_CHAPTERS), [activeSpaceId]);
  const activeChapter = view.kind === 'article' ? ALL_CHAPTERS.find(chapter => chapter.id === view.chapterId) : undefined;
  const activeIndex = activeChapter ? spaceChapters.findIndex(chapter => chapter.id === activeChapter.id) : -1;
  const prevChapter = activeIndex > 0 ? spaceChapters[activeIndex - 1] : null;
  const nextChapter = activeIndex >= 0 && activeIndex < spaceChapters.length - 1 ? spaceChapters[activeIndex + 1] : null;

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && view.kind === 'article') {
        event.preventDefault(); setIsMobileMenuOpen(false); setIsSearchOpen(value => !value);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [view.kind]);
  useEffect(() => {
    const theme = isLight ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { window.localStorage.setItem('nextchina-theme', theme); } catch { /* Theme stays usable without storage. */ }
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#ffffff' : '#18181b');
  }, [isLight]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => { setIsDesktop(media.matches); if (media.matches) setIsMobileMenuOpen(false); };
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  // A single owner for article overlays. Garden overlays stay inside their own viewport.
  useLayoutEffect(() => {
    if (view.kind !== 'article' || (!isSearchOpen && (isDesktop || !isMobileMenuOpen))) return;
    const scrollY = window.scrollY;
    const previous = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.documentElement.style.overflow };
    document.body.style.position = 'fixed'; document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%'; document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.position = previous.position; document.body.style.top = previous.top;
      document.body.style.width = previous.width; document.documentElement.style.overflow = previous.overflow;
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    };
  }, [view.kind, isDesktop, isMobileMenuOpen, isSearchOpen]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [view.kind, activeChapter?.id]);

  const closeOverlays = () => { setIsMobileMenuOpen(false); setIsSearchOpen(false); };
  const enterDocs = (spaceId = DOC_SPACES[0].id) => {
    const first = chaptersForSpace(spaceId, ALL_CHAPTERS)[0];
    if (!first) return;
    closeOverlays(); navigate({ kind: 'article', chapterId: first.id });
  };
  const openArticle = (chapterId: string) => {
    const returnTo = view.kind === 'garden' ? routeUrl(view) : view.kind === 'article' ? view.returnTo : undefined;
    closeOverlays(); navigate({ kind: 'article', chapterId, returnTo });
  };
  const openGarden = () => { closeOverlays(); navigate(gardenHome()); };
  const openSearch = () => { setIsMobileMenuOpen(false); setIsSearchOpen(true); };
  const themeClasses = isLight ? 'bg-white text-[#2c2c30] selection:bg-[#e4e4e8] selection:text-[#1c1c20]' : 'bg-[#18181b] text-[#cfcfd5] selection:bg-[#34343a] selection:text-[#ececf0]';

  if (view.kind === 'home') return <div id="nextchina-docs-root" data-theme={isLight ? 'light' : 'dark'} className={`min-h-dvh ${themeClasses}`}>
    <DocsHome spaces={DOC_SPACES} chapters={ALL_CHAPTERS} isLight={isLight} onEnter={enterDocs} onExplore={openGarden} />
  </div>;
  if (view.kind === 'garden') return <div id="nextchina-docs-root" data-theme={isLight ? 'light' : 'dark'} className={themeClasses}>
    <LazyBoundary label="知识花园" fallbackAction={() => enterDocs()}><Suspense fallback={<div className="min-h-dvh p-8" role="status">正在打开知识花园…</div>}>
      <GardenPage route={view} chapters={ALL_CHAPTERS} isLight={isLight} navigate={navigate} onRead={openArticle} onExit={() => enterDocs()} onToggleTheme={() => setIsLight(value => !value)} />
    </Suspense></LazyBoundary>
  </div>;
  if (!activeChapter) return <div id="nextchina-docs-root" className={`min-h-dvh p-8 ${themeClasses}`}><h1 className="text-xl font-semibold">未找到这篇文章</h1><p className="my-4">文章链接可能已调整。现有文档和知识花园仍可访问。</p><button onClick={() => enterDocs()} className="border rounded-lg px-4 py-2 mr-3">进入文档</button><button onClick={openGarden} className="border rounded-lg px-4 py-2">探索知识花园</button></div>;

  return <div id="nextchina-docs-root" data-theme={isLight ? 'light' : 'dark'} className={`min-h-dvh ${themeClasses} transition-colors duration-200`}>
    <DocHeader currentChapter={activeChapter} isLight={isLight} onToggleTheme={() => setIsLight(value => !value)}
      isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(value => !value)}
      onOpenMobileMenu={() => { setIsSearchOpen(false); setIsMobileMenuOpen(true); }} onOpenSearch={openSearch} />
    <Sidebar chapters={spaceChapters} activeChapterId={activeChapter.id} onSelectChapter={openArticle}
      onOpenSearch={openSearch} isOpenMobile={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)}
      isSidebarOpen={isSidebarOpen} isLight={isLight} spaces={DOC_SPACES} activeSpaceId={activeSpace.id} onSelectSpace={enterDocs} isDesktop={isDesktop} />
    <motion.div className="min-h-dvh pt-11 min-w-0" initial={false}
      animate={{ marginLeft: isDesktop && isSidebarOpen ? desktopSidebarWidth : '0px', width: isDesktop && isSidebarOpen ? `calc(100% - ${desktopSidebarWidth})` : '100%' }}
      transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 38, mass: 0.8 }}>
      <main className="docs-article-main w-full min-w-0 px-4 sm:px-6 lg:px-6 xl:px-8 2xl:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4 sm:pb-6 lg:pb-8 flex justify-center">
        <div className="w-full min-w-0 max-w-[820px]">
          <div className="pb-5 sm:pb-6 mb-5 sm:mb-7">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button onClick={() => isDesktop ? setIsSidebarOpen(true) : setIsMobileMenuOpen(true)} className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${isLight ? 'bg-[#f0f0f4] text-[#44444a]' : 'bg-[#26262a] text-[#a5a5ad]'}`}>{activeSpace.name} / {activeChapter.categoryName}</button>
              <span className="opacity-30">•</span><span className="text-xs font-mono flex items-center gap-1 opacity-55"><Calendar className="h-3 w-3" /> {activeChapter.date}</span>
            </div>
            <button className="inline-flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-2 mb-4" onClick={() => { closeOverlays(); navigate(view.returnTo ? readRoute(view.returnTo) : gardenHome()); }}><Compass className="h-3.5 w-3.5" />{view.returnTo ? '返回知识花园' : '探索知识花园'}</button>
            <h1 className="text-[1.65rem] sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3 font-serif-sc leading-tight">{activeChapter.title}</h1>
            <p className="text-sm sm:text-base leading-relaxed opacity-65">{activeChapter.subtitle}</p>
          </div>
          <MarkdownRenderer content={activeChapter.content} isLight={isLight} />
          <div className={`mt-9 sm:mt-11 pt-5 sm:pt-6 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 ${isLight ? 'border-[#ececf0]' : 'border-[#2b2b30]'}`}>
            {prevChapter ? <button onClick={() => openArticle(prevChapter.id)} className={`w-full sm:w-auto sm:max-w-[48%] min-w-0 flex items-center gap-3 p-3.5 rounded-xl text-left ${isLight ? 'bg-[#f5f5f8]' : 'bg-[#242428]'}`}><ArrowLeft className="h-4 w-4 shrink-0" /><div className="min-w-0"><div className="text-[10px] uppercase font-mono opacity-45">上一章</div><div className="text-xs font-medium line-clamp-1">{prevChapter.title}</div></div></button> : <div />}
            {nextChapter ? <button onClick={() => openArticle(nextChapter.id)} className={`w-full sm:w-auto sm:max-w-[48%] min-w-0 flex items-center gap-3 p-3.5 rounded-xl text-right ${isLight ? 'bg-[#eeeff2]' : 'bg-[#2a2a30]'}`}><div className="min-w-0"><div className="text-[10px] uppercase font-mono opacity-45">下一章</div><div className="text-xs font-medium line-clamp-1">{nextChapter.title}</div></div><ArrowRight className="h-4 w-4 shrink-0" /></button> : <div />}
          </div>
        </div>
      </main>
    </motion.div>
    <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} chapters={spaceChapters} onSelectChapter={openArticle} isLight={isLight} />
  </div>;
}
