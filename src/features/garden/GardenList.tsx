import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { KnowledgeNode } from './domain';
import { kindLabel } from './domain';
import { childrenById } from './data';
interface Props { nodes: KnowledgeNode[]; selectedId: string | null; onSelect: (id: string) => void; onExpand: (id: string) => void; }
export function GardenList({ nodes, selectedId, onSelect, onExpand }: Props) {
  return <ul className="garden-list" aria-label="知识节点列表">{nodes.map(node => {
    const count = childrenById.get(node.id)?.length ?? 0;
    return <li key={node.id} data-selected={selectedId === node.id}>
      <button type="button" className="garden-list-main" onClick={() => onSelect(node.id)} aria-label={`查看 ${node.label}`}>
        <small>{kindLabel[node.kind]} · {node.articleBindings.length ? '有阅读入口' : '待完善'}</small><strong>{node.label}</strong>
        {node.summary && <span>{node.summary}</span>}
      </button>
      <button type="button" className="garden-list-expand" onClick={() => onExpand(node.id)} aria-label={`${count ? '展开' : '探索关联'} ${node.label}`}>{count ? `展开 ${count} 项` : '关联'} <ArrowUpRight /></button>
    </li>;
  })}</ul>;
}
