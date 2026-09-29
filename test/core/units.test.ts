import { describe, expect, it, vi } from 'vitest';
import {
  ChatApiError,
  ChatError,
  ChatProtocolError,
  ChatStreamError,
  ChatTimeoutError,
  createMemoryStorage,
  createSafeStorage,
  createStore,
  createWebStorage,
  frameScheduler,
  isAbortError,
  parseStreamEvent,
  toErrorInfo,
  type StorageAdapter,
} from '../../src/core';
import { isDev } from '../../src/core/runtime/env';
import { messageFromBody } from '../../src/core/transport/errors';
import { Emitter, Inflight, uid } from '../../src/core/runtime/utils';

describe('toErrorInfo', () => {
  it('maps HTTP statuses to friendly, retry-aware errors', () => {
    expect(toErrorInfo(new ChatApiError(401, 'x', null))).toMatchObject({
      type: 'http_401',
      retryable: false,
      message: expect.stringMatching(/session/),
    });
    expect(toErrorInfo(new ChatApiError(403, 'x', null)).message).toMatch(/access/);
    expect(toErrorInfo(new ChatApiError(404, 'x', null)).message).toMatch(/no longer exists/);
    expect(toErrorInfo(new ChatApiError(429, 'x', null, 7))).toMatchObject({ retryable: true, retryAfter: 7 });
    expect(toErrorInfo(new ChatApiError(502, 'x', null))).toMatchObject({
      retryable: true,
      message: expect.stringMatching(/trouble/),
    });
    expect(toErrorInfo(new ChatApiError(422, 'title too long', null))).toMatchObject({
      retryable: false,
      message: 'title too long',
    });
  });

  it('maps stream, transport, abort and unknown errors', () => {
    expect(toErrorInfo(new ChatStreamError('rate_limited', 'slow', 3))).toEqual({
      type: 'rate_limited',
      message: 'slow',
      retryAfter: 3,
      retryable: true,
    });
    expect(toErrorInfo(new ChatError('network', 'down'))).toMatchObject({ type: 'network', retryable: true });
    expect(toErrorInfo(new ChatTimeoutError())).toMatchObject({ type: 'timeout', retryable: true });
    expect(toErrorInfo(new ChatProtocolError('bad'))).toMatchObject({ type: 'protocol_error', retryable: true });
    expect(toErrorInfo(new ChatError('weird', 'x')).retryable).toBe(false);
    expect(toErrorInfo(new DOMException('x', 'AbortError')).type).toBe('aborted');
    expect(toErrorInfo(new TypeError('Failed to fetch')).type).toBe('network');
    expect(toErrorInfo(new Error('boom'))).toMatchObject({ type: 'unknown', message: 'boom' });
    expect(toErrorInfo('nope')).toMatchObject({ type: 'unknown', message: 'Something went wrong.' });
  });

  it('reads server messages from any common body shape', () => {
    expect(messageFromBody('plain text', 'f')).toBe('plain text');
    expect(messageFromBody({ message: 'm' }, 'f')).toBe('m');
    expect(messageFromBody({ detail: 'd' }, 'f')).toBe('d');
    expect(messageFromBody({ error: { message: 'nested' } }, 'f')).toBe('nested');
    expect(messageFromBody({ other: 1 }, 'fallback')).toBe('fallback');
    expect(messageFromBody(undefined, 'fallback')).toBe('fallback');
    expect(isAbortError({ name: 'TimeoutError' })).toBe(true);
    expect(isAbortError(null)).toBe(false);
  });
});

describe('utils', () => {
  it('Inflight shares one promise per key and forgets it after', async () => {
    const inflight = new Inflight();
    let calls = 0;
    const fn = () => new Promise<number>((r) => setTimeout(() => r(++calls), 5));
    const [a, b] = await Promise.all([inflight.run('k', fn), inflight.run('k', fn)]);
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(await inflight.run('k', fn)).toBe(2);
  });

  it('Emitter isolates throwing listeners and unsubscribes', () => {
    const e = new Emitter<{ ping: [number] }>();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const seen: number[] = [];
    e.on('ping', () => {
      throw new Error('bad listener');
    });
    const off = e.on('ping', (n) => seen.push(n));
    e.emit('ping', 1);
    off();
    e.emit('ping', 2);
    e.clear();
    e.emit('ping', 3);
    expect(seen).toEqual([1]);
    expect(spy).toHaveBeenCalled();
  });

  it('uid is unique and prefixed', () => {
    const ids = new Set(Array.from({ length: 50 }, () => uid('x_')));
    expect(ids.size).toBe(50);
    expect([...ids][0]!.startsWith('x_')).toBe(true);
  });

  it('isDev follows NODE_ENV', () => {
    expect(isDev()).toBe(true);
  });
});

describe('store', () => {
  it('batches notifications, flushes on demand, and skips identical states', () => {
    let scheduled: (() => void) | null = null;
    const store = createStore({ n: 0 }, (cb) => {
      scheduled = cb;
      return () => (scheduled = null);
    });
    const listener = vi.fn();
    const off = store.subscribe(listener);
    expect(store.listenerCount()).toBe(1);
    store.setState((s) => ({ n: s.n + 1 }), { batch: true });
    store.setState((s) => ({ n: s.n + 1 }), { batch: true });
    expect(store.getState().n).toBe(2);
    expect(listener).not.toHaveBeenCalled();
    store.flush();
    expect(listener).toHaveBeenCalledTimes(1);
    const same = store.getState();
    store.setState(same);
    expect(listener).toHaveBeenCalledTimes(1);
    store.setState({ n: 9 }, { batch: true });
    (scheduled as (() => void) | null)?.();
    expect(listener).toHaveBeenCalledTimes(2);
    off();
    expect(store.listenerCount()).toBe(0);
  });

  it('frameScheduler falls back to a timer and can be cancelled', async () => {
    const cb = vi.fn();
    const cancel = frameScheduler(cb);
    cancel();
    const cb2 = vi.fn();
    frameScheduler(cb2);
    await new Promise((r) => setTimeout(r, 40));
    expect(cb).not.toHaveBeenCalled();
    expect(cb2).toHaveBeenCalled();
  });
});

describe('parseStreamEvent edge cases', () => {
  it('fills defaults for optional fields', () => {
    expect(parseStreamEvent({ type: 'status' })).toEqual({ ok: true, event: { type: 'status', label: '' } });
    expect(parseStreamEvent({ type: 'message_delta' })).toEqual({ ok: true, event: { type: 'message_delta', usage: undefined } });
    expect(parseStreamEvent({ type: 'error' })).toMatchObject({
      ok: true,
      event: { error_type: 'unknown_error', message: 'Something went wrong.', retry_after: null },
    });
    expect(parseStreamEvent({ type: 'content_block_delta', index: 0 })).toMatchObject({
      ok: true,
      event: { delta: { type: 'text_delta' } },
    });
    expect(parseStreamEvent({ type: 'message_start', message_id: 'm' })).toMatchObject({
      ok: true,
      event: { conversation_id: '', run_id: '' },
    });
  });

  it('rejects missing required fields', () => {
    expect(parseStreamEvent({ type: 'message_start' })).toMatchObject({ ok: false, reason: 'invalid' });
    expect(parseStreamEvent({ type: 'content_block_delta', index: 'x' })).toMatchObject({ ok: false });
    expect(parseStreamEvent({ type: 'checkpoint', checkpoint_id: 'c', block_index: -2 })).toMatchObject({ ok: false });
    expect(parseStreamEvent({ type: 'content_block_stop', index: 0, block: { id: 'b' } })).toMatchObject({ ok: false });
    expect(parseStreamEvent(null, 'status')).toMatchObject({ ok: false, type: 'status' });
  });
});

describe('storage', () => {
  it('wraps web storage and lists keys', () => {
    const local = createWebStorage('local')!;
    local.setItem('a', '1');
    expect(local.getItem('a')).toBe('1');
    expect(local.keys()).toContain('a');
    local.removeItem('a');
    expect(createWebStorage('session')).not.toBeNull();
  });

  it('safe storage shadows failures for sync and async adapters', async () => {
    const onError = vi.fn();
    const broken: StorageAdapter = {
      getItem: () => {
        throw new Error('read');
      },
      setItem: async () => {
        throw new Error('write');
      },
      removeItem: () => {
        throw new Error('remove');
      },
      keys: async () => {
        throw new Error('keys');
      },
    };
    const safe = createSafeStorage(broken, onError);
    expect(safe.getItem('x')).toBeNull();
    await safe.setItem('x', 'v');
    expect(safe.getItem('x')).toBe('v');
    safe.removeItem('x');
    expect(await safe.keys!()).toEqual([]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('merges shadow keys with the inner keys', async () => {
    const inner = createMemoryStorage();
    inner.setItem('inner', '1');
    const safe = createSafeStorage(inner, () => undefined);
    expect(await safe.keys!()).toEqual(['inner']);
  });
});
