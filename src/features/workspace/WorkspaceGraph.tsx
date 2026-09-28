import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { AppRoute } from '../../routing';
import '../../styles/garden.css';
import GardenCanvas from '../garden/GardenCanvas';
import { byId, directRelations, searchNodes } from '../garden/data';
import { edgeLabel, kindLabel, type RelationKind } from '../garden/domain';
import { globalKnowledgeProjection, documentRoute, type ExplorerModel } from './model';

interface Props { model: ExplorerModel; isLight: boolean; onOpen: (route: AppRoute) => void; }

export default function WorkspaceGraph({ model, isLight, onOpen }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<RelationKind[]>([]);
  const [query, setQuery] = useState('');
  const projection = useMemo(() => globalKnowledgeProjection(selectedId), [selectedId]);
  const selected = selectedId ? byId.get(selectedId) : undefined;
  const selectedArticle = selected?.embeddedArticleId
    ? model.documents.get(selected.embeddedArticleId)
    : selected?.articleBindings[0]
      ? model.documents.get(selected.articleBindings[0].articleId)
      : selected?.resourceRefs?.[0]
        ? model.documents.get(selected.resourceRefs[0].articleId)
        : undefined;
  const results = useMemo(() => query.trim()
    ? searchNodes(query).filter(node => !['root','group','path','document'].includes(node.kind)).slice(0, 12)
    : [], [query]);
  const toggleEdge = (type: RelationKind) => setHidden(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type]);
  const focus = (id: string) => { setSelectedId(id); setQuery(''); };
  const relationCount = selected ? directRelations(selected.id).length : 0;

  return <div className="ws-graph-pane" data-inspector={Boolean(selected) || (projection.index?.length ?? 0) > 0} data-layer="global">
    <div className="ws-graph-caption ws-global-graph-header">
      <span><strong>宏观关系图</strong> · {projection.nodes.length} 个节点 · {projection.index?.length ?? 0} 条知识关联{projection.omitted ? ` · ${projection.omitted} 个空大纲不在图上` : ''}</span>
      <label className="ws-graph-search"><Search /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索任意知识点…" aria-label="搜索知识网络" /></label>
      {selectedId && <button type="button" onClick={() => setSelectedId(null)}><X />清除聚焦</button>}
    </div>
    {results.length > 0 && <div className="ws-graph-search-results" role="listbox" aria-label="知识网络搜索结果">
      {results.map(node => <button type="button" role="option" key={node.id} onClick={() => focus(node.id)}>{kindLabel[node.kind]} · {node.label}</button>)}
    </div>}
    <div className="ws-graph-legend" role="group" aria-label="关系类型">
      {(['browse_child', 'recommended_before', 'related'] as RelationKind[]).map(type => (
        <button type="button" key={type} aria-pressed={!hidden.includes(type)} onClick={() => toggleEdge(type)}>{edgeLabel[type]}</button>
      ))}
      <span>目录是阅读入口；学习与关联用于复用知识，不表示因果。</span>
    </div>
    <div className="ws-graph-body">
      <div className="ws-graph-canvas">
        <GardenCanvas key={projection.key} projection={projection} selectedId={selectedId} scopeId="root:ai" isLight={isLight}
          hiddenEdgeTypes={hidden} onSelect={setSelectedId} onExpand={focus} onList={() => onOpen({ kind: 'home' })} />
      </div>
      {selected && <aside className="ws-graph-inspector" aria-label="知识节点简报">
        <p className="ws-graph-kicker">{kindLabel[selected.kind]}</p>
        <h2>{selected.label}</h2>
        <p>{selected.summary || '这是全局知识网络中的规范知识节点。专题与文档引用它，而不是复制它。'}</p>
        <p className="ws-muted">{relationCount} 条直接语义关联 · {selected.articleBindings.length + (selected.resourceRefs?.length ?? 0)} 个阅读资源</p>
        {selectedArticle && <button type="button" onClick={() => onOpen(documentRoute(selectedArticle.id, model.occurrence(selectedArticle.id)?.nodeId))}>阅读 {selectedArticle.title}</button>}
        <p className="ws-muted">仍是同一张宏观关系图。聚焦只是把这个知识点的邻域留在画面里。</p>
      </aside>}
      {!selected && (projection.index?.length ?? 0) > 0 && <aside className="ws-graph-inspector" aria-label="全部知识关联">
        <p className="ws-graph-kicker">同一张图</p>
        <h2>全部知识关联</h2>
        <p>地图上是领域、专题，以及已经写明关联的知识点。下面按原文列出每一条关联，点一下即在图上定位。</p>
        {(['path', 'before', 'related', 'cite'] as const).map(tone => {
          const rows = projection.index?.filter(entry => entry.tone === tone) ?? [];
          if (!rows.length) return null;
          const title = tone === 'path' ? '阅读路径' : tone === 'before' ? '建议先学' : tone === 'related' ? '知识关联' : '专题引用';
          return <section key={tone}><h3>{title}</h3><ul className="ws-macro-index">{rows.map(entry =>
            <li key={entry.id}><button type="button" onClick={() => entry.focusId && setSelectedId(entry.focusId)}>{entry.text}</button></li>
          )}</ul></section>;
        })}
      </aside>}
    </div>
  </div>;
}
