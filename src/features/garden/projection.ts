import { byId, childrenById, directRelations, graph } from './data';
import type { KnowledgeNode, KnowledgeEdge } from './domain';

export type GraphLayer = 'atlas' | 'paths' | 'explore' | 'documents';
export interface Projection {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  total: number;
  omitted: number;
  key: string;
  atlas: boolean;
  layer?: GraphLayer;
}

/** Selection and theme do not affect projection or layout. Shared concepts retain their IDs. */
export function project(scopeId: string, mode: 'atlas' | 'explore', limit = 150): Projection {
  const scope = byId.get(scopeId);
  if (!scope) return { nodes: [], edges: [], total: 0, omitted: 0, key: 'missing', atlas: false, layer: mode };
  const atlas = scope.kind === 'root' && mode === 'atlas';
  const ids = new Set<string>(atlas ? [] : [scope.id]);
  const children = childrenById.get(scope.id) ?? [];
  if (mode === 'atlas') {
    for (const node of children) ids.add(node.id);
    if (!children.length && ['hub', 'branch'].includes(scope.kind)) {
      for (const id of [...(scope.conceptRefs ?? []), ...(scope.hubRefs ?? [])]) ids.add(id);
    }
  } else {
    for (const edge of directRelations(scope.id)) { ids.add(edge.source); ids.add(edge.target); }
    if (scope.parentId) ids.add(scope.parentId);
    for (const child of children) ids.add(child.id);
  }
  const all = [...ids].map(id => byId.get(id)!).filter(Boolean);
  const nodes = all.slice(0, Math.max(1, limit));
  const visible = new Set(nodes.map(node => node.id));
  const edges = graph.edges.filter(edge => visible.has(edge.source) && visible.has(edge.target) && (mode === 'explore' || edge.type === 'browse_child' || edge.id.startsWith(`hub-ref:${scope.id}>`)));
  return { nodes, edges, total: all.length, omitted: all.length - nodes.length, key: `${mode}:${scopeId}:${nodes.length}`, atlas, layer: mode };
}
