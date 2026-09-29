export type Listener = () => void;

export interface SetStateOptions {
  /**
   * Coalesce listener notifications to one per animation frame. The state itself updates
   * immediately, so `getState()` is always current; only re-render pressure is reduced.
   */
  batch?: boolean;
}

export interface Store<T> {
  getState(): T;
  setState(next: T | ((prev: T) => T), options?: SetStateOptions): void;
  subscribe(listener: Listener): () => void;
  /** Deliver any batched notification now. */
  flush(): void;
  /** How many listeners are subscribed (used to avoid evicting state something is showing). */
  listenerCount(): number;
}

export type Scheduler = (callback: () => void) => () => void;

export const frameScheduler: Scheduler = (callback) => {
  if (typeof requestAnimationFrame === 'function' && typeof document !== 'undefined' && !document.hidden) {
    const id = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(callback, 16);
  return () => clearTimeout(id);
};

/** Delivers notifications synchronously. Used in tests and SSR. */
export const syncScheduler: Scheduler = (callback) => {
  callback();
  return () => undefined;
};

/** A tiny observable store. Framework-free; React binds to it with `useSyncExternalStore`. */
export function createStore<T>(initial: T, scheduler: Scheduler = frameScheduler): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();
  let cancelScheduled: (() => void) | null = null;

  const notify = () => {
    cancelScheduled = null;
    for (const listener of [...listeners]) listener();
  };

  return {
    getState: () => state,
    setState(next, options) {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(state) : next;
      if (Object.is(value, state)) return;
      state = value;
      if (options?.batch) {
        if (!cancelScheduled) cancelScheduled = scheduler(notify);
        return;
      }
      cancelScheduled?.();
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    flush() {
      if (cancelScheduled) {
        cancelScheduled();
        notify();
      }
    },
    listenerCount: () => listeners.size,
  };
}
