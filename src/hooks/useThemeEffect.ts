import { useEffect } from 'react';

import { THEME_OPTIONS, THEME_SURFACE_COLORS } from '../components/modals/config/DisplayTab';
import { useAppDispatch, useAppSelector } from './stateHooks';
import { setShowUnranked } from '../redux/rootSlice';
import { AppDispatch, AppState } from '../redux/store';

export function useThemeEffect() {
    const theme = useAppSelector(state => state.theme);
    const dispatch: AppDispatch = useAppDispatch();
    const showUnranked = useAppSelector((state: AppState) => state.showUnranked);

    useEffect(() => {
        const effectiveTheme = (theme && theme !== 'ab')
            ? theme
            : THEME_OPTIONS.find(t => t.default)?.code || '';

        document.documentElement.setAttribute('data-theme', effectiveTheme);

        const color = THEME_SURFACE_COLORS[effectiveTheme]
            ?? THEME_SURFACE_COLORS[THEME_OPTIONS.find(t => t.default)?.code || ''];

        document.body.style.backgroundColor = color;

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute('content', color);
        }

        // Force a React re-render cycle similar to the view switch
        dispatch(setShowUnranked(!showUnranked));
        requestAnimationFrame(() => {
            dispatch(setShowUnranked(showUnranked));
        });
    }, [theme]);
}