import { byId, childrenById, graph } from './data';
import type { KnowledgeNode, ResourceRef } from './domain';

export const isHubNode = (node: KnowledgeNode | undefined): boolean => Boolean(node && (node.kind === 'hub' || node.kind === 'branch'));
export function hubFor(node: KnowledgeNode) { return byId.get(node.hubId ?? '') ?? null; }
export function hubEntries(node: KnowledgeNode) { return (node.hubEntries ?? []).map(id => byId.get(id)).filter((n): n is KnowledgeNode => Boolean(n)); }
export function resourcesUnder(id: string): ResourceRef[] {
  const result = new Map<string, ResourceRef>();
  const visited = new Set<string>();
  const walk = (key: string) => {
    if (visited.has(key)) return;
    visited.add(key);
    const node = byId.get(key);
    for (const resource of node?.resourceRefs ?? []) result.set(resource.articleId, resource);
    for (const child of childrenById.get(key) ?? []) if (child.kind === 'branch') walk(child.id);
  };
  walk(id); return [...result.values()];
}
export function resourceTarget(scopeId: string, articleId: string): string | null {
  const queue = [...(childrenById.get(scopeId) ?? [])];
  for (let index = 0; index < queue.length; index++) {
    const node = queue[index];
    if (node.embeddedArticleId === articleId) return node.id;
    if (node.kind === 'branch') queue.push(...(childrenById.get(node.id) ?? []));
  }
  return null;
}
export const resourceMeta = (id: string) => graph.hubResources?.[id];
export function resourceLabel(resource: ResourceRef) {
  if (resource.articleId === 'model-api-prices') return 'API 报价 · 非订阅费用';
  if (resource.articleId === 'terminal-bench') return 'Agent 系统评测 · 非裸模型榜';
  if (/snapshot|evaluation/.test(resource.role)) return '模型评测快照';
  if (/catalogue|products/.test(resource.role)) return '产品目录 · 非已核验模型绑定';
  if (/methodology/.test(resource.role)) return '创作方法 · 非实测 AI 教程';
  return '已有总览 · 非独立子章节';
}
