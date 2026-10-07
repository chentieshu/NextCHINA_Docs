import { mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { loadGarden, repositoryRoot } from './validate-garden.mjs';
import { attachTopicHubs } from './build-topic-hubs.mjs';
import { enrichKnowledge } from './enrich-knowledge.mjs';
import { knowledgeHealth } from '../src/features/garden/graphContract.js';

// Canonical MD/JSON -> checked graph + topic-navigation overlay, never stored facts twice.
const { blueprint, graph: base, publishedArticleIds } = loadGarden();
if (base.unmappedArticleIds.length) throw new Error(`Unmapped reading pages: ${base.unmappedArticleIds.join(', ')}`);
const graph = enrichKnowledge(attachTopicHubs(base, repositoryRoot, publishedArticleIds),
  JSON.parse(readFileSync(path.join(repositoryRoot, 'content/garden/semantic-relations.json'), 'utf8')));
const questions = new Map(blueprint.domains.map(domain => [`domain:${domain.id}`, domain.question]));
const output = { ...graph, groups: blueprint.groups, scopeNote: blueprint.scopeNote,
  viewPolicy: blueprint.viewPolicy,
  nodes: graph.nodes.map(node => ({ ...node, summary: node.summary ?? questions.get(node.id) ?? null })) };
const destination = path.join(repositoryRoot, 'src/generated');
mkdirSync(destination, { recursive: true });
writeFileSync(path.join(destination, 'garden.json'), JSON.stringify(output) + '\n');

const health = knowledgeHealth(output);
const commit = /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? '') ? process.env.GITHUB_SHA : null;
mkdirSync(path.join(repositoryRoot, 'public'), { recursive: true });
writeFileSync(path.join(repositoryRoot, 'public/knowledge-health.json'), JSON.stringify({ commit, ...health }, null, 2) + '\n');
writeFileSync(path.join(repositoryRoot, 'public/version.json'), JSON.stringify({ commit, schemaVersion: 1, knowledgeNodes: graph.nodes.length }) + '\n');

// Use ELK's unchanged, same-origin standalone Worker and a content-addressed filename.
const require = createRequire(import.meta.url);
const bytes = readFileSync(require.resolve('elkjs/lib/elk-worker.min.js'));
const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
const assetDirectory = path.join(repositoryRoot, 'public/garden-generated');
mkdirSync(assetDirectory, { recursive: true });
const filename = `layout.worker-${hash}.js`;
for (const file of readdirSync(assetDirectory)) {
  if (/^layout\.worker-[a-f0-9]+\.js$/.test(file) && file !== filename) unlinkSync(path.join(assetDirectory, file));
}
writeFileSync(path.join(assetDirectory, filename), bytes);
writeFileSync(path.join(destination, 'garden-worker.json'), JSON.stringify({ file: `garden-generated/${filename}`, hash }) + '\n');
console.log(JSON.stringify({ status: 'pass', generated: 'src/generated/garden.json', worker: filename, ...graph.stats }));
