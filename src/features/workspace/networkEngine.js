/** Read-only SVG renderer. Host focus never paints a viewport-sized outline. */
import { normalizeNetwork, computeNetworkLayout } from './networkLayout.js';
import { normalizeNetworkSettings } from './networkPreferences.js';
export { normalizeNetwork, computeNetworkLayout } from './networkLayout.js';
const SVG = 'http://www.w3.org/2000/svg';
const viewportCache = new Map();
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const element = (tag, attrs = {}) => {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
};

export function mountKnowledgeNetwork(host, graph, callbacks = {}) {
  const network = normalizeNetwork(graph), controller = new AbortController();
  const groupIds = graph.groups.map(g => g.id);
  let destroyed = false, initialized = false, frame = 0, signature = 0, points = [], pointById = new Map();
  // Cached layouts can resolve before ResizeObserver; use real dimensions immediately.
  const initial = host.getBoundingClientRect();
  let size = { width: Math.max(1, initial.width), height: Math.max(1, initial.height) };
  let camera = { cx: 0, cy: 0, zoom: .65 }, cameraMode = 'fit';
  let selectedId = null, hoveredId = null, focusedId = null, pendingFocus = null, panelWidth = 0;
  let settings = normalizeNetworkSettings(null, groupIds), visibleIds = new Set();
  let windowSize = { width: innerWidth, height: innerHeight }, single = null, pinch = null;
  const pointers = new Map(), nodeElements = new Map(), edgeElements = [];
  const domains = new Map(network.nodes.map(n => [n.id, network.domainOf(n.id)]));
  const roleOf = edge => {
    if (edge.type === 'browse_child') return 'structure';
    if (edge.type === 'recommended_before') return 'before';
    if (edge.type === 'references' || edge.type === 'represents') return 'reference';
    return 'related';
  };
  const roles = new Map(network.edges.map(e => [e.id, roleOf(e)]));
  const controlFor = { structure: 'structure', before: 'prerequisites', reference: 'references', related: 'relations' };
  const enabled = edge => settings[controlFor[roles.get(edge.id)]];
  const hasResource = node => Boolean(node.articleBindings?.length || node.resourceRefs?.length || node.embeddedArticleId);
  const mapEligible = node => {
    if (node.kind === 'domain' || hasResource(node)) return true;
    return (network.adjacency.get(node.id) ?? []).some(edge =>
      !['browse_child','references','represents','related'].includes(edge.type));
  };
  function refreshVisible() {
    const neighbors = new Set(selectedId ? [selectedId] : []);
    if (selectedId && settings.focusNeighbors) {
      for (const edge of network.adjacency.get(selectedId) ?? []) if (enabled(edge)) {
        neighbors.add(edge.source); neighbors.add(edge.target);
      }
    }
    visibleIds = new Set(network.nodes.filter(node => node.id === selectedId || (mapEligible(node) &&
      (!settings.groups || settings.groups.includes(domains.get(node.id)?.group)) &&
      (!settings.onlyResources || hasResource(node)) &&
      (settings.detail === 'all' || (settings.detail === 'concepts' ? node.kind === 'concept' : ['domain', 'hub', 'topic'].includes(node.kind))) &&
      (!selectedId || !settings.focusNeighbors || neighbors.has(node.id))
    )).map(node => node.id));
  }
  const edgeVisible = edge => enabled(edge) && visibleIds.has(edge.source) && visibleIds.has(edge.target);
  const measure = document.createElement('canvas').getContext('2d');
  if (measure) measure.font = `12px ${getComputedStyle(host).fontFamily}`;
  const svg = element('svg', { class: 'kg-svg', focusable: 'false', 'aria-label': 'AI 知识图谱' });
  const lines = element('g', { class: 'kg-edges', 'aria-hidden': 'true' }), nodes = element('g', { class: 'kg-nodes' });
  svg.append(lines, nodes); host.replaceChildren(svg); host.dataset.layout = 'loading';
  const oldTab = host.getAttribute('tabindex'); host.tabIndex = 0;
  const screen = p => ({ x: (p.x - camera.cx) * camera.zoom + size.width / 2, y: (p.y - camera.cy) * camera.zoom + size.height / 2 });
  const world = (x, y) => ({ x: (x - size.width / 2) / camera.zoom + camera.cx, y: (y - size.height / 2) / camera.zoom + camera.cy });
  function remember() {
    if (!initialized) return;
    const value = { ...camera, mode: cameraMode, width: size.width, height: size.height };
    viewportCache.set(signature, value);
    try { sessionStorage.setItem(`nextchina-graph-camera:v2:${signature}`, JSON.stringify(value)); } catch { /* Optional. */ }
  }
  function readCamera() {
    try {
      const value = viewportCache.get(signature) ?? JSON.parse(sessionStorage.getItem(`nextchina-graph-camera:v2:${signature}`) ?? 'null');
      if (value && [value.cx, value.cy, value.zoom].every(Number.isFinite) && Math.abs(value.cx) < 1e5 && Math.abs(value.cy) < 1e5 && value.zoom >= .08 && value.zoom <= 4) return value;
    } catch { /* Optional. */ }
    return null;
  }
  function render() {
    frame = 0; if (destroyed || !initialized) return;
    svg.setAttribute('viewBox', `0 0 ${size.width} ${size.height}`);
    const focus = hoveredId ?? focusedId ?? selectedId, neighbors = new Set(focus ? [focus] : []);
    if (focus) for (const edge of network.adjacency.get(focus) ?? []) if (edgeVisible(edge)) {
      neighbors.add(edge.source); neighbors.add(edge.target);
    }
    const projected = new Map(points.map(p => [p.id, screen(p)])); let linkCount = 0;
    for (const { edge, line } of edgeElements) {
      const show = edgeVisible(edge); line.style.display = show ? '' : 'none'; if (!show) continue;
      linkCount++;
      const a = projected.get(edge.source), b = projected.get(edge.target);
      const active = Boolean(focus && (edge.source === focus || edge.target === focus));
      const structure = roles.get(edge.id) === 'structure';
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y); line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.dataset.active = String(active); line.dataset.dim = String(Boolean(focus && !active));
      line.style.strokeWidth = String(settings.lineWidth * (active ? 1.5 : structure ? .7 : 1));
      line.style.opacity = String(focus && !active ? .07 : active ? .9 : settings.lineOpacity * (structure ? .55 : 1));
    }
    const candidates = [], tabId = selectedId ?? network.nodes.find(n => visibleIds.has(n.id))?.id;
    for (const node of network.nodes) {
      const el = nodeElements.get(node.id), p = projected.get(node.id), show = visibleIds.has(node.id);
      el.root.style.display = show ? '' : 'none'; if (!show) continue;
      el.root.setAttribute('transform', `translate(${p.x},${p.y})`);
      el.root.dataset.active = String(node.id === selectedId);
      el.root.dataset.neighbor = String(Boolean(focus && neighbors.has(node.id)));
      el.root.dataset.dim = String(Boolean(focus && !neighbors.has(node.id)));
      el.root.dataset.colored = String(settings.colored);
      el.root.setAttribute('aria-pressed', String(node.id === selectedId));
      el.root.setAttribute('tabindex', node.id === tabId ? '0' : '-1');
      const base = node.kind === 'domain' ? 6 : node.kind === 'hub' ? 5 : node.kind === 'topic' ? 3.6 : 2.8;
      const r = base * settings.nodeSize * clamp(Math.sqrt(camera.zoom), .82, 1.3);
      el.dot.setAttribute('r', r); el.ring.setAttribute('r', r + 4); el.label.style.display = 'none';
      const active = node.id === focus;
      const priority = active ? 10000 : neighbors.has(node.id) ? 600 : node.kind === 'domain' ? 400 : node.kind === 'hub' ? 300 : network.adjacency.get(node.id)?.length ?? 0;
      if ((settings.labels > 0 || active) && p.x > 12 && p.y > 22 && p.x < size.width - panelWidth - 12 && p.y < size.height - 22) {
        const threshold = settings.labels >= 1.5 ? .35 : .7;
        if (active || neighbors.has(node.id) || ['domain','hub'].includes(node.kind) || camera.zoom >= threshold * (node.kind === 'topic' ? .7 : 1)) candidates.push({ node, el, p, priority, r });
      }
    }
    candidates.sort((a, b) => b.priority - a.priority || a.node.id.localeCompare(b.node.id));
    const boxes = [], budget = Math.round(size.width * size.height / 16000 * settings.labels) + 8;
    for (const item of candidates) {
      const width = (measure?.measureText(item.node.label).width ?? item.node.label.length * 12) + 10;
      const leftward = item.p.x + item.r + width + 8 > size.width - panelWidth - 10;
      const left = leftward ? item.p.x - item.r - width - 7 : item.p.x + item.r + 7;
      const rect = { left, top: item.p.y - 10, right: left + width, bottom: item.p.y + 11 };
      if (item.priority < 10000 && (boxes.length >= budget || rect.left < 4 || boxes.some(b => rect.left < b.right && rect.right > b.left && rect.top < b.bottom && rect.bottom > b.top))) continue;
      item.el.label.setAttribute('text-anchor', leftward ? 'end' : 'start');
      item.el.label.setAttribute('x', (leftward ? -1 : 1) * (item.r + 7));
      item.el.label.style.display = ''; boxes.push(rect);
    }
    host.dataset.selected = selectedId ?? ''; host.dataset.zoom = camera.zoom.toFixed(3);
    host.dataset.cameraX = camera.cx.toFixed(3); host.dataset.cameraY = camera.cy.toFixed(3);
    callbacks.onStats?.({ nodes: visibleIds.size, total: network.nodes.length, edges: linkCount, zoom: camera.zoom });
  }
  function schedule() { if (!frame && !destroyed) frame = requestAnimationFrame(render); }
  function zoomAt(factor, x = (size.width - panelWidth) / 2, y = size.height / 2) {
    const before = world(x, y); camera.zoom = clamp(camera.zoom * factor, .08, 4);
    camera.cx = before.x - (x - size.width / 2) / camera.zoom;
    camera.cy = before.y - (y - size.height / 2) / camera.zoom;
    cameraMode = 'manual'; schedule(); remember();
  }
  function fit() {
    const list = points.filter(p => visibleIds.has(p.id)); if (!list.length) { schedule(); return; }
    const x1 = Math.min(...list.map(p => p.x)) - 85, x2 = Math.max(...list.map(p => p.x)) + 85;
    const y1 = Math.min(...list.map(p => p.y)) - 65, y2 = Math.max(...list.map(p => p.y)) + 65;
    camera.zoom = clamp(Math.min(Math.max(40, size.width - panelWidth - 32) / (x2 - x1), Math.max(40, size.height - 100) / (y2 - y1)), .08, 1.2);
    camera.cx = (x1 + x2) / 2 + panelWidth / 2 / camera.zoom; camera.cy = (y1 + y2) / 2;
    cameraMode = 'fit'; schedule(); remember();
  }
  function focusOn(id, force = true) {
    const p = pointById.get(id); if (!p) { if (force) pendingFocus = id; return; }
    if (!force) {
      // A dock resize can hide an edge node. Pan only the missing distance, without zooming.
      const projected = screen(p);
      const x = clamp(projected.x, 28, Math.max(28, size.width - panelWidth - 28));
      const y = clamp(projected.y, 30, Math.max(30, size.height - 70));
      if (x === projected.x && y === projected.y) return;
      camera.cx += (projected.x - x) / camera.zoom; camera.cy += (projected.y - y) / camera.zoom;
    } else {
      camera.zoom = Math.max(camera.zoom, .78); camera.cx = p.x + panelWidth / 2 / camera.zoom; camera.cy = p.y;
    }
    cameraMode = 'manual'; schedule(); remember();
  }
  function nearest(x, y, touch = false) {
    let found = null, minimum = touch ? 24 : 15;
    for (const p of points) if (visibleIds.has(p.id)) {
      const s = screen(p); if (s.x < 0 || s.x > size.width - panelWidth || s.y < 0 || s.y > size.height) continue;
      const d = Math.hypot(x - s.x, y - s.y); if (d < minimum) { found = p.id; minimum = d; }
    }
    return found;
  }
  const local = event => { const r = svg.getBoundingClientRect(); return { x: event.clientX - r.left, y: event.clientY - r.top }; };
  function hit(event, p) {
    const id = event.target.closest?.('[data-node-id]')?.dataset.nodeId;
    return id && visibleIds.has(id) ? id : nearest(p.x, p.y, event.pointerType === 'touch');
  }
  function beginPinch() {
    const [a, b] = [...pointers.values()]; if (!a || !b) return;
    pinch = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), world: world((a.x + b.x) / 2, (a.y + b.y) / 2), zoom: camera.zoom };
    single = null;
  }
  function down(event) {
    if (event.button !== 0) return;
    event.preventDefault(); host.focus({ preventScroll: true }); hoveredId = null;
    const p = local(event); pointers.set(event.pointerId, p); svg.setPointerCapture(event.pointerId);
    if (pointers.size === 1) single = { ...p, camera: { ...camera }, moved: false, id: hit(event, p) }; else beginPinch();
  }
  function move(event) {
    const p = local(event);
    if (pointers.has(event.pointerId)) {
      pointers.set(event.pointerId, p);
      if (pointers.size >= 2 && pinch) {
        const [a, b] = [...pointers.values()], x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
        camera.zoom = clamp(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.distance, .08, 4);
        camera.cx = pinch.world.x - (x - size.width / 2) / camera.zoom;
        camera.cy = pinch.world.y - (y - size.height / 2) / camera.zoom; cameraMode = 'manual';
      } else if (single) {
        const dx = p.x - single.x, dy = p.y - single.y;
        if (Math.hypot(dx, dy) > 5) single.moved = true;
        if (single.moved) {
          camera.cx = single.camera.cx - dx / camera.zoom; camera.cy = single.camera.cy - dy / camera.zoom;
          cameraMode = 'manual'; svg.classList.add('is-dragging');
        }
      }
      schedule();
    } else if (event.pointerType !== 'touch') {
      const next = hit(event, p); if (next !== hoveredId) { hoveredId = next; svg.style.cursor = next ? 'pointer' : 'grab'; schedule(); }
    }
  }
  function up(event) {
    if (!pointers.has(event.pointerId)) return;
    const click = event.type === 'pointerup' && pointers.size === 1 && single && !single.moved;
    const id = click ? single.id : null;
    pointers.delete(event.pointerId); pinch = null; single = null;
    if (pointers.size === 1) { const p = [...pointers.values()][0]; single = { ...p, camera: { ...camera }, moved: true, id: null }; }
    if (!pointers.size) svg.classList.remove('is-dragging');
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    // Lock before React opens a note; a panel resize must not trigger an automatic fit.
    if (click) cameraMode = 'manual'; remember();
    if (click) { if (id) callbacks.onSelect?.(id); else callbacks.onClear?.(); }
  }
  function wheel(event) {
    event.preventDefault(); const p = local(event), unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1;
    if (settings.wheelMode === 'pan' && !event.ctrlKey && !event.metaKey) {
      camera.cx += event.deltaX * unit / camera.zoom; camera.cy += event.deltaY * unit / camera.zoom;
      cameraMode = 'manual'; schedule(); remember();
    } else zoomAt(Math.exp(-clamp(event.deltaY * unit, -200, 200) * (event.ctrlKey ? .006 : .003)), p.x, p.y);
  }
  function key(event) {
    const node = event.target.closest?.('[data-node-id]');
    if (node && ['Enter', ' '].includes(event.key)) { event.preventDefault(); cameraMode = 'manual'; callbacks.onSelect?.(node.dataset.nodeId); return; }
    const step = (event.shiftKey ? 150 : 60) / camera.zoom;
    const changes = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (changes[event.key]) { event.preventDefault(); camera.cx += changes[event.key][0]; camera.cy += changes[event.key][1]; cameraMode = 'manual'; schedule(); remember(); }
    if (['+', '='].includes(event.key)) { event.preventDefault(); zoomAt(1.25); }
    if (event.key === '-') { event.preventDefault(); zoomAt(.8); }
    if (event.key === '0') { event.preventDefault(); fit(); }
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); callbacks.onClear?.(); }
  }
  const cancel = () => { pointers.clear(); single = null; pinch = null; hoveredId = null; svg.classList.remove('is-dragging'); schedule(); };
  for (const [name, handler] of [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up], ['lostpointercapture', up], ['pointerleave', () => { hoveredId = null; schedule(); }]]) svg.addEventListener(name, handler, { signal: controller.signal });
  svg.addEventListener('wheel', wheel, { passive: false, signal: controller.signal });
  host.addEventListener('keydown', key, { signal: controller.signal });
  host.addEventListener('focusin', event => { focusedId = event.target.closest?.('[data-node-id]')?.dataset.nodeId ?? null; schedule(); }, { signal: controller.signal });
  host.addEventListener('focusout', () => { focusedId = null; schedule(); }, { signal: controller.signal });
  window.addEventListener('blur', cancel, { signal: controller.signal });
  const resize = new ResizeObserver(() => {
    const rect = host.getBoundingClientRect(), previous = size;
    size = { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
    const windowChanged = windowSize.width !== innerWidth || windowSize.height !== innerHeight;
    windowSize = { width: innerWidth, height: innerHeight };
    if (initialized && (previous.width <= 1 || (cameraMode === 'fit' && (windowChanged || !selectedId)))) fit();
    else {
      if (initialized && selectedId && (previous.width !== size.width || previous.height !== size.height)) focusOn(selectedId, false);
      schedule();
    }
  });
  resize.observe(host); refreshVisible();
  const ready = computeNetworkLayout(network, controller.signal).then(result => {
    if (destroyed) return;
    signature = result.signature; points = result.points; pointById = new Map(points.map(p => [p.id, p]));
    for (const edge of network.edges) {
      const line = element('line', { class: 'kg-edge', 'data-type': edge.type, 'data-role': roles.get(edge.id), 'data-edge-id': edge.id });
      lines.append(line); edgeElements.push({ edge, line });
    }
    for (const node of network.nodes) {
      const root = element('g', { class: 'kg-node', role: 'button', tabindex: '-1', 'aria-label': `打开知识笔记：${node.label}`, 'data-node-id': node.id, 'data-kind': node.kind, 'data-group': domains.get(node.id)?.group ?? '', 'data-ready': hasResource(node) });
      const ring = element('circle', { class: 'kg-ring', fill: 'none' }), dot = element('circle', { class: 'kg-dot' });
      const label = element('text', { class: 'kg-label', y: 4, 'aria-hidden': 'true' });
      label.textContent = node.label; label.style.pointerEvents = 'auto';
      // Inline labels and accessible names replace native SVG title tooltips.
      root.append(ring, dot, label); nodes.append(root); nodeElements.set(node.id, { root, ring, dot, label });
    }
    initialized = true; const saved = readCamera();
    if (saved) {
      camera = { cx: saved.cx, cy: saved.cy, zoom: saved.zoom }; cameraMode = saved.mode === 'fit' ? 'fit' : 'manual';
      if (cameraMode === 'fit' && (saved.width !== size.width || saved.height !== size.height)) fit(); else schedule();
    } else fit();
    if (pendingFocus && pendingFocus === selectedId) focusOn(pendingFocus);
    pendingFocus = null; host.dataset.layout = 'ready'; callbacks.onReady?.();
  }).catch(error => {
    if (destroyed || error.name === 'AbortError') return;
    host.dataset.layout = 'error'; callbacks.onError?.(error);
  });
  return {
    ready,
    select(id, options = {}) {
      selectedId = network.byId.has(id) ? id : null; hoveredId = null;
      pendingFocus = selectedId && options.focus ? selectedId : null;
      refreshVisible(); if (selectedId && options.focus) focusOn(selectedId); schedule();
    },
    configure(next) { settings = normalizeNetworkSettings({ ...settings, ...next }, groupIds); refreshVisible(); schedule(); },
    setPanelWidth(width) { panelWidth = Math.max(0, width); schedule(); },
    fit, zoomIn() { zoomAt(1.25); }, zoomOut() { zoomAt(.8); }, focus(id) { focusOn(id); },
    getCamera() { return { ...camera }; }, getLayout() { return points.map(p => ({ ...p })); },
    destroy() {
      destroyed = true; controller.abort(); cancelAnimationFrame(frame); resize.disconnect(); remember(); svg.remove();
      if (oldTab === null) host.removeAttribute('tabindex'); else host.setAttribute('tabindex', oldTab);
    }
  };
}
