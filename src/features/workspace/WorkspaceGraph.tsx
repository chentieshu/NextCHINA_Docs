import React, { useMemo } from 'react';
import type { AppRoute } from '../../routing';
import '../../styles/garden.css';
import GardenCanvas from '../garden/GardenCanvas';
import { graphProjection, documentRoute, folderRoute, type ExplorerModel } from './model';
interface Props { scopeId: string; model: ExplorerModel; isLight: boolean; onOpen: (route: AppRoute) => void; }
export default function WorkspaceGraph({ scopeId, model, isLight, onOpen }: Props) {
  const projection = useMemo(() => graphProjection(scopeId, model), [scopeId, model]);
  if (!projection.nodes.length) return <div className="ws-empty"><h2>此位置尚无可展示的关系</h2><button onClick={() => onOpen(folderRoute('root:ai', true))}>查看全库文档关系</button></div>;
  return <div className="ws-graph-pane">
    <div className="ws-graph-caption"><span>{scopeId === 'root:ai' ? '全库文档关系' : '当前目录的局部关系'} · {projection.nodes.length} 个节点</span><button type="button" onClick={() => onOpen(folderRoute('root:ai', true))}>全库</button><button type="button" onClick={() => onOpen(folderRoute(scopeId))}>目录列表</button></div>
    <div className="ws-graph-canvas"><GardenCanvas key={projection.key} projection={projection} selectedId={null} scopeId={scopeId} isLight={isLight}
      onSelect={id => onOpen(id.startsWith('article:') ? documentRoute(id.slice(8), model.occurrence(id.slice(8))?.nodeId) : folderRoute(id))}
      onExpand={id => onOpen(id.startsWith('article:') ? documentRoute(id.slice(8), model.occurrence(id.slice(8))?.nodeId) : folderRoute(id, true))}
      onList={() => onOpen(folderRoute(scopeId))} /></div>
  </div>;
}
