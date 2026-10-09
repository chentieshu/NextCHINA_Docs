import React from 'react';
import { ChevronDown, Code2, Maximize2, RotateCcw, Minus, Plus } from 'lucide-react';
import { MarkdownTheme } from '../lib/MarkdownTheme';
import { staticDiagram, type DiagramDrawing } from '../lib/markdownAssets';
import { diagramTheme, diagramLabel } from '../lib/diagramTheme.js';

interface MermaidDiagramProps { chart: string; isLight?: boolean; }
let queue: Promise<void> = Promise.resolve();
let serial = 0;
const cache = new Map<string, DiagramDrawing>();

/** Repeated diagrams must not share SVG fragment or accessible-label IDs. */
function namespaceSVG(svg: string, prefix: string) {
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  for (const old of ids.sort((a, b) => b.length - a.length)) {
    const safe = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    svg = svg.replaceAll(`id="${old}"`, `id="${prefix}-${old}"`)
      .replace(new RegExp(`#${safe}(?=[\\s)"'.,:{\\]]|$)`, 'g'), `#${prefix}-${old}`);
  }
  return svg.replace(/(aria-(?:labelledby|describedby)=")([^"]*)"/g, (_, start, value) =>
      `${start}${value.split(/\s+/).map((id: string) => ids.includes(id) ? `${prefix}-${id}` : id).join(' ')}"`);
}

/** Published diagrams are synchronous, build-rendered Mermaid SVG. Dynamic
 * content keeps a strict, bounded, cached Mermaid fallback without blocking text. */
export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, isLight }) => {
  const theme = React.useContext(MarkdownTheme), light = isLight ?? theme;
  const figureRef = React.useRef<HTMLElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, '');
  const source = chart.trim(), key = `${light}\0${source}`;
  const compiled = staticDiagram(source, light);
  const [result, setResult] = React.useState<{ key: string; drawing?: DiagramDrawing; error?: string }>();
  const drawing = compiled ?? cache.get(key) ?? (result?.key === key ? result.drawing : undefined);
  const error = result?.key === key ? result.error : undefined;
  const status = drawing ? 'ready' : error ? 'error' : 'loading';
  const [attempt, setAttempt] = React.useState(0);
  const [showSource, setShowSource] = React.useState(false);
  const [fit, setFit] = React.useState(true);
  const [zoom, setZoom] = React.useState(1);
  const svg = React.useMemo(() => drawing ? namespaceSVG(drawing.svg, `md-${id}`) : '', [drawing, id]);

  React.useEffect(() => {
    if (compiled || cache.has(key)) return;
    let cancelled = false;
    const render = async () => {
      if (cancelled) return;
      if (cache.has(key)) { setResult({ key, drawing: cache.get(key) }); return; }
      let staging: HTMLDivElement | undefined;
      try {
        const { default: mermaid } = await import('mermaid');
        if (cancelled) return;
        mermaid.initialize(diagramTheme(light));
        await mermaid.parse(source);
        staging = document.createElement('div');
        staging.setAttribute('aria-hidden', 'true');
        staging.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none;overflow:hidden;contain:strict;';
        const canvas = document.createElement('div'); canvas.style.width = '1200px';
        staging.append(canvas); document.body.append(staging);
        const renderId = `dynamic-${id}-${++serial}`;
        const { svg: output } = await mermaid.render(renderId, source, canvas);
        canvas.innerHTML = output;
        const element = canvas.querySelector('svg');
        if (!element) throw new Error('没有生成 SVG');
        const { width, height } = element.viewBox.baseVal;
        if (!(width > 0 && height > 0)) throw new Error('SVG 尺寸无效');
        element.removeAttribute('height'); element.removeAttribute('style');
        const next = { svg: element.outerHTML, width, height, id: renderId };
        if (cache.size >= 64) cache.delete(cache.keys().next().value!);
        cache.set(key, next);
        if (!cancelled) setResult({ key, drawing: next });
      } catch (reason) {
        if (!cancelled) {
          setResult({ key, error: reason instanceof Error ? reason.message.slice(0, 600) : '未知绘图错误' });
          setShowSource(true);
        }
      } finally { staging?.remove(); }
    };
    queue = queue.then(render, render);
    return () => { cancelled = true; };
  }, [key, compiled, source, light, id, attempt]);

  return (
    <figure ref={figureRef} className="md-diagram" data-status={status} data-renderer={compiled ? 'static-mermaid' : 'runtime-mermaid'}
      data-fit={fit} aria-busy={status === 'loading'} style={{ '--diagram-width': `${(drawing?.width ?? 720) * zoom}px`, '--diagram-natural-width': `${drawing?.width ?? 720}px` } as React.CSSProperties}>
      <figcaption><span>{diagramLabel(source)}<small>Mermaid</small></span><div className="md-diagram-actions">
        <button type="button" aria-label="缩小图表" disabled={status !== 'ready' || (!fit && zoom <= .5)} onClick={() => { setFit(false); setZoom(value => Math.max(.5, value - .25)); }}><Minus className="md-control-icon" /></button>
        <button type="button" aria-label="放大图表" disabled={status !== 'ready' || (!fit && zoom >= 2)} onClick={() => { setFit(false); setZoom(value => Math.min(2, value + .25)); }}><Plus className="md-control-icon" /></button>
        <button type="button" aria-pressed={fit} disabled={status !== 'ready'} onClick={() => { setFit(value => !value); setZoom(1); }}><Maximize2 className="md-control-icon" />{fit ? '原始尺寸' : '适应宽度'}</button>
      </div></figcaption>
      {status === 'loading' && <p className="md-diagram-status" role="status">正在准备图表…</p>}
      {status === 'error' && <div className="md-mermaid-error" role="status"><p>图表未能绘制，其他正文不受影响。</p><button type="button" onClick={() => { setResult(undefined); setAttempt(value => value + 1); }}><RotateCcw className="md-control-icon" />重试绘图</button><p className="md-diagram-error-detail">{error}</p></div>}
      <div className="md-mermaid" tabIndex={status === 'ready' ? 0 : undefined} role="region" aria-label="图表，超宽时可左右滚动" hidden={status !== 'ready'} dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="md-diagram-source">
        <button type="button" className="md-source-toggle" aria-expanded={showSource} aria-controls={`diagram-source-${id}`} onClick={() => setShowSource(value => !value)}><Code2 className="md-control-icon" />{showSource ? '收起源码' : '查看源码'}<ChevronDown className="md-control-icon" data-expanded={showSource} /></button>
        <div id={`diagram-source-${id}`} hidden={!showSource}><pre tabIndex={0}><code>{chart}</code></pre></div>
      </div>
    </figure>
  );
};
