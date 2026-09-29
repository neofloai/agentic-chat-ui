export function uid(prefix = ''): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  const id =
    typeof c?.randomUUID === 'function'
      ? c.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return prefix + id;
}

/** Runs one in-flight promise per key; later callers share it. */
export class Inflight {
  private map = new Map<string, Promise<unknown>>();

  run<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.map.get(key);
    if (existing) return existing as Promise<T>;
    const p = fn().finally(() => {
      if (this.map.get(key) === p) this.map.delete(key);
    });
    this.map.set(key, p);
    return p;
  }
}

export type Unsubscribe = () => void;

type AnyListener = (...args: unknown[]) => void;

export class Emitter<Events extends Record<string, unknown[]>> {
  private listeners = new Map<keyof Events, Set<AnyListener>>();

  on<K extends keyof Events>(type: K, listener: (...args: Events[K]) => void): Unsubscribe {
    let set = this.listeners.get(type);
    if (!set) this.listeners.set(type, (set = new Set()));
    const l = listener as unknown as AnyListener;
    set.add(l);
    return () => {
      set.delete(l);
    };
  }

  emit<K extends keyof Events>(type: K, ...args: Events[K]): void {
    const set = this.listeners.get(type);
    if (!set) return;
    for (const listener of [...set]) {
      try {
        listener(...args);
      } catch (error) {
        // A throwing listener must never break the chat.
        console.error('[agentic-chat] listener error', error);
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
