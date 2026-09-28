import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MarkdownNode } from '../utils/markdown';
import { measureTable, allocateTableColumns, type TableLayout } from '../utils/table-layout';

interface Props extends React.TableHTMLAttributes<HTMLTableElement> {
  node?: MarkdownNode;
  columnLayout?: TableLayout;
  scrollLabel?: string;
}
/** GFM and hand-built reference tables share the same size and scroll owner. */
export function MarkdownTable({ node, columnLayout, scrollLabel, children, style, ...props }: Props) {
  const layout = React.useMemo(() => columnLayout ?? measureTable(node), [node, columnLayout]);
  const scroller = React.useRef<HTMLDivElement>(null);
  const table = React.useRef<HTMLTableElement>(null);
  const [available, setAvailable] = React.useState(0);
  const [edges, setEdges] = React.useState({ overflow: false, left: false, right: false });
  const update = React.useCallback(() => {
    const element = scroller.current, grid = table.current;
    if (!element || !grid) return;
    const em = Number.parseFloat(getComputedStyle(grid).fontSize) || 14;
    const nextWidth = element.clientWidth / em;
    setAvailable(old => Math.abs(old - nextWidth) < .03 ? old : nextWidth);
    const remaining = element.scrollWidth - element.clientWidth;
    const next = { overflow: remaining > 1, left: element.scrollLeft > 1, right: element.scrollLeft < remaining - 1 };
    setEdges(old => old.overflow === next.overflow && old.left === next.left && old.right === next.right ? old : next);
  }, []);
  React.useEffect(() => {
    let frame = 0, disposed = false;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (scroller.current) observer?.observe(scroller.current);
    if (table.current) observer?.observe(table.current);
    document.fonts?.ready.then(() => { if (!disposed) schedule(); });
    document.fonts?.addEventListener('loadingdone', schedule);
    window.addEventListener('resize', schedule);
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener('resize', schedule); document.fonts?.removeEventListener('loadingdone', schedule); };
  }, [children, update]);
  const widths = allocateTableColumns(layout, available);
  const total = widths.reduce((sum, width) => sum + width, 0);
  const minimum = layout.columns <= 2 ? 0 : layout.tracks.reduce((sum, track) => sum + track.minimum, 0);
  const move = (direction: number) => {
    const element = scroller.current;
    element?.scrollBy({ left: direction * element.clientWidth * .75,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  return <div className={`md-table-region md-table-${layout.kind}`} data-columns={layout.columns} data-overflow={edges.overflow} data-measured={available > 0}>
    <div ref={scroller} className="md-table-scroll" onScroll={update} onLoadCapture={update}
      tabIndex={edges.overflow ? 0 : undefined} role={edges.overflow || scrollLabel ? 'region' : undefined}
      aria-label={scrollLabel ?? `数据表格，共 ${layout.columns} 列${edges.overflow ? '，可左右滚动' : ''}`}>
      <table {...props} ref={table} style={{ ...style, width: available > 0 ? `${total}em` : '100%', minWidth: `${minimum}em` }}>
        <colgroup>{widths.map((width, index) => <col key={index} data-kind={layout.tracks[index].kind} style={{ width: `${width / total * 100}%` }} />)}</colgroup>
        {children}
      </table>
    </div>
    {edges.overflow && <div className="md-table-tools"><span>左右滑动查看全部 {layout.columns} 列</span><div>
      <button type="button" onClick={() => move(-1)} disabled={!edges.left} aria-label="表格向左滚动"><ChevronLeft className="md-control-icon" /></button>
      <button type="button" onClick={() => move(1)} disabled={!edges.right} aria-label="表格向右滚动"><ChevronRight className="md-control-icon" /></button>
    </div></div>}
  </div>;
}
