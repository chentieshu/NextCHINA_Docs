import React, { lazy, Suspense } from 'react';
import { FileText, Folder, ArrowUpRight, Network } from 'lucide-react';
import type { AppRoute } from '../../routing';
import { byId } from '../garden/data';
import { resourceMeta } from '../garden/hub-data';
import { documentRoute, folderRoute, outgoingDocuments, type ExplorerModel } from './model';
import { LazyBoundary } from '../../components/LazyBoundary';
const MarkdownRenderer = lazy(() => import('../../components/MarkdownRenderer').then(module => ({ default: module.MarkdownRenderer })));
const ModelReferenceIndex = lazy(() => import('../garden/ModelReferenceIndex'));
interface Props { route: AppRoute; model: ExplorerModel; isLight: boolean; onOpen: (route: AppRoute) => void; }
export function currentDocument(route: AppRoute, model: ExplorerModel) {
  const id = route.kind === 'article' ? route.chapterId : route.kind === 'home' ? 'overview' : byId.get(route.scopeId)?.embeddedArticleId;
  return id ? model.documents.get(id) : undefined;
}
export function WorkspaceContent({ route, model, isLight, onOpen }: Props) {
  const article = currentDocument(route, model);
  const scopeId = route.kind === 'garden' ? route.scopeId : 'root:ai';
  const scope = byId.get(scopeId);
  const recovery = () => onOpen(documentRoute('overview'));
  if (article) {
    const meta = resourceMeta(article.id), independent = meta?.kind === 'independent-explanation';
    return <div className="ws-reading-column" data-document={article.id} data-reading-layout={article.readingLayout ?? 'prose'}>
      <header className="ws-document-heading"><p className="ws-eyebrow">{article.categoryName} <span> / </span>{independent ? '独立讲解' : '文档'}</p><h1>{article.title}</h1><p className="ws-subtitle">{article.subtitle}</p><div className="ws-document-meta"><span>{independent ? '撰写' : '页面日期'} {article.date}</span><span>{article.readTime}</span><span>只读知识库</span></div></header>
      {meta && <aside className="ws-evidence" role="note">{independent ? '包含一手来源、教学假设与数值示例。程序验证不等于专家复核，也不代表商业模型实测。' : '保留资料的原始日期与口径；本次界面更新未重新核验名称、分数或价格。'}{article.id === 'terminal-bench' && ' 此页是 Agent 系统任务评测，不是裸模型能力排名。'}</aside>}
      <LazyBoundary label="文档渲染器" fallbackAction={recovery}><Suspense fallback={<p role="status">正在排版文档…</p>}><MarkdownRenderer content={article.content} isLight={isLight} /></Suspense></LazyBoundary>
      {!!meta?.relatedResourceIds?.length && <section className="ws-related-inline"><h2>继续阅读</h2>{meta.relatedResourceIds.map(id => { const doc = model.documents.get(id); return doc ? <button type="button" key={id} data-related-resource={id} onClick={() => onOpen(documentRoute(id, model.occurrence(id)?.nodeId))}><FileText />{doc.title}<ArrowUpRight /></button> : null; })}</section>}
      <footer className="ws-reading-end">正文结束 · 继续从左侧目录选择文档</footer>
    </div>;
  }
  if ((route.kind === 'article') || (!scope && scopeId !== 'workspace:unfiled')) return <div className="ws-reading-column"><h1>未找到这份文档或目录</h1><p>原链接可能已调整。侧栏和全库搜索仍可使用。</p><button onClick={recovery}>打开阅读指南</button></div>;
  const folder = model.entries.get(scopeId);
  const ids = scopeId === 'root:ai' ? model.roots : folder?.children ?? [];
  const entries = ids.map(id => model.entries.get(id)!);
  const linked = scope ? [...new Set([...scope.articleBindings.map(ref => ref.articleId), ...(scope.resourceRefs ?? []).map(ref => ref.articleId)])] : [];
  return <div className="ws-reading-column ws-folder-index" data-folder={scopeId}>
    <header className="ws-document-heading"><p className="ws-eyebrow">目录 / 知识结构</p><h1>{folder?.label ?? scope?.label ?? '全部知识'}</h1><p className="ws-subtitle">{scope?.summary ?? '从左侧展开目录，选择要阅读的文档。目录与关系图共用同一套知识和资料。'}</p></header>
    {entries.length > 0 && <section><h2>目录内容</h2><div className="ws-folder-rows">{entries.map(entry => <button type="button" key={entry.id} data-folder-entry={entry.id} onClick={() => onOpen(entry.articleId ? documentRoute(entry.articleId, entry.nodeId) : folderRoute(entry.nodeId))}>
      {entry.articleId ? <FileText /> : <Folder />}<span>{entry.label}</span><small>{entry.articleId ? '文档' : '目录'}</small><ArrowUpRight /></button>)}</div></section>}
    {linked.length > 0 && !entries.some(entry => entry.articleId) && <section><h2>关联阅读资料</h2><div className="ws-folder-rows">{linked.map(id => { const doc = model.documents.get(id); return doc ? <button key={id} onClick={() => onOpen(documentRoute(id))}><FileText /><span>{doc.title}</span><ArrowUpRight /></button> : null; })}</div><p className="ws-muted">资料入口不等于本概念已完成独立讲解。</p></section>}
    {scope?.hubId === 'hub:llm' && ['models','models/model-detail'].includes(scope.outlinePath ?? '') && <LazyBoundary label="模型来源记录" fallbackAction={recovery}><Suspense fallback={<p role="status">读取来源索引…</p>}><ModelReferenceIndex isLight={isLight} onOpen={id => onOpen(folderRoute(id))} /></Suspense></LazyBoundary>}
    {!entries.length && !linked.length && <div className="ws-empty"><strong>这个分支的独立内容尚待完善。</strong><p>不会把同一篇总览冒充所有子章节。你可以查看下方的共享知识，或从左侧选择已写文档。</p></div>}
    {!!scope?.conceptRefs?.length && <section><h2>共享知识</h2><div className="ws-folder-rows">{scope.conceptRefs.map(id => <button type="button" key={id} onClick={() => onOpen(folderRoute(id))}><Network /><span>{byId.get(id)?.label ?? id}</span></button>)}</div></section>}
    {!!scope?.hubEntries?.length && <section><h2>进入对应专题</h2><div className="ws-folder-rows">{scope.hubEntries.map(id => <button key={id} onClick={() => onOpen(folderRoute(id))}><Folder /><span>{byId.get(id)?.label ?? id}</span></button>)}</div></section>}
    {!!scope?.hubRefs?.length && <section><h2>相关专题</h2><div className="ws-folder-rows">{scope.hubRefs.map(id => <button key={id} onClick={() => onOpen(folderRoute(id))}><Folder /><span>{byId.get(id)?.label ?? id}</span></button>)}</div></section>}
  </div>;
}
export function RelatedContent({ route, model, onOpen }: Omit<Props, 'isLight'>) {
  const article = currentDocument(route, model);
  const references = article ? outgoingDocuments(article, model) : [];
  const backlinks = article ? [...model.documents.values()].filter(doc => outgoingDocuments(doc, model).some(target => target.id === article.id)) : [];
  const locations = article ? model.occurrences.get(article.id) ?? [] : [];
  return <div className="ws-related-body"><p className="ws-muted">{article ? article.title : '选择一篇文档查看链接与收录位置。'}</p>
    <section><h3>收录位置 <span>{locations.length}</span></h3>{locations.map(id => { const entry = model.entries.get(id)!; return <button key={id} onClick={() => onOpen(folderRoute(entry.nodeId))}><Folder /><span>{model.parents(id).slice(-3).map(key => model.entries.get(key)?.label).join(' / ')}</span></button>; })}</section>
    {[['正文链接', references], ['被哪些文档引用', backlinks]].map(([label, docs]) => <section key={label as string}><h3>{label as string} <span>{(docs as typeof references).length}</span></h3>{(docs as typeof references).map(doc => <button key={doc.id} onClick={() => onOpen(documentRoute(doc.id, model.occurrence(doc.id)?.nodeId))}><FileText /><span>{doc.title}</span></button>)}{!(docs as typeof references).length && <p className="ws-muted">暂未发现显式文档链接。</p>}</section>)}
    <p className="ws-muted">以上是导航与正文链接，不代表科学因果或事实核验。</p>
  </div>;
}
