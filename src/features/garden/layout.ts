import ELK from 'elkjs/lib/elk-api.js';
import workerAsset from '../../generated/garden-worker.json' with { type: 'json' };
import type { KnowledgeNode } from './domain';
import type { Projection } from './projection';
export const CARD_WIDTH = 240;
export const CARD_HEIGHT = 124;
export type Positions = { id: string; x: number; y: number }[];
const cache = new Map<string, Positions>();

export function nodeSize(node: KnowledgeNode): { width: number; height: number } {
  if (node.kind === 'group' || node.kind === 'path') return { width: 200, height: 72 };
  if (node.kind === 'domain') return { width: 220, height: 96 };
  if (node.kind === 'concept') return { width: 196, height: 88 };
  if (node.kind === 'document') return { width: CARD_WIDTH, height: CARD_HEIGHT };
  return { width: 228, height: 108 };
}

export function layoutGraph(projection: Projection, signal: AbortSignal): Promise<Positions> {
  if (signal.aborted) return Promise.reject(new DOMException('Cancelled', 'AbortError'));
  const signature = JSON.stringify([
    workerAsset.hash, projection.key,
    projection.nodes.map(node => [node.id, node.kind]),
    projection.edges.map(edge => edge.id)
  ]);
  if (cache.has(signature)) return Promise.resolve(cache.get(signature)!);
  return new Promise((resolve, reject) => {
    const worker = new Worker(`${import.meta.env.BASE_URL}${workerAsset.file}`);
    let finished = false;
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); worker.terminate(); };
    const fail = (error: Error) => { if (finished) return; finished = true; cleanup(); reject(error); };
    const abort = () => fail(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => fail(new Error('布局超时，请切换列表后重试。')), 15000);
    signal.addEventListener('abort', abort, { once: true });
    worker.addEventListener('error', event => {
      console.error('Garden layout worker failed:', event.message);
      fail(new Error('布局模块未能加载，列表阅读仍可使用。'));
    });
    try {
      const elk = new ELK({ workerFactory: () => worker });
      void elk.layout({
        id: 'layout-root',
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': projection.atlas ? 'DOWN' : 'RIGHT',
          'elk.spacing.nodeNode': '28',
          'elk.layered.spacing.nodeNodeBetweenLayers': projection.atlas ? '56' : '88',
          'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
          'elk.randomSeed': '1'
        },
        children: projection.nodes.map(node => ({ id: node.id, ...nodeSize(node) })),
        edges: projection.edges.map(edge => ({ id: edge.id, sources: [edge.source], targets: [edge.target] }))
      }).then(result => {
        if (finished) return;
        const positions = (result.children ?? []).map(node => ({ id: node.id, x: node.x ?? 0, y: node.y ?? 0 }));
        if (positions.length !== projection.nodes.length || positions.some(item => !Number.isFinite(item.x) || !Number.isFinite(item.y))) {
          fail(new Error('布局结果无效。'));
          return;
        }
        finished = true; cleanup();
        if (cache.size >= 40) cache.delete(cache.keys().next().value!);
        cache.set(signature, positions); resolve(positions);
      }).catch(reason => {
        console.error('Garden layout request failed:', reason);
        fail(new Error('布局计算失败，请切换列表后重试。'));
      });
    } catch (reason) {
      console.error('Garden layout initialization failed:', reason);
      fail(new Error('布局初始化失败，请使用列表继续阅读。'));
    }
    if (signal.aborted) abort();
  });
}
