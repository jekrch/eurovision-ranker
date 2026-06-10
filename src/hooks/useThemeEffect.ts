import { useEffect } from 'react';

import { useAppSelector } from './stateHooks';
import { THEME_OPTIONS, THEME_SURFACE_COLORS } from '../components/modals/config/DisplayTab';

/** Resolve the dark surface color for the active theme (falling back to default). */
function resolveSurfaceColor(theme: string): string {
  const effectiveTheme =
    theme && theme !== 'ab' ? theme : THEME_OPTIONS.find((t) => t.default)?.code || '';

  return (
    THEME_SURFACE_COLORS[effectiveTheme] ??
    THEME_SURFACE_COLORS[THEME_OPTIONS.find((t) => t.default)?.code || '']
  );
}

export function useThemeEffect() {
  const theme = useAppSelector((state) => state.root.theme);

  useEffect(() => {
    const effectiveTheme =
      theme && theme !== 'ab' ? theme : THEME_OPTIONS.find((t) => t.default)?.code || '';

    document.documentElement.setAttribute('data-theme', effectiveTheme);

    const color = resolveSurfaceColor(theme);

    document.body.style.backgroundColor = color;

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', color);
    }

    // The iOS Safari bottom toolbar samples the dark fill of the EditNav bar
    // and caches that tint until the sampled DOM actually changes. Updating
    // the colors above repaints it but doesn't invalidate iOS's cached
    // sample. Remounting ONLY the EditNav (via a theme-derived `key` on its
    // wrapper in App.tsx) replaces that exact node, forcing iOS to re-sample
    // — while the main list is left completely untouched (no glitchy reload).
  }, [theme]);
}
