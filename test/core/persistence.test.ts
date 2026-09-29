import { describe, expect, it, vi } from 'vitest';
import { createMemoryStorage, createPersister, type StorageAdapter } from '../../src/core';

describe('createPersister', () => {
  it('round-trips through session storage by default, namespaced and scoped', async () => {
    const p = createPersister({ scope: 'user-1', debounceMs: 1 });
    p.write('prefs', { a: 1 });
    await p.flush();
    expect(p.config.kind).toBe('session');
    expect(window.sessionStorage.getItem('neoflo-chat:user-1:prefs')).toContain('"a":1');
    expect(p.read('prefs')).toEqual({ a: 1 });
  });

  it('keeps two scopes apart', async () => {
    const a = createPersister({ storage: 'local', scope: 'alice' });
    const b = createPersister({ storage: 'local', scope: 'bob' });
    a.write('drafts', { x: 'secret' });
    await a.flush();
    expect(b.read('drafts')).toBeUndefined();
  });

  it('is a no-op when disabled', async () => {
    const p = createPersister(false);
    p.write('prefs', 1);
    await p.flush();
    expect(p.enabled).toBe(false);
    expect(p.read('prefs')).toBeUndefined();
  });

  it('discards corrupt, foreign, future-version and expired entries', async () => {
    const storage = createMemoryStorage();
    let now = 1_000;
    const p = createPersister({ storage, ttl: 100 }, undefined, () => now);
    storage.setItem('neoflo-chat:default:bad', '{nope');
    storage.setItem('neoflo-chat:default:shape', '"just a string"');
    storage.setItem('neoflo-chat:default:future', JSON.stringify({ v: 99, savedAt: now, data: 1 }));
    expect(p.read('bad')).toBeUndefined();
    expect(p.read('shape')).toBeUndefined();
    expect(p.read('future')).toBeUndefined();
    expect(storage.getItem('neoflo-chat:default:bad')).toBeNull(); // cleaned up

    p.write('fresh', 1);
    await p.flush();
    expect(p.read('fresh')).toBe(1);
    now += 500;
    expect(p.read('fresh')).toBeUndefined();
  });

  it('falls back to memory and reports once when writes throw (quota)', async () => {
    const onError = vi.fn();
    const storage: StorageAdapter = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      removeItem: () => undefined,
    };
    const p = createPersister({ storage }, onError);
    p.write('a', 1);
    p.write('b', 2);
    await p.flush();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(p.read('a')).toBe(1);
  });

  it('works with async storage adapters', async () => {
    const map = new Map<string, string>();
    const storage: StorageAdapter = {
      getItem: async (k) => map.get(k) ?? null,
      setItem: async (k, v) => void map.set(k, v),
      removeItem: async (k) => void map.delete(k),
    };
    const p = createPersister({ storage });
    p.write('x', { deep: [1, 2] });
    await p.flush();
    await expect(p.read('x')).resolves.toEqual({ deep: [1, 2] });
  });

  it('clear() removes every key it owns, including cached threads', async () => {
    const storage = createMemoryStorage();
    const p = createPersister({ storage, scope: 's' });
    p.write('prefs', 1);
    p.write('thread:c1', { messages: [] });
    p.write('thread-index', [{ id: 'c1', savedAt: 1 }]);
    await p.flush();
    storage.setItem('other-app:key', 'keep');
    await p.clear();
    expect(storage.keys()).toEqual(['other-app:key']);
  });

  it('debounces writes and returns pending values before they flush', () => {
    const storage = createMemoryStorage();
    const set = vi.spyOn(storage, 'setItem');
    const p = createPersister({ storage, debounceMs: 10_000 });
    p.write('k', 1);
    p.write('k', 2);
    expect(p.read('k')).toBe(2);
    expect(set).not.toHaveBeenCalled();
  });
});
