import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { ArrowUpRight, BookOpen, GitBranch, Network } from 'lucide-react';
import type { DocChapter } from '../../types';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { byId, childrenById } from './data';
import { hubFor, resourcesUnder, resourceTarget, resourceMeta, resourceLabel } from './hub-data';
import type { KnowledgeNode } from './domain';

const ModelReferenceIndex = lazy(() => import('./ModelReferenceIndex'));
interface Props { node: KnowledgeNode; chapters: DocChapter[]; isLight: boolean; onOpen: (id: string) => void; onConcept: (id: string) => void; onRead: (id: string) => void; }
export function TopicHubView({ node, chapters, isLight, onOpen, onConcept, onRead }: Props) {
  const scroll = useRef<HTMLDivElement>(null);
  const hub = hubFor(node)!;
  const children = (childrenById.get(node.id) ?? []).filter(child => child.kind === 'branch');
  const resources = resourcesUnder(node.id);
  const article = chapters.find(item => item.id === node.embeddedArticleId);
  const meta = article ? resourceMeta(article.id) : undefined;
  const concepts = (node.conceptRefs ?? []).map(id => byId.get(id)).filter((n): n is KnowledgeNode => Boolean(n));
  const relatedHubs = (node.hubRefs ?? []).map(id => byId.get(id)).filter((n): n is KnowledgeNode => Boolean(n));
  useEffect(() => { scroll.current?.scrollTo({ top: 0, behavior: 'instant' }); }, [node.id]);
  return <div ref={scroll} className="hub-content" data-hub={hub.id} data-branch={node.outlinePath ?? ''} role="region" aria-label="专题内容">
    <div className="hub-reading-column">
      <div className="hub-status"><span><GitBranch />{node.kind === 'hub' ? `${children.length} 个分支` : '专题知识大纲'}</span><span>{resources.length} 个已有资源</span><span>导航已接入 · 正文逐步完善</span></div>
      {node.kind === 'hub' && hub.id === 'hub:llm' && <nav className="hub-shortcuts" aria-label="按目标进入 LLM"><span>我想</span>{[['mechanisms','理解内部计算'],['rankings','比较模型能力'],['pricing','查看费用'],['applications','选择产品']].map(([key,label]) => <button key={key} onClick={() => onOpen(`branch:llm:${key}`)}>{label}<ArrowUpRight /></button>)}</nav>}
      {children.length > 0 && <section aria-label="下级知识分支"><h3>继续深入 <span>{children.length}</span></h3><div className="hub-branch-grid">{children.map((child, index) => {
        const count = resourcesUnder(child.id).length;
        return <button key={child.id} className="hub-branch-card" data-branch-id={child.id} aria-label={`进入分支 ${child.label}`} onClick={() => onOpen(child.id)}>
          <div><span className="hub-number">{String(index + 1).padStart(2,'0')}</span><ArrowUpRight /></div><strong>{child.label}</strong>
          {child.summary && <p>{child.summary}</p>}<small>{childrenById.get(child.id)?.length ? `${childrenById.get(child.id)!.length} 个下级问题` : '具体问题'} · {count ? `${count} 个资料入口` : '独立正文待完善'}</small>
        </button>;
      })}</div></section>}
      {article && <section className="hub-resource-reader" aria-label="专题内数据资源" data-resource-id={article.id}>
        <div className="hub-resource-heading"><BookOpen /><div><h3>{article.title}</h3><p>{meta?.metric ? `${meta.metric} · ` : ''}{meta?.snapshotDate ? `来源快照 ${meta.snapshotDate}` : `页面标注日期 ${article.date}；具体条目以正文为准`}</p></div></div>
        <div className="hub-evidence-note">沿用现有资料及原始日期，本次只调整专题组织，未重新核验模型、分数或价格。{article.id === 'terminal-bench' && '这是 Agent 系统任务成绩，不是裸模型能力排名。'}</div>
        {meta?.warning && <p className="hub-source-warning">{meta.warning}</p>}
        <button className="garden-secondary" onClick={() => onRead(article.id)}>在文档阅读器中打开</button>
        <div className="hub-markdown"><MarkdownRenderer content={article.content} isLight={isLight} /></div>
      </section>}
      {!article && resources.length > 0 && <section aria-label="本分支资源"><h3><BookOpen />已有资料 <span>{resources.length}</span></h3><div className="hub-resource-grid">{resources.map(resource => {
        const chapter = chapters.find(item => item.id === resource.articleId);
        if (!chapter) return null;
        const target = resourceTarget(node.id, chapter.id);
        const source = resourceMeta(chapter.id);
        return <button className="hub-resource-card" key={chapter.id} data-resource-link={chapter.id} onClick={() => target ? onOpen(target) : onRead(chapter.id)}>
          <small>{resourceLabel(resource)}</small><strong>{chapter.title}</strong>
          {source?.snapshotDate ? <span>快照：{source.snapshotDate} · {source.metric}</span> : <span>页面日期：{chapter.date}，具体来源日期见正文</span>}
          {source?.rowCount !== undefined && <span>{source.rowCount} 条来源记录 · 不声称完整实时榜</span>}
          <em>{target ? '在专题中查看' : '阅读已有资料'} →</em>
        </button>;
      })}</div></section>}
      {node.hubId === 'hub:llm' && ['models','models/model-detail'].includes(node.outlinePath ?? '') && <Suspense fallback={<p role="status">正在读取模型来源索引…</p>}><ModelReferenceIndex onOpen={onOpen} /></Suspense>}
      {concepts.length > 0 && <section aria-label="共享知识引用"><h3><Network />共享知识</h3><p className="hub-note">引用规范概念节点。已有总览不代表该问题已完成独立讲解。</p><div className="hub-reference-links">{concepts.map(concept => <button key={concept.id} onClick={() => onConcept(concept.id)}>{concept.label}<ArrowUpRight /></button>)}</div></section>}
      {relatedHubs.length > 0 && <section aria-label="相关专题"><h3>相关专题</h3><div className="hub-reference-links">{relatedHubs.map(item => <button key={item.id} onClick={() => onOpen(item.id)}>{item.label}<ArrowUpRight /></button>)}</div><p className="hub-note">专题关联不是模型结构关系；RAG、Agent 与产品分别保留自己的身份。</p></section>}
      {!children.length && !resources.length && <div className="hub-empty" role="note"><strong>这个问题已进入大纲，独立正文尚待完善。</strong><p>{node.microscopeId ? '已有 Attention 数值校验样例，但本分支尚未接入可操作的计算实验。' : '这里不会自动打开同一篇概括文章，也不会生成空白文章。可以查看共享概念，或返回上级分支选择已有资料。'}</p></div>}
      {node.kind === 'hub' && !children.length && <p className="hub-note">该专题目前是关联入口，专属多级大纲尚未接入。LLM 已提供完整分支框架。</p>}
    </div>
  </div>;
}
