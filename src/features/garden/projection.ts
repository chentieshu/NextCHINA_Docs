import type { KnowledgeNode, KnowledgeEdge } from './domain';

export type GraphLayer = 'atlas';

export interface MacroIndexEntry {
  id: string;
  tone: 'before' | 'related' | 'cite' | 'path';
  text: string;
  focusId?: string;
}

/**
 * Projection is the visible window onto the single canonical AI knowledge graph.
 * Search/focus may change which nodes are visible, but never creates a second graph.
 */
export interface Projection {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  total: number;
  omitted: number;
  key: string;
  atlas: true;
  layer?: GraphLayer;
  index?: MacroIndexEntry[];
}
