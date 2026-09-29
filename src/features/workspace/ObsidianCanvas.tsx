import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { GardenGraph } from '../garden/domain';
import { mountKnowledgeNetwork, type NetworkAPI, type NetworkSettings, type NetworkStats } from './networkEngine.js';
export type NetworkControls = Pick<NetworkAPI, 'fit' | 'zoomIn' | 'zoomOut' | 'focus'>;
interface Props {
  graph: GardenGraph; selectedId: string | null; inspectorOpen: boolean; modal: boolean;
  settings: NetworkSettings; onSelect: (id: string) => void; onClear: () => void;
  onStats: (stats: NetworkStats) => void; onReadFallback: () => void;
}
/** React only owns controls and selection. The renderer owns SVG, pointers and camera. */
export default forwardRef<NetworkControls, Props>(function ObsidianCanvas(props, ref) {
  const host = useRef<HTMLDivElement>(null), api = useRef<NetworkAPI | null>(null);
  const latest = useRef(props); latest.current = props;
  const [error, setError] = useState(''), [loading, setLoading] = useState(true);
  useImperativeHandle(ref, () => ({ fit: () => api.current?.fit(), zoomIn: () => api.current?.zoomIn(),
    zoomOut: () => api.current?.zoomOut(), focus: id => api.current?.focus(id) }), []);
  useEffect(() => {
    if (!host.current) return;
    try {
      api.current = mountKnowledgeNetwork(host.current, props.graph, {
        onSelect: id => latest.current.onSelect(id), onClear: () => latest.current.onClear(),
        onStats: stats => latest.current.onStats(stats), onReady: () => setLoading(false),
        onError: reason => { setError(reason.message); setLoading(false); }
      });
      api.current.configure(latest.current.settings);
      api.current.setPanelWidth(latest.current.inspectorOpen && !latest.current.modal ? 310 : 0);
      api.current.select(latest.current.selectedId, { focus: Boolean(latest.current.selectedId) });
    } catch (reason) { setError(reason instanceof Error ? reason.message : '图谱不可用'); setLoading(false); }
    return () => { api.current?.destroy(); api.current = null; };
  }, [props.graph]);
  useEffect(() => { api.current?.setPanelWidth(props.inspectorOpen && !props.modal ? 310 : 0); }, [props.inspectorOpen, props.modal]);
  useEffect(() => { api.current?.select(props.selectedId, { focus: Boolean(props.selectedId) }); }, [props.selectedId]);
  useEffect(() => { api.current?.configure(props.settings); }, [props.settings]);
  return <div className="og-network">
    <div ref={host} className="garden-canvas og-network-host" aria-label="全局知识点线图" />
    {loading && <p className="og-loading" role="status">正在整理知识网络…</p>}
    {error && <div className="og-error" role="alert"><p>{error}</p><button type="button" onClick={props.onReadFallback}>用列表继续阅读</button></div>}
  </div>;
});
