import React, { useMemo, useRef, useState } from 'react';
import { Search, X, List, ArrowUpRight } from 'lucide-react';
import type { AppRoute } from '../../routing';
import '../../styles/garden.css';
import GardenCanvas from '../garden/GardenCanvas';
import { byId, graph, directRelations, searchNodes } from '../garden/data';
import { edgeLabel, kindLabel, type RelationKind } from '../garden/domain';
import { globalKnowledgeProjection, documentRoute, folderRoute, type ExplorerModel } from './model';
import { macroOverviewProjection } from './macroOverview';
interface Props { model: ExplorerModel; isLight: boolean; onOpen: (route: AppRoute) => void; }

export default function WorkspaceGraph({ model, isLight, onOpen }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [hidden, setHidden] = useState<RelationKind[]>([]);
  const [query, setQuery] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const network = useMemo(() => globalKnowledgeProjection(expandedId), [expandedId]);
  const macro = useMemo(() => macroOverviewProjection(globalKnowledgeProjection()), []);
  const projection = detail ? network : macro;
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const results = useMemo(() => query.trim() ? searchNodes(query).filter(node => !['root','group','path','document'].includes(node.kind)).slice(0, 12) : [], [query]);
  const resources = useMemo(() => {
    if (!selected) return [];
    const ids = new Set([...selected.articleBindings.map(ref => ref.articleId), ...(selected.resourceRefs ?? []).map(ref => ref.articleId)]);
    if (selected.embeddedArticleId) ids.add(selected.embeddedArticleId);
    for (const [id, entry] of model.entries) if (entry.articleId && (entry.nodeId === selected.id || model.parents(id).includes(selected.id))) ids.add(entry.articleId);
    return [...ids].flatMap(id => { const doc = model.documents.get(id); return doc ? [doc] : []; });
  }, [selected, model]);
  const focus = (id: string, expand = false) => {
    setSelectedId(id); setIndexOpen(false); setQuery('');
    if (expand || !macro.nodes.some(node => node.id === id)) { setExpandedId(id); setDetail(true); }
  };
  const overview = () => { setSelectedId(null); setExpandedId(null); setDetail(false); setQuery(''); setIndexOpen(false); };
  const toggleEdge = (type: RelationKind) => setHidden(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type]);
  const counts = useMemo(() => ({ domains: graph.nodes.filter(node => node.kind === 'domain').length, hubs: graph.nodes.filter(node => node.kind === 'hub').length, concepts: graph.nodes.filter(node => node.kind === 'concept').length }), []);

  return <div className="ws-graph-pane ws-macro-home" data-inspector={Boolean(selected) || indexOpen} data-layer="global" data-density={detail ? 'knowledge' : 'macro'}>
    <div className="ws-macro-heading">
      <div><p className="ws-graph-kicker">NEXTCHINA / AI KNOWLEDGE</p><h1>宏观关系图</h1><p className="ws-macro-intro">先看全貌，再进入任何一个知识点。</p></div>
      <div className="ws-macro-summary" aria-label="知识库规模"><span><strong>{counts.domains}</strong> 领域</span><span><strong>{counts.hubs}</strong> 专题</span><span><strong>{counts.concepts}</strong> 知识点</span><span><strong>{model.documents.size}</strong> 文档</span></div>
    </div>
    <div className="ws-map-tools">
      <div className="ws-map-actions">
        <div className="ws-map-density" role="group" aria-label="全局图显示层级"><button type="button" aria-pressed={!detail} onClick={overview}>宏观结构</button><button type="button" aria-pressed={detail} onClick={() => setDetail(true)}>知识关联</button></div>
        <div className="ws-map-search-wrap">
          <label className="ws-graph-search"><Search /><input ref={search} type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if ((event.key === 'Enter' || event.key === 'ArrowDown') && results.length) { event.preventDefault(); if (event.key === 'Enter') focus(results[0].id); else document.getElementById('knowledge-search-results')?.querySelector<HTMLElement>('[role="option"]')?.focus(); } if (event.key === 'Escape') setQuery(''); }} placeholder="搜索知识点，如 Attention、RAG…" aria-label="搜索知识网络" aria-controls={query.trim() ? 'knowledge-search-results' : undefined} /></label>
          {query.trim() && <div id="knowledge-search-results" className="ws-graph-search-results" role="listbox" aria-label="知识网络搜索结果" onKeyDown={event => {
            const options = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')];
            const index = options.indexOf(document.activeElement as HTMLElement);
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus(); }
            if (event.key === 'Escape') { setQuery(''); search.current?.focus(); }
          }}>{results.length ? results.map(node => <button type="button" role="option" aria-selected={node.id === selectedId} key={node.id} onClick={() => focus(node.id)}>{kindLabel[node.kind]} · {node.label}</button>) : <p className="ws-muted" role="status">未找到匹配知识点。也可以从侧栏搜索文档全文。</p>}</div>}
        </div>
        <button type="button" className="ws-map-index-toggle" aria-expanded={indexOpen} aria-label="显示全部知识关联" onClick={() => { setSelectedId(null); setIndexOpen(value => !value); }}><List /><span>关系索引</span></button>
        {(selectedId || detail) && <button type="button" onClick={overview}><X /><span>回到全貌</span></button>}
      </div>
      <div className="ws-graph-legend" role="group" aria-label="关系类型">{(['browse_child','recommended_before','related'] as RelationKind[]).map(type => <button type="button" key={type} data-relation={type} aria-pressed={!hidden.includes(type)} onClick={() => toggleEdge(type)}>{edgeLabel[type]}</button>)}<span>{detail ? '知识点复用同一份定义，不按文章重复建图。' : '领域 / 专题概览；关联线来自已有知识关系，不代表因果。'}</span></div>
    </div>
    <div className="ws-graph-body">
      <div className="ws-graph-canvas"><GardenCanvas key={projection.key} projection={projection} selectedId={selectedId} scopeId="root:ai" isLight={isLight} hiddenEdgeTypes={hidden} onSelect={id => focus(id)} onExpand={id => focus(id, true)} onList={() => onOpen(documentRoute('overview'))} /></div>
      {selected && <aside className="ws-graph-inspector" aria-label="知识节点简报">
        <div className="ws-inspector-top"><p className="ws-graph-kicker">{kindLabel[selected.kind]}</p><button type="button" aria-label="关闭知识节点简报" onClick={() => setSelectedId(null)}><X /></button></div>
        <h2>{selected.label}</h2><p>{selected.summary || '同一知识节点可以被多个专题和文档引用。'}</p>
        <p className="ws-muted">{directRelations(selected.id).length} 条直接关联 · {resources.length} 份阅读资料</p>
        <button type="button" onClick={() => onOpen(folderRoute(selected.id))}>打开对应目录 <ArrowUpRight /></button>
        <h3>阅读资料</h3>{resources.length ? resources.map(doc => <button type="button" className="ws-node-resource" key={doc.id} onClick={() => onOpen(documentRoute(doc.id, model.occurrence(doc.id)?.nodeId))}>阅读 {doc.title}<ArrowUpRight /></button>) : <p>本节点尚无独立文档，不把总览冒充已经完成的讲解。</p>}
        <p className="ws-muted">聚焦与展开只是同一全局知识网的观察层级。</p>
      </aside>}
      {!selected && indexOpen && <aside className="ws-graph-inspector" aria-label="全部知识关联">
        <div className="ws-inspector-top"><p className="ws-graph-kicker">显式关系 / 阅读路径</p><button type="button" aria-label="关闭关系索引" onClick={() => setIndexOpen(false)}><X /></button></div>
        <h2>全部知识关联</h2><p>保留每条关系的原始说明；点击后在同一张图中定位。</p>
        {(['path','before','related','cite'] as const).map(tone => {
          const rows = network.index?.filter(entry => entry.tone === tone) ?? [];
          return rows.length ? <section key={tone}><h3>{tone === 'path' ? '阅读路径' : tone === 'before' ? '建议先学' : tone === 'related' ? '知识关联' : '专题引用'}</h3><ul className="ws-macro-index">{rows.map(entry => <li key={entry.id}><button type="button" onClick={() => entry.focusId && focus(entry.focusId)}>{entry.text}</button></li>)}</ul></section> : null;
        })}
      </aside>}
    </div>
  </div>;
}
