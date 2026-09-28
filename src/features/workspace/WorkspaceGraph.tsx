import React, { useEffect, useMemo, useState } from 'react';
import type { AppRoute } from '../../routing';
import '../../styles/garden.css';
import GardenCanvas from '../garden/GardenCanvas';
import { byId } from '../garden/data';
import { edgeLabel, kindLabel, type RelationKind } from '../garden/domain';
import { graphProjection, documentRoute, folderRoute, type ExplorerModel, type GraphLayer } from './model';

interface Props { scopeId: string; model: ExplorerModel; isLight: boolean; onOpen: (route: AppRoute) => void; }

export default function WorkspaceGraph({ scopeId, model, isLight, onOpen }: Props) {
  const defaultLayer: GraphLayer = scopeId === 'root:ai' ? 'atlas' : 'explore';
  const [layer, setLayer] = useState<GraphLayer>(defaultLayer);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<RelationKind[]>([]);
  useEffect(() => { setLayer(scopeId === 'root:ai' ? 'atlas' : 'explore'); setSelectedId(null); }, [scopeId]);
  const projection = useMemo(() => graphProjection(scopeId, model, scopeId === 'root:ai' ? layer : 'explore'), [scopeId, model, layer]);
  const selected = selectedId ? projection.nodes.find(node => node.id === selectedId) ?? byId.get(selectedId) : undefined;
  const selectedArticle = selected?.id.startsWith('article:') ? model.documents.get(selected.id.slice(8)) : selected?.articleBindings[0] ? model.documents.get(selected.articleBindings[0].articleId) : undefined;
  const toggleEdge = (type: RelationKind) => setHidden(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type]);
  const openNode = (id: string) => {
    if (id.startsWith('article:')) onOpen(documentRoute(id.slice(8), model.occurrence(id.slice(8))?.nodeId));
    else onOpen(folderRoute(id, true));
  };
  if (!projection.nodes.length) return <div className="ws-empty"><h2>此位置尚无可展示的关系</h2><button onClick={() => onOpen(folderRoute('root:ai', true))}>查看全库领域图</button></div>;
  return <div className="ws-graph-pane" data-inspector={Boolean(selected)}>
    <div className="ws-graph-caption">
      <span>{layer === 'atlas' ? '宏观领域图' : layer === 'documents' ? '文档收录关系' : '局部知识关系'} · {projection.nodes.length} 个节点{projection.omitted ? ` · 另有 ${projection.omitted} 个未展开` : ''}</span>
      {scopeId === 'root:ai' && <button type="button" aria-pressed={layer === 'atlas'} onClick={() => setLayer('atlas')}>领域</button>}
      {scopeId === 'root:ai' && <button type="button" aria-pressed={layer === 'documents'} onClick={() => setLayer('documents')}>文档</button>}
      <button type="button" onClick={() => onOpen(folderRoute('root:ai', true))}>全库</button>
      <button type="button" onClick={() => onOpen(folderRoute(scopeId))}>目录列表</button>
    </div>
    <div className="ws-graph-legend" role="group" aria-label="关系类型">
      {(['browse_child', 'recommended_before', 'related'] as RelationKind[]).map(type => (
        <button type="button" key={type} aria-pressed={!hidden.includes(type)} onClick={() => toggleEdge(type)}>{edgeLabel[type]}</button>
      ))}
    </div>
    <div className="ws-graph-body">
      <div className="ws-graph-canvas">
        <GardenCanvas key={projection.key} projection={projection} selectedId={selectedId} scopeId={scopeId} isLight={isLight}
          hiddenEdgeTypes={hidden}
          onSelect={setSelectedId}
          onExpand={openNode}
          onList={() => onOpen(folderRoute(scopeId))} />
      </div>
      {selected && <aside className="ws-graph-inspector" aria-label="节点简报">
        <p className="ws-graph-kicker">{kindLabel[selected.kind]}</p>
        <h2>{selected.label}</h2>
        <p>{selected.summary || selectedArticle?.excerpt || '此节点目前只有框架位置，还不是完成文章。'}</p>
        {selectedArticle && <button type="button" onClick={() => onOpen(documentRoute(selectedArticle.id, model.occurrence(selectedArticle.id)?.nodeId))}>阅读 {selectedArticle.title}</button>}
        {selected.kind !== 'document' && <button type="button" onClick={() => openNode(selected.id)}>在图中展开</button>}
        <p className="ws-muted">图上的收录与关联不是因果或能力证明。</p>
      </aside>}
    </div>
  </div>;
}
