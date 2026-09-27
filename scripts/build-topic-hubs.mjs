import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (root, file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const branchId = (hubId, segments) => `branch:${hubId.slice(4)}:${segments}`;

/** Navigation overlay, not new scientific assertions or copied facts. Pure and testable. */
export function buildTopicHubs(base, plan, config, publishedIds, datasets) {
  assert.equal(config.schemaVersion, 1);
  assert.equal(plan.schemaVersion, 1);
  const nodes = base.nodes.map(node => ({ ...node, articleBindings: [...node.articleBindings] }));
  const edges = [...base.edges];
  const byId = new Map(nodes.map(node => [node.id, node]));
  const enabled = new Set(config.enabledHubs);
  assert.equal(enabled.size, config.enabledHubs.length, 'Duplicate enabled hub');
  const seeds = plan.hubSeeds.filter(seed => enabled.has(seed.id));
  assert.equal(seeds.length, enabled.size, 'Unknown enabled hub');
  const resources = {};
  const entryHubs = {};
  const add = node => {
    assert.ok(!byId.has(node.id), `Duplicate hub node ${node.id}`);
    assert.ok(byId.has(node.parentId), `Missing parent ${node.parentId}`);
    const result = { contentStatus: 'outline', evidenceStatus: 'not-reviewed', articleBindings: [],
      conceptRefs: [], hubRefs: [], resourceRefs: [], summary: null, ...node };
    nodes.push(result); byId.set(result.id, result);
    edges.push({ id: `nav:${result.parentId}>${result.id}`, source: result.parentId, target: result.id,
      type: 'browse_child', assertionStatus: 'editorial' });
    return result;
  };
  const bind = (node, articleId, role) => {
    assert.ok(publishedIds.has(articleId), `Unknown resource article ${articleId}`);
    if (!node.resourceRefs.some(ref => ref.articleId === articleId)) node.resourceRefs.push({ articleId, role });
    const coverage = articleId === 'model-api-prices' ? 'prices' : /snapshot/.test(role) ? 'snapshot' : /catalogue|products/.test(role) ? 'catalogue' : /methodology/.test(role) ? 'methodology' : 'overview';
    if (!node.articleBindings.some(ref => ref.articleId === articleId)) node.articleBindings.push({ articleId, coverage });
    resources[articleId] ??= { articleId };
  };
  const dataRefs = new Map(plan.legacyDataRefs.map(ref => [ref.id, ref]));
  for (const seed of seeds) {
    assert.ok(byId.has(seed.about) && byId.has(seed.domainId), `Invalid hub seed ${seed.id}`);
    add({ id: seed.id, label: seed.label, kind: 'hub', parentId: seed.domainId, hubId: seed.id,
      conceptRefs: [seed.about], outlinePath: '', profile: seed.profile,
      summary: seed.id === 'hub:llm' ? '一个专题，连接原理、计算、训练、模型、榜单、价格、产品和实践。先选择分支，再逐层深入。' : '专题资源入口。当前仅接入已有资料分支，专属知识大纲仍需继续完善。' });
    (entryHubs[seed.about] ??= []).push(seed.id);
  }
  const pendingRefs = [];
  const visit = (hubId, outline, parentId, prefix = '', depth = 0) => {
    assert.ok(depth <= 8, 'Hub outline nesting exceeds eight levels');
    const siblings = new Set();
    for (const item of outline) {
      assert.ok(slug(item.id) && !siblings.has(item.id), `Invalid/duplicate branch ${item.id}`);
      siblings.add(item.id);
      const key = prefix ? `${prefix}/${item.id}` : item.id;
      const node = add({ id: branchId(hubId, key), label: item.label, kind: 'branch', parentId, hubId,
        outlinePath: key, conceptRefs: item.conceptRefs ?? [], hubRefs: item.hubRefs ?? [],
        summary: depth === 0 ? config.sectionDescriptions[item.id] ?? null : null,
        microscopeId: item.microscopeId ?? null });
      for (const ref of node.conceptRefs) {
        assert.ok(byId.has(ref) && !['hub','branch'].includes(byId.get(ref).kind), `Invalid concept reference ${ref}`);
        pendingRefs.push({ source: node.id, target: ref, reason: '专题中的共享知识引用；不是科学包含或因果判断。' });
      }
      for (const ref of node.hubRefs) {
        assert.ok(enabled.has(ref), `Unavailable related hub ${ref}`);
        pendingRefs.push({ source: node.id, target: ref, reason: '相关专题入口；这里的导航关联不把系统等同于模型结构。' });
      }
      if (item.legacyDataRef) {
        const ref = dataRefs.get(item.legacyDataRef);
        assert.ok(ref, `Unknown dataset reference ${item.legacyDataRef}`);
        const list = datasets[ref.file]?.[ref.collection];
        assert.ok(Array.isArray(list), `Missing dataset ${ref.file}:${ref.collection}`);
        const record = ref.recordId ? list.find(row => row.id === ref.recordId) : null;
        assert.ok(!ref.recordId || record, `Missing record ${ref.recordId}`);
        const articleId = ref.recordId ?? 'model-api-prices';
        bind(node, articleId, ref.subjectRole);
        node.embeddedArticleId = articleId;
        resources[articleId] = { articleId, datasetId: ref.id, subjectRole: ref.subjectRole,
          snapshotDate: record?.snapshotDate ?? null, metric: record?.metric ?? null,
          sourceId: record?.sourceId ?? null, warning: record?.warning ?? null,
          rowCount: record?.rows?.length ?? list.length, sourceFile: ref.file };
      }
      if (item.children) visit(hubId, item.children, node.id, key, depth + 1);
    }
  };
  for (const seed of seeds) {
    const outline = plan.hubOutlines[seed.id];
    if (outline) visit(seed.id, outline, seed.id);
    else {
      // Only existing content groups appear. Templates never create dozens of blank branches.
      const sections = [...new Set(plan.articlePlacements.flatMap(record => record.placements.filter(p => p.hubId === seed.id).map(p => p.section)))];
      visit(seed.id, sections.map(id => ({ id, label: config.sectionLabels[id] ?? id })), seed.id);
    }
  }
  for (const record of plan.articlePlacements) for (const placement of record.placements) {
    if (!enabled.has(placement.hubId)) continue;
    const node = byId.get(branchId(placement.hubId, placement.section));
    assert.ok(node, `Missing article placement ${placement.hubId}/${placement.section}`);
    bind(node, record.articleId, placement.role);
  }
  for (const placement of config.resourcePlacements) {
    const node = byId.get(branchId(placement.hubId, placement.path));
    assert.ok(node, `Unknown resource branch ${placement.path}`);
    bind(node, placement.articleId, placement.role);
    node.embeddedArticleId = placement.articleId;
  }
  for (const seed of seeds) pendingRefs.push({ source: seed.id, target: seed.about, reason: '专题的规范知识对象；专题导航与概念本身保留不同 ID。' });
  for (const ref of pendingRefs) edges.push({ ...ref, id: `hub-ref:${ref.source}>${ref.target}`, type: 'related', assertionStatus: 'editorial' });
  // No score, price, model-version join or fact date is changed here.
  for (const node of nodes) node.hubEntries = entryHubs[node.id] ?? [];
  return { ...base, nodes, edges, hubResources: resources,
    hubIntegration: { stage: config.stage, detailedHubs: Object.keys(plan.hubOutlines).filter(id => enabled.has(id)), contentMigrated: false, factReverification: false },
    stats: { ...base.stats, nodes: nodes.length, hubs: seeds.length, branches: nodes.filter(n => n.kind === 'branch').length } };
}

export function attachTopicHubs(base, root, publishedIds) {
  const config = read(root, 'content/garden/hub-integration.json');
  assert.equal(config.outlineSource, 'content/garden/plans/topic-hubs-v2.json');
  const plan = read(root, config.outlineSource);
  const datasets = {};
  for (const ref of plan.legacyDataRefs) {
    assert.ok(ref.file.startsWith('content/data/') && !ref.file.split('/').includes('..') && ref.file.endsWith('.json'), 'Invalid dataset file');
    datasets[ref.file] ??= read(root, ref.file);
  }
  return buildTopicHubs(base, plan, config, publishedIds, datasets);
}
