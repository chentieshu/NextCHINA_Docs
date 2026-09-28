import type { DocChapter } from '../../types';
import type { AppRoute, GardenRoute } from '../../routing';
import { gardenHome, readRoute } from '../../routing';
import { graph, byId, ancestors, childrenById } from '../garden/data';
import type { KnowledgeNode, KnowledgeEdge } from '../garden/domain';
import type { GraphLayer, Projection } from '../garden/projection';

export type { GraphLayer };
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
    for (const ref of node.resourceRefs ?? []) addDocument(ref.articleId, node.id);
    for (const child of childrenById.get(node.id) ?? []) {
      if (['hub', 'branch', 'topic'].includes(child.kind)) addFolder(child, node.id);
    }
  };
  for (const domain of graph.nodes.filter(node => node.kind === 'domain')) {
    addFolder(domain, null);
    entries.get(domain.id)!.children.sort((a, b) => Number(byId.get(b)?.kind === 'hub') - Number(byId.get(a)?.kind === 'hub'));
  }
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

function documentNode(article: DocChapter): KnowledgeNode {
  return {
    id: `article:${article.id}`, label: article.title, kind: 'document', parentId: null,
    contentStatus: 'published', evidenceStatus: 'source-specific',
    articleBindings: [{ articleId: article.id, coverage: 'explanation' }], summary: article.excerpt
  };
}

function hostingHub(articleId: string, model: ExplorerModel) {
  const context = model.occurrence(articleId)?.nodeId;
  return context ? ancestors(context).find(node => node.kind === 'hub') ?? byId.get(context) : undefined;
}

/** Atlas = reading purpose + domains + enabled hubs. Paths = blueprint learningPaths. Explore = local tree + one hop. Documents = published pages. */
export function graphProjection(scopeId: string, model: ExplorerModel, layer?: GraphLayer, groupId?: string): Projection {
  const scope = byId.get(scopeId);
  if (!scope && scopeId !== 'root:ai') return { nodes: [], edges: [], total: 0, omitted: 0, key: 'missing', atlas: false, layer: 'explore' };
  const nodes = new Map<string, KnowledgeNode>();
  const edges = new Map<string, KnowledgeEdge>();
  const addEdge = (source: string, target: string, reason: string, type: KnowledgeEdge['type'] = 'browse_child') => {
    const id = `${type}:${source}>${target}`;
    if (edges.has(id) || source === target) return;
    edges.set(id, { id, source, target, type, assertionStatus: 'editorial', reason });
  };
  const addArticle = (id: string) => {
    const article = model.documents.get(id);
    if (article) nodes.set(`article:${id}`, documentNode(article));
  };
  const attachKnowledge = (id: string) => {
    for (const edge of graph.edges) {
      if (edge.type === 'browse_child' || (edge.source !== id && edge.target !== id)) continue;
      const other = edge.source === id ? edge.target : edge.source;
      const node = byId.get(other);
      if (!node) continue;
      nodes.set(node.id, node);
      edges.set(edge.id, edge);
    }
  };

  const resolvedLayer: GraphLayer = layer ?? (scopeId === 'root:ai' || scope?.kind === 'root' ? 'atlas' : 'explore');

  if (resolvedLayer === 'documents') {
    const local = scopeId !== 'root:ai' && scope;
    const articles = local
      ? [...model.documents.values()].filter(article => {
          const host = hostingHub(article.id, model);
          return Boolean(host && (host.id === scopeId || ancestors(host.id).some(node => node.id === scopeId)));
        })
      : [...model.documents.values()];
    for (const article of articles) addArticle(article.id);
    for (const article of articles) {
      const host = hostingHub(article.id, model);
      if (host) {
        nodes.set(host.id, host);
        addEdge(host.id, `article:${article.id}`, '文档收录位置，不代表科学包含关系');
      }
      for (const linked of outgoingDocuments(article, model)) {
        if (nodes.has(`article:${linked.id}`) || !local) {
          addArticle(linked.id);
          addEdge(`article:${article.id}`, `article:${linked.id}`, '正文显式链接', 'related');
        }
      }
    }
  } else if (resolvedLayer === 'paths') {
    const relevant = (graph.learningPaths ?? []).filter(path => {
      if (scopeId === 'root:ai' || !scope) return true;
      return path.steps.some(id => id === scopeId || ancestors(id).some(node => node.id === scopeId));
    });
    for (const path of relevant) {
      const pathNodeId = `path:${path.id}`;
      nodes.set(pathNodeId, {
        id: pathNodeId, label: path.label, kind: 'path', parentId: null,
        contentStatus: 'maintained', evidenceStatus: 'editorial', articleBindings: [],
        summary: '编辑规划的阅读顺序，不是必修课表，也不是逻辑必要条件。'
      });
      let previous = pathNodeId;
      for (const stepId of path.steps) {
        const node = byId.get(stepId);
        if (!node) continue;
        nodes.set(node.id, node);
        addEdge(previous, node.id, path.label, 'recommended_before');
        previous = node.id;
      }
    }
  } else if (resolvedLayer === 'atlas') {
    for (const group of graph.groups ?? []) {
      if (groupId && group.id !== groupId) continue;
      nodes.set(`group:${group.id}`, {
        id: `group:${group.id}`, label: group.label, kind: 'group', parentId: 'root:ai',
        contentStatus: 'maintained', evidenceStatus: 'editorial', articleBindings: [],
        summary: '阅读目的入口，不是学科系', group: group.id
      });
    }
    for (const domain of graph.nodes.filter(node => node.kind === 'domain')) {
      if (groupId && domain.group !== groupId) continue;
      nodes.set(domain.id, domain);
      if (domain.group && nodes.has(`group:${domain.group}`)) addEdge(`group:${domain.group}`, domain.id, '阅读目的分组');
    }
    for (const hub of graph.nodes.filter(node => node.kind === 'hub')) {
      const domain = ancestors(hub.id).find(node => node.kind === 'domain');
      if (groupId && domain?.group !== groupId) continue;
      nodes.set(hub.id, hub);
      if (domain) addEdge(domain.id, hub.id, '已启用专题入口');
      else if (hub.parentId && nodes.has(hub.parentId)) addEdge(hub.parentId, hub.id, '已启用专题入口');
    }
  } else {
    if (scope) nodes.set(scope.id, scope);
    for (const child of childrenById.get(scopeId) ?? []) {
      nodes.set(child.id, child);
      addEdge(scopeId, child.id, '下级导航');
    }
    if (scope) {
      for (const binding of [...(scope.resourceRefs ?? []), ...scope.articleBindings]) {
        addArticle(binding.articleId);
        if (nodes.has(`article:${binding.articleId}`)) addEdge(scopeId, `article:${binding.articleId}`, '已有文档');
      }
      for (const id of [...(scope.conceptRefs ?? []), ...(scope.hubRefs ?? [])]) {
        const node = byId.get(id);
        if (!node) continue;
        nodes.set(node.id, node);
        addEdge(scopeId, node.id, '共享知识引用', 'related');
      }
    }
    for (const id of [...nodes.keys()]) attachKnowledge(id);
  }

  const all = [...nodes.values()];
  const visible = all.slice(0, 150);
  const ids = new Set(visible.map(node => node.id));
  return {
    nodes: visible,
    edges: [...edges.values()].filter(edge => ids.has(edge.source) && ids.has(edge.target)),
    total: all.length,
    omitted: all.length - visible.length,
    key: `workspace:${resolvedLayer}:${scopeId}:${groupId ?? ''}:${visible.map(node => node.id).join('|')}`,
    atlas: resolvedLayer === 'atlas',
    layer: resolvedLayer
  };
}
