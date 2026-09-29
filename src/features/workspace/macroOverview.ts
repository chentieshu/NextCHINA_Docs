import { ancestors } from '../garden/data';
import type { KnowledgeEdge } from '../garden/domain';
import type { Projection } from '../garden/projection';

/** A zoomed-out projection of the existing global graph, not another taxonomy.
 * Collapsed relations keep their original type. No inferred prerequisite or
 * causal claim is added; the complete original relation index remains available.
 */
export function macroOverviewProjection(source: Projection): Projection {
  const domains = source.nodes.filter(node => node.kind === 'domain');
  const hubs = source.nodes.filter(node => node.kind === 'hub');
  const grouped = domains.flatMap(domain => [domain, ...hubs.filter(hub => ancestors(hub.id).some(parent => parent.id === domain.id))]);
  const nodes = [...new Map([...grouped, ...hubs].map(node => [node.id, node])).values()];
  const ids = new Set(nodes.map(node => node.id));
  const representative = (id: string): string | undefined => {
    if (ids.has(id)) return id;
    const parents = ancestors(id);
    return parents.find(node => node.kind === 'hub' && ids.has(node.id))?.id
      ?? parents.find(node => node.kind === 'domain' && ids.has(node.id))?.id;
  };
  const edges = new Map<string, KnowledgeEdge>();
  for (const edge of source.edges) {
    const from = representative(edge.source), to = representative(edge.target);
    if (!from || !to || from === to) continue;
    // A sibling ordering of individual concepts is not a prerequisite ordering
    // of whole domains. Keep only actual high-level prerequisite assertions.
    if (edge.type === 'recommended_before' && (!ids.has(edge.source) || !ids.has(edge.target))) continue;
    const [start, end] = edge.type === 'related' ? [from, to].sort() : [from, to];
    const id = `macro:${edge.type}:${start}>${end}`;
    if (!edges.has(id)) edges.set(id, { ...edge, id, source: start, target: end,
      reason: from === edge.source && to === edge.target ? edge.reason : '下级知识存在显式关联；不代表整个领域的因果或先修关系' });
  }
  return { ...source, nodes, edges: [...edges.values()], omitted: source.total - nodes.length,
    key: `global-macro:v2:${nodes.length}:${edges.size}`, atlas: true, layer: 'atlas' };
}
