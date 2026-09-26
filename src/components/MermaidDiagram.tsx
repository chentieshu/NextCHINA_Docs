import React from 'react';

interface MermaidDiagramProps {
  chart: string;
  isLight: boolean;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, isLight }) => {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const id = React.useId().replace(/:/g, '');

  React.useEffect(() => {
    let cancelled = false;
    const render = async () => {
      try {
        const { default: mermaid } = await import('mermaid');
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: isLight ? 'neutral' : 'dark',
          fontFamily: 'var(--font-sans)'
        });
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled && hostRef.current) {
          hostRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Mermaid diagram render failed');
      }
    };
    void render();
    return () => { cancelled = true; };
  }, [chart, id, isLight]);

  if (error) {
    return <div className="md-mermaid-error" role="alert"><strong>Mermaid 渲染失败</strong><pre>{chart}</pre></div>;
  }

  return <div ref={hostRef} className="md-mermaid" role="img" aria-label="Mermaid diagram" />;
};
