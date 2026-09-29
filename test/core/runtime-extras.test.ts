import { describe, expect, it, vi } from 'vitest';
import {
  ChatApiError,
  createChatRuntime,
  createMemoryStorage,
  createPersister,
  createRestAdapter,
  syncScheduler,
  type ChatRuntimeOptions,
  type RuntimeWarning,
  type StorageAdapter,
} from '../../src/core';
import { createFakeAdapter, normalTurn, summary, tick, until, type FakeAdapter } from '../fixtures';

function setup(overrides: Partial<ChatRuntimeOptions> = {}, adapter: FakeAdapter = createFakeAdapter()) {
  const runtime = createChatRuntime({
    adapter,
    scheduler: syncScheduler,
    persistence: { storage: 'memory' },
    refreshOnFocus: false,
    ...overrides,
  });
  return { runtime, adapter, thread: () => runtime.activeThread().store.getState() };
}

describe('runtime: conversation settings', () => {
  it('sets the model and default sources, rolling back on failure', async () => {
    const calls: unknown[] = [];
    let fail = false;
    const adapter = createFakeAdapter({
      updateConversation: async (id, patch) => {
        calls.push(patch);
        if (fail) throw new ChatApiError(500, 'x', null);
        return summary(id, 't');
      },
    });
    const { runtime, thread } = setup({}, adapter);
    await runtime.start();
    await runtime.setModel('claude-opus-5');
    expect(thread().meta.model).toBe('claude-opus-5');
    expect(runtime.preferences.getState().model).toBe('claude-opus-5');
    await runtime.setDefaultSources([{ id: 'web', enabled: true, meta: {} }]);
    expect(thread().meta.sources[0]!.id).toBe('web');
    fail = true;
    await expect(runtime.setModel('other')).rejects.toBeInstanceOf(ChatApiError);
    expect(thread().meta.model).toBe('claude-opus-5');
    await expect(runtime.setDefaultSources([])).rejects.toBeInstanceOf(ChatApiError);
    expect(thread().meta.sources[0]!.id).toBe('web');
    expect(calls).toContainEqual({ model: 'claude-opus-5' });
  });

  it('archives and rolls back an archive that fails', async () => {
    let fail = false;
    const adapter = createFakeAdapter({
      updateConversation: async (id) => {
        if (fail) throw new ChatApiError(500, 'x', null);
        return summary(id, 't');
      },
    });
    const { runtime } = setup({}, adapter);
    await runtime.start();
    await runtime.archiveConversation('h8k2mfa931', true);
    expect(runtime.conversations.getState().items[0]!.archived).toBe(true);
    fail = true;
    await expect(runtime.archiveConversation('h8k2mfa931', false)).rejects.toBeTruthy();
    expect(runtime.conversations.getState().items[0]!.archived).toBe(true);
  });

  it('restores a deleted conversation when the server refuses', async () => {
    const adapter = createFakeAdapter({
      deleteConversation: async () => {
        throw new ChatApiError(500, 'x', null);
      },
    });
    const { runtime } = setup({}, adapter);
    await runtime.start();
    await expect(runtime.deleteConversation('h8k2mfa931')).rejects.toBeTruthy();
    expect(runtime.conversations.getState().items.map((i) => i.id)).toContain('h8k2mfa931');
  });

  it('marks history as errored when the list fails and nothing is cached', async () => {
    const onError = vi.fn();
    const adapter = createFakeAdapter({
      listConversations: async () => {
        throw new ChatApiError(503, 'x', null);
      },
    });
    const { runtime } = setup({ onError }, adapter);
    await runtime.start();
    expect(runtime.conversations.getState().status).toBe('error');
    expect(onError).toHaveBeenCalled();
  });

  it('drops a conversation that 404s when opened', async () => {
    const adapter = createFakeAdapter({
      getConversation: async () => {
        throw new ChatApiError(404, 'gone', null);
      },
    });
    const { runtime } = setup({}, adapter);
    await runtime.start();
    await runtime.selectConversation('h8k2mfa931');
    expect(runtime.conversations.getState().items).toHaveLength(0);
    expect(runtime.activeThread().store.getState().loadStatus).toBe('error');
  });

  it('shows an error state when creating a chat fails', async () => {
    const adapter = createFakeAdapter({
      createConversation: async () => {
        throw new ChatApiError(500, 'x', null);
      },
    });
    const { runtime, thread } = setup({}, adapter);
    await runtime.start();
    expect(thread().loadStatus).toBe('error');
    expect(thread().loadError?.type).toBe('http_500');
  });

  it('reports a failed create during a lazy first send', async () => {
    const adapter = createFakeAdapter({
      createConversation: async () => {
        throw new ChatApiError(500, 'x', null);
      },
    });
    const { runtime, thread } = setup({ conversationCreation: 'lazy' }, adapter);
    await runtime.start();
    await runtime.send('hello');
    expect(thread().run.status).toBe('error');
  });
});

describe('runtime: scope and preferences', () => {
  it('loads scope groups asynchronously and replaces them later', async () => {
    const { runtime } = setup({
      scope: {
        groups: async () => [
          {
            id: 'g',
            label: 'G',
            items: [
              { id: 'a', label: 'A' },
              { id: 'b', label: 'B' },
            ],
          },
        ],
        defaultSelection: { g: ['a'] },
      },
    });
    expect(runtime.scope.getState().status).toBe('loading');
    await until(() => expect(runtime.scope.getState().status).toBe('ready'));
    expect(runtime.scope.getState().selection).toEqual({ g: ['a'] });
    runtime.setScopeGroups([{ id: 'h', label: 'H', items: [{ id: 'x', label: 'X' }] }]);
    expect(runtime.scope.getState().selection).toEqual({ h: ['x'] });
  });

  it('marks the scope errored when the catalog fails to load', async () => {
    const onError = vi.fn();
    const { runtime } = setup({
      onError,
      scope: {
        groups: async () => {
          throw new Error('catalog down');
        },
      },
    });
    await until(() => expect(runtime.scope.getState().status).toBe('error'));
    expect(onError).toHaveBeenCalled();
  });

  it('supports an empty default selection and a custom request mapping', async () => {
    const { runtime, adapter } = setup({
      scope: {
        groups: [{ id: 'g', label: 'G', items: [{ id: 'a', label: 'A' }] }],
        defaultSelection: 'none',
        toRequest: (sel) => ({ sources: (sel.g ?? []).map((id) => ({ id, enabled: true, meta: {} })) }),
      },
    });
    await runtime.start();
    expect(runtime.scope.getState().selection).toEqual({});
    runtime.setScopeSelection({ g: ['a', 'ghost'] });
    expect(runtime.scope.getState().selection).toEqual({ g: ['a'] });
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    expect(adapter.bodies[0]!.sources).toEqual([{ id: 'a', enabled: true, meta: {} }]);
    adapter.lastStream().end();
    await p;
  });

  it('stores preferences and ignores no-op writes', () => {
    const { runtime } = setup();
    const listener = vi.fn();
    runtime.preferences.subscribe(listener);
    runtime.setPreference('historyOpen', false);
    runtime.setPreference('historyOpen', false);
    expect(runtime.preferences.getState()).toEqual({ historyOpen: false });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('runtime: events, lifecycle and limits', () => {
  it('emits events and active changes, and calls onEvent', async () => {
    const onEvent = vi.fn();
    const { runtime, adapter } = setup({ onEvent });
    const changes: (string | null)[] = [];
    runtime.on('activeChange', (id) => changes.push(id));
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(...normalTurn);
    adapter.lastStream().end();
    await p;
    expect(changes).toContain('conv_1');
    expect(onEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'message_stop' }), { conversationId: 'conv_1' });
  });

  it('dispose() stops a running stream quietly', async () => {
    const onError = vi.fn();
    const { runtime, adapter } = setup({ onError });
    await runtime.start();
    const p = runtime.send('hi');
    await until(() => expect(adapter.streams).toHaveLength(1));
    runtime.dispose();
    await p;
    expect(onError).not.toHaveBeenCalled();
    runtime.dispose();
  });

  it('evicts idle conversations beyond maxThreads but keeps the active one', async () => {
    const { runtime } = setup({ maxThreads: 3 });
    await runtime.start();
    const first = runtime.getThread('a');
    first.store.setState((s) => ({ ...s, messages: [] }));
    runtime.getThread('b');
    runtime.getThread('c');
    runtime.getThread('d');
    expect(runtime.getThread('a')).not.toBe(first);
  });

  it('warns when resuming an unknown checkpoint', async () => {
    const warnings: RuntimeWarning[] = [];
    const { runtime } = setup({ onWarning: (w) => warnings.push(w) });
    await runtime.start();
    await runtime.resume('nope', 'approve');
    expect(warnings.map((w) => w.code)).toContain('unknown_checkpoint');
  });

  it('rejects attachments when uploads are not configured, and caps the count', async () => {
    const { runtime } = setup();
    expect(runtime.addAttachments([new File(['x'], 'a.txt')]).rejected).toHaveLength(1);
    const withUploads = setup({
      attachments: { upload: async (f) => ({ url: 'u', filename: f.name, content_type: '', size: 1, meta: {} }), maxFiles: 1 },
    });
    const res = withUploads.runtime.addAttachments([new File(['x'], 'a.txt'), new File(['y'], 'b.txt')]);
    expect(res.added).toHaveLength(1);
    expect(res.rejected[0]!.reason).toMatch(/up to 1/);
  });

  it('marks a failed upload with its error', async () => {
    const { runtime } = setup({
      attachments: {
        upload: async () => {
          throw new Error('storage full');
        },
      },
    });
    runtime.addAttachments([new File(['x'], 'a.pdf', { type: 'application/pdf' })]);
    await until(() => expect(runtime.activeThread().composer.getState().attachments[0]!.status).toBe('error'));
    expect(runtime.activeThread().composer.getState().attachments[0]!.error).toBe('storage full');
  });

  it('refreshes history on window focus, throttled', async () => {
    const list = vi.fn(async () => [summary('h8k2mfa931', 'x')]);
    let now = 1_000_000;
    const { runtime } = setup({ refreshOnFocus: true, now: () => now }, createFakeAdapter({ listConversations: list }));
    await runtime.start();
    const before = list.mock.calls.length;
    window.dispatchEvent(new Event('focus'));
    expect(list.mock.calls.length).toBe(before);
    now += 31_000;
    window.dispatchEvent(new Event('focus'));
    await tick();
    expect(list.mock.calls.length).toBe(before + 1);
    runtime.dispose();
  });
});

describe('runtime: persistence edge cases', () => {
  it('hydrates from an async storage adapter', async () => {
    const map = new Map<string, string>();
    const storage: StorageAdapter = {
      getItem: async (k) => map.get(k) ?? null,
      setItem: async (k, v) => void map.set(k, v),
      removeItem: async (k) => void map.delete(k),
    };
    const writer = createPersister({ storage });
    writer.write('active', 'h8k2mfa931');
    writer.write('drafts', { h8k2mfa931: { text: 'draft' } });
    await writer.flush();
    const { runtime } = setup({ persistence: { storage } });
    expect(runtime.session.getState().hydrated).toBe(false);
    await runtime.start();
    expect(runtime.session.getState()).toMatchObject({ hydrated: true, activeId: 'h8k2mfa931' });
    expect(runtime.activeThread().composer.getState().text).toBe('draft');
  });

  it('picks up history changes made in another tab', async () => {
    const opts = { persistence: { storage: 'local' as const, persist: { history: true } } };
    const { runtime } = setup(opts);
    await runtime.start();
    await runtime.persistence.flush(); // this tab's own pending write would otherwise win
    const other = createPersister({ storage: 'local', persist: { history: true } });
    const items = [
      {
        id: 'z',
        title: 'From another tab',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-30T00:00:00Z',
        archived: false,
      },
    ];
    other.write('conversations', items);
    await other.flush();
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'neoflo-chat:default:conversations', storageArea: window.localStorage }),
    );
    expect(runtime.conversations.getState().items.map((i) => i.id)).toEqual(['z']);
    runtime.dispose();
  });

  it('caps the cached histories (LRU)', async () => {
    const storage = createMemoryStorage();
    const { runtime, adapter } = setup({
      persistence: { storage, debounceMs: 1, maxCachedConversations: 1, persist: { history: true } },
    });
    await runtime.start();
    await runtime.selectConversation('h8k2mfa931');
    await runtime.newConversation();
    const p = runtime.send('hello');
    await until(() => expect(adapter.streams).toHaveLength(1));
    adapter.lastStream().push(...normalTurn);
    adapter.lastStream().end();
    await p;
    await runtime.persistence.flush();
    const threadKeys = storage.keys().filter((k) => k.includes(':thread:'));
    expect(threadKeys).toHaveLength(1);
  });
});

describe('rest adapter: failure modes', () => {
  it('times out a hanging REST call', async () => {
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      retry: false,
      timeoutMs: 20,
      fetch: (_u, init) =>
        new Promise((_r, reject) =>
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason ?? new DOMException('x', 'AbortError'))),
        ),
    });
    await expect(adapter.listConversations()).rejects.toMatchObject({ code: 'timeout' });
  });

  it('surfaces a 401 when the refresh is declined', async () => {
    const adapter = createRestAdapter({
      baseUrl: 'https://api.test',
      fetch: async () => new Response('{}', { status: 401 }),
      onUnauthorized: async () => false,
    });
    await expect(adapter.listConversations()).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a non-JSON body and a stream without a body', async () => {
    const bad = createRestAdapter({ baseUrl: 'https://api.test', fetch: async () => new Response('<html>', { status: 200 }) });
    await expect(bad.getConversation('c')).rejects.toBeInstanceOf(Error);
    const empty = createRestAdapter({
      baseUrl: 'https://api.test',
      fetch: async () => new Response(null, { status: 200, headers: { 'content-type': 'text/event-stream' } }),
    });
    const it = empty.sendMessage(
      'c',
      { message: { role: 'user', type: 'default', content: { default: 'q' } } },
      { signal: new AbortController().signal },
    );
    await expect(it[Symbol.asyncIterator]().next()).rejects.toThrow(/no body/);
  });

  it('honors an HTTP-date Retry-After on a retried call', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('{}', { status: 503, headers: { 'retry-after': new Date(Date.now() + 10).toUTCString() } }),
      )
      .mockResolvedValueOnce(new Response('{"conversations":[]}', { status: 200 }));
    const adapter = createRestAdapter({ baseUrl: 'https://api.test', fetch, retry: { maxDelayMs: 20 } });
    await expect(adapter.listConversations()).resolves.toEqual([]);
  });
});
