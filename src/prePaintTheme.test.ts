// @vitest-environment jsdom
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { describe, expect, it, beforeEach } from 'vitest';

import { THEME_OPTIONS } from './components/modals/config/DisplayTab';

const indexHtml = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../index.html'),
  'utf-8',
);

/**
 * The inline script in index.html applies the theme before the first paint, so
 * it can't import from the bundle and restates the theme codes. These tests run
 * that shipped source against the real THEME_OPTIONS so the two can't drift.
 */
const prePaintScript = (() => {
  const scripts = indexHtml.match(/<script>([\s\S]*?)<\/script>/g) ?? [];
  const match = scripts.find((s) => s.includes('THEME_CODES'));
  if (!match) {
    throw new Error('index.html is missing the pre-paint theme script');
  }
  return match.replace(/^<script>/, '').replace(/<\/script>$/, '');
})();

function applyPrePaintTheme(search: string): string | null {
  window.history.replaceState({}, '', `/${search}`);
  new Function(prePaintScript)();
  return document.documentElement.getAttribute('data-theme');
}

describe('pre-paint theme script', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('recognizes every selectable theme', () => {
    const codes = JSON.parse(
      (prePaintScript.match(/THEME_CODES = (\[[^\]]*\])/)?.[1] ?? '').replace(/'/g, '"'),
    );

    expect(codes).toEqual(THEME_OPTIONS.map((t) => t.code));
  });

  it('falls back to the theme marked default', () => {
    const defaultCode = THEME_OPTIONS.find((t) => t.default)?.code;

    expect(prePaintScript).toContain(`DEFAULT_CODE = '${defaultCode}'`);
    expect(applyPrePaintTheme('')).toBe(defaultCode);
    expect(applyPrePaintTheme('?t=')).toBe(defaultCode);
    expect(applyPrePaintTheme('?t=nonsense')).toBe(defaultCode);
  });

  it('applies the theme named in the url', () => {
    expect(applyPrePaintTheme('?t=o')).toBe('o');
    expect(applyPrePaintTheme('?t=pr')).toBe('pr');
    expect(applyPrePaintTheme('?y=2024&t=m')).toBe('m');
  });

  it('renders auroral over the default palette', () => {
    expect(applyPrePaintTheme('?t=ab')).toBe(THEME_OPTIONS.find((t) => t.default)?.code);
  });
});
