import ELK from 'elkjs/lib/elk.bundled.js';

interface Request { id: number; nodes: { id: string; width: number; height: number }[]; edges: { id: string; source: string; target: string }[]; }
const elk = new ELK();
// This entire module is emitted as a real browser Worker; no layout work on React's thread.
self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, nodes, edges } = event.data;
  try {
    const result = await elk.layout({ id: 'layout-root',
      layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT',
        'elk.spacing.nodeNode': '24', 'elk.layered.spacing.nodeNodeBetweenLayers': '96',
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', 'elk.randomSeed': '1' },
      children: nodes,
      edges: edges.map(edge => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })) });
    self.postMessage({ id, positions: (result.children ?? []).map(node => ({ id: node.id, x: node.x ?? 0, y: node.y ?? 0 })) });
  } catch { self.postMessage({ id, error: '布局计算失败，请切换列表或重试。' }); }
};
