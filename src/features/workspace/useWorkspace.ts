import type { RefObject } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { AppRoute } from '../../routing';
import { readRoute, routeUrl } from '../../routing';
import { routeKey } from './model';
export interface WorkspaceTab { key: string; route: AppRoute; }
const STORAGE = 'nextchina-workspace-tabs-v1';
const validStoredRoute = (value: unknown): AppRoute | null => {
  if (typeof value !== 'string' || value.length > 2400 || !value.startsWith('?')) return null;
  const route = readRoute(value); return route.kind === 'home' ? null : route;
};
export function useWorkspaceTabs(route: AppRoute, navigate: (route: AppRoute) => void) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE) ?? '[]');
      if (!Array.isArray(saved)) return [];
      const unique = new Map<string, WorkspaceTab>();
      for (const value of saved.slice(-24)) { const r = validStoredRoute(value); if (r) unique.set(routeKey(r), { key: routeKey(r), route: r }); }
      return [...unique.values()];
    } catch { return []; }
  });
  const currentKey = routeKey(route);
  useEffect(() => {
    setTabs(previous => {
      if (previous.some(tab => tab.key === currentKey)) return previous.map(tab => tab.key === currentKey ? { key: currentKey, route } : tab);
      const keep = route.kind === 'garden' && route.display !== 'graph' ? previous.filter(tab => !tab.key.startsWith('folder:')) : previous;
      return [...keep, { key: currentKey, route }];
    });
  }, [route, currentKey]);
  useEffect(() => { try { sessionStorage.setItem(STORAGE, JSON.stringify(tabs.slice(-24).map(tab => routeUrl(tab.route)))); } catch { /* Session-only UI remains usable. */ } }, [tabs]);
  useEffect(() => {
    const row = document.querySelector<HTMLElement>('.ws-tabs .ws-tab[data-active="true"]');
    const host = row?.parentElement;
    if (!row || !host) return;
    if (row.offsetLeft < host.scrollLeft) host.scrollLeft = row.offsetLeft;
    else if (row.offsetLeft + row.offsetWidth > host.scrollLeft + host.clientWidth) host.scrollLeft = row.offsetLeft + row.offsetWidth - host.clientWidth;
  }, [currentKey, tabs.length]);
  const closeTab = (key: string) => {
    const index = tabs.findIndex(tab => tab.key === key); const remaining = tabs.filter(tab => tab.key !== key);
    const next: WorkspaceTab[] = remaining.length ? remaining : [{key: 'article:overview',route: {kind:'home'}}];
    if (key === currentKey) navigate(next[Math.min(Math.max(0, index - 1), next.length-1)].route);
    setTabs(next);
  };
  return { tabs, currentKey, closeTab };
}

export function useOverlayFocus(open: boolean, ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const callback = useRef(onClose); callback.current = onClose;
  useEffect(() => {
    if (!open) return;
    const origin = document.activeElement as HTMLElement | null;
    const focusable = () => [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href],[tabindex="0"]') ?? [])].filter(node => node.getClientRects().length);
    focusable()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); callback.current(); }
      if (event.key !== 'Tab') return;
      const list = focusable(), first = list[0], last = list.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !ref.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !ref.current?.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', key, true);
    return () => { document.removeEventListener('keydown', key, true); if (origin?.isConnected) origin.focus({ preventScroll: true }); };
  }, [open, ref]);
}
export function useTheme() {
  const [light, setLight] = useState(() => { try { return localStorage.getItem('nextchina-theme') !== 'dark'; } catch { return true; } });
  useEffect(() => {
    const theme = light ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme; document.body.dataset.theme = theme; document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', light ? '#ffffff' : '#18181b');
    try { localStorage.setItem('nextchina-theme', theme); } catch { /* Theme without storage. */ }
  }, [light]);
  return [light, useCallback(() => setLight(value => !value), [])] as const;
}
