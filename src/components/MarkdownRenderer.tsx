import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { createMarkdownSlugger, getReactNodeText } from '../utils/slugify';
import { Copy, Check } from 'lucide-react';
import { MermaidDiagram } from './MermaidDiagram';


function getTableColumnCount(children: React.ReactNode): number {
  const sections = React.Children.toArray(children);
  const thead = sections.find(
    child => React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === 'thead'
  );
  if (!React.isValidElement<{ children?: React.ReactNode }>(thead)) return 0;

  const row = React.Children.toArray(thead.props.children).find(
    child => React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === 'tr'
  );
  if (!React.isValidElement<{ children?: React.ReactNode }>(row)) return 0;

  return React.Children.count(row.props.children);
}

interface MarkdownRendererProps {
  content: string;
  isLight: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isLight }) => {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const headingSlugger = createMarkdownSlugger();
  const headingId = (text: string) => headingSlugger.slug(text);

  const handleCopy = async (text: string) => {
    await navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    window.setTimeout(() => setCopiedCode(null), 1600);
  };

  return (
    <article className={`markdown-body w-full min-w-0 font-sans text-[15px] sm:text-base ${isLight ? 'markdown-light' : 'markdown-dark'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
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
            if (language.toLowerCase() === 'mermaid') {
              return <MermaidDiagram chart={code} isLight={isLight} />;
            }
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
          table: ({ children }) => {
            const columns = getTableColumnCount(children);
            const layout = columns <= 2 ? 'narrow' : columns <= 4 ? 'standard' : 'wide';
            return (
              <div className={`md-table-region md-table-${layout}`} data-columns={columns || undefined}>
                <div
                  className="md-table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label={columns ? `Markdown 表格，共 ${columns} 列` : 'Markdown 表格'}
                >
                  <table>{children}</table>
                </div>
              </div>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
};
