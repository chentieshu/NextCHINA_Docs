import React, { useEffect, useState } from 'react';
import { ChevronDown, Compass } from 'lucide-react';
import { ancestors, childrenById } from './data';
import type { KnowledgeNode } from './domain';

interface Props { hub: KnowledgeNode; scopeId: string; onOpen: (id: string) => void; onOverview: () => void; }
export function HubOutlineNav({ hub, scopeId, onOpen, onOverview }: Props) {
  const [expansion, setExpansion] = useState<Record<string,boolean>>({});
  const active = new Set(ancestors(scopeId).map(node => node.id));
  useEffect(() => { setExpansion({}); }, [scopeId]);
  const render = (parent: string): React.ReactNode => <ul>{(childrenById.get(parent) ?? []).filter(node => node.kind === 'branch').map(node => {
    const children = childrenById.get(node.id) ?? [];
    const expanded = expansion[node.id] ?? active.has(node.id);
    return <li key={node.id}><div className="hub-nav-row"><button type="button" onClick={() => onOpen(node.id)} aria-current={scopeId === node.id ? 'page' : undefined}>{node.label}</button>
      {children.length > 0 && <button type="button" className="hub-nav-toggle" aria-label={`切换目录 ${node.label}`} aria-expanded={expanded} onClick={() => setExpansion(previous => ({...previous,[node.id]:!expanded}))}><ChevronDown data-expanded={expanded} /></button>}
    </div>{children.length > 0 && expanded && render(node.id)}</li>;
  })}</ul>;
  return <nav className="garden-domain-nav hub-outline-nav" aria-label="专题分支目录"><button onClick={onOverview}><Compass />全部知识领域</button>
    <button className="hub-nav-home" aria-current={scopeId === hub.id ? 'page' : undefined} onClick={() => onOpen(hub.id)}>{hub.label}</button>
    {render(hub.id)}<p>目录是知识大纲，未完成的分支不代表已发表文章。</p></nav>;
}
