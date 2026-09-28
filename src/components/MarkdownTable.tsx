import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MarkdownNode } from '../utils/markdown';
import { measureTable, type TableLayout } from '../utils/table-layout';

interface Props extends React.TableHTMLAttributes<HTMLTableElement> {
  node?: MarkdownNode;
  columnLayout?: TableLayout;
  scrollLabel?: string;
}
type CellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  children?: React.ReactNode; node?: MarkdownNode; 'data-column-kind'?: string;
  'data-column-content'?: string; 'data-short-header'?: boolean;
};
/** Decorate native and react-markdown cells alike. A custom th renderer is a
 * function, so use its HAST tag instead of assuming child.type === 'th'. */
function decorate(children: React.ReactNode, layout: TableLayout): React.ReactNode {
  return React.Children.map(children, child => {
    if (!React.isValidElement<CellProps>(child)) return child;
    const tag = child.props.node?.tagName ?? child.type;
    if (tag === 'tr') {
      let column = 0;
      return React.cloneElement(child, {}, React.Children.map(child.props.children, cell => {
        if (!React.isValidElement<CellProps>(cell)) return cell;
        const tag = cell.props.node?.tagName ?? cell.type;
        if (tag !== 'th' && tag !== 'td') return cell;
        const span = cell.props.colSpan ?? 1;
        const track = span === 1 ? layout.tracks[column] : undefined;
        column += span;
        return React.cloneElement(cell, {
          'data-column-kind': track?.kind ?? 'text',
          'data-column-content': track?.content ?? 'prose',
          'data-short-header': tag === 'th' && cell.props.scope !== 'row' && track?.shortHeader,
        });
      }));
    }
    if (tag === 'thead' || tag === 'tbody' || tag === 'tfoot' || child.type === React.Fragment) {
      return React.cloneElement(child, {}, decorate(child.props.children, layout));
    }
    return child;
  });
}
/** One table, one scrollport. No JS-assigned widths or fixed-layout colgroups. */
export function MarkdownTable({ node, columnLayout, scrollLabel, children, style, ...props }: Props) {
  const layout = React.useMemo(() => columnLayout ?? measureTable(node), [node, columnLayout]);
  const content = React.useMemo(() => decorate(children, layout), [children, layout]);
  const scroller = React.useRef<HTMLDivElement>(null);
  const table = React.useRef<HTMLTableElement>(null);
  const id = React.useId();
  const [edges, setEdges] = React.useState({ measured: false, overflow: false, left: false, right: false });
  const update = React.useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    const max = Math.max(0, element.scrollWidth - element.clientWidth);
    const rtl = getComputedStyle(element).direction === 'rtl';
    const offset = Math.min(max, Math.max(0, rtl ? -element.scrollLeft : element.scrollLeft));
    const next = { measured: true, overflow: max > 1,
      left: rtl ? offset < max - 1 : offset > 1,
      right: rtl ? offset > 1 : offset < max - 1 };
    setEdges(old => Object.keys(next).every(key => old[key as keyof typeof old] === next[key as keyof typeof next]) ? old : next);
  }, []);
  React.useEffect(() => {
    let frame = 0, disposed = false;
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    schedule();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (scroller.current) observer?.observe(scroller.current);
    if (table.current) observer?.observe(table.current);
    document.fonts?.ready.then(() => { if (!disposed) schedule(); });
    document.fonts?.addEventListener('loadingdone', schedule);
    window.addEventListener('resize', schedule);
    return () => { disposed = true; cancelAnimationFrame(frame); observer?.disconnect();
      document.fonts?.removeEventListener('loadingdone', schedule); window.removeEventListener('resize', schedule); };
  }, [content, update]);
  const move = (direction: number) => {
    const element = scroller.current;
    element?.scrollBy({ left: direction * element.clientWidth * .75,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  return <div className={`md-table-region md-table-${layout.kind}`} data-columns={layout.columns}
    data-overflow={edges.overflow} data-measured={edges.measured}>
    <div id={id} ref={scroller} className="md-table-scroll" onScroll={update} onLoadCapture={update}
      tabIndex={edges.overflow ? 0 : undefined} role={edges.overflow || scrollLabel ? 'region' : undefined}
      aria-label={scrollLabel ?? `数据表格，共 ${layout.columns} 列${edges.overflow ? '，可左右滚动' : ''}`}
      aria-describedby={edges.overflow ? `${id}-hint` : undefined}>
      <table {...props} ref={table} style={style}>{content}</table>
    </div>
    {edges.overflow && <div className="md-table-tools"><span id={`${id}-hint`}>左右滑动查看全部 {layout.columns} 列</span><div>
      <button type="button" onClick={() => move(-1)} disabled={!edges.left} aria-controls={id} aria-label="表格向左滚动"><ChevronLeft className="md-control-icon" /></button>
      <button type="button" onClick={() => move(1)} disabled={!edges.right} aria-controls={id} aria-label="表格向右滚动"><ChevronRight className="md-control-icon" /></button>
    </div></div>}
  </div>;
}
