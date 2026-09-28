import { useEffect, useLayoutEffect, useState, useCallback } from 'react';

const STORAGE = 'nextchina-theme';
type Theme = 'light' | 'dark';
function readPreference(): Theme | null {
  try { const value = localStorage.getItem(STORAGE); return value === 'light' || value === 'dark' ? value : null; }
  catch { return null; }
}

/** The bootstrap sets the first frame; this hook owns live/system/cross-tab changes. */
export function useTheme() {
  const [preference, setPreference] = useState<Theme | null>(readPreference);
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const light = preference ? preference === 'light' : !systemDark;
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const system = () => setSystemDark(media.matches);
    const storage = (event: StorageEvent) => { if (event.key === STORAGE || event.key === null) setPreference(readPreference()); };
    media.addEventListener('change', system); window.addEventListener('storage', storage);
    return () => { media.removeEventListener('change', system); window.removeEventListener('storage', storage); };
  }, []);
  useLayoutEffect(() => {
    const theme = light ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    // Read the actual stylesheet palette, not a second JS palette.
    const background = getComputedStyle(document.documentElement).getPropertyValue('--page-bg').trim();
    if (background) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background);
  }, [light]);
  const toggle = useCallback(() => {
    const next: Theme = light ? 'dark' : 'light';
    setPreference(next);
    try { localStorage.setItem(STORAGE, next); } catch { /* Session-only override remains usable. */ }
  }, [light]);
  return [light, toggle] as const;
}

/** At scale=1 follow the visual viewport (e.g. keyboard). Never cancel browser zoom. */
export function useWorkspaceViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const style = document.documentElement.style;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!viewport || Math.abs(viewport.scale - 1) > .01) {
          style.removeProperty('--ws-visible-height'); style.removeProperty('--ws-visible-top'); return;
        }
        const top = Math.max(0, viewport.offsetTop);
        const height = Math.max(1, Math.min(viewport.height, window.innerHeight - top));
        style.setProperty('--ws-visible-height', `${height}px`);
        style.setProperty('--ws-visible-top', `${top}px`);
      });
    };
    update();
    window.addEventListener('resize', update);
    viewport?.addEventListener('resize', update); viewport?.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame); window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update); viewport?.removeEventListener('scroll', update);
      style.removeProperty('--ws-visible-height'); style.removeProperty('--ws-visible-top');
    };
  }, []);
}
