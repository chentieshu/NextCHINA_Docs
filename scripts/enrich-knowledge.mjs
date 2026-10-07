import assert from 'node:assert/strict';
import { SEMANTIC_TYPES, knowledgeHealth } from '../src/features/garden/graphContract.js';

const TYPES = new Set(['concept', 'mechanism', 'algorithm', 'architecture', 'model-family', 'system', 'objective', 'evaluation', 'risk', 'control', 'data']);
const pair = edge => `${edge.type}:${edge.source}>${edge.target}`;
const text = value => typeof value === 'string' && value.trim().length > 0;

/** Additional authoring source for evidenced assertions; does not infer facts from citations. */
export function enrichKnowledge(input, data) {
  assert.equal(data.schemaVersion, 1);
  const graph = structuredClone(input);
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const sources = new Map();
  for (const source of data.sources) {
    assert.ok(text(source.id) && !sources.has(source.id), 'Duplicate/invalid evidence ID');
    assert.ok(text(source.title) && text(source.locator));
    assert.equal(new URL(source.url).protocol, 'https:');
    sources.set(source.id, source);
  }
  for (const [id, type] of Object.entries(data.entityTypes)) {
    assert.equal(nodes.get(id)?.kind, 'concept', `Metadata must identify an existing canonical concept: ${id}`);
    assert.ok(TYPES.has(type), `Unsupported entityType: ${type}`);
    nodes.get(id).entityType = type;
  }
  const assertions = data.assertions.map(edge => ({ ...data.defaults, ...edge }));
  const seen = new Set();
  for (const assertion of assertions) {
    const { source, target, type } = assertion;
    const a = nodes.get(source), b = nodes.get(target), key = pair(assertion);
    assert.ok(a && b && a.kind === 'concept' && b.kind === 'concept', `Invalid semantic endpoint: ${key}`);
    assert.notEqual(source, target, 'Self assertion');
    assert.ok(SEMANTIC_TYPES.includes(type) && !seen.has(key), `Duplicate/unsupported assertion: ${key}`);
    assert.ok(a.entityType && b.entityType, `Semantic endpoint requires explicit entityType: ${key}`);
    assert.ok(text(assertion.reason) && text(assertion.scope), `Missing reason/scope: ${key}`);
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(assertion.asOf), `Missing asOf: ${key}`);
    assert.equal(new Date(`${assertion.asOf}T00:00:00Z`).toISOString().slice(0,10), assertion.asOf);
    assert.equal(assertion.assertionStatus, 'source-checked');
    assert.equal(assertion.reviewStatus, 'needs-independent-review');
    assert.ok(assertion.evidenceRefs.length && new Set(assertion.evidenceRefs).size === assertion.evidenceRefs.length);
    for (const ref of assertion.evidenceRefs) assert.ok(sources.has(ref), `Unknown evidence: ${ref}`);
    if (type === 'part_of') {
      assert.ok(['mechanism', 'algorithm', 'architecture'].includes(a.entityType));
      assert.ok(['mechanism', 'architecture', 'system'].includes(b.entityType));
    }
    if (type === 'trained_with') {
      assert.ok(['model-family', 'architecture', 'system'].includes(a.entityType));
      assert.ok(['objective', 'algorithm', 'data'].includes(b.entityType));
    }
    if (type === 'evaluated_by') assert.equal(b.entityType, 'evaluation');
    if (type === 'mitigates') {
      assert.equal(a.entityType, 'control'); assert.equal(b.entityType, 'risk');
    }
    seen.add(key);
  }
  // Replace only an exact directed predicate. Different scopes must be modeled explicitly,
  // not silently collapsed into equivalence. Legacy editorial relations remain distinguishable.
  graph.edges = graph.edges.filter(edge => !seen.has(pair(edge)));
  graph.edges.push(...assertions.map(edge => ({ ...edge, id: `semantic:${pair(edge)}`, provenance: 'content/garden/semantic-relations.json' })));
  assert.equal(new Set(graph.edges.map(edge => edge.id)).size, graph.edges.length, 'Duplicate edge ID');
  // part_of is acyclic in this authored component hierarchy; uses need not be transitive or acyclic.
  const visiting = new Set(), done = new Set();
  const next = new Map();
  for (const edge of graph.edges.filter(edge => edge.type === 'part_of')) {
    if (!next.has(edge.source)) next.set(edge.source, []);
    next.get(edge.source).push(edge.target);
  }
  const visit = id => {
    assert.ok(!visiting.has(id), `part_of cycle: ${id}`);
    if (done.has(id)) return;
    visiting.add(id); for (const target of next.get(id) ?? []) visit(target);
    visiting.delete(id); done.add(id);
  };
  for (const id of nodes.keys()) visit(id);
  // Disambiguate graph labels without changing canonical labels/IDs or sidebar breadcrumbs.
  const counts = new Map();
  for (const node of graph.nodes) counts.set(node.label, (counts.get(node.label) ?? 0) + 1);
  for (const node of graph.nodes) {
    if (node.kind === 'branch') node.displayLabel = `${nodes.get(node.hubId)?.label ?? node.hubId} · ${node.label}`;
    else if (counts.get(node.label) > 1) node.displayLabel = `${node.label} · ${node.kind === 'hub' ? '专题入口' : node.kind === 'domain' ? '领域' : '概念'}`;
  }
  const displays = new Map();
  for (const node of graph.nodes) {
    const label = node.displayLabel ?? node.label;
    if (!displays.has(label)) displays.set(label, []);
    displays.get(label).push(node);
  }
  for (const list of displays.values()) if (list.length > 1) for (const node of list) node.displayLabel = `${node.displayLabel ?? node.label} · ${node.outlinePath ?? node.id}`;
  graph.evidenceSources = Object.fromEntries(sources);
  const health = knowledgeHealth(graph);
  graph.stats = { ...graph.stats, nodes: health.nodes, navigationEdges: health.edgeTypes.browse_child ?? 0,
    editorialRelations: graph.edges.filter(edge => edge.type !== 'browse_child' && edge.assertionStatus === 'editorial').length,
    semanticRelations: graph.edges.filter(edge => SEMANTIC_TYPES.includes(edge.type)).length,
    sourceCheckedSemanticRelations: health.sourceCheckedSemanticEdges };
  return graph;
}
