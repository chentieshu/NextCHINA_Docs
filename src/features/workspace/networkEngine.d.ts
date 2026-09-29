import type { GardenGraph } from '../garden/domain';
export interface NetworkSettings {
  structure: boolean; relations: boolean; prerequisites: boolean; references: boolean;
  colored: boolean; labels: number; nodeSize: number; lineWidth: number; lineOpacity: number;
  onlyResources: boolean; groups: string[] | null; detail: 'all' | 'overview' | 'concepts';
  focusNeighbors: boolean; wheelMode: 'zoom' | 'pan';
}
export interface NetworkStats { nodes: number; total: number; edges: number; zoom: number; }
export interface NetworkAPI {
  ready: Promise<void>;
  select(id: string | null, options?: { focus?: boolean }): void;
  configure(settings: Partial<NetworkSettings>): void;
  setPanelWidth(width: number): void;
  fit(): void; zoomIn(): void; zoomOut(): void; focus(id: string): void;
  getCamera(): { cx: number; cy: number; zoom: number };
  getLayout(): { id: string; x: number; y: number }[];
  destroy(): void;
}
export function mountKnowledgeNetwork(host: HTMLElement, graph: GardenGraph, callbacks?: {
  onSelect?: (id: string) => void; onClear?: () => void; onStats?: (stats: NetworkStats) => void;
  onReady?: () => void; onError?: (error: Error) => void;
}): NetworkAPI;
export function normalizeNetwork(graph: GardenGraph): unknown;
export function computeNetworkLayout(network: unknown, signal?: AbortSignal): Promise<unknown>;
