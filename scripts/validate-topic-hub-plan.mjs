import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Validates the staged plan, not the active viewer and not the truth of research data.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const blueprint = read('content/garden/blueprint.json');
const articleIds = new Set(read('content/spaces.json').spaces.flatMap(space => space.chapterIds));
const canonicalIds = new Set([blueprint.rootId]);
for (const domain of blueprint.domains) {
  canonicalIds.add(`domain:${domain.id}`);
  for (const topic of domain.topics) {
    canonicalIds.add(`topic:${topic.id}`);
    for (const id of Object.keys(topic.concepts)) canonicalIds.add(`concept:${id}`);
  }
}
const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

function validate(plan) {
  assert.equal(plan.schemaVersion, 1);
  assert.equal(plan.kind, 'topic-hub-architecture-plan');
  assert.equal(plan.status, 'proposed-not-integrated');
  for (const flag of ['uiIntegrated', 'contentMigrated', 'factReverification']) assert.equal(plan[flag], false);
  assert.ok(plan.designDocument.startsWith('docs/') && !plan.designDocument.split('/').includes('..'));
  assert.ok(existsSync(path.join(root, plan.designDocument)));
  const hubs = new Map();
  for (const [name, sections] of Object.entries(plan.profiles)) {
    assert.ok(slug(name) && Array.isArray(sections) && sections.length);
    assert.equal(new Set(sections).size, sections.length, `Duplicate profile section: ${name}`);
    assert.ok(sections.every(slug));
  }
  for (const hub of plan.hubSeeds) {
    assert.ok(hub.id.startsWith('hub:') && slug(hub.id.slice(4)) && nonempty(hub.label));
    assert.ok(!hubs.has(hub.id), `Duplicate hub: ${hub.id}`);
    assert.ok(canonicalIds.has(hub.domainId) && hub.domainId.startsWith('domain:'), `Unknown domain: ${hub.domainId}`);
    assert.ok(canonicalIds.has(hub.about), `Unknown canonical target: ${hub.about}`);
    assert.ok(Object.hasOwn(plan.profiles, hub.profile), `Unknown profile: ${hub.profile}`);
    hubs.set(hub.id, hub);
  }
  const refs = new Map();
  for (const reference of plan.legacyDataRefs) {
    assert.ok(!refs.has(reference.id), `Duplicate resource: ${reference.id}`);
    assert.ok(reference.file.startsWith('content/data/') && !reference.file.split('/').includes('..'));
    assert.equal(reference.resolution, 'existing-reference-only');
    const data = read(reference.file)[reference.collection];
    assert.ok(Array.isArray(data), `Unknown collection: ${reference.collection}`);
    if (reference.recordId !== null) assert.ok(data.some(row => row.id === reference.recordId), `Unknown record: ${reference.recordId}`);
    refs.set(reference.id, reference);
  }
  let outlineNodes = 0;
  let maxDepth = 0;
  const occurrenceIds = new Set();
  function walk(items, parent, depth) {
    assert.ok(Array.isArray(items) && items.length, `Empty outline: ${parent}`);
    assert.ok(depth <= 12, 'Accidental excessive nesting');
    for (const item of items) {
      assert.ok(slug(item.id) && nonempty(item.label));
      const id = `${parent}/${item.id}`;
      assert.ok(!occurrenceIds.has(id), `Duplicate navigation occurrence: ${id}`);
      occurrenceIds.add(id); outlineNodes++; maxDepth = Math.max(maxDepth, depth);
      for (const ref of item.conceptRefs ?? []) assert.ok(canonicalIds.has(ref), `Unknown concept: ${ref}`);
      for (const ref of item.hubRefs ?? []) assert.ok(hubs.has(ref), `Unknown linked hub: ${ref}`);
      if (item.legacyDataRef) assert.ok(refs.has(item.legacyDataRef), `Unknown data reference: ${item.legacyDataRef}`);
      if (item.microscopeId) assert.ok(blueprint.microscopes.includes(item.microscopeId), 'Unknown numeric fixture');
      if (item.children) walk(item.children, id, depth + 1);
    }
  }
  for (const [hubId, items] of Object.entries(plan.hubOutlines)) {
    assert.ok(hubs.has(hubId), `Unknown outline hub: ${hubId}`);
    assert.ok(items.every(item => plan.profiles[hubs.get(hubId).profile].includes(item.id)));
    walk(items, hubId, 1);
  }
  const mapped = new Set();
  for (const article of plan.articlePlacements) {
    assert.ok(articleIds.has(article.articleId), `Unknown article: ${article.articleId}`);
    assert.ok(!mapped.has(article.articleId), `Duplicate article mapping: ${article.articleId}`);
    mapped.add(article.articleId);
    assert.ok(article.placements.length);
    const placements = new Set();
    for (const placement of article.placements) {
      const hub = hubs.get(placement.hubId);
      assert.ok(hub, `Unknown placement hub: ${placement.hubId}`);
      assert.ok(plan.profiles[hub.profile].includes(placement.section), `Unknown section: ${placement.section}`);
      assert.ok(nonempty(placement.role));
      const key = `${placement.hubId}/${placement.section}`;
      assert.ok(!placements.has(key), 'Duplicate article placement');
      placements.add(key);
    }
  }
  assert.deepEqual([...mapped].sort(), [...articleIds].sort(), 'Existing articles must remain mapped');
  const terminal = plan.articlePlacements.find(item => item.articleId === 'terminal-bench');
  assert.ok(terminal.placements.some(item => item.hubId === 'hub:llm' && item.role === 'related-system-result-not-model-only'), 'Agent scores must not become model-only scores');
  const apple = plan.articlePlacements.find(item => item.articleId === 'apple-style-premium-product-video');
  assert.ok(apple.placements.some(item => item.hubId === 'hub:video-production' && item.section === 'workflow'));
  assert.ok(!apple.placements.some(item => item.hubId === 'hub:llm'), 'Video methodology must retain its tutorial context');
  for (const flag of Object.values(plan.migrationRules)) assert.equal(flag, true);
  function prohibitCopiedFacts(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      assert.ok(!['score', 'rank', 'amount', 'rows'].includes(key), `Do not duplicate research facts in the plan: ${key}`);
      prohibitCopiedFacts(child);
    }
  }
  prohibitCopiedFacts(plan);
  return { hubs: hubs.size, detailedOutlines: Object.keys(plan.hubOutlines).length,
    outlineNodes, maxDepth, mappedArticles: mapped.size, legacyDataReferences: refs.size };
}

try {
  const plan = read('content/garden/plans/topic-hubs-v2.json');
  const result = validate(plan);
  const mutations = [
    p => { p.hubSeeds.push(structuredClone(p.hubSeeds[0])); },
    p => { p.hubSeeds[0].about = 'concept:missing'; },
    p => { p.hubOutlines['hub:llm'][0].children[0].conceptRefs = ['concept:missing']; },
    p => { p.articlePlacements.pop(); },
    p => { p.articlePlacements[0].placements[0].section = 'nonexistent'; },
    p => { p.legacyDataRefs[0].recordId = 'missing-benchmark'; },
    p => { p.uiIntegrated = true; },
    p => { p.score = 99; },
    p => { p.articlePlacements.find(item => item.articleId === 'terminal-bench').placements.find(item => item.hubId === 'hub:llm').role = 'model-only'; }
  ];
  for (const mutate of mutations) {
    const invalid = structuredClone(plan); mutate(invalid);
    assert.throws(() => validate(invalid), 'Invalid plan was accepted');
  }
  console.log(JSON.stringify({ status: 'pass', scope: 'architecture-plan-only', ...result,
    negativeCases: mutations.length, uiIntegrated: false, contentMigrated: false, factReverification: false }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
