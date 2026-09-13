/**
 * Global test environment shims.
 *
 * jsdom doesn't implement ResizeObserver, which anchored/floating UI such as
 * the dropdown menus observes as soon as it mounts. A no-op stub keeps any
 * component that renders one testable.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
