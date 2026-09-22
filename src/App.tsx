import React, { useState, useEffect } from 'react';
import { DOC_CHAPTERS } from './data/docs';
import { ReadingPreferences, DocChapter } from './types';
import { Sidebar } from './components/Sidebar';
import { DocHeader } from './components/DocHeader';
import { MDXRenderer } from './components/MDXRenderer';
import { TableOfContents } from './components/TableOfContents';
import { SearchModal } from './components/SearchModal';
import { PresentationModal } from './components/presentation/PresentationModal';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';

export default function App() {
  const [activeChapterId, setActiveChapterId] = useState<string>(DOC_CHAPTERS[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);

  // Strictly two themes: light (white background) and dark (charcoal/deep gray)
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    try {
      const saved = localStorage.getItem('art_tech_read_pref');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          themeScheme: parsed.themeScheme === 'dark' ? 'dark' : 'light',
          fontSize: parsed.fontSize || 'base',
          fontFamily: parsed.fontFamily || 'sans',
          contentWidth: parsed.contentWidth || 'normal'
        };
      }
    } catch {
      // ignore
    }
    return {
      themeScheme: 'light',
      fontSize: 'base',
      fontFamily: 'sans',
      contentWidth: 'normal'
    };
  });

  // Keyboard shortcut listener (Cmd+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Scroll to top on chapter change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeChapterId]);

  const activeChapter: DocChapter = DOC_CHAPTERS.find((c: DocChapter) => c.id === activeChapterId) || DOC_CHAPTERS[0];
  const activeIndex = DOC_CHAPTERS.findIndex((c: DocChapter) => c.id === activeChapter.id);

  const handleUpdatePreferences = (updated: Partial<ReadingPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('art_tech_read_pref', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const prevChapter = activeIndex > 0 ? DOC_CHAPTERS[activeIndex - 1] : null;
  const nextChapter = activeIndex < DOC_CHAPTERS.length - 1 ? DOC_CHAPTERS[activeIndex + 1] : null;

  const isLight = preferences.themeScheme === 'light';

  // Calibrated Soft Grayscale Theme: Light theme is pure white background (#ffffff) with gentle, harmonious grays
  const themeClasses = isLight
    ? 'bg-[#ffffff] text-[#2c2c30] selection:bg-[#e4e4e8] selection:text-[#1c1c20]'
    : 'bg-[#18181b] text-[#cfcfd5] selection:bg-[#34343a] selection:text-[#ececf0]';

  return (
    <div id="art-tech-docs-root" className={`min-h-screen ${themeClasses} transition-colors duration-200`}>
      {/* Apple Height (44px) Sticky Header - Unified across full width */}
      <DocHeader
        currentChapter={activeChapter}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPresentation={() => setIsPresentationOpen(true)}
        totalChapters={DOC_CHAPTERS.length}
        currentIndex={activeIndex + 1}
      />

      {/* Smooth Collapsible Sidebar - Seamlessly docked underneath 44px navbar */}
      <Sidebar
        chapters={DOC_CHAPTERS}
        activeChapterId={activeChapterId}
        onSelectChapter={setActiveChapterId}
        onOpenSearch={() => setIsSearchOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isLight={isLight}
      />

      {/* Main Content Area - Starts with pt-11 for 44px navbar, smooth left padding animation */}
      <div className={`flex flex-col min-h-screen pt-11 transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'lg:pl-72 md:pl-80' : 'lg:pl-0'
      }`}>
        {/* Content & Table of Contents Grid */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 py-7 md:py-10 flex items-start justify-between gap-8">
          {/* Main Editorial Canvas */}
          <div className="flex-1 max-w-3xl min-w-0">
            {/* Chapter Header Card - No Borders */}
            <div className="pb-6 mb-7">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full ${
                  isLight 
                    ? 'bg-[#f0f0f4] text-[#44444a]' 
                    : 'bg-[#26262a] text-[#a5a5ad]'
                }`}>
                  {activeChapter.categoryName}
                </span>
                <span className={isLight ? 'text-[#c0c0c6]' : 'text-[#5a5a62]'}>•</span>
                <span className={`text-xs font-mono flex items-center gap-1 ${
                  isLight ? 'text-[#74747c]' : 'text-[#8a8a92]'
                }`}>
                  <Calendar className="h-3 w-3" /> {activeChapter.date}
                </span>
              </div>

              <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 font-serif-sc leading-tight ${
                isLight ? 'text-[#1c1c20]' : 'text-[#e4e4ea]'
              }`}>
                {activeChapter.title}
              </h1>

              <p className={`text-sm md:text-base font-normal leading-relaxed ${
                isLight ? 'text-[#585860]' : 'text-[#9c9ca4]'
              }`}>
                {activeChapter.subtitle}
              </p>
            </div>

            {/* Core MDX Rendered Body */}
            <MDXRenderer
              content={activeChapter.content}
              preferences={preferences}
            />

            {/* Bottom Next/Previous Chapter Navigation - No Borders */}
            <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevChapter ? (
                <button
                  onClick={() => setActiveChapterId(prevChapter.id)}
                  className={`w-full sm:w-auto flex items-center gap-3 p-3.5 rounded-xl text-left transition-all group ${
                    isLight 
                      ? 'bg-[#f5f5f8] hover:bg-[#eaebee] text-[#333338]' 
                      : 'bg-[#242428] hover:bg-[#2c2c31] text-[#cfcfd5]'
                  }`}
                >
                  <ArrowLeft className={`h-4 w-4 transition-colors ${
                    isLight ? 'text-[#75757d] group-hover:text-[#202024]' : 'text-[#75757e] group-hover:text-[#e0e0e5]'
                  }`} />
                  <div>
                    <div className={`text-[10px] uppercase font-mono ${isLight ? 'text-[#84848c]' : 'text-[#7e7e86]'}`}>上一章</div>
                    <div className="text-xs font-medium line-clamp-1">{prevChapter.title}</div>
                  </div>
                </button>
              ) : (
                <div />
              )}

              {nextChapter ? (
                <button
                  onClick={() => setActiveChapterId(nextChapter.id)}
                  className={`w-full sm:w-auto flex items-center gap-3 p-3.5 rounded-xl text-right transition-all group self-end ${
                    isLight 
                      ? 'bg-[#eeeff2] hover:bg-[#e4e4e8] text-[#202024]' 
                      : 'bg-[#2a2a30] hover:bg-[#34343a] text-[#dedee4]'
                  }`}
                >
                  <div>
                    <div className={`text-[10px] uppercase font-mono ${isLight ? 'text-[#84848c]' : 'text-[#8a8a92]'}`}>下一章</div>
                    <div className="text-xs font-medium line-clamp-1">{nextChapter.title}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div />
              )}
            </div>

            {/* Document Colophon / Footer - No Borders */}
            <footer className={`mt-14 pt-6 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 font-mono ${
              isLight ? 'text-[#8a8a92]' : 'text-[#707078]'
            }`}>
              <div>
                © 2026 NextCHINA · 艺术与科技思辨文集
              </div>
              <div className="flex items-center gap-4">
                <span>灰阶美学</span>
                <span>•</span>
                <span>微观弱叙事</span>
                <span>•</span>
                <span>以人为本</span>
              </div>
            </footer>
          </div>

          {/* Right Table of Contents */}
          <TableOfContents
            content={activeChapter.content}
            chapterTitle={activeChapter.title}
            isLight={isLight}
            isSidebarOpen={isSidebarOpen}
          />
        </main>
      </div>

      {/* Global Cmd+K Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        chapters={DOC_CHAPTERS}
        onSelectChapter={setActiveChapterId}
        isLight={isLight}
      />

      {/* Fullscreen PPT Presentation Mode (F11 style) */}
      <PresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        onNavigateToChapter={(id) => {
          setActiveChapterId(id);
          setIsPresentationOpen(false);
        }}
      />
    </div>
  );
}
