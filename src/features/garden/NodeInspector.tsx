import React, { useEffect, useRef } from 'react';
import { X, BookOpen, ArrowUpRight } from 'lucide-react';
import type { DocChapter } from '../../types';
import { byId, childrenById, directRelations, readingEntries, ancestors } from './data';
import { coverageLabel, kindLabel, type KnowledgeNode } from './domain';
import { hubEntries } from './hub-data';
import { useMedia } from './useMedia';
interface Props { node: KnowledgeNode; chapters: DocChapter[]; onClose: () => void; onExpand: (id: string) => void; onRelated: (id: string) => void; onRead: (id: string) => void; }
export function NodeInspector({ node, chapters, onClose, onExpand, onRelated, onRead }: Props) {
  const overlay = useMedia('(max-width: 1023px)');
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const closeCallback = useRef(onClose); closeCallback.current = onClose;
  useEffect(() => {
    if (!overlay) return;
    const origin = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeCallback.current(); }
      if (event.key !== 'Tab') return;
      const items = [...(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],[tabindex="0"]') ?? [])].filter(item => item.getClientRects().length > 0);
      const first = items[0], last = items.at(-1);
      if (!first) { event.preventDefault(); close.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && (document.activeElement === last || !panel.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('keydown', key, true); if (origin?.isConnected) origin.focus({ preventScroll:true }); };
  }, [overlay]);
  const entries = readingEntries(node.id);
  const relations = directRelations(node.id);
  const children = childrenById.get(node.id) ?? [];
  const hubs = hubEntries(node);
  return <div className="garden-detail-layer" onClick={event => { if (overlay && event.target === event.currentTarget) onClose(); }}>
    <aside className="garden-inspector" ref={panel} role={overlay ? 'dialog' : 'complementary'} aria-modal={overlay || undefined} aria-label={`知识详情：${node.label}`}>
      <header><span>{kindLabel[node.kind]}详情</span><button type="button" ref={close} onClick={onClose} aria-label="关闭知识详情"><X /></button></header>
      <div className="garden-inspector-body">
        <p className="garden-eyebrow">{ancestors(node.id).slice(1,-1).map(item => item.label).join(' / ') || 'NextCHINA 知识花园'}</p>
        <h2>{node.label}</h2><div className="garden-badges"><span>框架待完善</span><span>尚未逐项核验</span></div>
        <p>{node.summary || '此节点目前是知识框架条目，独立解释和实验尚待完善。已有阅读入口不等于这个概念已经完整写成。'}</p>
        {hubs.map(hub => <button className="garden-primary" key={hub.id} onClick={() => onExpand(hub.id)}>进入 {hub.label} 专题 <ArrowUpRight /></button>)}
        {children.length > 0 && <button className="garden-primary" onClick={() => onExpand(node.id)}>展开 {children.length} 个下级主题 <ArrowUpRight /></button>}
        <section><h3><BookOpen /> 已有阅读入口 <span>{entries.length}</span></h3>
          {entries.length ? <ul className="garden-reading-links">{entries.map(entry => {
            const article = chapters.find(item => item.id === entry.articleId);
            if (!article) return null;
            return <li key={entry.articleId}><button onClick={() => onRead(article.id)}><small>{coverageLabel[entry.coverage] || entry.coverage}{entry.inherited ? ` · 上级「${entry.from}」的资料` : ''}</small><strong>{article.title}</strong><span>{article.excerpt}</span><em>阅读文章 →</em></button></li>;
          })}</ul> : <p className="garden-muted">还没有绑定正文，不会跳转到空文章。可从相邻主题继续探索。</p>}
        </section>
        <section><h3>相关知识 <span>{relations.length}</span></h3>
          {relations.length ? <ul className="garden-relations">{relations.map(edge => {
            const other = byId.get(edge.source === node.id ? edge.target : edge.source)!;
            const label = edge.id.startsWith('hub-ref:') ? '专题知识引用' : edge.type === 'related' ? '编辑关联' : edge.target === node.id ? '建议先读' : '后续建议';
            return <li key={edge.id}><small>{label} · 非因果结论</small><button onClick={() => ['hub','branch'].includes(other.kind) ? onExpand(other.id) : onRelated(other.id)}>{other.label}<ArrowUpRight /></button><p>{edge.reason}</p></li>;
          })}</ul> : <p className="garden-muted">尚未标注跨专题关系；缺少连线不表示两个概念无关。</p>}
          <button className="garden-secondary" onClick={() => onRelated(node.id)}>在局部关系图中查看</button>
        </section><p className="garden-node-id">{node.id}</p>
      </div>
    </aside>
  </div>;
}
