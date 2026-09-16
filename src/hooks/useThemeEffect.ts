import { useEffect } from 'react';

import { useAppSelector } from './stateHooks';
import { THEME_OPTIONS } from '../components/modals/config/DisplayTab';

const DEFAULT_THEME_CODE = THEME_OPTIONS.find((t) => t.default)?.code || '';

/**
 * Resolve the palette a theme code renders with. 'ab' (Auroral) layers its own
 * background over the default palette instead of defining one.
 *
 * Mirrored by the pre-paint script in index.html; keep the two in sync.
 */
function resolveThemeCode(theme: string): string {
  return theme && theme !== 'ab' ? theme : DEFAULT_THEME_CODE;
}

export function useThemeEffect() {
  const theme = useAppSelector((state) => state.root.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveThemeCode(theme));

    // The page background is painted from --er-surface-secondary in CSS, so it
    // follows the attribute above on its own. The browser chrome color lives
    // outside CSS and has to be handed the resolved value.
    const surface = getComputedStyle(document.documentElement)
      .getPropertyValue('--er-surface-secondary')
      .trim();

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && surface) {
      meta.setAttribute('content', surface);
    }

    // The iOS Safari bottom toolbar samples the dark fill of the EditNav bar
    // and caches that tint until the sampled DOM actually changes. Updating
    // the colors above repaints it but doesn't invalidate iOS's cached
    // sample. Remounting ONLY the EditNav (via a theme-derived `key` on its
    // wrapper in App.tsx) replaces that exact node, forcing iOS to re-sample
    // — while the main list is left completely untouched (no glitchy reload).
  }, [theme]);
}
