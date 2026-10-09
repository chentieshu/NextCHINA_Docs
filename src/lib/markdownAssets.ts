import generated from '../generated/markdown-assets.json';
import { renderAssetKey } from '../utils/renderAssetKey.js';
export interface DiagramDrawing { svg: string; width: number; height: number; id: string; }
interface DiagramEntry { source: string; light: DiagramDrawing; dark: DiagramDrawing; }
interface CodeEntry { source: string; language: string; html: string; }
const assets = generated as unknown as { diagrams: Record<string, DiagramEntry>; code: Record<string, CodeEntry> };
export function staticDiagram(chart: string, light: boolean) {
  const source = chart.trim(), entry = assets.diagrams[renderAssetKey(source)];
  return entry?.source === source ? entry[light ? 'light' : 'dark'] : undefined;
}
export function staticCode(source: string, language: string) {
  const entry = assets.code[renderAssetKey(`${language}\0${source}`)];
  return entry?.source === source && entry.language === language ? entry.html : undefined;
}
