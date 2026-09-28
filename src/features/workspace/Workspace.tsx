import React, { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Files, Search, Network, PanelLeftClose, PanelLeftOpen, PanelRightOpen, X, Moon, Sun, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { DOC_CHAPTERS } from '../../data/docs';
import { ESSAY_CHAPTERS } from '../../data/essays';
import { useAppRoute, readRoute, routeUrl, type AppRoute } from '../../routing';
import { byId } from '../garden/data';
import { useMedia } from '../garden/useMedia';
import { LazyBoundary } from '../../components/LazyBoundary';
import { buildExplorer, routeTitle, routeContext, documentRoute, folderRoute, isGraphRoute, activeEntry } from './model';
import { useWorkspaceTabs, useOverlayFocus } from './useWorkspace';
import { Explorer } from './Explorer';
import { useTheme, useWorkspaceViewport } from './usePresentation';
import { WorkspaceContent, RelatedContent, currentDocument } from './Content';
import '../../styles/workspace.css';
const WorkspaceGraph = lazy(() => import('./WorkspaceGraph'));
const CHAPTERS = [...DOC_CHAPTERS, ...ESSAY_CHAPTERS];
const model = buildExplorer(CHAPTERS);
const scrollPositions = new Map<string, number>();

export default function Workspace() {
  const [legacyRoute, navigate] = useAppRoute();
  const route = useMemo(() => {
    if (legacyRoute.kind !== 'garden' || legacyRoute.display === 'graph') return legacyRoute;
    const selected = legacyRoute.nodeId && byId.has(legacyRoute.nodeId) ? legacyRoute.nodeId : legacyRoute.scopeId;
    const node = byId.get(selected);
    if (node?.embeddedArticleId) return documentRoute(node.embeddedArticleId, selected);
    return selected !== legacyRoute.scopeId ? folderRoute(selected) : legacyRoute;
  }, [legacyRoute]);
  useEffect(() => { if (routeUrl(route) !== routeUrl(legacyRoute)) navigate(route, true); }, [route, legacyRoute, navigate]);
  const [light, toggleTheme] = useTheme();
  useWorkspaceViewport();
  const mobile = useMedia('(width < 60rem)');
  const wide = useMedia('(width >= 80rem)');
  const [sidebarOpen, setSidebarOpen] = useState(() => window.matchMedia('(width >= 60rem)').matches);
  const [searchMode, setSearchMode] = useState(false);
  const [relatedOpen, setRelatedOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null), related = useRef<HTMLElement>(null), scroll = useRef<HTMLElement>(null);
  const { tabs, currentKey, closeTab } = useWorkspaceTabs(route, navigate);
  const title = routeTitle(route, model), article = currentDocument(route, model), context = routeContext(route, model);
  const graphView = isGraphRoute(route);
  const active = activeEntry(route, model);
  const breadcrumbs = active ? [...model.parents(active), active].map(id => model.entries.get(id)!) : [];
  const mobileSidebar = mobile && sidebarOpen, modalRelated = !wide && relatedOpen;
  const modal = mobileSidebar || modalRelated;
  useOverlayFocus(mobileSidebar, sidebar, () => setSidebarOpen(false));
  useOverlayFocus(modalRelated, related, () => setRelatedOpen(false));
  useEffect(() => { setSidebarOpen(!mobile); setRelatedOpen(false); }, [mobile]);
  useEffect(() => { document.documentElement.dataset.workspace = 'true'; return () => { delete document.documentElement.dataset.workspace; }; }, []);
  useEffect(() => { document.title = `${title} · NextCHINA`; }, [title]);
  // The only reading scroll owner. Tabs retain position; browser history and old links stay valid.
  useLayoutEffect(() => {
    const element = scroll.current;
    if (!element) return;
    const frame = requestAnimationFrame(() => {
      element.scrollTop = scrollPositions.get(currentKey) ?? 0;
      if (window.location.hash) { try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* Malformed old fragment. */ } }
    });
    return () => cancelAnimationFrame(frame);
  }, [currentKey]);
  const open = (next: AppRoute) => {
    setRelatedOpen(false);
    if (mobile && (next.kind === 'article' || isGraphRoute(next))) setSidebarOpen(false);
    navigate(next);
  };
  const searchAll = () => { setRelatedOpen(false); setSidebarOpen(true); setSearchMode(true); };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchAll(); }
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') { event.preventDefault(); setRelatedOpen(false); setSidebarOpen(value => !value); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  const handleLink = (event: React.MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download') || anchor.getAttribute('href')?.startsWith('#')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname || !['article','garden'].includes(url.searchParams.get('view') ?? '')) return;
    event.preventDefault(); open(readRoute(url.search));
  };
  const previousDocument = useRef<AppRoute>({ kind: 'home' });
  useEffect(() => { if (!graphView) previousDocument.current = route; }, [route, graphView]);
  return <div id="nextchina-docs-root" className="workspace" data-theme={light ? 'light' : 'dark'} data-sidebar={sidebarOpen} data-related={relatedOpen && wide} data-view={graphView ? 'graph' : 'read'}>
    <nav className="ws-ribbon" aria-label="工作区工具" inert={modal}><div className="ws-mark" aria-label="NextCHINA">N</div><button type="button" aria-label="显示文档目录" onClick={() => { setSidebarOpen(true); setSearchMode(false); }}><Files /></button><button type="button" aria-label="搜索全部文档" onClick={searchAll}><Search /></button><button type="button" aria-label="打开全库关系图" onClick={() => open(folderRoute('root:ai', true))}><Network /></button><div className="ws-ribbon-bottom"><button type="button" aria-label={light ? '切换为暗黑模式' : '切换为明亮模式'} onClick={toggleTheme}>{light ? <Moon /> : <Sun />}</button></div></nav>
    {mobileSidebar && <div className="ws-scrim" aria-hidden="true" onClick={() => setSidebarOpen(false)} />}
    <aside ref={sidebar} className="ws-sidebar" aria-label="文档侧栏" role={mobileSidebar ? 'dialog' : 'complementary'} aria-modal={mobileSidebar || undefined} inert={!sidebarOpen || modalRelated}>
      <Explorer model={model} route={route} onOpen={open} searchMode={searchMode} onSearchMode={setSearchMode} mobile={mobile} onClose={() => setSidebarOpen(false)} />
    </aside>
    <div className="ws-main" inert={modal}>
      <header className="ws-tab-header"><button className="ws-icon-button" type="button" aria-label={sidebarOpen ? '收起文档侧栏' : '打开文档侧栏'} onClick={() => { setRelatedOpen(false); setSidebarOpen(value => !value); }}>{sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}</button>
        <div className="ws-tabs" role="tablist" aria-label="已打开文档">{tabs.map((tab, index) => <div className="ws-tab" key={tab.key} data-active={tab.key === currentKey}>
          <button role="tab" type="button" aria-selected={tab.key === currentKey} tabIndex={tab.key === currentKey ? 0 : -1} title={routeTitle(tab.route, model)} onClick={() => open(tab.route)} onKeyDown={event => { if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); const i = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; open(tabs[i].route); requestAnimationFrame(() => document.querySelector<HTMLElement>('.ws-tabs [aria-selected="true"]')?.focus()); } }}>
            {isGraphRoute(tab.route) ? <Network /> : <BookOpen />}<span>{routeTitle(tab.route, model)}</span></button><button type="button" className="ws-tab-close" aria-label={`关闭标签 ${routeTitle(tab.route, model)}`} onClick={() => closeTab(tab.key)}><X /></button>
        </div>)}</div>
        <button className="ws-icon-button ws-mobile-theme" type="button" aria-label={light ? '切换为暗黑模式' : '切换为明亮模式'} onClick={toggleTheme}>{light ? <Moon /> : <Sun />}</button>
      </header>
      <div className="ws-toolbar"><div className="ws-history"><button type="button" aria-label="后退" onClick={() => window.history.back()}><ArrowLeft /></button><button type="button" aria-label="前进" onClick={() => window.history.forward()}><ArrowRight /></button></div>
        <nav className="ws-breadcrumbs" aria-label="当前知识位置"><button type="button" onClick={() => open({ kind: 'home' })}>知识库</button>{breadcrumbs.filter(entry => entry.type === 'folder').slice(-3).map(entry => <React.Fragment key={entry.id}><ChevronRight /><button type="button" onClick={() => open(folderRoute(entry.nodeId))}>{entry.label}</button></React.Fragment>)}</nav>
        <div className="ws-view-switch" role="group" aria-label="内容视图"><button type="button" aria-label="阅读当前文档" aria-pressed={!graphView} onClick={() => graphView && open(previousDocument.current)}><BookOpen /><span>阅读</span></button><button type="button" aria-pressed={graphView} aria-label="查看当前关系图" onClick={() => open(folderRoute(context, true))}><Network /><span>关系</span></button><button type="button" aria-pressed={relatedOpen} aria-label="显示关联资料" onClick={() => { if (!wide) setSidebarOpen(false); setRelatedOpen(value => !value); }}><PanelRightOpen /></button></div>
      </div>
      {graphView ? <section className="ws-graph-slot" aria-label="文档关系图"><LazyBoundary label="关系图" fallbackAction={() => open(folderRoute(context))}><Suspense fallback={<div className="ws-empty" role="status">正在加载关系图，文档目录仍可使用…</div>}><WorkspaceGraph scopeId={route.scopeId} model={model} isLight={light} onOpen={open} /></Suspense></LazyBoundary></section>
        : <main ref={scroll} className="ws-scroll" id="workspace-reader" tabIndex={-1} aria-label="文档阅读区" onScroll={event => { scrollPositions.set(currentKey, event.currentTarget.scrollTop); if (scrollPositions.size > 100) scrollPositions.delete(scrollPositions.keys().next().value!); }} onClick={handleLink}><WorkspaceContent route={route} model={model} isLight={light} onOpen={open} /></main>}
      <footer className="ws-status"><span>{graphView ? '关系视图' : article ? '阅读模式' : '目录'} · {model.documents.size} 篇文档</span><span>MD / JSON · {graphView ? '导航与链接，不代表因果' : '文档与图谱共用知识源'}</span></footer>
    </div>
    {modalRelated && <div className="ws-scrim" aria-hidden="true" onClick={() => setRelatedOpen(false)} />}
    {relatedOpen && <aside ref={related} className="ws-related" role={modalRelated ? 'dialog' : 'complementary'} aria-modal={modalRelated || undefined} aria-label="关联资料"><header><strong>关联资料</strong><button type="button" aria-label="关闭关联资料" onClick={() => setRelatedOpen(false)}><X /></button></header><RelatedContent route={route} model={model} onOpen={open} /></aside>}
  </div>;
}
