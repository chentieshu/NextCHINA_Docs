import type { RefObject } from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';

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
