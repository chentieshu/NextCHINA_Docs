import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Network, List, SlidersHorizontal, Plus, Minus, Maximize2, BookOpen, ArrowUpRight } from 'lucide-react';
import { routeUrl, type AppRoute } from '../../routing';
import { graph } from '../garden/data';
import { coverageLabel, kindLabel, type KnowledgeNode } from '../garden/domain';
import { useMedia } from '../garden/useMedia';
import { documentRoute, folderRoute, type ExplorerModel } from './model';
import { useOverlayFocus } from './useWorkspace';
import { buildKnowledgeIndex, type IndexedRelation } from './knowledgeIndex';
import ObsidianCanvas, { type NetworkControls } from './ObsidianCanvas';
import type { NetworkSettings, NetworkStats } from './networkEngine.js';
import '../../styles/atlas.css';
import '../../styles/obsidian.css';
const index = buildKnowledgeIndex(graph);
interface Props { model: ExplorerModel; isLight: boolean; selectedId?: string | null; onOpen: (route: AppRoute) => void; }
const relationName = (relation: IndexedRelation) => relation.role === 'reference' ? '专题引用' : relation.role === 'before' ? '建议先学' : '知识关联';
const mapRoute = (id: string | null) => ({ ...folderRoute('root:ai', true), nodeId: id });

function RelationRow({ relation, onSelect }: { relation: IndexedRelation; onSelect: (id: string) => void }) {
  const { edge, role } = relation;
  return <div className="atlas-relation" data-relation-id={edge.id}>
    <small>{relationName(relation)} · {edge.assertionStatus === 'editorial' ? '编辑说明' : edge.assertionStatus}</small>
    <div><button type="button" onClick={() => onSelect(edge.source)}>{index.byId.get(edge.source)?.label}</button><span aria-hidden="true">{role === 'related' ? '↔' : '→'}</span><button type="button" onClick={() => onSelect(edge.target)}>{index.byId.get(edge.target)?.label}</button></div>
    <p>{edge.reason || '原数据未提供关系说明。'}</p>
  </div>;
}
function RelationSection({ title, rows, onSelect }: { title: string; rows: IndexedRelation[]; onSelect: (id: string) => void }) {
  const [limit, setLimit] = useState(6);
  if (!rows.length) return null;
  return <section><h3>{title} · {rows.length}</h3>{rows.slice(0, limit).map(relation => <RelationRow key={relation.edge.id} relation={relation} onSelect={onSelect} />)}{rows.length > limit && <button type="button" className="atlas-more" onClick={() => setLimit(value => value + 12)}>显示其余 {rows.length - limit} 条关系</button>}</section>;
}
function NodeDetails({ node, model, onSelect, onRead, onOpen }: { node: KnowledgeNode; model: ExplorerModel; onSelect: (id: string) => void; onRead: (id: string) => void; onOpen: (route: AppRoute) => void }) {
  const [childLimit, setChildLimit] = useState(18), [resourceLimit, setResourceLimit] = useState(12);
  const children = index.children.get(node.id) ?? [];
  const relations = index.adjacency.get(node.id) ?? [];
  const resources = index.resourcesFor(node.id).filter(ref => model.documents.has(ref.articleId));
  const own = resources.filter(ref => ref.scope === 'own');
  const explanations = own.filter(ref => ['explanation', 'independent-explanation'].includes(ref.coverage));
  const paths = graph.learningPaths.filter(path => path.steps.includes(node.id));
  const primaryArticle = explanations.length === 1 ? model.documents.get(explanations[0].articleId) : undefined;
  return <>
    <nav className="atlas-breadcrumb" aria-label="知识位置">{index.ancestors(node.id).filter(parent => parent.kind !== 'root').map(parent => <button type="button" key={parent.id} aria-current={parent.id === node.id ? 'location' : undefined} onClick={() => onSelect(parent.id)}>{parent.label}{parent.id !== node.id && ' /'}</button>)}</nav>
    <p>{node.summary || '这个知识点只有一份定义，可被不同专题、文章和学习路径引用。'}</p>
    <p className="atlas-status">{explanations.length ? `${explanations.length} 份独立讲解资料` : '尚无直接绑定的独立讲解'} · {own.length} 份直接资料。引用资料和下级资料不计为本节点已经完成。</p>
    {primaryArticle && <button type="button" className="og-read-button" onClick={() => onRead(primaryArticle.id)}><BookOpen />阅读 {primaryArticle.title}<ArrowUpRight /></button>}
    {model.entries.has(node.id) && <button type="button" className="atlas-more" onClick={() => onOpen(folderRoute(node.id))}>打开对应文档目录 ↗</button>}
    {!!children.length && <section><h3>下级知识 · {children.length}</h3>{children.slice(0, childLimit).map(child => <button type="button" className="atlas-row" key={child.id} onClick={() => onSelect(child.id)}><strong>{child.label}</strong><small>{kindLabel[child.kind]} · {index.ownResources(child.id).length ? '有直接资料' : '知识提纲'}</small></button>)}{children.length > childLimit && <button type="button" className="atlas-more" onClick={() => setChildLimit(value => value + 24)}>显示其余 {children.length - childLimit} 个下级</button>}</section>}
    <RelationSection title="建议先了解" rows={relations.filter(row => row.role === 'before' && row.edge.target === node.id)} onSelect={onSelect} />
    <RelationSection title="之后可以了解" rows={relations.filter(row => row.role === 'before' && row.edge.source === node.id)} onSelect={onSelect} />
    <RelationSection title="相关知识" rows={relations.filter(row => row.role === 'related')} onSelect={onSelect} />
    <RelationSection title="引用了哪些知识" rows={relations.filter(row => row.role === 'reference' && row.edge.source === node.id)} onSelect={onSelect} />
    <RelationSection title="被哪些专题复用" rows={relations.filter(row => row.role === 'reference' && row.edge.target === node.id)} onSelect={onSelect} />
    {!relations.length && <p>尚未记录直接知识关联；目录归属不冒充知识关系。</p>}
    <section><h3>阅读资料 · {resources.length}</h3>{resources.slice(0, resourceLimit).map(ref => <button type="button" className="atlas-row" data-resource-id={ref.articleId} key={ref.articleId} onClick={() => onRead(ref.articleId)}><strong>{model.documents.get(ref.articleId)!.title} ↗</strong><small>{ref.scope === 'own' ? '直接绑定' : ref.scope === 'reference' ? '通过专题引用' : '下级资料'} · {coverageLabel[ref.coverage] ?? ref.coverage} · {index.byId.get(ref.fromId)?.label}</small></button>)}{!resources.length && <p>这里仍是知识提纲，没有用总览文章代替独立内容。</p>}{resources.length > resourceLimit && <button type="button" className="atlas-more" onClick={() => setResourceLimit(value => value + 18)}>显示其余 {resources.length - resourceLimit} 份资料</button>}</section>
    {!!paths.length && <section><h3>所在学习路径 · {paths.length}</h3><p>这是建议阅读顺序，不自动声明知识之间的先修关系。</p>{paths.map(path => <div className="atlas-path" key={path.id}><p>{path.label} · 规划路径</p>{path.steps.map((id, position) => <button type="button" key={id} aria-current={id === node.id ? 'step' : undefined} onClick={() => onSelect(id)}>{position + 1}. {index.byId.get(id)?.label}</button>)}</div>)}</section>}
  </>;
}

export default function WorkspaceGraph({ model, selectedId = null, onOpen }: Props) {
  const [query, setQuery] = useState(''), [searchLimit, setSearchLimit] = useState(20);
  const [indexOpen, setIndexOpen] = useState(false), [settingsOpen, setSettingsOpen] = useState(false);
  const [relationQuery, setRelationQuery] = useState(''), [relationLimit, setRelationLimit] = useState(30);
  const defaults: NetworkSettings = { structure: true, relations: true, colored: false, labels: 1, onlyResources: false, groups: null };
  const [settings, setSettings] = useState<NetworkSettings>(defaults);
  const [stats, setStats] = useState<NetworkStats>({ nodes: 0, total: 0, edges: 0, zoom: 1 });
  const search = useRef<HTMLInputElement>(null), inspector = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null), controls = useRef<NetworkControls>(null), gear = useRef<HTMLButtonElement>(null);
  const selected = selectedId ? index.byId.get(selectedId) : undefined;
  const mobile = useMedia('(max-width: 959px)');
  const inspecting = Boolean(selected) || indexOpen, modal = mobile && inspecting;
  const results = useMemo(() => index.search(query), [query]);
  const rows = useMemo(() => {
    const terms = relationQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return index.relations.filter(({ edge }) => terms.every(term => `${index.byId.get(edge.source)?.label} ${index.byId.get(edge.target)?.label} ${edge.reason ?? ''}`.toLocaleLowerCase().includes(term)));
  }, [relationQuery]);
  const focus = (id: string) => {
    if (!index.byId.has(id)) return;
    setQuery(''); setIndexOpen(false); setSettingsOpen(false);
    setSettings(current => ({ ...current, onlyResources: false, groups: null }));
    onOpen(mapRoute(id));
  };
  const overview = () => { setQuery(''); setIndexOpen(false); setSettingsOpen(false); onOpen({ kind: 'home' }); };
  const read = (id: string) => onOpen({ ...documentRoute(id), returnTo: routeUrl(mapRoute(selectedId)) });
  useOverlayFocus(modal, inspector, overview);
  useEffect(() => {
    if (!modal) return;
    const workspace = body.current?.closest('.workspace');
    const elements = [...(workspace?.querySelectorAll<HTMLElement>('.ws-ribbon,.ws-sidebar,.ws-status') ?? [])];
    const states = elements.map(element => element.inert); elements.forEach(element => { element.inert = true; });
    return () => elements.forEach((element, position) => { element.inert = states[position]; });
  }, [modal]);
  useEffect(() => { if (inspecting) { inspector.current?.scrollTo({ top: 0 }); heading.current?.focus({ preventScroll: true }); } }, [selectedId, indexOpen, inspecting]);
  useEffect(() => {
    if (!settingsOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSettingsOpen(false); gear.current?.focus(); } };
    document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close);
  }, [settingsOpen]);
  return <div className="ws-graph-pane ws-macro-home og-shell" data-layer="global" data-density="network" data-inspector={inspecting}>
    <div className="og-toolbar" inert={modal}>
      <div className="og-view-name"><Network /><h1>全局关系图</h1></div>
      <div className="og-search-wrap">
        <label className="og-search"><Search /><input ref={search} type="search" aria-label="搜索知识网络" placeholder="跳转到知识点…" value={query}
          aria-controls={query.trim() ? 'knowledge-search-results' : undefined}
          onChange={event => { setQuery(event.target.value); setSearchLimit(20); }}
          onKeyDown={event => {
            if ((event.key === 'Enter' || event.key === 'ArrowDown') && results.length) {
              event.preventDefault(); if (event.key === 'Enter') focus(results[0].id);
              else document.getElementById('knowledge-search-results')?.querySelector<HTMLElement>('[role="option"]')?.focus();
            }
            if (event.key === 'Escape') setQuery('');
          }} /></label>
        {query.trim() && <div className="og-search-results" id="knowledge-search-results" role="listbox" aria-label="知识网络搜索结果" onKeyDown={event => {
          const options = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')];
          const current = options.indexOf(document.activeElement as HTMLElement);
          if (options.length && ['ArrowDown','ArrowUp'].includes(event.key)) { event.preventDefault(); options[(current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus(); }
          if (event.key === 'Escape') { setQuery(''); search.current?.focus(); }
        }}>{results.slice(0, searchLimit).map(node => <button type="button" role="option" aria-selected={node.id === selectedId} key={node.id} onClick={() => focus(node.id)}><span>{node.label}</span><small>{kindLabel[node.kind]}</small></button>)}
          {!results.length && <p role="status">未找到知识点，可在左侧全文搜索文档。</p>}
          {results.length > searchLimit && <button type="button" onClick={() => setSearchLimit(value => value + 30)}>显示更多结果</button>}
        </div>}
      </div>
      <button type="button" className="og-icon" title="全部知识关联" aria-label="知识关联" aria-expanded={indexOpen} onClick={() => { setSettingsOpen(false); setIndexOpen(true); setRelationQuery(''); }}><List /></button>
      <button ref={gear} type="button" className="og-icon" title="图谱设置" aria-label="图谱设置" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(value => !value)}><SlidersHorizontal /></button>
    </div>
    <div className="og-stage" ref={body}>
      <div className="og-graph-layer" inert={modal}>
        <ObsidianCanvas ref={controls} graph={graph} selectedId={selectedId} inspectorOpen={inspecting} modal={modal} settings={settings}
          onSelect={focus} onClear={overview} onStats={setStats} onReadFallback={() => onOpen(documentRoute('overview'))} />
        <div className="og-graph-meta"><span>{stats.nodes} / {stats.total} 节点</span><span>{stats.edges} 连线</span></div>
        <div className="og-map-tools" role="group" aria-label="图谱视口控制">
          <button type="button" aria-label="放大图谱" onClick={() => controls.current?.zoomIn()}><Plus /></button>
          <span>{Math.round(stats.zoom * 100)}%</span>
          <button type="button" aria-label="缩小图谱" onClick={() => controls.current?.zoomOut()}><Minus /></button>
          <button type="button" aria-label="显示全图" title="显示全图 · 0" onClick={() => controls.current?.fit()}><Maximize2 /></button>
        </div>
        <p className="og-hint">拖动画布 · 滚轮或双指缩放 · 点击节点查看知识笔记</p>
        {stats.total > 0 && stats.nodes === 0 && <div className="og-empty"><p>当前筛选没有节点</p><button type="button" onClick={() => setSettings(defaults)}>清除筛选</button></div>}
      </div>
      {settingsOpen && <section className="og-settings" aria-label="图谱显示设置">
        <header><strong>图谱设置</strong><button type="button" aria-label="关闭图谱设置" onClick={() => { setSettingsOpen(false); gear.current?.focus(); }}><X /></button></header>
        <p>筛选只改变显示，不改动知识关系。</p>
        {([['structure','结构连线'],['relations','知识关联线'],['colored','按领域分组着色'],['onlyResources','只显示有资料的节点']] as const).map(([key,label]) => <label className="og-setting" key={key}><span>{label}</span><input type="checkbox" checked={settings[key]} onChange={event => setSettings(current => ({ ...current, [key]: event.target.checked }))} /></label>)}
        <label className="og-setting og-range"><span>标签密度</span><input type="range" min="0" max="2" step="0.5" value={settings.labels} aria-label="标签密度" onChange={event => setSettings(current => ({ ...current, labels: Number(event.target.value) }))} /></label>
        <h3>知识区域</h3>{index.groups.map(group => <label className="og-setting" key={group.id}><span>{group.label.replace(/^\d+ · /, '')}</span><input type="checkbox" checked={!settings.groups || settings.groups.includes(group.id)} onChange={event => setSettings(current => { const values = new Set(current.groups ?? index.groups.map(item => item.id)); event.target.checked ? values.add(group.id) : values.delete(group.id); return { ...current, groups: [...values] }; })} /></label>)}
        <button type="button" className="og-reset" onClick={() => setSettings(defaults)}>恢复默认显示</button>
      </section>}
      {inspecting && <aside ref={inspector} className="og-inspector atlas-inspector" data-open="true" role={modal ? 'dialog' : 'complementary'} aria-modal={modal || undefined} aria-label={indexOpen ? '全部知识关联' : '知识节点简报'}>
        <header><p>{indexOpen ? '全部知识关联' : '知识笔记'}</p><button type="button" aria-label={indexOpen ? '关闭关系索引' : '关闭知识节点简报'} onClick={overview}><X /></button></header>
        <h2 ref={heading} tabIndex={-1}>{indexOpen ? '关联索引' : selected?.label}</h2>
        {indexOpen ? <><input type="search" aria-label="筛选知识关联" value={relationQuery} placeholder="查找节点或关系说明…" onChange={event => { setRelationQuery(event.target.value); setRelationLimit(30); }} /><p>{rows.length} 条原始关系 · 点击两端继续探索</p>
          {rows.slice(0, relationLimit).map(row => <RelationRow key={row.edge.id} relation={row} onSelect={focus} />)}
          {rows.length > relationLimit && <button type="button" className="atlas-more" onClick={() => setRelationLimit(value => value + 30)}>显示更多关系</button>}
          <button type="button" className="atlas-more" onClick={() => onOpen(documentRoute('overview'))}>用列表继续阅读</button>
        </> : selected && <NodeDetails key={selected.id} node={selected} model={model} onSelect={focus} onRead={read} onOpen={onOpen} />}
      </aside>}
    </div>
  </div>;
}
