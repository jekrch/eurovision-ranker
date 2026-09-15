import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['**/*.test.tsx', '**/*.test.ts'],
    setupFiles: './src/test/setup.ts',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      // Keep the baseline focused on files that are actually exercised by tests
      // today, so the thresholds below act as a ratchet we raise as coverage
      // grows rather than a wall of 0%.
      // Vitest v4 removed `coverage.all` and made an explicit `include` glob
      // force every matching file into the report; omitting `include` restores
      // the "only count files imported by the test run" behaviour we rely on.
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/setupTests.ts',
        'src/test/**',
        'src/data/**',
      ],
      thresholds: {
        // Baseline floor: measured 2026-09-13
        lines: 93,
        functions: 92,
        branches: 83,
        statements: 92,
      },
    },
  },
})