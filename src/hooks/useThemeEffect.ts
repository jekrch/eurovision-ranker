import { useEffect, useRef } from 'react';

import { THEME_OPTIONS, THEME_SURFACE_COLORS } from '../components/modals/config/DisplayTab';
import { useAppSelector } from './stateHooks';

/** Resolve the dark surface color for the active theme (falling back to default). */
function resolveSurfaceColor(theme: string): string {
    const effectiveTheme = (theme && theme !== 'ab')
        ? theme
        : THEME_OPTIONS.find(t => t.default)?.code || '';

    return THEME_SURFACE_COLORS[effectiveTheme]
        ?? THEME_SURFACE_COLORS[THEME_OPTIONS.find(t => t.default)?.code || ''];
}

/**
 * iOS Safari samples the page content painted behind its translucent bottom
 * toolbar and CACHES that tint, only re-sampling when the geometry of that
 * region actually changes (a real layout reflow — not a GPU-only transform, and
 * not a same-frame add/remove the compositor coalesces away). After a theme
 * change the safe-area backdrops (.normal-bg::after / .edit-nav-bg) already hold
 * the new --er-surface-dark color, but iOS keeps showing the stale tint.
 *
 * This used to be forced by toggling `showUnranked` off→on, which reflows the
 * whole app — re-rendering the ranked list and unmounting/remounting EditNav
 * (the glitchy list "reload" + EditNav re-animation). That worked only because
 * it was a real, persisting height change in the sampled zone.
 *
 * So we reproduce just that: flip a PERSISTENT class on each theme change that
 * bumps the height of the backdrops iOS samples by a few (invisible) px. Each
 * switch leaves the sampled region a different height than before, so iOS
 * re-samples — with zero React state change, so the list and EditNav stay put.
 */
function forceSafeAreaRepaint(repaintToggle: { current: boolean }) {
    repaintToggle.current = !repaintToggle.current;
    document.documentElement.classList.toggle(
        'ios-safe-area-repaint',
        repaintToggle.current,
    );
}

export function useThemeEffect() {
    const theme = useAppSelector(state => state.theme);
    const repaintToggle = useRef(false);

    useEffect(() => {
        const effectiveTheme = (theme && theme !== 'ab')
            ? theme
            : THEME_OPTIONS.find(t => t.default)?.code || '';

        document.documentElement.setAttribute('data-theme', effectiveTheme);

        const color = resolveSurfaceColor(theme);

        document.body.style.backgroundColor = color;

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', color);
        }

        forceSafeAreaRepaint(repaintToggle);
    }, [theme]);
}
