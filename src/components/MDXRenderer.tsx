import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArtTechTimelineWidget } from './interactive/ArtTechTimelineWidget';
import { AigcAestheticMatrixWidget } from './interactive/AigcAestheticMatrixWidget';
import { HumanTechEmpathyWidget } from './interactive/HumanTechEmpathyWidget';
import { FutureTechRadarWidget } from './interactive/FutureTechRadarWidget';
import { MicrocosmVisualizerWidget } from './interactive/MicrocosmVisualizerWidget';
import { MicroNarrativeCommercialWidget } from './interactive/MicroNarrativeCommercialWidget';
import { ReadingPreferences } from '../types';
import { getReactNodeText, slugifyHeading } from '../utils/slugify';
import { Quote, Copy, Check } from 'lucide-react';

interface MDXRendererProps {
  content: string;
  preferences: ReadingPreferences;
}

export const MDXRenderer: React.FC<MDXRendererProps> = ({ content, preferences }) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const isLight = preferences.themeScheme === 'light';

  // Font size classes
  const fontSizes = {
    sm: 'text-sm leading-relaxed',
    base: 'text-base leading-relaxed',
    lg: 'text-lg leading-relaxed',
    xl: 'text-xl leading-loose'
  };

  const fontFamilyClass = preferences.fontFamily === 'serif' ? 'font-serif-sc' : 'font-sans';

  // Process custom widget markers
  const renderWidgets = (rawText: string) => {
    // Split markdown by widget tokens
    const parts = rawText.split(/(\[WIDGET:[A-Z_]+\])/g);

    return parts.map((part, index) => {
      switch (part.trim()) {
        case '[WIDGET:ART_TECH_TIMELINE]':
          return <ArtTechTimelineWidget key={`widget-${index}`} isLight={isLight} />;
        case '[WIDGET:AIGC_AESTHETIC_MATRIX]':
          return <AigcAestheticMatrixWidget key={`widget-${index}`} isLight={isLight} />;
        case '[WIDGET:HUMAN_TECH_EMPATHY]':
          return <HumanTechEmpathyWidget key={`widget-${index}`} isLight={isLight} />;
        case '[WIDGET:FUTURE_TECH_RADAR]':
          return <FutureTechRadarWidget key={`widget-${index}`} isLight={isLight} />;
        case '[WIDGET:MICROCOSM_VISUALIZER]':
          return <MicrocosmVisualizerWidget key={`widget-${index}`} isLight={isLight} />;
        case '[WIDGET:MICRO_NARRATIVE_COMMERCIAL]':
          return <MicroNarrativeCommercialWidget key={`widget-${index}`} isLight={isLight} />;
        default:
          return (
            <div key={`md-${index}`} className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => {
                    const text = getReactNodeText(children);
                    const id = slugifyHeading(text);
                    return (
                      <h2
                        id={id}
                        className={`text-xl md:text-2xl font-bold tracking-tight mt-10 mb-3 scroll-mt-24 ${
                          isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'
                        }`}
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = getReactNodeText(children);
                    const id = slugifyHeading(text);
                    return (
                      <h3
                        id={id}
                        className={`text-lg md:text-xl font-semibold mt-7 mb-2.5 scroll-mt-24 flex items-center gap-2 ${
                          isLight ? 'text-[#26262a]' : 'text-[#d4d4dc]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-[#787880]' : 'bg-[#9898a0]'}`}></span>
                        <span>{children}</span>
                      </h3>
                    );
                  },
                  h4: ({ children }) => (
                    <h4 className={`text-base font-semibold mt-5 mb-2 ${
                      isLight ? 'text-[#2e2e33]' : 'text-[#c8c8d0]'
                    }`}>
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className={`my-4 font-normal ${fontSizes[preferences.fontSize]} ${
                      isLight ? 'text-[#38383e]' : 'text-[#b8b8c2]'
                    }`}>
                      {children}
                    </p>
                  ),
                  blockquote: ({ children }) => (
                    <div className={`relative my-6 rounded-2xl px-5 py-4 ${
                      isLight 
                        ? 'bg-[#f4f4f7] text-[#34343a]' 
                        : 'bg-[#222226] text-[#c5c5cd]'
                    }`}>
                      <div className="flex items-start gap-3">
                        <Quote className="h-4 w-4 opacity-40 shrink-0 mt-1" />
                        <div className="font-serif-sc text-sm md:text-base italic leading-relaxed">
                          {children}
                        </div>
                      </div>
                    </div>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-4 space-y-2 list-none pl-1">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className={`flex items-start gap-2.5 text-sm md:text-base leading-relaxed ${
                      isLight ? 'text-[#38383e]' : 'text-[#b8b8c2]'
                    }`}>
                      <span className="opacity-40 font-bold mt-1 text-xs">◆</span>
                      <div className="flex-1">{children}</div>
                    </li>
                  ),
                  ol: ({ children }) => (
                    <ol className={`my-4 space-y-2 list-decimal pl-5 text-sm md:text-base ${
                      isLight ? 'text-[#38383e]' : 'text-[#b8b8c2]'
                    }`}>
                      {children}
                    </ol>
                  ),
                  table: ({ children }) => (
                    <div className={`my-6 overflow-x-auto rounded-2xl p-1 ${
                      isLight ? 'bg-[#f7f7fa]' : 'bg-[#202024]'
                    }`}>
                      <table className={`w-full text-left text-xs md:text-sm ${
                        isLight ? 'text-[#34343a]' : 'text-[#cfcfd6]'
                      }`}>
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className={`font-semibold font-mono text-xs uppercase tracking-wider ${
                      isLight ? 'bg-[#ededf1] text-[#222226]' : 'bg-[#28282d] text-[#e0e0e6]'
                    }`}>
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-2.5 rounded-sm">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-2.5 leading-normal">
                      {children}
                    </td>
                  ),
                  strong: ({ children }) => (
                    <strong className={`font-semibold px-1 py-0.5 rounded ${
                      isLight 
                        ? 'bg-[#f0f0f4] text-[#1a1a1d] font-bold' 
                        : 'bg-[#29292e] text-[#ededf4] font-bold'
                    }`}>
                      {children}
                    </strong>
                  ),
                  hr: () => (
                    <div className={`my-8 h-[1px] ${isLight ? 'bg-[#eeeeF2]' : 'bg-[#28282d]'}`} />
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    const codeStr = String(children).replace(/\n$/, '');

                    if (isInline) {
                      return (
                        <code className={`rounded px-1.5 py-0.5 text-xs font-mono ${
                          isLight 
                            ? 'bg-[#f0f0f4] text-[#2c2c30]' 
                            : 'bg-[#26262b] text-[#d6d6de]'
                        }`}>
                          {children}
                        </code>
                      );
                    }

                    return (
                      <div className={`relative my-4 rounded-2xl font-mono text-xs overflow-hidden ${
                        isLight 
                          ? 'bg-[#f5f5f8]' 
                          : 'bg-[#1c1c20]'
                      }`}>
                        <div className={`flex items-center justify-between px-4 py-2 text-[11px] ${
                          isLight 
                            ? 'bg-[#ececf0] text-[#55555c]' 
                            : 'bg-[#242429] text-[#8e8e96]'
                        }`}>
                          <span>MDX Snippet</span>
                          <button
                            onClick={() => handleCopy(codeStr)}
                            className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity"
                          >
                            {copiedCode === codeStr ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>复制代码</span>
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 overflow-x-auto leading-relaxed scrollbar-none">
                          <code>{codeStr}</code>
                        </pre>
                      </div>
                    );
                  }
                }}
              >
                {part}
              </ReactMarkdown>
            </div>
          );
      }
    });
  };

  return (
    <article className={`${fontFamilyClass} prose-neutral transition-colors`}>
      {renderWidgets(content)}
    </article>
  );
};
