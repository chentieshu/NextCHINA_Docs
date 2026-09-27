import React from 'react';

interface MermaidDiagramProps { chart: string; isLight: boolean; }

// Mermaid configuration is global. Serialize configuration + render so multiple
// diagrams, StrictMode and theme changes cannot race one another.
let renderQueue: Promise<void> = Promise.resolve();
let renderNumber = 0;

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, isLight }) => {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [status, setStatus] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const id = React.useId().replace(/[^a-zA-Z0-9-]/g, '');

  React.useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    hostRef.current?.replaceChildren();
    const render = async () => {
      if (cancelled) return;
      let staging: HTMLDivElement | undefined;
      try {
        const { default: mermaid } = await import('mermaid');
        if (cancelled) return;
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict',
          theme: isLight ? 'neutral' : 'dark',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          flowchart: { htmlLabels: false, useMaxWidth: false } });
        staging = document.createElement('div');
        staging.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;';
        staging.style.width = `${Math.max(hostRef.current?.parentElement?.clientWidth ?? 0, 320)}px`;
        document.body.append(staging);
        const { svg } = await mermaid.render(`md-diagram-${id}-${++renderNumber}`, chart, staging);
        if (cancelled || !hostRef.current) return;
        // Only Mermaid's strict-mode sanitized SVG is inserted, never raw Markdown HTML.
        hostRef.current.innerHTML = svg;
        const drawing = hostRef.current.querySelector('svg');
        if (drawing) {
          const width = drawing.viewBox.baseVal.width;
          if (Number.isFinite(width) && width > 0) drawing.style.width = `${width}px`;
          drawing.style.maxWidth = 'none';
          drawing.style.height = 'auto';
        }
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      } finally {
        staging?.remove();
      }
    };
    renderQueue = renderQueue.then(render, render);
    return () => { cancelled = true; };
  }, [chart, id, isLight]);

  return (
    <figure className="md-diagram" data-status={status}>
      <figcaption>Mermaid 图示 <span>宽图可左右滚动</span></figcaption>
      {status === 'loading' && <p className="md-diagram-status" role="status">正在绘制图表…</p>}
      {status === 'error' && <p className="md-mermaid-error" role="status">图表暂时无法绘制，请查看下方源码。正文仍可正常阅读。</p>}
      <div ref={hostRef} className="md-mermaid" tabIndex={status === 'ready' ? 0 : undefined}
        role="region" aria-label="Mermaid 图表，可左右滚动" hidden={status !== 'ready'} />
      <details className="md-diagram-source" open={status === 'error'}>
        <summary>图表源码</summary><pre tabIndex={0}><code>{chart}</code></pre>
      </details>
    </figure>
  );
};
