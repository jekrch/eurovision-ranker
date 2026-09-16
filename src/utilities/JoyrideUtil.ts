// sessionStorage flag set when a tour exits so the reloaded app can skip the
// welcome overlay and land the user directly in the select view.
export const SKIP_WELCOME_AFTER_TOUR_KEY = 'er-skip-welcome-after-tour';

/**
 * How much room the spotlight leaves around the element a step points at. Tight
 * enough that a small target (an icon, a pill button) reads as *that* element
 * rather than the region around it.
 */
export const JOYRIDE_SPOTLIGHT_PADDING = 8;

/**
 * Floater sits between the tooltip and its target: it owns the arrow and the
 * gap. A slightly wider, shorter arrow matches the tooltip's rounded corner
 * better than the default spike.
 */
export const joyrideFloaterProps = {
  styles: {
    arrow: {
      length: 9,
      spread: 18,
    },
  },
  options: {
    preventOverflow: {
      // Joyride keeps a tooltip inside the *scroll parent* of the element it
      // points at. The app's content area scrolls and is taller than the
      // window, so a tooltip anchored to something tall - a full-height column,
      // a panel that fills the screen - was free to sit below the bottom edge
      // and out of sight. The visible viewport is the boundary that matters.
      boundariesElement: 'viewport' as const,
    },
  },
};

export const JOYRIDE_Z_INDEX = 10000;

/**
 * Joyride stacks its tooltip at the base z-index plus 100, so anything that has
 * to sit above the tour - the exit prompt - needs more headroom than the base
 * alone suggests.
 */
export const JOYRIDE_TOOLTIP_Z_INDEX = JOYRIDE_Z_INDEX + 100;

/**
 * The shared look for both guided tours.
 *
 * Joyride styles its tooltip with inline styles, so everything expressible as a
 * flat style object belongs here. The parts that need a selector - button hover
 * and focus, the per-step entrance - are in index.css under "GUIDED TOUR".
 */
export const joyrideOptions = {
  options: {
    zIndex: JOYRIDE_Z_INDEX,
    width: 348,
    arrowColor: 'var(--er-surface-secondary)',
    backgroundColor: 'var(--er-surface-secondary)',
    primaryColor: 'var(--er-button-primary)',
    textColor: 'var(--er-text-secondary)',
    overlayColor: 'var(--er-overlay-heavy)',
  },
  overlay: {
    height: '100vh',
    backgroundColor: 'var(--er-overlay-heavy)',
  },
  spotlight: {
    borderRadius: '10px',
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
  },
  tooltipContainer: {
    color: 'var(--er-text-secondary)',
    // sentences, not labels - ranged left they stay easy to scan as the tooltip
    // moves around the screen
    textAlign: 'left' as const,
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
  buttonNext: {
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
    color: 'var(--er-text-subtle)',
    height: '10px',
    width: '10px',
    padding: '14px',
  },
};
