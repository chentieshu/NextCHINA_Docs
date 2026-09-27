import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { tableLayout, type MarkdownNode } from '../utils/markdown';

interface Props extends React.TableHTMLAttributes<HTMLTableElement> { node?: MarkdownNode; }

export function MarkdownTable({ node, children, ...props }: Props) {
  const layout = tableLayout(node);
  const scroller = React.useRef<HTMLDivElement>(null);
  const table = React.useRef<HTMLTableElement>(null);
  const [edges, setEdges] = React.useState({ overflow: false, left: false, right: false });
  const update = React.useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    const remaining = element.scrollWidth - element.clientWidth;
    const next = { overflow: remaining > 1, left: element.scrollLeft > 1, right: element.scrollLeft < remaining - 1 };
    setEdges(old => old.overflow === next.overflow && old.left === next.left && old.right === next.right ? old : next);
  }, []);

  React.useEffect(() => {
    update();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (scroller.current) observer?.observe(scroller.current);
    if (table.current) observer?.observe(table.current);
    window.addEventListener('resize', update);
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); };
  }, [children, update]);

  const move = (direction: number) => {
    const element = scroller.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.75,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const total = layout.widths.reduce((sum, width) => sum + width, 0);

  return (
    <div className={`md-table-region md-table-${layout.kind}`} data-columns={layout.columns} data-overflow={edges.overflow}
      style={{ '--md-table-min': `${layout.minimumRem}rem` } as React.CSSProperties}>
      <div ref={scroller} className="md-table-scroll" onScroll={update}
        tabIndex={edges.overflow ? 0 : undefined} role={edges.overflow ? 'region' : undefined}
        aria-label={`数据表格，共 ${layout.columns} 列${edges.overflow ? '，可左右滚动' : ''}`}>
        <table {...props} ref={table}>
          <colgroup>{layout.widths.map((width, index) => <col key={index} style={{ width: `${width / total * 100}%` }} />)}</colgroup>
          {children}
        </table>
      </div>
      {edges.overflow && <div className="md-table-tools">
        <span>左右滑动查看全部 {layout.columns} 列</span>
        <div>
          <button type="button" onClick={() => move(-1)} disabled={!edges.left} aria-label="表格向左滚动"><ChevronLeft className="md-control-icon" /></button>
          <button type="button" onClick={() => move(1)} disabled={!edges.right} aria-label="表格向右滚动"><ChevronRight className="md-control-icon" /></button>
        </div>
      </div>}
    </div>
  );
}
