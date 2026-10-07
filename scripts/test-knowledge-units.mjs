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
  sampling: 'for z,kwargs in [([], {}), ([1], {"k":0}), ([1], {"p":0}), ([1], {"temperature":0}), ([float("nan")], {})]:\n    try: distribution(z, **kwargs)\n    except ValueError: pass\n    else: raise AssertionError("invalid sampling input accepted")',
  'transformer-block': 'for x in [[], [1], [float("nan"), 1]]:\n    try: ffn_residual_norm(x)\n    except ValueError: pass\n    else: raise AssertionError("invalid FFN input accepted")',
  'rag-evidence': 'for q,k in [([], 1), ([1,0], 0), ([1], 1), ([float("nan"),0], 1)]:\n    try: retrieve(q, docs, k, allowed)\n    except ValueError: pass\n    else: raise AssertionError("invalid retrieval input accepted")',
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
