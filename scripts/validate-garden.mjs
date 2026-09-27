import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { readKnowledgeUnits, addKnowledgeBindings } from './knowledge-units.mjs';

export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const readJSON = (root, file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const text = value => typeof value === 'string' && value.trim().length > 0;

/** Canonical knowledge data, with no dependency on a canvas library or positions. */
export function buildGardenModel(blueprint, publishedArticleIds) {
  assert.equal(blueprint.schemaVersion, 1, 'Unsupported garden schema');
  assert.equal(blueprint.rootId, 'root:ai');
  assert.equal(blueprint.status, 'design-scaffold');
  assert.ok(Array.isArray(blueprint.domains) && blueprint.domains.length, 'Empty domain map');
  const groups = new Set();
  for (const group of blueprint.groups) {
    assert.ok(slug(group.id) && text(group.label) && !groups.has(group.id), 'Invalid/duplicate group');
    groups.add(group.id);
  }
  const nodes = [];
  const edges = [];
  const byId = new Map();
  const add = (id, label, kind, parentId = null) => {
    assert.ok(text(label) && !byId.has(id), `Invalid/duplicate node: ${id}`);
    const node = { id, label, kind, parentId, contentStatus: blueprint.defaults.contentStatus,
      evidenceStatus: blueprint.defaults.evidenceStatus, articleBindings: [] };
    byId.set(id, node);
    nodes.push(node);
    if (parentId) {
      assert.ok(byId.has(parentId), `Unknown navigation parent: ${parentId}`);
      edges.push({ id: `nav:${parentId}>${id}`, source: parentId, target: id,
        type: 'browse_child', assertionStatus: 'editorial' });
    }
    return node;
  };
  add(blueprint.rootId, blueprint.title, 'root');
  for (const domain of blueprint.domains) {
    assert.ok(slug(domain.id) && groups.has(domain.group), `Invalid domain: ${domain.id}`);
    assert.ok(['knowledge-domain', 'editorial-entry'].includes(domain.kind));
    assert.ok(text(domain.question), `Missing domain question: ${domain.id}`);
    assert.ok(Array.isArray(domain.topics) && domain.topics.length, `Empty domain: ${domain.id}`);
    const domainNode = add(`domain:${domain.id}`, domain.label, 'domain', blueprint.rootId);
    domainNode.group = domain.group;
    domainNode.domainKind = domain.kind;
    for (const topic of domain.topics) {
      assert.ok(slug(topic.id), `Invalid topic ID: ${topic.id}`);
      assert.ok(topic.concepts && typeof topic.concepts === 'object' && !Array.isArray(topic.concepts));
      assert.ok(Object.keys(topic.concepts).length, `Empty topic: ${topic.id}`);
      add(`topic:${topic.id}`, topic.label, 'topic', domainNode.id);
      for (const [id, label] of Object.entries(topic.concepts)) {
        assert.ok(slug(id), `Invalid concept ID: ${id}`);
        add(`concept:${id}`, label, 'concept', `topic:${topic.id}`);
      }
    }
  }
  const relationKeys = new Set();
  for (const relation of blueprint.relations) {
    assert.ok(['related', 'recommended_before'].includes(relation.type), 'Unsupported editorial relationship');
    assert.ok(byId.has(relation.source) && byId.has(relation.target), `Dangling relation: ${JSON.stringify(relation)}`);
    assert.notEqual(relation.source, relation.target, 'Self relation');
    assert.ok(text(relation.reason), 'Every relationship needs an editorial reason');
    const ends = relation.type === 'related' ? [relation.source, relation.target].sort() : [relation.source, relation.target];
    const key = `${relation.type}:${ends.join('>')}`;
    assert.ok(!relationKeys.has(key), `Duplicate relation: ${key}`);
    relationKeys.add(key);
    edges.push({ ...relation, id: key, assertionStatus: 'editorial' });
  }
  const prerequisites = edges.filter(edge => edge.type === 'recommended_before');
  const indegree = new Map(nodes.map(node => [node.id, 0]));
  const next = new Map(nodes.map(node => [node.id, []]));
  for (const edge of prerequisites) {
    indegree.set(edge.target, indegree.get(edge.target) + 1);
    next.get(edge.source).push(edge.target);
  }
  const queue = nodes.filter(node => indegree.get(node.id) === 0).map(node => node.id);
  let processed = 0;
  for (let index = 0; index < queue.length; index++) {
    processed++;
    for (const target of next.get(queue[index])) {
      indegree.set(target, indegree.get(target) - 1);
      if (indegree.get(target) === 0) queue.push(target);
    }
  }
  assert.equal(processed, nodes.length, 'Recommended-prerequisite graph contains a cycle');
  const boundArticles = new Set();
  for (const binding of blueprint.articleBindings) {
    assert.ok(publishedArticleIds.has(binding.articleId), `Unknown article: ${binding.articleId}`);
    assert.ok(!boundArticles.has(binding.articleId), `Duplicate article binding: ${binding.articleId}`);
    boundArticles.add(binding.articleId);
    assert.ok(['orientation', 'overview', 'catalogue', 'snapshot', 'methodology', 'explanation'].includes(binding.coverage));
    assert.ok(binding.nodeIds.length && new Set(binding.nodeIds).size === binding.nodeIds.length);
    for (const id of binding.nodeIds) {
      assert.ok(byId.has(id), `Unknown article-bound node: ${id}`);
      byId.get(id).articleBindings.push({ articleId: binding.articleId, coverage: binding.coverage });
    }
  }
  const paths = new Set();
  for (const route of blueprint.learningPaths) {
    assert.ok(slug(route.id) && text(route.label) && !paths.has(route.id), 'Invalid/duplicate learning path');
    assert.equal(route.status, 'planned-route');
    paths.add(route.id);
    assert.ok(route.steps.length > 1 && new Set(route.steps).size === route.steps.length, `Invalid path steps: ${route.id}`);
    for (const id of route.steps) assert.ok(byId.has(id), `Unknown path node: ${id}`);
  }
  const policy = blueprint.viewPolicy;
  assert.equal(policy.initialDomainCount, blueprint.domains.length, 'Atlas summary out of sync');
  assert.ok(Number.isInteger(policy.desktopVisibleNodeBudget) && policy.desktopVisibleNodeBudget > 0);
  assert.ok(Number.isInteger(policy.mobileVisibleNodeBudget) && policy.mobileVisibleNodeBudget > 0);
  return { schemaVersion: 1, title: blueprint.title, status: blueprint.status,
    nodes, edges, learningPaths: blueprint.learningPaths,
    unmappedArticleIds: [...publishedArticleIds].filter(id => !boundArticles.has(id)),
    stats: { domains: blueprint.domains.length, topics: nodes.filter(node => node.kind === 'topic').length,
      concepts: nodes.filter(node => node.kind === 'concept').length, nodes: nodes.length,
      navigationEdges: edges.length - blueprint.relations.length, editorialRelations: blueprint.relations.length,
      articleBindings: boundArticles.size, learningPaths: paths.size } };
}

/** Small, deterministic numeric fixture. This is not a full neural-network runtime. */
export function validateAttentionExample(example, graph, publishedArticleIds) {
  assert.equal(example.schemaVersion, 1);
  assert.ok(slug(example.id));
  const nodeIds = new Set(graph.nodes.map(node => node.id));
  assert.ok(nodeIds.has(example.conceptId) && publishedArticleIds.has(example.articleId));
  const { n, dK, dV, Q, K, V, mask } = example.input;
  for (const size of [n, dK, dV]) assert.ok(Number.isInteger(size) && size > 0 && size <= 8, 'Invalid teaching dimensions');
  const checkShape = (matrix, columns) => {
    assert.ok(Array.isArray(matrix) && matrix.length === n, 'Invalid matrix rows');
    for (const row of matrix) assert.ok(Array.isArray(row) && row.length === columns && row.every(value => Number.isFinite(value) && Math.abs(value) <= 20), 'Invalid matrix values');
  };
  checkShape(Q, dK); checkShape(V, dV); checkShape(K, dK);
  assert.equal(mask, 'causal');
  const stepIds = new Set();
  for (const step of example.steps) {
    assert.ok(!stepIds.has(step.id) && nodeIds.has(step.conceptId) && text(step.label), 'Invalid mechanism step');
    stepIds.add(step.id);
  }
  const scores = Q.map(q => K.map(k => q.reduce((sum, value, i) => sum + value * k[i], 0)));
  const weights = scores.map((row, i) => {
    const scaled = row.map((value, j) => j > i ? -Infinity : value / Math.sqrt(dK));
    const max = Math.max(...scaled);
    const exps = scaled.map(value => Math.exp(value - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(value => value / sum);
  });
  const output = weights.map(row => Array.from({ length: dV }, (_, column) => row.reduce((sum, value, j) => sum + value * V[j][column], 0)));
  const tolerance = 1e-10;
  assert.deepEqual(scores, example.expected.scores);
  assert.deepEqual(weights[0], example.expected.firstAttentionRow);
  assert.deepEqual(output[0], example.expected.firstOutputRow);
  assert.deepEqual([output.length, output[0].length], example.expected.outputShape);
  weights.forEach((row, i) => {
    assert.ok(Math.abs(row.reduce((sum, value) => sum + value, 0) - example.expected.attentionRowSum) < tolerance, 'Attention row does not sum to one');
    row.forEach((value, j) => {
      assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
      if (j > i) assert.equal(value, example.expected.futureWeights);
    });
  });
  return { id: example.id, scores, weights, output };
}

export function loadGarden(root = repositoryRoot) {
  const blueprint = addKnowledgeBindings(readJSON(root, 'content/garden/blueprint.json'), readKnowledgeUnits(root));
  const spaces = readJSON(root, 'content/spaces.json');
  const publishedArticleIds = new Set(spaces.spaces.flatMap(space => space.chapterIds));
  const graph = buildGardenModel(blueprint, publishedArticleIds);
  const examples = blueprint.microscopes.map(id => {
    assert.ok(slug(id), 'Invalid microscope file ID');
    const example = readJSON(root, `content/garden/microscopes/${id}.json`);
    assert.equal(example.id, id);
    return example;
  });
  const computed = examples.map(example => validateAttentionExample(example, graph, publishedArticleIds));
  const registry = readJSON(root, 'content/articles.json');
  for (const article of registry.articles) {
    assert.ok(publishedArticleIds.has(article.id), `Unassigned article: ${article.id}`);
    assert.ok(article.file.startsWith('content/') && !article.file.split('/').includes('..') && article.file.endsWith('.md'));
    assert.ok(existsSync(path.join(root, article.file)), `Missing article file: ${article.file}`);
  }
  return { blueprint, graph, examples, computed, publishedArticleIds };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { graph, computed } = loadGarden();
    const args = process.argv.slice(2);
    if (args.length) {
      assert.ok(args.length === 2 && args[0] === '--emit', 'Usage: node scripts/validate-garden.mjs [--emit output.json]');
      writeFileSync(path.resolve(args[1]), JSON.stringify(graph, null, 2) + '\n');
    }
    console.log(JSON.stringify({ status: 'pass', scope: 'knowledge-structure-and-numeric-fixtures', ...graph.stats,
      unmappedArticleIds: graph.unmappedArticleIds, numericExamples: computed.length, factReverification: false }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
