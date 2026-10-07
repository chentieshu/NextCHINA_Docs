/** Shared by the build, index, renderer and regression tests. No layout-derived facts. */
export const SEMANTIC_TYPES = Object.freeze(['is_a', 'part_of', 'uses', 'trained_with', 'evaluated_by', 'mitigates']);
export function relationRole(edge) {
  if (edge.type === 'browse_child') return 'structure';
  if (edge.type === 'recommended_before') return 'before';
  if (edge.type === 'represents' || edge.type === 'references') return 'reference';
  if (edge.type === 'related') return 'related';
  if (SEMANTIC_TYPES.includes(edge.type)) return 'semantic';
  throw new Error(`Unsupported relationship type: ${edge.type}`);
}
export function hasDirectExplanation(node) {
  return (node.articleBindings ?? []).some(ref => ref.coverage === 'explanation') ||
    (node.resourceRefs ?? []).some(ref => ref.role === 'independent-explanation');
}
export function isSupportedSemanticEdge(edge) {
  return SEMANTIC_TYPES.includes(edge.type) && edge.assertionStatus === 'source-checked' &&
    typeof edge.scope === 'string' && edge.scope.trim().length > 0 &&
    Array.isArray(edge.evidenceRefs) && edge.evidenceRefs.length > 0;
}
export function mapNodeEligible(node, incidentEdges = []) {
  // Domains are navigation anchors, never completed knowledge. A planned route or citation
  // alone cannot promote an empty outline. Selected nodes can be revealed separately.
  return node.kind === 'domain' || hasDirectExplanation(node) || incidentEdges.some(isSupportedSemanticEdge);
}
export function graphDisplayLabel(node) { return node.displayLabel ?? node.label; }
export function knowledgeHealth(graph) {
  const byId = new Map(graph.nodes.map(node => [node.id, node]));
  const degree = new Map(graph.nodes.map(node => [node.id, []]));
  const edgeTypes = {};
  for (const edge of graph.edges) {
    edgeTypes[edge.type] = (edgeTypes[edge.type] ?? 0) + 1;
    for (const id of new Set([edge.source, edge.target])) degree.get(id)?.push(edge);
  }
  const concepts = graph.nodes.filter(node => node.kind === 'concept');
  const row = nodes => ({
    concepts: nodes.length,
    withDirectResources: nodes.filter(node => node.articleBindings?.length || node.resourceRefs?.length).length,
    withIndependentExplanation: nodes.filter(hasDirectExplanation).length,
    withNonTreeEdge: nodes.filter(node => degree.get(node.id).some(edge => edge.type !== 'browse_child')).length,
    withTypedSemanticEdge: nodes.filter(node => degree.get(node.id).some(edge => SEMANTIC_TYPES.includes(edge.type))).length,
    withSourceCheckedSemanticEdge: nodes.filter(node => degree.get(node.id).some(isSupportedSemanticEdge)).length
  });
  const domainOf = node => {
    const seen = new Set();
    while (node && !seen.has(node.id)) {
      if (node.kind === 'domain') return node.id;
      seen.add(node.id); node = byId.get(node.parentId);
    }
    return null;
  };
  return {
    nodes: graph.nodes.length, edges: graph.edges.length, edgeTypes,
    defaultVisibleNodes: graph.nodes.filter(node => mapNodeEligible(node, degree.get(node.id))).length,
    sourceCheckedSemanticEdges: graph.edges.filter(isSupportedSemanticEdge).length,
    independentReviewCompleted: false, ...row(concepts),
    domains: graph.nodes.filter(node => node.kind === 'domain').map(domain => ({
      id: domain.id, label: domain.label, ...row(concepts.filter(node => domainOf(node) === domain.id))
    })),
    missingIndependentExplanation: concepts.filter(node => !hasDirectExplanation(node)).map(node => node.id),
    missingSourceCheckedSemanticEdge: concepts.filter(node => !degree.get(node.id).some(isSupportedSemanticEdge)).map(node => node.id)
  };
}
