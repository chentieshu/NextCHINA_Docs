import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { loadGarden, repositoryRoot } from './validate-garden.mjs';
import { attachTopicHubs, branchId } from './build-topic-hubs.mjs';
import { readKnowledgeUnits } from './knowledge-units.mjs';

const units = readKnowledgeUnits(repositoryRoot);
assert.ok(units.length > 0, 'No independent units');
const { graph: base, publishedArticleIds, computed } = loadGarden();
const graph = attachTopicHubs(base, repositoryRoot, publishedArticleIds);
const byId = new Map(graph.nodes.map(node => [node.id, node]));
const results = [];
const negatives = {
  'tensor-shapes': `
assert matmul(X, W) == [[4, 1], [-1, 3]]
assert matmul(X, transpose(X)) == [[14, -1], [-1, 2]]
assert cosine([1, 0], [0, 2]) == 0
assert cosine([1, 0], [-2, 0]) == -1
assert math.isclose(cosine([5e-324, 5e-324], [5e-324, 0]), 1/math.sqrt(2))
assert math.isclose(cosine([1.5e308, 1.5e308], [1.5e308, 0]), 1/math.sqrt(2))
for bad in [lambda: matmul([], [[1]]), lambda: matrix_shape([[]]),
            lambda: matrix_shape([[1, 2], [3]]), lambda: matrix_shape([1, 2]),
            lambda: dot([[1]], [1]), lambda: dot([1, 2], [1]),
            lambda: matmul([[1, 2]], [[1, 2]]),
            lambda: euclidean_distance([1], [1, 2]),
            lambda: cosine([1], [1, 2]), lambda: cosine([0, 0], [1, 2]),
            lambda: vector([float("nan")]), lambda: vector([float("inf")]),
            lambda: vector([True]), lambda: vector(["3"]),
            lambda: vector([10**1000]), lambda: dot([1e308], [1e308]),
            lambda: l2_norm([1.5e308, 1.5e308])]:
    try: bad()
    except ValueError: pass
    else: raise AssertionError("invalid shape or number accepted")`,
  'conditional-probability': `
assert math.isclose(conditional(0.2, 0.3), 2/3)
assert sequence_score([1.0]) == (1.0, 0.0)
assert sequence_score([0.0]) == (0.0, -math.inf)
assert math.isfinite(sequence_score([0.01] * 1000)[1])
for args in [(0, 0), (0.3, 0.2), (-0.1, 0.2), (0.1, 1.1), (float("inf"), 1)]:
    try: conditional(*args)
    except ValueError: pass
    else: raise AssertionError("invalid conditional probability accepted")
for args in [[], [-0.1], [1.1], [float("nan")], [float("inf")]]:
    try: sequence_score(args)
    except ValueError: pass
    else: raise AssertionError("invalid probability factor accepted")`,
  'entropy-cross-entropy': `
assert math.isclose(perplexity([0.5, 0.125, 0.125, 0.125]), 2**2.5)
assert math.isclose(cross_entropy([0.5, 0.5], [0.5, 0.5]), math.log(2))
assert kl([0.5, 0.5], [0.5, 0.5]) == 0
assert math.isinf(kl([1, 0], [0, 1]))
assert math.isinf(categorical_nll([0, 1], 0))
for bad in [lambda: distribution([]), lambda: distribution([0.2, 0.2]),
            lambda: distribution([-1, 2]), lambda: distribution([float("nan"), 1]),
            lambda: cross_entropy([1], [0.5, 0.5]),
            lambda: categorical_nll([1], -1), lambda: categorical_nll([1], 1),
            lambda: categorical_nll([1], True), lambda: perplexity([]),
            lambda: perplexity([1.1]), lambda: perplexity([float("inf")])]:
    try: bad()
    except ValueError: pass
    else: raise AssertionError("invalid information-theory input accepted")`,
  tokenization: 'for bad in ["", "中文"]:\n    try: encode_toy(bad)\n    except ValueError: pass\n    else: raise AssertionError("invalid text accepted")',
  softmax: 'for values, t in [([], 1), ([float("nan")], 1), ([1], 0), ([1], -1)]:\n    try: softmax(values, t)\n    except ValueError: pass\n    else: raise AssertionError("invalid softmax input accepted")',
  attention: 'for q, k, v in [([], [], []), ([[1, 2]], [[1]], [[1, 2]]), ([[float("nan")]], [[1]], [[1]])]:\n    try: attention(q, k, v)\n    except ValueError: pass\n    else: raise AssertionError("invalid attention input accepted")',
  training: 'assert abs(probabilities(updated)[0] - 0.598687660112452) < 1e-12',
  'kv-cache': 'for lengths in [[], [-1], [1.5]]:\n    try: cache_bytes(32, 8, 128, 2, lengths)\n    except ValueError: pass\n    else: raise AssertionError("invalid cache dimensions accepted")'
};
const temp = mkdtempSync(path.join(tmpdir(), 'nextchina-knowledge-'));
try {
  for (const article of units) {
    const unit = article.knowledgeUnit;
    const markdown = readFileSync(path.join(repositoryRoot, article.file), 'utf8');
    assert.ok(publishedArticleIds.has(article.id));
    for (const id of unit.conceptIds) assert.ok(byId.get(id)?.articleBindings.some(ref => ref.articleId === article.id && ref.coverage === 'explanation'));
    for (const placement of unit.placements) {
      const node = byId.get(branchId(placement.hubId, placement.path));
      assert.equal(node?.embeddedArticleId, article.id);
      assert.ok(node.resourceRefs.some(ref => ref.articleId === article.id && ref.role === 'independent-explanation'));
    }
    for (const url of unit.sourceUrls) assert.ok(markdown.includes(url), `${article.id}: cited source missing from text: ${url}`);
    for (const id of unit.relatedResourceIds) assert.ok(graph.hubResources[id], `Unresolved related resource: ${id}`);
    const links = [...markdown.matchAll(/\]\((\?view=garden[^\s)]*)\)/g)];
    assert.ok(links.length >= 2, 'Independent pages need onward reading links');
    for (const [, link] of links) assert.ok(byId.has(new URLSearchParams(link.slice(1)).get('scope')), `Broken knowledge link: ${link}`);
    const blocks = [...markdown.matchAll(/^```python\r?\n(# nextchina-example: ([a-z0-9-]+)\r?\n[\s\S]*?)^```\s*$/gm)];
    assert.equal(blocks.length, 1, `${article.id}: expected one explicit runnable example`);
    assert.equal(blocks[0][2], unit.exampleId);
    assert.ok(Object.hasOwn(negatives, unit.exampleId), 'Add numeric and rejection checks when registering a new example');
    let code = blocks[0][1] + '\n' + negatives[unit.exampleId];
    if (unit.exampleId === 'attention') {
      // One numeric truth: compare the article's Python output with the garden fixture.
      code += '\nexpected = ' + JSON.stringify(computed[0].output) + '\nassert all(abs(a-b)<1e-10 for row,ref in zip(output,expected) for a,b in zip(row,ref))\n';
    }
    const run = spawnSync('python3', ['-I', '-c', code], { cwd: temp, encoding: 'utf8', timeout: 8000,
      maxBuffer: 128 * 1024, env: { PATH: process.env.PATH, LANG: 'C.UTF-8', PYTHONIOENCODING: 'utf-8' } });
    assert.equal(run.status, 0, `${article.id}: Python example failed. Install Python 3 locally.\n${run.error ?? ''}\n${run.stderr ?? ''}`);
    results.push({ articleId: article.id, exampleId: unit.exampleId, output: run.stdout.trim(), passed: true });
  }
  const registry = JSON.parse(readFileSync(path.join(repositoryRoot, 'content/articles.json'), 'utf8'));
  const unitIndex = registry.articles.findIndex(article => article.knowledgeUnit);
  mkdirSync(path.join(temp, 'content'));
  const mutations = [
    data => data.articles.push(structuredClone(data.articles[unitIndex])),
    data => data.articles[unitIndex].knowledgeUnit.sourceUrls = [],
    data => data.articles[unitIndex].knowledgeUnit.reviewStatus = 'expert-verified',
    data => data.articles[unitIndex].knowledgeUnit.placements[0].path = '../missing',
    data => data.articles[unitIndex].knowledgeUnit.conceptIds.push(data.articles[unitIndex].knowledgeUnit.conceptIds[0])
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(registry); mutate(copy);
    writeFileSync(path.join(temp, 'content/articles.json'), JSON.stringify(copy));
    assert.throws(() => readKnowledgeUnits(temp));
  }
  const report = { status: 'pass', independentArticles: units.length, runnableExamples: results.length,
    metadataNegativeCases: mutations.length, attentionMatchesGardenFixture: true, results,
    externalModelCalls: 0, commercialMeasurements: false, expertReview: false };
  mkdirSync(path.join(repositoryRoot, 'test-results'), { recursive: true });
  writeFileSync(path.join(repositoryRoot, 'test-results/knowledge-units.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { rmSync(temp, { recursive: true, force: true }); }
