import raw from '../../generated/garden.json';
import type { GardenGraph, KnowledgeNode } from './domain';

export const graph = raw as GardenGraph;
export const byId = new Map(graph.nodes.map(node => [node.id, node]));
export const childrenById = new Map<string, KnowledgeNode[]>();
for (const node of graph.nodes) {
  if (!node.parentId) continue;
  const children = childrenById.get(node.parentId) ?? [];
  children.push(node);
  childrenById.set(node.parentId, children);
}
export function ancestors(id: string): KnowledgeNode[] {
  const result: KnowledgeNode[] = [];
  const visited = new Set<string>();
  let current = byId.get(id);
  while (current && !visited.has(current.id)) {
    visited.add(current.id); result.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return result;
}
export function domainOf(id: string) { return ancestors(id).find(node => node.kind === 'domain'); }
export function directRelations(id: string) {
  return graph.edges.filter(edge => edge.type !== 'browse_child' && (edge.source === id || edge.target === id));
}
export function relatedNodeIds(id: string) {
  return directRelations(id).map(edge => edge.source === id ? edge.target : edge.source);
}
export function readingEntries(id: string) {
  // Inherited introductions are explicit, not presented as dedicated concept articles.
  const unique = new Map<string, { articleId: string; coverage: string; inherited: boolean; from: string }>();
  for (const node of ancestors(id).reverse()) {
    for (const binding of node.articleBindings) {
      if (!unique.has(binding.articleId)) unique.set(binding.articleId, { ...binding, inherited: node.id !== id, from: node.label });
    }
  }
  return [...unique.values()];
}
export function searchNodes(query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return graph.nodes.filter(node => terms.every(term => `${node.label} ${node.id} ${node.summary ?? ''}`.toLocaleLowerCase().includes(term)))
    .sort((a, b) => Number(b.label.toLocaleLowerCase() === query.toLocaleLowerCase()) - Number(a.label.toLocaleLowerCase() === query.toLocaleLowerCase()));
}
