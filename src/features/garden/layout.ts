import type { Projection } from './projection';
export const CARD_WIDTH = 240;
export const CARD_HEIGHT = 124;
export type Positions = { id: string; x: number; y: number }[];
const cache = new Map<string, Positions>();
let sequence = 0;
export function layoutGraph(projection: Projection, signal: AbortSignal): Promise<Positions> {
  const signature = JSON.stringify([projection.key, projection.nodes.map(node => node.id), projection.edges.map(edge => edge.id), CARD_WIDTH, CARD_HEIGHT]);
  if (cache.has(signature)) return Promise.resolve(cache.get(signature)!);
  if (projection.atlas) {
    // Overview is a stable atlas, not fourteen siblings in one unreadably long row.
    return Promise.resolve(projection.nodes.map((node, index) => ({ id: node.id, x: index % 4 * 264, y: Math.floor(index / 4) * 148 })));
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./layout.worker.ts', import.meta.url), { type: 'module' });
    const id = ++sequence;
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); worker.terminate(); };
    const abort = () => { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('布局超时，请切换列表后重试。')); }, 15000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => { cleanup(); reject(new Error('布局模块未能加载，列表阅读仍可使用。')); };
    worker.onmessage = event => {
      if (event.data.id !== id) return;
      cleanup();
      if (event.data.error) { reject(new Error(event.data.error)); return; }
      const positions = event.data.positions as Positions;
      if (positions.length !== projection.nodes.length || positions.some(item => !Number.isFinite(item.x) || !Number.isFinite(item.y))) { reject(new Error('布局结果无效。')); return; }
      if (cache.size >= 40) cache.delete(cache.keys().next().value!);
      cache.set(signature, positions); resolve(positions);
    };
    if (signal.aborted) { abort(); return; }
    worker.postMessage({ id, nodes: projection.nodes.map(node => ({ id: node.id, width: CARD_WIDTH, height: CARD_HEIGHT })), edges: projection.edges });
  });
}
