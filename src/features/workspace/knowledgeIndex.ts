import type { GardenGraph, KnowledgeNode, KnowledgeEdge } from '../garden/domain';

export type RelationRole = 'related' | 'before' | 'reference';
export interface IndexedRelation { edge: KnowledgeEdge; role: RelationRole; }
export interface RelationBundle { id: string; source: string; target: string; relations: IndexedRelation[]; }
export interface ReadingResource { articleId: string; coverage: string; fromId: string; scope: 'own' | 'reference' | 'descendant'; }
const isKnowledge = (node: KnowledgeNode) => !['root', 'group', 'path', 'document'].includes(node.kind);

/** Canonical IDs and source assertions only. Layout, learning order and co-membership
 * never manufacture a scientific relation. Bundles retain every original edge. */
export function buildKnowledgeIndex(graph: GardenGraph) {
  const byId = new Map(graph.nodes.map(node => [node.id, node]));
  const children = new Map<string, KnowledgeNode[]>();
  const issues: string[] = [];
  if (byId.size !== graph.nodes.length) issues.push('重复知识 ID');
  for (const node of graph.nodes) if (node.parentId) {
    if (!byId.has(node.parentId)) issues.push(`缺少父节点：${node.id}`);
    const list = children.get(node.parentId) ?? [];
    list.push(node); children.set(node.parentId, list);
  }
  const ancestors = (id: string) => {
    const result: KnowledgeNode[] = [], visited = new Set<string>();
    let node = byId.get(id);
    while (node && !visited.has(node.id)) {
      visited.add(node.id); result.unshift(node);
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
    return result;
  };
  const domainOf = (id: string) => ancestors(id).find(node => node.kind === 'domain');
  const groupOf = (id: string) => domainOf(id)?.group;
  const descendants = (id: string) => {
    const result: KnowledgeNode[] = [], pending = [...(children.get(id) ?? [])], seen = new Set([id]);
    for (let i = 0; i < pending.length; i++) {
      const node = pending[i]; if (seen.has(node.id)) continue;
      seen.add(node.id); result.push(node); pending.push(...(children.get(node.id) ?? []));
    }
    return result;
  };
  const relations: IndexedRelation[] = [];
  const edgeIds = new Set<string>();
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) issues.push(`重复关系 ID：${edge.id}`);
    edgeIds.add(edge.id);
    if (!byId.has(edge.source) || !byId.has(edge.target)) { issues.push(`悬空关系：${edge.id}`); continue; }
    if (edge.type === 'browse_child') continue;
    const owner = byId.get(edge.source)!;
    // Use explicit reference fields, never a regex over human-facing reason text.
    const reference = owner.conceptRefs?.includes(edge.target) || owner.hubRefs?.includes(edge.target);
    relations.push({ edge, role: edge.type === 'recommended_before' ? 'before' : reference ? 'reference' : 'related' });
  }
  const adjacency = new Map<string, IndexedRelation[]>();
  for (const relation of relations) for (const id of new Set([relation.edge.source, relation.edge.target])) {
    const list = adjacency.get(id) ?? []; list.push(relation); adjacency.set(id, list);
  }
  const groups = graph.groups.map(group => ({ ...group, domains: graph.nodes.filter(node => node.kind === 'domain' && node.group === group.id) }));
  const groupIds = new Set(groups.map(group => group.id));
  const bundlesById = new Map<string, RelationBundle>();
  const internal: IndexedRelation[] = [];
  for (const relation of relations) {
    const from = groupOf(relation.edge.source), to = groupOf(relation.edge.target);
    if (!from || !to || !groupIds.has(from) || !groupIds.has(to)) { issues.push(`关系未归入宏观区域：${relation.edge.id}`); continue; }
    if (from === to) { internal.push(relation); continue; }
    const [source, target] = [from, to].sort();
    const id = `${source}~${target}`;
    const bundle = bundlesById.get(id) ?? { id, source, target, relations: [] };
    bundle.relations.push(relation); bundlesById.set(id, bundle);
  }
  for (const node of graph.nodes.filter(isKnowledge)) {
    if (!groupOf(node.id) || !groupIds.has(groupOf(node.id)!)) issues.push(`知识节点未归入宏观区域：${node.id}`);
  }
  const ownResources = (id: string): ReadingResource[] => {
    const node = byId.get(id); if (!node) return [];
    const resources = new Map<string, ReadingResource>();
    for (const ref of node.articleBindings) resources.set(ref.articleId, { ...ref, fromId: id, scope: 'own' });
    for (const ref of node.resourceRefs ?? []) if (!resources.has(ref.articleId)) resources.set(ref.articleId, { articleId: ref.articleId, coverage: ref.role, fromId: id, scope: 'own' });
    if (node.embeddedArticleId && !resources.has(node.embeddedArticleId)) resources.set(node.embeddedArticleId, { articleId: node.embeddedArticleId, coverage: 'reference', fromId: id, scope: 'own' });
    return [...resources.values()];
  };
  const resourcesFor = (id: string): ReadingResource[] => {
    const resources = new Map(ownResources(id).map(ref => [ref.articleId, ref]));
    // Resource reuse is labelled separately; a hub reference is not an explanation.
    for (const { edge, role } of adjacency.get(id) ?? []) if (role === 'reference') {
      const other = edge.source === id ? edge.target : edge.source;
      for (const ref of ownResources(other)) if (!resources.has(ref.articleId)) resources.set(ref.articleId, { ...ref, scope: 'reference' });
    }
    for (const node of descendants(id)) for (const ref of ownResources(node.id)) {
      if (!resources.has(ref.articleId)) resources.set(ref.articleId, { ...ref, scope: 'descendant' });
    }
    return [...resources.values()];
  };
  const search = (query: string) => {
    const text = query.trim().toLocaleLowerCase(), terms = text.split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return graph.nodes.filter(isKnowledge).filter(node => terms.every(term => `${node.label} ${node.id} ${node.summary ?? ''}`.toLocaleLowerCase().includes(term)))
      .sort((a, b) => Number(b.label.toLocaleLowerCase() === text) - Number(a.label.toLocaleLowerCase() === text) || Number(b.kind === 'concept') - Number(a.kind === 'concept'));
  };
  return { graph, byId, children, groups, relations, adjacency, bundles: [...bundlesById.values()], internal,
    ancestors, descendants, domainOf, groupOf, ownResources, resourcesFor, search, issues };
}
export type KnowledgeIndex = ReturnType<typeof buildKnowledgeIndex>;
