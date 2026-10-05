import assert from 'node:assert/strict';
import { buildGardenModel, loadGarden, repositoryRoot, validateAttentionExample } from './validate-garden.mjs';
import { attachTopicHubs } from './build-topic-hubs.mjs';

const { blueprint, graph, examples, publishedArticleIds } = loadGarden();
const change = update => {
  const copy = structuredClone(blueprint);
  update(copy);
  return () => buildGardenModel(copy, publishedArticleIds);
};
assert.throws(change(copy => copy.domains.push(copy.domains[0])), /duplicate node/i);
assert.throws(change(copy => copy.relations.push({ source: 'concept:missing', target: 'concept:llm', type: 'related', reason: 'fixture' })), /Dangling relation/);
assert.throws(change(copy => copy.relations.push({ source: 'concept:self-attention', target: 'concept:matrix-multiplication', type: 'recommended_before', reason: 'fixture cycle' })), /cycle/);
assert.throws(change(copy => copy.relations.push({ ...copy.relations.find(item => item.type === 'related') })), /Duplicate relation/);
assert.throws(change(copy => {
  const edge = copy.relations.find(item => item.type === 'related');
  copy.relations.push({ ...edge, source: edge.target, target: edge.source });
}), /Duplicate relation/);
assert.throws(change(copy => copy.articleBindings[0].articleId = 'nonexistent-document'), /Unknown article/);
assert.throws(change(copy => copy.learningPaths[0].steps.push('concept:missing')), /Unknown path node/);
assert.throws(change(copy => copy.domains[0].topics[0].concepts['bad id'] = 'Invalid'), /Invalid concept ID/);
assert.equal(graph.unmappedArticleIds.length, 0, 'Existing public pages need explicit garden bindings');
assert.ok(graph.nodes.every(node => node.contentStatus === 'outline'), 'Article links must not silently promote knowledge maturity');
assert.ok(graph.nodes.every(node => !('position' in node)), 'Do not mix layout with knowledge');

// Exercise the generation pipeline's hub overlay and JSON serialization, without relying on a stale
// generated file. Evidence is optional metadata and must never promote an editorial edge's status.
const generated = JSON.parse(JSON.stringify(attachTopicHubs(graph, repositoryRoot, publishedArticleIds)));
const generatedEdges = new Map(generated.edges.map(edge => [edge.id, edge]));
const reviewedRelations = blueprint.relations.filter(relation => Object.hasOwn(relation, 'evidence'));
assert.ok(reviewedRelations.length > 0, 'Source-check fixtures must include real relation metadata');
for (const relation of blueprint.relations) {
  const ends = relation.type === 'related' ? [relation.source, relation.target].sort() : [relation.source, relation.target];
  const id = `${relation.type}:${ends.join('>')}`;
  assert.deepEqual(generatedEdges.get(id), { ...relation, id, assertionStatus: 'editorial' },
    `Generation must preserve relationship meaning and optional source-check metadata: ${id}`);
}
assert.ok(generated.edges.every(edge => edge.assertionStatus === 'editorial'), 'Source checks are not scholarly certification');
const legacyGraph = change(copy => copy.relations.forEach(relation => delete relation.evidence))();
assert.ok(legacyGraph.edges.every(edge => !Object.hasOwn(edge, 'evidence')), 'Relations without evidence remain supported');

const evidenceFixture = {
  checkedAt: '2024-02-29', reviewStatus: 'source-checked-needs-independent-review',
  sources: [{ url: 'https://example.org/reference', title: 'Source-check test fixture',
    locator: 'Section 2', supportNote: 'Supports the expressly scoped editorial relationship.' }]
};
const evidenceChange = edit => change(copy => {
  const relation = copy.relations.find(item => Object.hasOwn(item, 'evidence'));
  Object.assign(relation, { scope: 'Fixture-specific conditions.', provenance: 'primary-source-review',
    asOf: evidenceFixture.checkedAt, evidence: structuredClone(evidenceFixture) });
  edit(relation);
});
// A real leap day, multiple distinct sources, and an optional explicit derivation are valid.
const withDerivation = evidenceChange(relation => {
  relation.evidence.derivation = 'An explicitly labeled inference from the cited source.';
  relation.evidence.sources.push({ ...relation.evidence.sources[0], url: 'https://example.org/second-reference' });
  relation.assertionStatus = 'independently-reviewed';
})();
const derivedEdge = withDerivation.edges.find(edge => edge.evidence?.derivation === 'An explicitly labeled inference from the cited source.');
assert.equal(derivedEdge.assertionStatus, 'editorial', 'Input metadata cannot override editorial assertion status');
assert.equal(derivedEdge.evidence.checkedAt, '2024-02-29');
assert.equal(derivedEdge.evidence.sources.length, 2);
assert.doesNotThrow(evidenceChange(() => {}), 'Derivation is optional');

let evidenceNegativeCases = 0;
const rejectEvidence = (edit, expected) => {
  assert.throws(evidenceChange(edit), expected);
  evidenceNegativeCases++;
};
for (const invalid of [null, [], 'checked', undefined]) {
  rejectEvidence(relation => relation.evidence = invalid, /evidence must be an object/);
}
for (const invalid of [undefined, '', '2026-02-29', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-01', '2026-10-00', '2026-1-05', '2026-10-05T00:00:00Z', 20261005]) {
  rejectEvidence(relation => relation.evidence.checkedAt = invalid, /checkedAt must be a valid YYYY-MM-DD date/);
}
for (const invalid of [undefined, '', 'independently-reviewed']) {
  rejectEvidence(relation => relation.evidence.reviewStatus = invalid, /reviewStatus must retain pending independent review/);
}
for (const field of ['scope', 'provenance']) {
  for (const invalid of [undefined, '   ', {}]) {
    rejectEvidence(relation => relation[field] = invalid, new RegExp(`requires (?:a )?nonempty ${field}`));
  }
}
for (const invalid of [undefined, '2024-02-30', '2024-03-01', '2024-02-29T00:00:00Z']) {
  rejectEvidence(relation => relation.asOf = invalid, /asOf must match checkedAt/);
}
for (const invalid of [undefined, null, [], {}]) {
  rejectEvidence(relation => relation.evidence.sources = invalid, /requires nonempty sources/);
}
for (const invalid of [null, [], 'https://example.org/reference']) {
  rejectEvidence(relation => relation.evidence.sources = [invalid], /source must be an object/);
}
for (const invalid of [undefined, '', 'not-a-url', 'http://example.org/reference', '/reference', 'https:example.org/reference', 'https://', ' https://example.org/reference', 'https://user:secret@example.org/reference']) {
  rejectEvidence(relation => relation.evidence.sources[0].url = invalid, /requires an HTTPS URL/);
}
for (const field of ['title', 'locator', 'supportNote']) {
  for (const invalid of [undefined, '   ', {}]) {
    rejectEvidence(relation => relation.evidence.sources[0][field] = invalid, new RegExp(`requires nonempty ${field}`));
  }
}
rejectEvidence(relation => relation.evidence.sources.push({ ...relation.evidence.sources[0] }), /Duplicate relation evidence source URL/);
rejectEvidence(relation => relation.evidence.sources.push({ ...relation.evidence.sources[0], url: 'https://EXAMPLE.org:443/reference' }), /Duplicate relation evidence source URL/);
for (const invalid of [undefined, '', '   ', []]) {
  rejectEvidence(relation => relation.evidence.derivation = invalid, /derivation must be a nonempty string/);
}

const good = validateAttentionExample(examples[0], graph, publishedArticleIds);
assert.ok(good.output.every(row => row.every(Number.isFinite)));
const invalid = structuredClone(examples[0]);
invalid.input.Q[0][0] = NaN;
assert.throws(() => validateAttentionExample(invalid, graph, publishedArticleIds), /Invalid matrix values/);
const wrongAnswer = structuredClone(examples[0]);
wrongAnswer.expected.firstOutputRow = [9, 9];
assert.throws(() => validateAttentionExample(wrongAnswer, graph, publishedArticleIds));
console.log(JSON.stringify({ status: 'pass', suite: 'garden-design-contract',
  negativeCases: 10 + evidenceNegativeCases, evidenceNegativeCases,
  sourceCheckedEditorialRelations: reviewedRelations.length, mappedExistingPages: graph.stats.articleBindings,
  calculation: good, uiImplemented: false }, null, 2));
