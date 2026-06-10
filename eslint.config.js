import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Things ESLint should never look at.
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'stats.html',
      'public/**',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
    ],
  },

  // Base recommended rule sets for JS + TS.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Application source.
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
    rules: {
      // --- React / hooks ---
      'react/react-in-jsx-scope': 'off', // new JSX transform — no React import needed
      'react/prop-types': 'off', // types come from TypeScript
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // --- Ratcheted to error (counts are already 0 in app code) ---
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // --- Unused vars: allow the `_`-prefix escape hatch (see Phase 2 notes) ---
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // --- Import hygiene / ordering ---
      'import/order': [
        'warn',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'warn',
      'import/newline-after-import': 'warn',
    },
  },

  // Tests + setup: looser rules (mocks, fixtures, console probes).
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/setupTests.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
      // Tests intentionally interleave `vi.mock()` with imports (mock-before-SUT),
      // which conflicts with strict import ordering.
      'import/order': 'off',
    },
  },

  // Must come last: turns off stylistic rules that conflict with Prettier.
  prettier,
);
