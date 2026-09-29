export type MaybePromise<T> = T | Promise<T>;

/**
 * Where persisted chat state lives. Sync (`localStorage`) and async (IndexedDB, localforage,
 * an encrypted store) implementations are both fine.
 */
export interface StorageAdapter {
  getItem(key: string): MaybePromise<string | null>;
  setItem(key: string, value: string): MaybePromise<void>;
  removeItem(key: string): MaybePromise<void>;
  /** Lists stored keys. Optional, but it lets `clear()` find every key this library wrote. */
  keys?(): MaybePromise<string[]>;
}

export type StorageKind = 'session' | 'local' | 'memory' | 'none';

export function isPromise<T>(v: MaybePromise<T>): v is Promise<T> {
  return typeof (v as Promise<T> | null)?.then === 'function';
}

export interface MemoryStorage extends StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

export function createMemoryStorage(): MemoryStorage {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    keys: () => [...map.keys()],
  };
}

/** Wraps `localStorage` / `sessionStorage`. Returns `null` when unavailable (SSR, blocked, private mode). */
export function createWebStorage(kind: 'local' | 'session'): (StorageAdapter & { keys(): string[]; raw: Storage }) | null {
  let storage: Storage | undefined;
  try {
    if (typeof window === 'undefined') return null;
    storage = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = '__neoflo_chat_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
  } catch {
    return null;
  }
  const s = storage;
  return {
    raw: s,
    getItem: (k) => s.getItem(k),
    setItem: (k, v) => s.setItem(k, v),
    removeItem: (k) => s.removeItem(k),
    keys: () => {
      const out: string[] = [];
      for (let i = 0; i < s.length; i++) {
        const key = s.key(i);
        if (key !== null) out.push(key);
      }
      return out;
    },
  };
}

/**
 * Guards a storage against quota and permission errors. A failed write lands in an in-memory
 * shadow instead, so the session keeps working; `onError` is told once.
 */
export function createSafeStorage(inner: StorageAdapter, onError: (error: unknown) => void): StorageAdapter {
  const shadow = createMemoryStorage();
  let reported = false;
  const report = (error: unknown) => {
    if (reported) return;
    reported = true;
    onError(error);
  };
  const guard = <T>(fn: () => MaybePromise<T>, fallback: () => T): MaybePromise<T> => {
    try {
      const out = fn();
      return isPromise(out)
        ? out.catch((error) => {
            report(error);
            return fallback();
          })
        : out;
    } catch (error) {
      report(error);
      return fallback();
    }
  };
  return {
    getItem: (k) => {
      const shadowed = shadow.getItem(k);
      if (shadowed !== null) return shadowed;
      return guard(
        () => inner.getItem(k),
        () => null,
      );
    },
    setItem: (k, v) =>
      guard(
        () => {
          const out = inner.setItem(k, v);
          shadow.removeItem(k);
          return out;
        },
        () => shadow.setItem(k, v),
      ),
    removeItem: (k) => {
      shadow.removeItem(k);
      return guard(
        () => inner.removeItem(k),
        () => undefined,
      );
    },
    keys: (): MaybePromise<string[]> => {
      const own = shadow.keys();
      const listInner = inner.keys?.bind(inner);
      if (!listInner) return own;
      const merge = (k: string[]) => [...new Set([...k, ...own])];
      try {
        const out = listInner();
        return isPromise(out)
          ? out.then(merge, (error: unknown) => {
              report(error);
              return own;
            })
          : merge(out);
      } catch (error) {
        report(error);
        return own;
      }
    },
  };
}
