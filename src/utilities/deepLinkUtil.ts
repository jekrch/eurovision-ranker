import { SKIP_WELCOME_AFTER_TOUR_KEY } from './JoyrideUtil';
import { categoryRankingsExist } from './CategoryUtil';

// Pure predicates over window.location / sessionStorage used on app boot to
// decide the initial view and whether the welcome overlay should be shown.
// Extracted from App.tsx so the boot logic reads as composition.

/**
 * Whether the app was just reloaded as a result of exiting a tour. When true,
 * we skip the welcome overlay and send the user straight to the select view.
 * This only peeks at the flag — the boot effect clears it once consumed.
 */
export function cameFromTour(): boolean {
    try {
        return sessionStorage.getItem(SKIP_WELCOME_AFTER_TOUR_KEY) === '1';
    } catch {
        return false;
    }
}

/**
 * Determines whether any rankings are set in the url
 */
export function areRankingsSet(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const rParam = urlParams.get('r');

    if (rParam !== null && rParam !== '') {
        return true;
    }

    return categoryRankingsExist(urlParams);
}

// Auth deep-links (?signup=beta, /complete-registration, /reset-password) should
// skip the welcome overlay — otherwise it covers the AuthModal and a click on the
// overlay outside the auth modal can close the auth modal too.
export function isAuthDeepLink(): boolean {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    return (
        path.endsWith('/complete-registration') ||
        path.endsWith('/reset-password') ||
        path.endsWith('/join-group') ||
        params.get('signup') === 'beta'
    );
}

export function hasIdParam(): boolean {
    return !!new URLSearchParams(window.location.search).get('id');
}

// ?quiz=<code> opens the quiz modal on boot — skip the welcome overlay so it
// doesn't sit on top of (and swallow clicks to) the quiz.
export function hasQuizCode(): boolean {
    return !!new URLSearchParams(window.location.search).get('quiz');
}

// Invite deep-links come in two shapes:
//   /join-group?token=…  (the canonical link the API builds)
//   ?join=…              (query-only fallback for gh-pages-style hosts
//                          that don't rewrite unknown paths to index.html)
export function hasJoinToken(): boolean {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    return (path.endsWith('/join-group') && !!params.get('token')) || !!params.get('join');
}
