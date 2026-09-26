import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getReactNodeText, slugifyHeading } from '../utils/slugify';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  isLight: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isLight }) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const headingOccurrences = new Map<string, number>();
  const headingId = (text: string) => {
    const base = slugifyHeading(text) || 'section';
    const occurrence = headingOccurrences.get(base) ?? 0;
    headingOccurrences.set(base, occurrence + 1);
    return occurrence === 0 ? base : `${base}-${occurrence + 1}`;
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    window.setTimeout(() => setCopiedCode(null), 1600);
  };

  return (
    <article className={`markdown-body w-full min-w-0 font-sans text-[15px] sm:text-base ${isLight ? 'markdown-light' : 'markdown-dark'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 id={headingId(getReactNodeText(children))}>{children}</h1>,
          h2: ({ children }) => <h2 id={headingId(getReactNodeText(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(getReactNodeText(children))}>{children}</h3>,
          h4: ({ children }) => <h4 id={headingId(getReactNodeText(children))}>{children}</h4>,
          h5: ({ children }) => <h5 id={headingId(getReactNodeText(children))}>{children}</h5>,
          h6: ({ children }) => <h6 id={headingId(getReactNodeText(children))}>{children}</h6>,
          a: ({ children, href }) => {
            const external = /^https?:\/\//i.test(href ?? '');
            return <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer noopener' : undefined}>{children}</a>;
          },
          img: ({ src, alt, title }) => <img src={src} alt={alt ?? ''} title={title} loading="lazy" decoding="async" />,
          input: (props) => <input {...props} disabled={props.type === 'checkbox' ? true : props.disabled} />,
          pre: ({ children }) => {
            const child = React.Children.toArray(children).find((node) => React.isValidElement(node));
            if (!React.isValidElement<{ className?: string; children?: React.ReactNode }>(child) || child.type !== 'code') {
              return <pre className="md-plain-pre">{children}</pre>;
            }
            const code = String(child.props.children ?? '').replace(/\n$/, '');
            const language = child.props.className?.replace('language-', '') || 'code';
            return (
              <div className="md-codeblock">
                <div className="md-codebar">
                  <span>{language}</span>
                  <button type="button" onClick={() => handleCopy(code)} aria-label="复制代码">
                    {copiedCode === code ? <><Check className="h-3.5 w-3.5" />已复制</> : <><Copy className="h-3.5 w-3.5" />复制</>}
                  </button>
                </div>
                <pre><code className={child.props.className}>{child.props.children}</code></pre>
              </div>
            );
          },
          code: ({ children, className }) => className
            ? <code className={className}>{children}</code>
            : <code className="md-inline-code">{children}</code>,
          table: ({ children }) => <div className="md-table-scroll"><table>{children}</table></div>
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
};
