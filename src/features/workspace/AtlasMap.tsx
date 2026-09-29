import React, { useLayoutEffect, useRef, useState } from 'react';
import type { KnowledgeIndex, RelationBundle } from './knowledgeIndex';
interface Props { index: KnowledgeIndex; selectedId: string | null; onSelect: (id: string) => void; onBundle: (bundle: RelationBundle) => void; }
interface Box { x: number; y: number; width: number; height: number; }
interface Wire { bundle: RelationBundle; path: string; }

/** Native, readable layout. Selection never changes the topology or mounts a new canvas.
 * SVG wires are only a visual projection; their complete assertions remain inspectable. */
export default function AtlasMap({ index, selectedId, onSelect, onBundle }: Props) {
  const board = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<Wire[]>([]);
  const selectedGroup = selectedId ? index.groupOf(selectedId) : undefined;
  useLayoutEffect(() => {
    const root = board.current; if (!root) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const origin = root.getBoundingClientRect(), boxes = new Map<string, Box>();
        root.querySelectorAll<HTMLElement>('[data-area]').forEach(element => {
          const rect = element.getBoundingClientRect();
          boxes.set(element.dataset.area!, { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height });
        });
        setWires(index.bundles.flatMap((bundle, ordinal) => {
          const a = boxes.get(bundle.source), b = boxes.get(bundle.target); if (!a || !b) return [];
          const [first, last] = a.y < b.y || a.y === b.y && a.x < b.x ? [a, b] : [b, a];
          let path: string;
          if (Math.abs(first.y - last.y) < 3) {
            if (last.x - first.x < first.width * 1.6) {
              const x1 = first.x + first.width, x2 = last.x, y1 = first.y + 36, y2 = last.y + 36;
              path = `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
            } else {
              const x1 = first.x + first.width / 2, x2 = last.x + last.width / 2, lane = Math.max(7, first.y - 14 - ordinal % 3 * 5);
              path = `M ${x1} ${first.y} V ${lane} H ${x2} V ${last.y}`;
            }
          } else {
            const x1 = first.x + first.width * .48, x2 = last.x + last.width * .52;
            const y1 = first.y + first.height, y2 = last.y, middle = (y1 + y2) / 2;
            // When a third row intervenes, route in the outer margin instead of
            // drawing a relationship through an unrelated knowledge area.
            if (y2 - y1 > first.height * .8) {
              const outer = ordinal % 2 ? 9 : origin.width - 9;
              path = `M ${x1} ${y1} V ${y1 + 14} H ${outer} V ${y2 - 14} H ${x2} V ${y2}`;
            } else path = `M ${x1} ${y1} C ${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`;
          }
          return [{ bundle, path }];
        }));
      });
    };
    const observer = new ResizeObserver(measure); observer.observe(root);
    root.querySelectorAll<HTMLElement>('[data-area]').forEach(element => observer.observe(element));
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [index]);
  return <div className="garden-canvas atlas-map" data-layout="ready" role="region" aria-label="知识宏观地图">
    <div className="atlas-board" ref={board}>
      <svg className="atlas-wires" aria-label="跨区域知识关联">
        {wires.map(({ bundle, path }) => {
          const label = `查看 ${index.groups.find(group => group.id === bundle.source)?.label} 与 ${index.groups.find(group => group.id === bundle.target)?.label} 的 ${bundle.relations.length} 条关联`;
          return <g key={bundle.id} data-relevant={!selectedGroup || [bundle.source, bundle.target].includes(selectedGroup)}>
            <path className="atlas-wire" d={path} />
            <path className="atlas-wire-hit" d={path} role="button" tabIndex={0} aria-label={label} onClick={() => onBundle(bundle)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onBundle(bundle); } }}><title>{label}</title></path>
          </g>;
        })}
      </svg>
      {index.groups.map(group => <section className="atlas-area" data-area={group.id} data-active={group.id === selectedGroup} key={group.id} aria-label={group.label}>
        <header><span>{group.label.split(' · ')[0]}</span><h2>{group.label.split(' · ').slice(1).join(' · ') || group.label}</h2></header>
        <div className="atlas-area-domains">{group.domains.map(domain => <div className="atlas-domain" key={domain.id}>
          <button type="button" className="atlas-domain-button" data-node-id={domain.id} aria-pressed={selectedId === domain.id} onClick={() => onSelect(domain.id)} aria-label={`选择 ${domain.label}`}><strong>{domain.label}</strong><span>{domain.summary}</span></button>
          <div className="atlas-hubs">{(index.children.get(domain.id) ?? []).filter(node => node.kind === 'hub').map(hub => <button type="button" key={hub.id} data-node-id={hub.id} aria-pressed={selectedId === hub.id} aria-label={`选择 ${hub.label}`} onClick={() => onSelect(hub.id)}>{hub.label}</button>)}</div>
        </div>)}</div>
        <footer>{group.domains.length} 个领域<button type="button" aria-label={`查看 ${group.label} 的跨区关联`} onClick={() => {
          const matches = index.bundles.filter(bundle => [bundle.source, bundle.target].includes(group.id));
          onBundle({ id: `area:${group.id}`, source: group.id, target: group.id, relations: matches.flatMap(bundle => bundle.relations) });
        }}>查看关联 ↗</button></footer>
      </section>)}
    </div>
    <p className="atlas-map-note">区域表示知识结构；连线汇总真实记录的跨区关联，不表示整个领域的先修或因果。点击连线可查看原始依据。</p>
  </div>;
}
