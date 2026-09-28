import type { DocChapter } from '../../types';
import type { AppRoute, GardenRoute } from '../../routing';
import { gardenHome, readRoute } from '../../routing';
import { graph, byId, ancestors, childrenById } from '../garden/data';
import type { KnowledgeNode, KnowledgeEdge } from '../garden/domain';
import type { Projection } from '../garden/projection';

export interface Entry {
  id: string; label: string; type: 'folder' | 'document'; parentId: string | null;
  nodeId: string; articleId?: string; children: string[];
}
export const folderRoute = (id: string, graphView = false): GardenRoute => ({ ...gardenHome(), scopeId: id, display: graphView ? 'graph' : 'list' });
export const documentRoute = (id: string, nodeId?: string): AppRoute => ({ kind: 'article', chapterId: id,
  returnTo: nodeId ? `?view=garden&scope=${encodeURIComponent(nodeId)}&display=list` : undefined });
export const routeKey = (route: AppRoute): string => route.kind === 'home' ? 'article:overview' : route.kind === 'article' ? `article:${route.chapterId}` : `${route.display === 'graph' ? 'graph' : 'folder'}:${route.scopeId}:${route.nodeId ?? ''}`;
export const isGraphRoute = (route: AppRoute): route is GardenRoute => route.kind === 'garden' && route.display === 'graph';

/** Navigation occurrences refer to one canonical document. Nothing is copied into the tree. */
export function buildExplorer(chapters: DocChapter[]) {
  const entries = new Map<string, Entry>();
  const roots: string[] = [];
  const documents = new Map(chapters.map(chapter => [chapter.id, chapter]));
  const occurrences = new Map<string, string[]>();
  const addDocument = (articleId: string, parentId: string) => {
    const chapter = documents.get(articleId); if (!chapter) return;
    const id = `file:${parentId}:${articleId}`;
    if (entries.has(id)) return;
    const entry: Entry = { id, label: chapter.title, type: 'document', parentId, nodeId: parentId, articleId, children: [] };
    entries.set(id, entry); entries.get(parentId)?.children.push(id);
    occurrences.set(articleId, [...(occurrences.get(articleId) ?? []), id]);
  };
  const addFolder = (node: KnowledgeNode, parentId: string | null) => {
    if (entries.has(node.id)) return;
    const entry: Entry = { id: node.id, label: node.label, type: 'folder', parentId, nodeId: node.id, children: [] };
    entries.set(node.id, entry);
    if (parentId) entries.get(parentId)?.children.push(node.id); else roots.push(node.id);
    // Explicit resources only: never make an inherited overview appear as every leaf's article.
    for (const ref of node.resourceRefs ?? []) addDocument(ref.articleId, node.id);
    for (const child of childrenById.get(node.id) ?? []) {
      if (['hub', 'branch', 'topic'].includes(child.kind)) addFolder(child, node.id);
    }
  };
  for (const domain of graph.nodes.filter(node => node.kind === 'domain')) {
    addFolder(domain, null);
    // Keep topic hubs before shared foundations without reparenting canonical knowledge.
    entries.get(domain.id)!.children.sort((a, b) => Number(byId.get(b)?.kind === 'hub') - Number(byId.get(a)?.kind === 'hub'));
  }
  // All public documents remain selectable even if an editorial mapping is later missing.
  const fallback = 'workspace:unfiled';
  for (const chapter of chapters) if (!occurrences.has(chapter.id)) {
    if (!entries.has(fallback)) { entries.set(fallback, { id: fallback, label: '其他文档', type: 'folder', parentId: null, nodeId: 'root:ai', children: [] }); roots.push(fallback); }
    addDocument(chapter.id, fallback);
  }
  const parents = (id: string): string[] => {
    const result: string[] = []; let entry = entries.get(id); const seen = new Set<string>();
    while (entry?.parentId && !seen.has(entry.parentId)) { seen.add(entry.parentId); result.unshift(entry.parentId); entry = entries.get(entry.parentId); }
    return result;
  };
  const occurrence = (articleId: string, context?: string): Entry | undefined => {
    const candidates = occurrences.get(articleId) ?? [];
    return entries.get(candidates.find(id => entries.get(id)?.nodeId === context) ?? candidates[0]);
  };
  return { entries, roots, documents, occurrences, parents, occurrence };
}
export type ExplorerModel = ReturnType<typeof buildExplorer>;
export function routeContext(route: AppRoute, model: ExplorerModel): string {
  if (route.kind === 'garden') return route.scopeId;
  const articleId = route.kind === 'article' ? route.chapterId : 'overview';
  const back = route.kind === 'article' && route.returnTo ? readRoute(route.returnTo) : null;
  return model.occurrence(articleId, back?.kind === 'garden' ? back.scopeId : undefined)?.nodeId ?? 'root:ai';
}
export function activeEntry(route: AppRoute, model: ExplorerModel): string | null {
  if (route.kind === 'garden') return model.entries.has(route.scopeId) ? route.scopeId : null;
  return model.occurrence(route.kind === 'article' ? route.chapterId : 'overview', routeContext(route, model))?.id ?? null;
}
export function routeTitle(route: AppRoute, model: ExplorerModel): string {
  if (route.kind === 'article' || route.kind === 'home') return model.documents.get(route.kind === 'home' ? 'overview' : route.chapterId)?.title ?? '文档不存在';
  return (isGraphRoute(route) ? '关系图 · ' : '') + (byId.get(route.scopeId)?.label ?? '未知位置');
}
/** Documents referenced from real Markdown links, not inferred from topic co-membership. */
export function outgoingDocuments(chapter: DocChapter, model: ExplorerModel): DocChapter[] {
  const ids = new Set<string>();
  for (const match of chapter.content.matchAll(/\]\((\?[^\s)]+)\)/g)) {
    const route = readRoute(match[1]);
    if (route.kind === 'article' && route.chapterId !== chapter.id && model.documents.has(route.chapterId)) ids.add(route.chapterId);
  }
  return [...ids].map(id => model.documents.get(id)!);
}
export function graphProjection(scopeId: string, model: ExplorerModel): Projection {
  const scope = byId.get(scopeId); if (!scope) return { nodes: [], edges: [], total: 0, omitted: 0, key: 'missing', atlas: false };
  const nodes = new Map<string, KnowledgeNode>(); const edges = new Map<string, KnowledgeEdge>();
  const addEdge = (source: string, target: string, reason: string, type: 'browse_child' | 'related' = 'browse_child') => {
    const id = `${source}>${target}`; edges.set(id, { id, source, target, type, assertionStatus: 'editorial', reason });
  };
  const addArticle = (id: string) => {
    const article = model.documents.get(id); if (!article) return;
    nodes.set(`article:${id}`, { id: `article:${id}`, label: article.title, kind: 'document', parentId: null,
      contentStatus: 'published', evidenceStatus: 'source-specific', articleBindings: [{ articleId: id, coverage: 'explanation' }], summary: article.excerpt });
  };
  if (scopeId === 'root:ai') {
    for (const article of model.documents.values()) addArticle(article.id);
    for (const article of model.documents.values()) {
      const context = model.occurrence(article.id)?.nodeId;
      const hub = context ? ancestors(context).find(node => node.kind === 'hub') : null;
      if (hub) { nodes.set(hub.id, hub); addEdge(hub.id, `article:${article.id}`, '文档收录位置，不代表科学包含关系'); }
      for (const linked of outgoingDocuments(article, model)) addEdge(`article:${article.id}`, `article:${linked.id}`, '正文显式链接', 'related');
    }
  } else {
    nodes.set(scope.id, scope);
    for (const child of childrenById.get(scopeId) ?? []) { nodes.set(child.id, child); addEdge(scopeId, child.id, '下级导航'); }
    for (const binding of [...(scope.resourceRefs ?? []), ...scope.articleBindings]) { addArticle(binding.articleId); if (nodes.has(`article:${binding.articleId}`)) addEdge(scopeId, `article:${binding.articleId}`, '已有文档'); }
    for (const id of [...(scope.conceptRefs ?? []), ...(scope.hubRefs ?? [])]) if (byId.has(id)) { nodes.set(id, byId.get(id)!); addEdge(scopeId, id, '共享知识引用', 'related'); }
  }
  const all = [...nodes.values()]; const visible = all.slice(0, 150); const ids = new Set(visible.map(node => node.id));
  return { nodes: visible, edges: [...edges.values()].filter(edge => ids.has(edge.source) && ids.has(edge.target)), total: all.length,
    omitted: all.length - visible.length, key: `workspace:${scopeId}:${visible.map(node => node.id).join('|')}`, atlas: false };
}
