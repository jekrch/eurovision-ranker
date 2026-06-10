import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['**/*.test.tsx', '**/*.test.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Only the source tree counts toward coverage. `all: false` keeps the
      // baseline focused on files that are actually exercised by tests today,
      // so the thresholds below act as a ratchet we raise as coverage grows
      // (see Phase 6 of CODE_QUALITY_PLAN.md) rather than a wall of 0%.
      all: false,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/setupTests.ts',
        'src/data/**',
      ],
      // Baseline floor (measured 2026-06-09) — never let coverage regress below
      // where it is now. Raise these as more tests land.
      thresholds: {
        lines: 50,
        functions: 38,
        branches: 70,
        statements: 50,
      },
    },
  },
})