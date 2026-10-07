import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadGarden, repositoryRoot } from './validate-garden.mjs';
import { attachTopicHubs } from './build-topic-hubs.mjs';
import { enrichKnowledge } from './enrich-knowledge.mjs';
import { knowledgeHealth } from '../src/features/garden/graphContract.js';
export function auditKnowledge(root = repositoryRoot) {
  const { graph: base, publishedArticleIds } = loadGarden(root);
  const evidence = JSON.parse(readFileSync(path.join(root, 'content/garden/semantic-relations.json'), 'utf8'));
  const graph = enrichKnowledge(attachTopicHubs(base, root, publishedArticleIds), evidence);
  return { graph, health: knowledgeHealth(graph) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { health } = auditKnowledge();
  const args = process.argv.slice(2);
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--emit') throw new Error('Usage: node scripts/audit-knowledge.mjs [--emit file.json]');
    writeFileSync(args[1], JSON.stringify(health, null, 2) + '\n');
  }
  const { missingIndependentExplanation, missingSourceCheckedSemanticEdge, ...summary } = health;
  console.log(JSON.stringify({ ...summary, missingIndependentExplanation: missingIndependentExplanation.length,
    missingSourceCheckedSemanticEdge: missingSourceCheckedSemanticEdge.length }, null, 2));
}
