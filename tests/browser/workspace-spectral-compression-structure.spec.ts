import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { graph } from '../../src/features/garden/data';

test('spectral and compression preserve relative math order and canonical folder links with an acyclic reading graph', () => {
  const blueprint = JSON.parse(readFileSync('content/garden/blueprint.json', 'utf8'));
  const rows = blueprint.relations.filter((row: { type: string; routeId?: string }) => row.type === 'recommended_before' && !row.routeId);
  const pairs = rows.map((row: { source: string; target: string }) => `${row.source}>${row.target}`);
  expect(new Set(pairs).size).toBe(pairs.length);
  const adjacency = new Map<string, string[]>(), degree = new Map<string, number>();
  for (const row of rows) {
    adjacency.set(row.source, [...(adjacency.get(row.source) ?? []), row.target]);
    degree.set(row.source, degree.get(row.source) ?? 0);
    degree.set(row.target, (degree.get(row.target) ?? 0) + 1);
  }
  const queue = [...degree].filter(([, count]) => count === 0).map(([id]) => id);
  let visited = 0;
  while (queue.length) {
    const id = queue.shift()!; visited++;
    for (const target of adjacency.get(id) ?? []) {
      degree.set(target, degree.get(target)! - 1);
      if (!degree.get(target)) queue.push(target);
    }
  }
  expect(visited).toBe(degree.size);
  const leaves = ['tokenization', 'representations', 'tensor-shapes', 'floating-point', 'probability', 'softmax', 'objectives', 'mutual-information', 'compression', 'derivatives', 'complexity', 'eigen-svd'];
  const expected = leaves.map(leaf => `branch:llm:math/${leaf}`);
  const siblings = graph.nodes.filter(node => node.parentId === 'branch:llm:math').map(node => node.id);
  expect(siblings.filter(id => expected.includes(id))).toEqual(expected);
  const tensor = siblings.indexOf('branch:llm:math/tensor-shapes');
  expect(siblings.slice(tensor, tensor + 3)).toEqual(['tensor-shapes', 'floating-point', 'probability'].map(leaf => `branch:llm:math/${leaf}`));
  expect(graph.nodes.find(node => node.id === 'branch:llm:math')!.embeddedArticleId).toBeUndefined();
  const mi = readFileSync('content/models/foundations/mutual-information.md', 'utf8');
  expect(mi).toContain('(?view=garden&scope=concept:compression)已有[压缩与表示基础课](?view=garden&scope=branch:llm:math/compression)');
  expect(mi).not.toContain('它们各自的独立教学单元仍待建设');
});
