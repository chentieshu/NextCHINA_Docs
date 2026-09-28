import React, { useEffect, useMemo, useState } from 'react';
import type { AppRoute } from '../../routing';
import '../../styles/garden.css';
import GardenCanvas from '../garden/GardenCanvas';
import { byId, graph } from '../garden/data';
import { edgeLabel, kindLabel, type RelationKind } from '../garden/domain';
import { graphProjection, documentRoute, folderRoute, type ExplorerModel, type GraphLayer } from './model';

interface Props { scopeId: string; model: ExplorerModel; isLight: boolean; onOpen: (route: AppRoute) => void; }

const captions: Record<GraphLayer, string> = {
  atlas: '宏观领域图',
  paths: '规划阅读路径',
  explore: '局部知识关系',
  documents: '文档收录关系'
};

export default function WorkspaceGraph({ scopeId, model, isLight, onOpen }: Props) {
  const isRoot = scopeId === 'root:ai';
  const [layer, setLayer] = useState<GraphLayer>(isRoot ? 'atlas' : 'explore');
  const [groupId, setGroupId] = useState<string | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden, setHidden] = useState<RelationKind[]>([]);
  useEffect(() => {
    setLayer(scopeId === 'root:ai' ? 'atlas' : 'explore');
    setSelectedId(null);
    setGroupId(undefined);
  }, [scopeId]);
  const activeLayer: GraphLayer = isRoot ? layer : layer === 'documents' || layer === 'paths' ? layer : 'explore';
  const projection = useMemo(
    () => graphProjection(scopeId, model, activeLayer, groupId),
    [scopeId, model, activeLayer, groupId]
  );
  const selected = selectedId ? projection.nodes.find(node => node.id === selectedId) ?? byId.get(selectedId) : undefined;
  const selectedArticle = selected?.id.startsWith('article:') ? model.documents.get(selected.id.slice(8)) : selected?.articleBindings[0] ? model.documents.get(selected.articleBindings[0].articleId) : undefined;
  const selectedPath = selected?.kind === 'path' ? graph.learningPaths.find(path => `path:${path.id}` === selected.id) : undefined;
  const toggleEdge = (type: RelationKind) => setHidden(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type]);
  const openNode = (id: string) => {
    if (id.startsWith('article:')) {
      onOpen(documentRoute(id.slice(8), model.occurrence(id.slice(8))?.nodeId));
      return;
    }
    if (id.startsWith('group:')) {
      setLayer('atlas');
      setGroupId(id.slice(6));
      setSelectedId(id);
      return;
    }
    if (id.startsWith('path:')) {
      setSelectedId(id);
      return;
    }
    onOpen(folderRoute(id, true));
  };
  if (!projection.nodes.length) return <div className="ws-empty"><h2>此位置尚无可展示的关系</h2><button onClick={() => onOpen(folderRoute('root:ai', true))}>查看全库领域图</button></div>;
  return <div className="ws-graph-pane" data-inspector={Boolean(selected)} data-layer={projection.layer}>
    <div className="ws-graph-caption">
      <span>{captions[projection.layer ?? activeLayer]}{groupId ? ` · ${graph.groups.find(group => group.id === groupId)?.label ?? groupId}` : ''} · {projection.nodes.length} 个节点{projection.omitted ? ` · 另有 ${projection.omitted} 个未展开` : ''}</span>
      <button type="button" aria-pressed={activeLayer === 'atlas'} onClick={() => { setLayer('atlas'); }}>领域</button>
      <button type="button" aria-pressed={activeLayer === 'paths'} onClick={() => { setLayer('paths'); setGroupId(undefined); }}>路径</button>
      <button type="button" aria-pressed={activeLayer === 'documents'} onClick={() => { setLayer('documents'); setGroupId(undefined); }}>文档</button>
      {groupId && <button type="button" onClick={() => setGroupId(undefined)}>全部目的</button>}
      {!isRoot && <button type="button" aria-pressed={activeLayer === 'explore'} onClick={() => setLayer('explore')}>局部</button>}
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
        {selectedPath && <ol className="ws-graph-steps">{selectedPath.steps.map(id => <li key={id}>{byId.get(id)?.label ?? id}</li>)}</ol>}
        {selectedArticle && <button type="button" onClick={() => onOpen(documentRoute(selectedArticle.id, model.occurrence(selectedArticle.id)?.nodeId))}>阅读 {selectedArticle.title}</button>}
        {selected.kind === 'group' && <button type="button" onClick={() => openNode(selected.id)}>只看这一目的下的领域</button>}
        {selected.kind !== 'document' && selected.kind !== 'group' && selected.kind !== 'path' && <button type="button" onClick={() => openNode(selected.id)}>在图中展开</button>}
        <p className="ws-muted">图上的收录、路径与关联不是因果或能力证明。</p>
      </aside>}
    </div>
  </div>;
}
