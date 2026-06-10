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
      // Keep the baseline focused on files that are actually exercised by tests
      // today, so the thresholds below act as a ratchet we raise as coverage
      // grows (see Phase 6 of CODE_QUALITY_PLAN.md) rather than a wall of 0%.
      // Vitest v4 removed `coverage.all` and made an explicit `include` glob
      // force every matching file into the report; omitting `include` restores
      // the "only count files imported by the test run" behaviour we rely on.
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/setupTests.ts',
        'src/data/**',
      ],
      // Baseline floor (measured 2026-06-09 under vitest v4 / coverage-v8's
      // ast-v8-to-istanbul remapper, which counts branches more strictly than
      // the v2 provider these were first set against). Never let coverage
      // regress below where it is now; raise these as more tests land.
      thresholds: {
        lines: 48,
        functions: 40,
        branches: 33,
        statements: 47,
      },
    },
  },
})