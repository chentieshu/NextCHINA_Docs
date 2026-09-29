/** Deterministic placement of canonical knowledge. Geometry never creates relations. */
const cache = new Map();
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const hash = value => { let n = 2166136261; for (const c of value) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; };
export function normalizeNetwork(graph) {
  const known = new Set(graph.nodes.map(n => n.id));
  if (known.size !== graph.nodes.length) throw new Error('知识节点 ID 重复');
  for (const edge of graph.edges) if (!known.has(edge.source) || !known.has(edge.target)) throw new Error(`关系端点不存在：${edge.id}`);
  const nodes = graph.nodes.filter(n => !['root','group','path','document'].includes(n.kind));
  const byId = new Map(nodes.map(n => [n.id,n]));
  const edges = graph.edges.filter(e => byId.has(e.source) && byId.has(e.target));
  if (new Set(edges.map(e => e.id)).size !== edges.length) throw new Error('关系 ID 重复');
  const adjacency = new Map(nodes.map(n => [n.id,[]])), children = new Map();
  for (const node of nodes) if (node.parentId && byId.has(node.parentId)) {
    if (!children.has(node.parentId)) children.set(node.parentId,[]);
    children.get(node.parentId).push(node.id);
  }
  for (const edge of edges) { adjacency.get(edge.source).push(edge); if (edge.source !== edge.target) adjacency.get(edge.target).push(edge); }
  const domainOf = id => {
    const seen = new Set(); let node = byId.get(id);
    while (node && !seen.has(node.id)) { if (node.kind === 'domain') return node; seen.add(node.id); node = byId.get(node.parentId); }
    return undefined;
  };
  return { nodes, edges, byId, adjacency, children, domainOf };
}
export async function computeNetworkLayout(network, signal) {
  const signature = hash(network.nodes.map(n => `${n.id}:${n.parentId}`).join('|') + network.edges.map(e => `${e.source}>${e.target}`).join('|'));
  if (cache.has(signature)) return cache.get(signature);
  const domains = network.nodes.filter(n => n.kind === 'domain');
  const anchors = new Map(domains.map((n,i) => { const a = i * Math.PI * 2 / Math.max(1,domains.length) - Math.PI / 2; return [n.id,{x:Math.cos(a)*510,y:Math.sin(a)*390}]; }));
  const points = network.nodes.map(node => {
    const anchor = anchors.get(network.domainOf(node.id)?.id) ?? {x:0,y:0};
    const r = node.kind === 'domain' ? 0 : 35 + hash(node.id + ':r') % 150, angle = hash(node.id) % 6283 / 1000;
    return { id:node.id, x:anchor.x+Math.cos(angle)*r, y:anchor.y+Math.sin(angle)*r, vx:0, vy:0, ax:anchor.x, ay:anchor.y, kind:node.kind };
  });
  const byId = new Map(points.map(p => [p.id,p]));
  const links = network.edges.map(e => ({a:byId.get(e.source),b:byId.get(e.target),structure:e.type==='browse_child'}));
  for (let step=0;step<180;step++) {
    if (signal?.aborted) throw new DOMException('Cancelled','AbortError');
    const cooling=1-step/220;
    for (let i=0;i<points.length;i++) for (let j=i+1;j<points.length;j++) {
      const a=points[i],b=points[j];let dx=a.x-b.x,dy=a.y-b.y;const d2=dx*dx+dy*dy+2;
      if(d2>250000)continue;if(Math.abs(dx)+Math.abs(dy)<.01){dx=.7;dy=.4;}
      const f=Math.min(2.5,1100/d2)*cooling,d=Math.sqrt(d2);a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;
    }
    for(const {a,b,structure} of links){const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),f=(d-(structure?52:160))*(structure?.013:.0025)*cooling;a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;}
    for(const p of points){const strength=p.kind==='domain'?.02:.004;p.vx=(p.vx+(p.ax-p.x)*strength)*.74;p.vy=(p.vy+(p.ay-p.y)*strength)*.74;p.x+=clamp(p.vx,-9,9);p.y+=clamp(p.vy,-9,9);}
    if(step%8===7)await new Promise(resolve=>setTimeout(resolve,0));
  }
  const result={signature,points:points.map(p=>({id:p.id,x:+p.x.toFixed(2),y:+p.y.toFixed(2)}))};
  if(cache.size>3)cache.delete(cache.keys().next().value);cache.set(signature,result);return result;
}
