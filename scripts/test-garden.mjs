import assert from 'node:assert/strict';
import { buildGardenModel, loadGarden, validateAttentionExample } from './validate-garden.mjs';

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
const good = validateAttentionExample(examples[0], graph, publishedArticleIds);
assert.ok(good.output.every(row => row.every(Number.isFinite)));
const invalid = structuredClone(examples[0]);
invalid.input.Q[0][0] = NaN;
assert.throws(() => validateAttentionExample(invalid, graph, publishedArticleIds), /Invalid matrix values/);
const wrongAnswer = structuredClone(examples[0]);
wrongAnswer.expected.firstOutputRow = [9, 9];
assert.throws(() => validateAttentionExample(wrongAnswer, graph, publishedArticleIds));
console.log(JSON.stringify({ status: 'pass', suite: 'garden-design-contract',
  negativeCases: 10, mappedExistingPages: graph.stats.articleBindings,
  calculation: good, uiImplemented: false }, null, 2));
