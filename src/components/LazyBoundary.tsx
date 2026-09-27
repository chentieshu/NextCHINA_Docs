import React from 'react';
interface Props { children: React.ReactNode; fallbackAction: () => void; label: string; }
/** A stale CDN chunk or blocked Worker must never replace the whole app with a black screen. */
export class LazyBoundary extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <section className="garden-state" role="alert"><h2>{this.props.label}暂时无法加载</h2><p>已保留现有文章与列表入口。网络恢复后可刷新重试。</p><button type="button" onClick={this.props.fallbackAction}>使用替代阅读入口</button><button type="button" onClick={() => window.location.reload()}>重新加载</button></section>;
    return this.props.children;
  }
}
