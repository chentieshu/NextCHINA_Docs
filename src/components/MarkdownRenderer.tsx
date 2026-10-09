import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { codeBlock, rehypeDocumentHeadings } from '../utils/markdown';
import { MarkdownCodeBlock } from './MarkdownCodeBlock';
import { MarkdownImage } from './MarkdownImage';
import { MarkdownTable } from './MarkdownTable';
import { MermaidDiagram } from './MermaidDiagram';
import { MarkdownTheme } from '../lib/MarkdownTheme';

interface MarkdownRendererProps { content: string; isLight: boolean; }

// Parsing/math layout depend on content, not sidebars or theme. Context only
// updates diagram colors; the same document tree survives reader UI changes.
const MarkdownBody = React.memo(({ content }: { content: string }) => (
    <div className="markdown-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        remarkRehypeOptions={{ footnoteLabel: '注释', footnoteBackLabel: '返回正文' }}
        rehypePlugins={[rehypeDocumentHeadings, [rehypeKatex, { trust: false, throwOnError: false }]]}
        components={{
          a: ({ node: _node, href, children, ...props }) => {
            const external = /^(https?:)?\/\//i.test(href ?? '');
            return <a {...props} href={href} target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}>{children}</a>;
          },
          img: ({ node: _node, ...props }) => <MarkdownImage {...props} />,
          input: ({ node: _node, ...props }) => <input {...props} disabled={props.type === 'checkbox' || props.disabled} />,
          pre: ({ node, children }) => {
            const block = codeBlock(node);
            if (!block) return <pre className="md-plain-pre" tabIndex={0}>{children}</pre>;
            if (block.language === 'mermaid') return <MermaidDiagram chart={block.text} />;
            return <MarkdownCodeBlock code={block.text} language={block.language} />;
          },
          code: ({ node: _node, className, ...props }) => <code {...props} className={className || 'md-inline-code'} />,
          table: ({ node, ...props }) => <MarkdownTable node={node} {...props} />,
          th: ({ node: _node, ...props }) => <th scope="col" {...props} />,
        }}
      >{content}</ReactMarkdown>
    </div>
));
export const MarkdownRenderer = React.memo(({ content, isLight }: MarkdownRendererProps) => (
  <article className={`markdown-body ${isLight ? 'markdown-light' : 'markdown-dark'}`}>
    <MarkdownTheme.Provider value={isLight}><MarkdownBody content={content} /></MarkdownTheme.Provider>
  </article>
));
