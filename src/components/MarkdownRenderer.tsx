import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getReactNodeText, slugifyHeading } from '../utils/slugify';
import { Quote, Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isLight: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isLight }) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <article className="font-sans prose-neutral transition-colors w-full min-w-0 overflow-hidden">
      <div className="markdown-body min-w-0 text-[15px] sm:text-base">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => {
              const text = getReactNodeText(children);
              return <h1 id={slugifyHeading(text)} className={`text-2xl sm:text-3xl font-bold tracking-tight mt-9 sm:mt-10 mb-4 break-words scroll-mt-24 ${isLight ? 'text-[#1c1c20]' : 'text-[#e4e4ea]'}`}>{children}</h1>;
            },
            h2: ({ children }) => {
              const text = getReactNodeText(children);
              return <h2 id={slugifyHeading(text)} className={`text-xl sm:text-2xl font-bold tracking-tight mt-9 sm:mt-10 mb-3 break-words scroll-mt-24 ${isLight ? 'text-[#1c1c20]' : 'text-[#e0e0e6]'}`}>{children}</h2>;
            },
            h3: ({ children }) => {
              const text = getReactNodeText(children);
              return (
                <h3 id={slugifyHeading(text)} className={`text-lg sm:text-xl font-semibold mt-7 mb-2.5 scroll-mt-24 flex items-start gap-2 break-words ${isLight ? 'text-[#26262a]' : 'text-[#d4d4dc]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-[#787880]' : 'bg-[#9898a0]'}`} />
                  <span className="min-w-0">{children}</span>
                </h3>
              );
            },
            h4: ({ children }) => <h4 className={`text-base font-semibold mt-5 mb-2 ${isLight ? 'text-[#2e2e33]' : 'text-[#c8c8d0]'}`}>{children}</h4>,
            p: ({ children }) => <p className={`my-4 font-normal leading-7 sm:leading-relaxed break-words ${isLight ? 'text-[#38383e]' : 'text-[#b8b8c2]'}`}>{children}</p>,
            a: ({ children, href }) => (
              <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noreferrer noopener' : undefined}
                className={`underline underline-offset-4 decoration-1 transition-colors break-words [overflow-wrap:anywhere] ${isLight ? 'text-[#303038] decoration-[#aaaab2] hover:text-black' : 'text-[#d0d0dc] decoration-[#5f5f6a] hover:text-white'}`}>
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <div className={`relative my-5 sm:my-6 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 ${isLight ? 'bg-[#f4f4f7] text-[#34343a]' : 'bg-[#222226] text-[#c5c5cd]'}`}>
                <div className="flex items-start gap-3"><Quote className="h-4 w-4 opacity-40 shrink-0 mt-1" /><div className="font-serif-sc text-sm md:text-base italic leading-relaxed">{children}</div></div>
              </div>
            ),
            ul: ({ children }) => <ul className="my-4 space-y-2 list-disc pl-5 sm:pl-6">{children}</ul>,
            ol: ({ children }) => <ol className="my-4 space-y-2 list-decimal pl-5 sm:pl-6">{children}</ol>,
            li: ({ children }) => <li className={`text-[15px] sm:text-base leading-7 sm:leading-relaxed pl-0.5 sm:pl-1 break-words ${isLight ? 'text-[#38383e]' : 'text-[#b8b8c2]'}`}>{children}</li>,
            table: ({ children }) => <div className={`markdown-table my-5 sm:my-6 overflow-x-auto rounded-xl sm:rounded-2xl p-0.5 sm:p-1 overscroll-x-contain ${isLight ? 'bg-[#f7f7fa]' : 'bg-[#202024]'}`}><table className={`w-max min-w-full text-left text-xs sm:text-sm ${isLight ? 'text-[#34343a]' : 'text-[#cfcfd6]'}`}>{children}</table></div>,
            thead: ({ children }) => <thead className={`font-semibold font-mono text-xs ${isLight ? 'bg-[#ededf1] text-[#222226]' : 'bg-[#28282d] text-[#e0e0e6]'}`}>{children}</thead>,
            th: ({ children }) => <th className="px-3 sm:px-4 py-2.5 whitespace-nowrap">{children}</th>,
            td: ({ children }) => <td className="px-3 sm:px-4 py-2.5 leading-normal align-top min-w-[9rem] max-w-[22rem] break-words">{children}</td>,
            strong: ({ children }) => <strong className={`font-semibold px-1 py-0.5 rounded ${isLight ? 'bg-[#f0f0f4] text-[#1a1a1d]' : 'bg-[#29292e] text-[#ededf4]'}`}>{children}</strong>,
            hr: () => <div className={`my-8 h-px ${isLight ? 'bg-[#eeeeF2]' : 'bg-[#28282d]'}`} />,
            code: ({ children, className }) => {
              const isInline = !className;
              const codeStr = String(children).replace(/\n$/, '');
              if (isInline) return <code className={`rounded px-1.5 py-0.5 text-xs font-mono break-words [overflow-wrap:anywhere] ${isLight ? 'bg-[#f0f0f4] text-[#2c2c30]' : 'bg-[#26262b] text-[#d6d6de]'}`}>{children}</code>;
              return (
                <div className={`relative my-4 rounded-xl sm:rounded-2xl font-mono text-xs overflow-hidden min-w-0 ${isLight ? 'bg-[#f5f5f8]' : 'bg-[#1c1c20]'}`}>
                  <div className={`flex items-center justify-between px-4 py-2 text-[11px] ${isLight ? 'bg-[#ececf0] text-[#55555c]' : 'bg-[#242429] text-[#8e8e96]'}`}>
                    <span>{className?.replace('language-', '') || 'Code'}</span>
                    <button onClick={() => handleCopy(codeStr)} className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                      {copiedCode === codeStr ? <><Check className="h-3 w-3" /><span>已复制</span></> : <><Copy className="h-3 w-3" /><span>复制代码</span></>}
                    </button>
                  </div>
                  <pre className="p-3 sm:p-4 overflow-x-auto leading-relaxed overscroll-x-contain"><code className={className}>{children}</code></pre>
                </div>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </article>
  );
};
