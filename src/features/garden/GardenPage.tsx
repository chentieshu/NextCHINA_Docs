import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Compass, List, Network, Search, Sun, Moon, Link as LinkIcon, X } from 'lucide-react';
import type { DocChapter } from '../../types';
import { gardenHome, routeUrl, type GardenRoute } from '../../routing';
import { ancestors, byId, childrenById, graph, searchNodes } from './data';
import { project } from './projection';
import { NodeInspector } from './NodeInspector';
import { GardenList } from './GardenList';
import { TopicHubView } from './TopicHubView';
import { HubOutlineNav } from './HubOutlineNav';
import { hubFor, isHubNode } from './hub-data';
import { useMedia } from './useMedia';
import { LazyBoundary } from '../../components/LazyBoundary';
import '../../styles/garden.css';
import '../../styles/topic-hubs.css';

const GardenCanvas = lazy(() => import('./GardenCanvas'));
interface Props { route: GardenRoute; chapters: DocChapter[]; isLight: boolean; navigate: (route: GardenRoute) => void; onRead: (id: string) => void; onExit: () => void; onToggleTheme: () => void; }
export default function GardenPage({ route, chapters, isLight, navigate, onRead, onExit, onToggleTheme }: Props) {
  const narrow = useMedia('(max-width: 639px)');
  const modalInspector = useMedia('(max-width: 1023px)');
  const [query, setQuery] = useState('');
  const [searchLimit, setSearchLimit] = useState(24);
  const [copyState, setCopyState] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const input = useRef<HTMLInputElement>(null);
  const scope = byId.get(route.scopeId);
  const hubScope = isHubNode(scope);
  const hub = scope && hubScope ? hubFor(scope) : null;
  const selected = scope && route.nodeId ? byId.get(route.nodeId) : undefined;
  // A topic opens its branches, not a catch-all article. Graph remains a parallel view.
  const listMode = route.display === 'list' || (route.display === 'auto' && (narrow || hubScope));
  const projection = useMemo(() => project(route.scopeId, route.mode, listMode ? Number.MAX_SAFE_INTEGER : narrow ? 50 : 150), [route.scopeId, route.mode, listMode, narrow]);
  const matchNodes = useMemo(() => searchNodes(query), [query]);
  const matchArticles = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return terms.length ? chapters.filter(article => terms.every(term => `${article.title} ${article.tags.join(' ')} ${article.content}`.toLowerCase().includes(term))) : [];
  }, [query, chapters]);
  const inspect = useCallback((id: string) => {
    setQuery('');
    if (isHubNode(byId.get(id))) navigate({ ...route, scopeId: id, nodeId: null, mode: 'atlas', display: 'list' });
    else navigate({ ...route, nodeId: id });
  }, [route, navigate]);
  const expand = useCallback((id: string) => {
    const item = byId.get(id);
    const target = item?.hubEntries?.length === 1 ? item.hubEntries[0] : id;
    setQuery(''); navigate({ ...route, scopeId: target, nodeId: null, mode: isHubNode(byId.get(target)) || childrenById.has(target) || target === 'root:ai' ? 'atlas' : 'explore' });
  }, [route, navigate]);
  const related = useCallback((id: string) => { setQuery(''); navigate({ ...route, scopeId: id, nodeId: id, mode: 'explore' }); }, [route, navigate]);
  const overview = () => { setQuery(''); navigate({ ...gardenHome(), display: route.display }); };
  const openLLM = () => { setQuery(''); setCopyState(''); navigate({ ...gardenHome(), scopeId: 'hub:llm' }); };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    clearTimeout(timer.current);
    try { await navigator.clipboard.writeText(new URL(routeUrl(route), window.location.href).href); setCopyState('链接已复制'); }
    catch { setCopyState('请复制浏览器地址栏中的链接'); }
    timer.current = setTimeout(() => setCopyState(''), 2400);
  };
  const invalid = !scope || (route.nodeId !== null && !selected);
  const showInspector = Boolean(selected && !invalid);
  return <main className="garden-root" data-theme={isLight ? 'light' : 'dark'} data-inspector={showInspector} aria-label="AI 知识花园">
    <div className="garden-workspace" inert={showInspector && modalInspector}>
      <header className="garden-header">
        <div className="garden-brand"><Compass /><div><h1>AI 知识花园</h1><span>NEXTCHINA / EXPLORE</span></div></div>
        <div className="garden-search"><Search /><input ref={input} type="search" value={query}
          onChange={event => { setQuery(event.target.value); setSearchLimit(24); }} onKeyDown={event => { if (event.key === 'Escape') setQuery(''); }} placeholder="搜索概念、专题或文章" aria-label="搜索整个知识花园" />
          {query && <button aria-label="清空花园搜索" onClick={() => { setQuery(''); input.current?.focus(); }}><X /></button>}
        </div>
        <div className="garden-header-actions"><button type="button" className="hub-entry-button" onClick={openLLM}>LLM 专题</button><button type="button" onClick={onExit}><BookOpen /><span>返回文档</span></button>
          <button type="button" aria-label={isLight ? '切换为暗黑模式' : '切换为明亮模式'} onClick={onToggleTheme}>{isLight ? <Moon /> : <Sun />}</button></div>
      </header>
      <div className="garden-body">
        {hub ? <HubOutlineNav key={hub.id} hub={hub} scopeId={route.scopeId} onOpen={expand} onOverview={overview} /> : <nav className="garden-domain-nav" aria-label="知识领域"><button className="garden-overview" onClick={overview}><Compass /> 全景地图</button>
          {graph.groups.map(group => <section key={group.id}><h2>{group.label}</h2>{graph.nodes.filter(node => node.kind === 'domain' && node.group === group.id).map(node => <button key={node.id} onClick={() => expand(node.id)} aria-current={ancestors(route.scopeId).some(item => item.id === node.id) ? 'page' : undefined}>{node.label}</button>)}</section>)}
        </nav>}
        <section className="garden-stage" aria-label="知识浏览区域">
          <div className="garden-stage-bar"><nav aria-label="花园面包屑"><button onClick={overview}>全景</button>{scope && ancestors(scope.id).slice(1).map(node => <React.Fragment key={node.id}><span aria-hidden="true">/</span><button onClick={() => expand(node.id)}>{node.label}</button></React.Fragment>)}</nav>
            <div className="garden-stage-actions"><button type="button" aria-label="复制当前知识链接" onClick={copy}><LinkIcon /></button><button type="button" aria-pressed={!listMode} aria-label="使用图谱视图" onClick={() => navigate({ ...route, display: 'graph' })}><Network /></button><button type="button" aria-pressed={listMode} aria-label="使用列表视图" onClick={() => navigate({ ...route, display: 'list' })}><List /></button></div>
          </div>
          {copyState && <p className="garden-toast" role="status">{copyState}</p>}
          {invalid ? <div className="garden-state" role="status"><h2>未找到这个知识节点</h2><p>链接中的节点可能不存在或已调整。你可以搜索，或返回全景。</p><button onClick={overview}>返回全景</button></div>
          : query.trim() ? <div className="garden-search-results" role="region" aria-label="花园搜索结果">
              <h2>找到 {matchNodes.length} 个知识节点、{matchArticles.length} 篇文章</h2>
              <GardenList nodes={matchNodes.slice(0,searchLimit)} selectedId={route.nodeId} onSelect={id => {
                setQuery('');
                if (isHubNode(byId.get(id))) navigate({ ...route, scopeId:id, nodeId:null, mode:'atlas', display:'list' });
                else navigate({ ...route, scopeId:byId.get(id)?.parentId ?? 'root:ai', nodeId:id, mode:'atlas' });
              }} onExpand={expand} />
              {matchNodes.length > searchLimit && <button className="garden-secondary" onClick={() => setSearchLimit(value => value+24)}>继续显示（剩余 {matchNodes.length-searchLimit} 项）</button>}
              <ul className="garden-search-articles">{matchArticles.map(article => <li key={article.id}><button onClick={() => onRead(article.id)}><small>文章 · {article.categoryName}</small><strong>{article.title}</strong></button></li>)}</ul>
              {!matchNodes.length && !matchArticles.length && <p>尝试中文名称或英文术语，例如 Attention、RAG、Transformer。</p>}
            </div>
          : <>
              <div className="garden-section-title"><div><h2>{route.mode === 'explore' ? `${scope!.label} · 局部关系` : scope!.kind === 'root' ? '从一个问题开始探索' : scope!.label}</h2><p>{scope!.kind === 'root' ? `${graph.stats.domains} 个领域入口；框架不是已经写完的百科。` : scope!.summary || '选择下级问题，查看已有资源，或沿共享知识继续探索。'}</p></div>
                {scope!.parentId && <button aria-label="返回上级专题" onClick={() => expand(scope!.parentId!)}><ArrowLeft /></button>}</div>
              {projection.omitted > 0 && <p className="garden-budget">已展示 {projection.nodes.length} / {projection.total} 项。<button onClick={() => navigate({ ...route, display:'list' })}>在列表中查看全部</button></p>}
              <div className="garden-view-area">{listMode ? hubScope && route.mode === 'atlas' ? <TopicHubView node={scope!} chapters={chapters} isLight={isLight} onOpen={expand} onConcept={inspect} onRead={onRead} /> : <div className="garden-list-scroll"><GardenList nodes={projection.nodes} selectedId={route.nodeId} onSelect={inspect} onExpand={expand} /></div>
                : <LazyBoundary fallbackAction={() => navigate({ ...route, display:'list' })} label="图谱模块"><Suspense fallback={<div className="garden-state" role="status">正在加载交互画布…</div>}><GardenCanvas key={projection.key} projection={projection} selectedId={route.nodeId} scopeId={route.scopeId} isLight={isLight} onSelect={inspect} onExpand={expand} onList={() => navigate({ ...route, display:'list' })} /></Suspense></LazyBoundary>}
              </div>
            </>}
        </section>
      </div>
      <footer className="garden-footer"><span>{graph.stats.domains} 领域 · {graph.stats.hubs ?? 0} 专题中心 · {graph.stats.concepts} 规范概念</span><span>{graph.stats.articleBindings} 个阅读页面 · 导航不是完成度或事实核验</span></footer>
    </div>
    {selected && !invalid && <NodeInspector node={selected} chapters={chapters} onClose={() => navigate({ ...route, nodeId:null })} onExpand={expand} onRelated={related} onRead={onRead} />}
  </main>;
}
