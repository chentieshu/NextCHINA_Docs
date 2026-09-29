import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Network, Route, SlidersHorizontal, Plus, Minus, Maximize2, BookOpen, ArrowUpRight, LocateFixed } from 'lucide-react';
import { routeUrl, type AppRoute } from '../../routing';
import { graph } from '../garden/data';
import { coverageLabel, kindLabel, type KnowledgeNode } from '../garden/domain';
import { documentRoute, folderRoute, type ExplorerModel } from './model';
import { buildKnowledgeIndex, type IndexedRelation } from './knowledgeIndex';
import ObsidianCanvas, { type NetworkControls } from './ObsidianCanvas';
import GraphSettings from './GraphSettings';
import LearningNavigator, { KnowledgeConnection } from './LearningNavigator';
import { DEFAULT_NETWORK_SETTINGS, readNetworkSettings, writeNetworkSettings } from './networkPreferences.js';
import type { NetworkSettings, NetworkStats } from './networkEngine.js';
import '../../styles/atlas.css';
import '../../styles/obsidian.css';
import '../../styles/graphWorkspace.css';

const index = buildKnowledgeIndex(graph);
const groupIds = graph.groups.map(group => group.id);
const mapRoute = (id: string | null) => ({ ...folderRoute('root:ai', true), nodeId: id });
interface Props { model: ExplorerModel; isLight: boolean; selectedId?: string | null; onOpen: (route: AppRoute) => void; }

function RelationSection({ title, rows, onSelect }: { title: string; rows: IndexedRelation[]; onSelect: (id: string) => void }) {
  const [limit, setLimit] = useState(6);
  if (!rows.length) return null;
  return <section><h3>{title}<span className="og-section-count">{rows.length}</span></h3>{rows.slice(0,limit).map(relation => <KnowledgeConnection key={relation.edge.id} index={index} relation={relation} onSelect={onSelect} />)}{rows.length > limit && <button type="button" className="atlas-more" onClick={() => setLimit(value => value + 12)}>继续查看 · 还有 {rows.length - limit} 条</button>}</section>;
}
function NodeDetails({ node, model, onSelect, onRead, onOpen }: { node: KnowledgeNode; model: ExplorerModel; onSelect: (id: string) => void; onRead: (id: string) => void; onOpen: (route: AppRoute) => void }) {
  const [childLimit, setChildLimit] = useState(18), [resourceLimit, setResourceLimit] = useState(12);
  const children = index.children.get(node.id) ?? [], relations = index.adjacency.get(node.id) ?? [];
  const resources = index.resourcesFor(node.id).filter(ref => model.documents.has(ref.articleId));
  const own = resources.filter(ref => ref.scope === 'own');
  const explanations = own.filter(ref => ['explanation','independent-explanation'].includes(ref.coverage));
  const primary = explanations.length === 1 ? model.documents.get(explanations[0].articleId) : undefined;
  const paths = graph.learningPaths.filter(path => path.steps.includes(node.id));
  return <div className="og-node-content">
    <nav className="atlas-breadcrumb" aria-label="知识位置">{index.ancestors(node.id).filter(parent => parent.kind !== 'root').map(parent => <button type="button" key={parent.id} aria-current={parent.id === node.id ? 'location' : undefined} onClick={() => onSelect(parent.id)}>{parent.label}{parent.id !== node.id && ' /'}</button>)}</nav>
    <div className="og-note-badges"><span>{kindLabel[node.kind]}</span><span>{explanations.length ? '有独立讲解资料' : '知识提纲'}</span></div>
    <p className="og-node-summary">{node.summary || '这个知识点只有一份定义，可被多个专题和学习路线引用。'}</p>
    {primary && <button type="button" className="og-read-button" onClick={() => onRead(primary.id)}><BookOpen /><span>阅读 {primary.title}</span><ArrowUpRight /></button>}
    <p className="og-coverage-note">{own.length} 份直接资料。{explanations.length ? '资料可用，不代表内容已经核验完成。' : '尚无直接绑定的独立讲解；引用和下级资料不计为本节点已完成。'}</p>
    {!!children.length && <section><h3>继续深入<span className="og-section-count">{children.length}</span></h3>{children.slice(0,childLimit).map(child => <button type="button" className="atlas-row" key={child.id} onClick={() => onSelect(child.id)}><strong>{child.label}</strong><small>{kindLabel[child.kind]} · {index.ownResources(child.id).length ? '有直接资料' : '知识提纲'}</small></button>)}{children.length > childLimit && <button type="button" className="atlas-more" onClick={() => setChildLimit(value => value + 24)}>查看更多下级知识</button>}</section>}
    <RelationSection title="建议先了解" rows={relations.filter(row => row.role === 'before' && row.edge.target === node.id)} onSelect={onSelect} />
    <RelationSection title="接下来可以学" rows={relations.filter(row => row.role === 'before' && row.edge.source === node.id)} onSelect={onSelect} />
    <RelationSection title="放在一起理解" rows={relations.filter(row => row.role === 'related')} onSelect={onSelect} />
    <RelationSection title="这里引用的知识" rows={relations.filter(row => row.role === 'reference' && row.edge.source === node.id)} onSelect={onSelect} />
    <RelationSection title="哪些专题会用到它" rows={relations.filter(row => row.role === 'reference' && row.edge.target === node.id)} onSelect={onSelect} />
    {!relations.length && <p className="og-section-note">尚未整理概念联系。目录归属不代表知识之间的先修关系。</p>}
    <section><h3>阅读资料<span className="og-section-count">{resources.length}</span></h3>{resources.slice(0,resourceLimit).map(ref => <button type="button" className="atlas-row" data-resource-id={ref.articleId} key={ref.articleId} onClick={() => onRead(ref.articleId)}><strong>{model.documents.get(ref.articleId)!.title} ↗</strong><small>{ref.scope === 'own' ? '直接绑定' : ref.scope === 'reference' ? '通过专题引用' : '下级资料'} · {coverageLabel[ref.coverage] ?? ref.coverage}</small></button>)}{!resources.length && <p>讲解尚未补充，可以先探索上面的知识联系。</p>}{resources.length > resourceLimit && <button type="button" className="atlas-more" onClick={() => setResourceLimit(value => value + 18)}>查看更多阅读资料</button>}</section>
    {!!paths.length && <section><h3>所在学习路线</h3><p className="og-section-note">规划路线提供阅读顺序，不自动声明先修条件。</p>{paths.map(path => <div className="atlas-path" key={path.id}><p>{path.label}</p>{path.steps.map((id,position) => <button type="button" key={`${position}:${id}`} aria-current={id === node.id ? 'step' : undefined} onClick={() => onSelect(id)}>{position + 1}. {index.byId.get(id)?.label}</button>)}</div>)}</section>}
    {model.entries.has(node.id) && <button type="button" className="atlas-more" onClick={() => onOpen(folderRoute(node.id))}>查看对应文档目录 ↗</button>}
  </div>;
}

export default function WorkspaceGraph({ model, selectedId = null, onOpen }: Props) {
  const [query, setQuery] = useState(''), [searchLimit, setSearchLimit] = useState(20);
  const [panel, setPanel] = useState<'settings' | 'navigation' | null>(null);
  const [settings, setSettings] = useState<NetworkSettings>(() => readNetworkSettings(groupIds));
  const [stats, setStats] = useState<NetworkStats>({ nodes: 0, total: 0, edges: 0, zoom: 1 });
  const shell = useRef<HTMLDivElement>(null), search = useRef<HTMLInputElement>(null), inspector = useRef<HTMLElement>(null);
  const controls = useRef<NetworkControls>(null), pointerSelection = useRef<string | null>(null);
  const selected = selectedId ? index.byId.get(selectedId) : undefined;
  const activePanel = panel ?? (selected ? 'node' : null), inspecting = Boolean(activePanel);
  const results = useMemo(() => index.search(query), [query]);
  const filtered = settings.onlyResources || settings.groups !== null || settings.detail !== 'all' || Boolean(settings.focusNeighbors && selected);
  const reveal = (id: string) => {
    if (!index.byId.has(id)) return;
    pointerSelection.current = null; setQuery(''); setPanel(null); onOpen(mapRoute(id));
    controls.current?.focus(id);
  };
  const chooseInPlace = (id: string) => {
    pointerSelection.current = id; setQuery(''); setPanel(null); onOpen(mapRoute(id));
  };
  const clearSelection = () => { pointerSelection.current = null; setQuery(''); setPanel(null); onOpen({ kind: 'home' }); };
  const closePanel = () => { if (panel) setPanel(null); else clearSelection(); search.current?.focus({ preventScroll: true }); };
  const read = (id: string) => onOpen({ ...documentRoute(id), returnTo: routeUrl(mapRoute(selectedId)) });
  const clearFilters = () => setSettings(current => ({ ...current, onlyResources: false, groups: null, detail: 'all', focusNeighbors: false }));
  useEffect(() => writeNetworkSettings(settings, groupIds), [settings]);
  useEffect(() => { inspector.current?.scrollTo({ top: 0 }); }, [selectedId, activePanel]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !shell.current?.contains(event.target as Node)) return;
      if (query) { setQuery(''); search.current?.focus(); return; }
      if (inspecting) { event.preventDefault(); closePanel(); }
    };
    document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape);
  }, [query, panel, inspecting, selectedId]);
  return <div ref={shell} className="ws-graph-pane ws-macro-home og-shell" data-layer="global" data-density="network" data-inspector={inspecting} data-panel={activePanel ?? 'none'}>
    <div className="og-toolbar">
      <div className="og-view-name"><Network /><h1>AI 知识图谱</h1></div>
      <div className="og-search-wrap">
        <label className="og-search"><Search /><input ref={search} type="search" aria-label="搜索知识网络" placeholder="搜索知识点…" value={query} aria-controls={query.trim() ? 'knowledge-search-results' : undefined}
          onChange={event => { setQuery(event.target.value); setSearchLimit(20); }} onKeyDown={event => {
            if ((event.key === 'Enter' || event.key === 'ArrowDown') && results.length) { event.preventDefault(); if (event.key === 'Enter') reveal(results[0].id); else document.getElementById('knowledge-search-results')?.querySelector<HTMLElement>('[role="option"]')?.focus(); }
            if (event.key === 'Escape') { event.stopPropagation(); setQuery(''); }
          }} />{query && <button type="button" aria-label="清除知识搜索" onClick={() => { setQuery(''); search.current?.focus(); }}><X /></button>}</label>
        {query.trim() && <div className="og-search-results" id="knowledge-search-results" role="listbox" aria-label="知识网络搜索结果" onKeyDown={event => {
          const options = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')], current = options.indexOf(document.activeElement as HTMLElement);
          if (options.length && ['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); options[(current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus(); }
          if (event.key === 'Escape') { event.stopPropagation(); setQuery(''); search.current?.focus(); }
        }}>{results.slice(0,searchLimit).map(node => <button type="button" role="option" aria-selected={node.id === selectedId} key={node.id} onClick={() => reveal(node.id)}><span>{node.label}<small>{index.domainOf(node.id)?.label}</small></span><small>{kindLabel[node.kind]}</small></button>)}{!results.length && <p role="status">没有找到知识点，可到左侧全文搜索文档。</p>}{results.length > searchLimit && <button type="button" onClick={() => setSearchLimit(value => value + 30)}>显示更多结果</button>}</div>}
      </div>
      <button type="button" className="og-toolbar-action" aria-label="AI 学习导航" aria-expanded={panel === 'navigation'} onClick={() => { setQuery(''); setPanel(current => current === 'navigation' ? null : 'navigation'); }}><Route /><span>学习导航</span></button>
      <button type="button" className="og-toolbar-action" aria-label="图谱设置" aria-expanded={panel === 'settings'} onClick={() => { setQuery(''); setPanel(current => current === 'settings' ? null : 'settings'); }}><SlidersHorizontal /><span>图谱设置</span></button>
    </div>
    <div className="og-stage" data-panel-open={inspecting}>
      <div className="og-graph-layer">
        <ObsidianCanvas ref={controls} graph={graph} selectedId={selectedId} revealSelection={pointerSelection.current !== selectedId} settings={settings}
          onSelect={chooseInPlace} onClear={clearSelection} onStats={next => setStats(old => old.nodes === next.nodes && old.edges === next.edges && old.zoom === next.zoom && old.total === next.total ? old : next)} onReadFallback={() => onOpen(documentRoute('overview'))} />
        <div className="og-graph-meta"><span>{stats.nodes} / {stats.total} 节点</span><span>{stats.edges} 连线</span>{filtered && <button type="button" aria-label="清除图谱筛选" onClick={clearFilters}>筛选中 <X /></button>}</div>
        <div className="og-map-tools" role="group" aria-label="图谱视口控制">
          <button type="button" aria-label="放大图谱" onClick={() => controls.current?.zoomIn()}><Plus /></button><span>{Math.round(stats.zoom * 100)}%</span>
          <button type="button" aria-label="缩小图谱" onClick={() => controls.current?.zoomOut()}><Minus /></button>
          <button type="button" aria-label="显示全图" onClick={() => controls.current?.fit()}><Maximize2 /></button>
          {selected && <button type="button" aria-label="定位选中知识点" onClick={() => controls.current?.focus(selected.id)}><LocateFixed /></button>}
        </div>
        <p className="og-hint">拖动平移 · 双指缩放 · 点击知识点</p>
        {stats.total > 0 && stats.nodes === 0 && <div className="og-empty"><p>当前筛选没有知识点</p><button type="button" onClick={clearFilters}>清除筛选</button></div>}
      </div>
      {inspecting && <aside ref={inspector} className="og-inspector atlas-inspector" data-open="true" role="complementary" aria-label={activePanel === 'settings' ? '图谱显示设置' : activePanel === 'navigation' ? 'AI 学习导航' : '知识节点简报'}>
        <header className="og-panel-header"><div><p>{activePanel === 'node' ? '知识笔记' : '探索工具'}</p><h2>{activePanel === 'settings' ? '图谱设置' : activePanel === 'navigation' ? 'AI 学习导航' : selected?.label}</h2></div><button type="button" aria-label={activePanel === 'settings' ? '关闭图谱设置' : activePanel === 'navigation' ? '关闭学习导航' : '关闭知识节点简报'} onClick={closePanel}><X /></button></header>
        {activePanel === 'settings' ? <GraphSettings index={index} settings={settings} stats={stats} selectedId={selectedId} onChange={setSettings} onFit={() => controls.current?.fit()} /> : activePanel === 'navigation' ? <LearningNavigator index={index} onSelect={reveal} /> : selected && <NodeDetails key={selected.id} node={selected} model={model} onSelect={reveal} onRead={read} onOpen={onOpen} />}
      </aside>}
    </div>
  </div>;
}
