import type { KnowledgeNode } from './domain';

export const MACRO_CARD = { width: 168, height: 76 } as const;
export const isMacroProjection = (key: string) => key.startsWith('global-macro:');

/** Stable reading positions, not a scientific distance or a new graph.
 * A compact serpentine grid keeps the entire desktop overview legible. The
 * overview needs no worker; the full knowledge graph retains its ELK layout.
 */
export function macroGridLayout(nodes: KnowledgeNode[]) {
  const columns = 6;
  return nodes.map((node, index) => {
    const row = Math.floor(index / columns);
    const column = row % 2 ? columns - 1 - index % columns : index % columns;
    return { id: node.id, x: column * (MACRO_CARD.width + 28), y: row * (MACRO_CARD.height + 32) };
  });
}
