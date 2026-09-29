import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import type { Store } from '../../core/store/store';

export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (
      !Object.prototype.hasOwnProperty.call(b, k) ||
      !Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Subscribes to a slice of a store. Re-renders only when the selected value changes
 * (by `isEqual`, `Object.is` by default).
 */
export function useStoreSelector<S, T>(
  store: Store<S>,
  selector: (state: S) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const cache = useRef<{ state: S; selector: (state: S) => T; value: T } | null>(null);
  const selectorRef = useRef(selector);
  const equalRef = useRef(isEqual);
  selectorRef.current = selector;
  equalRef.current = isEqual;

  const getSnapshot = () => {
    const state = store.getState();
    const sel = selectorRef.current;
    const c = cache.current;
    if (c && c.state === state && c.selector === sel) return c.value;
    const value = sel(state);
    if (c && equalRef.current(c.value, value)) {
      cache.current = { state, selector: sel, value: c.value };
      return c.value;
    }
    cache.current = { state, selector: sel, value };
    return value;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

/** Returns the previous array when the new one has the same items, so memo deps stay stable. */
export function useStableArray<T>(value: readonly T[] | undefined): readonly T[] | undefined {
  const ref = useRef(value);
  if (!shallowEqual(ref.current, value)) ref.current = value;
  return ref.current;
}

export function useStableObject<T extends object>(value: T | undefined): T | undefined {
  const ref = useRef(value);
  if (!shallowEqual(ref.current, value)) ref.current = value;
  return ref.current;
}

/** Keeps a callback's identity stable while always calling its latest version. */
export function useLatestCallback<A extends unknown[], R>(fn: ((...args: A) => R) | undefined): (...args: A) => R | undefined {
  const ref = useRef(fn);
  ref.current = fn;
  const stable = useRef((...args: A) => ref.current?.(...args));
  return stable.current;
}
