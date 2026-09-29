import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Network } from 'lucide-react';
import { routeUrl, type AppRoute } from '../../routing';
import { graph } from '../garden/data';
import { coverageLabel, kindLabel, type KnowledgeNode } from '../garden/domain';
import { useMedia } from '../garden/useMedia';
import { documentRoute, folderRoute, type ExplorerModel } from './model';
import { useOverlayFocus } from './useWorkspace';
import { buildKnowledgeIndex, type IndexedRelation, type RelationBundle } from './knowledgeIndex';
import AtlasMap from './AtlasMap';
import '../../styles/atlas.css';
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
  return <>
    <nav className="atlas-breadcrumb" aria-label="知识位置">{index.ancestors(node.id).filter(parent => parent.kind !== 'root').map(parent => <button type="button" key={parent.id} aria-current={parent.id === node.id ? 'location' : undefined} onClick={() => onSelect(parent.id)}>{parent.label}{parent.id !== node.id && ' /'}</button>)}</nav>
    <p>{node.summary || '这个知识点只有一份定义，可被不同专题、文章和学习路径引用。'}</p>
    <p className="atlas-status">{explanations.length ? `${explanations.length} 份独立讲解资料` : '尚无直接绑定的独立讲解'} · {own.length} 份直接资料。引用资料和下级资料不计为本节点已经完成。</p>
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
  const [indexOpen, setIndexOpen] = useState(false), [bundle, setBundle] = useState<RelationBundle | null>(null);
  const [relationQuery, setRelationQuery] = useState(''), [relationLimit, setRelationLimit] = useState(24);
  const search = useRef<HTMLInputElement>(null), inspector = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null), body = useRef<HTMLDivElement>(null);
  const wide = useMedia('(min-width: 1280px)');
  const selected = selectedId ? index.byId.get(selectedId) : undefined;
  const inspecting = Boolean(selected) || indexOpen, modal = !wide && inspecting;
  const results = useMemo(() => index.search(query), [query]);
  const shownRelations = useMemo(() => {
    const terms = relationQuery.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    return (bundle?.relations ?? index.relations).filter(({ edge }) => terms.every(term => `${index.byId.get(edge.source)?.label} ${index.byId.get(edge.target)?.label} ${edge.reason ?? ''}`.toLocaleLowerCase().includes(term)));
  }, [bundle, relationQuery]);
  const focus = (id: string) => {
    if (!index.byId.has(id)) return;
    setQuery(''); setIndexOpen(false); setBundle(null);
    onOpen(mapRoute(id));
  };
  const overview = () => { setQuery(''); setIndexOpen(false); setBundle(null); onOpen({ kind: 'home' }); };
  const showRelations = (value: RelationBundle | null = null) => {
    setBundle(value); setIndexOpen(true); setRelationQuery(''); setRelationLimit(24); setQuery('');
  };
  const read = (id: string) => onOpen({ ...documentRoute(id), returnTo: routeUrl(mapRoute(selectedId)) });
  useOverlayFocus(modal, inspector, overview);
  useEffect(() => {
    if (!modal) return;
    const workspace = body.current?.closest('.workspace');
    const elements = [...(workspace?.querySelectorAll<HTMLElement>('.ws-ribbon,.ws-sidebar,.ws-status') ?? [])];
    const states = elements.map(element => element.inert); elements.forEach(element => { element.inert = true; });
    return () => elements.forEach((element, position) => { element.inert = states[position]; });
  }, [modal]);
  useLayoutEffect(() => {
    if (!selectedId) return;
    const group = index.groupOf(selectedId);
    const region = body.current?.querySelector<HTMLElement>(`[data-area="${group}"]`);
    region?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selectedId]);
  useEffect(() => {
    if (!inspecting) return;
    inspector.current?.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [selectedId, indexOpen, bundle, inspecting]);
  return <div className="ws-graph-pane ws-macro-home atlas-home" data-layer="global" data-density="macro" data-inspector={inspecting}>
    <div className="ws-macro-heading" inert={modal}><div><p className="ws-graph-kicker">NEXTCHINA / AI KNOWLEDGE</p><h1>宏观关系图</h1><p className="ws-macro-intro">一张地图，看清知识结构、关联依据与阅读入口。</p></div><div className="ws-macro-summary"><span>{index.groups.length} 个区域</span><span>{graph.stats.concepts} 个概念</span><span>{model.documents.size} 份文档</span></div></div>
    <div className="ws-map-tools" inert={modal}><div className="ws-map-actions">
      <div className="ws-map-search-wrap"><label className="ws-graph-search"><Search /><input ref={search} type="search" aria-label="搜索知识网络" aria-controls={query.trim() ? 'knowledge-search-results' : undefined} placeholder="搜索知识点、专题，如 Softmax、RAG…" value={query} onChange={event => { setQuery(event.target.value); setSearchLimit(20); }} onKeyDown={event => {
        if ((event.key === 'Enter' || event.key === 'ArrowDown') && results.length) { event.preventDefault(); if (event.key === 'Enter') focus(results[0].id); else document.getElementById('knowledge-search-results')?.querySelector<HTMLElement>('[role="option"]')?.focus(); }
        if (event.key === 'Escape') setQuery('');
      }} /></label>
      {query.trim() && <div className="ws-graph-search-results" id="knowledge-search-results" role="listbox" aria-label="知识网络搜索结果" onKeyDown={event => {
        const options = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')], current = options.indexOf(document.activeElement as HTMLElement);
        if (options.length && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); options[(current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus(); }
        if (event.key === 'Escape') { setQuery(''); search.current?.focus(); }
      }}>{results.slice(0, searchLimit).map(node => <button type="button" role="option" aria-selected={node.id === selectedId} key={node.id} onClick={() => focus(node.id)}><span>{node.label}</span><small>{kindLabel[node.kind]}</small></button>)}{!results.length && <p role="status">未找到匹配知识点，可从侧栏搜索文档全文。</p>}{results.length > searchLimit && <button type="button" className="atlas-more" onClick={() => setSearchLimit(value => value + 30)}>显示其余 {results.length - searchLimit} 个结果</button>}</div>}
      </div>
      <button type="button" aria-expanded={indexOpen} onClick={() => showRelations()}><Network />知识关联</button>
      {inspecting && <button type="button" onClick={overview}><X />回到全貌</button>}
    </div></div>
    <div className="atlas-body" ref={body}>
      <div style={{ minWidth: 0, minHeight: 0 }} inert={modal}><AtlasMap index={index} selectedId={selectedId} onSelect={focus} onBundle={showRelations} /></div>
      <aside ref={inspector} className="atlas-inspector" data-open={inspecting} role={modal ? 'dialog' : 'complementary'} aria-modal={modal || undefined} aria-label={indexOpen ? '全部知识关联' : selected ? '知识节点简报' : '地图使用指南'}>
        <header><p>{indexOpen ? '原始关系 / 可追溯' : selected ? kindLabel[selected.kind] : '从全貌到知识点'}</p>{inspecting && <button type="button" aria-label={indexOpen ? '关闭关系索引' : '关闭知识节点简报'} onClick={overview}><X /></button>}</header>
        <h2 ref={heading} tabIndex={-1}>{indexOpen ? bundle ? '区域之间如何关联' : '全部知识关联' : selected?.label ?? '从一个知识点开始'}</h2>
        {indexOpen ? <>
          <p>{bundle ? '以下是所选区域之间的原始关系，不把汇总连线当作领域因果。' : '目录归属、知识关联、专题引用和学习顺序分开记录；原始关系不因视图折叠而丢失。'}</p>
          <input type="search" aria-label="筛选知识关联" value={relationQuery} placeholder="筛选节点名称或关系说明" onChange={event => { setRelationQuery(event.target.value); setRelationLimit(24); }} />
          <p role="status">{shownRelations.length} 条匹配关系{bundle && ` / ${bundle.relations.length} 条区域关联`}</p>
          {shownRelations.slice(0, relationLimit).map(relation => <RelationRow key={relation.edge.id} relation={relation} onSelect={focus} />)}
          {shownRelations.length > relationLimit && <button type="button" className="atlas-more" onClick={() => setRelationLimit(value => value + 30)}>显示其余 {shownRelations.length - relationLimit} 条关系</button>}
          {!bundle && <section><h3>学习路径 · {graph.learningPaths.length}</h3><p>路径只表达建议阅读顺序，不自动生成先修边。</p>{graph.learningPaths.map(path => <div className="atlas-path" key={path.id}><p>{path.label} · 规划路径</p>{path.steps.map((id, position) => <button type="button" key={id} onClick={() => focus(id)}>{position + 1}. {index.byId.get(id)?.label}</button>)}</div>)}</section>}
          <button type="button" className="atlas-more" onClick={() => onOpen(documentRoute('overview'))}>用列表继续阅读</button>
        </> : selected ? <NodeDetails key={selected.id} node={selected} model={model} onSelect={focus} onRead={read} onOpen={onOpen} /> : <div className="atlas-guide"><p>点击领域或专题，查看下级知识。搜索可以直接到达任意已定义的概念。</p><p>每条知识关系都能查看两端节点与原始说明；每份资料都标出它与节点的关系。</p><p>阅读后可返回原节点。这里没有多文件标签，也不会为文章再生成一张图。</p><h3>知识地图不是完成度证明</h3><p>提纲、资料入口、独立讲解分别展示；尚未写完的节点明确留空。</p><button type="button" onClick={() => showRelations()}>查看全部 {index.relations.length} 条知识关系</button></div>}
        {!!index.issues.length && <p role="alert">数据索引存在 {index.issues.length} 项完整性问题，需要修复后才能认为关系完整。</p>}
      </aside>
    </div>
  </div>;
}
