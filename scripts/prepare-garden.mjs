import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadGarden, repositoryRoot } from './validate-garden.mjs';

// Build-time derivative only. GitHub MD/JSON remains the sole knowledge source.
const { blueprint, graph } = loadGarden();
if (graph.unmappedArticleIds.length) throw new Error(`Unmapped reading pages: ${graph.unmappedArticleIds.join(', ')}`);
const questions = new Map(blueprint.domains.map(domain => [`domain:${domain.id}`, domain.question]));
const output = { ...graph, groups: blueprint.groups, scopeNote: blueprint.scopeNote,
  viewPolicy: blueprint.viewPolicy,
  nodes: graph.nodes.map(node => ({ ...node, summary: questions.get(node.id) ?? null })) };
const destination = path.join(repositoryRoot, 'src/generated');
mkdirSync(destination, { recursive: true });
writeFileSync(path.join(destination, 'garden.json'), JSON.stringify(output) + '\n');
console.log(JSON.stringify({ status: 'pass', generated: 'src/generated/garden.json', ...graph.stats }));
