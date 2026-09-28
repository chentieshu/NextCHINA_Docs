import React, { memo, useEffect, useMemo, useState } from 'react';
import { ReactFlow, Handle, Position, Background, BackgroundVariant, MarkerType,
  type Node, type NodeProps, type Edge, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Minus, Maximize, RotateCcw } from 'lucide-react';
import { layoutGraph, nodeSize, type Positions } from './layout';
import { childrenById } from './data';
import { edgeLabel, kindLabel, type KnowledgeNode, type RelationKind } from './domain';
import type { Projection } from './projection';
import { savedViewport, rememberViewport } from './viewport';
import { useMedia } from './useMedia';

type FlowNode = Node<{ item: KnowledgeNode; inspect: (id: string) => void; expand: (id: string) => void; isScope: boolean; dimmed: boolean }, 'knowledge'>;
function actionLabel(item: KnowledgeNode) {
  if (item.kind === 'document') return { text: '阅读 →', name: `查看 ${item.label}` };
  if (item.kind === 'group') return { text: '只看这组', name: `只看 ${item.label}` };
  if (item.kind === 'path') return { text: '查看步骤', name: `查看路径 ${item.label}` };
  return { text: '展开 →', name: `展开 ${item.label}` };
}
const KnowledgeCard = memo(function KnowledgeCard({ data, selected }: NodeProps<FlowNode>) {
  const { item, inspect, expand, isScope, dimmed } = data;
  const count = childrenById.get(item.id)?.length ?? 0;
  const reading = item.kind === 'document' || item.articleBindings.length > 0;
  const action = actionLabel(item);
  return <div className="garden-node nopan" style={{ pointerEvents: 'auto' }} data-active={selected} data-scope={isScope}
    data-kind={item.kind} data-status={reading ? 'ready' : item.contentStatus} data-dimmed={dimmed}>
    <Handle type="target" position={Position.Left} isConnectable={false} />
    <button type="button" className="garden-node-main nodrag" onClick={() => inspect(item.id)} aria-label={`选择 ${item.label}`}>
      <span className="garden-node-kicker">{kindLabel[item.kind]} <span>{item.kind === 'document' ? '可阅读' : item.kind === 'path' ? '规划' : reading ? '有资料' : '框架'}</span></span>
      <strong>{item.label}</strong>
    </button>
    <div className="garden-node-bottom">
      <span>{item.kind === 'document' ? '规范文档' : item.kind === 'path' ? '建议先学' : count ? `${count} 个下级` : item.summary ? '知识节点' : '知识框架'}</span>
      <button type="button" className="nodrag" onClick={() => expand(item.id)} aria-label={action.name}>{action.text}</button>
    </div>
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </div>;
});
const nodeTypes = { knowledge: KnowledgeCard };
interface Props {
  projection: Projection; selectedId: string | null; scopeId: string; isLight: boolean;
  hiddenEdgeTypes?: RelationKind[];
  onSelect: (id: string) => void; onExpand: (id: string) => void; onList: () => void;
}
export default function GardenCanvas({ projection, selectedId, scopeId, isLight, hiddenEdgeTypes = [], onSelect, onExpand, onList }: Props) {
  const [positions, setPositions] = useState<Positions | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [api, setApi] = useState<ReactFlowInstance<FlowNode> | null>(null);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const narrow = useMedia('(max-width: 639px)');
  const [initialViewport] = useState(() => savedViewport(projection.key));
  const visibleEdges = useMemo(
    () => projection.edges.filter(edge => !hiddenEdgeTypes.includes(edge.type)),
    [projection, hiddenEdgeTypes]
  );
  const neighborhood = useMemo(() => {
    const focus = hovered ?? selectedId;
    if (!focus) return null;
    const ids = new Set([focus]);
    for (const edge of visibleEdges) {
      if (edge.source === focus) ids.add(edge.target);
      if (edge.target === focus) ids.add(edge.source);
    }
    return ids;
  }, [hovered, selectedId, visibleEdges]);
  useEffect(() => {
    const controller = new AbortController();
    setError(''); setPositions(null);
    void layoutGraph(projection, controller.signal).then(result => {
      if (!controller.signal.aborted) setPositions(result);
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '布局失败'); });
    return () => controller.abort();
  }, [projection, attempt]);
  const nodes: FlowNode[] = useMemo(() => {
    const coordinates = new Map((positions ?? []).map(item => [item.id, { x: item.x, y: item.y }]));
    return projection.nodes.map(item => {
      const size = nodeSize(item);
      return {
        id: item.id, type: 'knowledge', position: coordinates.get(item.id) ?? { x: 0, y: 0 },
        data: { item, inspect: onSelect, expand: onExpand, isScope: item.id === scopeId, dimmed: Boolean(neighborhood && !neighborhood.has(item.id)) },
        selected: item.id === selectedId, draggable: false, deletable: false,
        focusable: false, connectable: false, style: { width: size.width, height: size.height }
      };
    });
  }, [positions, projection, onSelect, onExpand, scopeId, selectedId, neighborhood]);
  const edges: Edge[] = useMemo(() => visibleEdges.map(edge => {
    const active = !neighborhood || neighborhood.has(edge.source) && neighborhood.has(edge.target);
    return {
      id: edge.id, source: edge.source, target: edge.target, type: 'smoothstep',
      selectable: false, focusable: false, deletable: false,
      label: edge.type === 'browse_child' ? undefined : edgeLabel[edge.type],
      markerEnd: edge.type === 'related' ? undefined : { type: MarkerType.ArrowClosed, color: 'var(--garden-edge)' },
      style: {
        stroke: 'var(--garden-edge)', strokeWidth: edge.type === 'recommended_before' ? 1.7 : 1.3,
        strokeDasharray: edge.type === 'related' ? '5 5' : edge.type === 'browse_child' ? '2 6' : undefined,
        opacity: active ? 1 : 0.18
      },
      labelStyle: { fill: 'var(--ui-muted)', fontSize: 11 }, labelBgStyle: { fill: 'var(--ui-panel)' }
    };
  }), [visibleEdges, neighborhood]);
  const scope = projection.nodes.find(node => node.id === scopeId);
  const firstFocus = selectedId ?? (scope?.kind === 'concept' ? scopeId : projection.nodes.find(node => node.id !== scopeId)?.id ?? scopeId);
  const initialFitNodes = projection.atlas ? undefined : narrow ? [{ id: firstFocus }] : projection.nodes.slice(0, 4).map(node => ({ id: node.id }));
  const fit = () => void api?.fitView({ padding: .12, minZoom: projection.atlas ? .06 : .25, maxZoom: 1, duration: reduced ? 0 : 160 });
  const legend = projection.atlas
    ? '一张宏观关系图：领域、专题，以及全部已写明的知识关联。空大纲不在图上，可搜索后聚焦。'
    : projection.layer === 'paths'
      ? '规划路径：从左到右是建议先学顺序，不是必修。'
      : projection.layer === 'documents'
        ? '文档挂在收录专题上；虚线是正文链接。'
        : '实线先学 · 虚线关联 · 点线目录。悬停查看邻域。';
  if (error) return <div className="garden-state" role="alert"><h2>图谱布局暂不可用</h2><p>{error}</p><div><button onClick={() => setAttempt(value => value + 1)}>重试布局</button><button onClick={onList}>用列表继续阅读</button></div></div>;
  if (!positions) return <div className="garden-state" role="status">正在整理知识关系…</div>;
  return <div className="garden-canvas" data-layout="ready" data-layer={projection.layer ?? (projection.atlas ? 'atlas' : 'explore')} tabIndex={0} role="region" aria-label="知识图谱画布；方向键平移，加减号缩放，0 居中"
    onKeyDown={event => {
      if ((event.target as HTMLElement).closest('button,input,a')) return;
      const step = 64; const viewport = api?.getViewport(); if (!viewport) return;
      const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (moves[event.key]) { event.preventDefault(); const [x, y] = moves[event.key]; void api?.setViewport({ ...viewport, x: viewport.x + x, y: viewport.y + y }); }
      else if (event.key === '+' || event.key === '=') { event.preventDefault(); void api?.zoomIn(); }
      else if (event.key === '-') { event.preventDefault(); void api?.zoomOut(); }
      else if (event.key === '0') { event.preventDefault(); fit(); }
    }}>
    <ReactFlow<FlowNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onInit={setApi}
      nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false}
      elementsSelectable={false} deleteKeyCode={null} selectionKeyCode={null}
      zoomOnDoubleClick={false} minZoom={.08} maxZoom={1.75} zoomOnPinch panOnDrag
      defaultViewport={initialViewport} fitView={!initialViewport}
      fitViewOptions={{ nodes: initialFitNodes, padding: .14, minZoom: projection.atlas ? .08 : .9, maxZoom: 1 }}
      onMoveEnd={(_, viewport) => rememberViewport(projection.key, viewport)}
      onNodeMouseEnter={(_, node) => setHovered(node.id)}
      onNodeMouseLeave={() => setHovered(null)}
      colorMode={isLight ? 'light' : 'dark'} onlyRenderVisibleElements
      ariaLabelConfig={{ 'controls.zoomIn.ariaLabel': '放大图谱', 'controls.zoomOut.ariaLabel': '缩小图谱', 'controls.fitView.ariaLabel': '居中图谱' }}>
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--garden-grid)" />
    </ReactFlow>
    <div className="garden-canvas-tools" role="group" aria-label="图谱视口控制">
      <button type="button" disabled={!api} aria-label="放大图谱" onClick={() => void api?.zoomIn({ duration: reduced ? 0 : 120 })}><Plus /></button>
      <button type="button" disabled={!api} aria-label="缩小图谱" onClick={() => void api?.zoomOut({ duration: reduced ? 0 : 120 })}><Minus /></button>
      <button type="button" disabled={!api} aria-label="居中图谱" onClick={fit}><Maximize /></button>
      <button type="button" disabled={!api} aria-label="恢复原始缩放" onClick={() => void api?.zoomTo(1)}><RotateCcw /></button>
    </div>
    <div className="garden-canvas-legend">{legend}</div>
  </div>;
}
