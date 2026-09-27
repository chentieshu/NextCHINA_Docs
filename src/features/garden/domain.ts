export type NodeKind = 'root' | 'domain' | 'topic' | 'concept' | 'hub' | 'branch';
export type RelationKind = 'browse_child' | 'related' | 'recommended_before';
export interface ArticleBinding { articleId: string; coverage: string; }
export interface ResourceRef { articleId: string; role: string; }
export interface HubResource {
  articleId: string; datasetId?: string; subjectRole?: string; snapshotDate?: string | null;
  metric?: string | null; sourceId?: string | null; warning?: string | null; rowCount?: number; sourceFile?: string;
}
export interface KnowledgeNode {
  id: string; label: string; kind: NodeKind; parentId: string | null;
  contentStatus: string; evidenceStatus: string; articleBindings: ArticleBinding[];
  summary: string | null; group?: string;
  hubId?: string; outlinePath?: string; conceptRefs?: string[]; hubRefs?: string[]; hubEntries?: string[];
  resourceRefs?: ResourceRef[]; embeddedArticleId?: string; microscopeId?: string | null;
}
export interface KnowledgeEdge {
  id: string; source: string; target: string; type: RelationKind;
  assertionStatus: string; reason?: string;
}
export interface GardenGraph {
  schemaVersion: number; title: string; scopeNote: string;
  nodes: KnowledgeNode[]; edges: KnowledgeEdge[];
  groups: { id: string; label: string }[];
  learningPaths: { id: string; label: string; status: string; steps: string[] }[];
  stats: { domains: number; topics: number; concepts: number; nodes: number; articleBindings: number; learningPaths: number; hubs?: number; branches?: number };
  hubResources?: Record<string, HubResource>;
}
export const kindLabel: Record<NodeKind, string> = { root: '全景', domain: '领域', topic: '专题', concept: '概念', hub: '专题中心', branch: '专题分支' };
export const coverageLabel: Record<string, string> = { overview: '原理总览', catalogue: '产品目录', snapshot: '评测快照', prices: 'API 报价', methodology: '方法教程', orientation: '阅读指南' };
