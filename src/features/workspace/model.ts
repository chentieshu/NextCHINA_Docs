import type { DocChapter } from '../../types';
import type { AppRoute, GardenRoute } from '../../routing';
import { gardenHome, readRoute } from '../../routing';
import { graph, byId, ancestors, childrenById } from '../garden/data';
import type { KnowledgeNode, KnowledgeEdge } from '../garden/domain';
import type { MacroIndexEntry, Projection } from '../garden/projection';

export interface Entry {
  id: string; label: string; type: 'folder' | 'document'; parentId: string | null;
  nodeId: string; articleId?: string; children: string[];
}
export const folderRoute = (id: string, graphView = false): GardenRoute => ({ ...gardenHome(), scopeId: id, display: graphView ? 'graph' : 'list' });
export const documentRoute = (id: string, nodeId?: string): Extract<AppRoute, { kind: 'article' }> => ({ kind: 'article', chapterId: id,
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

const citeEdge = (edge: KnowledgeEdge) => /共享知识引用|相关专题入口/.test(edge.reason ?? '');
function knowledgeIndex(): MacroIndexEntry[] {
  const label = (id: string) => byId.get(id)?.label ?? id;
  const index: MacroIndexEntry[] = [];
  for (const path of graph.learningPaths ?? []) index.push({
    id: `path:${path.id}`, tone: 'path', focusId: path.steps[0],
    text: `${path.label}：${path.steps.map(label).join(' → ')}`
  });
  for (const edge of graph.edges) if (edge.type !== 'browse_child') index.push({
    id: edge.id,
    tone: edge.type === 'recommended_before' ? 'before' : citeEdge(edge) ? 'cite' : 'related',
    focusId: edge.source,
    text: `${label(edge.source)} → ${label(edge.target)}${edge.reason ? ` · ${edge.reason}` : ''}`
  });
  return index;
}
/** Legacy canvas projection. The stable homepage atlas uses buildKnowledgeIndex instead. */
export function globalKnowledgeProjection(focusId?: string | null): Projection {
  const nodes = new Map<string, KnowledgeNode>();
  const extra = new Map<string, KnowledgeEdge>();
  const add = (id?: string | null) => {
    const node = id ? byId.get(id) : undefined;
    if (!node || node.kind === 'root') return;
    if (node.kind === 'branch' && node.id !== focusId) return;
    nodes.set(node.id, node);
  };
  for (const node of graph.nodes) if (node.kind === 'domain' || node.kind === 'hub') add(node.id);
  const linkConcept = (id: string) => {
    add(id);
    const domain = ancestors(id).find(node => node.kind === 'domain');
    if (!domain || domain.id === id || !nodes.has(id)) return;
    const key = `browse_child:${domain.id}>${id}`;
    if (!graph.edges.some(edge => edge.source === domain.id && edge.target === id) && !extra.has(key)) {
      extra.set(key, { id: key, source: domain.id, target: id, type: 'browse_child', assertionStatus: 'editorial', reason: '知识所在领域' });
    }
  };
  for (const edge of graph.edges) {
    if (edge.type === 'browse_child' || citeEdge(edge)) continue;
    linkConcept(edge.source); linkConcept(edge.target);
  }
  for (const path of graph.learningPaths ?? []) {
    let previous: string | null = null;
    for (const step of path.steps) {
      linkConcept(step);
      if (previous && previous !== step) {
        const id = `recommended_before:${previous}>${step}`;
        const exists = graph.edges.some(edge => edge.type === 'recommended_before' && edge.source === previous && edge.target === step);
        if (!exists && !extra.has(id)) extra.set(id, { id, source: previous, target: step, type: 'recommended_before', assertionStatus: 'editorial', reason: path.label });
      }
      previous = step;
    }
  }
  for (const node of graph.nodes) {
    if ((node.kind === 'concept' || node.kind === 'topic') && (node.articleBindings.length || (node.resourceRefs?.length ?? 0))) linkConcept(node.id);
  }
  if (focusId) {
    add(focusId);
    for (const ancestor of ancestors(focusId)) if (ancestor.kind !== 'branch') add(ancestor.id);
    for (const edge of graph.edges) if (edge.source === focusId || edge.target === focusId) {
      const other = edge.source === focusId ? edge.target : edge.source;
      linkConcept(other);
      for (const ancestor of ancestors(other)) if (ancestor.kind !== 'branch') add(ancestor.id);
    }
    const focus = byId.get(focusId);
    for (const id of [...(focus?.conceptRefs ?? []), ...(focus?.hubRefs ?? [])]) linkConcept(id);
    for (const child of childrenById.get(focusId) ?? []) if (child.kind !== 'branch') add(child.id);
  }
  const ids = new Set(nodes.keys());
  const edges = [...graph.edges.filter(edge => ids.has(edge.source) && ids.has(edge.target) && !citeEdge(edge)), ...extra.values()]
    .filter(edge => ids.has(edge.source) && ids.has(edge.target));
  const total = graph.nodes.filter(node => !['root', 'group', 'path', 'document'].includes(node.kind)).length;
  return {
    nodes: [...nodes.values()], edges, total, omitted: Math.max(0, total - nodes.size), index: knowledgeIndex(),
    key: `global-knowledge:${focusId ?? 'macro'}:${nodes.size}:${edges.length}`, atlas: true, layer: 'atlas'
  };
}
