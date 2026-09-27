import { useCallback, useEffect, useState } from 'react';

export interface GardenRoute {
  kind: 'garden';
  scopeId: string;
  nodeId: string | null;
  mode: 'atlas' | 'explore';
  display: 'auto' | 'graph' | 'list';
}
export type AppRoute = { kind: 'home' } | GardenRoute | {
  kind: 'article'; chapterId: string; returnTo?: string;
};
export const gardenHome = (): GardenRoute => ({ kind: 'garden', scopeId: 'root:ai', nodeId: null, mode: 'atlas', display: 'auto' });
const bounded = (value: string | null, fallback: string) => value && value.length <= 160 ? value : fallback;

function readGarden(params: URLSearchParams): GardenRoute {
  return { kind: 'garden', scopeId: bounded(params.get('scope'), 'root:ai'),
    nodeId: params.has('node') ? bounded(params.get('node'), '') || null : null,
    mode: params.get('mode') === 'explore' ? 'explore' : 'atlas',
    display: params.get('display') === 'graph' ? 'graph' : params.get('display') === 'list' ? 'list' : 'auto' };
}
/** A return target is a garden state, never an arbitrary URL or executable value. */
export function safeGardenReturn(value: string | null): string | undefined {
  if (!value || value.length > 1800 || !value.startsWith('?')) return undefined;
  const params = new URLSearchParams(value.slice(1));
  return params.get('view') === 'garden' ? routeUrl(readGarden(params)) : undefined;
}
export function readRoute(search: string): AppRoute {
  const params = new URLSearchParams(search);
  if (params.get('view') === 'garden') return readGarden(params);
  if (params.get('view') === 'article') return { kind: 'article', chapterId: bounded(params.get('article'), ''), returnTo: safeGardenReturn(params.get('return')) };
  return { kind: 'home' };
}
export function routeUrl(route: AppRoute): string {
  if (route.kind === 'home') return '?';
  const params = new URLSearchParams({ view: route.kind });
  if (route.kind === 'garden') {
    params.set('scope', route.scopeId);
    if (route.nodeId) params.set('node', route.nodeId);
    if (route.mode !== 'atlas') params.set('mode', route.mode);
    if (route.display !== 'auto') params.set('display', route.display);
  } else {
    params.set('article', route.chapterId);
    const back = safeGardenReturn(route.returnTo ?? null);
    if (back) params.set('return', back);
  }
  return `?${params}`;
}
export function useAppRoute() {
  const [route, setRoute] = useState<AppRoute>(() => readRoute(window.location.search));
  useEffect(() => {
    const onPop = () => setRoute(readRoute(window.location.search));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = useCallback((next: AppRoute, replace = false) => {
    const url = routeUrl(next);
    if (url !== window.location.search) window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
    setRoute(next);
  }, []);
  return [route, navigate] as const;
}
