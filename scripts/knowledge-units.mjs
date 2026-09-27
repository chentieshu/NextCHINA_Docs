import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/** Article registry owns independent-unit metadata. No second copy of text or facts. */
export function readKnowledgeUnits(root) {
  const { articles } = JSON.parse(readFileSync(path.join(root, 'content/articles.json'), 'utf8'));
  const units = articles.filter(article => article.knowledgeUnit);
  const ids = new Set();
  const exampleIds = new Set();
  const occupied = new Set();
  for (const article of units) {
    assert.ok(!ids.has(article.id), `Duplicate knowledge article ${article.id}`);
    ids.add(article.id);
    const unit = article.knowledgeUnit;
    assert.equal(unit.kind, 'independent-explanation');
    assert.equal(unit.reviewStatus, 'needs-independent-review');
    assert.match(unit.exampleId, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!exampleIds.has(unit.exampleId), 'Duplicate example ID');
    exampleIds.add(unit.exampleId);
    assert.ok(Array.isArray(unit.conceptIds) && unit.conceptIds.length);
    assert.equal(new Set(unit.conceptIds).size, unit.conceptIds.length);
    assert.ok(unit.conceptIds.every(id => /^concept:[a-z0-9-]+$/.test(id)));
    assert.ok(Array.isArray(unit.placements) && unit.placements.length);
    for (const placement of unit.placements) {
      assert.match(placement.hubId, /^hub:[a-z0-9-]+$/);
      assert.match(placement.path, /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/);
      const key = `${placement.hubId}/${placement.path}`;
      assert.ok(!occupied.has(key), `Two independent readers occupy ${key}`);
      occupied.add(key);
    }
    assert.ok(unit.sourceUrls.length >= 2);
    assert.equal(new Set(unit.sourceUrls).size, unit.sourceUrls.length);
    for (const source of unit.sourceUrls) assert.equal(new URL(source).protocol, 'https:');
    assert.ok(Array.isArray(unit.relatedResourceIds));
  }
  return units;
}

export function addKnowledgeBindings(blueprint, units) {
  return { ...blueprint, articleBindings: [
    ...blueprint.articleBindings,
    ...units.map(article => ({ articleId: article.id, coverage: 'explanation', nodeIds: article.knowledgeUnit.conceptIds }))
  ] };
}

export function addKnowledgePlacements(config, units) {
  return { ...config, resourcePlacements: [
    ...config.resourcePlacements,
    ...units.flatMap(article => article.knowledgeUnit.placements.map(placement => ({
      ...placement, articleId: article.id, role: 'independent-explanation'
    })))
  ] };
}
