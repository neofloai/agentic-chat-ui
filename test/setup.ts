import '@testing-library/dom';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';

// The first test pays for transforming Atoms; give async queries room on a cold CI runner.
configure({ asyncUtilTimeout: 4000 });

// jsdom lacks these; Atoms' theme provider and the thread's scrolling use them.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  if (!('ResizeObserver' in window)) {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = function scrollTo() {};
}

afterEach(() => {
  cleanup();
  try {
    window.sessionStorage.clear();
    window.localStorage.clear();
  } catch {
    // storage may be unavailable in some environments
  }
});
