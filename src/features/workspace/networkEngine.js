/** Read-only knowledge graph renderer. No dependencies, no inferred edges, no HTML injection.
 * The same renderer powers the standalone preview and the React integration.
 */
const SVG = 'http://www.w3.org/2000/svg';
const viewportCache = new Map();
const layoutCache = new Map();
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const hash = value => { let n = 2166136261; for (const c of value) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; };
const element = (name, attributes = {}) => {
  const el = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, String(value));
  return el;
};

export function normalizeNetwork(graph) {
  const known = new Set(graph.nodes.map(n => n.id));
  if (known.size !== graph.nodes.length) throw new Error('知识节点 ID 重复');
  for (const edge of graph.edges) if (!known.has(edge.source) || !known.has(edge.target)) throw new Error(`关系端点不存在：${edge.id}`);
  const nodes = graph.nodes.filter(n => !['root', 'group', 'path', 'document'].includes(n.kind));
  const byId = new Map(nodes.map(n => [n.id, n]));
  if (byId.size !== nodes.length) throw new Error('知识节点 ID 重复');
  // Display filters never change the underlying dataset.
  const edges = graph.edges.filter(e => byId.has(e.source) && byId.has(e.target));
  const edgeIds = new Set();
  for (const edge of edges) { if (edgeIds.has(edge.id)) throw new Error('关系 ID 重复'); edgeIds.add(edge.id); }
  const adjacency = new Map(nodes.map(n => [n.id, []]));
  const children = new Map();
  for (const n of nodes) if (n.parentId && byId.has(n.parentId)) {
    if (!children.has(n.parentId)) children.set(n.parentId, []);
    children.get(n.parentId).push(n.id);
  }
  for (const edge of edges) {
    adjacency.get(edge.source).push(edge);
    if (edge.target !== edge.source) adjacency.get(edge.target).push(edge);
  }
  const domainOf = id => {
    const seen = new Set(); let node = byId.get(id);
    while (node && !seen.has(node.id)) {
      if (node.kind === 'domain') return node;
      seen.add(node.id); node = byId.get(node.parentId);
    }
    return undefined;
  };
  return { nodes, edges, byId, adjacency, children, domainOf };
}

/** Deterministic force-directed placement. Parent structure seeds positions; only
 * existing source edges supply springs. Coordinates are editorial layout, not facts.
 * Runs once in short cancellable chunks, never on selection, zoom or filtering.
 */
export async function computeNetworkLayout(network, signal) {
  const signature = hash(network.nodes.map(n => `${n.id}:${n.parentId}`).join('|') + network.edges.map(e => `${e.source}>${e.target}`).join('|'));
  if (layoutCache.has(signature)) return layoutCache.get(signature);
  const domains = network.nodes.filter(n => n.kind === 'domain');
  const anchors = new Map(domains.map((n, i) => {
    const angle = i * Math.PI * 2 / Math.max(1, domains.length) - Math.PI / 2;
    return [n.id, { x: Math.cos(angle) * 510, y: Math.sin(angle) * 390 }];
  }));
  const points = network.nodes.map(node => {
    const domain = network.domainOf(node.id);
    const anchor = anchors.get(domain?.id) ?? { x: 0, y: 0 };
    const r = node.kind === 'domain' ? 0 : 35 + (hash(node.id + ':r') % 150);
    const angle = (hash(node.id) % 6283) / 1000;
    return { id: node.id, x: anchor.x + Math.cos(angle) * r, y: anchor.y + Math.sin(angle) * r,
      vx: 0, vy: 0, ax: anchor.x, ay: anchor.y, kind: node.kind };
  });
  const byId = new Map(points.map(p => [p.id, p]));
  const links = network.edges.map(e => ({ a: byId.get(e.source), b: byId.get(e.target), structure: e.type === 'browse_child' }));
  for (let step = 0; step < 180; step++) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const cooling = 1 - step / 220;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      for (let j = i + 1; j < points.length; j++) {
        const b = points[j]; let dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy + 2;
        if (d2 > 250000) continue;
        if (Math.abs(dx) + Math.abs(dy) < .01) { dx = .7; dy = .4; }
        const f = Math.min(2.5, 1100 / d2) * cooling, length = Math.sqrt(d2);
        a.vx += dx / length * f; a.vy += dy / length * f;
        b.vx -= dx / length * f; b.vy -= dy / length * f;
      }
    }
    for (const { a, b, structure } of links) {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.max(1, Math.hypot(dx, dy));
      const f = (d - (structure ? 52 : 160)) * (structure ? .013 : .0025) * cooling;
      a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f;
    }
    for (const p of points) {
      const strength = p.kind === 'domain' ? .02 : .004;
      p.vx = (p.vx + (p.ax - p.x) * strength) * .74;
      p.vy = (p.vy + (p.ay - p.y) * strength) * .74;
      p.x += clamp(p.vx, -9, 9); p.y += clamp(p.vy, -9, 9);
    }
    if (step % 8 === 7) await new Promise(resolve => setTimeout(resolve, 0));
  }
  const result = { signature, points: points.map(p => ({ id: p.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2) })) };
  if (layoutCache.size > 3) layoutCache.delete(layoutCache.keys().next().value);
  layoutCache.set(signature, result);
  return result;
}

export function mountKnowledgeNetwork(host, graph, callbacks = {}) {
  const network = normalizeNetwork(graph);
  const controller = new AbortController();
  let destroyed = false, frame = 0, points = [], pointById = new Map(), signature = 0;
  let size = { width: 1, height: 1 }, camera = { cx: 0, cy: 0, zoom: .65 };
  let selectedId = null, hoveredId = null, focusedId = null, initialized = false;
  let settings = { structure: true, relations: true, colored: false, labels: 1, onlyResources: false, groups: null };
  let pendingFocus = null, panelWidth = 0, pinch = null, single = null;
  const pointers = new Map(), nodeElements = new Map(), edgeElements = [];
  const measureContext = document.createElement('canvas').getContext('2d');
  if (measureContext) measureContext.font = '12px sans-serif';
  const svg = element('svg', { class: 'kg-svg', role: 'group', tabindex: '0', 'aria-label': '知识关系图，方向键平移，加减号缩放，0显示全图。也可通过搜索访问全部节点。' });
  const edgesGroup = element('g', { class: 'kg-edges', 'aria-hidden': 'true' });
  const nodesGroup = element('g', { class: 'kg-nodes' });
  svg.append(edgesGroup, nodesGroup);
  host.replaceChildren(svg); host.dataset.layout = 'loading';
  const readCamera = () => {
    const memory = viewportCache.get(signature); if (memory) return { ...memory };
    try {
      const data = JSON.parse(sessionStorage.getItem(`nextchina-graph-camera:${signature}`) ?? 'null');
      if (data && Number.isFinite(data.cx) && Number.isFinite(data.cy) && Number.isFinite(data.zoom)
        && Math.abs(data.cx) < 1e5 && Math.abs(data.cy) < 1e5 && data.zoom >= .08 && data.zoom <= 4) return data;
    } catch { /* Browser storage is optional. */ }
    return null;
  };
  const remember = () => {
    viewportCache.set(signature, { ...camera });
    try { sessionStorage.setItem(`nextchina-graph-camera:${signature}`, JSON.stringify(camera)); } catch { /* Optional. */ }
  };
  const world = (x, y) => ({ x: (x - size.width / 2) / camera.zoom + camera.cx, y: (y - size.height / 2) / camera.zoom + camera.cy });
  const screen = p => ({ x: (p.x - camera.cx) * camera.zoom + size.width / 2, y: (p.y - camera.cy) * camera.zoom + size.height / 2 });
  const resource = n => Boolean(n.articleBindings?.length || n.resourceRefs?.length || n.embeddedArticleId);
  const visible = n => n.id === selectedId || ((!settings.groups || settings.groups.includes(network.domainOf(n.id)?.group)) && (!settings.onlyResources || resource(n)));
  const radius = n => n.kind === 'domain' ? 6 : n.kind === 'hub' ? 5 : n.kind === 'topic' ? 3.5 : 2.6 + Math.min(2, (network.adjacency.get(n.id)?.filter(e => e.type !== 'browse_child').length ?? 0) * .3);
  const edgeVisible = e => (e.type === 'browse_child' ? settings.structure : settings.relations) && visible(network.byId.get(e.source)) && visible(network.byId.get(e.target));
  function render() {
    frame = 0; if (destroyed || !initialized) return;
    svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
    const focus = hoveredId ?? focusedId ?? selectedId;
    const neighbors = new Set(focus ? [focus] : []);
    if (focus) for (const e of network.adjacency.get(focus) ?? []) if (edgeVisible(e)) { neighbors.add(e.source); neighbors.add(e.target); }
    let visibleCount = 0, linkCount = 0;
    const projected = new Map(points.map(p => [p.id, screen(p)]));
    for (const { edge, line } of edgeElements) {
      const show = edgeVisible(edge); line.style.display = show ? '' : 'none'; if (!show) continue;
      linkCount++;
      const a = projected.get(edge.source), b = projected.get(edge.target);
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y); line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.dataset.active = String(Boolean(focus && (edge.source === focus || edge.target === focus)));
      line.dataset.dim = String(Boolean(focus && edge.source !== focus && edge.target !== focus));
    }
    const labelCandidates = [];
    for (const node of network.nodes) {
      const el = nodeElements.get(node.id), p = projected.get(node.id); const show = visible(node);
      el.root.style.display = show ? '' : 'none'; if (!show) continue;
      visibleCount++;
      el.root.setAttribute('transform', `translate(${p.x},${p.y})`);
      el.root.dataset.active = String(node.id === selectedId);
      el.root.dataset.neighbor = String(Boolean(focus && neighbors.has(node.id)));
      el.root.dataset.dim = String(Boolean(focus && !neighbors.has(node.id)));
      el.root.dataset.colored = String(settings.colored);
      el.root.setAttribute('aria-pressed', String(node.id === selectedId));
      el.root.setAttribute('tabindex', node.id === (selectedId ?? network.nodes[0]?.id) ? '0' : '-1');
      const r = radius(node) * clamp(Math.sqrt(camera.zoom), .82, 1.3);
      el.dot.setAttribute('r', r); el.ring.setAttribute('r', r + 4);
      el.label.setAttribute('x', r + 7); el.label.style.display = 'none';
      // Stable label priority and collision testing prevent an unreadable wall of text.
      const selected = node.id === focus;
      const priority = selected ? 10000 : neighbors.has(node.id) ? 600 : node.kind === 'domain' ? 400 : node.kind === 'hub' ? 300 : (network.adjacency.get(node.id)?.length ?? 0);
      if ((settings.labels > 0 || selected) && p.x > -30 && p.y > 20 && p.x < size.width - panelWidth - 30 && p.y < size.height - 20) {
        const threshold = settings.labels >= 1.5 ? .35 : .7;
        if (selected || neighbors.has(node.id) || ['domain','hub'].includes(node.kind) || camera.zoom >= threshold * (node.kind === 'topic' ? .7 : 1))
          labelCandidates.push({ node, el, p, priority, r });
      }
    }
    const boxes = [];
    labelCandidates.sort((a, b) => b.priority - a.priority || a.node.id.localeCompare(b.node.id));
    const budget = Math.round(size.width * size.height / 13500 * settings.labels) + 12;
    for (const c of labelCandidates) {
      const width = (measureContext?.measureText(c.node.label).width ?? c.node.label.length * 12) + 12;
      const rect = { left: c.p.x + c.r + 5, top: c.p.y - 9, right: c.p.x + c.r + width + 5, bottom: c.p.y + 11 };
      if (c.priority < 10000 && (boxes.length >= budget || rect.right > size.width - panelWidth - 8 || boxes.some(b => rect.left < b.right && rect.right > b.left && rect.top < b.bottom && rect.bottom > b.top))) continue;
      c.el.label.style.display = ''; boxes.push(rect);
    }
    host.dataset.selected = selectedId ?? '';
    host.dataset.zoom = camera.zoom.toFixed(3);
    callbacks.onStats?.({ nodes: visibleCount, total: network.nodes.length, edges: linkCount, zoom: camera.zoom });
  }
  const schedule = () => { if (!frame && !destroyed) frame = requestAnimationFrame(render); };
  const zoomAt = (factor, x = (size.width - panelWidth) / 2, y = size.height / 2) => {
    const before = world(x, y); camera.zoom = clamp(camera.zoom * factor, .08, 4);
    camera.cx = before.x - (x - size.width / 2) / camera.zoom; camera.cy = before.y - (y - size.height / 2) / camera.zoom;
    schedule(); remember();
  };
  const fit = () => {
    const list = points.filter(p => visible(network.byId.get(p.id)));
    if (!list.length) { schedule(); return; }
    const x1 = Math.min(...list.map(p => p.x)) - 85, x2 = Math.max(...list.map(p => p.x)) + 85;
    const y1 = Math.min(...list.map(p => p.y)) - 65, y2 = Math.max(...list.map(p => p.y)) + 65;
    camera.zoom = clamp(Math.min((size.width - panelWidth - 32) / (x2 - x1), (size.height - 80) / (y2 - y1)), .08, 1.2);
    camera.cx = (x1 + x2) / 2 + panelWidth / 2 / camera.zoom; camera.cy = (y1 + y2) / 2;
    schedule(); remember();
  };
  const focusOn = (id, force = false) => {
    const p = pointById.get(id); if (!p) { pendingFocus = id; return; }
    const projected = screen(p);
    if (force || projected.x < 80 || projected.x > size.width - panelWidth - 150 || projected.y < 65 || projected.y > size.height - 80) {
      camera.zoom = Math.max(camera.zoom, .78);
      camera.cx = p.x + panelWidth / 2 / camera.zoom; camera.cy = p.y;
      schedule(); remember();
    }
  };
  const nearest = (x, y) => {
    let found = null, minimum = 16;
    for (const p of points) if (visible(network.byId.get(p.id))) {
      const s = screen(p), distance = Math.hypot(x - s.x, y - s.y);
      if (distance < minimum) { found = p.id; minimum = distance; }
    }
    return found;
  };
  const local = event => { const rect = svg.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
  const beginPinch = () => {
    const [a, b] = [...pointers.values()];
    if (!a || !b) return;
    const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    pinch = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), world: world(midpoint.x, midpoint.y), zoom: camera.zoom };
    single = null;
  };
  const onDown = event => {
    if (event.button !== 0) return;
    const p = local(event); pointers.set(event.pointerId, p); svg.setPointerCapture(event.pointerId);
    if (pointers.size === 1) single = { ...p, camera: { ...camera }, moved: false, id: nearest(p.x, p.y) };
    else beginPinch();
    svg.classList.add('is-dragging');
  };
  const onMove = event => {
    const p = local(event);
    if (pointers.has(event.pointerId)) {
      pointers.set(event.pointerId, p);
      if (pointers.size >= 2 && pinch) {
        const [a, b] = [...pointers.values()], midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        camera.zoom = clamp(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.distance, .08, 4);
        camera.cx = pinch.world.x - (midpoint.x - size.width / 2) / camera.zoom;
        camera.cy = pinch.world.y - (midpoint.y - size.height / 2) / camera.zoom;
      } else if (single) {
        const dx = p.x - single.x, dy = p.y - single.y;
        if (Math.hypot(dx, dy) > 4) single.moved = true;
        if (single.moved) { camera.cx = single.camera.cx - dx / camera.zoom; camera.cy = single.camera.cy - dy / camera.zoom; }
      }
      schedule();
    } else {
      const next = nearest(p.x, p.y); if (next !== hoveredId) { hoveredId = next; svg.style.cursor = next ? 'pointer' : 'grab'; schedule(); }
    }
  };
  const onUp = event => {
    if (!pointers.has(event.pointerId)) return;
    const click = event.type === 'pointerup' && pointers.size === 1 && single && !single.moved;
    const id = click ? single.id : null;
    pointers.delete(event.pointerId); pinch = null; single = null;
    if (pointers.size === 1) { const p = [...pointers.values()][0]; single = { ...p, camera: { ...camera }, moved: true, id: null }; }
    if (!pointers.size) svg.classList.remove('is-dragging');
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    remember();
    if (click) { if (id) callbacks.onSelect?.(id); else callbacks.onClear?.(); }
  };
  const onWheel = event => { event.preventDefault(); const p = local(event); zoomAt(Math.exp(-clamp(event.deltaY, -200, 200) * .003), p.x, p.y); };
  const onLeave = () => { hoveredId = null; schedule(); };
  const onKey = event => {
    const node = event.target.closest?.('[data-node-id]');
    if (node && ['Enter', ' '].includes(event.key)) { event.preventDefault(); callbacks.onSelect?.(node.dataset.nodeId); return; }
    const step = (event.shiftKey ? 150 : 60) / camera.zoom;
    const changes = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (changes[event.key]) { event.preventDefault(); camera.cx += changes[event.key][0]; camera.cy += changes[event.key][1]; schedule(); remember(); }
    if (['+', '='].includes(event.key)) { event.preventDefault(); zoomAt(1.25); }
    if (event.key === '-') { event.preventDefault(); zoomAt(.8); }
    if (event.key === '0') { event.preventDefault(); fit(); }
    if (event.key === 'Escape') { event.preventDefault(); callbacks.onClear?.(); }
  };
  const onFocus = event => { focusedId = event.target.closest?.('[data-node-id]')?.dataset.nodeId ?? null; schedule(); };
  const onBlur = () => { focusedId = null; schedule(); };
  for (const [name, handler] of [['pointerdown',onDown],['pointermove',onMove],['pointerup',onUp],['pointercancel',onUp],['pointerleave',onLeave],['keydown',onKey],['focusin',onFocus],['focusout',onBlur]]) svg.addEventListener(name, handler, { signal: controller.signal });
  svg.addEventListener('wheel', onWheel, { passive: false, signal: controller.signal });
  const resize = new ResizeObserver(() => {
    const rect = host.getBoundingClientRect(); const previous = size;
    size = { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
    if (initialized && previous.width <= 1) fit(); else schedule();
  }); resize.observe(host);
  const ready = computeNetworkLayout(network, controller.signal).then(result => {
    if (destroyed) return;
    signature = result.signature; points = result.points; pointById = new Map(points.map(p => [p.id, p]));
    for (const edge of network.edges) {
      const line = element('line', { class: 'kg-edge', 'data-type': edge.type });
      edgesGroup.append(line); edgeElements.push({ edge, line });
    }
    for (const node of network.nodes) {
      const root = element('g', { class: 'kg-node', role: 'button', tabindex: '-1', 'aria-label': `打开知识笔记：${node.label}`, 'data-node-id': node.id, 'data-kind': node.kind, 'data-group': network.domainOf(node.id)?.group ?? '', 'data-ready': resource(node) });
      const ring = element('circle', { class: 'kg-ring' }), dot = element('circle', { class: 'kg-dot' });
      const label = element('text', { class: 'kg-label', y: '4', 'aria-hidden': 'true' }); label.textContent = node.label;
      const title = element('title'); title.textContent = `${node.label} · ${resource(node) ? '有阅读资料' : '知识提纲'}`;
      root.append(ring, dot, label, title); nodesGroup.append(root); nodeElements.set(node.id, { root, ring, dot, label });
    }
    initialized = true; const cached = readCamera();
    if (cached) { camera = cached; schedule(); } else fit();
    if (pendingFocus) { focusOn(pendingFocus, true); pendingFocus = null; }
    host.dataset.layout = 'ready'; callbacks.onReady?.();
  }).catch(error => {
    if (destroyed || error.name === 'AbortError') return;
    host.dataset.layout = 'error'; callbacks.onError?.(error);
  });
  return {
    ready,
    select(id, options = {}) { selectedId = network.byId.has(id) ? id : null; hoveredId = null; if (selectedId && options.focus) focusOn(selectedId, true); schedule(); },
    configure(next) { settings = { ...settings, ...next }; schedule(); },
    setPanelWidth(width) { panelWidth = Math.max(0, width); schedule(); },
    fit, zoomIn() { zoomAt(1.25); }, zoomOut() { zoomAt(.8); },
    focus(id) { focusOn(id, true); }, getCamera() { return { ...camera }; },
    getLayout() { return points.map(p => ({ ...p })); },
    destroy() { destroyed = true; controller.abort(); cancelAnimationFrame(frame); resize.disconnect(); if (initialized) remember(); svg.remove(); }
  };
}
