import { useEffect } from 'react';

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
 * toolbar and CACHES that tint, only re-sampling on a reflow/scroll of the
 * region. After a theme change the safe-area backdrops (.normal-bg::after /
 * .edit-nav-bg) already hold the new --er-surface-dark color, but iOS keeps
 * showing the stale tint until we invalidate its sample.
 *
 * This used to be forced by toggling `showUnranked` off→on, which reflows the
 * whole app — re-rendering the ranked list and unmounting/remounting EditNav
 * (the glitchy list "reload" + EditNav re-animation). Instead, toggle a
 * transient class that nudges ONLY those fixed backdrop elements with a
 * sub-pixel transform: that repaints the exact region iOS samples, forces the
 * re-sample, and touches no React state, so the list and EditNav stay put.
 *
 * If the iOS bar still doesn't re-tint on a real device, escalate the nudge in
 * index.css (e.g. change height instead of transform) — see .ios-safe-area-repaint.
 */
function forceSafeAreaRepaint() {
    const root = document.documentElement;
    root.classList.add('ios-safe-area-repaint');
    // Flush the class as its own paint, then drop it next frame.
    void root.offsetHeight;
    requestAnimationFrame(() => {
        root.classList.remove('ios-safe-area-repaint');
    });
}

export function useThemeEffect() {
    const theme = useAppSelector(state => state.theme);

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

        forceSafeAreaRepaint();
    }, [theme]);
}
