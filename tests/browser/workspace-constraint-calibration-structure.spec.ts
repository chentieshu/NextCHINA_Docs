import { test, expect } from '@playwright/test';
import { graph } from '../../src/features/garden/data';

test('constrained optimization and calibration preserve canonical parents and old relative branch order', () => {
  for (const [concept, parent] of [['concept:constrained-optimization', 'topic:optimization'], ['concept:calibration', 'topic:trust-metrics']]) {
    const node = graph.nodes.find(node => node.id === concept)!;
    expect(node.kind).toBe('concept'); expect(node.parentId).toBe(parent); expect(node.embeddedArticleId).toBeUndefined();
  }
  const orders = {
    math: ['tokenization', 'representations', 'tensor-shapes', 'floating-point', 'probability', 'softmax', 'objectives', 'mutual-information', 'compression', 'derivatives', 'complexity', 'eigen-svd', 'constrained-optimization'],
    rankings: ['capabilities', 'metrics', 'calibration', 'methodology', 'text-preference', 'composite', 'specialized', 'efficiency', 'system-results'],
  };
  for (const [path, leaves] of Object.entries(orders)) {
    const parent = `branch:llm:${path}`, expected = leaves.map(leaf => `${parent}/${leaf}`);
    expect(graph.nodes.find(node => node.id === parent)!.embeddedArticleId).toBeUndefined();
    const actual = graph.nodes.filter(node => node.parentId === parent).map(node => node.id);
    expect(actual.filter(id => expected.includes(id))).toEqual(expected);
    if (path === 'math') {
      const at = actual.indexOf(`${parent}/tensor-shapes`);
      expect(actual.slice(at, at + 3)).toEqual(['tensor-shapes', 'floating-point', 'probability'].map(leaf => `${parent}/${leaf}`));
    }
  }
});
