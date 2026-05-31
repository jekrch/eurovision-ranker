import { useEffect, useRef } from 'react';

import { THEME_OPTIONS, THEME_SURFACE_COLORS } from '../components/modals/config/DisplayTab';
import { useAppDispatch, useAppSelector } from './stateHooks';
import { setShowUnranked } from '../redux/rootSlice';
import { AppDispatch, AppState } from '../redux/store';

/** Resolve the dark surface color for the active theme (falling back to default). */
function resolveSurfaceColor(theme: string): string {
    const effectiveTheme = (theme && theme !== 'ab')
        ? theme
        : THEME_OPTIONS.find(t => t.default)?.code || '';

    return THEME_SURFACE_COLORS[effectiveTheme]
        ?? THEME_SURFACE_COLORS[THEME_OPTIONS.find(t => t.default)?.code || ''];
}

export function useThemeEffect() {
    const theme = useAppSelector(state => state.theme);
    const dispatch: AppDispatch = useAppDispatch();
    const showUnranked = useAppSelector((state: AppState) => state.showUnranked);
    const isInitialMount = useRef(true);
    const isToggling = useRef(false);
    const savedShowUnranked = useRef(showUnranked);

    useEffect(() => {
        if (!isToggling.current) {
            savedShowUnranked.current = showUnranked;
        }
    }, [showUnranked]);

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

        const doToggle = () => {
            const restoreValue = savedShowUnranked.current;
            isToggling.current = true;
            dispatch(setShowUnranked(!restoreValue));
            requestAnimationFrame(() => {
                dispatch(setShowUnranked(restoreValue));
                isToggling.current = false;
            });
        };

        if (isInitialMount.current) {
            isInitialMount.current = false;
            queueMicrotask(() => {
                doToggle();
            });
        } else {
            doToggle();
        }
    }, [theme]);
}
