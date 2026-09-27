import React, { memo, useEffect, useMemo, useState } from 'react';
import { ReactFlow, Handle, Position, Background, BackgroundVariant, MarkerType,
  type Node, type NodeProps, type Edge, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Minus, Maximize, RotateCcw } from 'lucide-react';
import { CARD_HEIGHT, CARD_WIDTH, layoutGraph, type Positions } from './layout';
import { childrenById } from './data';
import { kindLabel, type KnowledgeNode } from './domain';
import type { Projection } from './projection';
import { savedViewport, rememberViewport } from './viewport';
import { useMedia } from './useMedia';

type FlowNode = Node<{ item: KnowledgeNode; inspect: (id: string) => void; expand: (id: string) => void; isScope: boolean }, 'knowledge'>;
const KnowledgeCard = memo(function KnowledgeCard({ data, selected }: NodeProps<FlowNode>) {
  const { item, inspect, expand, isScope } = data;
  const count = childrenById.get(item.id)?.length ?? 0;
  // Read-only RF wrappers need explicit pointer events on their semantic controls.
  return <div className="garden-node nopan" style={{ pointerEvents: 'auto' }} data-active={selected} data-scope={isScope} data-kind={item.kind}>
    <Handle type="target" position={Position.Left} isConnectable={false} />
    <button type="button" className="garden-node-main nodrag" onClick={() => inspect(item.id)} aria-label={`查看 ${item.label}`}>
      <span className="garden-node-kicker">{kindLabel[item.kind]} <span>{item.articleBindings.length ? '有阅读入口' : '待完善'}</span></span>
      <strong>{item.label}</strong>
    </button>
    <div className="garden-node-bottom"><span>{count ? `${count} 个下级主题` : '知识框架条目'}</span>
      <button type="button" className="nodrag" onClick={() => expand(item.id)} aria-label={`${count ? '展开' : '探索关联'} ${item.label}`}>{count ? '展开 →' : '关联 →'}</button>
    </div>
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </div>;
});
const nodeTypes = { knowledge: KnowledgeCard };
interface Props {
  projection: Projection; selectedId: string | null; scopeId: string; isLight: boolean;
  onSelect: (id: string) => void; onExpand: (id: string) => void; onList: () => void;
}
export default function GardenCanvas({ projection, selectedId, scopeId, isLight, onSelect, onExpand, onList }: Props) {
  const [positions, setPositions] = useState<Positions | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [api, setApi] = useState<ReactFlowInstance<FlowNode> | null>(null);
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const narrow = useMedia('(max-width: 639px)');
  const [initialViewport] = useState(() => savedViewport(projection.key));
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
    return projection.nodes.map(item => ({ id: item.id, type: 'knowledge', position: coordinates.get(item.id) ?? { x: 0, y: 0 },
      data: { item, inspect: onSelect, expand: onExpand, isScope: item.id === scopeId },
      selected: item.id === selectedId, draggable: false, deletable: false,
      focusable: false, connectable: false, style: { width: CARD_WIDTH, height: CARD_HEIGHT } }));
  }, [positions, projection, onSelect, onExpand, scopeId, selectedId]);
  const edges: Edge[] = useMemo(() => projection.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target,
    type: 'smoothstep', selectable: false, focusable: false, deletable: false,
    label: edge.type === 'recommended_before' ? '建议先学 →' : edge.type === 'related' ? '编辑关联' : undefined,
    markerEnd: edge.type === 'related' ? undefined : { type: MarkerType.ArrowClosed, color: 'var(--garden-edge)' },
    style: { stroke: 'var(--garden-edge)', strokeWidth: 1.3, strokeDasharray: edge.type === 'related' ? '5 5' : undefined },
    labelStyle: { fill: 'var(--ui-muted)', fontSize: 11 }, labelBgStyle: { fill: 'var(--ui-panel)' } })), [projection]);
  // A tall topic must not force every card into tiny text. Start at a readable
  // neighborhood; the explicit fit button is the user's whole-subgraph overview.
  const scope = projection.nodes.find(node => node.id === scopeId);
  const firstFocus = selectedId ?? (scope?.kind === 'concept' ? scopeId : projection.nodes.find(node => node.id !== scopeId)?.id ?? scopeId);
  const initialFitNodes = projection.atlas ? undefined : narrow ? [{ id: firstFocus }] : projection.nodes.slice(0, 4).map(node => ({ id: node.id }));
  const fit = () => void api?.fitView({ padding: .14, minZoom: .25, maxZoom: 1, duration: reduced ? 0 : 160 });
  if (error) return <div className="garden-state" role="alert"><h2>图谱布局暂不可用</h2><p>{error}</p><div><button onClick={() => setAttempt(value => value + 1)}>重试布局</button><button onClick={onList}>用列表继续阅读</button></div></div>;
  if (!positions) return <div className="garden-state" role="status">正在整理知识关系…</div>;
  return <div className="garden-canvas" data-layout="ready" tabIndex={0} role="region" aria-label="知识图谱画布；方向键平移，加减号缩放，0 居中"
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
      zoomOnDoubleClick={false} minZoom={.25} maxZoom={1.75} zoomOnPinch panOnDrag
      defaultViewport={initialViewport} fitView={!initialViewport}
      fitViewOptions={{ nodes: initialFitNodes, padding: .14, minZoom: projection.atlas ? .25 : .9, maxZoom: 1 }}
      onMoveEnd={(_, viewport) => rememberViewport(projection.key, viewport)}
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
    <div className="garden-canvas-legend">{projection.atlas ? '全景入口 · 点击卡片查看，点击展开继续' : '拖动空白处探索 · 居中按钮查看全图 · 虚线为编辑关联'}</div>
  </div>;
}
