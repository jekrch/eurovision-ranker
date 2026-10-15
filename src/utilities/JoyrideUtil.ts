import type { FloatingOptions, Options, PartialDeep, Styles } from 'react-joyride';

// sessionStorage flag set when a tour exits so the reloaded app can skip the
// welcome overlay and land the user directly in the select view.
export const SKIP_WELCOME_AFTER_TOUR_KEY = 'er-skip-welcome-after-tour';

/**
 * How much room the spotlight leaves around the element a step points at. Tight
 * enough that a small target (an icon, a pill button) reads as *that* element
 * rather than the region around it.
 */
export const JOYRIDE_SPOTLIGHT_PADDING = 8;

export const JOYRIDE_Z_INDEX = 10000;

/**
 * Joyride stacks its tooltip one above the base z-index, so anything that has
 * to sit above the tour - the exit prompt - builds on this rather than the base.
 */
export const JOYRIDE_TOOLTIP_Z_INDEX = JOYRIDE_Z_INDEX + 1;

/**
 * The behaviour and theme both guided tours share. Steps never show a beacon
 * and never scroll the page: each step's setup puts its target on screen
 * before the tooltip arrives.
 */
export const joyrideOptions: Partial<Options> = {
  zIndex: JOYRIDE_Z_INDEX,
  width: 348,
  arrowColor: 'var(--er-surface-secondary)',
  backgroundColor: 'var(--er-surface-secondary)',
  primaryColor: 'var(--er-button-primary)',
  textColor: 'var(--er-text-secondary)',
  overlayColor: 'var(--er-overlay-heavy)',
  // a slightly wider, shorter arrow matches the tooltip's rounded corner better
  // than the default spike
  arrowSize: 9,
  arrowBase: 18,
  spotlightPadding: JOYRIDE_SPOTLIGHT_PADDING,
  spotlightRadius: 10,
  showProgress: true,
  skipBeacon: true,
  skipScroll: true,
};

/**
 * Keeps every tooltip fully on screen. Joyride places a tooltip beside its
 * target and flips it to the other side when it doesn't fit, but a target
 * taller than the window (a full-height column, a panel that fills the screen)
 * has no side with room, and the tooltip is only nudged along the edge it sits
 * on, so it ran off the top or bottom. Clamping on both axes lets it overlap
 * the target instead, and the visible viewport is the boundary rather than the
 * target's scroll parent, which can be taller than the window.
 */
export const joyrideFloatingOptions: Partial<FloatingOptions> = {
  shiftOptions: {
    crossAxis: true,
    boundary: 'clippingAncestors',
    rootBoundary: 'viewport',
  },
};

/**
 * Leaves room for the shift padding on both edges, so a tooltip with more copy
 * than the screen has height for scrolls inside itself rather than past the
 * edge. Centred steps aren't clamped by joyride at all, so this is what keeps
 * them on screen too.
 */
const TOOLTIP_MAX_HEIGHT = 'calc(100dvh - 20px)';

/**
 * The shared look for both guided tours.
 *
 * Joyride styles its tooltip with inline styles, so everything expressible as a
 * flat style object belongs here. The parts that need a selector - button hover
 * and focus, the per-step entrance, and the colours joyride paints as SVG fills
 * - are in index.css under "GUIDED TOUR".
 */
export const joyrideStyles: PartialDeep<Styles> = {
  overlay: {
    height: '100vh',
  },
  tooltip: {
    backgroundColor: 'var(--er-surface-secondary)',
    color: 'var(--er-text-secondary)',
    // the same panel vocabulary the modals use: generous radius, hairline ring,
    // and a shadow deep enough to lift it off the dimmed page
    borderRadius: '14px',
    border: '1px solid var(--er-border-subtle)',
    boxShadow: '0 18px 40px -12px rgba(0, 0, 0, 0.65)',
    padding: '16px 18px 12px',
    fontSize: '0.9rem',
    maxHeight: TOOLTIP_MAX_HEIGHT,
    overflowY: 'auto',
  },
  tooltipContainer: {
    color: 'var(--er-text-secondary)',
    // sentences, not labels - ranged left they stay easy to scan as the tooltip
    // moves around the screen
    textAlign: 'left',
    lineHeight: 1.55,
  },
  tooltipTitle: {
    color: 'var(--er-text-primary)',
    fontSize: '1rem',
  },
  tooltipContent: {
    color: 'var(--er-text-secondary)',
    padding: '2px 0 0',
  },
  tooltipFooter: {
    marginTop: '14px',
  },
  buttonPrimary: {
    backgroundColor: 'var(--er-button-primary)',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 600,
    letterSpacing: '0.01em',
    color: 'var(--er-interactive-text-light)',
  },
  buttonBack: {
    color: 'var(--er-text-muted)',
    fontSize: '0.8rem',
    padding: '8px 10px',
    marginRight: '2px',
  },
  buttonSkip: {
    color: 'var(--er-text-muted)',
    fontSize: '0.8rem',
  },
  buttonClose: {
    height: '10px',
    width: '10px',
    padding: '14px',
  },
};
