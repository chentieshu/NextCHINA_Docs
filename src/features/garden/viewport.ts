import type { Viewport } from '@xyflow/react';
const memory = new Map<string, Viewport>();
const key = 'nextchina:garden-viewports:v1';
export function savedViewport(id: string): Viewport | undefined {
  if (memory.has(id)) return memory.get(id);
  try {
    const value = JSON.parse(sessionStorage.getItem(key) ?? '{}')[id];
    if (value && [value.x, value.y, value.zoom].every(Number.isFinite) && value.zoom >= .25 && value.zoom <= 1.75 && Math.abs(value.x) < 1e6 && Math.abs(value.y) < 1e6) return value;
  } catch { /* Private browsing/storage policy must not break navigation. */ }
}
export function rememberViewport(id: string, viewport: Viewport) {
  if (![viewport.x, viewport.y, viewport.zoom].every(Number.isFinite)) return;
  if (memory.size >= 32 && !memory.has(id)) memory.delete(memory.keys().next().value!);
  memory.set(id, viewport);
  try { sessionStorage.setItem(key, JSON.stringify(Object.fromEntries(memory))); } catch { /* Memory fallback. */ }
}
