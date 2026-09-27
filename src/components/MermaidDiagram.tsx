import React from 'react';
import { ChevronDown, Code2, Maximize2, RotateCcw, Minus, Plus } from 'lucide-react';

interface MermaidDiagramProps { chart: string; isLight: boolean; }
let queue: Promise<void> = Promise.resolve();
let serial = 0;

/** Mermaid has global configuration; initialize + parse + render are one queued job. */
export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, isLight }) => {
  const figureRef = React.useRef<HTMLElement>(null);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, '');
  const [active, setActive] = React.useState(false);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = React.useState('');
  const [attempt, setAttempt] = React.useState(0);
  const [showSource, setShowSource] = React.useState(false);
  const [fit, setFit] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [naturalWidth, setNaturalWidth] = React.useState(0);

  React.useEffect(() => {
    const element = figureRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') { setActive(true); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setActive(true); observer.disconnect(); }
    }, { rootMargin: '500px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setStatus('loading');
    setError('');
    const render = async () => {
      if (cancelled) return;
      let staging: HTMLDivElement | undefined;
      try {
        const { default: mermaid } = await import('mermaid');
        if (cancelled) return;
        mermaid.initialize({
          startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true,
          theme: isLight ? 'neutral' : 'dark',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif',
          flowchart: { htmlLabels: false, useMaxWidth: false },
          sequence: { useMaxWidth: false }, gantt: { useMaxWidth: false },
          themeCSS: '* { box-shadow: none !important; text-shadow: none !important; filter: none !important; }',
        });
        await mermaid.parse(chart);
        if (cancelled) return;
        // An attached, measurable canvas is needed for text/SVG layout. Its viewport-sized
        // clipping parent prevents even a temporary oversized drawing from widening the page.
        staging = document.createElement('div');
        staging.setAttribute('aria-hidden', 'true');
        staging.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none;overflow:hidden;contain:strict;';
        const canvas = document.createElement('div');
        canvas.style.width = `${Math.max(720, figureRef.current?.clientWidth ?? 720)}px`;
        staging.append(canvas);
        document.body.append(staging);
        const { svg } = await mermaid.render(`md-diagram-${id}-${++serial}`, chart, canvas);
        if (cancelled || !hostRef.current) return;
        // Only strict-mode Mermaid output is inserted, never raw Markdown HTML.
        hostRef.current.innerHTML = svg;
        const drawing = hostRef.current.querySelector('svg');
        if (!drawing) throw new Error('没有生成 SVG');
        const width = drawing.viewBox.baseVal.width || Number.parseFloat(drawing.getAttribute('width') ?? '');
        if (!Number.isFinite(width) || width <= 0) throw new Error('SVG 尺寸无效');
        drawing.style.height = 'auto';
        drawing.removeAttribute('height');
        setNaturalWidth(width);
        setStatus('ready');
      } catch (reason) {
        if (!cancelled) {
          hostRef.current?.replaceChildren();
          setError(reason instanceof Error ? reason.message.slice(0, 600) : '未知绘图错误');
          setStatus('error');
          setShowSource(true);
        }
      } finally { staging?.remove(); }
    };
    queue = queue.then(render, render);
    return () => { cancelled = true; };
  }, [active, chart, id, isLight, attempt]);

  React.useEffect(() => {
    const drawing = hostRef.current?.querySelector('svg');
    if (!drawing || !naturalWidth) return;
    drawing.style.width = fit ? '100%' : `${naturalWidth * zoom}px`;
    drawing.style.maxWidth = fit ? `${naturalWidth}px` : 'none';
  }, [fit, zoom, naturalWidth, status]);

  return (
    <figure ref={figureRef} className="md-diagram" data-status={status} aria-busy={status === 'loading'}>
      <figcaption><span>图示</span><div className="md-diagram-actions">
        <button type="button" aria-label="缩小图表" disabled={status !== 'ready' || (!fit && zoom <= .5)} onClick={() => { setFit(false); setZoom(value => Math.max(.5, value - .25)); }}><Minus className="md-control-icon" /></button>
        <button type="button" aria-label="放大图表" disabled={status !== 'ready' || (!fit && zoom >= 2)} onClick={() => { setFit(false); setZoom(value => Math.min(2, value + .25)); }}><Plus className="md-control-icon" /></button>
        <button type="button" aria-pressed={fit} disabled={status !== 'ready'} onClick={() => setFit(value => !value)}><Maximize2 className="md-control-icon" />{fit ? '原始尺寸' : '适应宽度'}</button>
      </div></figcaption>
      {status === 'loading' && <p className="md-diagram-status" role="status">{active ? '正在绘制图表…' : '图表将在进入阅读区时加载'}</p>}
      {status === 'error' && <div className="md-mermaid-error" role="status"><p>图表未能绘制，其他正文不受影响。</p><button type="button" onClick={() => setAttempt(value => value + 1)}><RotateCcw className="md-control-icon" />重试绘图</button><p className="md-diagram-error-detail">{error}</p></div>}
      <div ref={hostRef} className="md-mermaid" tabIndex={status === 'ready' ? 0 : undefined} role="region" aria-label="图表，超宽时可左右滚动" hidden={status !== 'ready'} />
      <div className="md-diagram-source">
        <button type="button" className="md-source-toggle" aria-expanded={showSource} aria-controls={`diagram-source-${id}`} onClick={() => setShowSource(value => !value)}><Code2 className="md-control-icon" />{showSource ? '收起源码' : '查看源码'}<ChevronDown className="md-control-icon" data-expanded={showSource} /></button>
        <div id={`diagram-source-${id}`} hidden={!showSource}><pre tabIndex={0}><code>{chart}</code></pre></div>
      </div>
    </figure>
  );
};
