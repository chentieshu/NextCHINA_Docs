import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { KnowledgeNode } from './domain';
import { kindLabel } from './domain';
import { childrenById } from './data';
interface Props { nodes: KnowledgeNode[]; selectedId: string | null; onSelect: (id: string) => void; onExpand: (id: string) => void; }
export function GardenList({ nodes, selectedId, onSelect, onExpand }: Props) {
  return <ul className="garden-list" aria-label="知识节点列表">{nodes.map(node => {
    const count = childrenById.get(node.id)?.length ?? 0;
    const hasHub = Boolean(node.hubEntries?.length);
    const status = node.kind === 'hub' ? `${count} 个已接入分支` : hasHub ? '可进入专题' : node.articleBindings.length ? '有阅读入口' : '待完善';
    return <li key={node.id} data-selected={selectedId === node.id}>
      <button type="button" className="garden-list-main" onClick={() => onSelect(node.id)} aria-label={`查看 ${node.label}`}>
        <small>{kindLabel[node.kind]} · {status}</small><strong>{node.label}</strong>{node.summary && <span>{node.summary}</span>}
      </button>
      <button type="button" className="garden-list-expand" onClick={() => onExpand(node.id)} aria-label={`${hasHub ? '进入专题' : count ? '展开' : '探索关联'} ${node.label}`}>{hasHub ? '进入专题' : count ? `展开 ${count} 项` : node.kind === 'branch' ? '查看问题' : '关联'} <ArrowUpRight /></button>
    </li>;
  })}</ul>;
}
