/* eslint-disable no-console -- this is the single sanctioned wrapper around console */
/**
 * Centralized application logger.
 *
 * Debug-level output (`log`/`debug`/`info`) is suppressed in production builds so
 * shipped bundles stay quiet, while `warn`/`error` always surface so real problems
 * remain visible in the field. Prefer this over calling `console.*` directly.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) console.log(...args);
  },
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
