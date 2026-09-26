import React, { useEffect, useState, useRef, useMemo } from 'react';
import { TableOfContentItem } from '../types';
import { extractMarkdownHeadings } from '../utils/slugify';
import { AlignLeft } from 'lucide-react';

interface TableOfContentsProps {
  content: string;
  chapterTitle?: string;
  isLight?: boolean;
  isSidebarOpen?: boolean;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  content,
  isLight = false,
  isSidebarOpen = true
}) => {
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const isClickScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Ref to the outer layout placeholder to compute the fixed column horizontal position
  const placeholderRef = useRef<HTMLDivElement>(null);
  const [leftPos, setLeftPos] = useState<number | null>(null);

  // Parse H2 and H3 headings from markdown content using unified slug generator
  const headings: TableOfContentItem[] = useMemo(() => extractMarkdownHeadings(content, [2, 3]), [content]);

  // Keep the fixed Table of Contents horizontally aligned with the flex grid
  // It is 100% position:fixed, so it never shifts vertically on window scroll
  useEffect(() => {
    const updatePosition = () => {
      if (placeholderRef.current) {
        const rect = placeholderRef.current.getBoundingClientRect();
        setLeftPos(rect.left);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    // Follow the sidebar expand/collapse 300ms transition smoothly
    let start = performance.now();
    let frameId: number;
    const animate = () => {
      updatePosition();
      if (performance.now() - start < 350) {
        frameId = requestAnimationFrame(animate);
      }
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', updatePosition);
      cancelAnimationFrame(frameId);
    };
  }, [isSidebarOpen]);

  // High-performance, jitter-free scroll spy with requestAnimationFrame
  useEffect(() => {
    if (headings.length === 0) return;

    setActiveHeadingId(headings[0].id);

    const updateActiveHeading = () => {
      if (isClickScrollingRef.current) return;

      const headingElements = headings
        .map(h => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];

      if (headingElements.length === 0) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      // 1. Top of page check: lock to first heading
      if (scrollY < 120) {
        setActiveHeadingId(headingElements[0].id);
        return;
      }

      // 2. Bottom of page check: lock to last heading
      if (scrollY + windowHeight >= docHeight - 50) {
        setActiveHeadingId(headingElements[headingElements.length - 1].id);
        return;
      }

      // 3. Scan for heading that has passed the 120px viewport threshold
      let currentId = headingElements[0].id;
      for (let i = 0; i < headingElements.length; i++) {
        const rect = headingElements[i].getBoundingClientRect();
        if (rect.top <= 120) {
          currentId = headingElements[i].id;
        } else {
          break;
        }
      }

      setActiveHeadingId(currentId);
    };

    const handleScroll = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      rafIdRef.current = requestAnimationFrame(updateActiveHeading);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateActiveHeading();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [headings]);

  const handleHeadingClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    isClickScrollingRef.current = true;
    setActiveHeadingId(id);

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      isClickScrollingRef.current = false;
    }, 800);
  };

  return (
    // Outer placeholder maintains layout space in the grid
    <div 
      ref={placeholderRef}
      className="w-64 2xl:w-72 shrink-0 hidden xl:block"
    >
      {/* Inner outline is position: fixed. It never scrolls with the page at all. */}
      <aside 
        style={leftPos !== null ? { left: `${leftPos}px` } : undefined}
        aria-label="Table of contents"
        className="fixed top-11 bottom-0 w-64 2xl:w-72 overflow-y-auto pt-10 pb-10 pl-4 pr-2 select-none scrollbar-none z-20"
      >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-3">
          <span className={`flex items-center gap-1.5 font-mono ${isLight ? 'text-[#6e6e76]' : 'text-[#a0a0a8]'}`}>
            <AlignLeft className="h-3.5 w-3.5 opacity-70" />
            本文大纲 (Outline)
          </span>
        </div>

        <nav className="space-y-0.5">
          {headings.length === 0 ? (
            <p className={`text-xs italic ${isLight ? 'text-[#888890]' : 'text-[#6e6e76]'}`}>全文通读</p>
          ) : (
            headings.map((h) => {
              const isActive = activeHeadingId === h.id;
              return (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  onClick={(e) => handleHeadingClick(e, h.id)}
                  className={`block text-xs py-1.5 px-2.5 rounded-lg transition-colors leading-snug truncate ${
                    h.level === 3 ? 'ml-3 text-[11.5px]' : 'font-medium'
                  } ${
                    isActive
                      ? isLight
                        ? 'bg-[#eeeeF2] text-[#1c1c20] font-semibold'
                        : 'bg-[#28282d] text-[#ececf0] font-semibold'
                      : isLight
                        ? 'text-[#585860] hover:text-[#1c1c20] hover:bg-[#f6f6f9]'
                        : 'text-[#8a8a92] hover:text-[#dedee4] hover:bg-[#202024]'
                  }`}
                  title={h.text}
                >
                  {h.text}
                </a>
              );
            })
          )}
        </nav>
      </aside>
    </div>
  );
};
