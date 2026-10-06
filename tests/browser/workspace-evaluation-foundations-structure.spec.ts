import { test, expect } from '@playwright/test';
import { graph } from '../../src/features/garden/data';

test('evaluation foundations preserve canonical parents, methodology references and relative rankings order', () => {
  const parent='branch:llm:rankings',old=['capabilities','metrics','calibration','methodology','text-preference','composite','specialized','efficiency','system-results'].map(id=>`${parent}/${id}`);
  const actual=graph.nodes.filter(node=>node.parentId===parent).map(node=>node.id);
  expect(actual.filter(id=>old.includes(id))).toEqual(old);
  const start=actual.indexOf(`${parent}/capabilities`);
  expect(actual.slice(start,start+4)).toEqual(['capabilities','datasets','protocol','metrics'].map(id=>`${parent}/${id}`));
  expect(graph.nodes.find(node=>node.id===parent)!.embeddedArticleId).toBeUndefined();
  const methodology=graph.nodes.find(node=>node.id===`${parent}/methodology`)!;
  expect(methodology.embeddedArticleId).toBe('statistical-inference-confidence-interval');
  expect(methodology.conceptRefs).toEqual(['concept:benchmark-protocol','concept:confidence-interval']);
  expect(graph.nodes.find(node=>node.id===`${parent}/calibration`)!.embeddedArticleId).toBe('probability-calibration-brier-bins');
  for(const concept of ['concept:evaluation-dataset','concept:benchmark-protocol']) {
    expect(graph.nodes.find(node=>node.id===concept)!.parentId).toBe('topic:evaluation-protocols');
    expect(graph.nodes.find(node=>node.id===concept)!.embeddedArticleId).toBeUndefined();
  }
  for(const source of [`${parent}/methodology`,`${parent}/protocol`])expect(graph.edges.filter(edge=>edge.source===source&&edge.target==='concept:benchmark-protocol'&&edge.type==='references')).toHaveLength(1);
  expect(graph.edges.filter(edge=>edge.type==='recommended_before'&&['concept:evaluation-dataset','concept:benchmark-protocol'].includes(edge.source)&&['concept:evaluation-dataset','concept:benchmark-protocol'].includes(edge.target))).toEqual([]);
});
