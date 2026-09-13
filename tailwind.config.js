/** @type {import('tailwindcss').Config} */

/**
 * Semantic color tokens live in themes.css as CSS custom properties so the 7
 * themes can swap them at runtime. They are surfaced here as Tailwind colors so
 * components write `bg-surface-primary` instead of
 * `bg-[var(--er-surface-primary)]`.
 */
const token = (name) => `var(--er-${name})`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    /**
     * The radius, shadow and type scales below REPLACE Tailwind's defaults
     * rather than extending them. Collapsing the scale at the source
     * normalizes every existing call site at once: `rounded-lg` and
     * `rounded-xl` now resolve to the same 6px card radius, so the six radii
     * previously in use become three without touching 155 files.
     */
    borderRadius: {
      none: '0',
      sm: '3px',
      DEFAULT: '4px', // controls, chips, inputs
      md: '4px',
      lg: '6px', // cards, panels
      xl: '6px',
      '2xl': '8px', // the largest surface we allow
      '3xl': '8px',
      full: '9999px',
    },

    /**
     * Flat design earns depth from a border first and a shadow only for layers
     * that genuinely float. `shadow`/`sm`/`md` are therefore a hairline rather
     * than a blur; only overlays and modals cast real shadows.
     */
    boxShadow: {
      none: 'none',
      sm: `0 0 0 1px ${token('border-subtle')}`,
      DEFAULT: `0 0 0 1px ${token('border-subtle')}`,
      md: `0 0 0 1px ${token('border-subtle')}`,
      lg: '0 4px 12px -2px rgba(0, 0, 0, 0.35)', // overlay: dropdowns, popovers
      xl: '0 4px 12px -2px rgba(0, 0, 0, 0.35)',
      '2xl': '0 16px 40px -8px rgba(0, 0, 0, 0.55)', // modal
      inner: 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.25)',
      /** drag lift — the one place a moving shadow communicates real state */
      drag: '0 8px 20px -4px rgba(0, 0, 0, 0.5)',
    },

    fontSize: {
      /** metadata: vote counts, category chips, timestamps */
      micro: ['0.6875rem', { lineHeight: '1rem' }], // 11px
      /** labels, secondary UI text */
      xs: ['0.75rem', { lineHeight: '1.125rem' }], // 12px
      /** body — card titles, list content */
      sm: ['0.8125rem', { lineHeight: '1.25rem' }], // 13px
      /** emphasis — section headers inside panels */
      base: ['0.9375rem', { lineHeight: '1.375rem' }], // 15px
      lg: ['1.0625rem', { lineHeight: '1.5rem' }], // 17px
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '1.875rem' }], // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      /** display only — the confirmation glyph on the sorter's completion screen */
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    },

    extend: {
      colors: {
        surface: {
          primary: token('surface-primary'),
          secondary: token('surface-secondary'),
          tertiary: token('surface-tertiary'),
          accent: token('surface-accent'),
          bar: token('surface-bar'),
          dark: token('surface-dark'),
          medium: token('surface-medium'),
          light: token('surface-light'),
        },
        content: {
          primary: token('text-primary'),
          secondary: token('text-secondary'),
          tertiary: token('text-tertiary'),
          muted: token('text-muted'),
          subtle: token('text-subtle'),
        },
        line: {
          lightest: token('border-lightest'),
          lighter: token('border-lighter'),
          DEFAULT: token('border-default'),
          medium: token('border-medium'),
          darker: token('border-darker'),
          primary: token('border-primary'),
          secondary: token('border-secondary'),
          tertiary: token('border-tertiary'),
          subtle: token('border-subtle'),
        },
        brand: {
          DEFAULT: token('button-primary'),
          hover: token('button-primary-hover'),
          interactive: token('interactive-primary'),
        },
        accent: {
          blue: token('accent-blue'),
          success: token('accent-success'),
          error: token('accent-error'),
        },
        focusring: token('focus-ring'),
      },

      fontFamily: {
        sans: [
          'Inter var',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: ['source-code-pro', 'Menlo', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
      },

      /** One easing curve and three durations for the whole app. */
      transitionDuration: {
        fast: '120ms',
        DEFAULT: '180ms',
        base: '180ms',
        slow: '260ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)',
        out: 'cubic-bezier(0.2, 0, 0, 1)',
      },

      ringColor: {
        DEFAULT: token('focus-ring'),
      },
    },
  },
  plugins: [],
};
